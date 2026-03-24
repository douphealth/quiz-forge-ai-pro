QuizForge AI - WordPress quiz generator using Supabase Edge Functions + OpenRouter AI

## Constraints
- Use Supabase for ALL backend (NOT Lovable Cloud)
- Edge Functions for server-side logic (Deno)
- Secrets: OPENROUTER_API_KEY stored as Supabase secret
- AI provider: OpenRouter (NOT Gemini directly, NOT Lovable AI)

## Design
- Primary: 262 83% 58% (purple)
- Accent: 172 66% 50% (teal)
- Fonts: Space Grotesk (display), Inter (body)
- Success: 152 69% 41%, Warning: 38 92% 50%

## Architecture
- wordpress-proxy: fetches WP REST API content
- gemini-analyze: generates quiz via OpenRouter API
- save-quiz: persists to quizzes table
- Tables: quizzes, quiz_results (public RLS for now)
