import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Sparkles, Globe, Cpu, Key, Eye, EyeOff } from "lucide-react";
import { useQuizGenerationStore, type AIProvider } from "@/stores/quizGenerationStore";
import { useState } from "react";

const QUESTION_TYPES = [
  { id: "multiple_choice", label: "Multiple Choice" },
  { id: "true_false", label: "True / False" },
  { id: "fill_blank", label: "Fill in the Blank" },
  { id: "short_answer", label: "Short Answer" },
];

const DIFFICULTIES = [
  { value: "easy", label: "Easy", color: "bg-emerald-500/10 text-emerald-600" },
  { value: "medium", label: "Medium", color: "bg-amber-500/10 text-amber-600" },
  { value: "hard", label: "Hard", color: "bg-rose-500/10 text-rose-600" },
  { value: "mixed", label: "Mixed", color: "bg-primary/10 text-primary" },
];

// Provider-specific model catalogs
const PROVIDER_MODELS: Record<AIProvider, { value: string; label: string; badge?: string }[]> = {
  lovable: [
    { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", badge: "Fast" },
    { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", badge: "Balanced" },
    { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", badge: "Best" },
    { value: "openai/gpt-5-mini", label: "GPT-5 Mini" },
    { value: "openai/gpt-5", label: "GPT-5", badge: "Premium" },
  ],
  openrouter: [
    { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { value: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4", badge: "Popular" },
    { value: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
    { value: "openai/gpt-4o", label: "GPT-4o" },
    { value: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "meta-llama/llama-3.1-70b-instruct", label: "Llama 3.1 70B" },
    { value: "deepseek/deepseek-r1", label: "DeepSeek R1" },
  ],
};

const PROVIDER_INFO: Record<AIProvider, { label: string; icon: React.ReactNode; description: string }> = {
  lovable: {
    label: "Lovable AI",
    icon: <Sparkles className="h-4 w-4" />,
    description: "Built-in AI — no API key needed",
  },
  openrouter: {
    label: "OpenRouter",
    icon: <Globe className="h-4 w-4" />,
    description: "Access 200+ models including Claude, Gemini, Llama & more",
  },
};

export function StepConfigureQuiz() {
  const store = useQuizGenerationStore();
  const [topicInput, setTopicInput] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [useCustomModel, setUseCustomModel] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const toggleType = (id: string) => {
    const current = store.questionTypes;
    store.setField("questionTypes",
      current.includes(id) ? current.filter((t) => t !== id) : [...current, id]
    );
  };

  const addTopic = () => {
    if (topicInput.trim() && !store.focusTopics.includes(topicInput.trim())) {
      store.setField("focusTopics", [...store.focusTopics, topicInput.trim()]);
      setTopicInput("");
    }
  };

  const removeTopic = (t: string) => {
    store.setField("focusTopics", store.focusTopics.filter((x) => x !== t));
  };

  const switchProvider = (provider: AIProvider) => {
    store.setField("provider", provider);
    setUseCustomModel(false);
    setCustomModel("");
    // Set default model for the provider
    const models = PROVIDER_MODELS[provider];
    if (models.length > 0) {
      store.setField("model", models[0].value);
    }
  };

  const currentModels = PROVIDER_MODELS[store.provider];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold">Configure Quiz</h2>
        <p className="text-sm text-muted-foreground mt-1">Customize how your quiz is generated.</p>
      </div>

      {/* Number of questions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Number of Questions</Label>
          <span className="text-sm font-semibold text-primary">{store.numQuestions}</span>
        </div>
        <Slider
          value={[store.numQuestions]}
          onValueChange={([v]) => store.setField("numQuestions", v)}
          min={3}
          max={30}
          step={1}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>3</span><span>30</span>
        </div>
      </div>

      {/* Difficulty */}
      <div className="space-y-2">
        <Label>Difficulty</Label>
        <div className="flex gap-2 flex-wrap">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              onClick={() => store.setField("difficulty", d.value as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                store.difficulty === d.value
                  ? `${d.color} border-current`
                  : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Question Types */}
      <div className="space-y-3">
        <Label>Question Types</Label>
        <div className="grid grid-cols-2 gap-2">
          {QUESTION_TYPES.map((qt) => (
            <label key={qt.id} className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
              <Checkbox
                checked={store.questionTypes.includes(qt.id)}
                onCheckedChange={() => toggleType(qt.id)}
              />
              <span className="text-sm">{qt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* AI Provider & Model Selection */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Cpu className="h-4 w-4" />
          AI Provider & Model
        </Label>

        <Tabs value={store.provider} onValueChange={(v) => switchProvider(v as AIProvider)}>
          <TabsList className="grid w-full grid-cols-2">
            {(Object.keys(PROVIDER_INFO) as AIProvider[]).map((key) => (
              <TabsTrigger key={key} value={key} className="gap-2 text-xs sm:text-sm">
                {PROVIDER_INFO[key].icon}
                {PROVIDER_INFO[key].label}
              </TabsTrigger>
            ))}
          </TabsList>

          {(Object.keys(PROVIDER_INFO) as AIProvider[]).map((providerKey) => (
            <TabsContent key={providerKey} value={providerKey} className="space-y-3 mt-3">
              <p className="text-xs text-muted-foreground">{PROVIDER_INFO[providerKey].description}</p>

              {!useCustomModel ? (
                <div className="space-y-2">
                  <Select value={store.model} onValueChange={(v) => store.setField("model", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDER_MODELS[providerKey].map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          <span className="flex items-center gap-2">
                            {m.label}
                            {m.badge && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                {m.badge}
                              </span>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {providerKey === "openrouter" && (
                    <button
                      className="text-xs text-primary hover:underline"
                      onClick={() => setUseCustomModel(true)}
                    >
                      Use custom model ID (any OpenRouter model)
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="e.g. anthropic/claude-opus-4, mistralai/mixtral-8x7b-instruct"
                    value={customModel}
                    onChange={(e) => {
                      setCustomModel(e.target.value);
                      store.setField("model", e.target.value);
                    }}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Enter any model ID from{" "}
                    <a href="https://openrouter.ai/models" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      openrouter.ai/models
                    </a>
                  </p>
                  <button
                    className="text-xs text-primary hover:underline"
                    onClick={() => {
                      setUseCustomModel(false);
                      setCustomModel("");
                      const models = PROVIDER_MODELS[providerKey];
                      if (models.length > 0) store.setField("model", models[0].value);
                    }}
                  >
                    ← Back to preset models
                  </button>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Language */}
      <div className="space-y-2">
        <Label>Language</Label>
        <Select value={store.language} onValueChange={(v) => store.setField("language", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="English">English</SelectItem>
            <SelectItem value="Spanish">Spanish</SelectItem>
            <SelectItem value="French">French</SelectItem>
            <SelectItem value="German">German</SelectItem>
            <SelectItem value="Arabic">Arabic</SelectItem>
            <SelectItem value="Chinese">Chinese</SelectItem>
            <SelectItem value="Japanese">Japanese</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Focus Topics */}
      <div className="space-y-2">
        <Label>Focus Topics (optional)</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Add a topic..."
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTopic())}
          />
          <Button variant="secondary" size="sm" onClick={addTopic} disabled={!topicInput.trim()}>Add</Button>
        </div>
        {store.focusTopics.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {store.focusTopics.map((t) => (
              <Badge key={t} variant="secondary" className="gap-1">
                {t}
                <button onClick={() => removeTopic(t)}><X className="h-3 w-3" /></button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={store.prevStep}>Back</Button>
        <Button onClick={store.nextStep} disabled={store.questionTypes.length === 0}>Continue</Button>
      </div>
    </div>
  );
}
