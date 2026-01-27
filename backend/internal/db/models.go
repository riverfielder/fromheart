package db

import (
	"time"

	"github.com/pgvector/pgvector-go"
)

type User struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Username     string    `gorm:"uniqueIndex" json:"username"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
}

type DailyQuestion struct {
	ID           uint   `gorm:"primaryKey"`
	DeviceHash   string `gorm:"index"`
	UserID       *uint  `gorm:"index"` // Optional UserID
	QuestionText string
	QuestionDate time.Time `gorm:"index"`
	CreatedAt    time.Time
	Divination   Divination
	Embedding    *pgvector.Vector `gorm:"type:vector(384)"` // Assuming 384 dim model
}

type Divination struct {
	ID              uint `gorm:"primaryKey"`
	DailyQuestionID uint `gorm:"index"`
	BenGua          string
	BianGua         string
	ChangingLines   string
	HexagramSeed    int64
	RawOutput       string `gorm:"type:text"`
	FinalOutput     string `gorm:"type:text"`
	CreatedAt       time.Time
	DailyQuestion   *DailyQuestion `json:"daily_question,omitempty" gorm:"foreignKey:DailyQuestionID"`
}
