import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Brain, BarChart3, Link2, Sparkles, ArrowRight } from "lucide-react";

const stats = [
  { label: "Total Quizzes", value: "—", icon: FileText, color: "text-primary" },
  { label: "Questions Generated", value: "—", icon: Brain, color: "text-accent" },
  { label: "Avg Score", value: "—", icon: BarChart3, color: "text-emerald-500" },
  { label: "Connections", value: "—", icon: Link2, color: "text-amber-500" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const name = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  return (
    <div className="max-w-5xl space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Welcome back, {name} 👋
        </h1>
        <p className="text-muted-foreground">Here's what's happening with your quizzes.</p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <motion.div key={s.label} variants={item}>
            <Card className="border-border/50 hover:border-primary/20 transition-colors">
              <CardContent className="pt-6 flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h2 className="font-display text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="group cursor-pointer hover:border-primary/30 transition-all" onClick={() => navigate("/dashboard/generate")}>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold">Generate Quiz</h3>
                <p className="text-sm text-muted-foreground">Create a new quiz from WordPress content</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
          <Card className="group cursor-pointer hover:border-primary/30 transition-all" onClick={() => navigate("/dashboard/connections")}>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                <Link2 className="h-6 w-6 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold">Add Connection</h3>
                <p className="text-sm text-muted-foreground">Connect a WordPress site</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Recent Activity Placeholder */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h2 className="font-display text-lg font-semibold mb-4">Recent Activity</h2>
        <Card className="border-border/50">
          <CardContent className="py-12 text-center text-muted-foreground">
            No activity yet. Generate your first quiz to get started!
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
