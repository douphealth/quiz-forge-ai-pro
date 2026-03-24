import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface GenerateQuizInput {
  content: string;
  title: string;
  model: string;
  provider?: string;
  openrouter_api_key?: string;
  num_questions?: number;
  difficulty?: string;
  question_types?: string[];
  language?: string;
}

export function useGenerateQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GenerateQuizInput) => api.geminiAnalyze(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
    },
  });
}
