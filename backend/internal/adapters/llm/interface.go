package llm

import "context"

type GenerateRequest struct {
	Question      string
	BenGua        string
	BianGua       string
	ChangingLines string
	Context       string // Similar past questions/interpretations
}

type Client interface {
	GenerateAnswer(ctx context.Context, req GenerateRequest) (string, error)
	GeneratePoem(ctx context.Context) (string, error)
	GenerateBlessing(ctx context.Context) (string, error)
	Chat(ctx context.Context, history []map[string]string) (string, error)
	Embed(ctx context.Context, text string) ([]float32, error)
}
