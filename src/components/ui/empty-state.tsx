import { StateMessage } from "@/components/ui/state-message";
import type { LucideIcon } from "@/lib/icons";
import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
};

function EmptyState({ title, description, icon: Icon, action, className }: EmptyStateProps) {
  return (
    <StateMessage
      action={action}
      className={className}
      description={description}
      icon={Icon}
      title={title}
    />
  );
}

export { EmptyState };
