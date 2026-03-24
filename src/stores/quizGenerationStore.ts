import { create } from "zustand";

export type AIProvider = "lovable" | "openrouter";

export interface QuizGenerationConfig {
  // Step 1: Source
  sourceType: "url" | "connection" | "paste";
  sourceUrl: string;
  connectionId: string | null;
  pastedContent: string;
  contentTitle: string;
  contentBody: string;

  // Step 2: Config
  numQuestions: number;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  questionTypes: string[];
  language: string;
  focusTopics: string[];
  provider: AIProvider;
  model: string;
  openrouterApiKey: string;

  // State
  currentStep: number;
  generating: boolean;
  generationStatus: string;
  generatedQuiz: any | null;
  error: string | null;
}

interface QuizGenerationStore extends QuizGenerationConfig {
  setField: <K extends keyof QuizGenerationConfig>(key: K, value: QuizGenerationConfig[K]) => void;
  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: number) => void;
  reset: () => void;
}

const initialState: QuizGenerationConfig = {
  sourceType: "url",
  sourceUrl: "",
  connectionId: null,
  pastedContent: "",
  contentTitle: "",
  contentBody: "",
  numQuestions: 10,
  difficulty: "medium",
  questionTypes: ["multiple_choice"],
  language: "English",
  focusTopics: [],
  provider: "lovable",
  model: "google/gemini-3-flash-preview",
  currentStep: 0,
  generating: false,
  generationStatus: "",
  generatedQuiz: null,
  error: null,
};

export const useQuizGenerationStore = create<QuizGenerationStore>((set) => ({
  ...initialState,
  setField: (key, value) => set({ [key]: value }),
  nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 4) })),
  prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 0) })),
  setStep: (step) => set({ currentStep: step }),
  reset: () => set(initialState),
}));
