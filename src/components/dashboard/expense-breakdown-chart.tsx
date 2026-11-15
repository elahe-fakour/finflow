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
import { formatUsdMinorUnits } from "@/lib/money/format-minor-units";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type ExpenseBreakdownDataPoint = {
  amountMinorUnits: string;
  category: string;
  chartValue: number;
  color: string;
};

type ExpenseBreakdownChartProps = {
  data: ExpenseBreakdownDataPoint[];
  description?: string;
  isSample?: boolean;
  title?: string;
  totalLabel?: string;
};

function ExpenseBreakdownChart({
  data,
  description = "September 2026 spending by category.",
  isSample = true,
  title = "Expense breakdown",
  totalLabel = "Total expenses",
}: ExpenseBreakdownChartProps) {
  const totalMinorUnits = data.reduce((total, item) => total + BigInt(item.amountMinorUnits), 0n);

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2" className="text-xl font-semibold">
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Badge variant="outline">{isSample ? "Sample data" : "Live data"}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="pt-2">
        {data.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No manual entries were recorded during this period.
          </p>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:items-center">
            <div aria-hidden="true" className="relative mx-auto h-64 w-full max-w-xs">
              <ResponsiveContainer height="100%" width="100%">
                <PieChart>
                  <Pie
                    cornerRadius={4}
                    data={data}
                    dataKey="chartValue"
                    innerRadius="60%"
                    isAnimationActive={false}
                    outerRadius="88%"
                    paddingAngle={3}
                    stroke="var(--surface-raised)"
                    strokeWidth={3}
                  >
                    {data.map((dataPoint) => (
                      <Cell
                        fill={dataPoint.color}
                        key={`${dataPoint.category}-${dataPoint.color}`}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--surface-raised)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--shape-control)",
                      color: "var(--text-primary)",
                    }}
                    formatter={(value) => [
                      formatUsdMinorUnits(String(Math.round(Number(value)))),
                      title,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-medium text-muted-foreground">{totalLabel}</span>
                <span className="text-xl font-bold tabular-nums text-foreground">
                  {formatUsdMinorUnits(totalMinorUnits.toString())}
                </span>
              </div>
            </div>
            <p className="sr-only">
              {totalLabel}: {formatUsdMinorUnits(totalMinorUnits.toString())}. Amounts are listed by
              category.
            </p>

            <ul aria-label={`${title} categories`} className="grid gap-3 sm:grid-cols-2">
              {data.map((dataPoint) => (
                <li
                  className="flex min-w-0 items-center justify-between gap-3 rounded-control border border-border bg-muted/40 px-3 py-2.5"
                  key={`${dataPoint.category}-${dataPoint.color}`}
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
                    {formatUsdMinorUnits(dataPoint.amountMinorUnits)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { ExpenseBreakdownChart, type ExpenseBreakdownDataPoint };
