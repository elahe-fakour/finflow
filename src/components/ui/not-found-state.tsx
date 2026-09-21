import { StateMessage } from "@/components/ui/state-message";
import type { LucideIcon } from "@/lib/icons";
import { FileQuestionMark } from "lucide-react";
import type { ReactNode } from "react";

type NotFoundStateProps = {
  action?: ReactNode;
  className?: string;
  description?: string;
  icon?: LucideIcon;
  title?: string;
};

function NotFoundState({
  action,
  className,
  description = "The page may have moved, or the URL may be incorrect.",
  icon = FileQuestionMark,
  title = "We couldn't find that page",
}: NotFoundStateProps) {
  return (
    <StateMessage
      action={action}
      className={className}
      description={description}
      icon={icon}
      title={title}
    />
  );
}

export { NotFoundState };
