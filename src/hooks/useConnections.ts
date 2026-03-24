import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type WpConnection = Tables<"wp_connections">;

export function useConnections() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const connectionsQuery = useQuery({
    queryKey: ["wp_connections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wp_connections")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as WpConnection[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const createConnection = useMutation({
    mutationFn: async (input: { site_url: string; site_name: string; auth_type?: string }) => {
      if (!user) throw new Error("Not authenticated");

      // Derive API base URL
      const url = new URL(input.site_url);
      const api_base_url = `${url.origin}/wp-json/wp/v2`;

      // Get user's org_id from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", user.id)
        .single();

      if (!profile?.org_id) throw new Error("No organization found. Please set up your org first.");

      const { data, error } = await supabase
        .from("wp_connections")
        .insert({
          site_url: input.site_url,
          site_name: input.site_name,
          api_base_url,
          auth_type: input.auth_type || "none",
          created_by: user.id,
          org_id: profile.org_id,
          is_active: true,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wp_connections"] });
      toast({ title: "Connection added!" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to add connection", description: err.message, variant: "destructive" });
    },
  });

  const deleteConnection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("wp_connections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wp_connections"] });
      toast({ title: "Connection removed" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to remove connection", description: err.message, variant: "destructive" });
    },
  });

  const testConnection = async (siteUrl: string): Promise<boolean> => {
    try {
      const url = new URL(siteUrl);
      const apiUrl = `${url.origin}/wp-json/wp/v2/posts?per_page=1&_fields=id,title`;
      const { data, error } = await supabase.functions.invoke("wordpress-proxy", {
        body: { url: `${url.origin}/wp-json/wp/v2/posts?per_page=1`, test: true },
      });
      // Simple test: try fetching one post via the proxy
      return !error;
    } catch {
      return false;
    }
  };

  return {
    connections: connectionsQuery.data || [],
    isLoading: connectionsQuery.isLoading,
    error: connectionsQuery.error,
    createConnection,
    deleteConnection,
    testConnection,
  };
}

export function useConnectionContent(connectionId: string | undefined) {
  return useQuery({
    queryKey: ["wp_content", connectionId],
    queryFn: async () => {
      if (!connectionId) return [];
      const { data, error } = await supabase
        .from("wp_content_cache")
        .select("*")
        .eq("connection_id", connectionId)
        .order("wp_published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!connectionId,
    staleTime: 5 * 60 * 1000,
  });
}
