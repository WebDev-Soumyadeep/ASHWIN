import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AshwinInfoPanel } from "@/components/ashwin-info-panel";
import { DashboardHeader } from "@/components/nav";
import { PageShell, Panel, SectionTitle, Stat } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { formatDate, todayStart } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { ReportActions } from "@/app/medical-shop/daily-dispense-history/report-actions";

export const dynamic = "force-dynamic";

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

export default async function DailyDispenseHistoryPage() {
  const user = await requireRole("MEDICAL_SHOP");
  const today = todayStart();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [medicineHistory, bloodDispenseHistory, bloodReportHistory] = await Promise.all([
    prisma.medicineDispense.findMany({
      where: { createdAt: { gte: today, lt: tomorrow } },
      include: {
        appointment: { include: { patient: true } },
        serviceBooking: { include: { patient: true } },
        inventoryItem: true,
        dispensedBy: true
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.bloodRequest.findMany({
      where: {
        status: "DISPENSED",
        updatedAt: { gte: today, lt: tomorrow }
      },
      include: { patient: true },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.serviceBooking.findMany({
      where: {
        serviceType: "BLOOD_REPORT",
        status: "COMPLETED",
        updatedAt: { gte: today, lt: tomorrow }
      },
      include: { patient: true },
      orderBy: { updatedAt: "desc" }
    })
  ]);

  const medicineTotalQuantity = medicineHistory.reduce((sum, entry) => sum + entry.quantity, 0);
  const bloodTotalPouches = bloodDispenseHistory.reduce((sum, entry) => sum + entry.pouches, 0);

  return (
    <PageShell>
      <DashboardHeader title="Daily dispense history" name={user.name} role="Shopkeeper" />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/medical-shop"
          className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 text-sm font-semibold text-[rgb(var(--text))] transition hover:bg-[rgb(var(--surface-muted))]"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to medical shop
        </Link>
        <ReportActions />
      </div>

      <Panel className="mb-6">
        <SectionTitle
          title={`Report for ${formatDate(today)}`}
          subtitle="Today’s total medicine and blood dispensing summary."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Medicine entries" value={medicineHistory.length} />
          <Stat label="Medicines dispensed" value={medicineTotalQuantity} tone="leaf" />
          <Stat label="Blood entries" value={bloodDispenseHistory.length} tone="amber" />
          <Stat label="Blood pouches" value={bloodTotalPouches} tone="coral" />
          <Stat label="Blood reports handled" value={bloodReportHistory.length} />
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel>
          <SectionTitle
            title="Medicines dispensed today"
            subtitle="Consultation, medicine delivery, and telemedicine delivery medicine issues recorded today."
          />
          <div className="grid gap-3 text-sm">
            {medicineHistory.length === 0 ? (
              <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-slate-600">
                No medicines dispensed yet today.
              </p>
            ) : (
              medicineHistory.map((entry) => (
                <div key={entry.id} className="rounded-md border border-slate-200 p-4">
                  <p className="font-bold text-slate-950">
                    {entry.inventoryItem.name} · {entry.quantity} {entry.inventoryItem.unit}
                  </p>
                  <div className="mt-2 space-y-1 text-slate-600">
                    <p>
                      <strong>Category:</strong> {entry.dispenseCategory.replaceAll("_", " ")}
                    </p>
                    <p>
                      <strong>Patient:</strong> {entry.appointment?.patient.name ?? entry.serviceBooking?.patient.name ?? "Unknown"}
                    </p>
                    <p>
                      <strong>Reference:</strong> #
                      {entry.appointment?.serialNumber ?? entry.serviceBooking?.serialNumber ?? "-"}
                    </p>
                    <p>
                      <strong>Dispensed by:</strong> {entry.dispensedBy.name}
                    </p>
                    {entry.note ? (
                      <p>
                        <strong>Note:</strong> {entry.note}
                      </p>
                    ) : null}
                    <p>
                      <strong>Time:</strong> {formatTime(entry.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel>
          <SectionTitle
            title="Blood dispensed today"
            subtitle="Approved blood requests completed by the medical shop today."
          />
          <div className="grid gap-3 text-sm">
            {bloodDispenseHistory.length === 0 ? (
              <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-slate-600">
                No blood requests dispensed yet today.
              </p>
            ) : (
              bloodDispenseHistory.map((entry) => (
                <div key={entry.id} className="rounded-md border border-slate-200 p-4">
                  <p className="font-bold text-slate-950">
                    Blood serial #{entry.serialNumber} · {entry.bloodType} · {entry.pouches} pouch(es)
                  </p>
                  <div className="mt-2 space-y-1 text-slate-600">
                    <p>
                      <strong>Patient:</strong> {entry.patient.name}
                    </p>
                    <p>
                      <strong>Reason:</strong> {entry.reason}
                    </p>
                    <p>
                      <strong>Time:</strong> {formatTime(entry.updatedAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel>
          <SectionTitle
            title="Blood reports handled today"
            subtitle="Blood report serials marked handled by the medical shop today."
          />
          <div className="grid gap-3 text-sm">
            {bloodReportHistory.length === 0 ? (
              <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-slate-600">
                No blood report serials handled yet today.
              </p>
            ) : (
              bloodReportHistory.map((entry) => (
                <div key={entry.id} className="rounded-md border border-slate-200 p-4">
                  <p className="font-bold text-slate-950">
                    Blood report serial #{entry.serialNumber}
                  </p>
                  <div className="mt-2 space-y-1 text-slate-600">
                    <p>
                      <strong>Patient:</strong> {entry.patient.name}
                    </p>
                    <p>
                      <strong>Preferred time:</strong> {entry.requestedTime || "Flexible"}
                    </p>
                    <p>
                      <strong>Update:</strong> {entry.adminTimingNote || "Handled by medical shop"}
                    </p>
                    <p>
                      <strong>Time:</strong> {formatTime(entry.updatedAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>
      <AshwinInfoPanel />
    </PageShell>
  );
}
