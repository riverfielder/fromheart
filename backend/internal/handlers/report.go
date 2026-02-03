package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (h *QuestionHandler) GenerateMetaReport(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	report, err := h.service.GenerateMetaReport(c.Request.Context(), userID.(uint))
	if err != nil {
		if err.Error() == "profile_incomplete" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "profile_incomplete", "message": "请先完善MBTI和星座信息"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, report)
}

func (h *QuestionHandler) GetMetaReport(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	report, err := h.service.GetMetaReport(c.Request.Context(), userID.(uint))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not_found"})
		return
	}

	c.JSON(http.StatusOK, report)
}
