import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "@/lib/icons";

type QuickAction = {
  description: string;
  icon: LucideIcon;
  label: string;
};

type QuickActionsPanelProps = {
  actions: QuickAction[];
};

function QuickActionsPanel({ actions }: QuickActionsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Quick actions</CardTitle>
        <CardDescription>Actions will be available as related workflows are built.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          {actions.map((action) => {
            const Icon = action.icon;

            return (
              <Button
                className="h-auto min-h-16 w-full justify-start px-3 py-3 text-left whitespace-normal"
                disabled
                key={action.label}
                type="button"
                variant="outline"
              >
                <Icon aria-hidden="true" className="size-4" />
                <span className="flex flex-col items-start gap-0.5">
                  <span>{action.label}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {action.description}
                  </span>
                </span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export { QuickActionsPanel, type QuickAction };
