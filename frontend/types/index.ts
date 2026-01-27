export type Output = {
  direct_answer: string;
  summary: string;
  advice: string[];
  warnings: string[];
  keywords: string[];
  raw: string;
};

export type Divination = {
  ID: number;
  BenGua: string;
  BianGua: string;
  ChangingLines: string;
  FinalOutput: string;
  daily_question?: {
    QuestionText: string;
  };
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
