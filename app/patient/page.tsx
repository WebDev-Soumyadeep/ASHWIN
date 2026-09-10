import { DashboardHeader } from "@/components/nav";
import { PageShell } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { formatDate, todayStart } from "@/lib/dates";
import {
  appointmentTypeLabel,
  serviceSlotLabel,
  telemedicineStatusLabel,
  type ServiceSlotType
} from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { getServiceAvailability } from "@/lib/slots";
import { PatientPortalClient } from "@/app/patient/patient-portal-client";

export default async function PatientPage({
  searchParams
}: {
  searchParams?: Promise<{ hospital?: string }>;
}) {
  const user = await requireRole("PATIENT");
  const hospitals = await prisma.hospital.findMany({ where: { isActive: true }, orderBy: [{ state: "asc" }, { district: "asc" }, { name: "asc" }] });
  const params = searchParams ? await searchParams : undefined;
  const selectedHospital =
    hospitals.find((hospital) => hospital.id === params?.hospital) ?? hospitals[0] ?? null;
  const selectedHospitalId = selectedHospital?.id ?? "";

  const [services, bookings, doctors, bloodBank] = await Promise.all([
    selectedHospitalId ? getServiceAvailability(todayStart(), selectedHospitalId) : [],
    prisma.serviceBooking.findMany({
      where: { patientId: user.id },
      include: {
        hospital: true,
        bloodRequest: true,
        telemedicineRequest: {
          include: {
            preferredDoctor: { include: { user: true } },
            doctor: { include: { user: true } },
            alternativeDoctor: { include: { user: true } }
          }
        }
      },
      orderBy: [{ createdAt: "desc" }]
    }),
    prisma.doctor.findMany({
      where: selectedHospitalId ? { user: { hospitalId: selectedHospitalId } } : undefined,
      include: { user: true },
      orderBy: { user: { name: "asc" } }
    }),
    selectedHospitalId
      ? prisma.bloodBankItem.findMany({
          where: { hospitalId: selectedHospitalId },
          orderBy: { bloodType: "asc" }
        })
      : []
  ]);

  return (
    <PageShell>
      <DashboardHeader title="Patient portal" name={user.name} role="Patient" />
      <PatientPortalClient
        patientName={user.name}
        services={services.map((service) => ({
          ...service,
          serviceType: service.serviceType as ServiceSlotType
        }))}
        hospitals={hospitals.map((hospital) => ({
          id: hospital.id,
          name: hospital.name,
          state: hospital.state,
          district: hospital.district
        }))}
        selectedHospitalId={selectedHospitalId}
        doctors={doctors.map((doctor) => ({
          id: doctor.id,
          name: doctor.user.name,
          department: doctor.department,
          availability: doctor.availability
        }))}
        bloodBank={bloodBank.map((item) => ({
          bloodType: item.bloodType,
          pouches: item.pouches
        }))}
        bookings={bookings.map((booking) => ({
          id: booking.id,
          serviceType: booking.serviceType as ServiceSlotType,
          serviceLabel:
            booking.serviceType === "TELEMEDICINE"
              ? "Telemedicine Booking"
              : booking.serviceType === "TELEMEDICINE_DELIVERY"
                ? "Telemedicine Delivery"
                : serviceSlotLabel(booking.serviceType),
          serialNumber: booking.serialNumber,
          reason: booking.reason ?? "",
          requestedTime: booking.requestedTime ?? "",
          contactNumber: booking.contactNumber ?? "",
          location: booking.location ?? "",
          bloodType: booking.bloodType ?? booking.bloodRequest?.bloodType ?? "",
          quantity: booking.quantity ?? booking.bloodRequest?.pouches ?? 0,
          feeAmount: booking.feeAmount,
          manualMedicineText: booking.manualMedicineText ?? "",
          prescriptionImagePath: booking.prescriptionImagePath ?? "",
          estimatedStart: booking.estimatedStart,
          estimatedEnd: booking.estimatedEnd,
          timingLabel: booking.adminTimingNote || `${booking.estimatedStart} - ${booking.estimatedEnd}`,
          status:
            booking.serviceType === "BLOOD_BANK" && booking.bloodRequest
              ? booking.bloodRequest.status.replaceAll("_", " ")
              : 
            booking.serviceType === "TELEMEDICINE" && booking.telemedicineRequest
              ? telemedicineStatusLabel(booking.telemedicineRequest.status)
              : booking.status.replaceAll("_", " "),
          dateLabel: formatDate(booking.date),
          createdAtLabel: new Intl.DateTimeFormat("en-IN", {
            dateStyle: "medium",
            timeStyle: "short"
          }).format(booking.createdAt),
          consultationType: booking.consultationType
            ? appointmentTypeLabel(booking.consultationType)
            : "",
          preferredHospital: booking.hospital?.name ?? booking.preferredHospital ?? "",
          telemedicine:
            booking.telemedicineRequest
              ? {
                  id: booking.telemedicineRequest.id,
                  status: booking.telemedicineRequest.status,
                  statusLabel: telemedicineStatusLabel(booking.telemedicineRequest.status),
                  preferredDoctorName:
                    booking.telemedicineRequest.preferredDoctor?.user.name ?? "",
                  confirmedDoctorName: booking.telemedicineRequest.doctor?.user.name ?? "",
                  alternativeDoctorName:
                    booking.telemedicineRequest.alternativeDoctor?.user.name ?? "",
                  preferredTime: booking.telemedicineRequest.preferredTime ?? "",
                  scheduledTime: booking.telemedicineRequest.scheduledTime ?? "",
                  alternativeForPreferredTime:
                    booking.telemedicineRequest.alternativeForPreferredTime ?? ""
                }
              : null
        }))}
      />
    </PageShell>
  );
}
