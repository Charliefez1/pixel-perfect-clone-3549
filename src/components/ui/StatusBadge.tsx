import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "success" | "warning" | "info" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  submitted: { label: "Submitted", variant: "info" },
  sent: { label: "Sent", variant: "info" },
  viewed: { label: "Viewed", variant: "info" },
  paid: { label: "Paid", variant: "success" },
  overdue: { label: "Overdue", variant: "destructive" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  active: { label: "Active", variant: "success" },
  paused: { label: "Paused", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  complete: { label: "Complete", variant: "success" },
  setup: { label: "Setup", variant: "secondary" },
  todo: { label: "To Do", variant: "secondary" },
  in_progress: { label: "In Progress", variant: "info" },
  blocked: { label: "Blocked", variant: "destructive" },
  done: { label: "Done", variant: "success" },
  planning: { label: "Planning", variant: "secondary" },
  materials_prep: { label: "Materials Prep", variant: "warning" },
  scheduled: { label: "Scheduled", variant: "info" },
  delivered: { label: "Delivered", variant: "success" },
  follow_up: { label: "Follow Up", variant: "warning" },
  pending: { label: "Pending", variant: "warning" },
  lead: { label: "Lead", variant: "secondary" },
  qualified: { label: "Qualified", variant: "info" },
  proposal: { label: "Proposal", variant: "info" },
  negotiation: { label: "Negotiation", variant: "warning" },
  verbal: { label: "Verbal", variant: "warning" },
  won: { label: "Won", variant: "success" },
  lost: { label: "Lost", variant: "destructive" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const config = statusConfig[status] ?? { label: status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()), variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
