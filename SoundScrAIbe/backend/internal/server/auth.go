package server

import (
	"log"
	"net/http"
	"time"

	"soundscraibe/internal/session"
	"soundscraibe/internal/spotify"
	"soundscraibe/internal/user"

	"github.com/gin-gonic/gin"
)

// SpotifyAuthConfig returns the Spotify OAuth config needed by the frontend
// to build the authorize URL with PKCE params.
func (h *handlers) SpotifyAuthConfig(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"client_id":    h.cfg.SpotifyClientID,
		"redirect_uri": h.cfg.SpotifyRedirectURI,
		"scope":        "user-read-private user-read-email",
	})
}

type callbackRequest struct {
	Code         string `json:"code" binding:"required"`
	CodeVerifier string `json:"code_verifier" binding:"required"`
}

// SpotifyCallback exchanges the authorization code for tokens, creates/updates
// the user, creates a session, and sets an HttpOnly cookie.
func (h *handlers) SpotifyCallback(c *gin.Context) {
	var req callbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "code and code_verifier are required"})
		return
	}

	// Exchange code for tokens
	tokenResp, err := h.spotify.ExchangeCode(c.Request.Context(), req.Code, req.CodeVerifier)
	if err != nil {
		log.Printf("spotify token exchange error: %v", err)
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to exchange code with Spotify"})
		return
	}

	// Fetch Spotify profile
	profile, err := spotify.GetProfile(c.Request.Context(), tokenResp.AccessToken)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to fetch Spotify profile"})
		return
	}

	// Upsert user
	u := &user.User{
		SpotifyID:     profile.ID,
		DisplayName:   profile.DisplayName,
		AvatarURL:     profile.AvatarURL(),
		Email:         profile.Email,
		Country:       profile.Country,
		Product:       profile.Product,
		FollowerCount: profile.Followers.Total,
		AccessToken:   tokenResp.AccessToken,
		RefreshToken:  tokenResp.RefreshToken,
		TokenExpiry:   time.Now().Add(time.Duration(tokenResp.ExpiresIn) * time.Second),
	}

	userID, err := user.Upsert(c.Request.Context(), h.db, u)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save user"})
		return
	}

	// Create session
	sessionToken, err := session.Create(c.Request.Context(), h.db, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create session"})
		return
	}

	// Set session cookie
	secure := h.cfg.Environment != "development"
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("session", sessionToken, 604800, "/", "", secure, true)

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// Logout clears the session cookie and deletes the session from the database.
func (h *handlers) Logout(c *gin.Context) {
	token, err := c.Cookie("session")
	if err == nil {
		_ = session.Delete(c.Request.Context(), h.db, token)
	}

	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("session", "", -1, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
