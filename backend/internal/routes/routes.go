package routes

import (
	"fromheart/internal/handlers"
	"fromheart/internal/middleware"

	"github.com/gin-gonic/gin"
)

func NewRouter(handler *handlers.QuestionHandler) *gin.Engine {
	r := gin.Default()
	r.Use(middleware.RateLimit())

	api := r.Group("/api")
	{
		api.POST("/question", handler.Ask)
		api.GET("/divination/:id", handler.GetDivination)
		api.GET("/history", handler.History)
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "ok"})
		})
	}

	return r
}
