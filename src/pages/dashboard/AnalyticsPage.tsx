import { useGlobalAnalytics } from "@/hooks/useAnalytics";
import { StatsCard } from "@/components/analytics/StatsCard";
import { ScoreDistribution } from "@/components/analytics/ScoreDistribution";
import { QuizPerformanceChart } from "@/components/analytics/QuizPerformanceChart";
import { AIUsageChart } from "@/components/analytics/AIUsageChart";
import { ActivityFeed } from "@/components/analytics/ActivityFeed";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { FileText, Brain, BarChart3, Link2 } from "lucide-react";

export default function AnalyticsPage() {
  const { data, isLoading } = useGlobalAnalytics();

  if (isLoading) {
    return (
      <div className="max-w-5xl space-y-6">
        <h1 className="font-display text-2xl font-bold">Analytics</h1>
        <LoadingSkeleton variant="stats-grid" />
        <LoadingSkeleton variant="card" count={2} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <h1 className="font-display text-2xl font-bold">Analytics</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={FileText} label="Total Quizzes" value={data?.totalQuizzes || 0} color="text-primary" index={0} />
        <StatsCard icon={Brain} label="Total Questions" value={data?.totalQuestions || 0} color="text-accent" index={1} />
        <StatsCard icon={BarChart3} label="Avg Score" value={data?.avgScore || 0} suffix="%" color="text-success" index={2} />
        <StatsCard icon={Link2} label="Connections" value={data?.totalConnections || 0} color="text-warning" index={3} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuizPerformanceChart data={data?.chartData || []} />
        <ScoreDistribution data={data?.distribution || []} />
      </div>

      {/* AI Usage */}
      <AIUsageChart />

      {/* Activity */}
      <ActivityFeed />
    </div>
  );
}
