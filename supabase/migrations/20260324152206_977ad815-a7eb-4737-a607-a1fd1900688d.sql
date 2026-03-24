
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.quiz_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read quizzes" ON public.quizzes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert quizzes" ON public.quizzes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public read quiz_results" ON public.quiz_results FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert quiz_results" ON public.quiz_results FOR INSERT TO anon, authenticated WITH CHECK (true);
