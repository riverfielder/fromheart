package handlers

import (
	"net/http"

	"fromheart/internal/queue"

	"github.com/gin-gonic/gin"
)

type TaskHandler struct {
	q *queue.Queue
}

func NewTaskHandler(q *queue.Queue) *TaskHandler {
	return &TaskHandler{q: q}
}

func (h *TaskHandler) GetStatus(c *gin.Context) {
	taskID := c.Param("id")
	if taskID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id required"})
		return
	}

	status, err := h.q.GetStatus(c.Request.Context(), taskID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
		return
	}

	c.JSON(http.StatusOK, status)
}
