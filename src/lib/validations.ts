import { z } from "zod";

export const connectionFormSchema = z.object({
  site_url: z.string().url("Please enter a valid URL"),
  site_name: z.string().min(1, "Site name is required").max(100),
  auth_type: z.enum(["none", "basic", "application_password"]).default("none"),
  credentials: z.string().optional(),
});

export const quizConfigSchema = z.object({
  num_questions: z.number().min(5, "Minimum 5 questions").max(50, "Maximum 50 questions"),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]),
  question_types: z.array(z.string()).min(1, "Select at least one question type"),
  language: z.string().min(1, "Language is required").default("English"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirm_password: z.string().min(6),
  full_name: z.string().min(1, "Full name is required").max(100),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

export const quizSettingsSchema = z.object({
  time_limit_minutes: z.number().min(1).max(180).nullable().optional(),
  shuffle_questions: z.boolean().default(true),
  shuffle_answers: z.boolean().default(true),
  show_correct_answers: z.boolean().default(true),
  show_explanations: z.boolean().default(true),
  passing_score_percent: z.number().min(0).max(100).default(70),
  max_attempts: z.number().min(1).max(100).nullable().optional(),
  visibility: z.enum(["private", "org", "public", "link_only"]).default("private"),
});

export type ConnectionFormValues = z.infer<typeof connectionFormSchema>;
export type QuizConfigValues = z.infer<typeof quizConfigSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;
export type QuizSettingsValues = z.infer<typeof quizSettingsSchema>;
