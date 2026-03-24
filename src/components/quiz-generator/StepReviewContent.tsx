import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Brain, Settings2, Globe } from "lucide-react";
import { useQuizGenerationStore } from "@/stores/quizGenerationStore";

export function StepReviewContent() {
  const store = useQuizGenerationStore();

  const summaryItems = [
    { icon: FileText, label: "Source", value: store.contentTitle || store.sourceUrl || "Pasted content" },
    { icon: Settings2, label: "Questions", value: `${store.numQuestions} questions` },
    { icon: Brain, label: "Difficulty", value: store.difficulty.charAt(0).toUpperCase() + store.difficulty.slice(1) },
    { icon: Globe, label: "Language", value: store.language },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold">Review & Generate</h2>
        <p className="text-sm text-muted-foreground mt-1">Review your settings before generating.</p>
      </div>

      <div className="grid gap-3">
        {summaryItems.map((item) => (
          <Card key={item.label} className="border-border/50">
            <CardContent className="py-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-medium truncate">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50">
        <CardContent className="py-4 space-y-2">
          <p className="text-xs text-muted-foreground">Question Types</p>
          <div className="flex gap-2 flex-wrap">
            {store.questionTypes.map((t) => (
              <Badge key={t} variant="secondary">{t.replace("_", " ")}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="py-4 space-y-1">
          <p className="text-xs text-muted-foreground">AI Model</p>
          <p className="text-sm font-medium font-mono">{store.model}</p>
        </CardContent>
      </Card>

      {store.focusTopics.length > 0 && (
        <Card className="border-border/50">
          <CardContent className="py-4 space-y-2">
            <p className="text-xs text-muted-foreground">Focus Topics</p>
            <div className="flex gap-2 flex-wrap">
              {store.focusTopics.map((t) => <Badge key={t} variant="outline">{t}</Badge>)}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            Content length: <strong>{store.contentBody.length.toLocaleString()}</strong> characters.
            Estimated generation time: <strong>10-30 seconds</strong>.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={store.prevStep}>Back</Button>
        <Button onClick={store.nextStep} className="gap-2">
          <Brain className="h-4 w-4" /> Generate Quiz
        </Button>
      </div>
    </div>
  );
}
