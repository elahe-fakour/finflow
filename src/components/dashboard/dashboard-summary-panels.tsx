import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LucideIcon } from "@/lib/icons";

type RecentActivityItem = {
  description: string;
  icon: LucideIcon;
  timestamp: string;
  title: string;
};

type BankAccount = {
  balance: string;
  name: string;
  type: string;
};

type ProfitLossSummary = {
  expenses: string;
  income: string;
  netProfit: string;
};

function RecentActivityPanel({ activities }: { activities: RecentActivityItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Recent activity</CardTitle>
        <CardDescription>Sample financial activity from September 2026.</CardDescription>
        <CardAction>
          <Badge variant="outline">Sample data</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon;

            return (
              <li className="flex gap-3" key={`${activity.title}-${activity.timestamp}`}>
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-control bg-muted text-muted-foreground"
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm leading-5 text-foreground">
                    <span className="font-medium">{activity.title}</span> {activity.description}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{activity.timestamp}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

function BankAccountsPanel({ accounts }: { accounts: BankAccount[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Bank accounts</CardTitle>
        <CardDescription>Sample balances across financial accounts.</CardDescription>
        <CardAction>
          <Badge variant="outline">Sample data</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {accounts.map((account) => (
            <li
              className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              key={account.name}
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{account.name}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{account.type}</p>
              </div>
              <p className="shrink-0 font-medium tabular-nums text-foreground">{account.balance}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function ProfitLossSummaryPanel({ summary }: { summary: ProfitLossSummary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Profit &amp; loss</CardTitle>
        <CardDescription>September 2026 performance summary.</CardDescription>
        <CardAction>
          <Badge variant="outline">Sample data</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-sm text-muted-foreground">Income</dt>
            <dd className="font-medium tabular-nums text-foreground">{summary.income}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-sm text-muted-foreground">Expenses</dt>
            <dd className="font-medium tabular-nums text-foreground">{summary.expenses}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
            <dt className="font-medium text-foreground">Net profit</dt>
            <dd className="font-semibold tabular-nums text-success">{summary.netProfit}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

export {
  BankAccountsPanel,
  type BankAccount,
  ProfitLossSummaryPanel,
  type ProfitLossSummary,
  RecentActivityPanel,
  type RecentActivityItem,
};
