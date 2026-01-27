package services

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"fromheart/internal/adapters/llm"
	"fromheart/internal/db"
	"fromheart/internal/divination"
	"fromheart/internal/postprocess"

	"github.com/pgvector/pgvector-go"
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
	Secret     string
}

type AskResponse struct {
	DivinationID uint
	Output       postprocess.Output
}

func (s *QuestionService) Ask(ctx context.Context, req AskRequest) (AskResponse, error) {
	today := time.Now().Truncate(24 * time.Hour)

	// Rate limit check: max 3 per day (bypass if secret is correct)
	if req.Secret != "loveriver" {
		count, err := s.GetTodayQuestionCount(ctx, req.DeviceHash)
		if err != nil {
			return AskResponse{}, err
		}
		if count >= 3 {
			return AskResponse{}, ErrDailyLimitReached
		}
	}

	result := divination.Generate(req.Question)

	// Vector Memory: Embed & Search
	var vec []float32
	var contextStr string
	if v, err := s.llm.Embed(ctx, req.Question); err == nil {
		vec = v
		// Search similar
		var similar []db.DailyQuestion
		if err := s.postgres.
			Preload("Divination").
			Where("embedding IS NOT NULL").
			Order("embedding <-> ?", pgvector.NewVector(vec)).
			Limit(2).
			Find(&similar).Error; err == nil {

			var contexts []string
			for _, q := range similar {
				// Only use if it has a real divination and is not the exact same question string (though unlikely with float comparison, duplicate inputs possible)
				if q.Divination.ID != 0 && q.QuestionText != req.Question {
					// Truncate output to avoid context overflow? summary is short.
					contexts = append(contexts, fmt.Sprintf("- 问：%s => 答：%s", q.QuestionText, q.Divination.FinalOutput))
				}
			}
			if len(contexts) > 0 {
				contextStr = strings.Join(contexts, "\n")
			}
		}
	}

	question := db.DailyQuestion{
		DeviceHash:   req.DeviceHash,
		QuestionText: req.Question,
		QuestionDate: today,
		CreatedAt:    time.Now(),
		Embedding:    pgvector.NewVector(vec), // Store embedding
	}
	if err := s.postgres.Create(&question).Error; err != nil {
		return AskResponse{}, err
	}

	raw, err := s.llm.GenerateAnswer(ctx, llm.GenerateRequest{
		Question:      req.Question,
		BenGua:        result.BenGua,
		BianGua:       result.BianGua,
		ChangingLines: result.ChangingLines,
		Context:       contextStr, // Inject memory
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
