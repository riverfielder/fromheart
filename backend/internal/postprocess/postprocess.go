package postprocess

import "fmt"

type Output struct {
	Summary  string   `json:"summary"`
	Advice   []string `json:"advice"`
	Warnings []string `json:"warnings"`
	Keywords []string `json:"keywords"`
	Raw      string   `json:"raw"`
}

func Normalize(raw, ben, bian, lines string) Output {
	return Output{
		Summary:  fmt.Sprintf("本卦%s，变卦%s，%s指向收敛与观察。", ben, bian, lines),
		Advice:   []string{"放慢节奏", "先稳后动", "留意细节"},
		Warnings: []string{"避免冲动", "勿轻信承诺"},
		Keywords: []string{"守", "缓", "静"},
		Raw:      raw,
	}
}
