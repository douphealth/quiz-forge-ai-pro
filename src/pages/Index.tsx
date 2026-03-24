import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, BookOpen, Brain, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (!url.trim()) {
      toast({ title: "Please enter a WordPress URL", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // Step 1: Fetch content from WordPress
      const { data: wpData, error: wpError } = await supabase.functions.invoke("wordpress-proxy", {
        body: { url: url.trim() },
      });
      if (wpError) throw wpError;

      // Step 2: Generate quiz with Gemini
      const { data: quizData, error: quizError } = await supabase.functions.invoke("gemini-analyze", {
        body: { content: wpData.content, title: wpData.title },
      });
      if (quizError) throw quizError;

      // Step 3: Save quiz
      const { data: savedQuiz, error: saveError } = await supabase.functions.invoke("save-quiz", {
        body: {
          title: quizData.title,
          questions: quizData.questions,
          source_url: url.trim(),
        },
      });
      if (saveError) throw saveError;

      navigate(`/quiz/${savedQuiz.id}`);
    } catch (err: any) {
      toast({
        title: "Failed to generate quiz",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: BookOpen, title: "Paste a URL", desc: "Drop any WordPress article link" },
    { icon: Brain, title: "AI Analyzes", desc: "Gemini extracts key concepts" },
    { icon: Zap, title: "Quiz Ready", desc: "Interactive quiz in seconds" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="container flex items-center justify-between">
          <h1 className="font-display text-xl font-bold tracking-tight text-foreground">
            QuizForge<span className="text-primary">AI</span>
          </h1>
          <Button variant="ghost" size="sm" onClick={() => navigate("/history")}>
            Quiz History
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="container max-w-3xl text-center space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <h2 className="font-display text-5xl font-bold tracking-tight text-foreground leading-tight">
              Turn any article into
              <br />
              <span className="text-primary">an interactive quiz</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Paste a WordPress URL and let AI generate engaging quiz questions instantly.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex gap-3 max-w-lg mx-auto"
          >
            <Input
              placeholder="https://your-wordpress-site.com/article..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              className="h-12 text-base"
              disabled={loading}
            />
            <Button onClick={handleGenerate} disabled={loading} size="lg" className="h-12 px-6 gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {loading ? "Generating..." : "Generate"}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8"
          >
            {features.map((f, i) => (
              <Card key={i} className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-6 text-center space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Index;
