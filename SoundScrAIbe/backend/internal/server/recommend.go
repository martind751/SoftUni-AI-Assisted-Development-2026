package server

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"soundscraibe/internal/ai"
	"soundscraibe/internal/recommend"
	"soundscraibe/internal/user"

	"github.com/gin-gonic/gin"
)

// ---------------------------------------------------------------------------
// SmartRecommend handles POST /api/recommendations/smart
// Auto-generates recommendations based on taste profile analysis.
// ---------------------------------------------------------------------------

func (h *handlers) SmartRecommend(c *gin.Context) {
	u := c.MustGet("user").(*user.User)
	ctx := c.Request.Context()

	// Check if Groq API key is configured.
	if h.cfg.GroqAPIKey == "" {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "AI recommendations are not configured"})
		return
	}

	// Check rate limit (60s).
	remaining, err := recommend.CheckRateLimit(ctx, h.db, u.ID)
	if err != nil {
		log.Printf("rate limit check failed for user %d: %v", u.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check rate limit"})
		return
	}
	if remaining > 0 {
		c.JSON(http.StatusTooManyRequests, gin.H{
			"error":       fmt.Sprintf("please wait %d seconds between recommendations", remaining),
			"retry_after": remaining,
		})
		return
	}

	// Gather taste profile.
	profile, err := recommend.GatherTasteProfile(ctx, h.db, u.AccessToken, u.ID)
	if err != nil {
		log.Printf("gather taste profile failed for user %d: %v", u.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to gather taste profile"})
		return
	}

	// Build prompts and call Groq.
	systemPrompt := ai.BuildSystemPrompt()
	userMessage := ai.FormatTasteProfile(profile, "")

	rawJSON, err := ai.CompleteJSON(ctx, h.cfg.GroqAPIKey, systemPrompt, userMessage)
	if err != nil {
		log.Printf("ai API call failed for user %d: %v", u.ID, err)
		if isAIRateLimitError(err) {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "AI service is temporarily busy. Please try again in a minute."})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "AI recommendation failed"})
		return
	}

	log.Printf("ai raw response for user %d: %s", u.ID, rawJSON)

	// Parse AI response.
	var aiResp ai.AIResponse
	if err := json.Unmarshal([]byte(rawJSON), &aiResp); err != nil {
		log.Printf("failed to parse ai response for user %d: %v", u.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse AI response"})
		return
	}

	// Resolve recommendations to Spotify IDs.
	resolved := recommend.ResolveAll(ctx, u.AccessToken, aiResp.Recommendations)

	// Save to database.
	_, err = recommend.SaveRecommendation(ctx, h.db, u.ID, "smart", "", aiResp.TasteSummary, resolved)
	if err != nil {
		log.Printf("failed to save recommendation for user %d: %v", u.ID, err)
		// Non-fatal: still return the recommendations to the user.
	}

	c.JSON(http.StatusOK, recommend.Response{
		TasteSummary:    aiResp.TasteSummary,
		Recommendations: resolved,
		Mode:            "smart",
	})
}

// ---------------------------------------------------------------------------
// PromptRecommend handles POST /api/recommendations/prompt
// User provides a natural language query for tailored recommendations.
// ---------------------------------------------------------------------------

type promptRequest struct {
	Prompt string `json:"prompt" binding:"required"`
}

func (h *handlers) PromptRecommend(c *gin.Context) {
	u := c.MustGet("user").(*user.User)
	ctx := c.Request.Context()

	// Bind and validate request body.
	var body promptRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "prompt is required"})
		return
	}
	if body.Prompt == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "prompt cannot be empty"})
		return
	}

	// Check if Groq API key is configured.
	if h.cfg.GroqAPIKey == "" {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "AI recommendations are not configured"})
		return
	}

	// Check rate limit (60s).
	remaining, err := recommend.CheckRateLimit(ctx, h.db, u.ID)
	if err != nil {
		log.Printf("rate limit check failed for user %d: %v", u.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check rate limit"})
		return
	}
	if remaining > 0 {
		c.JSON(http.StatusTooManyRequests, gin.H{
			"error":       fmt.Sprintf("please wait %d seconds between recommendations", remaining),
			"retry_after": remaining,
		})
		return
	}

	// Gather taste profile.
	profile, err := recommend.GatherTasteProfile(ctx, h.db, u.AccessToken, u.ID)
	if err != nil {
		log.Printf("gather taste profile failed for user %d: %v", u.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to gather taste profile"})
		return
	}

	// Build prompts and call Groq with the user's prompt.
	systemPrompt := ai.BuildSystemPrompt()
	userMessage := ai.FormatTasteProfile(profile, body.Prompt)

	rawJSON, err := ai.CompleteJSON(ctx, h.cfg.GroqAPIKey, systemPrompt, userMessage)
	if err != nil {
		log.Printf("ai API call failed for user %d: %v", u.ID, err)
		if isAIRateLimitError(err) {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "AI service is temporarily busy. Please try again in a minute."})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "AI recommendation failed"})
		return
	}

	log.Printf("ai raw response for user %d: %s", u.ID, rawJSON)

	// Parse AI response.
	var aiResp ai.AIResponse
	if err := json.Unmarshal([]byte(rawJSON), &aiResp); err != nil {
		log.Printf("failed to parse ai response for user %d: %v", u.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse AI response"})
		return
	}

	// Resolve recommendations to Spotify IDs.
	resolved := recommend.ResolveAll(ctx, u.AccessToken, aiResp.Recommendations)

	// Save to database.
	_, err = recommend.SaveRecommendation(ctx, h.db, u.ID, "prompt", body.Prompt, aiResp.TasteSummary, resolved)
	if err != nil {
		log.Printf("failed to save recommendation for user %d: %v", u.ID, err)
		// Non-fatal: still return the recommendations to the user.
	}

	c.JSON(http.StatusOK, recommend.Response{
		TasteSummary:    aiResp.TasteSummary,
		Recommendations: resolved,
		Mode:            "prompt",
		UserPrompt:      body.Prompt,
	})
}

// ---------------------------------------------------------------------------
// RecommendationHistory handles GET /api/recommendations/history
// Returns the user's recommendation history.
// ---------------------------------------------------------------------------

func (h *handlers) RecommendationHistory(c *gin.Context) {
	u := c.MustGet("user").(*user.User)
	ctx := c.Request.Context()

	items, err := recommend.GetHistory(ctx, h.db, u.ID)
	if err != nil {
		log.Printf("failed to get recommendation history for user %d: %v", u.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load recommendation history"})
		return
	}

	c.JSON(http.StatusOK, items)
}

// ---------------------------------------------------------------------------
// RecommendationDetail handles GET /api/recommendations/history/:id
// Returns a single recommendation session by ID.
// ---------------------------------------------------------------------------

func (h *handlers) RecommendationDetail(c *gin.Context) {
	u := c.MustGet("user").(*user.User)
	ctx := c.Request.Context()

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid recommendation id"})
		return
	}

	item, err := recommend.GetHistoryItem(ctx, h.db, u.ID, id)
	if err != nil {
		log.Printf("failed to get recommendation %d for user %d: %v", id, u.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load recommendation"})
		return
	}
	if item == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "recommendation not found"})
		return
	}

	c.JSON(http.StatusOK, item)
}

// isAIRateLimitError checks whether an error from the AI client indicates a
// rate limit (HTTP 429) so the handler can return an appropriate status to
// the frontend.
func isAIRateLimitError(err error) bool {
	msg := err.Error()
	return strings.Contains(msg, "status 429") || strings.Contains(msg, "rate_limit")
}
