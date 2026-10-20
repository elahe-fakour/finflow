"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScoredInvoiceCandidate } from "@/lib/reconciliation/reconciliation";
import { CheckCircle2, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ReconciliationSuggestionsProps = {
  hasActiveReconciliation: boolean;
  transactionId: string;
  workspaceId: string;
  suggestions: ScoredInvoiceCandidate[];
};

function ReconciliationSuggestions({
  hasActiveReconciliation,
  suggestions,
  transactionId,
  workspaceId,
}: ReconciliationSuggestionsProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  async function confirmSuggestion(suggestion: ScoredInvoiceCandidate) {
    setIsConfirming(suggestion.invoiceId);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/workspaces/${encodeURIComponent(workspaceId)}/bank-transactions/${encodeURIComponent(transactionId)}/reconciliation-suggestions/confirm`,
        {
          body: JSON.stringify({
            confidenceBasisPoints: suggestion.scoreBasisPoints,
            invoiceId: suggestion.invoiceId,
          }),
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": crypto.randomUUID(),
          },
          method: "POST",
        },
      );

      if (!response.ok) {
        setMessage({ kind: "error", text: await getErrorMessage(response) });
        return;
      }

      setMessage({ kind: "success", text: "Reconciliation confirmed successfully." });
      router.refresh();
    } catch {
      setMessage({ kind: "error", text: "We couldn't confirm this match. Please try again." });
    } finally {
      setIsConfirming(null);
    }
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle as="h2">
          {hasActiveReconciliation ? "Reconciliation confirmed" : "Possible invoice matches"}
        </CardTitle>
        <CardDescription>
          {hasActiveReconciliation
            ? "This transaction already has an active reconciliation and cannot be matched again."
            : "Review the evidence before any payment or reconciliation is created."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasActiveReconciliation ? (
          <div className="flex items-start gap-3 rounded-lg border border-success/30 bg-success/5 p-4 text-sm text-success">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <p>Payment and invoice status have been updated for this bank transaction.</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="flex items-start gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <p>No invoice candidates met the minimum confidence threshold.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <article className="rounded-lg border border-border p-4" key={suggestion.invoiceId}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{suggestion.invoiceNumber}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Due {suggestion.dueDate} · {formatConfidence(suggestion.scoreBasisPoints)}
                    </p>
                  </div>
                  <Badge variant={getBadgeVariant(suggestion.classification)}>
                    {suggestion.classification} confidence
                  </Badge>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {suggestion.evidence.map((evidence) => (
                    <li className="flex items-start gap-2" key={evidence.code}>
                      <CircleCheck
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-primary"
                      />
                      <span>
                        {evidence.explanation}{" "}
                        <span className="font-medium">(+{evidence.points})</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-4"
                  disabled={isConfirming !== null}
                  onClick={() => confirmSuggestion(suggestion)}
                  type="button"
                >
                  {isConfirming === suggestion.invoiceId ? "Confirming…" : "Confirm match"}
                </Button>
              </article>
            ))}
          </div>
        )}
        {message ? (
          <p
            aria-live="polite"
            className={
              message.kind === "success"
                ? "mt-4 flex items-center gap-2 text-sm text-success"
                : "mt-4 flex items-center gap-2 text-sm text-destructive"
            }
            role={message.kind === "error" ? "alert" : "status"}
          >
            {message.kind === "success" ? (
              <CheckCircle2 aria-hidden="true" className="size-4" />
            ) : (
              <TriangleAlert aria-hidden="true" className="size-4" />
            )}
            {message.text}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

async function getErrorMessage(response: Response): Promise<string> {
  const payload: unknown = await response.json().catch(() => null);

  if (typeof payload === "object" && payload !== null && "message" in payload) {
    const message = payload.message;

    if (typeof message === "string") return message;
  }

  return "We couldn't confirm this match. Please try again.";
}

function formatConfidence(scoreBasisPoints: number): string {
  return `${(scoreBasisPoints / 100).toFixed(0)}% match`;
}

function getBadgeVariant(classification: ScoredInvoiceCandidate["classification"]) {
  if (classification === "HIGH") return "default" as const;
  if (classification === "MEDIUM") return "secondary" as const;
  return "outline" as const;
}

export { ReconciliationSuggestions };
