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
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type CashFlowDataPoint = {
  chartValue: number;
  netCashFlowMinorUnits: string;
  period: string;
};

type CashFlowChartProps = {
  data: CashFlowDataPoint[];
  isSample?: boolean;
  periodDescription?: string;
};

function formatUsdFromMinorUnits(minorUnits: number | string) {
  return formatUsdMinorUnits(String(Math.round(Number(minorUnits))));
}

function CashFlowChart({
  data,
  isSample = true,
  periodDescription = "April–September 2026",
}: CashFlowChartProps) {
  const title = `Cash flow ${isSample ? "sample data, " : ""}${periodDescription}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2" className="text-xl font-semibold">
          Cash flow
        </CardTitle>
        <CardDescription>Net cash flow for {periodDescription} in USD.</CardDescription>
        <CardAction>
          <Badge variant="outline">{isSample ? "Sample data" : "Live data"}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="pt-2">
        {data.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No bank transactions were recorded during this period.
          </p>
        ) : (
          <>
            <div className="h-72 w-full">
              <ResponsiveContainer height="100%" width="100%">
                <AreaChart
                  accessibilityLayer
                  data={data}
                  desc={`${title} in US dollars. A text table with the same values follows the chart.`}
                  margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
                  title={title}
                >
                  <defs>
                    <linearGradient id="cash-flow-gradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="var(--action-primary)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--action-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="var(--border-subtle)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    axisLine={false}
                    dataKey="period"
                    tick={{ fill: "var(--text-secondary)", fontSize: 14 }}
                    tickLine={false}
                  />
                  <YAxis
                    axisLine={false}
                    tick={{ fill: "var(--text-secondary)", fontSize: 14 }}
                    tickFormatter={(value: number) => formatUsdFromMinorUnits(value)}
                    tickLine={false}
                    width={64}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--surface-raised)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--shape-control)",
                      color: "var(--text-primary)",
                    }}
                    cursor={{ stroke: "var(--border-subtle)", strokeWidth: 1 }}
                    formatter={(value) => [formatUsdFromMinorUnits(Number(value)), "Net cash flow"]}
                  />
                  <Area
                    dataKey="chartValue"
                    fill="url(#cash-flow-gradient)"
                    fillOpacity={1}
                    isAnimationActive={false}
                    name="Net cash flow"
                    stroke="var(--action-primary)"
                    strokeWidth={2}
                    type="monotone"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <table className="sr-only">
              <caption>
                Cash flow {isSample ? "sample data" : "report data"} for {periodDescription} in US
                dollars.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Period</th>
                  <th scope="col">Net cash flow</th>
                </tr>
              </thead>
              <tbody>
                {data.map((dataPoint) => (
                  <tr key={dataPoint.period}>
                    <td>{dataPoint.period}</td>
                    <td>{formatUsdMinorUnits(dataPoint.netCashFlowMinorUnits)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export { CashFlowChart, type CashFlowDataPoint };
