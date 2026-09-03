import { DashboardHeader } from "@/components/nav";
import { PageShell } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { formatDate, todayStart } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { MedicalShopPortalClient } from "@/app/medical-shop/medical-shop-portal-client";

export const dynamic = "force-dynamic";

function parsePrescriptionLines(text: string) {
  return text
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default async function MedicalShopPage({
  searchParams
}: {
  searchParams?: Promise<{
    consultationSerial?: string;
    bloodSerial?: string;
    bloodReportSerial?: string;
    deliverySerial?: string;
    telemedicineSerial?: string;
  }>;
}) {
  const user = await requireRole("MEDICAL_SHOP");
  if (!user.hospitalId || !user.hospital) {
    throw new Error("Medical shop account is not linked to a hospital.");
  }

  const params = (await searchParams) ?? {};
  const today = todayStart();

  const consultationSerial = Number.parseInt(params.consultationSerial ?? "", 10);
  const bloodSerial = Number.parseInt(params.bloodSerial ?? "", 10);
  const bloodReportSerial = Number.parseInt(params.bloodReportSerial ?? "", 10);
  const deliverySerial = Number.parseInt(params.deliverySerial ?? "", 10);
  const telemedicineSerial = Number.parseInt(params.telemedicineSerial ?? "", 10);

  const [inventory, bloodBank, appointment, bloodRequest, bloodReportBooking, medicineDeliveryBooking, telemedicineBooking] =
    await Promise.all([
      prisma.inventoryItem.findMany({
        where: { hospitalId: user.hospitalId },
        orderBy: { name: "asc" }
      }),
      prisma.bloodBankItem.findMany({
        where: { hospitalId: user.hospitalId },
        orderBy: { bloodType: "asc" }
      }),
      Number.isFinite(consultationSerial)
        ? prisma.appointment.findFirst({
            where: { date: today, serialNumber: consultationSerial, hospitalId: user.hospitalId },
            include: {
              patient: true,
              prescription: true,
              medicineDispenses: {
                include: { inventoryItem: true },
                orderBy: { createdAt: "desc" }
              }
            }
          })
        : Promise.resolve(null),
      Number.isFinite(bloodSerial)
        ? prisma.bloodRequest.findFirst({
            where: { serialNumber: bloodSerial, hospitalId: user.hospitalId },
            include: { patient: true },
            orderBy: { createdAt: "desc" }
          })
        : Promise.resolve(null),
      Number.isFinite(bloodReportSerial)
        ? prisma.serviceBooking.findFirst({
            where: {
              serialNumber: bloodReportSerial,
              hospitalId: user.hospitalId,
              serviceType: "BLOOD_REPORT"
            },
            include: { patient: true },
            orderBy: { createdAt: "desc" }
          })
        : Promise.resolve(null),
      Number.isFinite(deliverySerial)
        ? prisma.serviceBooking.findFirst({
            where: {
              serialNumber: deliverySerial,
              hospitalId: user.hospitalId,
              serviceType: "MEDICINE_DELIVERY"
            },
            include: {
              patient: true,
              medicineDispenses: {
                include: { inventoryItem: true },
                orderBy: { createdAt: "desc" }
              }
            },
            orderBy: { createdAt: "desc" }
          })
        : Promise.resolve(null),
      Number.isFinite(telemedicineSerial)
        ? prisma.serviceBooking.findFirst({
            where: {
              serialNumber: telemedicineSerial,
              hospitalId: user.hospitalId,
              serviceType: "TELEMEDICINE_DELIVERY"
            },
            include: {
              patient: true,
              telemedicineRequest: {
                include: {
                  doctor: { include: { user: true } },
                  preferredDoctor: { include: { user: true } }
                }
              },
              medicineDispenses: {
                include: { inventoryItem: true },
                orderBy: { createdAt: "desc" }
              }
            },
            orderBy: { createdAt: "desc" }
          })
        : Promise.resolve(null)
    ]);

  const consultationMedicines = appointment?.prescription
    ? parsePrescriptionLines(appointment.prescription.medicines)
    : [];

  const initialCard =
    params.bloodSerial
      ? "BLOOD_BANK"
      : params.bloodReportSerial
        ? "BLOOD_REPORT"
        : params.deliverySerial
          ? "MEDICINE_DELIVERY"
          : params.telemedicineSerial
            ? "TELEMEDICINE_DELIVERY"
            : params.consultationSerial
              ? "MEDICINE_DISPENSE"
              : null;

  return (
    <PageShell>
      <DashboardHeader title="Medical shop" name={user.name} role={user.hospital.name} />
      <MedicalShopPortalClient
        shopName={user.name}
        hospitalName={user.hospital.name}
        initialCard={initialCard}
        inventory={inventory.map((item) => ({
          id: item.id,
          name: item.name,
          stock: item.stock,
          unit: item.unit,
          description: item.description ?? ""
        }))}
        bloodBank={bloodBank.map((item) => ({
          bloodType: item.bloodType,
          pouches: item.pouches
        }))}
        appointment={
          appointment
            ? {
                id: appointment.id,
                serialNumber: appointment.serialNumber,
                patientName: appointment.patient.name,
                dateLabel: formatDate(appointment.date),
                timingLabel: `${appointment.estimatedStart} - ${appointment.estimatedEnd}`,
                status: appointment.status,
                prescriptionText: appointment.prescription?.medicines ?? "",
                tests: appointment.prescription?.tests ?? "",
                advice: appointment.prescription?.advice ?? "",
                medicines: consultationMedicines,
                dispenses: appointment.medicineDispenses.map((entry) => ({
                  id: entry.id,
                  name: entry.inventoryItem.name,
                  quantity: entry.quantity,
                  unit: entry.inventoryItem.unit
                }))
              }
            : null
        }
        bloodRequest={
          bloodRequest
            ? {
                id: bloodRequest.id,
                serialNumber: bloodRequest.serialNumber,
                patientName: bloodRequest.patient.name,
                createdAtLabel: `${formatDate(bloodRequest.createdAt)} · ${new Intl.DateTimeFormat("en-IN", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true
                }).format(bloodRequest.createdAt)}`,
                bloodType: bloodRequest.bloodType,
                pouches: bloodRequest.pouches,
                status: bloodRequest.status,
                reason: bloodRequest.reason,
                preferredTime: bloodRequest.preferredTime ?? ""
              }
            : null
        }
        bloodReportBooking={
          bloodReportBooking
            ? {
                id: bloodReportBooking.id,
                serialNumber: bloodReportBooking.serialNumber,
                patientName: bloodReportBooking.patient.name,
                dateLabel: formatDate(bloodReportBooking.date),
                preferredTime: bloodReportBooking.requestedTime ?? "",
                assignedTime: bloodReportBooking.adminTimingNote || `${bloodReportBooking.estimatedStart} - ${bloodReportBooking.estimatedEnd}`,
                status: bloodReportBooking.status,
                reason: bloodReportBooking.reason ?? "",
                manualMedicineText: bloodReportBooking.manualMedicineText ?? "",
                prescriptionImagePath: bloodReportBooking.prescriptionImagePath ?? "",
                dispenses: []
              }
            : null
        }
        medicineDeliveryBooking={
          medicineDeliveryBooking
            ? {
                id: medicineDeliveryBooking.id,
                serialNumber: medicineDeliveryBooking.serialNumber,
                patientName: medicineDeliveryBooking.patient.name,
                dateLabel: formatDate(medicineDeliveryBooking.date),
                preferredTime: medicineDeliveryBooking.requestedTime ?? "",
                assignedTime: medicineDeliveryBooking.adminTimingNote || `${medicineDeliveryBooking.estimatedStart} - ${medicineDeliveryBooking.estimatedEnd}`,
                status: medicineDeliveryBooking.status,
                reason: medicineDeliveryBooking.reason ?? "",
                location: medicineDeliveryBooking.location ?? "",
                manualMedicineText: medicineDeliveryBooking.manualMedicineText ?? "",
                prescriptionImagePath: medicineDeliveryBooking.prescriptionImagePath ?? "",
                dispenses: medicineDeliveryBooking.medicineDispenses.map((entry) => ({
                  id: entry.id,
                  name: entry.inventoryItem.name,
                  quantity: entry.quantity,
                  unit: entry.inventoryItem.unit
                }))
              }
            : null
        }
        telemedicineBooking={
          telemedicineBooking
            ? {
                id: telemedicineBooking.id,
                serialNumber: telemedicineBooking.serialNumber,
                patientName: telemedicineBooking.patient.name,
                dateLabel: formatDate(telemedicineBooking.date),
                preferredTime: telemedicineBooking.requestedTime ?? telemedicineBooking.telemedicineRequest?.preferredTime ?? "",
                assignedTime: telemedicineBooking.adminTimingNote || `${telemedicineBooking.estimatedStart} - ${telemedicineBooking.estimatedEnd}`,
                status: telemedicineBooking.status,
                reason: telemedicineBooking.reason ?? "",
                confirmedDoctor:
                  telemedicineBooking.telemedicineRequest?.doctor?.user.name ??
                  telemedicineBooking.telemedicineRequest?.preferredDoctor?.user.name ??
                  "",
                manualMedicineText: telemedicineBooking.manualMedicineText ?? "",
                prescriptionImagePath: telemedicineBooking.prescriptionImagePath ?? "",
                dispenses: telemedicineBooking.medicineDispenses.map((entry) => ({
                  id: entry.id,
                  name: entry.inventoryItem.name,
                  quantity: entry.quantity,
                  unit: entry.inventoryItem.unit
                }))
              }
            : null
        }
      />
    </PageShell>
  );
}
