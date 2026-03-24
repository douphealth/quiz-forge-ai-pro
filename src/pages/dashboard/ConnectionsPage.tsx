import { EmptyState } from "@/components/shared/EmptyState";
import { Link2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ConnectionsPage() {
  const navigate = useNavigate();
  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl font-bold mb-6">WordPress Connections</h1>
      <EmptyState
        icon={Link2}
        title="No connections yet"
        description="Connect a WordPress site to start generating quizzes from your content."
        actionLabel="Add Connection"
        onAction={() => {}}
      />
    </div>
  );
}
