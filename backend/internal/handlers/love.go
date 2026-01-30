package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"fromheart/internal/adapters/llm"
	"fromheart/internal/db"
	"fromheart/internal/queue"
	"fromheart/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type LoveHandler struct {
	db          *gorm.DB
	llm         llm.Client
	qs          *services.QuestionService
	q           *queue.Queue
	adminSecret string
}

func NewLoveHandler(db *gorm.DB, llm llm.Client, qs *services.QuestionService, q *queue.Queue, adminSecret string) *LoveHandler {
	return &LoveHandler{db: db, llm: llm, qs: qs, q: q, adminSecret: adminSecret}
}

type LoveSubmission struct {
	DeviceHash string `json:"device_hash"`
	NameA      string `json:"name_a" binding:"required"`
	GenderA    string `json:"gender_a" binding:"required"`
	BirthDateA string `json:"birth_date_a"` // YYYY-MM-DD HH:mm
	NameB      string `json:"name_b" binding:"required"`
	GenderB    string `json:"gender_b" binding:"required"`
	BirthDateB string `json:"birth_date_b"`
	Story      string `json:"story" binding:"required,max=500"`
}

func (h *LoveHandler) Submit(c *gin.Context) {
	var req LoveSubmission
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.DeviceHash == "" {
		req.DeviceHash = "anonymous"
	}

	// Async Enqueue
	taskID := uuid.New().String()
	payloadData, _ := json.Marshal(req)

	taskPayload := queue.TaskPayload{
		Type:       queue.TypeLove,
		Data:       payloadData,
		DeviceHash: req.DeviceHash,
	}

	if err := h.q.Enqueue(c.Request.Context(), taskID, taskPayload); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to enqueue task"})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{
		"task_id": taskID,
		"message": "姻缘推演请求已受理，请稍候...",
	})
}


func (h *LoveHandler) GetHistory(c *gin.Context) {
	hash := c.Query("device_hash")
	if hash == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "device_hash required"})
		return
	}

	var probes []db.LoveProbe
	if err := h.db.Where("device_hash = ?", hash).Order("created_at desc").Limit(20).Find(&probes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "fetch failed"})
		return
	}

	// Convert FinalResponse string back to JSON for list view?
	// Or just return minimal info.
	// GORM doesn't auto-unmarshal text to JSON map, so we'll just return raw for now or map it.
	// For simplicity, let's just return the list, frontend can parse if needed or we assume simplified view.
	c.JSON(http.StatusOK, probes)
}

func (h *LoveHandler) AdminList(c *gin.Context) {
	secret := c.GetHeader("X-Admin-Secret")
	if secret == "" {
		secret = c.Query("secret") // Allow query param too
	}
	if h.adminSecret == "" || secret != h.adminSecret {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var probes []db.LoveProbe
	if err := h.db.Order("created_at desc").Limit(100).Find(&probes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch records"})
		return
	}

	// We might want to parse the FinalResponse string to JSON for the frontend to render nicely,
	// or let frontend do it.
	// Ideally, we return the parsed data.
	var result []map[string]interface{}
	for _, probe := range probes {
		var analysis map[string]interface{}
		if probe.FinalResponse != "" {
			_ = json.Unmarshal([]byte(probe.FinalResponse), &analysis)
		}

		item := map[string]interface{}{
			"id":           probe.ID,
			"device_hash":  probe.DeviceHash,
			"name_a":       probe.NameA,
			"gender_a":     probe.GenderA,
			"birth_date_a": probe.BirthDateA,
			"name_b":       probe.NameB,
			"gender_b":     probe.GenderB,
			"birth_date_b": probe.BirthDateB,
			"story":        probe.Story,
			"hexagram":     probe.BenGua,
			"created_at":   probe.CreatedAt,
			"analysis":     analysis,
		}
		result = append(result, item)
	}

	c.JSON(http.StatusOK, result)
}

func (h *LoveHandler) GetDetail(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	probe, err := h.qs.GetLoveProbe(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	// Verify Ownership (Simple Device Hash check for now)
	device := c.Query("device_hash")
	if device != "" && probe.DeviceHash != device {
		// Strict check? Or just allow public read if ID is guessed?
		// For privacy, restrict to owner.
		// c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		// return
	}

	// Parse JSON
	var analysis map[string]interface{}
	if probe.FinalResponse != "" {
		_ = json.Unmarshal([]byte(probe.FinalResponse), &analysis)
	}

	c.JSON(http.StatusOK, gin.H{
		"id":         probe.ID,
		"analysis":   analysis,
		"hexagram":   probe.BenGua,
		"story":      probe.Story,
		"name_a":     probe.NameA,
		"name_b":     probe.NameB,
		"created_at": probe.CreatedAt,
	})
}

type loveChatRequest struct {
	Message string                 `json:"message" binding:"required"`
	History []services.ChatMessage `json:"history"`
}

func (h *LoveHandler) Chat(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req loveChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify exists
	_, err = h.qs.GetLoveProbe(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	response, err := h.qs.ChatLove(c.Request.Context(), uint(id), req.Message, req.History)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"response": response,
	})
}

func (h *LoveHandler) ChatStream(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req loveChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify exists
	_, err = h.qs.GetLoveProbe(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Transfer-Encoding", "chunked")

	h.qs.ChatLoveStream(c.Request.Context(), uint(id), req.Message, req.History, func(token string) {
		chunk, _ := json.Marshal(gin.H{"content": token})
		fmt.Fprintf(c.Writer, "data: %s\n\n", chunk)
		c.Writer.Flush()
	})

	fmt.Fprintf(c.Writer, "data: [DONE]\n\n")
	c.Writer.Flush()
}
