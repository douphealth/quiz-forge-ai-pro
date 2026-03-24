import { create } from "zustand";

interface QuizSessionState {
  currentQuestionIndex: number;
  answers: (number | string | null)[];
  timeRemaining: number | null;
  isSubmitted: boolean;
  startTime: number;

  // Actions
  initSession: (totalQuestions: number, timeLimitSeconds?: number | null) => void;
  nextQuestion: (total: number) => void;
  prevQuestion: () => void;
  goToQuestion: (index: number) => void;
  selectAnswer: (questionIndex: number, answer: number | string) => void;
  submitQuiz: () => void;
  tick: () => boolean; // returns true if timer hit 0
  resetSession: () => void;
}

export const useQuizSessionStore = create<QuizSessionState>((set, get) => ({
  currentQuestionIndex: 0,
  answers: [],
  timeRemaining: null,
  isSubmitted: false,
  startTime: Date.now(),

  initSession: (totalQuestions, timeLimitSeconds) =>
    set({
      currentQuestionIndex: 0,
      answers: Array(totalQuestions).fill(null),
      timeRemaining: timeLimitSeconds || null,
      isSubmitted: false,
      startTime: Date.now(),
    }),

  nextQuestion: (total) =>
    set((s) => ({
      currentQuestionIndex: Math.min(s.currentQuestionIndex + 1, total - 1),
    })),

  prevQuestion: () =>
    set((s) => ({
      currentQuestionIndex: Math.max(s.currentQuestionIndex - 1, 0),
    })),

  goToQuestion: (index) => set({ currentQuestionIndex: index }),

  selectAnswer: (questionIndex, answer) =>
    set((s) => {
      const newAnswers = [...s.answers];
      newAnswers[questionIndex] = answer;
      return { answers: newAnswers };
    }),

  submitQuiz: () => set({ isSubmitted: true }),

  tick: () => {
    const state = get();
    if (state.timeRemaining === null || state.timeRemaining <= 0) return state.timeRemaining === 0;
    const next = state.timeRemaining - 1;
    set({ timeRemaining: next });
    return next === 0;
  },

  resetSession: () =>
    set({
      currentQuestionIndex: 0,
      answers: [],
      timeRemaining: null,
      isSubmitted: false,
      startTime: Date.now(),
    }),
}));
