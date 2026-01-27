package handlers

import (
	"net/http"
	"strconv"

	"fromheart/internal/services"

	"github.com/gin-gonic/gin"
)

type QuestionHandler struct {
	service *services.QuestionService
}

func NewQuestionHandler(service *services.QuestionService) *QuestionHandler {
	return &QuestionHandler{service: service}
}

type askRequest struct {
	Question   string `json:"question"`
	DeviceHash string `json:"device_hash"`
	Secret     string `json:"secret"`
}

func (h *QuestionHandler) Ask(c *gin.Context) {
	var req askRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.Question == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	if req.DeviceHash == "" {
		req.DeviceHash = "anonymous"
	}

	userIDVal, _ := c.Get("userID")
	var userID *uint
	if id, ok := userIDVal.(uint); ok {
		userID = &id
	}

	resp, err := h.service.Ask(c.Request.Context(), services.AskRequest{
		Question:   req.Question,
		DeviceHash: req.DeviceHash,
		Secret:     req.Secret,
		UserID:     userID,
	})
	if err != nil {
		if err == services.ErrDailyLimitReached {
			c.JSON(http.StatusForbidden, gin.H{"error": "daily_limit_reached", "message": "不可贪念天机"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Fetch updated count to return to frontend
	count, _ := h.service.GetTodayQuestionCount(c.Request.Context(), req.DeviceHash, userID)

	c.JSON(http.StatusOK, gin.H{
		"divination_id": resp.DivinationID,
		"result":        resp.Output,
		"usage_count":   count,
	})
}

func (h *QuestionHandler) GetDivination(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	div, err := h.service.GetDivination(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, div)
}

func (h *QuestionHandler) History(c *gin.Context) {
	deviceHash := c.Query("device_hash")

	userIDVal, _ := c.Get("userID")
	var userID *uint
	if id, ok := userIDVal.(uint); ok {
		userID = &id
	}

	if deviceHash == "" && userID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "device_hash required"})
		return
	}

	history, err := h.service.History(c.Request.Context(), deviceHash, userID, 50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": history})
}

func (h *QuestionHandler) GetUsage(c *gin.Context) {
	device := c.Query("device_hash")
	userIDVal, _ := c.Get("userID")
	var userID *uint
	if id, ok := userIDVal.(uint); ok {
		userID = &id
	}

	if device == "" && userID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "device_hash required"})
		return
	}
	count, err := h.service.GetTodayQuestionCount(c.Request.Context(), device, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"count": count})
}

func (h *QuestionHandler) GetBlessing(c *gin.Context) {
	blessing, err := h.service.GetBlessing(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"blessing": blessing})
}

func (h *QuestionHandler) GetPoem(c *gin.Context) {
	poem, err := h.service.GetDailyPoem(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"poem": poem})
}
