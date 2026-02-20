package ai

import (
	"encoding/json"
	"fmt"
	"strings"
)

// ---------------------------------------------------------------------------
// Taste profile types
// ---------------------------------------------------------------------------

// TasteProfile holds all gathered data about a user's music taste.
type TasteProfile struct {
	TopArtists     []ArtistEntry
	TopTracks      []TrackEntry
	RecentPlays    []RecentEntry
	HighRated      []RatedEntry
	OnRotation     []ShelfEntry
	UserTags       []string
	TopGenres      []string
	ListeningHours []HourEntry
}

// ArtistEntry represents a top artist with genre and play count information.
type ArtistEntry struct {
	Name      string
	Genres    []string
	PlayCount int // from listening_history if available, else 0
}

// TrackEntry represents a top track.
type TrackEntry struct {
	Name   string
	Artist string
}

// RecentEntry represents a recently played track.
type RecentEntry struct {
	Name   string
	Artist string
}

// RatedEntry represents a user-rated entity (track, album, or artist).
type RatedEntry struct {
	EntityType string // "track", "album", "artist"
	Name       string
	Artist     string // empty for artists
	Score      int
}

// ShelfEntry represents an entity on the user's "on rotation" shelf.
type ShelfEntry struct {
	EntityType string
	Name       string
	Artist     string
}

// HourEntry represents listening activity for a specific hour of the day.
type HourEntry struct {
	Hour  int // 0-23
	Count int
}

// ---------------------------------------------------------------------------
// AI response types
// ---------------------------------------------------------------------------

// AIResponse is the expected JSON structure from the AI model.
type AIResponse struct {
	TasteSummary    string              `json:"taste_summary"`
	Recommendations []RawRecommendation `json:"recommendations"`
}

// RawRecommendation is a single recommendation returned by the AI model.
type RawRecommendation struct {
	Type           string          `json:"type"` // "track", "album", "artist"
	Title          string          `json:"title"`
	Artist         string          `json:"artist"`
	Album          string          `json:"album,omitempty"`
	Year           json.RawMessage `json:"year,omitempty"`
	Why            string          `json:"why"`
	DiscoveryAngle string          `json:"discovery_angle"`
	MoodTags       []string        `json:"mood_tags"`
}

// YearString returns the year as a string, handling both number and string JSON values.
func (r RawRecommendation) YearString() string {
	if len(r.Year) == 0 {
		return ""
	}
	// Try as string first (e.g. "1965")
	var s string
	if err := json.Unmarshal(r.Year, &s); err == nil {
		return s
	}
	// Must be a number (e.g. 1965) — return the raw text
	return strings.Trim(string(r.Year), " ")
}

// ArtistName returns the artist name. For artist-type recommendations,
// LLMs sometimes put the name in Title instead of Artist.
func (r RawRecommendation) ArtistName() string {
	if r.Artist != "" {
		return r.Artist
	}
	if r.Type == "artist" {
		return r.Title
	}
	return ""
}

// ---------------------------------------------------------------------------
// Prompt construction
// ---------------------------------------------------------------------------

// BuildSystemPrompt returns the system prompt for the AI model's music recommendation role.
func BuildSystemPrompt() string {
	return `You are a music taste analyst and discovery engine for SoundScrAIbe, a personal music diary app. You analyze listening patterns, ratings, and preferences to generate deeply personalized music recommendations.

You MUST respond with ONLY a valid JSON object. No markdown code fences, no explanation text, no preamble — just the raw JSON.

The JSON schema you must follow:
{
  "taste_summary": "A 2-3 sentence summary of the user's overall music taste, noting key patterns and preferences.",
  "recommendations": [
    {
      "type": "track|album|artist",
      "title": "Name of the track, album, or artist",
      "artist": "Artist name (for tracks and albums) or the artist themselves",
      "album": "Album name (optional, for tracks)",
      "year": "Release year (optional)",
      "why": "1-2 sentences explaining why this fits, referencing specific data from the user's profile",
      "discovery_angle": "cross_genre|deep_cut|era_bridge|mood_match|artist_evolution",
      "mood_tags": ["tag1", "tag2"]
    }
  ]
}

Rules:
- Generate exactly 10 recommendations: aim for 6 tracks, 2 albums, and 2 artists.
- The "why" field MUST reference something specific from the user's data (a genre they listen to, an artist they like, a rating they gave, their listening time patterns, etc.).
- Do NOT recommend anything that already appears in the user's top tracks, top artists, recently played, or highly rated lists.
- Prioritize cross-genre discoveries that will surprise the user while still connecting to their taste.
- The "discovery_angle" must be one of: cross_genre, deep_cut, era_bridge, mood_match, artist_evolution.
- Return ONLY the JSON object.`
}

