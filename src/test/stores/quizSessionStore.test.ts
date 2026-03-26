import { describe, it, expect, beforeEach } from "vitest";
import { useQuizSessionStore } from "@/stores/quizSessionStore";

describe("quizSessionStore", () => {
  beforeEach(() => {
    useQuizSessionStore.getState().resetSession();
  });

  it("initSession creates empty answers array", () => {
    useQuizSessionStore.getState().initSession(5);
    const state = useQuizSessionStore.getState();
    expect(state.answers).toHaveLength(5);
    expect(state.answers.every((a) => a === null)).toBe(true);
    expect(state.currentQuestionIndex).toBe(0);
    expect(state.isSubmitted).toBe(false);
  });

  it("initSession with timer sets timeRemaining", () => {
    useQuizSessionStore.getState().initSession(3, 120);
    expect(useQuizSessionStore.getState().timeRemaining).toBe(120);
  });

  it("initSession without timer leaves timeRemaining null", () => {
    useQuizSessionStore.getState().initSession(3);
    expect(useQuizSessionStore.getState().timeRemaining).toBeNull();
  });

  it("nextQuestion increments within bounds", () => {
    const store = useQuizSessionStore.getState();
    store.initSession(3);
    store.nextQuestion(3);
    expect(useQuizSessionStore.getState().currentQuestionIndex).toBe(1);
    store.nextQuestion(3);
    store.nextQuestion(3); // should cap at 2
    expect(useQuizSessionStore.getState().currentQuestionIndex).toBe(2);
  });

  it("prevQuestion decrements within bounds", () => {
    const store = useQuizSessionStore.getState();
    store.initSession(3);
    store.nextQuestion(3);
    store.nextQuestion(3);
    store.prevQuestion();
    expect(useQuizSessionStore.getState().currentQuestionIndex).toBe(1);
    store.prevQuestion();
    store.prevQuestion(); // should stay at 0
    expect(useQuizSessionStore.getState().currentQuestionIndex).toBe(0);
  });

  it("selectAnswer updates the correct index", () => {
    const store = useQuizSessionStore.getState();
    store.initSession(3);
    store.selectAnswer(1, 2);
    expect(useQuizSessionStore.getState().answers[1]).toBe(2);
    expect(useQuizSessionStore.getState().answers[0]).toBeNull();
  });

  it("submitQuiz sets isSubmitted", () => {
    const store = useQuizSessionStore.getState();
    store.initSession(3);
    store.submitQuiz();
    expect(useQuizSessionStore.getState().isSubmitted).toBe(true);
  });

  it("tick decrements timeRemaining and returns true at zero", () => {
    const store = useQuizSessionStore.getState();
    store.initSession(3, 2);
    const atZero1 = store.tick();
    expect(atZero1).toBe(false);
    expect(useQuizSessionStore.getState().timeRemaining).toBe(1);
    const atZero2 = useQuizSessionStore.getState().tick();
    expect(atZero2).toBe(true);
    expect(useQuizSessionStore.getState().timeRemaining).toBe(0);
  });

  it("tick with no timer returns false", () => {
    const store = useQuizSessionStore.getState();
    store.initSession(3);
    expect(store.tick()).toBe(false);
  });

  it("goToQuestion jumps to specific index", () => {
    const store = useQuizSessionStore.getState();
    store.initSession(5);
    store.goToQuestion(3);
    expect(useQuizSessionStore.getState().currentQuestionIndex).toBe(3);
  });
});
