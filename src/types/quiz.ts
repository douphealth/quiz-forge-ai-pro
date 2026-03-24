export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  source_url: string | null;
  created_at: string;
}

export interface QuizResult {
  id: string;
  quiz_id: string;
  score: number;
  answers: number[];
  created_at: string;
}
