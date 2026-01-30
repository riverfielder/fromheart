package cache

import (
	"fromheart/internal/config"

	"github.com/redis/go-redis/v9"
)

func NewRedis(cfg config.Config) *redis.Client {
	return redis.NewClient(&redis.Options{
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPass,
		DB:       0,
		
		// Connection Pool Config
		PoolSize:     100, // Maximum number of socket connections
		MinIdleConns: 10,  // Minimum number of idle connections
	})
}
