import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type InvoiceStatus = "Draft" | "Overdue" | "Paid" | "Sent";

type RecentInvoice = {
  amount: string;
  customer: string;
  dueDate: string;
  invoiceNumber: string;
  status: InvoiceStatus;
};

type RecentInvoicesPanelProps = {
  invoices: RecentInvoice[];
};

const invoiceStatusClassNames: Record<InvoiceStatus, string> = {
  Draft: "border-border bg-muted text-muted-foreground",
  Overdue: "border-danger/20 bg-danger/10 text-danger",
  Paid: "border-success/20 bg-success/10 text-success",
  Sent: "border-info/20 bg-info/10 text-info",
};

function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <Badge className={cn("border", invoiceStatusClassNames[status])} variant="outline">
      {status}
    </Badge>
  );
}

function RecentInvoicesPanel({ invoices }: RecentInvoicesPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Recent invoices</CardTitle>
        <CardDescription>September 2026 invoice activity for your workspace.</CardDescription>
        <CardAction>
          <Badge variant="outline">Sample data</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <caption className="sr-only">Recent invoice sample data</caption>
            <thead className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="pb-3 font-medium" scope="col">
                  Invoice
                </th>
                <th className="pb-3 font-medium" scope="col">
                  Due date
                </th>
                <th className="pb-3 font-medium" scope="col">
                  Status
                </th>
                <th className="pb-3 text-right font-medium" scope="col">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((invoice) => (
                <tr key={invoice.invoiceNumber}>
                  <td className="py-3.5 pr-4">
                    <p className="font-medium text-foreground">{invoice.invoiceNumber}</p>
                    <p className="mt-0.5 text-muted-foreground">{invoice.customer}</p>
                  </td>
                  <td className="py-3.5 pr-4 text-muted-foreground">{invoice.dueDate}</td>
                  <td className="py-3.5 pr-4">
                    <InvoiceStatusBadge status={invoice.status} />
                  </td>
                  <td className="py-3.5 text-right font-medium tabular-nums text-foreground">
                    {invoice.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="space-y-3 md:hidden">
          {invoices.map((invoice) => (
            <li
              className="rounded-control border border-border bg-muted/40 p-3"
              key={invoice.invoiceNumber}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{invoice.invoiceNumber}</p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {invoice.customer}
                  </p>
                </div>
                <p className="shrink-0 font-medium tabular-nums text-foreground">
                  {invoice.amount}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">Due {invoice.dueDate}</p>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export { RecentInvoicesPanel, type RecentInvoice };
