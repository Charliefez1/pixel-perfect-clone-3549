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
    <div className="border-b border-border bg-background-elevated px-4 sm:px-6 py-4 sm:py-5 space-y-3 sm:space-y-4 sticky top-0 z-10">
      <h1 className="text-page-title">{title}</h1>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-subtle" strokeWidth={2} />
          <Input
            placeholder={searchPlaceholder}
            className="pl-9 h-10 bg-background rounded-lg"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>

        {/* Filter */}
        {showFilter && (
          <Button variant="outline" size="sm" className="gap-2 rounded-lg">
            <SlidersHorizontal className="h-4 w-4" strokeWidth={2} />
            <span className="hidden sm:inline">Filter</span>
          </Button>
        )}

        {children}

        {/* Spacer + Actions */}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg">
            <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
          </Button>
          {actionLabel && (
            <Button size="sm" onClick={onAction} className="rounded-lg">
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
