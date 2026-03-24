import { useEffect, useRef, memo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  trend?: number;
  color?: string;
  prefix?: string;
  suffix?: string;
  index?: number;
}

export const StatsCard = memo(function StatsCard({
  icon: Icon,
  label,
  value,
  trend,
  color = "text-primary",
  prefix = "",
  suffix = "",
  index = 0,
}: StatsCardProps) {
  const countRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!countRef.current) return;
    const el = countRef.current;
    const duration = 1200;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = `${prefix}${Math.round(value * eased)}${suffix}`;
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, prefix, suffix]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <Card className="border-border/50 hover:border-primary/20 transition-all hover:shadow-sm">
        <CardContent className="pt-6 flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <Icon className={cn("h-5 w-5", color)} />
          </div>
          <div className="flex-1 min-w-0">
            <span ref={countRef} className="text-2xl font-display font-bold">
              {prefix}0{suffix}
            </span>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
          {trend !== undefined && trend !== 0 && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trend > 0 ? "text-success" : "text-destructive"
              )}
            >
              {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend > 0 ? "+" : ""}{trend}%
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});
