package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"fromheart/internal/adapters/llm"
	"fromheart/internal/db"
	"fromheart/internal/divination"
	"fromheart/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type LoveHandler struct {
	db  *gorm.DB
	llm llm.Client
	qs  *services.QuestionService // Reuse count limits if needed
}

func NewLoveHandler(db *gorm.DB, llm llm.Client, qs *services.QuestionService) *LoveHandler {
	return &LoveHandler{db: db, llm: llm, qs: qs}
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

	// 1. Generate Hexagram based on Story
	// Use story string as seed source by summing char codes or similar hash
	// Or just use divination engine's default random, but user feels "sincere" if it's based on input.
	// Actually, divination.Generate takes a question string and uses it to seed if deterministic mode was on,
	// but currently it uses crypto/rand. Let's stick to standard divination.Generate(req.Story).
	divResult := divination.Generate(req.Story)

	// 2. Call LLM for Analysis
	llmReq := llm.LoveRequest{
		NameA: req.NameA, GenderA: req.GenderA, BirthA: req.BirthDateA,
		NameB: req.NameB, GenderB: req.GenderB, BirthB: req.BirthDateB,
		Story:         req.Story,
		BenGua:        divResult.BenGua,
		BianGua:       divResult.BianGua,
		ChangingLines: divResult.ChangingLines,
	}

	rawAnalysis, err := h.llm.AnalyzeLove(c.Request.Context(), llmReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "AI analysis failed"})
		return
	}

	// Trim Markdown if present
	cleanJSON := strings.TrimPrefix(rawAnalysis, "```json")
	cleanJSON = strings.TrimPrefix(cleanJSON, "```")
	cleanJSON = strings.TrimSuffix(cleanJSON, "```")

	// 3. Save to DB
	probe := db.LoveProbe{
		DeviceHash:    req.DeviceHash,
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

	if err := h.db.Create(&probe).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save record"})
		return
	}

	// Parse JSON to return object, not string
	var finalObj map[string]interface{}
	_ = json.Unmarshal([]byte(cleanJSON), &finalObj)

	c.JSON(http.StatusOK, gin.H{
		"id":       probe.ID,
		"analysis": finalObj,
		"hexagram": divResult.BenGua, // Simplified return
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
