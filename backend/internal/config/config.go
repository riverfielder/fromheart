package config

import "os"

type Config struct {
	PostgresDSN   string
	RedisAddr     string
	RedisPass     string
	WenxinKey     string
	WenxinModel   string
	WenxinBaseURL string
	JWTSecret     string
	AdminSecret   string
}

func Load() Config {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "default_secret_please_change_in_production"
	}

	adminSecret := os.Getenv("ADMIN_SECRET")
	if adminSecret == "" {
		adminSecret = "loveriver" // Default for dev, should be changed
	}

	return Config{
		PostgresDSN:   os.Getenv("POSTGRES_DSN"),
		RedisAddr:     os.Getenv("REDIS_ADDR"),
		RedisPass:     os.Getenv("REDIS_PASSWORD"),
		WenxinKey:     os.Getenv("WENXIN_API_KEY"),
		WenxinModel:   os.Getenv("WENXIN_MODEL"),
		WenxinBaseURL: os.Getenv("WENXIN_BASE_URL"),
		JWTSecret:     jwtSecret,
		AdminSecret:   adminSecret,
	}
}
