import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { BankAccount, BankAccountType } from "@/lib/bank-accounts/bank-accounts";
import { formatUsdMinorUnits } from "@/lib/money/format-minor-units";
import {
  Banknote,
  CircleDollarSign,
  CreditCard,
  Landmark,
  type LucideIcon,
  WalletCards,
} from "lucide-react";

type BankAccountsListProps = {
  accounts: BankAccount[];
  canManage: boolean;
  onEdit: (account: BankAccount) => void;
};

function BankAccountsList({ accounts, canManage, onEdit }: BankAccountsListProps) {
  const activeAccounts = accounts.filter((account) => account.status === "ACTIVE");
  const archivedAccounts = accounts.length - activeAccounts.length;
  const totalActiveOpeningBalance = activeAccounts.reduce(
    (total, account) => total + BigInt(account.openingBalanceMinorUnits),
    0n,
  );

  if (accounts.length === 0) {
    return (
      <EmptyState
        className="mt-8"
        description="Create a bank, cash, or payment processor account to record its opening balance."
        icon={Landmark}
        title="No bank accounts yet"
      />
    );
  }

  return (
    <section aria-labelledby="bank-accounts-list-title" className="mt-8 space-y-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.55fr)]">
        <Card>
          <CardHeader>
            <CardTitle as="h2" id="bank-accounts-list-title">
              Accounts
            </CardTitle>
            <CardDescription>
              {activeAccounts.length} active · {archivedAccounts} archived
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total active opening balance</CardDescription>
            <p className="text-2xl font-semibold tabular-nums text-foreground">
              {formatUsdMinorUnits(totalActiveOpeningBalance.toString())}
            </p>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {accounts.map((account) => (
          <BankAccountCard
            account={account}
            canManage={canManage}
            key={account.id}
            onEdit={onEdit}
          />
        ))}
      </div>
    </section>
  );
}

function BankAccountCard({
  account,
  canManage,
  onEdit,
}: {
  account: BankAccount;
  canManage: boolean;
  onEdit: (account: BankAccount) => void;
}) {
  const Icon = iconByAccountType[account.type];
  const isArchived = account.status === "ARCHIVED";

  return (
    <Card className={isArchived ? "opacity-75" : undefined}>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-control bg-primary/10 text-primary">
            <Icon aria-hidden="true" className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle as="h3" className="truncate">
              {account.name}
            </CardTitle>
            <CardDescription className="mt-1">{toDisplayType(account.type)}</CardDescription>
          </div>
          {isArchived ? <Badge variant="outline">Archived</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Opening balance
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {formatUsdMinorUnits(account.openingBalanceMinorUnits)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {account.openingBalanceDate
              ? `Effective ${account.openingBalanceDate}`
              : "No opening balance date"}
          </p>
        </div>
        <dl className="space-y-2 border-t border-border pt-4 text-sm">
          <Detail label="Institution" value={account.institutionName ?? "Not provided"} />
          <Detail
            label="Account"
            value={account.accountLastFour ? `•••• ${account.accountLastFour}` : "Not provided"}
          />
          <Detail label="Currency" value={account.currency} />
        </dl>
        {canManage ? (
          <Button
            className="w-full"
            onClick={() => onEdit(account)}
            type="button"
            variant="outline"
          >
            Edit account
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

const iconByAccountType: Record<BankAccountType, LucideIcon> = {
  CASH: Banknote,
  CHECKING: Landmark,
  OTHER: WalletCards,
  PAYMENT_PROCESSOR: CreditCard,
  SAVINGS: CircleDollarSign,
};

function toDisplayType(type: BankAccountType): string {
  return type
    .toLowerCase()
    .split("_")
    .map((word) => `${word[0]?.toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

export { BankAccountsList };
