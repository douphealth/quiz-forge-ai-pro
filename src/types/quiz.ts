export interface QuizQuestion {
  id?: string;
  question: string;
  question_text?: string;
  options: string[];
  correctAnswer: number;
  correct_answer?: string | null;
  explanation?: string;
  difficulty?: string | null;
  points?: number | null;
  order_index?: number;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string | null;
  questions: QuizQuestion[];
  source_urls?: string[] | null;
  status?: string | null;
  slug?: string | null;
  created_at: string;
  created_by?: string;
  org_id?: string;
}

export interface QuizResult {
  id: string;
  quiz_id: string;
  score: number;
  answers: number[];
  created_at: string;
}
