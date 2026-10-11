"use client";

import { BankAccountForm } from "@/components/bank-accounts/bank-account-form";
import { BankAccountsList } from "@/components/bank-accounts/bank-accounts-list";
import type { BankAccount } from "@/lib/bank-accounts/bank-accounts";
import { useState } from "react";

type BankAccountsWorkspaceProps = {
  accounts: BankAccount[];
  canManage: boolean;
  workspaceId: string;
};

function BankAccountsWorkspace({ accounts, canManage, workspaceId }: BankAccountsWorkspaceProps) {
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

  return (
    <div className="mt-8 space-y-10">
      {canManage ? <BankAccountForm workspaceId={workspaceId} /> : null}
      <BankAccountsList accounts={accounts} canManage={canManage} onEdit={setEditingAccount} />
      {editingAccount ? (
        <BankAccountForm
          account={editingAccount}
          key={editingAccount.id}
          onCancel={() => setEditingAccount(null)}
          workspaceId={workspaceId}
        />
      ) : null}
    </div>
  );
}

export { BankAccountsWorkspace };
