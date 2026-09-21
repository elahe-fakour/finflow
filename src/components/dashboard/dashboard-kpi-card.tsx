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
    <Card className="min-w-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-0">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-control bg-primary/10 text-primary"
        >
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export { DashboardKpiCard };
