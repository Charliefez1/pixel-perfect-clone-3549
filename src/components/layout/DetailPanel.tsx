import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface DetailField {
  label: string;
  value: React.ReactNode;
}

interface DetailPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  badge?: { label: string; className?: string };
  fields: DetailField[];
  children?: React.ReactNode;
}

export function DetailPanel({ open, onOpenChange, title, badge, fields, children }: DetailPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-start gap-3">
            <SheetTitle className="text-lg flex-1">{title}</SheetTitle>
            {badge && (
              <Badge className={badge.className}>{badge.label}</Badge>
            )}
          </div>
        </SheetHeader>
        <Separator />
        <div className="py-6 space-y-4">
          {fields.map((f) => (
            <div key={f.label} className="flex items-start gap-4">
              <span className="text-label text-muted-foreground w-28 shrink-0 pt-0.5">{f.label}</span>
              <div className="text-sm flex-1 min-w-0">{f.value || <span className="text-muted-foreground">—</span>}</div>
            </div>
          ))}
        </div>
        {children && (
          <>
            <Separator />
            <div className="py-6">{children}</div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
