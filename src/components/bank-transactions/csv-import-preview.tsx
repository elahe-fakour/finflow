"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { BankAccount } from "@/lib/bank-accounts/bank-accounts";
import { FileUp, TriangleAlert } from "lucide-react";
import { useState } from "react";

type PreviewRow = {
  amountMinorUnits: string | null;
  description: string | null;
  errors: { code: string; message: string }[];
  rowNumber: number;
  status: "ERROR" | "VALID";
  transactionDate: string | null;
};
type Preview = {
  fileName: string;
  invalidRowCount: number;
  rows: PreviewRow[];
  validRowCount: number;
};

function CsvImportPreview({
  accounts,
  workspaceId,
}: {
  accounts: BankAccount[];
  workspaceId: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [bankAccountId, setBankAccountId] = useState(accounts[0]?.id ?? "");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (file === null) {
      setError("Choose a CSV file to preview.");
      return;
    }
    setError(null);
    setPreview(null);
    setIsLoading(true);
    const formData = new FormData();
    formData.set("bankAccountId", bankAccountId);
    formData.set("file", file);
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/bank-transaction-imports/preview`,
        { body: formData, method: "POST" },
      );
      if (!response.ok) {
        setError(await getErrorMessage(response));
        return;
      }
      setPreview((await response.json()) as Preview);
    } catch {
      setError("We couldn't preview this CSV. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-control bg-primary/10 text-primary">
            <FileUp aria-hidden="true" className="size-5" />
          </div>
          <div>
            <CardTitle as="h2">Preview CSV import</CardTitle>
            <CardDescription className="mt-1">
              Review rows before any transaction is created. Confirmation is a later step.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              Bank account
              <select
                className="mt-1 h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                onChange={(event) => setBankAccountId(event.target.value)}
                value={bankAccountId}
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium">
              CSV file
              <input
                accept=".csv,text/csv"
                className="mt-1 block w-full text-sm"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                type="file"
              />
            </label>
          </div>
          {error ? (
            <p
              className="rounded-control border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          <Button disabled={isLoading} type="submit">
            {isLoading ? "Preparing preview…" : "Preview import"}
          </Button>
        </form>
        {preview ? <PreviewResults preview={preview} /> : null}
      </CardContent>
    </Card>
  );
}

function PreviewResults({ preview }: { preview: Preview }) {
  return (
    <div className="mt-6 space-y-3">
      <p className="text-sm text-muted-foreground">
        <strong className="text-foreground">{preview.fileName}</strong> · {preview.validRowCount}{" "}
        valid · {preview.invalidRowCount} need attention
      </p>
      <div className="overflow-x-auto rounded-card border border-border">
        <table className="w-full min-w-[38rem] text-left text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Row</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Amount (minor units)</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {preview.rows.map((row) => (
              <tr key={row.rowNumber}>
                <td className="px-3 py-2">{row.rowNumber}</td>
                <td className="px-3 py-2">{row.transactionDate ?? "—"}</td>
                <td className="px-3 py-2">{row.description ?? "—"}</td>
                <td className="px-3 py-2 font-mono">{row.amountMinorUnits ?? "—"}</td>
                <td className="px-3 py-2">
                  {row.status === "VALID" ? (
                    <span className="text-success">Valid</span>
                  ) : (
                    <span className="flex items-start gap-1 text-danger">
                      <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                      {row.errors.map((item) => item.message).join(" ")}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function getErrorMessage(response: Response): Promise<string> {
  const payload: unknown = await response.json().catch(() => null);
  return typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
    ? payload.message
    : "We couldn't preview this CSV. Please try again.";
}
export { CsvImportPreview };
