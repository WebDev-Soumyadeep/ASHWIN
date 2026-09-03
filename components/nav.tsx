import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui";

export function DashboardHeader({
  title,
  name,
  role
}: {
  title: string;
  name: string;
  role: string;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <BrandMark />
        <h1 className="mt-3 text-3xl font-bold text-slate-950">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {name} · {role}
        </p>
      </div>
      <form action={logoutAction}>
        <Button variant="secondary" className="gap-2">
          <LogOut size={16} aria-hidden="true" />
          Logout
        </Button>
      </form>
    </header>
  );
}
