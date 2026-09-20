"use client";

import type { LucideIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import {
  ArrowLeftRight,
  BarChart3,
  Building2,
  FileText,
  Landmark,
  LayoutDashboard,
  Receipt,
  Scale,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavigationItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

const navigationGroups: NavigationGroup[] = [
  {
    label: "Overview",
    items: [
      {
        href: "/",
        icon: LayoutDashboard,
        label: "Dashboard",
      },
    ],
  },
  {
    label: "Sales",
    items: [
      {
        href: "/invoices",
        icon: FileText,
        label: "Invoices",
      },
      {
        href: "/customers",
        icon: Users,
        label: "Customers",
      },
      {
        href: "/vendors",
        icon: Building2,
        label: "Vendors",
      },
    ],
  },
  {
    label: "Banking",
    items: [
      {
        href: "/transactions",
        icon: ArrowLeftRight,
        label: "Transactions",
      },
      {
        href: "/bank-accounts",
        icon: Landmark,
        label: "Bank Accounts",
      },
      {
        href: "/income-expenses",
        icon: Receipt,
        label: "Income & Expenses",
      },
    ],
  },
  {
    label: "Analysis",
    items: [
      {
        href: "/reports",
        icon: BarChart3,
        label: "Reports",
      },
      {
        href: "/reconciliation",
        icon: Scale,
        label: "Reconciliation",
      },
    ],
  },
];

const settingsItem: NavigationItem = {
  href: "/settings",
  icon: Settings,
  label: "Settings",
};

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function NavigationLink({ item, pathname }: { item: NavigationItem; pathname: string }) {
  const isActive = isActivePath(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
      href={item.href}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Link
          aria-label="FinFlow dashboard"
          className="flex items-center gap-3 rounded-control text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          href="/"
        >
          <span className="flex size-8 items-center justify-center rounded-control bg-primary text-sm font-bold text-primary-foreground">
            F
          </span>
          <span>
            <span className="block text-sm font-semibold">FinFlow</span>
            <span className="block text-xs text-muted-foreground">Financial operations</span>
          </span>
        </Link>
      </div>

      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 py-5">
        <div className="space-y-6">
          {navigationGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
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
        <NavigationLink item={settingsItem} pathname={pathname} />
      </div>
    </aside>
  );
}

export { AppSidebar };
