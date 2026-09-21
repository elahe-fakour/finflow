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
  netCashFlowCents: number;
  period: string;
};

type CashFlowChartProps = {
  data: CashFlowDataPoint[];
};

const usdFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

function formatUsdFromCents(cents: number) {
  return usdFormatter.format(cents / 100);
}

function CashFlowChart({ data }: CashFlowChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Cash flow</CardTitle>
        <CardDescription>April–September 2026 net cash flow in USD.</CardDescription>
        <CardAction>
          <Badge variant="outline">Sample data</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-72 w-full">
          <ResponsiveContainer height="100%" width="100%">
            <AreaChart
              accessibilityLayer
              data={data}
              desc="April through September 2026 net cash flow sample data in US dollars. A text table with the same values follows the chart."
              margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
              title="Cash flow sample data, April through September 2026"
            >
              <defs>
                <linearGradient id="cash-flow-gradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="var(--action-primary)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--action-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="period"
                tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                tickFormatter={(value: number) => formatUsdFromCents(value)}
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
                formatter={(value) => [formatUsdFromCents(Number(value)), "Net cash flow"]}
              />
              <Area
                dataKey="netCashFlowCents"
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
          <caption>Cash flow sample data from April through September 2026 in US dollars.</caption>
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
                <td>{formatUsdFromCents(dataPoint.netCashFlowCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

export { CashFlowChart, type CashFlowDataPoint };
