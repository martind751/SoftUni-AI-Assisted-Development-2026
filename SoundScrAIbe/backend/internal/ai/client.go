package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
)

const (
	groqURL     = "https://api.groq.com/openai/v1/chat/completions"
	groqModel   = "llama-3.3-70b-versatile"
	maxTokens   = 4096
	temperature = 0.9
)

// ---------------------------------------------------------------------------
// Request types (OpenAI-compatible)
// ---------------------------------------------------------------------------

type message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type responseFormat struct {
	Type string `json:"type"`
}

type request struct {
	Model          string          `json:"model"`
	Messages       []message       `json:"messages"`
	Temperature    float64         `json:"temperature"`
	MaxTokens      int             `json:"max_tokens"`
	ResponseFormat *responseFormat `json:"response_format,omitempty"`
}

// ---------------------------------------------------------------------------
// Response types (OpenAI-compatible)
// ---------------------------------------------------------------------------

type choiceMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type choice struct {
	Message choiceMessage `json:"message"`
}

type response struct {
	Choices []choice `json:"choices"`
}

type apiErrorBody struct {
	Error *struct {
		Message string `json:"message"`
		Type    string `json:"type"`
		Code    string `json:"code"`
	} `json:"error,omitempty"`
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

// Complete sends a blocking request to the Groq API and returns the text response.
// It takes context, API key, system prompt, and user message.
func Complete(ctx context.Context, apiKey, system, userMessage string) (string, error) {
	msgs := buildMessages(system, userMessage)
	return complete(ctx, apiKey, msgs, false)
}

// CompleteJSON is like Complete but requests JSON output via response_format
// and validates the response. If not valid JSON, it retries once with a
// correction prompt.
func CompleteJSON(ctx context.Context, apiKey, system, userMessage string) (string, error) {
	msgs := buildMessages(system, userMessage)

	text, err := complete(ctx, apiKey, msgs, true)
	if err != nil {
		return "", err
	}

	if json.Valid([]byte(text)) {
		return text, nil
	}

	// Retry with correction: append the bad response and a correction message.
	retryMsgs := append(msgs,
		message{Role: "assistant", Content: text},
		message{Role: "user", Content: "Your previous response was not valid JSON. Please respond with ONLY a valid JSON object."},
	)

	text, err = complete(ctx, apiKey, retryMsgs, true)
	if err != nil {
		return "", fmt.Errorf("groq JSON retry: %w", err)
	}

	if !json.Valid([]byte(text)) {
		return "", fmt.Errorf("groq response is not valid JSON after retry")
	}

	return text, nil
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

// buildMessages constructs the message list with an optional system message.
func buildMessages(system, userMessage string) []message {
	var msgs []message
	if system != "" {
		msgs = append(msgs, message{Role: "system", Content: system})
	}
	msgs = append(msgs, message{Role: "user", Content: userMessage})
	return msgs
}

// complete sends a request to the Groq API and returns the text content.
func complete(ctx context.Context, apiKey string, msgs []message, jsonMode bool) (string, error) {
	reqBody := request{
		Model:       groqModel,
		Messages:    msgs,
		Temperature: temperature,
		MaxTokens:   maxTokens,
	}

	if jsonMode {
		reqBody.ResponseFormat = &responseFormat{Type: "json_object"}
	}

	payload, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("marshalling groq request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, groqURL, bytes.NewReader(payload))
	if err != nil {
		return "", fmt.Errorf("creating groq request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("sending groq request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("reading groq response: %w", err)
	}

	// Retry once on 429 rate limit.
	if resp.StatusCode == http.StatusTooManyRequests {
		delay := parseRetryAfter(resp.Header.Get("Retry-After"))
		if delay > 0 && delay <= 60*time.Second {
			log.Printf("groq rate limited, retrying in %s...", delay)
			time.Sleep(delay)
		} else {
			log.Printf("groq rate limited, retrying in 5s...")
			time.Sleep(5 * time.Second)
		}

		// Rebuild the request (body reader is consumed).
		retryReq, err := http.NewRequestWithContext(ctx, http.MethodPost, groqURL, bytes.NewReader(payload))
		if err != nil {
			return "", fmt.Errorf("creating groq retry request: %w", err)
		}
		retryReq.Header.Set("Content-Type", "application/json")
		retryReq.Header.Set("Authorization", "Bearer "+apiKey)

		resp2, err := client.Do(retryReq)
		if err != nil {
			return "", fmt.Errorf("sending groq retry request: %w", err)
		}
		defer resp2.Body.Close()

		body, err = io.ReadAll(resp2.Body)
		if err != nil {
			return "", fmt.Errorf("reading groq retry response: %w", err)
		}

		if resp2.StatusCode != http.StatusOK {
			return "", fmt.Errorf("groq API error (status %d): %s", resp2.StatusCode, string(body))
		}
	} else if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("groq API error (status %d): %s", resp.StatusCode, string(body))
	}

	var result response
	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("parsing groq response: %w", err)
	}

	if len(result.Choices) == 0 {
		return "", fmt.Errorf("groq response contained no choices")
	}

	return result.Choices[0].Message.Content, nil
}

// parseRetryAfter parses the Retry-After header value.
// Supports integer seconds (e.g. "5") or decimal seconds (e.g. "2.5").
// Returns zero if the header is empty or unparseable.
func parseRetryAfter(header string) time.Duration {
	header = strings.TrimSpace(header)
	if header == "" {
		return 0
	}
	seconds, err := strconv.ParseFloat(header, 64)
	if err != nil {
		return 0
	}
	return time.Duration(seconds * float64(time.Second))
}
