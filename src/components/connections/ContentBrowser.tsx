import { Tables } from "@/integrations/supabase/types";
import { useConnectionContent } from "@/hooks/useConnections";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Calendar } from "lucide-react";
import { useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { EmptyState } from "@/components/shared/EmptyState";

interface ContentBrowserProps {
  connectionId: string;
}

export function ContentBrowser({ connectionId }: ContentBrowserProps) {
  const { data: content, isLoading } = useConnectionContent(connectionId);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!content) return [];
    if (!search.trim()) return content;
    const q = search.toLowerCase();
    return content.filter(
      (c) => c.title.toLowerCase().includes(q) || c.excerpt?.toLowerCase().includes(q)
    );
  }, [content, search]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-3 w-full mt-2" /></CardContent></Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search content..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No content found"
          description={content?.length ? "Try a different search term." : "No cached content yet. Content will appear after syncing."}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <Card key={item.id} className="hover:border-primary/20 transition-colors cursor-pointer">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-foreground line-clamp-1">{item.title}</h4>
                  <Badge variant="secondary" className="text-xs shrink-0">{item.post_type || "post"}</Badge>
                </div>
                {item.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.excerpt}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {item.wp_published_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(item.wp_published_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
