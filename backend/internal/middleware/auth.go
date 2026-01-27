package middleware

import (
	"net/http"
	"strings"

	"fromheart/internal/auth"
	"fromheart/internal/config"

	"github.com/gin-gonic/gin"
)

// OptionalAuthMiddleware attempts to parse the token but doesn't abort if missing/invalid
// It enables "Guest or User" mode
func OptionalAuthMiddleware(cfg config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.Next()
			return
		}

		claims, err := auth.ParseToken(parts[1], cfg.JWTSecret)
		if err == nil {
			c.Set("userID", claims.UserID)
		}
		// If error, just ignore and treat as guest
		c.Next()
	}
}

// RequireAuthMiddleware ensures a user is logged in
func RequireAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		_, exists := c.Get("userID")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Login required"})
			return
		}
		c.Next()
	}
}
