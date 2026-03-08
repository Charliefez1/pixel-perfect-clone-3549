import { Search, SlidersHorizontal, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  searchPlaceholder?: string;
  actionLabel?: string;
  onAction?: () => void;
  onSearch?: (value: string) => void;
  showFilter?: boolean;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  searchPlaceholder = "Search...",
  actionLabel,
  onAction,
  onSearch,
  showFilter = true,
  children,
}: PageHeaderProps) {
  return (
    <div className="border-b border-border bg-card px-6 py-4 space-y-4 sticky top-0 z-10">
      <h1 className="text-xl font-bold">{title}</h1>
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            className="pl-9 h-9 bg-background"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>

        {/* Filter */}
        {showFilter && (
          <Button variant="outline" size="sm" className="gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter
          </Button>
        )}

        {children}

        {/* Spacer + Actions */}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          {actionLabel && (
            <Button size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
