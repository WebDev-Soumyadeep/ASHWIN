import { DoctorPortalClient } from "@/app/doctor/doctor-portal-client";
import { DashboardHeader } from "@/components/nav";
import { PageShell } from "@/components/ui";
import { AssignedHospitalLocation } from "@/components/hospital-location-select";
import { requireRole } from "@/lib/auth";
import { formatDate, todayStart } from "@/lib/dates";
import { type ServiceSlotType } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { getServiceAvailability } from "@/lib/slots";

export default async function DoctorPage() {
  const user = await requireRole("DOCTOR");
  if (!user.hospitalId || !user.hospital) {
    throw new Error("Doctor account is not linked to a hospital.");
  }
  const [appointments, telemedicine, bloodRequests, serviceAvailability, serviceBookings, bloodBank] = await Promise.all([
    prisma.appointment.findMany({
      where: { date: todayStart(), hospitalId: user.hospitalId },
      include: { patient: true, prescription: true },
      orderBy: [{ serialNumber: "asc" }]
    }),
    prisma.telemedicineRequest.findMany({
      where: { hospitalId: user.hospitalId },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        preferredDoctor: { include: { user: true } },
        serviceBooking: true
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.bloodRequest.findMany({
      where: { hospitalId: user.hospitalId },
      include: { patient: true, serviceBooking: true },
      orderBy: { createdAt: "desc" }
    }),
    getServiceAvailability(undefined, user.hospitalId),
    prisma.serviceBooking.findMany({
      where: { hospitalId: user.hospitalId },
      include: { patient: true },
      orderBy: [{ createdAt: "desc" }]
    }),
    prisma.bloodBankItem.findMany({
      where: { hospitalId: user.hospitalId },
      orderBy: { bloodType: "asc" }
    })
  ]);

  return (
    <PageShell>
      <DashboardHeader title="Doctor dashboard" name={user.name} role={`${user.hospital.name} · ${user.doctor?.department ?? "Doctor"}`} />
      <div className="mb-6">
        <AssignedHospitalLocation hospital={user.hospital} />
      </div>
      <DoctorPortalClient
        doctorName={user.name}
        roleLabel={user.doctor?.department ?? "Doctor"}
        services={serviceAvailability
          .filter(
            (service) =>
              service.serviceType !== "MEDICINE_DELIVERY" &&
              service.serviceType !== "TELEMEDICINE_DELIVERY"
          )
          .map((service) => ({
            ...service,
            serviceType: service.serviceType as ServiceSlotType
          }))}
        bloodBank={bloodBank.map((item) => ({
          bloodType: item.bloodType,
          pouches: item.pouches
        }))}
        appointments={appointments.map((item) => ({
          id: item.id,
          serialNumber: item.serialNumber,
          patientName: item.patient.name,
          source: item.source,
          priority: item.priority,
          reason: item.reason ?? "",
          status: item.status,
          estimatedStart: item.estimatedStart,
          estimatedEnd: item.estimatedEnd,
          prescription: item.prescription
            ? {
                medicines: item.prescription.medicines,
                tests: item.prescription.tests ?? "",
                advice: item.prescription.advice ?? ""
              }
            : null
        }))}
        serviceBookings={serviceBookings.map((item) => ({
          id: item.id,
          serviceType: item.serviceType as ServiceSlotType,
          serialNumber: item.serialNumber,
          patientName: item.patient.name,
          reason: item.reason ?? "",
          status: item.status,
          dateLabel: formatDate(item.date),
          requestedTime: item.requestedTime ?? "",
          estimatedStart: item.estimatedStart,
          estimatedEnd: item.estimatedEnd,
          timingLabel: item.adminTimingNote || `${item.estimatedStart} - ${item.estimatedEnd}`
        }))}
        telemedicine={telemedicine.map((item) => ({
          id: item.id,
          patientName: item.patient.name,
          reason: item.reason,
          preferredTime: item.preferredTime ?? "",
          scheduledTime: item.scheduledTime ?? "",
          status: item.status,
          doctorDecision: item.doctorDecision ?? "",
          preferredDoctorName: item.preferredDoctor?.user.name ?? "",
          confirmedDoctorName: item.doctor?.user.name ?? "",
          serialNumber: item.serviceBooking?.serialNumber ?? 0
        }))}
        bloodRequests={bloodRequests.map((item) => ({
          id: item.id,
          patientName: item.patient.name,
          serialNumber: item.serialNumber,
          bloodType: item.bloodType,
          pouches: item.pouches,
          reason: item.reason,
          preferredTime: item.preferredTime ?? "",
          status: item.status,
          createdAtLabel: `${formatDate(item.createdAt)} · ${new Intl.DateTimeFormat("en-IN", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
          }).format(item.createdAt)}`
        }))}
      />
    </PageShell>
  );
}
