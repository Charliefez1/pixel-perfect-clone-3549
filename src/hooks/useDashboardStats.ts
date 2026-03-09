import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      // Get active projects
      const { count: activeProjects } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Get overdue tasks
      const { count: overdueTasks } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .lt("due_date", new Date().toISOString().split("T")[0])
        .not("status", "eq", "done");

      // Get outstanding invoices
      const { data: invoices } = await supabase
        .from("invoices")
        .select("total, status")
        .not("status", "eq", "paid");

      const outstandingAmount = invoices?.reduce((sum, i) => sum + (i.total || 0), 0) || 0;
      const unpaidCount = invoices?.length || 0;

      return {
        activeProjects: activeProjects || 0,
        overdueTasks: overdueTasks || 0,
        outstandingAmount,
        unpaidCount,
      };
    },
  });
}

export function useProjectsByPhase() {
  return useQuery({
    queryKey: ["projects-by-phase"],
    queryFn: async () => {
      const { data: projects } = await supabase
        .from("projects")
        .select("neuro_phase, status")
        .eq("status", "active");

      const phases = ["needs", "engage", "understand", "redesign", "optimise"];
      const phaseColors: Record<string, string> = {
        needs: "hsl(210, 100%, 61%)",
        engage: "hsl(190, 60%, 50%)",
        understand: "hsl(142, 71%, 45%)",
        redesign: "hsl(38, 92%, 50%)",
        optimise: "hsl(0, 0%, 64%)",
      };

      return phases.map((phase) => ({
        phase: phase.charAt(0).toUpperCase() + phase.slice(1),
        count: projects?.filter((p) => p.neuro_phase === phase).length || 0,
        color: phaseColors[phase],
      }));
    },
  });
}

export function useUpcomingDeliveries() {
  return useQuery({
    queryKey: ["upcoming-deliveries"],
    queryFn: async () => {
      const now = new Date();
      const weekFromNow = new Date(now);
      weekFromNow.setDate(weekFromNow.getDate() + 7);

      const { data } = await supabase
        .from("deliveries")
        .select("*, organisations(name), projects(name)")
        .gte("delivery_date", now.toISOString().split("T")[0])
        .lte("delivery_date", weekFromNow.toISOString().split("T")[0])
        .order("delivery_date", { ascending: true });

      return data || [];
    },
  });
}
