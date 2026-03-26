import { describe, it, expect, beforeEach } from "vitest";
import { useQuizGenerationStore } from "@/stores/quizGenerationStore";

describe("quizGenerationStore", () => {
  beforeEach(() => {
    useQuizGenerationStore.getState().reset();
  });

  it("initializes with default values", () => {
    const state = useQuizGenerationStore.getState();
    expect(state.sourceType).toBe("url");
    expect(state.numQuestions).toBe(10);
    expect(state.difficulty).toBe("medium");
    expect(state.provider).toBe("lovable");
    expect(state.currentStep).toBe(0);
    expect(state.generating).toBe(false);
    expect(state.error).toBeNull();
  });

  it("setField updates a single field", () => {
    const { setField } = useQuizGenerationStore.getState();
    setField("sourceUrl", "https://example.com");
    expect(useQuizGenerationStore.getState().sourceUrl).toBe("https://example.com");
  });

  it("nextStep increments step up to max 4", () => {
    const store = useQuizGenerationStore.getState();
    store.nextStep();
    expect(useQuizGenerationStore.getState().currentStep).toBe(1);
    store.nextStep();
    store.nextStep();
    store.nextStep();
    store.nextStep(); // should cap at 4
    expect(useQuizGenerationStore.getState().currentStep).toBe(4);
  });

  it("prevStep decrements step down to 0", () => {
    const store = useQuizGenerationStore.getState();
    store.setStep(3);
    store.prevStep();
    expect(useQuizGenerationStore.getState().currentStep).toBe(2);
    store.prevStep();
    store.prevStep();
    store.prevStep(); // should stay at 0
    expect(useQuizGenerationStore.getState().currentStep).toBe(0);
  });

  it("reset restores initial state", () => {
    const store = useQuizGenerationStore.getState();
    store.setField("sourceUrl", "https://test.com");
    store.setField("numQuestions", 20);
    store.setField("generating", true);
    store.nextStep();
    store.reset();
    const resetState = useQuizGenerationStore.getState();
    expect(resetState.sourceUrl).toBe("");
    expect(resetState.numQuestions).toBe(10);
    expect(resetState.generating).toBe(false);
    expect(resetState.currentStep).toBe(0);
  });

  it("setStep goes directly to a step", () => {
    useQuizGenerationStore.getState().setStep(3);
    expect(useQuizGenerationStore.getState().currentStep).toBe(3);
  });

  it("handles provider and model changes", () => {
    const { setField } = useQuizGenerationStore.getState();
    setField("provider", "openrouter");
    setField("model", "anthropic/claude-3.5-sonnet");
    const s = useQuizGenerationStore.getState();
    expect(s.provider).toBe("openrouter");
    expect(s.model).toBe("anthropic/claude-3.5-sonnet");
  });
});
