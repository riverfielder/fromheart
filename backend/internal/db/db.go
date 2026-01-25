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
	if err := db.AutoMigrate(&DailyQuestion{}, &Divination{}); err != nil {
		log.Fatal(err)
	}
	return db
}
