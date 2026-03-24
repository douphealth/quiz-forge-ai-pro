import { motion } from "framer-motion";
import { useConnections } from "@/hooks/useConnections";
import { ConnectionCard } from "@/components/connections/ConnectionCard";
import { ConnectionForm } from "@/components/connections/ConnectionForm";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Link2 } from "lucide-react";

export default function ConnectionsPage() {
  const { connections, isLoading, deleteConnection } = useConnections();

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">WordPress Connections</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your connected WordPress sites</p>
        </div>
        <ConnectionForm />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-3/4 mt-2" /></CardContent></Card>
          ))}
        </div>
      ) : connections.length === 0 ? (
        <EmptyState
          icon={Link2}
          title="No connections yet"
          description="Connect a WordPress site to start generating quizzes from your content."
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {connections.map((conn, i) => (
            <motion.div
              key={conn.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <ConnectionCard
                connection={conn}
                onDelete={(id) => deleteConnection.mutate(id)}
                deleting={deleteConnection.isPending}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
