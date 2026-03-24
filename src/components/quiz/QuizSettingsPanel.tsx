import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useUpdateQuiz } from "@/hooks/useQuizzes";
import { Save, Loader2 } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface QuizSettingsPanelProps {
  quizId: string;
  config: any;
}

export function QuizSettingsPanel({ quizId, config: initialConfig }: QuizSettingsPanelProps) {
  const updateQuiz = useUpdateQuiz();
  const [config, setConfig] = useState({
    time_limit_minutes: initialConfig?.time_limit_minutes || null,
    shuffle_questions: initialConfig?.shuffle_questions ?? true,
    shuffle_answers: initialConfig?.shuffle_answers ?? true,
    show_correct_answers: initialConfig?.show_correct_answers ?? true,
    show_explanations: initialConfig?.show_explanations ?? true,
    passing_score_percent: initialConfig?.passing_score_percent || 70,
    max_attempts: initialConfig?.max_attempts || null,
    visibility: initialConfig?.visibility || "private",
  });

  const handleSave = () => {
    updateQuiz.mutate({ id: quizId, config: config as unknown as Json });
  };

  const updateField = (field: string, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quiz Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Time Limit */}
          <div className="space-y-2">
            <Label>Time Limit (minutes)</Label>
            <Input
              type="number"
              value={config.time_limit_minutes || ""}
              onChange={(e) => updateField("time_limit_minutes", e.target.value ? Number(e.target.value) : null)}
              placeholder="No limit"
              min={1}
              max={180}
            />
          </div>

          {/* Toggles */}
          <div className="space-y-4">
            {[
              { key: "shuffle_questions", label: "Shuffle Questions" },
              { key: "shuffle_answers", label: "Shuffle Answers" },
              { key: "show_correct_answers", label: "Show Correct Answers" },
              { key: "show_explanations", label: "Show Explanations" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <Label>{label}</Label>
                <Switch
                  checked={config[key as keyof typeof config] as boolean}
                  onCheckedChange={(v) => updateField(key, v)}
                />
              </div>
            ))}
          </div>

          {/* Passing Score */}
          <div className="space-y-2">
            <Label>Passing Score: {config.passing_score_percent}%</Label>
            <Slider
              value={[config.passing_score_percent]}
              onValueChange={([v]) => updateField("passing_score_percent", v)}
              min={0}
              max={100}
              step={5}
            />
          </div>

          {/* Max Attempts */}
          <div className="space-y-2">
            <Label>Max Attempts</Label>
            <Input
              type="number"
              value={config.max_attempts || ""}
              onChange={(e) => updateField("max_attempts", e.target.value ? Number(e.target.value) : null)}
              placeholder="Unlimited"
              min={1}
            />
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select value={config.visibility} onValueChange={(v) => updateField("visibility", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="org">Organization</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="link_only">Link Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSave} disabled={updateQuiz.isPending} className="gap-2">
            {updateQuiz.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
