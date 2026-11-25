import type { ReactNode } from "react";

type PageHeadingProps = {
  action?: ReactNode;
  description: ReactNode;
  eyebrow: string;
  id: string;
  title: string;
};

function PageHeading({ action, description, eyebrow, id, title }: PageHeadingProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-2">
        <p className="text-sm font-semibold tracking-wide text-primary uppercase">{eyebrow}</p>
        <h1
          className="text-page-title font-bold tracking-tight text-foreground sm:text-display"
          id={id}
        >
          {title}
        </h1>
        <p className="max-w-3xl text-base leading-7 text-secondary-foreground">{description}</p>
      </div>
      {action ? <div className="w-full shrink-0 sm:w-auto">{action}</div> : null}
    </header>
  );
}

export { PageHeading };
