"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { AshwinInfoContent, type AshwinInfoKey } from "@/components/ashwin-info-content";

type PanelKey = AshwinInfoKey | null;

export function AshwinInfoPanel() {
  const [openPanel, setOpenPanel] = useState<PanelKey>(null);

  const togglePanel = (panel: AshwinInfoKey) => {
    setOpenPanel((current) => (current === panel ? null : panel));
  };

  return (
    <section className="mt-10 flex flex-col items-end border-t border-[rgb(var(--border))] pt-6">
      {openPanel ? (
        <div className="w-full rounded-3xl border border-[rgb(var(--border))] bg-white px-5 py-4 shadow-panel">
          <AshwinInfoContent panel={openPanel} />
        </div>
      ) : null}

      <div className="mt-3 rounded-2xl border border-[rgb(var(--border))] bg-white p-4 shadow-panel">
        <div className="flex flex-wrap justify-end gap-2">
          {([
            ["about", "About Us"],
            ["contact", "Contact Us"],
            ["troubleshoot", "Troubleshoot"]
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => togglePanel(key)}
              className={cn(
                "focus-ring inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-semibold transition",
                openPanel === key
                  ? "bg-clinic text-white"
                  : "border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-muted))]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
