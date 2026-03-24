import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ScoreDistributionProps {
  data: Array<{ range: string; count: number }>;
}

const colors = [
  "hsl(0, 84%, 60%)",      // 0-10
  "hsl(15, 80%, 55%)",     // 10-20
  "hsl(25, 85%, 50%)",     // 20-30
  "hsl(35, 90%, 50%)",     // 30-40
  "hsl(45, 85%, 50%)",     // 40-50
  "hsl(60, 70%, 45%)",     // 50-60
  "hsl(90, 60%, 45%)",     // 60-70
  "hsl(120, 55%, 45%)",    // 70-80
  "hsl(140, 60%, 42%)",    // 80-90
  "hsl(152, 69%, 41%)",    // 90-100
];

export function ScoreDistribution({ data }: ScoreDistributionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Score Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="range" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={colors[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
