import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, FileText, CheckCircle2, Link2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const actionIcons: Record<string, any> = {
  "quiz.generated": Sparkles,
  "quiz.published": FileText,
  "quiz.completed": CheckCircle2,
  "connection.added": Link2,
};

export function ActivityFeed() {
  const { data: activities, isLoading, fetchStatus } = useQuery({
    queryKey: ["activity-feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">Loading...</CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No activity yet. Generate your first quiz to get started!
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {activities.map((a, i) => {
          const Icon = actionIcons[a.action] || Clock;
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0"
            >
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{a.action}</p>
                {a.details && typeof a.details === "object" && (a.details as any).title && (
                  <p className="text-xs text-muted-foreground truncate">{(a.details as any).title}</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {a.created_at ? formatDistanceToNow(new Date(a.created_at), { addSuffix: true }) : ""}
              </span>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
