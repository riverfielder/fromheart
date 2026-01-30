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

// DailyChatLimit 限制每个用户每天的追问次数
// 每个用户每天最多可以追问3次（包括普通占卜和桃花占卜）
func DailyChatLimit(rdb *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 获取用户标识（优先使用 userID，否则使用 IP 地址）
		var userKey string
		if userIDVal, exists := c.Get("userID"); exists {
			userID := userIDVal.(uint)
			userKey = fmt.Sprintf("user:%d", userID)
		} else {
			// 对于匿名用户，尝试从请求中获取 device_hash
			deviceHash := c.GetHeader("X-Device-Hash")
			if deviceHash == "" {
				deviceHash = c.Query("device_hash")
			}
			// 如果没有 device_hash，使用 IP 地址作为标识
			if deviceHash == "" {
				ip := c.ClientIP()
				userKey = fmt.Sprintf("ip:%s", ip)
			} else {
				userKey = fmt.Sprintf("device:%s", deviceHash)
			}
		}

		// 生成今天的日期作为 key 的一部分
		today := time.Now().Format("2006-01-02")
		key := fmt.Sprintf("chat_limit:%s:%s", userKey, today)
		
		// 每天限制3次追问
		limit := 3

		// 获取当前计数
		count, err := rdb.Get(c.Request.Context(), key).Int64()
		if err != nil && err != redis.Nil {
			// Redis 错误，为了用户体验，允许通过
			c.Next()
			return
		}

		// 检查是否超过限制
		if count >= int64(limit) {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "daily_chat_limit_reached",
				"message": "今日追问次数已用完，明日再来吧",
				"limit":   limit,
				"used":    count,
			})
			c.Abort()
			return
		}

		// 增加计数
		pipe := rdb.Pipeline()
		incr := pipe.Incr(c.Request.Context(), key)
		// 设置过期时间为第二天凌晨
		tomorrow := time.Now().AddDate(0, 0, 1).Truncate(24 * time.Hour)
		ttl := time.Until(tomorrow)
		pipe.Expire(c.Request.Context(), key, ttl)
		_, err = pipe.Exec(c.Request.Context())

		if err != nil {
			// Redis 执行失败，允许通过
			c.Next()
			return
		}

		newCount := incr.Val()
		c.Header("X-Chat-Limit-Remaining", fmt.Sprintf("%d", int64(limit)-newCount))
		c.Next()
	}
}
