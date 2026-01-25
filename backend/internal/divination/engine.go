package divination

import (
	"fmt"
	"math/rand"
	"time"
)

type Result struct {
	BenGua        string
	BianGua       string
	ChangingLines string
	Seed          int64
}

var guaNames = []string{
	"乾", "坤", "屯", "蒙", "需", "讼", "师", "比",
	"小畜", "履", "泰", "否", "同人", "大有", "谦", "豫",
}

func Generate(question string) Result {
	seed := time.Now().UnixNano() + int64(len(question))
	r := rand.New(rand.NewSource(seed))
	ben := guaNames[r.Intn(len(guaNames))]
	bian := guaNames[r.Intn(len(guaNames))]
	lines := r.Intn(6) + 1
	return Result{
		BenGua:        ben,
		BianGua:       bian,
		ChangingLines: "动爻" + fmt.Sprintf("%d", lines),
		Seed:          seed,
	}
}
