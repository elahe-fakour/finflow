type VendorExpenseSample = {
  amountLabel: string;
  category: string;
  description: string;
  id: string;
  recordedDate: string;
  status: "Paid" | "Unpaid";
  vendorId: string;
};

type VendorBillSample = {
  amountLabel: string;
  billNumber: string;
  dueDate: string;
  id: string;
  vendorId: string;
};

const vendorExpenseSampleData: VendorExpenseSample[] = [
  {
    id: "vendor-expense-atlas-01",
    vendorId: "vendor-atlas",
    description: "Cloud hosting subscription",
    category: "Software",
    recordedDate: "2026-10-30",
    amountLabel: "$480.00",
    status: "Unpaid",
  },
  {
    id: "vendor-expense-lumen-01",
    vendorId: "vendor-lumen",
    description: "Brand identity project",
    category: "Professional services",
    recordedDate: "2026-10-28",
    amountLabel: "$2,400.00",
    status: "Unpaid",
  },
  {
    id: "vendor-expense-northwind-01",
    vendorId: "vendor-northwind",
    description: "Office supplies restock",
    category: "Office supplies",
    recordedDate: "2026-10-24",
    amountLabel: "$540.00",
    status: "Paid",
  },
  {
    id: "vendor-expense-summit-01",
    vendorId: "vendor-summit",
    description: "Workspace renovation work",
    category: "Contractors",
    recordedDate: "2026-10-20",
    amountLabel: "$1,850.00",
    status: "Unpaid",
  },
  {
    id: "vendor-expense-fieldstone-01",
    vendorId: "vendor-fieldstone",
    description: "Shared workspace membership",
    category: "Facilities",
    recordedDate: "2026-10-17",
    amountLabel: "$350.00",
    status: "Paid",
  },
  {
    id: "vendor-expense-metroline-01",
    vendorId: "vendor-metroline",
    description: "Business internet service",
    category: "Software",
    recordedDate: "2026-10-12",
    amountLabel: "$160.00",
    status: "Paid",
  },
];

const vendorBillSampleData: VendorBillSample[] = [
  {
    id: "vendor-bill-atlas-01",
    vendorId: "vendor-atlas",
    billNumber: "BILL-2026-044",
    dueDate: "2026-11-30",
    amountLabel: "$480.00",
  },
  {
    id: "vendor-bill-lumen-01",
    vendorId: "vendor-lumen",
    billNumber: "BILL-2026-043",
    dueDate: "2026-12-05",
    amountLabel: "$2,400.00",
  },
  {
    id: "vendor-bill-summit-01",
    vendorId: "vendor-summit",
    billNumber: "BILL-2026-039",
    dueDate: "2026-12-12",
    amountLabel: "$1,850.00",
  },
];

export { vendorBillSampleData, vendorExpenseSampleData };
export type { VendorBillSample, VendorExpenseSample };
