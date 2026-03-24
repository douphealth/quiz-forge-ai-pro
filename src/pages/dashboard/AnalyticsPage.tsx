import { EmptyState } from "@/components/shared/EmptyState";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-2xl font-bold mb-6">Analytics</h1>
      <EmptyState icon={BarChart3} title="Analytics Dashboard" description="Analytics will be available in Phase 5." />
    </div>
  );
}
