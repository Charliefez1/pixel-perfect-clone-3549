import { LayoutGrid, List, Table2 } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type ViewMode = "board" | "list" | "table";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
  options?: ViewMode[];
}

export function ViewToggle({ value, onChange, options = ["board", "list", "table"] }: ViewToggleProps) {
  const icons: Record<ViewMode, React.ReactNode> = {
    board: <LayoutGrid className="h-4 w-4" />,
    list: <List className="h-4 w-4" />,
    table: <Table2 className="h-4 w-4" />,
  };

  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as ViewMode)}
      className="border border-border rounded-lg p-0.5"
    >
      {options.map((opt) => (
        <ToggleGroupItem
          key={opt}
          value={opt}
          size="sm"
          className="h-8 w-8 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-md"
        >
          {icons[opt]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
