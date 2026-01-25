package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

func main() {
	apiKey := os.Getenv("WENXIN_API_KEY")
	if apiKey == "" {
		fmt.Println("Error: WENXIN_API_KEY environment variable is not set")
		return
	}

	// Mask key for safety in logs
	maskedKey := apiKey
	if len(apiKey) > 10 {
		maskedKey = apiKey[:5] + "..." + apiKey[len(apiKey)-5:]
	}
	fmt.Printf("Using API Key: %s\n", maskedKey)

	// Check format hint
	if !strings.HasPrefix(apiKey, "bce-v3/") {
		fmt.Println("WARNING: API Key does not start with 'bce-v3/'. If you are using the new ModelBuilder API, the key usually starts with 'bce-v3/'.")
		fmt.Println("If you are using the old AK/SK, this code does not support it.")
	} 

	url := "https://qianfan.baidubce.com/v2/chat/completions"
	model := os.Getenv("WENXIN_MODEL")
	if model == "" {
		model = "ernie-speed-128k" // Default fallback for testing
		fmt.Println("WENXIN_MODEL not set, using default: ernie-speed-128k")
	}

	payload := map[string]interface{}{
		"model": model,
		"messages": []map[string]string{
			{
				"role":    "user",
				"content": "Hello, this is a connection test.",
			},
		},
	}

	jsonData, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))

	req.Header.Set("Content-Type", "application/json")
	// The core authentication part
	req.Header.Set("Authorization", "Bearer "+apiKey)

	fmt.Printf("Sending request to %s...\n", url)
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("Request failed: %v\n", err)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("Response Status: %s\n", resp.Status)
	fmt.Printf("Response Body: %s\n", string(body))
}
