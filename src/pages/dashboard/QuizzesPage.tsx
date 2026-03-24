import { EmptyState } from "@/components/shared/EmptyState";
import { FileText } from "lucide-react";

export default function QuizzesPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl font-bold mb-6">Quizzes</h1>
      <EmptyState
        icon={FileText}
        title="No quizzes yet"
        description="Generate your first quiz to see it here."
      />
    </div>
  );
}
