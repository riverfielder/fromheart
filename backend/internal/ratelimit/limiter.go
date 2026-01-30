package ratelimit

import (
	"context"
	"log"
	"time"
)

// GlobalLimiter 简单的全局限流器，基于 Ticker
type GlobalLimiter struct {
	ticker *time.Ticker
}

// NewGlobalLimiter 创建一个新的限流器
// qps: 每秒允许的请求数
func NewGlobalLimiter(qps int) *GlobalLimiter {
	// 计算间隔。为了安全，稍微增加一点间隔 (e.g. 3QPS -> 340ms)
	interval := time.Duration(1000/qps + 10) * time.Millisecond
	if qps <= 0 {
		interval = time.Hour // Block forever if qps is 0
	}
	
	log.Printf("[RateLimit] Global limit set to %d QPS (interval: %v)", qps, interval)
	
	return &GlobalLimiter{
		ticker: time.NewTicker(interval),
	}
}

// Wait 阻塞直到获取到令牌
// 如果 context 取消，则返回 error
func (l *GlobalLimiter) Wait(ctx context.Context) error {
	select {
	case <-l.ticker.C:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}
