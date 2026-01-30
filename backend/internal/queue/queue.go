package queue

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

const (
	TaskQueueKeyPrefix = "task_queue"
	TaskStatusKeyPrefix = "task:status"
	TaskExpiration      = 10 * time.Minute // 任务结果在 Redis 保留 10 分钟
)

type TaskType string

const (
	TypeQuestion TaskType = "question"
	TypeLove     TaskType = "love"
)

type TaskStatus string

const (
	StatusPending    TaskStatus = "pending"
	StatusProcessing TaskStatus = "processing"
	StatusCompleted  TaskStatus = "completed"
	StatusFailed     TaskStatus = "failed"
)

type TaskPayload struct {
	Type       TaskType        `json:"type"`
	Data       json.RawMessage `json:"data"` // 具体的请求数据
	UserID     *uint           `json:"user_id,omitempty"`
	DeviceHash string          `json:"device_hash"`
	CreatedAt  time.Time       `json:"created_at"`
}

type TaskResult struct {
	Status    TaskStatus  `json:"status"`
	Result    interface{} `json:"result,omitempty"`
	Error     string      `json:"error,omitempty"`
	UpdatedAt time.Time   `json:"updated_at"`
}

type Queue struct {
	rdb *redis.Client
}

func NewQueue(rdb *redis.Client) *Queue {
	return &Queue{rdb: rdb}
}

// Enqueue 将任务推入队列
func (q *Queue) Enqueue(ctx context.Context, taskID string, payload TaskPayload) error {
	// 1. 保存初始状态
	initialState := TaskResult{
		Status:    StatusPending,
		UpdatedAt: time.Now(),
	}
	stateBytes, _ := json.Marshal(initialState)
	if err := q.rdb.Set(ctx, fmt.Sprintf("%s:%s", TaskStatusKeyPrefix, taskID), stateBytes, TaskExpiration).Err(); err != nil {
		return err
	}

	// 2. 推入队列
	// 将 payload 和 taskID 一起打包，或者只存 ID？
	// 为了简单，我们存一个包含 ID 和 Payload 的结构
	msg := map[string]interface{}{
		"id":      taskID,
		"payload": payload,
	}
	msgBytes, _ := json.Marshal(msg)
	
	return q.rdb.LPush(ctx, TaskQueueKeyPrefix, msgBytes).Err()
}

// Dequeue 阻塞等待任务
func (q *Queue) Dequeue(ctx context.Context) (string, *TaskPayload, error) {
	// BRPOP 阻塞读取
	result, err := q.rdb.BRPop(ctx, 0, TaskQueueKeyPrefix).Result()
	if err != nil {
		return "", nil, err
	}

	// result[0] 是 key, result[1] 是 value
	var msg struct {
		ID      string      `json:"id"`
		Payload TaskPayload `json:"payload"`
	}
	if err := json.Unmarshal([]byte(result[1]), &msg); err != nil {
		return "", nil, err
	}

	return msg.ID, &msg.Payload, nil
}

// UpdateStatus 更新任务状态
func (q *Queue) UpdateStatus(ctx context.Context, taskID string, status TaskStatus, result interface{}, errStr string) error {
	state := TaskResult{
		Status:    status,
		Result:    result,
		Error:     errStr,
		UpdatedAt: time.Now(),
	}
	bytes, _ := json.Marshal(state)
	return q.rdb.Set(ctx, fmt.Sprintf("%s:%s", TaskStatusKeyPrefix, taskID), bytes, TaskExpiration).Err()
}

// GetStatus 获取任务状态
func (q *Queue) GetStatus(ctx context.Context, taskID string) (*TaskResult, error) {
	val, err := q.rdb.Get(ctx, fmt.Sprintf("%s:%s", TaskStatusKeyPrefix, taskID)).Result()
	if err != nil {
		return nil, err
	}
	var res TaskResult
	json.Unmarshal([]byte(val), &res)
	return &res, nil
}
