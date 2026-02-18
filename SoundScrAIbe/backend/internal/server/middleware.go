package server

import (
	"log"
	"net/http"
	"time"

	"soundscraibe/internal/session"
	"soundscraibe/internal/user"

	"github.com/gin-gonic/gin"
)

// AuthRequired validates the session cookie, loads the user, and auto-refreshes
// expired Spotify tokens. Sets "user" on the gin context for downstream handlers.
func (h *handlers) AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		token, err := c.Cookie("session")
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
			return
		}

		sess, err := session.GetByToken(c.Request.Context(), h.db, token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired session"})
			return
		}

		u, err := user.GetByID(c.Request.Context(), h.db, sess.UserID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
			return
		}

		// Auto-refresh token if expired or expiring within 5 minutes
		if time.Until(u.TokenExpiry) < 5*time.Minute {
			tokenResp, err := h.spotify.RefreshAccessToken(c.Request.Context(), u.RefreshToken)
			if err != nil {
				log.Printf("failed to refresh spotify token for user %d: %v", u.ID, err)
			} else {
				refreshToken := u.RefreshToken
				if tokenResp.RefreshToken != "" {
					refreshToken = tokenResp.RefreshToken
				}
				expiry := time.Now().Add(time.Duration(tokenResp.ExpiresIn) * time.Second)
				if err := user.UpdateTokens(c.Request.Context(), h.db, u.ID, tokenResp.AccessToken, refreshToken, expiry); err != nil {
					log.Printf("failed to update tokens for user %d: %v", u.ID, err)
				} else {
					u.AccessToken = tokenResp.AccessToken
					u.RefreshToken = refreshToken
					u.TokenExpiry = expiry
				}
			}
		}

		c.Set("user", u)
		c.Next()
	}
}
