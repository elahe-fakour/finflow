"use client";

import {
  isNavigationItemActive,
  navigationGroups,
  settingsNavigationItem,
  type NavigationItem,
} from "@/components/layout/navigation-config";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

function NavigationLink({ item, pathname }: { item: NavigationItem; pathname: string }) {
  const isActive = isNavigationItemActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
      href={item.href}
    >
      <Icon aria-hidden="true" className="size-5 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside
      aria-label="FinFlow application sidebar"
      className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-border bg-surface/95 lg:flex"
    >
      <div className="flex h-20 items-center border-b border-border px-5">
        <Link
          aria-label="FinFlow dashboard"
          className="flex items-center gap-3 rounded-xl text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          href="/"
        >
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground shadow-sm">
            F
          </span>
          <span>
            <span className="block text-base font-semibold">FinFlow</span>
            <span className="block text-xs text-muted-foreground">Financial operations</span>
          </span>
        </Link>
      </div>

      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 py-5">
        <div className="space-y-6">
          {navigationGroups.map((group) => (
            <div aria-labelledby={`navigation-group-${group.label}`} key={group.label} role="group">
              <p
                className="px-3 pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                id={`navigation-group-${group.label}`}
              >
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavigationLink item={item} key={item.href} pathname={pathname} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-border p-3">
        <NavigationLink item={settingsNavigationItem} pathname={pathname} />
      </div>
    </aside>
  );
}

export { AppSidebar };
