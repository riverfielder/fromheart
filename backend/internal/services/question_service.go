package services

import (
	"context"
	"errors"
	"time"

	"fromheart/internal/adapters/llm"
	"fromheart/internal/db"
	"fromheart/internal/divination"
	"fromheart/internal/postprocess"

	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

var ErrDailyLimitReached = errors.New("daily_limit_reached")

type QuestionService struct {
	postgres *gorm.DB
	redis    *redis.Client
	llm      llm.Client
}

func NewQuestionService(postgres *gorm.DB, redis *redis.Client, llmClient llm.Client) *QuestionService {
	return &QuestionService{postgres: postgres, redis: redis, llm: llmClient}
}

type AskRequest struct {
	Question   string
	DeviceHash string
}

type AskResponse struct {
	DivinationID uint
	Output       postprocess.Output
}

func (s *QuestionService) Ask(ctx context.Context, req AskRequest) (AskResponse, error) {
	today := time.Now().Truncate(24 * time.Hour)

	// Rate limit check: max 3 per day
	count, err := s.GetTodayQuestionCount(ctx, req.DeviceHash)
	if err != nil {
		return AskResponse{}, err
	}
	if count >= 3 {
		return AskResponse{}, ErrDailyLimitReached
	}

	result := divination.Generate(req.Question)

	question := db.DailyQuestion{
		DeviceHash:   req.DeviceHash,
		QuestionText: req.Question,
		QuestionDate: today,
		CreatedAt:    time.Now(),
	}
	if err := s.postgres.Create(&question).Error; err != nil {
		return AskResponse{}, err
	}

	raw, err := s.llm.GenerateAnswer(ctx, llm.GenerateRequest{
		Question:      req.Question,
		BenGua:        result.BenGua,
		BianGua:       result.BianGua,
		ChangingLines: result.ChangingLines,
	})
	if err != nil {
		return AskResponse{}, err
	}

	final := postprocess.Normalize(raw, result.BenGua, result.BianGua, result.ChangingLines)

	div := db.Divination{
		DailyQuestionID: question.ID,
		BenGua:          result.BenGua,
		BianGua:         result.BianGua,
		ChangingLines:   result.ChangingLines,
		HexagramSeed:    result.Seed,
		RawOutput:       raw,
		FinalOutput:     final.Summary,
		CreatedAt:       time.Now(),
	}
	if err := s.postgres.Create(&div).Error; err != nil {
		return AskResponse{}, err
	}

	return AskResponse{DivinationID: div.ID, Output: final}, nil
}

func (s *QuestionService) GetDivination(ctx context.Context, id uint) (db.Divination, error) {
	var div db.Divination
	if err := s.postgres.Preload("DailyQuestion").First(&div, id).Error; err != nil {
		return div, err
	}
	return div, nil
}

func (s *QuestionService) History(ctx context.Context, deviceHash string, limit int) ([]db.Divination, error) {
	var divs []db.Divination
	if err := s.postgres.
		Joins("JOIN daily_questions ON daily_questions.id = divinations.daily_question_id").
		Where("daily_questions.device_hash = ?", deviceHash).
		Order("divinations.created_at desc").
		Limit(limit).
		Find(&divs).Error; err != nil {
		return nil, err
	}
	return divs, nil
}

func (s *QuestionService) GetDailyPoem(ctx context.Context) (string, error) {
	todayKey := "daily_poem:" + time.Now().Format("2006-01-02")
	cached, err := s.redis.Get(ctx, todayKey).Result()
	if err == nil {
		return cached, nil
	} else if err != redis.Nil {
		// If real error, maybe still try to generate, but for now return err if needed
		// But let's proceed to generate as fallback if it's just a connection glitch?
		// No, usually better to return error if infrastructure is down.
		// However, for redis nil, we proceed.
	}

	poem, err := s.llm.GeneratePoem(ctx)
	if err != nil {
		return "", err
	}

	// Calculate TTL until end of day? Or just 24h. 24h is simpler.
	s.redis.Set(ctx, todayKey, poem, 24*time.Hour)
	return poem, nil
}

func (s *QuestionService) GetTodayQuestionCount(ctx context.Context, deviceHash string) (int64, error) {
	today := time.Now().Truncate(24 * time.Hour)
	var count int64
	if err := s.postgres.Model(&db.DailyQuestion{}).
		Where("device_hash = ? AND question_date = ?", deviceHash, today).
		Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (s *QuestionService) GetBlessing(ctx context.Context) (string, error) {
	return s.llm.GenerateBlessing(ctx)
}
