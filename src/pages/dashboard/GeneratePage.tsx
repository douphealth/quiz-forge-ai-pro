import { GenerationWizard } from "@/components/quiz-generator/GenerationWizard";
import { useEffect } from "react";
import { useQuizGenerationStore } from "@/stores/quizGenerationStore";

export default function GeneratePage() {
  const reset = useQuizGenerationStore((s) => s.reset);

  // Reset wizard state when navigating away and back
  useEffect(() => {
    return () => reset();
  }, [reset]);

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">Generate Quiz</h1>
        <p className="text-sm text-muted-foreground mt-1">Create an AI-powered quiz from any content.</p>
      </div>
      <GenerationWizard />
    </div>
  );
}
