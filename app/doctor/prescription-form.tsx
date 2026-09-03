"use client";

import { useActionState, useEffect, useState } from "react";
import { FilePenLine } from "lucide-react";
import { savePrescriptionAction } from "@/app/actions";
import { Button, Textarea } from "@/components/ui";

const initialState = { ok: false };

export function PrescriptionForm({
  appointmentId,
  defaultMedicines,
  defaultTests,
  defaultAdvice
}: {
  appointmentId: string;
  defaultMedicines: string;
  defaultTests: string;
  defaultAdvice: string;
}) {
  const [state, formAction, pending] = useActionState(
    savePrescriptionAction,
    initialState
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!pending && state.ok) {
      setSaved(true);
    }
  }, [pending, state.ok]);

  return (
    <form
      action={formAction}
      className="mt-3 rounded-md bg-slate-50 p-3"
      onChange={() => setSaved(false)}
    >
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <p className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-950">
        <FilePenLine size={16} aria-hidden="true" />
        Prescription
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        <Textarea label="Medicines" name="medicines" defaultValue={defaultMedicines} placeholder="Medicine name, dose, duration" />
        <Textarea label="Tests" name="tests" defaultValue={defaultTests} placeholder="Blood test, X-ray, MRI..." />
        <Textarea label="Advice" name="advice" defaultValue={defaultAdvice} placeholder="Rest, follow-up, diet..." />
      </div>
      <Button variant={saved ? "secondary" : "primary"} className="mt-3" disabled={pending}>
        {pending ? "Saving..." : saved ? "Saved" : "Save prescription"}
      </Button>
    </form>
  );
}
