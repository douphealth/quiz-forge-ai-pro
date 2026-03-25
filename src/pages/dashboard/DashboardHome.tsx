import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalAnalytics } from "@/hooks/useAnalytics";
import { useConnections } from "@/hooks/useConnections";
import { StatsCard } from "@/components/analytics/StatsCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Brain, BarChart3, Link2, Sparkles, ArrowRight } from "lucide-react";

export default function DashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: analytics } = useGlobalAnalytics();
  const { connections } = useConnections();
  const name = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  return (
    <div className="max-w-5xl space-y-6 sm:space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
          Welcome back, {name} 👋
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">Here's what's happening with your quizzes.</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard icon={FileText} label="Total Quizzes" value={analytics?.totalQuizzes || 0} color="text-primary" index={0} />
        <StatsCard icon={Brain} label="Questions" value={analytics?.totalQuestions || 0} color="text-accent" index={1} />
        <StatsCard icon={BarChart3} label="Avg Score" value={analytics?.avgScore || 0} suffix="%" color="text-success" index={2} />
        <StatsCard icon={Link2} label="Connections" value={connections.length} color="text-warning" index={3} />
      </div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h2 className="font-display text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Card className="group cursor-pointer hover:border-primary/30 transition-all active:scale-[0.99]" onClick={() => navigate("/dashboard/generate")}>
            <CardContent className="p-4 sm:pt-6 sm:p-6 flex items-center gap-3 sm:gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold text-sm sm:text-base">Generate Quiz</h3>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Create from WordPress content</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </CardContent>
          </Card>
          <Card className="group cursor-pointer hover:border-primary/30 transition-all active:scale-[0.99]" onClick={() => navigate("/dashboard/connections")}>
            <CardContent className="p-4 sm:pt-6 sm:p-6 flex items-center gap-3 sm:gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                <Link2 className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold text-sm sm:text-base">Add Connection</h3>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Connect a WordPress site</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors shrink-0" />
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
