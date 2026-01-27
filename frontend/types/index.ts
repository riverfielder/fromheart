export type Output = {
  direct_answer: string;
  summary: string;
  colloquial_explanation?: string;
  advice: string[];
  warnings: string[];
  keywords: string[];
  raw: string;
  ben_gua: string;
  bian_gua: string;
  changing_lines: string;
};

export type Divination = {
  ID: number;
  BenGua: string;
  BianGua: string;
  ChangingLines: string;
  FinalOutput: string;
  RawOutput: string; // Add RawOutput
  daily_question?: {
    QuestionText: string;
  };
  CreatedAt: string;
};

export type AskResponse = {
  result: Output;
  divination_id: number;
  usage_count: number;
};

export type PoemResponse = {
  poem: string;
};

export type UsageResponse = {
  count: number;
};

export type User = {
  id: number;
  username: string;
  birth_date?: string;
  gender?: string;
  mbti?: string;
  zodiac?: string;
};