// FormatTasteProfile formats a TasteProfile into a human-readable message for the AI model.
// If userPrompt is non-empty, it is appended as the user's specific request.
func FormatTasteProfile(profile *TasteProfile, userPrompt string) string {
	var b strings.Builder

	b.WriteString("## My Music Taste Profile\n\n")

	// Top Genres
	if len(profile.TopGenres) > 0 {
		b.WriteString("### Top Genres\n")
		b.WriteString(strings.Join(profile.TopGenres, ", "))
		b.WriteString("\n\n")
	}

	// Top Artists
	if len(profile.TopArtists) > 0 {
		b.WriteString("### Top Artists\n")
		for i, a := range profile.TopArtists {
			b.WriteString(fmt.Sprintf("%d. %s", i+1, a.Name))
			if len(a.Genres) > 0 {
				b.WriteString(fmt.Sprintf(" (genres: %s)", strings.Join(a.Genres, ", ")))
			}
			if a.PlayCount > 0 {
				b.WriteString(fmt.Sprintf(" — listened %d times", a.PlayCount))
			}
			b.WriteByte('\n')
		}
		b.WriteByte('\n')
	}

	// Top Tracks
	if len(profile.TopTracks) > 0 {
		b.WriteString("### Top Tracks\n")
		for i, t := range profile.TopTracks {
			b.WriteString(fmt.Sprintf("%d. \"%s\" by %s\n", i+1, t.Name, t.Artist))
		}
		b.WriteByte('\n')
	}

	// Recently Played
	if len(profile.RecentPlays) > 0 {
		b.WriteString("### Recently Played (distinct)\n")
		for _, r := range profile.RecentPlays {
			b.WriteString(fmt.Sprintf("- \"%s\" by %s\n", r.Name, r.Artist))
		}
		b.WriteByte('\n')
	}

	// Highly Rated
	if len(profile.HighRated) > 0 {
		b.WriteString("### Highly Rated (8-10/10)\n")
		for _, r := range profile.HighRated {
			switch r.EntityType {
			case "artist":
				b.WriteString(fmt.Sprintf("- [%s] %s — %d/10\n", r.EntityType, r.Name, r.Score))
			default:
				b.WriteString(fmt.Sprintf("- [%s] \"%s\" by %s — %d/10\n", r.EntityType, r.Name, r.Artist, r.Score))
			}
		}
		b.WriteByte('\n')
	}

	// On Rotation
	if len(profile.OnRotation) > 0 {
		b.WriteString("### Currently On Rotation\n")
		for _, s := range profile.OnRotation {
			if s.Artist != "" {
				b.WriteString(fmt.Sprintf("- [%s] \"%s\" by %s\n", s.EntityType, s.Name, s.Artist))
			} else {
				b.WriteString(fmt.Sprintf("- [%s] %s\n", s.EntityType, s.Name))
			}
		}
		b.WriteByte('\n')
	}

	// User Tags
	if len(profile.UserTags) > 0 {
		b.WriteString("### My Tags\n")
		b.WriteString(strings.Join(profile.UserTags, ", "))
		b.WriteString("\n\n")
	}

	// Listening Patterns
	if len(profile.ListeningHours) > 0 {
		b.WriteString("### Listening Patterns\nMost active at: ")
		parts := make([]string, 0, len(profile.ListeningHours))
		for _, h := range profile.ListeningHours {
			parts = append(parts, fmt.Sprintf("%s (%d plays)", formatHourRange(h.Hour), h.Count))
		}
		b.WriteString(strings.Join(parts, ", "))
		b.WriteString("\n\n")
	}

	// User prompt (prompt mode)
	if userPrompt != "" {
		b.WriteString("---\n\n")
		b.WriteString("## IMPORTANT: USER'S SPECIFIC REQUEST\n\n")
		b.WriteString(fmt.Sprintf("The user is asking for: \"%s\"\n\n", userPrompt))
		b.WriteString("Your recommendations MUST directly address this request. The taste profile above is context for personalization, but the user's request is the PRIMARY driver. Every recommendation should fit what they asked for. Do NOT just recommend based on taste — focus on their specific request first, then personalize using their profile.\n")
	} else {
		b.WriteString("Based on this profile, generate 10 music recommendations that go beyond what the user already knows.\n")
	}

	return b.String()
}

// formatHourRange formats an hour (0-23) as a human-readable range like "10pm-11pm".
func formatHourRange(hour int) string {
	start := formatHour(hour)
	end := formatHour((hour + 1) % 24)
	return start + "-" + end
}

// formatHour formats a single hour (0-23) as "12am", "1am", ..., "12pm", "1pm", etc.
func formatHour(h int) string {
	switch {
	case h == 0:
		return "12am"
	case h < 12:
		return fmt.Sprintf("%dam", h)
	case h == 12:
		return "12pm"
	default:
		return fmt.Sprintf("%dpm", h-12)
	}
}
