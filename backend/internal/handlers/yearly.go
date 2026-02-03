package handlers

import (
	"net/http"
	"fromheart/internal/services"
	"github.com/gin-gonic/gin"
)

func (h *QuestionHandler) GetYearlyFortune(c *gin.Context) {
	var req services.YearlyForecastRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	fortune, err := h.service.CalculateYearlyFortune(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Helper struct/map could be used if we don't want to expose DB model directly,
	// but for now, exposing the struct is fine as it's just JSON.
	c.JSON(http.StatusOK, fortune)
}
