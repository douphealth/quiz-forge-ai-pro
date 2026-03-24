import { EmptyState } from "@/components/shared/EmptyState";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-bold mb-6">Settings</h1>
      <EmptyState icon={Settings} title="Settings" description="User and organization settings coming soon." />
    </div>
  );
}
