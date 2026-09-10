import { DirectoryImportForm } from "@/app/directory/directory-import-form";
import { DashboardHeader } from "@/components/nav";
import { PageShell, Panel, SectionTitle } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/hospital-directory";

export default async function DirectoryPage() {
  const user = await requireRole("ADMIN");
  if (!isSuperAdmin(user.email)) throw new Error("Directory access is restricted to the configured super admin.");
  return <PageShell><DashboardHeader title="National hospital directory" name={user.name} role="Super admin" /><Panel><SectionTitle title="Import official directory" subtitle="Upload the official National Hospital Directory CSV. Existing matching records are updated; only verified public/government facilities are selectable." /><DirectoryImportForm /></Panel></PageShell>;
}
