import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { BankTransactionImportHistoryItem } from "@/lib/bank-transactions/bank-transactions";
import { FileClock } from "lucide-react";

function BankTransactionImportHistory({
  imports,
}: {
  imports: BankTransactionImportHistoryItem[];
}) {
  if (imports.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-control bg-primary/10 text-primary">
            <FileClock aria-hidden="true" className="size-5" />
          </div>
          <div>
            <CardTitle as="h2">Recent CSV imports</CardTitle>
            <CardDescription className="mt-1">
              The five most recent bank-transaction import batches in this workspace.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border rounded-card border border-border">
          {imports.map((item) => (
            <li
              className="flex flex-col gap-1 px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              key={item.id}
            >
              <div>
                <p className="font-medium text-foreground">{item.fileName}</p>
                <p className="text-muted-foreground">
                  {item.bankAccount.name} · {formatImportedAt(item.importedAt)}
                </p>
              </div>
              <p className="text-muted-foreground">
                {item.importedRowCount === 1
                  ? "1 transaction imported"
                  : `${item.importedRowCount} transactions imported`}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function formatImportedAt(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export { BankTransactionImportHistory };
