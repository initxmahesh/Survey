export type QuestionType = "text" | "single" | "multi" | "rating";

export interface Condition {
  questionId: string;
  operator: "equals" | "not_equals";
  value: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  options?: string[];
  condition?: Condition | null;
  placeholder?: string;
}

export interface Survey {
  id: string;
  title: string;
  description?: string;
  slug: string;
  status: "draft" | "active" | "closed";
  schema: Question[];
  version: number;
  createdAt: string;
  updatedAt: string;
  responses?: number;
}

export type AnswerValue = string | string[] | number | null;
export type Answers = Record<string, AnswerValue>;

