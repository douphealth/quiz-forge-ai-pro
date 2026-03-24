import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, BookOpen, Brain, ArrowRight, Loader2, Settings2, Key, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Provider = "openrouter" | "gemini" | "claude";
const OPENROUTER_STORAGE_KEY = "quizforge_openrouter_api_key";

const PRESET_MODELS: Record<Provider, { label: string; models: { value: string; label: string }[] }> = {
  openrouter: {
    label: "OpenRouter",
    models: [
      { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { value: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4" },
      { value: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
      { value: "openai/gpt-4o", label: "GPT-4o" },
      { value: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
      { value: "meta-llama/llama-3.1-70b-instruct", label: "Llama 3.1 70B" },
      { value: "mistralai/mistral-large-latest", label: "Mistral Large" },
      { value: "custom", label: "✏️ Custom model..." },
    ],
  },
  gemini: {
    label: "Google Gemini",
    models: [
      { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
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
    if (provider === "openrouter" && selectedModel === "custom" && !trimmedApiKey) {
      toast({ title: "Add your OpenRouter API key", description: "Custom OpenRouter models need your API key.", variant: "destructive" });
      return;
    }

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
    { icon: Brain, title: "AI Analyzes", desc: "Pick your favorite AI model" },
    { icon: Zap, title: "Quiz Ready", desc: "Interactive quiz in seconds" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
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
              Paste a WordPress URL, choose your AI model, and get quiz questions instantly.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4 max-w-lg mx-auto"
          >
            {/* URL input row */}
            <div className="flex gap-3">
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
            </div>

            {/* Model settings toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
            >
              <Settings2 className="h-4 w-4" />
              <span>Model: {effectiveModel || "Select..."}</span>
            </button>

            {/* Model settings panel */}
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl border border-border bg-card p-4 space-y-4 text-left"
              >
                {/* Provider tabs */}
                <div className="flex gap-2">
                  {(Object.keys(PRESET_MODELS) as Provider[]).map((p) => (
                    <Button
                      key={p}
                      variant={provider === p ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleProviderChange(p)}
                      className="text-xs"
                    >
                      {PRESET_MODELS[p].label}
                    </Button>
                  ))}
                </div>

                {/* Model selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Model</label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
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

                <div className="space-y-2">
                  <Label htmlFor="homepage-openrouter-key" className="flex items-center gap-2 text-sm text-foreground">
                    <Key className="h-4 w-4 text-primary" />
                    OpenRouter API Key
                  </Label>
                  <div className="relative">
                    <Input
                      id="homepage-openrouter-key"
                      type={showApiKey ? "text" : "password"}
                      placeholder="sk-or-v1-..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Paste your OpenRouter key here to use your own credits for this screen. It stays saved locally in your browser.
                  </p>
                </div>

                {/* Custom model input (OpenRouter only) */}
                {selectedModel === "custom" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Custom Model ID</label>
                    <Input
                      placeholder="e.g. deepseek/deepseek-r1"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter any model ID from{" "}
                      <a
                        href="https://openrouter.ai/models"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        openrouter.ai/models
                      </a>
                    </p>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  All models here are routed through OpenRouter. Pick a preset or enter any custom model, then use your key above if needed.
                </p>
              </motion.div>
            )}
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
