import { useProposals } from "@/hooks/useProposals";
import { useContracts } from "@/hooks/useContracts";
import { useInvoices } from "@/hooks/useInvoices";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { Badge } from "@/components/ui/badge";
import { FileText, FileSignature, Receipt, ClipboardList } from "lucide-react";
import { EntityDocuments } from "@/components/documents/EntityDocuments";

export function DocumentsTab({ projectId, dealId }: { projectId: string; dealId?: string | null }) {
  const { data: proposals } = useProposals();
  const { data: contracts } = useContracts();
  const { data: invoices } = useInvoices();
  const { data: pos } = usePurchaseOrders();

  const linkedProposals = proposals?.filter((p) => dealId && p.deal_id === dealId) || [];
  const linkedContracts = contracts?.filter((c) => dealId && c.deal_id === dealId) || [];
  const linkedInvoices = invoices?.filter((i) => i.project_id === projectId || (dealId && i.deal_id === dealId)) || [];
  const linkedPOs = pos?.filter((p) => p.project_id === projectId) || [];

  const docs = [
    ...linkedProposals.map((p) => ({ type: "Proposal", icon: FileText, title: p.title, status: p.status, date: p.created_at })),
    ...linkedContracts.map((c) => ({ type: "Contract", icon: FileSignature, title: c.title, status: c.status, date: c.created_at })),
    ...linkedPOs.map((p) => ({ type: "PO", icon: ClipboardList, title: p.po_number, status: p.status, date: p.created_at })),
    ...linkedInvoices.map((i) => ({ type: "Invoice", icon: Receipt, title: i.invoice_number, status: i.status, date: i.created_at })),
  ];

  return (
    <div className="space-y-6">
      {/* File Attachments */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">File Attachments</p>
        <EntityDocuments entityType="project" entityId={projectId} />
      </div>

      {/* Linked Documents */}
      {docs.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Linked Documents</p>
          <div className="space-y-2">
            {docs.map((d, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-md border">
                <d.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{d.title}</p>
                  <p className="text-xs text-muted-foreground">{d.type}</p>
                </div>
                <Badge variant="secondary" className="text-[9px] capitalize">{d.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
