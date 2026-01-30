package db

import (
	"log"

	"fromheart/internal/config"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func NewPostgres(cfg config.Config) *gorm.DB {
	db, err := gorm.Open(postgres.Open(cfg.PostgresDSN), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	// Enable pgvector extension
	db.Exec("CREATE EXTENSION IF NOT EXISTS vector")

	// Connection Pool Settings
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatal(err)
	}

	// SetMaxIdleConns sets the maximum number of connections in the idle connection pool.
	sqlDB.SetMaxIdleConns(10)

	// SetMaxOpenConns sets the maximum number of open connections to the database.
	// 100 is a reasonable default for medium load; adjust based on Postgres resources.
	sqlDB.SetMaxOpenConns(100)

	// SetConnMaxLifetime sets the maximum amount of time a connection may be reused.
	// Useful to ensure load balancing and prevent stale connection issues.
	// sqlDB.SetConnMaxLifetime(time.Hour)

	if err := db.AutoMigrate(&DailyQuestion{}, &Divination{}, &User{}, &Wish{}); err != nil {
		log.Fatal(err)
	}
	return db
}
