import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface QuizPerformanceChartProps {
  data: Array<{ date: string; attempts: number; avgScore: number | null }>;
}

export function QuizPerformanceChart({ data }: QuizPerformanceChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quiz Performance (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => v.slice(5)} // MM-DD
              />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="attempts"
                stroke="hsl(262, 83%, 58%)"
                strokeWidth={2}
                dot={false}
                name="Attempts"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avgScore"
                stroke="hsl(172, 66%, 50%)"
                strokeWidth={2}
                dot={false}
                connectNulls
                name="Avg Score %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
