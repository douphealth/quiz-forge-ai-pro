import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useQuizGenerationStore } from "@/stores/quizGenerationStore";
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

const PRESET_MODELS = [
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { value: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4" },
  { value: "openai/gpt-4o", label: "GPT-4o" },
  { value: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "meta-llama/llama-3.1-70b-instruct", label: "Llama 3.1 70B" },
];

export function StepConfigureQuiz() {
  const store = useQuizGenerationStore();
  const [topicInput, setTopicInput] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [useCustomModel, setUseCustomModel] = useState(false);

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

      {/* AI Model */}
      <div className="space-y-2">
        <Label>AI Model</Label>
        {!useCustomModel ? (
          <div className="space-y-2">
            <Select value={store.model} onValueChange={(v) => store.setField("model", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRESET_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button className="text-xs text-primary hover:underline" onClick={() => setUseCustomModel(true)}>
              Use custom model ID
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Input
              placeholder="e.g. deepseek/deepseek-r1"
              value={customModel}
              onChange={(e) => { setCustomModel(e.target.value); store.setField("model", e.target.value); }}
            />
            <button className="text-xs text-primary hover:underline" onClick={() => { setUseCustomModel(false); store.setField("model", PRESET_MODELS[0].value); }}>
              Use preset model
            </button>
          </div>
        )}
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
