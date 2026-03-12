import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/lib/errors";
import { format, subMonths, differenceInDays } from "date-fns";

export function useRevenueByMonth() {
  return useQuery({
    queryKey: ["reporting", "revenue_by_month"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("total, paid_date")
        .eq("status", "paid")
        .not("paid_date", "is", null)
        .order("paid_date", { ascending: true });
      if (error) { handleSupabaseError(error, "Loading reporting data"); return []; }

      const months: Record<string, number> = {};
      // Pre-fill last 12 months
      for (let i = 11; i >= 0; i--) {
        const key = format(subMonths(new Date(), i), "yyyy-MM");
        months[key] = 0;
      }
      data?.forEach((inv) => {
        if (inv.paid_date) {
          const key = inv.paid_date.substring(0, 7);
          if (key in months) months[key] = (months[key] || 0) + (inv.total || 0);
        }
      });
      return Object.entries(months).map(([month, revenue]) => ({
        month: format(new Date(month + "-01"), "MMM yy"),
        revenue,
      }));
    },
  });
}

export function usePipelineByStage() {
  return useQuery({
    queryKey: ["reporting", "pipeline_by_stage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("stage, value")
        .not("stage", "in", "(won,lost)");
      if (error) { handleSupabaseError(error, "Loading reporting data"); return []; }

      const stages: Record<string, number> = {
        lead: 0, qualified: 0, proposal: 0, negotiation: 0, verbal: 0,
      };
      data?.forEach((d) => {
        if (d.stage in stages) stages[d.stage] = (stages[d.stage] || 0) + (d.value || 0);
      });
      return Object.entries(stages).map(([stage, value]) => ({
        stage: stage.charAt(0).toUpperCase() + stage.slice(1),
        value,
      }));
    },
  });
}

export function useInvoiceAging() {
  return useQuery({
    queryKey: ["reporting", "invoice_aging"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("due_date, total, status")
        .in("status", ["sent", "viewed", "overdue"]);
      if (error) { handleSupabaseError(error, "Loading reporting data"); return []; }

      const buckets = { "Current": 0, "1-30 days": 0, "31-60 days": 0, "60+ days": 0 };
      const now = new Date();
      data?.forEach((inv) => {
        if (!inv.due_date) return;
        const overdue = differenceInDays(now, new Date(inv.due_date));
        const amount = inv.total || 0;
        if (overdue <= 0) buckets["Current"] += amount;
        else if (overdue <= 30) buckets["1-30 days"] += amount;
        else if (overdue <= 60) buckets["31-60 days"] += amount;
        else buckets["60+ days"] += amount;
      });
      return Object.entries(buckets).map(([bucket, amount]) => ({ bucket, amount }));
    },
  });
}

export function useSatisfactionScores() {
  return useQuery({
    queryKey: ["reporting", "satisfaction"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliveries")
        .select("satisfaction_score, service_type")
        .not("satisfaction_score", "is", null);
      if (error) { handleSupabaseError(error, "Loading reporting data"); return []; }

      const types: Record<string, { total: number; count: number }> = {};
      data?.forEach((d) => {
        const st = d.service_type || "Other";
        if (!types[st]) types[st] = { total: 0, count: 0 };
        types[st].total += d.satisfaction_score || 0;
        types[st].count += 1;
      });
      return Object.entries(types).map(([type, { total, count }]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        score: Math.round((total / count) * 10) / 10,
      }));
    },
  });
}
