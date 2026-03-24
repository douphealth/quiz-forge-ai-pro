import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const labels: Record<string, string> = {
  dashboard: "Dashboard",
  connections: "Connections",
  generate: "Generate Quiz",
  quizzes: "Quizzes",
  analytics: "Analytics",
  settings: "Settings",
  activity: "Activity",
  preview: "Preview",
};

export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link to="/dashboard" className="hover:text-foreground transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {segments.slice(1).map((seg, i) => {
        const path = "/" + segments.slice(0, i + 2).join("/");
        const label = labels[seg] || seg;
        const isLast = i === segments.length - 2;
        return (
          <span key={path} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            {isLast ? (
              <span className="text-foreground font-medium">{label}</span>
            ) : (
              <Link to={path} className="hover:text-foreground transition-colors">{label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
