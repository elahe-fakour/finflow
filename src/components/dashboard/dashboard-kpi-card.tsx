import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { LucideIcon } from "@/lib/icons";

type DashboardKpiCardProps = {
  description: string;
  icon: LucideIcon;
  label: string;
  value: string;
};

function DashboardKpiCard({ description, icon: Icon, label, value }: DashboardKpiCardProps) {
  return (
    <Card className="min-w-0 border-border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-0">
        <p className="text-base font-semibold text-secondary-foreground">{label}</p>
        <div
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-primary"
        >
          <Icon className="size-5" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export { DashboardKpiCard };
