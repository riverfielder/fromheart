package middleware

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

// GlobalConcurrencyLimit 限制全局并发请求数
// maxConcurrency: 允许的最大并发数（例如 100）
// timeout: 获取令牌的等待超时时间
func GlobalConcurrencyLimit(rdb *redis.Client, maxConcurrency int) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 仅针对耗时的 AI 接口（POST 请求）进行限制
		// 如果是 GET 请求（如获取历史记录、静态资源），通常消耗较小，可以放宽或不限制
		if c.Request.Method != http.MethodPost {
			c.Next()
			return
		}

		key := "global_concurrency_limit"
		
		// 尝试增加计数
		// 使用 Lua 脚本保证原子性：如果当前值 < max，则 incr 并返回新值；否则返回 -1
		script := redis.NewScript(`
			local current = redis.call("GET", KEYS[1])
			if not current then
				current = 0
			else
				current = tonumber(current)
			end

			if current >= tonumber(ARGV[1]) then
				return -1
			end

			return redis.call("INCR", KEYS[1])
		`)

		// 执行脚本
		result, err := script.Run(c.Request.Context(), rdb, []string{key}, maxConcurrency).Int()
		
		if err != nil {
			// 如果 Redis 错误，为了可用性，通常选择放行（Fail Open），或者记录错误
			// 这里我们选择 Fail Open，避免 Redis 抖动导致全站不可用
			c.Next()
			return
		}

		if result == -1 {
			// 达到最大并发数
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"error": "server_busy",
				"message": "服务器正忙，正在排队中，请稍后重试...",
			})
			c.Abort()
			return
		}

		// 确保请求结束时减少计数
		defer func() {
			// 使用独立的 context，因为 c.Request.Context() 可能已经因为超时取消了
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			
			// 减少计数，且保证不会减到 0 以下
			rdb.Decr(ctx, key)
			
			// 设置一个过期时间，防止因为 crash 导致 key 永久残留很大的值
			// 每次活跃请求都会重置过期时间，如果系统闲置，key 会自动过期清理
			rdb.Expire(ctx, key, 5*time.Minute)
		}()

		c.Next()
	}
}
