import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useQuizAnalytics(quizId: string | undefined) {
  return useQuery({
    queryKey: ["quiz-analytics", quizId],
    queryFn: async () => {
      if (!quizId) throw new Error("No quiz ID");

      const { data: sessions, error } = await supabase
        .from("quiz_sessions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const completed = (sessions || []).filter((s) => s.status === "completed");
      const scores = completed.map((s) => s.score_percent || 0);
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

      return {
        sessions: sessions || [],
        totalAttempts: sessions?.length || 0,
        completedAttempts: completed.length,
        avgScore: Math.round(avgScore * 10) / 10,
        completionRate: sessions?.length ? Math.round((completed.length / sessions.length) * 100) : 0,
        passRate: completed.length
          ? Math.round((completed.filter((s) => (s.score_percent || 0) >= 70).length / completed.length) * 100)
          : 0,
      };
    },
    enabled: !!quizId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGlobalAnalytics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["global-analytics"],
    queryFn: async () => {
      const [quizzesRes, questionsRes, sessionsRes, connectionsRes] = await Promise.all([
        supabase.from("quizzes").select("id, created_at, status"),
        supabase.from("questions").select("id, quiz_id"),
        supabase.from("quiz_sessions").select("id, score_percent, status, created_at, quiz_id"),
        supabase.from("wp_connections").select("id"),
      ]);

      const quizzes = quizzesRes.data || [];
      const questions = questionsRes.data || [];
      const sessions = sessionsRes.data || [];
      const connections = connectionsRes.data || [];
      const completed = sessions.filter((s) => s.status === "completed");
      const scores = completed.map((s) => s.score_percent || 0);
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      // Group sessions by date for charts
      const last30Days: Record<string, { attempts: number; totalScore: number; count: number }> = {};
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        last30Days[key] = { attempts: 0, totalScore: 0, count: 0 };
      }
      sessions.forEach((s) => {
        const key = (s.created_at || "").slice(0, 10);
        if (last30Days[key]) {
          last30Days[key].attempts += 1;
          if (s.status === "completed" && s.score_percent != null) {
            last30Days[key].totalScore += s.score_percent;
            last30Days[key].count += 1;
          }
        }
      });

      const chartData = Object.entries(last30Days).map(([date, v]) => ({
        date,
        attempts: v.attempts,
        avgScore: v.count > 0 ? Math.round(v.totalScore / v.count) : null,
      }));

      // Score distribution
      const distribution = Array.from({ length: 10 }, (_, i) => ({
        range: `${i * 10}-${i * 10 + 10}%`,
        count: 0,
      }));
      completed.forEach((s) => {
        const bucket = Math.min(Math.floor((s.score_percent || 0) / 10), 9);
        distribution[bucket].count += 1;
      });

      return {
        totalQuizzes: quizzes.length,
        totalQuestions: questions.length,
        totalAttempts: sessions.length,
        totalConnections: connections.length,
        avgScore,
        chartData,
        distribution,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAIUsage() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["ai-usage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_generation_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      const logs = data || [];
      const totalTokens = logs.reduce((s, l) => s + (l.total_tokens || 0), 0);
      const totalCost = logs.reduce((s, l) => s + (l.cost_estimate_usd || 0), 0);

      return { logs, totalTokens, totalCost, totalGenerations: logs.length };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}
