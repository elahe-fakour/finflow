import { LogoutButton } from "@/components/auth/logout-button";
import type { AuthenticatedUser } from "@/lib/auth/auth-types";
import { Bell, Building2, ChevronDown, Search } from "lucide-react";

type AppTopbarProps = {
  user: AuthenticatedUser;
};

function AppTopbar({ user }: AppTopbarProps) {
  const accountLabel = user.displayName ?? user.email;
  const accountInitial = accountLabel.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center border-b border-border bg-surface/95 backdrop-blur">
      <div className="flex w-full items-center gap-3 px-4 sm:px-6">
        <div
          aria-label="Search will be available in a future milestone"
          className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-control border border-input bg-background px-3 text-sm text-muted-foreground"
          role="search"
        >
          <Search aria-hidden="true" className="size-4 shrink-0" />
          <span className="truncate">Search transactions, invoices, and customers</span>
          <kbd className="ml-auto hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground sm:inline-flex">
            ⌘ K
          </kbd>
        </div>

        <div className="hidden h-9 items-center gap-2 rounded-control border border-border px-3 text-sm text-foreground md:flex">
          <Building2 aria-hidden="true" className="size-4 text-muted-foreground" />
          <span className="max-w-32 truncate font-medium">Acme Studio</span>
          <ChevronDown aria-hidden="true" className="size-4 text-muted-foreground" />
          <span className="sr-only">
            Workspace selection will be available in a future milestone
          </span>
        </div>

        <div className="flex size-9 items-center justify-center rounded-control border border-border text-muted-foreground">
          <Bell aria-hidden="true" className="size-4" />
          <span className="sr-only">Notifications will be available in a future milestone</span>
        </div>

        <div className="flex h-9 items-center gap-2 rounded-control border border-border px-2 text-sm text-foreground">
          <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {accountInitial}
          </span>
          <span className="hidden max-w-32 truncate font-medium lg:inline">{accountLabel}</span>
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}

export { AppTopbar };
