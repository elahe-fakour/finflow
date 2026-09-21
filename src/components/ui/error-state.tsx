import { StateMessage } from "@/components/ui/state-message";
import type { LucideIcon } from "@/lib/icons";
import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

type ErrorStateProps = {
  action?: ReactNode;
  className?: string;
  description?: string;
  icon?: LucideIcon;
  title?: string;
};

function ErrorState({
  action,
  className,
  description = "Please try again in a moment.",
  icon = CircleAlert,
  title = "We couldn't load this content",
}: ErrorStateProps) {
  return (
    <StateMessage
      action={action}
      className={className}
      description={description}
      icon={icon}
      role="alert"
      title={title}
      tone="danger"
    />
  );
}

export { ErrorState };
