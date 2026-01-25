package llm

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"fromheart/internal/config"
)

type WenxinClient struct {
	apiKey     string
	model      string
	baseURL    string
	httpClient *http.Client
}

func NewWenxinClient(cfg config.Config) *WenxinClient {
	baseURL := cfg.WenxinBaseURL
	if baseURL == "" {
		baseURL = "https://qianfan.baidubce.com"
	}
	return &WenxinClient{
		apiKey:     cfg.WenxinKey,
		model:      cfg.WenxinModel,
		baseURL:    baseURL,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

func (w *WenxinClient) GenerateAnswer(ctx context.Context, req GenerateRequest) (string, error) {
	if w.apiKey == "" {
		return "", errors.New("missing WENXIN_API_KEY")
	}
	if w.model == "" {
		return "", errors.New("missing WENXIN_MODEL")
	}

	payload := map[string]interface{}{
		"model": w.model,
		"messages": []map[string]string{
			{
				"role": "system",
				"content": `你是严谨的易经与梅花易数解读助手。请以此格式单纯返回JSON，不要包含markdown标记：
{
  "direct_answer": "针对问题的直接回应。风格必须晦涩高深、玄妙莫测，如古代签文般充满隐喻和禅意、似是而非，切勿直白，一两句即可",
  "summary": "基于卦象的详细结构化解读",
  "advice": ["建议1", "建议2", ...],
  "warnings": ["忌讳1", "忌讳2", ...],
  "keywords": ["关键词1", "关键词2", ...]
}`,
			},
			{
				"role":    "user",
				"content": fmt.Sprintf("问题：%s\n本卦：%s\n变卦：%s\n动爻：%s\n请给出JSON格式的解读。", req.Question, req.BenGua, req.BianGua, req.ChangingLines),
			},
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	endpoint := w.baseURL + "/v2/chat/completions"
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", "Bearer "+w.apiKey)

	resp, err := w.httpClient.Do(request)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var errBody map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&errBody)
		return "", fmt.Errorf("wenxin api error: status %d, body: %v", resp.StatusCode, errBody)
	}

	var parsed struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return "", err
	}
	if len(parsed.Choices) == 0 {
		return "", errors.New("empty choices")
	}
	return parsed.Choices[0].Message.Content, nil
}

func (w *WenxinClient) GeneratePoem(ctx context.Context) (string, error) {
	if w.apiKey == "" {
		return "", errors.New("missing WENXIN_API_KEY")
	}
	if w.model == "" {
		return "", errors.New("missing WENXIN_MODEL")
	}

	payload := map[string]interface{}{
		"model": w.model,
		"messages": []map[string]string{
			{
				"role":    "system",
				"content": "你是一位精通古诗词的诗人。",
			},
			{
				"role":    "user",
				"content": "请创作一句对仗工整的七言或五言古诗联句（仅两句），不要标题，不要解析，意境优美，富有哲理。",
			},
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	endpoint := w.baseURL + "/v2/chat/completions"
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", "Bearer "+w.apiKey)

	resp, err := w.httpClient.Do(request)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var errBody map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&errBody)
		return "", fmt.Errorf("wenxin api error: status %d, body: %v", resp.StatusCode, errBody)
	}

	var parsed struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return "", err
	}
	if len(parsed.Choices) == 0 {
		return "", errors.New("empty choices")
	}
	return parsed.Choices[0].Message.Content, nil
}
