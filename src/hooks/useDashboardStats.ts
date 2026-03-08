import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      // Get pipeline value (deals not won/lost)
      const { data: deals } = await supabase
        .from("deals")
        .select("value, stage")
        .not("stage", "in", '("won","lost")');

      const pipelineValue = deals?.reduce((sum, d) => sum + (d.value || 0), 0) || 0;
      const dealCount = deals?.length || 0;

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
        pipelineValue,
        dealCount,
        activeProjects: activeProjects || 0,
        overdueTasks: overdueTasks || 0,
        outstandingAmount,
        unpaidCount,
      };
    },
  });
}

export function usePipelineByStage() {
  return useQuery({
    queryKey: ["pipeline-by-stage"],
    queryFn: async () => {
      const { data: deals } = await supabase
        .from("deals")
        .select("value, stage")
        .not("stage", "in", '("won","lost")');

      const stages = ["lead", "qualified", "proposal", "negotiation", "verbal"];
      const stageColors: Record<string, string> = {
        lead: "hsl(var(--stage-lead))",
        qualified: "hsl(var(--stage-qualified))",
        proposal: "hsl(var(--stage-proposal))",
        negotiation: "hsl(var(--stage-negotiation))",
        verbal: "hsl(var(--stage-verbal))",
      };

      return stages.map((stage) => ({
        stage: stage.charAt(0).toUpperCase() + stage.slice(1),
        value: deals?.filter((d) => d.stage === stage).reduce((sum, d) => sum + (d.value || 0), 0) || 0,
        color: stageColors[stage],
      }));
    },
  });
}
