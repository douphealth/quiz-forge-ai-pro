import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Trash2, ExternalLink, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

type WpConnection = Tables<"wp_connections">;

interface ConnectionCardProps {
  connection: WpConnection;
  onDelete: (id: string) => void;
  deleting?: boolean;
}

export function ConnectionCard({ connection, onDelete, deleting }: ConnectionCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="group hover:border-primary/20 transition-all">
      <CardContent className="pt-6 flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Globe className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold text-foreground truncate">{connection.site_name}</h3>
            <span className={`h-2 w-2 rounded-full shrink-0 ${connection.is_active ? "bg-emerald-500" : "bg-destructive"}`} />
          </div>
          <p className="text-sm text-muted-foreground truncate">{connection.site_url}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
            <Badge variant="secondary" className="text-xs font-normal">{connection.auth_type || "none"}</Badge>
            {connection.last_sync_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Synced {formatDistanceToNow(new Date(connection.last_sync_at), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <a href={connection.site_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(connection.id)}
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
