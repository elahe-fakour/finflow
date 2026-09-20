import type { LucideIcon } from "@/lib/icons";
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

export type NavigationItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

export type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

const dashboardItem: NavigationItem = {
  href: "/",
  icon: LayoutDashboard,
  label: "Dashboard",
};

const invoicesItem: NavigationItem = {
  href: "/invoices",
  icon: FileText,
  label: "Invoices",
};

const customersItem: NavigationItem = {
  href: "/customers",
  icon: Users,
  label: "Customers",
};

const vendorsItem: NavigationItem = {
  href: "/vendors",
  icon: Building2,
  label: "Vendors",
};

const transactionsItem: NavigationItem = {
  href: "/transactions",
  icon: ArrowLeftRight,
  label: "Transactions",
};

const bankAccountsItem: NavigationItem = {
  href: "/bank-accounts",
  icon: Landmark,
  label: "Bank Accounts",
};

const incomeExpensesItem: NavigationItem = {
  href: "/income-expenses",
  icon: Receipt,
  label: "Income & Expenses",
};

const reportsItem: NavigationItem = {
  href: "/reports",
  icon: BarChart3,
  label: "Reports",
};

const reconciliationItem: NavigationItem = {
  href: "/reconciliation",
  icon: Scale,
  label: "Reconciliation",
};

const settingsItem: NavigationItem = {
  href: "/settings",
  icon: Settings,
  label: "Settings",
};

export const navigationGroups: NavigationGroup[] = [
  {
    label: "Overview",
    items: [dashboardItem],
  },
  {
    label: "Sales",
    items: [invoicesItem, customersItem, vendorsItem],
  },
  {
    label: "Banking",
    items: [transactionsItem, bankAccountsItem, incomeExpensesItem],
  },
  {
    label: "Analysis",
    items: [reportsItem, reconciliationItem],
  },
];

export const settingsNavigationItem = settingsItem;

export const mobilePrimaryNavigationItems = [
  dashboardItem,
  invoicesItem,
  transactionsItem,
  reportsItem,
];

export const mobileMoreNavigationItems = [
  customersItem,
  vendorsItem,
  bankAccountsItem,
  incomeExpensesItem,
  reconciliationItem,
  settingsItem,
];

export function isNavigationItemActive(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}
