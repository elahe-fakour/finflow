import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type PageLoadingStateProps = {
  cardCount?: number;
  className?: string;
};

type TableLoadingStateProps = {
  className?: string;
  columnCount?: number;
  rowCount?: number;
};

function getSkeletonItemCount(count: number, minimum = 0) {
  return Number.isFinite(count) ? Math.max(minimum, Math.floor(count)) : minimum;
}

function PageLoadingState({ cardCount = 4, className }: PageLoadingStateProps) {
  const cards = getSkeletonItemCount(cardCount);

  return (
    <section
      aria-busy="true"
      aria-label="Loading page content"
      className={cn("space-y-6", className)}
    >
      <span className="sr-only" role="status">
        Loading page content
      </span>
      <div aria-hidden="true" className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-9 w-28 shrink-0" />
      </div>
      <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: cards }, (_, index) => (
          <div className="rounded-card border border-border bg-surface p-5" key={index}>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-8 w-28" />
            <Skeleton className="mt-3 h-3 w-20" />
          </div>
        ))}
      </div>
    </section>
  );
}

function TableLoadingState({ className, columnCount = 4, rowCount = 5 }: TableLoadingStateProps) {
  const columns = getSkeletonItemCount(columnCount, 1);
  const rows = getSkeletonItemCount(rowCount);
  const gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;

  return (
    <section
      aria-busy="true"
      aria-label="Loading table data"
      className={cn("overflow-hidden rounded-card border border-border bg-surface", className)}
    >
      <span className="sr-only" role="status">
        Loading table data
      </span>
      <div aria-hidden="true">
        <div
          className="grid gap-4 border-b border-border bg-muted/50 px-5 py-3"
          style={{ gridTemplateColumns }}
        >
          {Array.from({ length: columns }, (_, index) => (
            <Skeleton className="h-3 w-20 max-w-full" key={index} />
          ))}
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: rows }, (_, rowIndex) => (
            <div className="grid gap-4 px-5 py-4" key={rowIndex} style={{ gridTemplateColumns }}>
              {Array.from({ length: columns }, (_, columnIndex) => (
                <Skeleton
                  className={cn("h-4 max-w-full", columnIndex === 0 ? "w-28" : "w-20")}
                  key={columnIndex}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export { PageLoadingState, TableLoadingState };
