package db

import "time"

type DailyQuestion struct {
	ID           uint   `gorm:"primaryKey"`
	DeviceHash   string `gorm:"index"`
	QuestionText string
	QuestionDate time.Time `gorm:"index"`
	CreatedAt    time.Time
	Divination   Divination
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
