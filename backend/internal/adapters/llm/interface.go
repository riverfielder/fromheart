package llm

import "context"

type GenerateRequest struct {
	Question      string
	BenGua        string
	BianGua       string
	ChangingLines string
}

type Client interface {
	GenerateAnswer(ctx context.Context, req GenerateRequest) (string, error)
	GeneratePoem(ctx context.Context) (string, error)
}
