import {
  BankAccountStatus,
  BankAccountType,
  IncomeExpenseType,
  InvoiceStatus,
  PaymentMethod,
  WorkspaceRole,
  type BankAccount,
  type Customer,
  type IncomeExpenseCategory,
  type Invoice,
  type Payment,
  type Vendor,
} from "../src/generated/prisma/client.js";
import type { AuthenticatedUser } from "../src/auth/auth.service.js";
import type { IncomeExpenseEntryRecord } from "../src/income-expense-entries/income-expense-entries.repository.js";
import type { WorkspaceAccess } from "../src/workspaces/workspace-access.js";
import type { WorkspaceScope } from "../src/workspaces/workspace-scope.js";

export const fixtureIds = {
  workspace: "6efc89d9-c720-45f6-82cd-ee29e80314b4",
  otherWorkspace: "6efc89d9-c720-45f6-82cd-ee29e80314b5",
  user: "6efc89d9-c720-45f6-82cd-ee29e80314b6",
  customer: "6efc89d9-c720-45f6-82cd-ee29e80314b7",
  vendor: "6efc89d9-c720-45f6-82cd-ee29e80314b8",
  bankAccount: "6efc89d9-c720-45f6-82cd-ee29e80314b9",
  category: "6efc89d9-c720-45f6-82cd-ee29e80314ba",
  entry: "6efc89d9-c720-45f6-82cd-ee29e80314bb",
  invoice: "6efc89d9-c720-45f6-82cd-ee29e80314bc",
  payment: "6efc89d9-c720-45f6-82cd-ee29e80314bd",
} as const;

const fixtureDate = new Date("2026-10-07T00:00:00.000Z");

export function makeWorkspaceScope(overrides: Partial<WorkspaceScope> = {}): WorkspaceScope {
  return { workspaceId: fixtureIds.workspace, ...overrides };
}

export function makeAuthenticatedUser(
  overrides: Partial<AuthenticatedUser> = {},
): AuthenticatedUser {
  return {
    id: fixtureIds.user,
    email: "alice@acme.example",
    displayName: "Alice Example",
    ...overrides,
  };
}

export function makeWorkspaceAccess(overrides: Partial<WorkspaceAccess> = {}): WorkspaceAccess {
  return { ...makeWorkspaceScope(), role: WorkspaceRole.OWNER, ...overrides };
}

export function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: fixtureIds.customer,
    workspaceId: fixtureIds.workspace,
    name: "Acme Ltd.",
    contactName: "Maya Patel",
    email: "billing@acme.example",
    createdAt: fixtureDate,
    updatedAt: fixtureDate,
    ...overrides,
  };
}

export function makeVendor(overrides: Partial<Vendor> = {}): Vendor {
  return {
    id: fixtureIds.vendor,
    workspaceId: fixtureIds.workspace,
    name: "Atlas Cloud Services",
    contactName: "Morgan Ellis",
    email: "billing@atlas.example",
    category: "Software",
    createdAt: fixtureDate,
    updatedAt: fixtureDate,
    ...overrides,
  };
}

export function makeBankAccount(overrides: Partial<BankAccount> = {}): BankAccount {
  return {
    id: fixtureIds.bankAccount,
    workspaceId: fixtureIds.workspace,
    name: "Business checking",
    type: BankAccountType.CHECKING,
    status: BankAccountStatus.ACTIVE,
    currency: "USD",
    institutionName: "Example Bank",
    accountLastFour: "4242",
    openingBalanceMinorUnits: 1894000n,
    openingBalanceDate: fixtureDate,
    createdAt: fixtureDate,
    updatedAt: fixtureDate,
    ...overrides,
  };
}

export function makeIncomeExpenseCategory(
  overrides: Partial<IncomeExpenseCategory> = {},
): IncomeExpenseCategory {
  return {
    id: fixtureIds.category,
    workspaceId: fixtureIds.workspace,
    type: IncomeExpenseType.EXPENSE,
    name: "Software subscriptions",
    createdAt: fixtureDate,
    updatedAt: fixtureDate,
    ...overrides,
  };
}

export function makeIncomeExpenseEntry(
  overrides: Partial<IncomeExpenseEntryRecord> = {},
): IncomeExpenseEntryRecord {
  const category = overrides.category ?? makeIncomeExpenseCategory();

  return {
    id: fixtureIds.entry,
    workspaceId: fixtureIds.workspace,
    categoryId: category.id,
    vendorId: null,
    type: IncomeExpenseType.EXPENSE,
    amountMinorUnits: 1250n,
    currency: "USD",
    occurredOn: fixtureDate,
    description: "Software subscription",
    reference: null,
    createdAt: fixtureDate,
    updatedAt: fixtureDate,
    category,
    vendor: null,
    ...overrides,
  };
}

export function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: fixtureIds.invoice,
    workspaceId: fixtureIds.workspace,
    customerId: fixtureIds.customer,
    invoiceNumber: "INV-2026-0182",
    status: InvoiceStatus.SENT,
    issueDate: fixtureDate,
    dueDate: new Date("2026-10-14T00:00:00.000Z"),
    currency: "USD",
    subtotalMinorUnits: 125000n,
    discountMinorUnits: 0n,
    taxMinorUnits: 0n,
    totalMinorUnits: 125000n,
    notes: null,
    createdAt: fixtureDate,
    updatedAt: fixtureDate,
    ...overrides,
  };
}

export function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: fixtureIds.payment,
    workspaceId: fixtureIds.workspace,
    invoiceId: fixtureIds.invoice,
    amountMinorUnits: 125000n,
    receivedAt: fixtureDate,
    method: PaymentMethod.BANK_TRANSFER,
    reference: "PAYMENT-001",
    notes: null,
    createdAt: fixtureDate,
    ...overrides,
  };
}
