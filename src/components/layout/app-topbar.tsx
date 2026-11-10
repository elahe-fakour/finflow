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
    <header className="sticky top-0 z-30 flex h-20 shrink-0 items-center border-b border-border bg-surface/95 backdrop-blur-xl">
      <div className="flex w-full items-center gap-2 px-3 sm:gap-3 sm:px-5 lg:px-8">
        <div
          aria-label="Search will be available in a future milestone"
          className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-xl border border-border bg-background/80 px-3.5 text-base text-muted-foreground shadow-sm sm:px-4"
          role="search"
        >
          <Search aria-hidden="true" className="size-5 shrink-0 text-secondary-foreground" />
          <span className="truncate">Search transactions, invoices, and customers</span>
          <kbd className="ml-auto hidden shrink-0 rounded-lg border border-border bg-card px-2 py-1 font-mono text-xs text-secondary-foreground sm:inline-flex">
            ⌘ K
          </kbd>
        </div>

        <div className="hidden h-11 items-center gap-2 rounded-xl border border-border bg-card px-3.5 text-base font-medium text-foreground shadow-sm lg:flex">
          <Building2 aria-hidden="true" className="size-5 text-secondary-foreground" />
          <span className="max-w-36 truncate">Acme Studio</span>
          <ChevronDown aria-hidden="true" className="size-4 text-muted-foreground" />
          <span className="sr-only">
            Workspace selection will be available in a future milestone
          </span>
        </div>

        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-secondary-foreground shadow-sm">
          <Bell aria-hidden="true" className="size-5" />
          <span className="sr-only">Notifications will be available in a future milestone</span>
        </div>

        <div className="flex h-11 min-w-0 shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-2.5 text-sm text-foreground shadow-sm">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {accountInitial}
          </span>
          <span className="hidden max-w-40 truncate font-semibold xl:inline">{accountLabel}</span>
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}

export { AppTopbar };
