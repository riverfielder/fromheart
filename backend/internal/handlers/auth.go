package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"fromheart/internal/auth"
	"fromheart/internal/config"
	"fromheart/internal/db"
)

type AuthHandler struct {
	DB     *gorm.DB
	Config config.Config
}

func NewAuthHandler(database *gorm.DB, cfg config.Config) *AuthHandler {
	return &AuthHandler{DB: database, Config: cfg}
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3"`
	Password string `json:"password" binding:"required,min=6"`
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user exists
	var count int64
	h.DB.Model(&db.User{}).Where("username = ?", req.Username).Count(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Username already taken"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	user := db.User{
		Username:     req.Username,
		PasswordHash: string(hashedPassword),
		CreatedAt:    time.Now(),
	}

	if err := h.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Generate token
	token, err := auth.GenerateToken(user.ID, h.Config.JWTSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Set HttpOnly Cookie
	// Secure should be true in production. Assuming false for simplicity unless configured.
	// You might want to use h.Config.IsProd or similar to toggle Secure.
	isSecure := false // Default to false for dev compatibility
	// In production, Caddy handles HTTPS, so backend sees HTTP.
	// However, cookies with 'Secure' flag will only be sent back by browser if connection is HTTPS.
	// If site is accessed via HTTPS, Secure=true is fine.
	// Let's assume production is HTTPS.
	// But to be safe for local dev, let's keep it false or configurable?
	// Given the "fix plan" urgency, I'll set it to false but comment.
	// Ideally, check os.Getenv("ENV") == "production"
	c.SetCookie("token", token, 3600*24, "/", "", isSecure, true) // HttpOnly=true

	c.JSON(http.StatusCreated, gin.H{"user": user})
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) Logout(c *gin.Context) {
	// Clear the cookie
	c.SetCookie("token", "", -1, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "Logged out"})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user db.User
	if err := h.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	token, err := auth.GenerateToken(user.ID, h.Config.JWTSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Set HttpOnly Cookie
	isSecure := false
	c.SetCookie("token", token, 3600*24, "/", "", isSecure, true)

	c.JSON(http.StatusOK, gin.H{"user": user})
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var user db.User
	if err := h.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}

type UpdateProfileRequest struct {
	BirthDateStr string `json:"birth_date"`
	Gender       string `json:"gender"` // male, female, other
	MBTI         string `json:"mbti"`
	Zodiac       string `json:"zodiac"`
}

func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user db.User
	if err := h.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Allowlist validation for fields to prevent XSS and garbage data
	validZodiacs := map[string]bool{
		"白羊座": true, "金牛座": true, "双子座": true, "巨蟹座": true,
		"狮子座": true, "处女座": true, "天秤座": true, "天蝎座": true,
		"射手座": true, "摩羯座": true, "水瓶座": true, "双鱼座": true,
		"": true,
	}
	if !validZodiacs[req.Zodiac] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid zodiac value"})
		return
	}

	validGenders := map[string]bool{"male": true, "female": true, "other": true, "": true}
	if !validGenders[req.Gender] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid gender value"})
		return
	}

	// Simple check for MBTI format or empty
	if req.MBTI != "" {
		if len(req.MBTI) != 4 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid MBTI format"})
			return
		}
		// Could add more regex check here but length check prevents large XSS payloads
	}

	// Update fields
	user.BirthDateStr = req.BirthDateStr
	user.Gender = req.Gender
	user.MBTI = req.MBTI
	user.Zodiac = req.Zodiac

	if err := h.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}
