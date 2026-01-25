package llm

import (
	"context"
	"fmt"

	"fromheart/internal/config"
)

type WenxinClient struct {
	apiKey    string
	secretKey string
	model     string
}

func NewWenxinClient(cfg config.Config) *WenxinClient {
	return &WenxinClient{
		apiKey:    cfg.WenxinKey,
		secretKey: cfg.WenxinSecret,
		model:     cfg.WenxinModel,
	}
}

func (w *WenxinClient) GenerateAnswer(ctx context.Context, req GenerateRequest) (string, error) {
	if w.apiKey == "" || w.secretKey == "" {
		return "", fmt.Errorf("missing WENXIN_API_KEY/WENXIN_SECRET_KEY")
	}
	return fmt.Sprintf("本卦：%s\n变卦：%s\n动爻：%s\n解读：请替换为真实文心一言调用结果。", req.BenGua, req.BianGua, req.ChangingLines), nil
}
