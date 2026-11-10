import { Badge } from "@/components/ui/badge";
import type { InvoiceStatus } from "@/features/invoices/invoice-types";
import { cn } from "@/lib/utils";

const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

const invoiceStatusClassNames: Record<InvoiceStatus, string> = {
  draft: "border-border bg-muted text-muted-foreground",
  sent: "border-info/20 bg-info/10 text-info",
  paid: "border-success/20 bg-success/10 text-success",
  overdue: "border-danger/20 bg-danger/10 text-danger",
  cancelled: "border-border bg-muted text-muted-foreground",
};

function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const label = invoiceStatusLabels[status];

  return (
    <Badge
      aria-label={`Invoice status: ${label}`}
      className={cn("h-9 rounded-full px-4 text-sm font-semibold", invoiceStatusClassNames[status])}
      variant="outline"
    >
      {label}
    </Badge>
  );
}

export { InvoiceStatusBadge, invoiceStatusLabels };
