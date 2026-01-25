package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"

	"fromheart/internal/adapters/llm"
	"fromheart/internal/cache"
	"fromheart/internal/config"
	"fromheart/internal/db"
	"fromheart/internal/handlers"
	"fromheart/internal/routes"
	"fromheart/internal/services"
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()
	postgres := db.NewPostgres(cfg)
	redisClient := cache.NewRedis(cfg)

	llmClient := llm.NewWenxinClient(cfg)
	questionService := services.NewQuestionService(postgres, redisClient, llmClient)

	questionHandler := handlers.NewQuestionHandler(questionService)
	router := routes.NewRouter(questionHandler)

	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8080"
	}

	if err := router.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
