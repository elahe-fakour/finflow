"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { BankAccount } from "@/lib/bank-accounts/bank-accounts";
import { FileUp, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type PreviewRow = {
  amountMinorUnits: string | null;
  description: string | null;
  errors: { code: string; message: string }[];
  rowNumber: number;
  status: "DUPLICATE" | "ERROR" | "VALID";
  transactionDate: string | null;
};
type Preview = {
  fileName: string;
  duplicateRowCount: number;
  invalidRowCount: number;
  previewToken: string;
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
  const [isConfirming, setIsConfirming] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (file === null) {
      setError("Choose a CSV file to preview.");
      return;
    }
    setError(null);
    setSuccessMessage(null);
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

  async function confirmImport() {
    if (preview === null || preview.invalidRowCount > 0 || preview.duplicateRowCount > 0) return;
    setError(null);
    setSuccessMessage(null);
    setIsConfirming(true);
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/bank-transaction-imports/confirm`,
        {
          body: JSON.stringify({ previewToken: preview.previewToken }),
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": crypto.randomUUID(),
          },
          method: "POST",
        },
      );
      if (!response.ok) {
        setError(await getErrorMessage(response));
        return;
      }
      const result = (await response.json()) as { importedRowCount: number };
      setSuccessMessage(`${result.importedRowCount} transaction(s) imported successfully.`);
      setPreview(null);
      setFile(null);
      router.refresh();
    } catch {
      setError("We couldn't confirm this CSV import. Please try again.");
    } finally {
      setIsConfirming(false);
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
          {successMessage ? (
            <p
              className="rounded-control border border-success/25 bg-success/10 px-3 py-2 text-sm text-success"
              role="status"
            >
              {successMessage}
            </p>
          ) : null}
          <Button disabled={isLoading} type="submit">
            {isLoading ? "Preparing preview…" : "Preview import"}
          </Button>
        </form>
        {preview ? (
          <PreviewResults isConfirming={isConfirming} onConfirm={confirmImport} preview={preview} />
        ) : null}
      </CardContent>
    </Card>
  );
}

function PreviewResults({
  isConfirming,
  onConfirm,
  preview,
}: {
  isConfirming: boolean;
  onConfirm: () => void;
  preview: Preview;
}) {
  const canConfirm = preview.invalidRowCount === 0 && preview.duplicateRowCount === 0;
  return (
    <div className="mt-6 space-y-3">
      <p className="text-sm text-muted-foreground">
        <strong className="text-foreground">{preview.fileName}</strong> · {preview.validRowCount}{" "}
        valid · {preview.invalidRowCount} invalid · {preview.duplicateRowCount} already imported
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
                  ) : row.status === "DUPLICATE" ? (
                    <span className="flex items-start gap-1 text-warning">
                      <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                      Already imported
                    </span>
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
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={!canConfirm || isConfirming} onClick={onConfirm} type="button">
          {isConfirming ? "Importing…" : "Confirm and import"}
        </Button>
        {!canConfirm ? (
          <p className="text-sm text-muted-foreground">
            Correct every invalid or duplicate row, then preview the revised file again.
          </p>
        ) : null}
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
