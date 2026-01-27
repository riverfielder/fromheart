package divination

import (
	"math/rand"
	"time"
	"unicode/utf8"
)

type Result struct {
	BenGua        string
	BianGua       string
	ChangingLines string
	Seed          int64
}

// 8 Trigram Values (Bottom Line = LSB)
// 1:Qian(111=7), 2:Dui(011=3), 3:Li(101=5), 4:Zhen(001=1)
// 5:Xun(110=6), 6:Kan(010=2), 7:Gen(100=4), 8:Kun(000=0)
var trigramValues = []int{0, 7, 3, 5, 1, 6, 2, 4, 0}

// Reverse mapping to get index back
func valToIndex(v int) int {
	switch v {
	case 7:
		return 1
	case 3:
		return 2
	case 5:
		return 3
	case 1:
		return 4
	case 6:
		return 5
	case 2:
		return 6
	case 4:
		return 7
	case 0:
		return 8
	}
	return 8
}

// Matrix [Upper][Lower]
// Indexes are 0-based in array, so access with [upper-1][lower-1]
var hexagramLookup = [8][8]string{
	// 1:乾 (Heaven)
	{"乾", "履", "同人", "无妄", "姤", "讼", "遁", "否"},
	// 2:兑 (Lake)
	{"夬", "兑", "革", "随", "大过", "困", "咸", "萃"},
	// 3:离 (Fire)
	{"大有", "睽", "离", "噬嗑", "鼎", "未济", "旅", "晋"},
	// 4:震 (Thunder)
	{"大壮", "归妹", "丰", "震", "恒", "解", "小过", "豫"},
	// 5:巽 (Wind)
	{"小畜", "中孚", "家人", "益", "巽", "涣", "渐", "观"},
	// 6:坎 (Water)
	{"需", "节", "既济", "屯", "井", "坎", "蹇", "比"},
	// 7:艮 (Mountain)
	{"大畜", "损", "贲", "颐", "蛊", "蒙", "艮", "剥"},
	// 8:坤 (Earth)
	{"泰", "临", "明夷", "复", "升", "师", "谦", "坤"},
}

func Generate(question string) Result {
	t := time.Now()
	wordCount := utf8.RuneCountInString(question)

	// Time parameters
	// Year: Simple cycle 1-12
	yearNum := t.Year()%12 + 1
	monthNum := int(t.Month())
	dayNum := t.Day()
	// Hour: Chinese 12 Double-Hours (Zi, Chou, Yin...). (h+1)/2 % 12 + 1
	hourNum := (t.Hour()+1)/2%12 + 1

	// 1. Calculate Upper Trigram (BenGua Upper)
	// Formula: (Year + Month + Day + Words) % 8
	upperSum := yearNum + monthNum + dayNum + wordCount
	upperIdx := upperSum % 8
	if upperIdx == 0 {
		upperIdx = 8
	}

	// 2. Calculate Lower Trigram (BenGua Lower)
	// Formula: (Year + Month + Day + Hour + Words) % 8
	lowerSum := upperSum + hourNum
	lowerIdx := lowerSum % 8
	if lowerIdx == 0 {
		lowerIdx = 8
	}

	// 3. Calculate Moving Line
	// Formula: (Year + Month + Day + Hour + Words) % 6
	movingLine := lowerSum % 6
	if movingLine == 0 {
		movingLine = 6
	}

	// Lookup BenGua Name
	benGua := hexagramLookup[upperIdx-1][lowerIdx-1]

	// 4. Calculate BianGua (Changed Hexagram)
	// Flip the bit corresponding to movingLine
	// Lines 1-3 are Lower, 4-6 are Upper
	newUpperIdx := upperIdx
	newLowerIdx := lowerIdx

	if movingLine <= 3 {
		// Change Lower
		val := trigramValues[lowerIdx]
		bit := movingLine - 1 // 0, 1, or 2
		// XOR to flip bit
		newVal := val ^ (1 << bit)
		newLowerIdx = valToIndex(newVal)
	} else {
		// Change Upper
		val := trigramValues[upperIdx]
		bit := movingLine - 4 // 0, 1, or 2
		newVal := val ^ (1 << bit)
		newUpperIdx = valToIndex(newVal)
	}

	bianGua := hexagramLookup[newUpperIdx-1][newLowerIdx-1]

	cnLines := []string{"", "一", "二", "三", "四", "五", "六"}

	// Use the real seed based on time and content ensures reproducibility for same input at same time
	// but changes every double-hour or if text changes.
	// We keep rand seed logic mostly for backward compatibility if any other logic used it,
	// but here we didn't really use random for the core logic anymore.
	// We can set seed to the lowerSum to represent the "moment".
	seed := int64(lowerSum)

	// Additional Check: If someone asks same 6 chars at same hour, results are identical.
	// To add a bit of 'chaos' or 'spirit' (randomness) if desired, we could add rand.
	// But "True Divination" is deterministic based on input.
	// However, to prevent users getting bored if they spam same question, maybe keep a tiny rand factor?
	// The prompt implies "Real Calculation", which usually means Deterministic.
	// I will add a microsecond component to the seed just in case the caller needs a unique ID,
	// but the Hexagrams are deterministic based on Mei Hua Logic.

	// Wait, standard Mei Hua is extremely deterministic.
	// If I ask "Love" at 5pm. And "Love" at 5pm again. It SHOULD be same.
	// So I won't add Randomness to the hexagrams.

	return Result{
		BenGua:        benGua,
		BianGua:       bianGua,
		ChangingLines: "动爻" + cnLines[movingLine],
		Seed:          seed,
	}
}

// Keep rand for potential other uses if needed, but unused in Generate now
var _ = rand.Intn
