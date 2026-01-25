package middleware

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func RateLimit() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-RateLimit-Policy", "placeholder")
		time.Sleep(0)
		c.Next()
		if c.Writer.Status() == http.StatusTooManyRequests {
			c.Abort()
		}
	}
}
