"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

function PrintReportButton() {
  return (
    <Button className="print-hidden" onClick={() => window.print()} type="button" variant="outline">
      <Printer aria-hidden="true" />
      Print or save as PDF
    </Button>
  );
}

export { PrintReportButton };
