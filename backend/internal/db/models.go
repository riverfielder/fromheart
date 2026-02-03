package db

import (
	"time"

	"github.com/pgvector/pgvector-go"
)

type User struct {
	ID           uint   `gorm:"primaryKey" json:"id"`
	Username     string `gorm:"uniqueIndex" json:"username"`
	PasswordHash string `json:"-"`

	// Profile fields
	BirthDateStr string `json:"birth_date"` // YYYY-MM-DD HH:mm
	Gender       string `json:"gender"`     // male/female/other
	MBTI         string `json:"mbti"`
	Zodiac       string `json:"zodiac"`

	CreatedAt time.Time `json:"created_at"`
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

type LoveProbe struct {
	ID         uint   `gorm:"primaryKey" json:"id"`
	DeviceHash string `gorm:"index" json:"device_hash"`

	// Party A (User)
	NameA      string `json:"name_a"`
	GenderA    string `json:"gender_a"`
	BirthDateA string `json:"birth_date_a"` // YYYY-MM-DD HH:mm

	// Party B (Target)
	NameB      string `json:"name_b"`
	GenderB    string `json:"gender_b"`
	BirthDateB string `json:"birth_date_b"`

	Story string `gorm:"type:text" json:"story"`

	// Divination Result
	BenGua        string `json:"ben_gua"`
	BianGua       string `json:"bian_gua"`
	ChangingLines string `json:"changing_lines"`

	// AI Analysis
	RawOutput     string `gorm:"type:text" json:"-"`
	FinalResponse string `gorm:"type:text" json:"final_response"` // Stores the JSON structure from AI

	CreatedAt time.Time `json:"created_at"`
}

type YearlyFortune struct {
	ID         uint   `gorm:"primaryKey" json:"id"`
	DeviceHash string `gorm:"index" json:"device_hash"`
	UserID     *uint  `gorm:"index" json:"user_id,omitempty"`

	Name      string `json:"name"`
	Gender    string `json:"gender"`
	BirthDate string `json:"birth_date"`
	Year      int    `json:"year"`

	// Divination
	BenGua        string `json:"ben_gua"`
	BianGua       string `json:"bian_gua"`
	ChangingLines string `json:"changing_lines"`

	// AI Analysis
	RawOutput     string `gorm:"type:text" json:"-"`
	FinalResponse string `gorm:"type:text" json:"final_response"`

	CreatedAt time.Time `json:"created_at"`
}

type MetaReport struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"uniqueIndex" json:"user_id"`
	MBTI      string    `json:"mbti"`
	Zodiac    string    `json:"zodiac"`

	// Generated Content
	SoulColor   string `json:"soul_color"`
	PastLife    string `json:"past_life"`
	Keywords    string `json:"keywords"`                 // JSON array string ex: ["Deep", "Poetic"]
	Description string `gorm:"type:text" json:"description"` // Full text analysis

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
