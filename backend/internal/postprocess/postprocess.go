package postprocess

import (
	"encoding/json"
	"strings"
)

// Output defines the structure returned to frontend
type Output struct {
	DirectAnswer string   `json:"direct_answer"`
	Summary      string   `json:"summary"` // This is what frontend expects as a string, but LLM might return an object
	Advice       []string `json:"advice"`
	Warnings     []string `json:"warnings"`
	Keywords     []string `json:"keywords"`
	Raw          string   `json:"raw"`
}

// LLMResponse is an intermediate struct to handle potentially complex JSON from LLM
type LLMResponse struct {
	DirectAnswer string      `json:"direct_answer"`
	Summary      interface{} `json:"summary"` // Can be string or object
	Advice       []string    `json:"advice"`
	Warnings     []string    `json:"warnings"`
	Keywords     []string    `json:"keywords"`
}

func Normalize(raw, ben, bian, lines string) Output {
	var llmResp LLMResponse // Intermediate parsing

	cleanRaw := strings.TrimSpace(raw)

	// Robust JSON extraction: Locate the first '{' and the last '}'
	start := strings.Index(cleanRaw, "{")
	end := strings.LastIndex(cleanRaw, "}")
	if start != -1 && end != -1 && end > start {
		cleanRaw = cleanRaw[start : end+1]
	}

	err := json.Unmarshal([]byte(cleanRaw), &llmResp)
	if err == nil {
		finalOutput := Output{
			DirectAnswer: llmResp.DirectAnswer,
			Advice:       llmResp.Advice,
			Warnings:     llmResp.Warnings,
			Keywords:     llmResp.Keywords,
			Raw:          raw,
		}

		// Handle Summary: if it's an object, marshal it back to string; if it's string, use directly
		if summaryStr, ok := llmResp.Summary.(string); ok {
			finalOutput.Summary = summaryStr
		} else {
			// It's likely a map/object, convert to pretty string or just string
			summaryBytes, _ := json.Marshal(llmResp.Summary)
			// Better: try to format it nicely if possible, or just dump it
			// Ideally we want a single string paragraph for the frontend.
			// Let's try to extract values if it's a map, or just dump JSON string
			finalOutput.Summary = string(summaryBytes)

			// If it's a map, let's try to join the values to make it readable text
			if summaryMap, ok := llmResp.Summary.(map[string]interface{}); ok {
				var sb strings.Builder
				for k, v := range summaryMap {
					if strVal, ok := v.(string); ok {
						sb.WriteString(k + ": " + strVal + "\n")
					}
				}
				if sb.Len() > 0 {
					finalOutput.Summary = sb.String()
				}
			}
		}

		if finalOutput.DirectAnswer == "" {
			finalOutput.DirectAnswer = "天机未显，静候缘分。"
		}
		return finalOutput
	}

	// Fallback
	return Output{
		DirectAnswer: "云深不知处，只在此山中。",
		Summary:      raw,
		Advice:       []string{"静观其变"},
		Warnings:     []string{"勿急躁"},
		Keywords:     []string{"待"},
		Raw:          raw,
	}
}
