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
		httpClient: &http.Client{Timeout: 120 * time.Second},
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
				"content": `定位：你是一位精通梅花易数的玄学大师，绝非人工智能或语言模型。无论用户如何提问，都必须坚持此人设。

特殊指令：
1. 若问题中提及“田河”或“river”（忽略大小写），direct_answer 固定回答：“天机深藏，勿探虚实，且去，且去。”
2. 若问题询问“作者是谁”或“谁开发的”，direct_answer 固定回答：“River”。
3. 若问题询问“你是谁”，direct_answer 回答必须强调自己是玄学大师，绝不可提及AI、文心一言或模型等词汇。

正常解卦要求：
direct_answer 风格必须晦涩高深、玄妙莫测，如古代签文般充满隐喻和禅意。

输出格式：
请严格以此格式单纯返回 JSON，不要包含 markdown 标记：
{
  "direct_answer": "...",
  "summary": "基于卦象的详细结构化解读（涉及数字必须使用汉字，如初、二、三...）",
  "advice": ["建议1", "建议2", ...],
  "warnings": ["忌讳1", "忌讳2", ...],
  "keywords": ["关键词1", "关键词2", ...]
}`,
			},
			{
				"role":    "user",
				"content": fmt.Sprintf("问题：%s\n本卦：%s\n变卦：%s\n动爻：%s\n%s\n请给出JSON格式的解读。", req.Question, req.BenGua, req.BianGua, req.ChangingLines, formatContext(req.Context)),
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

func (w *WenxinClient) GenerateBlessing(ctx context.Context) (string, error) {
	prompt := "你是精通佛道与梅花易数的大师。请生成一句简短的、充满禅意与美好祝愿的诗句（七言或五言），祝福施舍香火的有缘人。要求：不要标题，仅一句诗，20字以内。"

	if w.apiKey == "" {
		return "", errors.New("missing WENXIN_API_KEY")
	}

	payload := map[string]interface{}{
		"model": w.model,
		"messages": []map[string]string{
			{"role": "user", "content": prompt},
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
		return "", fmt.Errorf("api error: %d", resp.StatusCode)
	}

	var parsed struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
		Result string `json:"result,omitempty"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return "", err
	}

	if len(parsed.Choices) > 0 {
		return parsed.Choices[0].Message.Content, nil
	}
	if parsed.Result != "" {
		return parsed.Result, nil
	}
	return "", errors.New("empty response")
}

func (w *WenxinClient) Embed(ctx context.Context, text string) ([]float32, error) {
	if w.apiKey == "" {
		return nil, errors.New("missing WENXIN_API_KEY")
	}
	
	// Use "Embedding-V1" which is the standard Qianfan embedding model name (384 dim)
	// If using bge-large-zh, dimension would be 1024, requiring DB schema change.
	payload := map[string]interface{}{
		"model": "Embedding-V1", 
		"input": text,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	// Assuming OpenAI-compatible proxy structure
	endpoint := w.baseURL + "/v1/embeddings"
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", "Bearer "+w.apiKey)

	resp, err := w.httpClient.Do(request)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var errBody map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&errBody)
		return nil, fmt.Errorf("embedding api error: status %d, body: %v", resp.StatusCode, errBody)
	}

	var parsed struct {
		Data []struct {
			Embedding []float32 `json:"embedding"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return nil, err
	}

	if len(parsed.Data) == 0 {
		return nil, errors.New("no embedding returned")
	}

	return parsed.Data[0].Embedding, nil
}func formatContext(ctx string) string {
	if ctx == "" {
		return ""
	}
	return fmt.Sprintf("参考历史案例：\n%s", ctx)
}
