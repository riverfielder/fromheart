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
	postgres    *gorm.DB
	redis       *redis.Client
	llm         llm.Client
	adminSecret string
}

func NewQuestionService(postgres *gorm.DB, redis *redis.Client, llmClient llm.Client, adminSecret string) *QuestionService {
	return &QuestionService{postgres: postgres, redis: redis, llm: llmClient, adminSecret: adminSecret}
}

type AskRequest struct {
	Question   string
	DeviceHash string
	Secret     string
	UserID     *uint
}

type AskResponse struct {
	DivinationID uint
	Output       postprocess.Output
}

func (s *QuestionService) Ask(ctx context.Context, req AskRequest) (AskResponse, error) {
	today := time.Now().Truncate(24 * time.Hour)

	// Rate limit check: max 3 per day (bypass if secret is correct)
	if req.Secret != "loveriver" {
		count, err := s.GetTodayQuestionCount(ctx, req.DeviceHash, req.UserID)
		if err != nil {
			return AskResponse{}, err
		}
		if count >= 10 {
			return AskResponse{}, ErrDailyLimitReached
		}
	}

	result := divination.Generate(req.Question)

	// Vector Memory: Embed & Search
	var vec []float32
	var contextStr string
	if v, err := s.llm.Embed(ctx, req.Question); err == nil {
		vec = v
		fmt.Printf("[Vector] Embed success. Dims: %d\n", len(v))

		// Search similar
		var similar []db.DailyQuestion
		query := s.postgres.Preload("Divination").Where("embedding IS NOT NULL")
		
		// PRIVACY FIX: Only search within the user's OWN history.
		// We must not leak other users' questions into the context of another user.
		if req.UserID != nil {
			query = query.Where("user_id = ?", *req.UserID)
		} else {
			// For anonymous users, we can either:
			// 1. Search only their current device hash (weak, but better than global)
			// 2. Disable RAG (Safe)
			// Let's go with Option 1: Device Scope
			query = query.Where("device_hash = ?", req.DeviceHash)
		}

		if err := query.
			Order(gorm.Expr("embedding <-> ?", pgvector.NewVector(vec))).
			Limit(2).
			Find(&similar).Error; err == nil {

			fmt.Printf("[Vector] Found %d similar items\n", len(similar))

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
	} else {
		// Log embedding error but proceed
		fmt.Printf("Embedding error: %v\n", err)
	}

	question := db.DailyQuestion{
		DeviceHash:   req.DeviceHash,
		UserID:       req.UserID,
		QuestionText: req.Question,
		QuestionDate: today,
		CreatedAt:    time.Now(),
	}

	// Only set embedding if we have valid vector
	if len(vec) > 0 {
		v := pgvector.NewVector(vec)
		question.Embedding = &v
	}

	if err := s.postgres.Create(&question).Error; err != nil {
		return AskResponse{}, err
	}

	// Fetch user profile if logged in
	var userProfile llm.UserProfile
	if req.UserID != nil {
		var u db.User
		if err := s.postgres.First(&u, *req.UserID).Error; err == nil {
			userProfile = llm.UserProfile{
				Name:         u.Username,
				BirthDateStr: u.BirthDateStr,
				Gender:       u.Gender,
				MBTI:         u.MBTI,
				Zodiac:       u.Zodiac,
			}
		}
	}

	raw, err := s.llm.GenerateAnswer(ctx, llm.GenerateRequest{
		Question:      req.Question,
		BenGua:        result.BenGua,
		BianGua:       result.BianGua,
		ChangingLines: result.ChangingLines,
		Context:       contextStr, // Inject memory
		UserProfile:   userProfile,
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

func (s *QuestionService) History(ctx context.Context, deviceHash string, userID *uint, limit int) ([]db.Divination, error) {
	var divs []db.Divination
	query := s.postgres.
		Joins("JOIN daily_questions ON daily_questions.id = divinations.daily_question_id")

	if userID != nil {
		query = query.Where("daily_questions.user_id = ?", *userID)
	} else {
		query = query.Where("daily_questions.device_hash = ?", deviceHash)
	}

	if err := query.
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

func (s *QuestionService) GetTodayQuestionCount(ctx context.Context, deviceHash string, userID *uint) (int64, error) {
	today := time.Now().Truncate(24 * time.Hour)
	var count int64
	query := s.postgres.Model(&db.DailyQuestion{}).Where("question_date = ?", today)

	if userID != nil {
		query = query.Where("user_id = ?", *userID)
	} else {
		query = query.Where("device_hash = ?", deviceHash)
	}

	if err := query.Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (s *QuestionService) GetBlessing(ctx context.Context) (string, error) {
	return s.llm.GenerateBlessing(ctx)
}

type AdminQuestion struct {
	ID           uint      `json:"id"`
	QuestionText string    `json:"question_text"`
	QuestionDate time.Time `json:"question_date"`
	Username     string    `json:"username"`
	IsGuest      bool      `json:"is_guest"`
	Answer       string    `json:"answer"`
	CreatedAt    time.Time `json:"created_at"`
}

func (s *QuestionService) GetAllQuestions(ctx context.Context, secret string) ([]AdminQuestion, error) {
	// Constant time comparison roughly, but strictly simple equals is fine for this context
	if secret != s.adminSecret {
		return nil, errors.New("unauthorized")
	}

	var results []AdminQuestion

	// Join DailyQuestion with Divination and User
	// Note: We need to handle cases where there might not be a divination yet (though unlikely in this flow)
	// and cases where UserID is null (Guest)

	rows, err := s.postgres.Table("daily_questions").
		Select("daily_questions.id, daily_questions.question_text, daily_questions.question_date, daily_questions.created_at, users.username, divinations.final_output").
		Joins("LEFT JOIN users ON users.id = daily_questions.user_id").
		Joins("LEFT JOIN divinations ON divinations.daily_question_id = daily_questions.id").
		Order("daily_questions.created_at desc").
		Rows()

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var q AdminQuestion
		var username *string
		var answer *string

		if err := rows.Scan(&q.ID, &q.QuestionText, &q.QuestionDate, &q.CreatedAt, &username, &answer); err != nil {
			continue
		}

		if username != nil {
			q.Username = *username
			q.IsGuest = false
		} else {
			q.Username = "游客"
			q.IsGuest = true
		}

		if answer != nil {
			q.Answer = *answer
		}

		results = append(results, q)
	}

	return results, nil
}

type ChatRequest struct {
	DivinationID uint
	Message      string
	History      []map[string]string // Previous chat history from frontend if stateless, or we build it
}

// Minimal chat history struct for LLM
type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

func (s *QuestionService) Chat(ctx context.Context, divinationID uint, message string, history []ChatMessage) (string, error) {
	// 1. Get original divination context
	div, err := s.GetDivination(ctx, divinationID)
	if err != nil {
		return "", err
	}

	// 2. Build system prompt / context
	var messages []map[string]string

	// 2.1 System Role
	messages = append(messages, map[string]string{
		"role": "system",
		"content": fmt.Sprintf(`你是一位精通梅花易数的玄学大师。
当前正在针对一个特定的卦象为信众解惑。

【原卦象信息】
问题：%s
本卦：%s
变卦：%s
动爻：%s
卦辞总结：%s

请针对用户的后续提问进行解答。回答要继续保持大师风范，语气平和、玄妙但又充满关怀。不要重复之前的卦辞，而是针对新问题进行延伸解读。`,
			div.DailyQuestion.QuestionText, div.BenGua, div.BianGua, div.ChangingLines, div.FinalOutput),
	})

	// 2.2 Append conversation history
	for _, msg := range history {
		messages = append(messages, map[string]string{
			"role":    msg.Role,
			"content": msg.Content,
		})
	}

	// 2.3 Append current user message
	messages = append(messages, map[string]string{
		"role":    "user",
		"content": message,
	})

	// 3. Call LLM
	return s.llm.Chat(ctx, messages)
}
