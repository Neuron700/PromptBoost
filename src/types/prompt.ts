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

export interface OptimizeResponse {
  optimizedPrompt: string;
  score: number;
  beforeScore: number;
  analysis: Analysis;
  improvements: string[];
  suggestions: string[];
  category: Category;
}

export interface HistoryItem {
  id: string;
  title: string;
  original: string;
  optimized: string;
  category: Category;
  score: number;
  createdAt: string;
}

export interface TemplateItem {
  id: string;
  title: string;
  category: Category;
  description: string;
  prompt: string;
  vars?: { key: string; label: string; placeholder: string }[];
}
