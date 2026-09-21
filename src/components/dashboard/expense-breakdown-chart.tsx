"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type ExpenseBreakdownDataPoint = {
  amountCents: number;
  category: string;
  color: string;
};

type ExpenseBreakdownChartProps = {
  data: ExpenseBreakdownDataPoint[];
};

const usdFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

function formatUsdFromCents(cents: number) {
  return usdFormatter.format(cents / 100);
}

function ExpenseBreakdownChart({ data }: ExpenseBreakdownChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Expense breakdown</CardTitle>
        <CardDescription>Current-period spending by category.</CardDescription>
        <CardAction>
          <Badge variant="outline">Sample data</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
          <div aria-hidden="true" className="mx-auto h-64 w-full max-w-xs">
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie
                  cornerRadius={4}
                  data={data}
                  dataKey="amountCents"
                  innerRadius="60%"
                  isAnimationActive={false}
                  outerRadius="88%"
                  paddingAngle={3}
                  stroke="var(--surface-raised)"
                  strokeWidth={3}
                >
                  {data.map((dataPoint) => (
                    <Cell fill={dataPoint.color} key={dataPoint.category} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--surface-raised)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--shape-control)",
                    color: "var(--text-primary)",
                  }}
                  formatter={(value) => [formatUsdFromCents(Number(value)), "Expenses"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul aria-label="Expense categories" className="grid gap-3 sm:grid-cols-2">
            {data.map((dataPoint) => (
              <li
                className="flex min-w-0 items-center justify-between gap-3 rounded-control border border-border bg-muted/40 px-3 py-2.5"
                key={dataPoint.category}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: dataPoint.color }}
                  />
                  <span className="truncate text-sm font-medium text-foreground">
                    {dataPoint.category}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                  {formatUsdFromCents(dataPoint.amountCents)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export { ExpenseBreakdownChart, type ExpenseBreakdownDataPoint };
