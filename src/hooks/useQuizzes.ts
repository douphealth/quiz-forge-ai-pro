import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export function useQuizzes(orgId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["quizzes", orgId],
    queryFn: async () => {
      let query = supabase
        .from("quizzes")
        .select("*")
        .order("created_at", { ascending: false });

      if (orgId) query = query.eq("org_id", orgId);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

export function useQuiz(id: string | undefined) {
  return useQuery({
    queryKey: ["quiz", id],
    queryFn: async () => {
      if (!id) throw new Error("No quiz ID");

      const [quizRes, questionsRes] = await Promise.all([
        supabase.from("quizzes").select("*").eq("id", id).single(),
        supabase.from("questions").select("*").eq("quiz_id", id).order("order_index"),
      ]);

      if (quizRes.error) throw quizRes.error;
      if (questionsRes.error) throw questionsRes.error;

      return { ...quizRes.data, questions: questionsRes.data };
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: {
      title: string;
      description?: string;
      questions: any[];
      source_urls?: string[];
      created_by: string;
      org_id: string;
      model?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("save-quiz", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      toast({ title: "Quiz created!" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to create quiz", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from("quizzes")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: ["quiz", id] });
      const previous = queryClient.getQueryData(["quiz", id]);
      queryClient.setQueryData(["quiz", id], (old: any) => old ? { ...old, ...updates } : old);
      return { previous, id };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["quiz", context.id], context.previous);
      }
      toast({ title: "Failed to update quiz", variant: "destructive" });
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: ["quiz", vars.id] });
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
    },
  });
}

export function useDeleteQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quizzes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      toast({ title: "Quiz deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to delete quiz", description: err.message, variant: "destructive" });
    },
  });
}

export function usePublishQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("quizzes")
        .update({ status: "published", visibility: "public", published_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["quiz", id] });
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      toast({ title: "Quiz published!" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to publish", description: err.message, variant: "destructive" });
    },
  });
}
