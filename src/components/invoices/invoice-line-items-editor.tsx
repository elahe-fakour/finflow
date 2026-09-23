import type {
  CalculatedInvoiceTotals,
  CalculatedLineItemTotals,
} from "@/features/invoices/invoice-calculations";
import { formatMoney } from "@/features/invoices/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CirclePlus, Trash2 } from "lucide-react";

type InvoiceLineItemDraft = {
  description: string;
  id: string;
  quantity: string;
  unitPrice: string;
};

type InvoiceLineItemPreview = {
  error?: string;
  id: string;
  totals?: CalculatedLineItemTotals;
};

type InvoiceLineItemsEditorProps = {
  invoiceTotals?: CalculatedInvoiceTotals;
  lineItems: InvoiceLineItemDraft[];
  previews: InvoiceLineItemPreview[];
  onAddLineItem: () => void;
  onRemoveLineItem: (lineItemId: string) => void;
  onUpdateLineItem: (
    lineItemId: string,
    field: "description" | "quantity" | "unitPrice",
    value: string,
  ) => void;
};

function InvoiceLineItemsEditor({
  invoiceTotals,
  lineItems,
  previews,
  onAddLineItem,
  onRemoveLineItem,
  onUpdateLineItem,
}: InvoiceLineItemsEditorProps) {
  return (
    <section aria-labelledby="invoice-line-items-title" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-medium text-foreground" id="invoice-line-items-title">
            Line items
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add the services or products billed on this invoice. Tax and discounts are currently set
            to zero.
          </p>
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={onAddLineItem}
          type="button"
          variant="outline"
        >
          <CirclePlus aria-hidden="true" />
          Add line item
        </Button>
      </div>

      <div className="space-y-4">
        {lineItems.map((lineItem, index) => {
          const preview = previews.find((item) => item.id === lineItem.id);
          const descriptionId = `invoice-line-${lineItem.id}-description`;
          const quantityId = `invoice-line-${lineItem.id}-quantity`;
          const unitPriceId = `invoice-line-${lineItem.id}-unit-price`;
          const errorId = `invoice-line-${lineItem.id}-error`;

          return (
            <fieldset
              className="rounded-control border border-border bg-muted/30 p-4"
              key={lineItem.id}
            >
              <legend className="px-1 text-sm font-medium text-foreground">Line {index + 1}</legend>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_9rem_10rem_auto] lg:items-end">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor={descriptionId}>
                    Description
                  </label>
                  <Input
                    id={descriptionId}
                    name={`lineItems.${index}.description`}
                    onChange={(event) =>
                      onUpdateLineItem(lineItem.id, "description", event.target.value)
                    }
                    required
                    value={lineItem.description}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor={quantityId}>
                    Quantity
                  </label>
                  <Input
                    aria-describedby={preview?.error ? errorId : undefined}
                    aria-invalid={Boolean(preview?.error)}
                    id={quantityId}
                    inputMode="decimal"
                    name={`lineItems.${index}.quantity`}
                    onChange={(event) =>
                      onUpdateLineItem(lineItem.id, "quantity", event.target.value)
                    }
                    required
                    value={lineItem.quantity}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor={unitPriceId}>
                    Unit price
                  </label>
                  <Input
                    aria-describedby={preview?.error ? errorId : `${unitPriceId}-hint`}
                    aria-invalid={Boolean(preview?.error)}
                    id={unitPriceId}
                    inputMode="decimal"
                    name={`lineItems.${index}.unitPrice`}
                    onChange={(event) =>
                      onUpdateLineItem(lineItem.id, "unitPrice", event.target.value)
                    }
                    required
                    value={lineItem.unitPrice}
                  />
                  <p className="text-xs text-muted-foreground" id={`${unitPriceId}-hint`}>
                    USD, for example 1250.00
                  </p>
                </div>

                <Button
                  aria-label={`Remove line ${index + 1}`}
                  disabled={lineItems.length === 1}
                  onClick={() => onRemoveLineItem(lineItem.id)}
                  type="button"
                  variant="ghost"
                >
                  <Trash2 aria-hidden="true" />
                  <span className="lg:sr-only">Remove line</span>
                </Button>
              </div>

              {preview?.error ? (
                <p className="mt-3 text-sm text-destructive" id={errorId} role="alert">
                  {preview.error}
                </p>
              ) : preview?.totals ? (
                <dl className="mt-4 grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd className="mt-1 font-medium tabular-nums text-foreground">
                      {formatMoney(preview.totals.subtotal)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Discount</dt>
                    <dd className="mt-1 font-medium tabular-nums text-foreground">
                      {formatMoney(preview.totals.discountTotal)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Tax</dt>
                    <dd className="mt-1 font-medium tabular-nums text-foreground">
                      {formatMoney(preview.totals.taxTotal)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground">Line total</dt>
                    <dd className="mt-1 font-semibold tabular-nums text-foreground">
                      {formatMoney(preview.totals.total)}
                    </dd>
                  </div>
                </dl>
              ) : null}
            </fieldset>
          );
        })}
      </div>

      {invoiceTotals ? (
        <dl className="ml-auto grid max-w-sm gap-3 rounded-control border border-border bg-surface p-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="font-medium tabular-nums text-foreground">
              {formatMoney(invoiceTotals.subtotal)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Discount</dt>
            <dd className="font-medium tabular-nums text-foreground">
              {formatMoney(invoiceTotals.discountTotal)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
            <dt className="text-muted-foreground">Tax</dt>
            <dd className="font-medium tabular-nums text-foreground">
              {formatMoney(invoiceTotals.taxTotal)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="font-medium text-foreground">Total</dt>
            <dd className="text-base font-semibold tabular-nums text-foreground">
              {formatMoney(invoiceTotals.total)}
            </dd>
          </div>
        </dl>
      ) : null}
    </section>
  );
}

export { InvoiceLineItemsEditor, type InvoiceLineItemDraft, type InvoiceLineItemPreview };
