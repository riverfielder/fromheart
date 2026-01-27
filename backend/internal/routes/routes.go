package routes

import (
	"net/http"

	"fromheart/internal/config"
	"fromheart/internal/handlers"
	"fromheart/internal/middleware"

	"github.com/gin-gonic/gin"
)

func NewRouter(handler *handlers.QuestionHandler, authHandler *handlers.AuthHandler, cfg config.Config) *gin.Engine {
	r := gin.Default()
	r.Use(middleware.RateLimit())
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Header("Access-Control-Max-Age", "86400")
		if c.Request.Method == http.MethodOptions {
			c.Status(204)
			return
		}
		c.Next()
	})

	api := r.Group("/api")
	// Apply Optional Auth to all API routes, so handlers can use userID if present
	api.Use(middleware.OptionalAuthMiddleware(cfg))
	{
		api.POST("/register", authHandler.Register)
		api.POST("/login", authHandler.Login)

		// Me requires auth
		api.GET("/me", middleware.RequireAuthMiddleware(), authHandler.Me)

		api.POST("/question", handler.Ask)
		api.GET("/divination/:id", handler.GetDivination)
		api.POST("/divination/:id/chat", handler.Chat)
		api.GET("/history", handler.History)
		api.GET("/poem", handler.GetPoem)
		api.GET("/usage", handler.GetUsage)
		api.GET("/blessing", handler.GetBlessing)
		api.GET("/admin/questions", handler.AdminAllHistory)
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "ok"})
		})
	}

	return r
}
