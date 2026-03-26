import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, BookOpen, Brain, ArrowRight, Loader2, Settings2, Key, Eye, EyeOff, Sparkles, Shield, Globe, CheckCircle2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import heroIllustration from "@/assets/hero-illustration.png";

type Provider = "openrouter" | "gemini" | "claude";
const OPENROUTER_STORAGE_KEY = "quizforge_openrouter_api_key";

const PRESET_MODELS: Record<Provider, { label: string; models: { value: string; label: string }[] }> = {
  openrouter: {
    label: "OpenRouter",
    models: [
      { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash ⚡" },
      { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro 🏆" },
      { value: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4" },
      { value: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
      { value: "openai/gpt-4o", label: "GPT-4o" },
      { value: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
      { value: "meta-llama/llama-3.1-70b-instruct", label: "Llama 3.1 70B" },
      { value: "custom", label: "✏️ Custom model..." },
    ],
  },
  gemini: {
    label: "Google Gemini",
    models: [
      { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash ⚡" },
      { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro 🏆" },
      { value: "google/gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    ],
  },
  claude: {
    label: "Anthropic Claude",
    models: [
      { value: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4" },
      { value: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
      { value: "anthropic/claude-3-haiku", label: "Claude 3 Haiku" },
    ],
  },
};

const Index = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<Provider>("openrouter");
  const [selectedModel, setSelectedModel] = useState("google/gemini-2.5-flash");
  const [customModel, setCustomModel] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const effectiveModel = selectedModel === "custom" ? customModel : selectedModel;

  useEffect(() => {
    const storedKey = localStorage.getItem(OPENROUTER_STORAGE_KEY);
    if (storedKey) setApiKey(storedKey);
  }, []);

  const handleProviderChange = (p: Provider) => {
    setProvider(p);
    setSelectedModel(PRESET_MODELS[p].models[0].value);
    setCustomModel("");
  };

  const handleGenerate = async () => {
    if (!url.trim()) {
      toast({ title: "Please enter a WordPress URL", variant: "destructive" });
      return;
    }
    if (!effectiveModel.trim()) {
      toast({ title: "Please select or enter a model", variant: "destructive" });
      return;
    }

    const trimmedApiKey = apiKey.trim();

    setLoading(true);
    try {
      if (trimmedApiKey) {
        localStorage.setItem(OPENROUTER_STORAGE_KEY, trimmedApiKey);
      } else {
        localStorage.removeItem(OPENROUTER_STORAGE_KEY);
      }

      const { data: wpData, error: wpError } = await supabase.functions.invoke("wordpress-proxy", {
        body: { url: url.trim() },
      });
      if (wpError) throw wpError;

      const { data: quizData, error: quizError } = await supabase.functions.invoke("gemini-analyze", {
        body: {
          content: wpData.content,
          title: wpData.title,
          model: effectiveModel,
          provider: "openrouter",
          openrouter_api_key: trimmedApiKey || undefined,
        },
      });
      if (quizError) throw quizError;
      if (quizData?.error) throw new Error(quizData.error);

      if (!user) {
        navigate(`/quiz/preview-${Date.now()}`, {
          state: {
            previewQuiz: {
              id: `preview-${Date.now()}`,
              title: quizData.title,
              description: quizData.description,
              questions: (quizData.questions || []).map((q: any, index: number) => ({
                id: `preview-question-${index}`,
                question: q.question_text || q.question,
                question_text: q.question_text || q.question,
                options: Array.isArray(q.options) ? q.options : [],
                correctAnswer: Number.parseInt(String(q.correct_answer ?? q.correctAnswer ?? 0), 10) || 0,
                explanation: q.explanation || undefined,
                difficulty: q.difficulty || "medium",
                points: q.points || 1,
                order_index: index,
              })),
            },
          },
        });
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profile?.org_id) {
        throw new Error("No organization found for your account.");
      }

      const { data: savedQuiz, error: saveError } = await supabase.functions.invoke("save-quiz", {
        body: {
          title: quizData.title,
          description: quizData.description,
          questions: quizData.questions,
          source_url: url.trim(),
          source_urls: [url.trim()],
          created_by: user.id,
          org_id: profile.org_id,
          model: effectiveModel,
        },
      });
      if (saveError) throw saveError;
      if (savedQuiz?.error) throw new Error(savedQuiz.error);

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
    { icon: Brain, title: "AI Analyzes", desc: "10+ AI models generate smart questions" },
    { icon: Zap, title: "Quiz Ready", desc: "Embeddable interactive quiz in seconds" },
  ];

  const trustPoints = [
    "Enterprise-grade AI prompts",
    "Bloom's Taxonomy aligned",
    "Detailed explanations for every question",
    "Export as HTML for any website",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 sm:px-6 py-3 bg-background/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight text-foreground">
            QuizForge<span className="text-primary">AI</span>
          </h1>
          <div className="flex items-center gap-2">
            {user ? (
              <Button variant="default" size="sm" onClick={() => navigate("/dashboard")} className="text-xs sm:text-sm">
                Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/auth/login")} className="text-xs sm:text-sm">
                  Sign in
                </Button>
                <Button variant="default" size="sm" onClick={() => navigate("/auth/signup")} className="text-xs sm:text-sm">
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col">
        <section className="flex-1 flex items-center px-4 sm:px-6 py-10 sm:py-16 lg:py-20">
          <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left: Content */}
            <div className="space-y-6 sm:space-y-8 text-center lg:text-left order-2 lg:order-1">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium border border-primary/20">
                  <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  AI-Powered Quiz Generator
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="space-y-3 sm:space-y-4"
              >
                <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.1]">
                  Turn any article into
                  <br />
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    an interactive quiz
                  </span>
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  Paste a WordPress URL, pick your AI model, and get a beautiful embeddable quiz with detailed explanations in seconds.
                </p>
              </motion.div>

              {/* URL Input */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="space-y-3 max-w-lg mx-auto lg:mx-0"
              >
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Input
                    placeholder="https://your-site.com/article..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !loading && handleGenerate()}
                    className="h-11 sm:h-12 text-sm sm:text-base flex-1"
                    disabled={loading}
                  />
                  <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    size="lg"
                    className="h-11 sm:h-12 px-5 sm:px-8 gap-2 font-semibold w-full sm:w-auto shrink-0"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {loading ? "Generating..." : "Generate Quiz"}
                  </Button>
                </div>

                {/* Model toggle */}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[250px]">Model: {effectiveModel || "Select..."}</span>
                </button>

                {/* Settings panel */}
                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-xl border border-border bg-card p-3 sm:p-4 space-y-3 sm:space-y-4 text-left">
                        <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                          {(Object.keys(PRESET_MODELS) as Provider[]).map((p) => (
                            <Button
                              key={p}
                              variant={provider === p ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleProviderChange(p)}
                              className="text-xs h-8"
                            >
                              {PRESET_MODELS[p].label}
                            </Button>
                          ))}
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs sm:text-sm font-medium text-foreground">Model</label>
                          <Select value={selectedModel} onValueChange={setSelectedModel}>
                            <SelectTrigger className="h-9 sm:h-10 text-sm">
                              <SelectValue placeholder="Select a model" />
                            </SelectTrigger>
                            <SelectContent>
                              {PRESET_MODELS[provider].models.map((m) => (
                                <SelectItem key={m.value} value={m.value}>
                                  {m.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="homepage-openrouter-key" className="flex items-center gap-1.5 text-xs sm:text-sm text-foreground">
                            <Key className="h-3.5 w-3.5 text-primary" />
                            OpenRouter API Key
                          </Label>
                          <div className="relative">
                            <Input
                              id="homepage-openrouter-key"
                              type={showApiKey ? "text" : "password"}
                              placeholder="sk-or-v1-..."
                              value={apiKey}
                              onChange={(e) => setApiKey(e.target.value)}
                              className="pr-10 font-mono text-xs sm:text-sm h-9 sm:h-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowApiKey((v) => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            Paste your OpenRouter key to use your own credits. Saved locally.
                          </p>
                        </div>

                        {selectedModel === "custom" && (
                          <div className="space-y-1.5">
                            <label className="text-xs sm:text-sm font-medium text-foreground">Custom Model ID</label>
                            <Input
                              placeholder="e.g. deepseek/deepseek-r1"
                              value={customModel}
                              onChange={(e) => setCustomModel(e.target.value)}
                              className="text-xs sm:text-sm h-9 sm:h-10"
                            />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Trust points */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="space-y-2 max-w-lg mx-auto lg:mx-0"
              >
                {trustPoints.map((point, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{point}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: Hero Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="order-1 lg:order-2 flex justify-center"
            >
              <img
                src={heroIllustration}
                alt="AI Quiz Generation Illustration"
                width={1024}
                height={768}
                className="w-full max-w-[280px] sm:max-w-[360px] lg:max-w-[480px] h-auto drop-shadow-2xl"
              />
            </motion.div>
          </div>
        </section>

        {/* Feature cards */}
        <section className="px-4 sm:px-6 py-10 sm:py-16 bg-muted/30">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6"
            >
              {features.map((f, i) => (
                <Card key={i} className="border-border/50 bg-card hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all group">
                  <CardContent className="p-5 sm:p-6 text-center space-y-3">
                    <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:from-primary/20 group-hover:to-accent/20 transition-colors">
                      <f.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-display text-base font-semibold">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Social proof */}
        <section className="px-4 sm:px-6 py-8 sm:py-12 border-t border-border">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-warning text-warning" />
              ))}
            </div>
            <p className="text-sm sm:text-base text-muted-foreground italic">
              "QuizForge AI generates quizzes that are genuinely useful for learning — the explanations alone are worth it."
            </p>
            <p className="text-xs text-muted-foreground">— Used by content creators & educators worldwide</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-4 sm:px-6 py-4 sm:py-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="font-display font-semibold text-foreground">QuizForge<span className="text-primary">AI</span></span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Secure</span>
            <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> 10+ AI Models</span>
          </div>
          <span>© {new Date().getFullYear()} QuizForge AI</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
