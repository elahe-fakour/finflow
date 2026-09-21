import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartNoAxesCombined } from "lucide-react";

function DashboardLoadingState() {
  return (
    <section aria-busy="true" aria-label="Loading dashboard" className="space-y-6">
      <span className="sr-only" role="status">
        Loading dashboard
      </span>

      <div aria-hidden="true" className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>

      <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="rounded-card border border-border bg-surface p-4" key={index}>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-5 h-8 w-32" />
            <Skeleton className="mt-3 h-4 w-36" />
          </div>
        ))}
      </div>

      <div aria-hidden="true" className="rounded-card border border-border bg-surface p-4">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="mt-2 h-4 w-52" />
        <Skeleton className="mt-6 h-72 w-full" />
      </div>

      <div
        aria-hidden="true"
        className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.85fr)]"
      >
        <div className="rounded-card border border-border bg-surface p-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-2 h-4 w-52" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton className="h-12 w-full" key={index} />
            ))}
          </div>
        </div>
        <div className="rounded-card border border-border bg-surface p-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="mt-2 h-4 w-48" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton className="h-16 w-full" key={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardEmptyState() {
  return (
    <section aria-label="Dashboard">
      <EmptyState
        description="Financial activity will appear here after you create invoices, record expenses, or connect an account."
        icon={ChartNoAxesCombined}
        title="No financial activity yet"
      />
    </section>
  );
}

export { DashboardEmptyState, DashboardLoadingState };
