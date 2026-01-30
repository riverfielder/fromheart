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
	"fromheart/internal/queue"
	"fromheart/internal/routes"
	"fromheart/internal/services"
	"fromheart/internal/worker"
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()
	postgres := db.NewPostgres(cfg)
	redisClient := cache.NewRedis(cfg)

	llmClient := llm.NewWenxinClient(cfg)
	questionService := services.NewQuestionService(postgres, redisClient, llmClient, cfg.AdminSecret)

	// Async Queue & Worker
	queueClient := queue.NewQueue(redisClient)
	aiWorker := worker.NewWorker(queueClient, questionService, postgres, llmClient)
	go aiWorker.Start(30) // Start 30 concurrent workers (Rate limited to 3 QPS internally)

	questionHandler := handlers.NewQuestionHandler(questionService, queueClient)
	authHandler := handlers.NewAuthHandler(postgres, cfg)
	wishHandler := handlers.NewWishHandler(postgres)
	loveHandler := handlers.NewLoveHandler(postgres, llmClient, questionService, queueClient, cfg.AdminSecret)
	taskHandler := handlers.NewTaskHandler(queueClient)

	router := routes.NewRouter(questionHandler, authHandler, wishHandler, loveHandler, taskHandler, cfg, redisClient)

	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8080"
	}

	if err := router.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
