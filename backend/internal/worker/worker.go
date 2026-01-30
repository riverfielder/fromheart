package worker

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"fromheart/internal/adapters/llm"
	"fromheart/internal/db"
	"fromheart/internal/divination"
	"fromheart/internal/handlers"
	"fromheart/internal/queue"
	"fromheart/internal/services"

	"gorm.io/gorm"
)

type Worker struct {
	q           *queue.Queue
	qs          *services.QuestionService
	loveHandler *handlers.LoveHandler // 复用 LoveHandler 中的逻辑（或者应该把逻辑移到 Service）
	// 由于 Love 的逻辑主要在 Handler 里（这是一个之前的架构小缺陷），我们暂时在 Worker 里重新实现一部分，
	// 或者为了快速重构，我们引入必要的依赖来手动执行 Love 逻辑。
	db  *gorm.DB
	llm llm.Client
}

func NewWorker(q *queue.Queue, qs *services.QuestionService, db *gorm.DB, llm llm.Client) *Worker {
	return &Worker{
		q:   q,
		qs:  qs,
		db:  db,
		llm: llm,
	}
}

func (w *Worker) Start(concurrency int) {
	for i := 0; i < concurrency; i++ {
		go w.loop(i)
	}
	log.Printf("[Worker] Started %d workers", concurrency)
}

func (w *Worker) loop(id int) {
	for {
		ctx := context.Background()
		taskID, payload, err := w.q.Dequeue(ctx)
		if err != nil {
			log.Printf("[Worker %d] Redis error: %v", id, err)
			time.Sleep(time.Second) // 出错后等待，防止死循环刷日志
			continue
		}

		log.Printf("[Worker %d] Processing task %s type %s", id, taskID, payload.Type)
		w.q.UpdateStatus(ctx, taskID, queue.StatusProcessing, nil, "")

		var result interface{}
		var processErr error

		switch payload.Type {
		case queue.TypeQuestion:
			result, processErr = w.processQuestion(ctx, payload)
		case queue.TypeLove:
			result, processErr = w.processLove(ctx, payload)
		default:
			processErr = fmt.Errorf("unknown task type")
		}

		if processErr != nil {
			log.Printf("[Worker %d] Task %s failed: %v", id, taskID, processErr)
			w.q.UpdateStatus(ctx, taskID, queue.StatusFailed, nil, processErr.Error())
		} else {
			log.Printf("[Worker %d] Task %s completed", id, taskID)
			w.q.UpdateStatus(ctx, taskID, queue.StatusCompleted, result, "")
		}
	}
}

// processQuestion 处理普通占卜
func (w *Worker) processQuestion(ctx context.Context, payload *queue.TaskPayload) (interface{}, error) {
	var req services.AskRequest
	if err := json.Unmarshal(payload.Data, &req); err != nil {
		return nil, err
	}
	// 补充上下文信息
	req.DeviceHash = payload.DeviceHash
	req.UserID = payload.UserID

	// 调用 Service
	// 注意：Ask 内部目前包含了“检查限额”的逻辑。
	// 在异步模式下，限额应该在入队前检查（Handler层），Worker 层默认是合法的。
	// 但再次检查也无妨。
	resp, err := w.qs.Ask(ctx, req)
	if err != nil {
		return nil, err
	}

	// 返回给前端的数据结构
	// 之前 Handler 返回的是: 
	// "divination_id": resp.DivinationID,
	// "result":        resp.Output,
	// "usage_count":   count
	
	// Worker 只返回核心数据，Usage count 前端可以单独查或者忽略
	return map[string]interface{}{
		"divination_id": resp.DivinationID,
		"result":        resp.Output,
	}, nil
}

// processLove 处理桃花占卜
// 由于 Love 的逻辑之前写在 Handler 里，这里需要搬运过来
func (w *Worker) processLove(ctx context.Context, payload *queue.TaskPayload) (interface{}, error) {
	var req struct {
		NameA      string `json:"name_a"`
		GenderA    string `json:"gender_a"`
		BirthDateA string `json:"birth_date_a"`
		NameB      string `json:"name_b"`
		GenderB    string `json:"gender_b"`
		BirthDateB string `json:"birth_date_b"`
		Story      string `json:"story"`
	}
	if err := json.Unmarshal(payload.Data, &req); err != nil {
		return nil, err
	}

	// 1. Generate Hexagram
	divResult := divination.Generate(req.Story)

	// 2. Call LLM
	llmReq := llm.LoveRequest{
		NameA: req.NameA, GenderA: req.GenderA, BirthA: req.BirthDateA,
		NameB: req.NameB, GenderB: req.GenderB, BirthB: req.BirthDateB,
		Story:         req.Story,
		BenGua:        divResult.BenGua,
		BianGua:       divResult.BianGua,
		ChangingLines: divResult.ChangingLines,
	}

	rawAnalysis, err := w.llm.AnalyzeLove(ctx, llmReq)
	if err != nil {
		return nil, err
	}

	// 3. Parse JSON
	cleanJSON := extractJSON(rawAnalysis)
	var finalObj map[string]interface{}
	if err := json.Unmarshal([]byte(cleanJSON), &finalObj); err != nil {
		// Fallback logic
		finalObj = map[string]interface{}{
			"score":                0,
			"keyword":              "天机难测",
			"bazi_analysis":        "服务器解析异常，请重试",
			"hexagram_analysis":    rawAnalysis,
			"story_interpretation": "...",
			"advice":               []string{},
			"poem":                 "道可道非常道",
		}
		fallbackBytes, _ := json.Marshal(finalObj)
		cleanJSON = string(fallbackBytes)
	}

	// 4. Save to DB
	probe := db.LoveProbe{
		DeviceHash:    payload.DeviceHash,
		NameA:         req.NameA,
		GenderA:       req.GenderA,
		BirthDateA:    req.BirthDateA,
		NameB:         req.NameB,
		GenderB:       req.GenderB,
		BirthDateB:    req.BirthDateB,
		Story:         req.Story,
		BenGua:        divResult.BenGua,
		BianGua:       divResult.BianGua,
		ChangingLines: divResult.ChangingLines,
		RawOutput:     rawAnalysis,
		FinalResponse: cleanJSON,
		CreatedAt:     time.Now(),
	}

	if err := w.db.Create(&probe).Error; err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"id":       probe.ID,
		"analysis": finalObj,
		"hexagram": divResult.BenGua,
	}, nil
}

// 辅助函数
func extractJSON(s string) string {
	start := -1
	end := -1
	for i, c := range s {
		if c == '{' && start == -1 {
			start = i
		}
		if c == '}' {
			end = i
		}
	}
	if start != -1 && end != -1 && end > start {
		return s[start : end+1]
	}
	return s
}
