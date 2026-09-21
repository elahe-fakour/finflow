import type { LucideIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useId, type ReactNode } from "react";

type StateMessageProps = {
  action?: ReactNode;
  className?: string;
  description: string;
  icon?: LucideIcon;
  role?: "alert";
  title: string;
  tone?: "default" | "danger";
};

function StateMessage({
  action,
  className,
  description,
  icon: Icon,
  role,
  title,
  tone = "default",
}: StateMessageProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "flex min-h-56 flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface px-6 py-10 text-center",
        className,
      )}
      role={role}
    >
      {Icon ? (
        <div
          aria-hidden="true"
          className={cn(
            "mb-4 flex size-10 items-center justify-center rounded-control",
            tone === "danger" ? "bg-danger/10 text-danger" : "bg-muted text-muted-foreground",
          )}
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

export { StateMessage };
