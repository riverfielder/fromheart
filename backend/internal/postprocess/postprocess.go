package postprocess

import (
	"encoding/json"
	"strings"
)

type Output struct {
	DirectAnswer string   `json:"direct_answer"`
	Summary      string   `json:"summary"`
	Advice       []string `json:"advice"`
	Warnings     []string `json:"warnings"`
	Keywords     []string `json:"keywords"`
	Raw          string   `json:"raw"`
}

func Normalize(raw, ben, bian, lines string) Output {
	var parsed Output // Try to parse raw as JSON

	cleanRaw := strings.TrimSpace(raw)
	if strings.HasPrefix(cleanRaw, "```json") {
		cleanRaw = strings.TrimPrefix(cleanRaw, "```json")
		cleanRaw = strings.TrimSuffix(cleanRaw, "```")
	} else if strings.HasPrefix(cleanRaw, "```") {
		cleanRaw = strings.TrimPrefix(cleanRaw, "```")
		cleanRaw = strings.TrimSuffix(cleanRaw, "```")
	}
	cleanRaw = strings.TrimSpace(cleanRaw)

	err := json.Unmarshal([]byte(cleanRaw), &parsed)
	if err == nil {
		parsed.Raw = raw
		if parsed.DirectAnswer == "" {
			parsed.DirectAnswer = "天机未显，静候缘分。"
		}
		return parsed
	}

	return Output{
		DirectAnswer: "云深不知处，只在此山中。",
		Summary:      raw,
		Advice:       []string{"静观其变"},
		Warnings:     []string{"勿急躁"},
		Keywords:     []string{"待"},
		Raw:          raw,
	}
}
