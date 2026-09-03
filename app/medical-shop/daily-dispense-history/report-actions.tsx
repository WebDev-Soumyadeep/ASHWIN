"use client";

import { FileDown, Printer } from "lucide-react";
import { Button } from "@/components/ui";

export function ReportActions() {
  return (
    <div className="flex flex-wrap gap-3 print:hidden">
      <a
        href="/medical-shop/daily-dispense-history/export"
        className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md bg-clinic px-4 text-sm font-semibold text-white transition hover:bg-clinic/90"
      >
        <FileDown size={16} aria-hidden="true" />
        Download Excel
      </a>
      <Button type="button" variant="secondary" className="gap-2" onClick={() => window.print()}>
        <Printer size={16} aria-hidden="true" />
        Save as PDF
      </Button>
    </div>
  );
}
