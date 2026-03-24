import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAIUsage } from "@/hooks/useAnalytics";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

export function AIUsageChart() {
  const { data } = useAIUsage();

  if (!data || data.logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI Usage</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No AI generation data yet.
        </CardContent>
      </Card>
    );
  }

  const chartData = data.logs
    .slice()
    .reverse()
    .map((l) => ({
      date: (l.created_at || "").slice(0, 10),
      promptTokens: l.prompt_tokens || 0,
      completionTokens: l.completion_tokens || 0,
      cost: l.cost_estimate_usd || 0,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          AI Usage — {data.totalGenerations} generations · {data.totalTokens.toLocaleString()} tokens
          {data.totalCost > 0 && ` · $${data.totalCost.toFixed(4)}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="promptTokens"
                stackId="1"
                stroke="hsl(262, 83%, 58%)"
                fill="hsl(262, 83%, 58%)"
                fillOpacity={0.3}
                name="Prompt Tokens"
              />
              <Area
                type="monotone"
                dataKey="completionTokens"
                stackId="1"
                stroke="hsl(172, 66%, 50%)"
                fill="hsl(172, 66%, 50%)"
                fillOpacity={0.3}
                name="Completion Tokens"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
