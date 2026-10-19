import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScoredInvoiceCandidate } from "@/lib/reconciliation/reconciliation";
import { CircleCheck, Info } from "lucide-react";

type ReconciliationSuggestionsProps = {
  suggestions: ScoredInvoiceCandidate[];
};

function ReconciliationSuggestions({ suggestions }: ReconciliationSuggestionsProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle as="h2">Possible invoice matches</CardTitle>
        <CardDescription>
          Review the evidence before any payment or reconciliation is created.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
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
              </article>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
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
