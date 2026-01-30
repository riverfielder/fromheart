package middleware

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"

	"github.com/gin-gonic/gin"
)

func generateRandomToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func CSRF() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Ensure a CSRF token cookie exists for the client to read
		// We set this on every "safe" method request to ensure the client has a fresh token if needed,
		// or at least has one. The client (frontend) needs to read this cookie and send it back in a header.
		// Detailed flow:
		// - Server sets 'csrf_token' cookie (Not HttpOnly, so JS can read it).
		// - Client reads 'csrf_token'.
		// - Client includes 'X-CSRF-Token' header with that value.
		// - Server verifies header matches cookie.

		// Check if cookie exists
		_, err := c.Cookie("csrf_token")
		if err != nil {
			// Generate new token
			token, err := generateRandomToken(32)
			if err != nil {
				c.AbortWithStatus(http.StatusInternalServerError)
				return
			}
			// Set non-HttpOnly cookie for frontend to read
			// Path should be / so it's valid everywhere
			// Secure should ideally be true in Prod
			c.SetCookie("csrf_token", token, 3600*24, "/", "", false, false)
		}

		// 2. For state-changing methods, verify the token
		if c.Request.Method == "POST" || c.Request.Method == "PUT" || c.Request.Method == "DELETE" || c.Request.Method == "PATCH" {
			csrfCookie, err := c.Cookie("csrf_token")
			if err != nil {
				c.JSON(http.StatusForbidden, gin.H{"error": "CSRF token missing in cookie"})
				c.Abort()
				return
			}

			csrfHeader := c.GetHeader("X-CSRF-Token")
			if csrfHeader == "" {
				c.JSON(http.StatusForbidden, gin.H{"error": "CSRF token missing in header"})
				c.Abort()
				return
			}

			if csrfCookie != csrfHeader {
				c.JSON(http.StatusForbidden, gin.H{"error": "CSRF token invalid"})
				c.Abort()
				return
			}
		}

		c.Next()
	}
}
