import { describe, it, expect } from "vitest";
import {
  connectionFormSchema,
  quizConfigSchema,
  loginSchema,
  signupSchema,
  quizSettingsSchema,
} from "@/lib/validations";

describe("connectionFormSchema", () => {
  it("accepts valid input", () => {
    const result = connectionFormSchema.safeParse({
      site_url: "https://example.com",
      site_name: "My Site",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid URL", () => {
    const result = connectionFormSchema.safeParse({
      site_url: "not-a-url",
      site_name: "My Site",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty site_name", () => {
    const result = connectionFormSchema.safeParse({
      site_url: "https://example.com",
      site_name: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("quizConfigSchema", () => {
  it("accepts valid config", () => {
    const result = quizConfigSchema.safeParse({
      num_questions: 10,
      difficulty: "medium",
      question_types: ["multiple_choice"],
      language: "English",
    });
    expect(result.success).toBe(true);
  });

  it("rejects too few questions", () => {
    const result = quizConfigSchema.safeParse({
      num_questions: 2,
      difficulty: "medium",
      question_types: ["multiple_choice"],
      language: "English",
    });
    expect(result.success).toBe(false);
  });

  it("rejects too many questions", () => {
    const result = quizConfigSchema.safeParse({
      num_questions: 100,
      difficulty: "hard",
      question_types: ["multiple_choice"],
      language: "English",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty question_types", () => {
    const result = quizConfigSchema.safeParse({
      num_questions: 10,
      difficulty: "easy",
      question_types: [],
      language: "English",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid difficulty", () => {
    const result = quizConfigSchema.safeParse({
      num_questions: 10,
      difficulty: "impossible",
      question_types: ["multiple_choice"],
      language: "English",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "123456" });
    expect(result.success).toBe(true);
  });

  it("rejects short password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "123" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-email", password: "123456" });
    expect(result.success).toBe(false);
  });
});

describe("signupSchema", () => {
  it("accepts matching passwords", () => {
    const result = signupSchema.safeParse({
      email: "test@test.com",
      password: "123456",
      confirm_password: "123456",
      full_name: "Test User",
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = signupSchema.safeParse({
      email: "test@test.com",
      password: "123456",
      confirm_password: "654321",
      full_name: "Test User",
    });
    expect(result.success).toBe(false);
  });
});

describe("quizSettingsSchema", () => {
  it("accepts valid settings", () => {
    const result = quizSettingsSchema.safeParse({
      shuffle_questions: true,
      shuffle_answers: true,
      show_correct_answers: true,
      show_explanations: true,
      passing_score_percent: 70,
      visibility: "public",
    });
    expect(result.success).toBe(true);
  });

  it("rejects passing_score out of range", () => {
    const result = quizSettingsSchema.safeParse({
      passing_score_percent: 150,
    });
    expect(result.success).toBe(false);
  });
});
