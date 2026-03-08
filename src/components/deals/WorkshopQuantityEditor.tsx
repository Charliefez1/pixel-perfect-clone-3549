import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { useState } from "react";

export interface WorkshopConfig {
  workshops_aware: number;
  workshops_champion: number;
  workshops_manager: number;
  workshops_leader: number;
  workshops_bespoke: number;
  bespoke_details: Array<{ title: string; description: string }>;
}

interface Props {
  value: WorkshopConfig;
  onChange: (config: WorkshopConfig) => void;
}

const workshopTypes = [
  { key: "workshops_aware" as const, label: "Aware" },
  { key: "workshops_champion" as const, label: "Champion" },
  { key: "workshops_manager" as const, label: "Manager" },
  { key: "workshops_leader" as const, label: "Leader" },
] as const;

function getPackageSize(total: number): string {
  if (total <= 2) return "small";
  if (total <= 10) return "medium";
  return "large";
}

const packageColors: Record<string, string> = {
  small: "bg-blue-100 text-blue-700",
  medium: "bg-amber-100 text-amber-700",
  large: "bg-purple-100 text-purple-700",
};

export function WorkshopQuantityEditor({ value, onChange }: Props) {
  const total = value.workshops_aware + value.workshops_champion + value.workshops_manager + value.workshops_leader + value.workshops_bespoke;
  const packageSize = getPackageSize(total);

  const setCount = (key: keyof WorkshopConfig, count: number) => {
    if (key === "bespoke_details") return;
    onChange({ ...value, [key]: Math.max(0, count) });
  };

  const addBespoke = () => {
    onChange({
      ...value,
      workshops_bespoke: value.workshops_bespoke + 1,
      bespoke_details: [...value.bespoke_details, { title: "", description: "" }],
    });
  };

  const removeBespoke = (index: number) => {
    const newDetails = value.bespoke_details.filter((_, i) => i !== index);
    onChange({
      ...value,
      workshops_bespoke: Math.max(0, value.workshops_bespoke - 1),
      bespoke_details: newDetails,
    });
  };

  const updateBespoke = (index: number, field: "title" | "description", val: string) => {
    const newDetails = [...value.bespoke_details];
    newDetails[index] = { ...newDetails[index], [field]: val };
    onChange({ ...value, bespoke_details: newDetails });
  };

  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Workshop Configuration</Label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{total} workshop{total !== 1 ? "s" : ""}</span>
          {total > 0 && (
            <Badge className={packageColors[packageSize]}>
              {packageSize.charAt(0).toUpperCase() + packageSize.slice(1)}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {workshopTypes.map((wt) => (
          <div key={wt.key} className="flex items-center gap-2">
            <Label className="text-xs w-20 shrink-0">{wt.label}</Label>
            <Input
              type="number"
              min={0}
              value={value[wt.key]}
              onChange={(e) => setCount(wt.key, parseInt(e.target.value) || 0)}
              className="h-8 text-sm"
            />
          </div>
        ))}
      </div>

      {/* Bespoke section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Bespoke ({value.workshops_bespoke})</Label>
          <Button type="button" variant="ghost" size="sm" className="h-6 text-xs" onClick={addBespoke}>
            <Plus className="h-3 w-3 mr-1" /> Add Bespoke
          </Button>
        </div>
        {value.bespoke_details.map((bd, i) => (
          <div key={i} className="flex items-start gap-2 p-2 rounded border border-border/50 bg-muted/30">
            <div className="flex-1 space-y-1">
              <Input
                placeholder="Workshop title"
                value={bd.title}
                onChange={(e) => updateBespoke(i, "title", e.target.value)}
                className="h-7 text-xs"
              />
              <Input
                placeholder="Description (optional)"
                value={bd.description}
                onChange={(e) => updateBespoke(i, "description", e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => removeBespoke(i)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
