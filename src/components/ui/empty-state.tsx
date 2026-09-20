import type { LucideIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useId, type ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
};

function EmptyState({ title, description, icon: Icon, action, className }: EmptyStateProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "flex min-h-56 flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface px-6 py-10 text-center",
        className,
      )}
    >
      {Icon ? (
        <div
          aria-hidden="true"
          className="mb-4 flex size-10 items-center justify-center rounded-control bg-muted text-muted-foreground"
        >
          <Icon className="size-5" />
        </div>
      ) : null}
      <h2 id={titleId} className="text-base font-semibold text-foreground">
        {title}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}

export { EmptyState };
