"use client";

import { useActionState } from "react";
import { importHospitalDirectoryAction } from "@/app/actions";
import { Button, Input } from "@/components/ui";

const initialState = { ok: false, message: "" };

export function DirectoryImportForm() {
  const [state, action, pending] = useActionState(importHospitalDirectoryAction, initialState);
  return <form action={action} className="grid gap-4">
    <Input label="Official National Hospital Directory CSV" name="directory" type="file" accept=".csv,text/csv" required />
    <p className="text-sm text-[rgb(var(--text-muted))]">Upload a CSV up to 25 MB. Only rows with a government/public classification and state, district, and hospital name will be imported.</p>
    <Button disabled={pending}>{pending ? "Importing directory…" : "Validate and import directory"}</Button>
    {state.message ? <p className={state.ok ? "text-sm text-clinic" : "text-sm text-coral"}>{state.message}</p> : null}
  </form>;
}
