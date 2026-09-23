"use client";

import type { Customer } from "@/components/customers/customer-sample-data";
import {
  InvoiceLineItemsEditor,
  type InvoiceLineItemDraft,
  type InvoiceLineItemPreview,
} from "@/components/invoices/invoice-line-items-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  calculateInvoiceTotals,
  calculateLineItemTotals,
} from "@/features/invoices/invoice-calculations";
import type { InvoiceLineItem } from "@/features/invoices/invoice-types";
import { parseMoneyInput } from "@/features/invoices/money";
import { useMemo, useState } from "react";

type InvoiceEditorProps = {
  customers: Pick<Customer, "id" | "name">[];
};

type EditorStatus = "idle" | "invalid" | "unsaved";

const initialLineItems: InvoiceLineItemDraft[] = [
  {
    description: "Consulting services",
    id: "line-1",
    quantity: "1",
    unitPrice: "0.00",
  },
];

function getCalculationErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "This line item cannot be calculated.";
}

function InvoiceEditor({ customers }: InvoiceEditorProps) {
  const [editorStatus, setEditorStatus] = useState<EditorStatus>("idle");
  const [lineItems, setLineItems] = useState<InvoiceLineItemDraft[]>(initialLineItems);
  const [nextLineItemNumber, setNextLineItemNumber] = useState(2);
  const { invoiceTotals, lineItemPreviews } = useMemo(() => {
    const calculationLineItems: InvoiceLineItem[] = [];
    const previews: InvoiceLineItemPreview[] = lineItems.map((lineItem) => {
      try {
        const calculationLineItem: InvoiceLineItem = {
          description: lineItem.description,
          id: lineItem.id,
          quantity: lineItem.quantity,
          taxRateBasisPoints: 0,
          unitPrice: parseMoneyInput(lineItem.unitPrice, "USD"),
        };
        const totals = calculateLineItemTotals(calculationLineItem);

        calculationLineItems.push(calculationLineItem);

        return { id: lineItem.id, totals };
      } catch (error) {
        return { error: getCalculationErrorMessage(error), id: lineItem.id };
      }
    });

    if (previews.some((preview) => preview.error)) {
      return { invoiceTotals: undefined, lineItemPreviews: previews };
    }

    return {
      invoiceTotals: calculateInvoiceTotals(calculationLineItems, "USD"),
      lineItemPreviews: previews,
    };
  }, [lineItems]);

  const handleAddLineItem = () => {
    setLineItems((currentLineItems) => [
      ...currentLineItems,
      {
        description: "",
        id: `line-${nextLineItemNumber}`,
        quantity: "1",
        unitPrice: "0.00",
      },
    ]);
    setNextLineItemNumber((currentNumber) => currentNumber + 1);
  };

  const handleRemoveLineItem = (lineItemId: string) => {
    setLineItems((currentLineItems) =>
      currentLineItems.length === 1
        ? currentLineItems
        : currentLineItems.filter((lineItem) => lineItem.id !== lineItemId),
    );
  };

  const handleUpdateLineItem = (
    lineItemId: string,
    field: "description" | "quantity" | "unitPrice",
    value: string,
  ) => {
    setLineItems((currentLineItems) =>
      currentLineItems.map((lineItem) =>
        lineItem.id === lineItemId ? { ...lineItem, [field]: value } : lineItem,
      ),
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Invoice basics</CardTitle>
        <CardDescription>
          Set the customer, dates, currency, notes, and billable line items for this invoice.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-6"
          onChange={() => setEditorStatus("idle")}
          onReset={() => {
            setEditorStatus("idle");
            setLineItems(initialLineItems);
            setNextLineItemNumber(2);
          }}
          onSubmit={(event) => {
            event.preventDefault();

            if (!invoiceTotals) {
              setEditorStatus("invalid");
              return;
            }

            setEditorStatus("unsaved");
          }}
        >
          {editorStatus === "invalid" ? (
            <p
              className="rounded-control border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              Correct the highlighted line-item values before validating this invoice.
            </p>
          ) : null}

          {editorStatus === "unsaved" ? (
            <p
              aria-live="polite"
              className="rounded-control border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground"
              role="status"
            >
              The invoice details and line-item totals are valid but remain unsaved. Invoice
              persistence is introduced in a later task.
            </p>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="invoice-customer">
              Customer
            </label>
            <select
              aria-describedby="invoice-customer-hint"
              className="h-10 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 invalid:border-destructive invalid:ring-3 invalid:ring-destructive/20"
              defaultValue=""
              id="invoice-customer"
              name="customerId"
              required
            >
              <option disabled value="">
                Select a customer
              </option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground" id="invoice-customer-hint">
              The selected customer will receive this invoice when delivery is introduced.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="invoice-issue-date">
                Issue date
              </label>
              <input
                aria-describedby="invoice-issue-date-hint"
                className="h-10 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 invalid:border-destructive invalid:ring-3 invalid:ring-destructive/20"
                id="invoice-issue-date"
                name="issueDate"
                required
                type="date"
              />
              <p className="text-sm text-muted-foreground" id="invoice-issue-date-hint">
                This will become the invoice issue date.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="invoice-due-date">
                Due date
              </label>
              <input
                aria-describedby="invoice-due-date-hint"
                className="h-10 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 invalid:border-destructive invalid:ring-3 invalid:ring-destructive/20"
                id="invoice-due-date"
                name="dueDate"
                required
                type="date"
              />
              <p className="text-sm text-muted-foreground" id="invoice-due-date-hint">
                Payment terms and overdue logic will be added later.
              </p>
            </div>
          </div>

          <InvoiceLineItemsEditor
            invoiceTotals={invoiceTotals}
            lineItems={lineItems}
            onAddLineItem={handleAddLineItem}
            onRemoveLineItem={handleRemoveLineItem}
            onUpdateLineItem={handleUpdateLineItem}
            previews={lineItemPreviews}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="invoice-currency">
              Currency
            </label>
            <select
              aria-describedby="invoice-currency-hint"
              className="h-10 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              defaultValue="USD"
              id="invoice-currency"
              name="currency"
            >
              <option value="USD">USD — US Dollar</option>
            </select>
            <p className="text-sm text-muted-foreground" id="invoice-currency-hint">
              Currency is explicit because every monetary amount must carry its currency.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="invoice-notes">
              Notes <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <textarea
              aria-describedby="invoice-notes-hint"
              className="min-h-28 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              id="invoice-notes"
              name="notes"
              placeholder="Add payment instructions or a note for the customer"
            />
            <p className="text-sm text-muted-foreground" id="invoice-notes-hint">
              Notes will be included in the future invoice document and delivery flow.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
            <Button size="lg" type="reset" variant="outline">
              Clear fields
            </Button>
            <Button size="lg" type="submit">
              Validate invoice basics
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export { InvoiceEditor };
