import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "An overview of your FinFlow financial operations.",
};

export default function DashboardPage() {
  return (
    <section aria-labelledby="dashboard-title">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary">Financial overview</p>
        <h1
          className="text-page-title font-semibold tracking-tight text-foreground sm:text-display"
          id="dashboard-title"
        >
          Dashboard
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Monitor your business finances and stay on top of your daily operations.
        </p>
      </header>
    </section>
  );
}
