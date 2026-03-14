import { Skeleton } from "@/components/ui/skeleton";

/** Branded spinner used as the minimal loading indicator */
function BrandSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm animate-pulse">
        N
      </div>
    </div>
  );
}

/** Skeleton that mimics a typical page layout with a header and content area */
function PageSkeleton({ label }: { label?: string }) {
  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          {label && (
            <span className="sr-only">Loading {label}...</span>
          )}
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      {/* Content area skeleton */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Skeleton for dashboard-style pages with cards */
function DashboardSkeleton() {
  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}

/** Skeleton for settings-style pages */
function SettingsSkeleton() {
  return (
    <div className="flex-1 p-6 space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="flex gap-6">
        <div className="w-48 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
        <div className="flex-1 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export { BrandSpinner, PageSkeleton, DashboardSkeleton, SettingsSkeleton };
