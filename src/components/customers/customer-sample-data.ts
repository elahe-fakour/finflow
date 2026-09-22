type Customer = {
  contactName: string;
  email: string;
  id: string;
  name: string;
  openInvoices: number;
  outstandingBalance: string;
};

const customerSampleData: Customer[] = [
  {
    id: "customer-acme",
    name: "Acme Ltd.",
    contactName: "Maya Patel",
    email: "billing@acme.example",
    openInvoices: 1,
    outstandingBalance: "$1,250.00",
  },
  {
    id: "customer-northstar",
    name: "Northstar Creative",
    contactName: "Jordan Lee",
    email: "accounts@northstar.example",
    openInvoices: 1,
    outstandingBalance: "$5,990.00",
  },
  {
    id: "customer-pine",
    name: "Pine & Co.",
    contactName: "Avery Morgan",
    email: "finance@pine.example",
    openInvoices: 0,
    outstandingBalance: "$0.00",
  },
  {
    id: "customer-brightline",
    name: "Brightline Studio",
    contactName: "Sam Rivera",
    email: "hello@brightline.example",
    openInvoices: 0,
    outstandingBalance: "$0.00",
  },
  {
    id: "customer-greenfield",
    name: "Greenfield Legal",
    contactName: "Taylor Brooks",
    email: "billing@greenfield.example",
    openInvoices: 0,
    outstandingBalance: "$0.00",
  },
  {
    id: "customer-cascade",
    name: "Cascade Health",
    contactName: "Riley Chen",
    email: "ap@cascade.example",
    openInvoices: 0,
    outstandingBalance: "$0.00",
  },
];

export { customerSampleData, type Customer };
