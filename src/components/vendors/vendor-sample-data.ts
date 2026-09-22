const vendorCategories = [
  "Contractors",
  "Facilities",
  "Office supplies",
  "Professional services",
  "Software",
] as const;

type VendorCategory = (typeof vendorCategories)[number];

type Vendor = {
  category: VendorCategory;
  contactName: string;
  email: string;
  id: string;
  name: string;
  openBills: number;
  outstandingPayable: string;
};

const vendorSampleData: Vendor[] = [
  {
    id: "vendor-atlas",
    name: "Atlas Cloud Services",
    contactName: "Morgan Ellis",
    email: "billing@atlascloud.example",
    category: "Software",
    openBills: 1,
    outstandingPayable: "$480.00",
  },
  {
    id: "vendor-lumen",
    name: "Lumen Design Co.",
    contactName: "Jamie Foster",
    email: "accounts@lumendesign.example",
    category: "Professional services",
    openBills: 1,
    outstandingPayable: "$2,400.00",
  },
  {
    id: "vendor-northwind",
    name: "Northwind Office Supply",
    contactName: "Casey Nguyen",
    email: "orders@northwindoffice.example",
    category: "Office supplies",
    openBills: 0,
    outstandingPayable: "$0.00",
  },
  {
    id: "vendor-summit",
    name: "Summit Contractors",
    contactName: "Drew Simmons",
    email: "finance@summitcontractors.example",
    category: "Contractors",
    openBills: 1,
    outstandingPayable: "$1,850.00",
  },
  {
    id: "vendor-fieldstone",
    name: "Fieldstone Workspace",
    contactName: "Alex Kim",
    email: "invoices@fieldstone.example",
    category: "Facilities",
    openBills: 0,
    outstandingPayable: "$0.00",
  },
  {
    id: "vendor-metroline",
    name: "Metroline Communications",
    contactName: "Rory Adams",
    email: "billing@metroline.example",
    category: "Software",
    openBills: 0,
    outstandingPayable: "$0.00",
  },
];

export { vendorCategories, vendorSampleData, type Vendor, type VendorCategory };
