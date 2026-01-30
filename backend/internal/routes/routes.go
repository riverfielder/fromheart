package routes

import (
	"net/http"

	"fromheart/internal/config"
	"fromheart/internal/handlers"
	"fromheart/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

func NewRouter(handler *handlers.QuestionHandler, authHandler *handlers.AuthHandler, wishHandler *handlers.WishHandler, loveHandler *handlers.LoveHandler, taskHandler *handlers.TaskHandler, cfg config.Config, rdb *redis.Client) *gin.Engine {
	r := gin.Default()
	r.Use(middleware.RateLimit(rdb))
	r.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if origin != "" {
			c.Header("Access-Control-Allow-Origin", origin) // Echo the origin to support credentials
		}
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS, DELETE")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token") // Added X-CSRF-Token
		c.Header("Access-Control-Allow-Credentials", "true")                                  // Essential for Cookies
		c.Header("Access-Control-Max-Age", "86400")
		if c.Request.Method == http.MethodOptions {
			c.Status(204)
			return
		}
		c.Next()
	})

	api := r.Group("/api")
	// Apply Optional Auth to all API routes
	api.Use(middleware.OptionalAuthMiddleware(cfg))
	// Apply CSRF protection
	api.Use(middleware.CSRF())

	// 【新增】应用全局并发限制，保护服务器不崩溃
	// 限制同时处理的 AI 请求为 60 个（根据机器配置调整）
	api.Use(middleware.GlobalConcurrencyLimit(rdb, 60))

	{
		api.POST("/register", authHandler.Register)
		api.POST("/login", authHandler.Login)
		api.POST("/logout", authHandler.Logout)

		// Me requires auth
		api.GET("/me", middleware.RequireAuthMiddleware(), authHandler.Me)
		api.PUT("/me", middleware.RequireAuthMiddleware(), authHandler.UpdateProfile)

		// Async Task Status
		api.GET("/task/:id", taskHandler.GetStatus)

		api.POST("/question", handler.Ask)
		api.GET("/divination/:id", handler.GetDivination)
		// 追问接口添加每日限制
		api.POST("/divination/:id/chat", middleware.DailyChatLimit(rdb), handler.Chat)
		api.POST("/divination/:id/chat/stream", middleware.DailyChatLimit(rdb), handler.ChatStream)
		api.GET("/history", handler.History)
		api.GET("/poem", handler.GetPoem)
		api.GET("/usage", handler.GetUsage)
		api.GET("/blessing", handler.GetBlessing)

		// Wishing Tree
		api.GET("/wishes", wishHandler.ListWishes)
		api.POST("/wishes", wishHandler.CreateWish)
		api.POST("/wishes/:id/bless", wishHandler.BlessWish)

		// Love Probe
		love := api.Group("/love")
		{
			love.POST("", loveHandler.Submit)
			love.GET("/history", loveHandler.GetHistory)
			love.GET("/:id", loveHandler.GetDetail)
			// 桃花追问接口添加每日限制
			love.POST("/:id/chat", middleware.DailyChatLimit(rdb), loveHandler.Chat)
			love.POST("/:id/chat/stream", middleware.DailyChatLimit(rdb), loveHandler.ChatStream)
		}

		// Admin
		api.GET("/admin/questions", handler.AdminAllHistory)
		api.GET("/admin/love", loveHandler.AdminList)
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "ok"})
		})
	}

	return r
}
