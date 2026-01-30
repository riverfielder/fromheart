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
		tokenString := ""

		// 1. Try Cookie first (HttpOnly)
		if cookie, err := c.Cookie("token"); err == nil {
			tokenString = cookie
		}

		// 2. Fallback to Header (Bearer) for backward compatibility or mobile apps
		if tokenString == "" {
			authHeader := c.GetHeader("Authorization")
			if authHeader != "" {
				parts := strings.Split(authHeader, " ")
				if len(parts) == 2 && parts[0] == "Bearer" {
					tokenString = parts[1]
				}
			}
		}

		if tokenString == "" {
			c.Next()
			return
		}

		claims, err := auth.ParseToken(tokenString, cfg.JWTSecret)
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
