import { supabase } from "@/integrations/supabase/client";

export class EdgeFunctionError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "EdgeFunctionError";
    this.status = status;
  }
}

export async function callEdgeFunction<T = any>(
  functionName: string,
  body: Record<string, unknown>
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(functionName, { body });

  if (error) {
    throw new EdgeFunctionError(error.message || `Edge function "${functionName}" failed`);
  }

  if (data?.error) {
    throw new EdgeFunctionError(data.error, data.status);
  }

  return data as T;
}

// Typed wrappers
export const api = {
  wordpressProxy: (body: { url: string; test?: boolean }) =>
    callEdgeFunction<{ title: string; content: string; excerpt?: string }>("wordpress-proxy", body),

  geminiAnalyze: (body: {
    content: string;
    title: string;
    model: string;
    provider?: string;
    openrouter_api_key?: string;
    num_questions?: number;
    difficulty?: string;
    question_types?: string[];
    language?: string;
  }) =>
    callEdgeFunction<{
      title: string;
      description: string;
      questions: Array<{
        question_text: string;
        question_type: string;
        options: string[];
        correct_answer: string;
        explanation: string;
        difficulty: string;
        points: number;
        bloom_level?: string;
      }>;
    }>("gemini-analyze", body),

  saveQuiz: (body: {
    title: string;
    description?: string;
    questions: any[];
    source_urls?: string[];
    created_by?: string;
    org_id?: string;
    model?: string;
    connection_id?: string;
  }) =>
    callEdgeFunction<{ id: string; title: string; questionCount: number }>("save-quiz", body),

  exportQuizHtml: (body: { quiz_id?: string; quiz_data?: any }) =>
    callEdgeFunction<{ html: string }>("export-quiz-html", body),
};
