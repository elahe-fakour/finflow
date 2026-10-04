import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import type { AuthenticatedUser } from "@/lib/auth/auth-types";
import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
  user: AuthenticatedUser;
};

function AppShell({ children, user }: AppShellProps) {
  return (
    <div className="min-h-svh bg-background">
      <a
        className="sr-only fixed top-4 left-4 z-50 rounded-control bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        href="#main-content"
      >
        Skip to main content
      </a>
      <div className="flex min-h-svh">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar user={user} />
          <main className="flex-1 pb-24 lg:pb-0" id="main-content" tabIndex={-1}>
            <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
      <MobileNavigation />
    </div>
  );
}

export { AppShell };
