package db

import (
	"time"

	"github.com/pgvector/pgvector-go"
)

type User struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Username     string    `gorm:"uniqueIndex" json:"username"`
	PasswordHash string    `json:"-"`
	
	// Profile fields
	BirthDateStr string    `json:"birth_date"`     // YYYY-MM-DD HH:mm
	Gender       string    `json:"gender"`         // male/female/other
	MBTI         string    `json:"mbti"`
	Zodiac       string    `json:"zodiac"`
	
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

type Wish struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	Content       string    `gorm:"size:200" json:"content"`
	DeviceHash    string    `json:"-"` // Hide from JSON
	BlessingCount int       `json:"blessing_count"`
	Type          string    `gorm:"size:20" json:"type"` // e.g. health, wealth, love, study
	CreatedAt     time.Time `json:"created_at"`
}
