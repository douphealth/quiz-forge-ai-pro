# QuizForge AI

AI-powered quiz generator that connects to WordPress and transforms content into interactive quizzes.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **UI**: shadcn/ui, Framer Motion, Recharts
- **State**: Zustand (client), TanStack Query (server)
- **Backend**: Supabase (PostgreSQL, Edge Functions, Auth)
- **AI**: OpenRouter (Gemini, Claude, GPT, Llama, etc.)
- **Routing**: React Router v6

## Architecture

```
┌─────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React UI  │───▶│ Supabase Edge Fn │───▶│   OpenRouter    │
│  (Vite SPA) │    │                  │    │   (AI Models)   │
└─────────────┘    └──────────────────┘    └─────────────────┘
       │                    │
       │           ┌────────┴─────────┐
       └──────────▶│  Supabase DB     │
                   │  (PostgreSQL)    │
                   └──────────────────┘
```

### Edge Functions

| Function | Purpose |
|----------|---------|
| `wordpress-proxy` | Fetches and parses WordPress REST API content |
| `gemini-analyze` | Generates quiz questions via AI (OpenRouter) |
| `save-quiz` | Persists quiz + questions to database |
| `export-quiz-html` | Generates standalone embeddable HTML quiz |

### Database Tables

- `organizations` — Multi-tenant org support
- `profiles` — User profiles linked to auth.users
- `wp_connections` — WordPress site connections
- `wp_content_cache` — Cached WordPress content
- `quizzes` — Quiz metadata, config, status
- `questions` — Individual quiz questions
- `quiz_sessions` — Quiz attempt records
- `quiz_results` — Legacy results table
- `ai_generation_log` — AI usage tracking
- `activity_log` — User activity audit trail

## Setup

1. Clone the repo
2. `npm install`
3. Connect a Supabase project
4. Set `OPENROUTER_API_KEY` in Supabase Edge Function secrets
5. `npm run dev`

## Features

- 🔗 Connect WordPress sites and browse content
- 🤖 Generate quizzes from any article using 20+ AI models
- ✏️ Inline quiz editor with auto-save
- 📊 Analytics dashboard with charts
- 🎮 Premium quiz-taking experience with timer
- 📋 Export as standalone HTML for any website
- 🌙 Dark mode support
- ⌨️ Command palette (Cmd+K)
