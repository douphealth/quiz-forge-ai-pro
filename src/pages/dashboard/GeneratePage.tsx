import { EmptyState } from "@/components/shared/EmptyState";
import { Sparkles } from "lucide-react";

export default function GeneratePage() {
  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl font-bold mb-6">Generate Quiz</h1>
      <EmptyState
        icon={Sparkles}
        title="Quiz Generation Wizard"
        description="The multi-step quiz generation wizard is coming in Phase 3."
      />
    </div>
  );
}
