import { EmptyState } from "@/components/shared/EmptyState";
import { Activity } from "lucide-react";

export default function ActivityPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl font-bold mb-6">Activity Log</h1>
      <EmptyState icon={Activity} title="Activity Log" description="Your activity history will appear here." />
    </div>
  );
}
