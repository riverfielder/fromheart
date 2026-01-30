package middleware

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

func RateLimit(rdb *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Basic Per-IP Rate Limiting
		// Key: rate_limit:{ip}
		// Limit: 60 requests per minute
		
		ip := c.ClientIP()
		key := fmt.Sprintf("rate_limit:%s", ip)
		limit := 60
		
		// Pipeline execution for atomicity and speed
		pipe := rdb.Pipeline()
		incr := pipe.Incr(c.Request.Context(), key)
		pipe.Expire(c.Request.Context(), key, time.Minute)
		_, err := pipe.Exec(c.Request.Context())

		if err != nil {
			// Fail open if Redis is down, or fail closed? 
			// Fail open is usually safer for UX unless under heavy attack.
			// logging error would be good.
			c.Next()
			return
		}

		count := incr.Val()

		if count > int64(limit) {
			c.Header("X-RateLimit-Retry-After", "60")
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "too_many_requests",
				"message": "请求过于频繁，请稍后再试",
			})
			c.Abort()
			return
		}

		c.Header("X-RateLimit-Remaining", fmt.Sprintf("%d", int64(limit)-count))
		c.Next()
	}
}
