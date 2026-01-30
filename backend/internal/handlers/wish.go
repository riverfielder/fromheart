package handlers

import (
	"net/http"
	"time"

	"fromheart/internal/db"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type WishHandler struct {
	db *gorm.DB
}

func NewWishHandler(db *gorm.DB) *WishHandler {
	return &WishHandler{db: db}
}

func (h *WishHandler) ListWishes(c *gin.Context) {
	var wishes []db.Wish
	// Get last 30 wishes
	if err := h.db.Order("created_at desc").Limit(30).Find(&wishes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch wishes"})
		return
	}
	c.JSON(http.StatusOK, wishes)
}

func (h *WishHandler) CreateWish(c *gin.Context) {
	var req struct {
		Content    string `json:"content" binding:"required,max=140"`
		Type       string `json:"type" binding:"required,oneof=health wealth love study family"`
		DeviceHash string `json:"device_hash"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	wish := db.Wish{
		Content:    req.Content,
		Type:       req.Type,
		DeviceHash: req.DeviceHash,
		CreatedAt:  time.Now(),
	}

	if err := h.db.Create(&wish).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create wish"})
		return
	}

	c.JSON(http.StatusOK, wish)
}

func (h *WishHandler) BlessWish(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Model(&db.Wish{}).Where("id = ?", id).UpdateColumn("blessing_count", gorm.Expr("blessing_count + ?", 1)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to bless"})
		return
	}
	c.Status(http.StatusOK)
}
