export type Category =
  | "coding"
  | "writing"
  | "research"
  | "marketing"
  | "education"
  | "image"
  | "data"
  | "business"
  | "general";

export type OutputMode = "detailed" | "balanced" | "minimal";

export interface OptimizeRequest {
  prompt: string;
  category: Category;
  outputMode: OutputMode;
}

export interface Analysis {
  clarity: number;
  context: number;
  specificity: number;
  constraints: number;
  outputFormat: number;
}

export type WordTagKind = "claim" | "owner" | "file" | "approval" | "vague";

export interface WordTag {
  word: string;
  index: number;
  tag: WordTagKind;
  reason: string;
  suggestion: string;
}

export interface SpiderStage {
  name: string;
  detail: string;
  status: "done" | "active" | "idle";
}

export const SPIDER_STAGES = ["ROLE", "OBJECTIVE", "CONTEXT", "RULES", "REVIEW", "SHIP"] as const;

export interface OptimizeResponse {
  optimizedPrompt: string;
  score: number;
  beforeScore: number;
  analysis: Analysis;
  improvements: string[];
  suggestions: string[];
  category: Category;
  stages?: SpiderStage[];
  tags?: WordTag[];
}

export interface HistoryItem {
  id: string;
  title: string;
  original: string;
  optimized: string;
  category: Category;
  score: number;
  createdAt: string;
  stages?: SpiderStage[];
  tags?: WordTag[];
}

export interface TemplateItem {
  id: string;
  title: string;
  category: Category;
  description: string;
  prompt: string;
  vars?: { key: string; label: string; placeholder: string }[];
}
