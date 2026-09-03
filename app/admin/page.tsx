import { updateServiceBookingStatusAction } from "@/app/actions";
import { AdminServicePanelClient } from "@/app/admin/admin-service-panel-client";
import { DashboardHeader } from "@/components/nav";
import { Button, PageShell, Panel, SectionTitle } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import {
  serviceSlotLabel,
  type ServiceSlotType
} from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { getServiceAvailability } from "@/lib/slots";

export default async function AdminPage() {
  const user = await requireRole("ADMIN");
  if (!user.hospitalId || !user.hospital) {
    throw new Error("Admin account is not linked to a hospital.");
  }
  const [bloodBank, doctors, inventory, telemedicine, serviceAvailability, serviceBookings] =
    await Promise.all([
      prisma.bloodBankItem.findMany({ where: { hospitalId: user.hospitalId }, orderBy: { bloodType: "asc" } }),
      prisma.doctor.findMany({ where: { user: { hospitalId: user.hospitalId } }, include: { user: true }, orderBy: { user: { name: "asc" } } }),
      prisma.inventoryItem.findMany({ where: { hospitalId: user.hospitalId }, orderBy: { name: "asc" } }),
      prisma.telemedicineRequest.findMany({
        where: { hospitalId: user.hospitalId },
        include: {
          patient: true,
          doctor: { include: { user: true } },
          preferredDoctor: { include: { user: true } },
          alternativeDoctor: { include: { user: true } }
        },
        orderBy: { createdAt: "desc" }
      }),
      getServiceAvailability(undefined, user.hospitalId),
      prisma.serviceBooking.findMany({
        where: { hospitalId: user.hospitalId },
        include: { patient: true },
        orderBy: [{ createdAt: "desc" }]
      })
    ]);

  return (
    <PageShell>
      <DashboardHeader title="Hospital administration" name={user.name} role={user.hospital.name} />

      <AdminServicePanelClient
        adminName={user.name}
        services={serviceAvailability.map((service) => ({
          ...service,
          serviceType: service.serviceType as ServiceSlotType
        }))}
        bloodBank={bloodBank.map((item) => ({
          bloodType: item.bloodType,
          pouches: item.pouches
        }))}
        doctors={doctors.map((doctor) => ({
          id: doctor.id,
          name: doctor.user.name,
          department: doctor.department,
          availability: doctor.availability
        }))}
        inventory={inventory.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description ?? "",
          stock: item.stock,
          unit: item.unit
        }))}
        telemedicine={telemedicine.map((item) => ({
          id: item.id,
          patientName: item.patient.name,
          reason: item.reason,
          status: item.status,
          doctorDecision: item.doctorDecision ?? "",
          preferredTime: item.preferredTime ?? "",
          scheduledTime: item.scheduledTime ?? "",
          preferredDoctorName: item.preferredDoctor?.user.name ?? "",
          doctorName: item.doctor?.user.name ?? "",
          preferredDoctorId: item.preferredDoctorId ?? "",
          doctorId: item.doctorId ?? "",
          alternativeDoctorId: item.alternativeDoctorId ?? "",
          alternativeForPreferredTime: item.alternativeForPreferredTime ?? "",
          serialNumber: item.serviceBookingId
            ? serviceBookings.find((booking) => booking.id === item.serviceBookingId)?.serialNumber ?? 0
            : 0
        }))}
      />

      <Panel className="mt-6">
        <SectionTitle
          title="Live Service Bookings"
          subtitle="Serial preview for consultation, diagnostics, telemedicine, blood bank, ambulance, and delivery slots."
        />
        <div className="grid gap-3">
          {serviceBookings.length === 0 ? <p className="text-sm text-slate-600">No service bookings yet.</p> : null}
          {serviceBookings.map((item) => (
            <div
              key={item.id}
              className="grid gap-4 rounded-2xl border border-[rgb(var(--border))] bg-white p-4 lg:grid-cols-[1fr_auto]"
            >
              <div className="space-y-1 text-sm text-[rgb(var(--text-muted))]">
                <p className="text-base font-bold text-[rgb(var(--text))]">
                  {serviceSlotLabel(item.serviceType)} · Serial #{item.serialNumber}
                </p>
                <p><strong>Patient:</strong> {item.patient.name}</p>
                <p><strong>Cause:</strong> {item.reason || "Not added"}</p>
                <p><strong>Date:</strong> {formatDate(item.date)}</p>
                <p><strong>Approx timing:</strong> {item.adminTimingNote || `${item.estimatedStart} - ${item.estimatedEnd}`}</p>
              </div>
              <div className="grid gap-2">
                <form action={updateServiceBookingStatusAction} className="flex items-end gap-2">
                  <input type="hidden" name="id" value={item.id} />
                  <select name="status" defaultValue={item.status} className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-sm">
                    {["BOOKED", "CHECKED_IN", "IN_CONSULTATION", "COMPLETED", "CANCELLED"].map((status) => (
                      <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
                    ))}
                  </select>
                  <Button variant="secondary">Update</Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </PageShell>
  );
}
