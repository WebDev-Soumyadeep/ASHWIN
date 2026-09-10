"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, currentUser, setSession } from "@/lib/auth";
import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPES,
  BLOOD_REQUEST_STATUSES,
  BLOOD_TYPES,
  DIAGNOSTIC_TYPES,
  ROLES,
  SERVICE_SLOT_DEFAULTS,
  SERVICE_SLOT_TYPES,
  type AppointmentStatus,
  type AppointmentType,
  type BloodRequestStatus,
  type BloodType,
  type DiagnosticType,
  type Role,
  type ServiceSlotType,
  type TelemedicineStatus
} from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { createAndSendOtp, normalizeEmail, verifyOtp } from "@/lib/otp";
import {
  estimateDiagnosticWindow,
  estimateServiceWindow,
  estimateWindow,
  getAvailability,
  getDiagnosticHours,
  getServiceSlotConfigs,
  getTodaySlotConfig
} from "@/lib/slots";
import { todayStart } from "@/lib/dates";
import { resolveActiveHospitalId } from "@/lib/hospital-directory";
import { isSuperAdmin } from "@/lib/hospital-directory";

const AMBULANCE_ASSIGNMENTS = [
  "Hospital assigned arrival in around 30 minutes from booking",
  "Hospital assigned arrival in around 45 minutes from booking",
  "Hospital assigned arrival in around 1 hour from booking",
  "Hospital assigned arrival in around 1 hour 30 minutes from booking",
  "Hospital assigned arrival in around 2 hours from booking"
] as const;

function asInt(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function asString(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function asOptionalString(value: FormDataEntryValue | null) {
  const parsed = asString(value);
  return parsed || undefined;
}

async function activeHospitalFromForm(formData: FormData) {
  const hospitalId = await resolveActiveHospitalId(asOptionalString(formData.get("hospitalId")));
  if (!hospitalId) throw new Error("Choose an active government hospital from the directory.");
  return hospitalId;
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"' && text[index + 1] === '"' && quoted) { field += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) { row.push(field.trim()); field = ""; }
    else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field.trim()); if (row.some(Boolean)) rows.push(row); row = []; field = "";
    } else field += character;
  }
  row.push(field.trim()); if (row.some(Boolean)) rows.push(row);
  return rows;
}

function csvValue(record: Record<string, string>, names: string[]) {
  const key = Object.keys(record).find((item) => names.includes(item.toLowerCase().replaceAll(/[^a-z0-9]/g, "")));
  return key ? record[key].trim() : "";
}

export async function importHospitalDirectoryAction(_: unknown, formData: FormData) {
  const user = await currentUser();
  if (!user || !isSuperAdmin(user.email)) throw new Error("Only the configured super admin can import the hospital directory.");
  const file = formData.get("directory");
  if (!(file instanceof File) || !file.size || !file.name.toLowerCase().endsWith(".csv")) {
    return { ok: false, message: "Upload the official hospital directory as a CSV file." };
  }
  const rows = parseCsv(await file.text());
  const headers = rows.shift()?.map((header) => header.toLowerCase().replaceAll(/[^a-z0-9]/g, "")) ?? [];
  if (!headers.length) return { ok: false, message: "The CSV has no header row." };
  let imported = 0, rejected = 0;
  await prisma.$transaction(async (tx) => {
    await tx.hospital.updateMany({ where: { sourceId: { startsWith: "official:" } }, data: { isActive: false } });
    for (const row of rows) {
      const record = Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]));
      const name = csvValue(record, ["hospitalname", "facilityname", "name"]);
      const state = csvValue(record, ["state", "statename", "stateut"]);
      const district = csvValue(record, ["district", "districtname"]);
      const category = csvValue(record, ["hospitalcategory", "category", "ownership", "facilitytype"]);
      const sourceId = csvValue(record, ["sourceid", "hospitalid", "facilityid", "srno", "srno"]);
      if (!name || !state || !district || !/(government|govt|public)/i.test(category)) { rejected += 1; continue; }
      const stableSourceId = sourceId ? `official:${sourceId}` : `official:${state}:${district}:${name}`;
      const existing = await tx.hospital.findFirst({ where: { OR: [{ sourceId: stableSourceId }, { name, state, district }] } });
      const data = { name, state, district, sourceId: stableSourceId, category, isActive: true, importedAt: new Date() };
      if (existing) await tx.hospital.update({ where: { id: existing.id }, data });
      else await tx.hospital.create({ data });
      imported += 1;
    }
  });
  revalidatePath("/auth"); revalidatePath("/patient"); revalidatePath("/doctor"); revalidatePath("/admin"); revalidatePath("/medical-shop");
  return { ok: true, message: `Imported ${imported} government hospitals. Rejected ${rejected} rows without a verified public/government classification or location.` };
}

async function savePrescriptionUpload(
  file: FormDataEntryValue | null,
  serviceType: ServiceSlotType,
  userId: string
) {
  if (!(file instanceof File) || file.size === 0) {
    return undefined;
  }

  const mimeType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  if (!(mimeType === "image/jpeg" || mimeType === "image/jpg" || fileName.endsWith(".jpg") || fileName.endsWith(".jpeg"))) {
    throw new Error("Upload the prescription only in JPG format.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const uploadsDir = path.join(process.cwd(), "public", "prescriptions");
  await mkdir(uploadsDir, { recursive: true });
  const safeName = `${serviceType.toLowerCase()}-${userId}-${Date.now()}.jpg`;
  await writeFile(path.join(uploadsDir, safeName), bytes);
  return `/prescriptions/${safeName}`;
}

function pickAmbulanceAssignment() {
  return AMBULANCE_ASSIGNMENTS[Math.floor(Math.random() * AMBULANCE_ASSIGNMENTS.length)];
}

function defaultAssignedTiming(serviceType: ServiceSlotType) {
  if (serviceType === "AMBULANCE") {
    return pickAmbulanceAssignment();
  }
  if (serviceType === "MEDICINE_DELIVERY") {
    return "Hospital assigned delivery after 2 hours of booking";
  }
  if (serviceType === "TELEMEDICINE_DELIVERY") {
    return "Medical shop will confirm telemedicine delivery timing";
  }
  if (serviceType === "BLOOD_BANK") {
    return "Waiting for doctor approval";
  }

  return null;
}

function validAadhaar(value: string) {
  return /^\d{12}$/.test(value);
}

async function syncTelemedicineBooking(
  serviceBookingId: string | undefined,
  data: {
    requestedTime?: string | null;
    adminTimingNote?: string | null;
    doctorId?: string | null;
    status?: AppointmentStatus;
  }
) {
  if (!serviceBookingId) return;

  await prisma.serviceBooking.update({
    where: { id: serviceBookingId },
    data: {
      ...(Object.prototype.hasOwnProperty.call(data, "requestedTime")
        ? { requestedTime: data.requestedTime ?? null }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(data, "adminTimingNote")
        ? { adminTimingNote: data.adminTimingNote ?? null }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(data, "doctorId")
        ? { doctorId: data.doctorId ?? null }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(data, "status")
        ? { status: data.status }
        : {})
    }
  });
}

async function createConsultationBooking({
  userId,
  hospitalId,
  consultationType,
  reason,
  aadhaar,
  preferredHospital,
  preferredTime
}: {
  userId: string;
  hospitalId: string;
  consultationType: AppointmentType;
  reason: string;
  aadhaar?: string;
  preferredHospital: string;
  preferredTime?: string;
}) {
  const [totalToday, consultationToday, priorityToday] = await Promise.all([
    prisma.appointment.count({
      where: { patientId: userId, date: todayStart(), source: "PATIENT_PUBLIC" }
    }),
    prisma.appointment.count({
      where: { patientId: userId, date: todayStart(), source: "PATIENT_PUBLIC", priority: "CONSULTATION" }
    }),
    prisma.appointment.count({
      where: {
        patientId: userId,
        date: todayStart(),
        source: "PATIENT_PUBLIC",
        priority: { in: ["ELDER_AGE", "PREGNANT", "SERIOUS_ILLNESS"] }
      }
    })
  ]);

  if (totalToday >= 5) {
    throw new Error("One email can book maximum 5 appointments per day.");
  }
  if (consultationType === "CONSULTATION" && consultationToday >= 3) {
    throw new Error("Consultation booking limit is 3 per day for one email.");
  }
  if (consultationType !== "CONSULTATION" && priorityToday >= 2) {
    throw new Error("Elder age, pregnant, and serious illness booking limit is 2 per day for one email.");
  }

  if (consultationType !== "CONSULTATION" && !validAadhaar(aadhaar ?? "")) {
    throw new Error("A 12 digit Aadhaar number is required for this consultation type.");
  }

  const availability = await getAvailability(hospitalId);
  if (availability.publicRemaining <= 0) {
    throw new Error("No public appointment slots are available today.");
  }

  const [doctor, serviceConfigs] = await Promise.all([
    prisma.doctor.findFirst({ where: { user: { hospitalId } }, orderBy: { id: "asc" } }),
    getServiceSlotConfigs(todayStart(), hospitalId)
  ]);
  const consultationConfig = serviceConfigs.find((item) => item.serviceType === "CONSULTATION");
  const serialNumber = availability.publicUsed + 1;
  const window = consultationConfig
    ? estimateWindow(serialNumber, consultationConfig.startTime, consultationConfig.endTime)
    : null;

  if (!consultationConfig || !window) {
    throw new Error("No consultation slot is available within this hospital's working hours.");
  }

  await prisma.appointment.create({
    data: {
      date: todayStart(),
      hospitalId,
      serialNumber,
      ...window,
      priority: consultationType,
      source: "PATIENT_PUBLIC",
      reason,
      patientId: userId,
      doctorId: doctor?.id,
      dailySlotConfigId: availability.config.id
    }
  });

  await prisma.serviceBooking.create({
    data: {
      serviceType: "CONSULTATION",
      date: todayStart(),
      hospitalId,
      serialNumber,
      ...window,
      requestedTime: preferredTime,
      reason,
      patientId: userId,
      doctorId: doctor?.id,
      serviceSlotConfigId: consultationConfig.id,
      consultationType,
      preferredHospital,
      feeAmount: 10
    }
  });

  if (aadhaar) {
    await prisma.user.update({
      where: { id: userId },
      data: { govtId: aadhaar }
    });
  }
}

export async function requestOtpAction(_: unknown, formData: FormData) {
  const role = asString(formData.get("role")) as Role;
  const name = asString(formData.get("name"));
  const email = normalizeEmail(asString(formData.get("email")));
  const hospitalValue = asOptionalString(formData.get("hospitalId"));
  const hospitalId = await resolveActiveHospitalId(hospitalValue);

  if (!name || !email || !ROLES.includes(role)) {
    return { ok: false, message: "Name, email, and role are required." };
  }
  if (role !== "PATIENT" && !hospitalId) {
    return { ok: false, message: "Choose the hospital for this login." };
  }

  const result = await createAndSendOtp({ email, name, role, hospitalId });
  return {
    ok: true,
    message: "OTP generated through the local queue.",
    otpCode: result.code,
    email,
    name,
    role,
    hospitalId
  };
}

export async function verifyOtpAction(_: unknown, formData: FormData) {
  const role = asString(formData.get("role")) as Role;
  const email = normalizeEmail(asString(formData.get("email")));
  const code = asString(formData.get("code"));
  const hospitalId = await resolveActiveHospitalId(asOptionalString(formData.get("hospitalId")));

  const result = await verifyOtp({ email, role, code, hospitalId });
  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  await setSession(result.user.id);
  redirect(
    role === "PATIENT"
      ? "/patient"
      : role === "DOCTOR"
        ? "/doctor"
        : role === "MEDICAL_SHOP"
          ? "/medical-shop"
          : "/admin"
  );
}

export async function logoutAction() {
  await clearSession();
  redirect("/auth");
}

export async function updateDailySlotsAction(formData: FormData) {
  const user = await currentUser();
  if (user?.role !== "ADMIN" || !user.hospitalId) redirect("/auth");

  const config = await getTodaySlotConfig(user.hospitalId);
  await prisma.dailySlotConfig.update({
    where: { id: config.id },
    data: {
      publicSlots: asInt(formData.get("publicSlots"), 180),
      emergencyReserveSlots: asInt(formData.get("emergencyReserveSlots"), 20),
      mriSlots: asInt(formData.get("mriSlots"), 18),
      xraySlots: asInt(formData.get("xraySlots"), 30),
      bloodReportSlots: asInt(formData.get("bloodReportSlots"), 45),
      mriStartTime: asString(formData.get("mriStartTime")) || "09:00",
      mriEndTime: asString(formData.get("mriEndTime")) || "17:00",
      xrayStartTime: asString(formData.get("xrayStartTime")) || "09:00",
      xrayEndTime: asString(formData.get("xrayEndTime")) || "17:00",
      bloodReportStartTime: asString(formData.get("bloodReportStartTime")) || "09:00",
      bloodReportEndTime: asString(formData.get("bloodReportEndTime")) || "17:00"
    }
  });

  revalidatePath("/admin");
  revalidatePath("/patient");
}

export async function updateServiceSlotsAction(formData: FormData) {
  const user = await currentUser();
  if (user?.role !== "ADMIN" || !user.hospitalId) redirect("/auth");

  const configs = await getServiceSlotConfigs(todayStart(), user.hospitalId);

  await prisma.$transaction(
    configs.map((config) =>
      prisma.serviceSlotConfig.update({
        where: { id: config.id },
        data: {
          slotCount: asInt(
            formData.get(`${config.serviceType}_slotCount`),
            SERVICE_SLOT_DEFAULTS[config.serviceType as ServiceSlotType].slotCount
          ),
          startTime:
            asString(formData.get(`${config.serviceType}_startTime`)) ||
            SERVICE_SLOT_DEFAULTS[config.serviceType as ServiceSlotType].startTime,
          endTime:
            asString(formData.get(`${config.serviceType}_endTime`)) ||
            SERVICE_SLOT_DEFAULTS[config.serviceType as ServiceSlotType].endTime
        }
      })
    )
  );

  revalidatePath("/admin");
  revalidatePath("/doctor");
  revalidatePath("/patient");
}

export async function updateSingleServiceSlotAction(formData: FormData) {
  const user = await currentUser();
  if (user?.role !== "ADMIN" || !user.hospitalId) redirect("/auth");

  const serviceType = asString(formData.get("serviceType")) as ServiceSlotType;
  if (!SERVICE_SLOT_TYPES.includes(serviceType)) {
    throw new Error("Choose a valid service slot.");
  }

  const configs = await getServiceSlotConfigs(todayStart(), user.hospitalId);
  const config = configs.find((item) => item.serviceType === serviceType);
  if (!config) {
    throw new Error("Service slot configuration is missing.");
  }

  await prisma.serviceSlotConfig.update({
    where: { id: config.id },
    data: {
      slotCount: asInt(
        formData.get("slotCount"),
        SERVICE_SLOT_DEFAULTS[serviceType].slotCount
      ),
      startTime:
        asString(formData.get("startTime")) ||
        SERVICE_SLOT_DEFAULTS[serviceType].startTime,
      endTime:
        asString(formData.get("endTime")) ||
        SERVICE_SLOT_DEFAULTS[serviceType].endTime
    }
  });

  revalidatePath("/admin");
  revalidatePath("/doctor");
  revalidatePath("/patient");
}

export async function updateInventoryAction(formData: FormData) {
  const user = await currentUser();
  if ((user?.role !== "ADMIN" && user?.role !== "MEDICAL_SHOP") || !user.hospitalId) redirect("/auth");

  const name = asString(formData.get("name"));
  const description = asString(formData.get("description"));
  const stock = asInt(formData.get("stock"), 0);
  const unit = asString(formData.get("unit")) || "units";

  if (name) {
    await prisma.inventoryItem.upsert({
      where: { hospitalId_name: { hospitalId: user.hospitalId, name } },
      update: { description, stock, unit },
      create: { name, description, stock, unit, hospitalId: user.hospitalId }
    });
  }

  revalidatePath("/admin");
  revalidatePath("/medical-shop");
}

export async function updateBloodBankAction(formData: FormData) {
  const user = await currentUser();
  if (user?.role !== "ADMIN" || !user.hospitalId) redirect("/auth");

  for (const bloodType of BLOOD_TYPES) {
    await prisma.bloodBankItem.upsert({
      where: { hospitalId_bloodType: { hospitalId: user.hospitalId, bloodType } },
      update: { pouches: asInt(formData.get(`blood_${bloodType}`), 0) },
      create: {
        hospitalId: user.hospitalId,
        bloodType,
        pouches: asInt(formData.get(`blood_${bloodType}`), 0)
      }
    });
  }

  revalidatePath("/admin");
  revalidatePath("/patient");
}

export async function bookAppointmentAction(formData: FormData) {
  const user = await currentUser();
  if (user?.role !== "PATIENT") redirect("/auth");
  const hospitalId = await activeHospitalFromForm(formData);

  const appointmentType = asString(formData.get("appointmentType")) as AppointmentType;
  if (!APPOINTMENT_TYPES.includes(appointmentType)) {
    throw new Error("Choose a valid appointment type.");
  }
  await createConsultationBooking({
    userId: user.id,
    hospitalId,
    consultationType: appointmentType,
    reason: asString(formData.get("reason")),
    aadhaar: asOptionalString(formData.get("aadhaar")),
    preferredHospital: asString(formData.get("preferredHospital")),
    preferredTime: asOptionalString(formData.get("preferredTime"))
  });

  revalidatePath("/patient");
  revalidatePath("/doctor");
  revalidatePath("/admin");
}

export async function allocateEmergencyAction(formData: FormData) {
  const user = await currentUser();
  if (user?.role !== "ADMIN" || !user.hospitalId) redirect("/auth");

  const patientName = asString(formData.get("patientName"));
  const email = normalizeEmail(asString(formData.get("email")));
  const reason = asString(formData.get("reason"));
  const govtId = asString(formData.get("govtId"));

  if (!patientName || !email || !reason || !govtId) return;

  const availability = await getAvailability(user.hospitalId);
  if (availability.emergencyRemaining <= 0) {
    throw new Error("No emergency reserve slots are available today.");
  }

  const patient = await prisma.user.upsert({
    where: { email },
    update: { name: patientName, govtId, role: "PATIENT" },
    create: { name: patientName, email, govtId, role: "PATIENT" }
  });
  const doctor = await prisma.doctor.findFirst({ where: { user: { hospitalId: user.hospitalId } }, orderBy: { id: "asc" } });
  const consultationConfig = (
    await getServiceSlotConfigs(todayStart(), user.hospitalId)
  ).find((item) => item.serviceType === "CONSULTATION");
  const serialNumber = availability.consultationSlotCount + availability.emergencyUsed + 1;
  const window = consultationConfig
    ? estimateWindow(serialNumber, consultationConfig.startTime, consultationConfig.endTime)
    : null;
  if (!window) {
    throw new Error("Emergency timing exceeds the hospital consultation window.");
  }

  await prisma.appointment.create({
    data: {
      date: todayStart(),
      hospitalId: user.hospitalId,
      serialNumber,
      ...window,
      priority: "EMERGENCY",
      source: "HOSPITAL_EMERGENCY",
      reason,
      patientId: patient.id,
      doctorId: doctor?.id,
      dailySlotConfigId: availability.config.id
    }
  });

  revalidatePath("/admin");
  revalidatePath("/doctor");
}

export async function bookDiagnosticAction(formData: FormData) {
  const user = await currentUser();
  if (user?.role !== "PATIENT") redirect("/auth");
  const hospitalId = await activeHospitalFromForm(formData);

  const type = asString(formData.get("type")) as DiagnosticType;
  if (!DIAGNOSTIC_TYPES.includes(type)) return;
  const availability = await getAvailability(hospitalId);
  const remaining =
    type === "MRI"
      ? availability.mriRemaining
      : type === "XRAY"
        ? availability.xrayRemaining
        : availability.bloodRemaining;

  if (remaining <= 0) {
    throw new Error("No diagnostic slots are available for this service today.");
  }

  const serialNumber =
    (await prisma.diagnosticBooking.count({
      where: { dailySlotConfigId: availability.config.id, type }
    })) + 1;
  const hours = getDiagnosticHours(type, availability.config);
  const window = estimateDiagnosticWindow(serialNumber, hours.start, hours.end);
  if (!window) {
    throw new Error("No diagnostic timing remains inside this hospital's working hours.");
  }

  await prisma.diagnosticBooking.create({
    data: {
      date: todayStart(),
      hospitalId,
      serialNumber,
      type,
      ...window,
      patientId: user.id,
      dailySlotConfigId: availability.config.id
    }
  });

  const serviceConfigs = await getServiceSlotConfigs(todayStart(), hospitalId);
  const config = serviceConfigs.find((entry) => entry.serviceType === type);
  if (config) {
    const serviceWindow = estimateServiceWindow(serialNumber, type, config.startTime, config.endTime);
    if (!serviceWindow) {
      throw new Error("No service timing remains inside this hospital's working hours.");
    }
    await prisma.serviceBooking.create({
      data: {
        serviceType: type,
        date: todayStart(),
        hospitalId,
        serialNumber,
        ...serviceWindow,
        requestedTime: undefined,
        reason: `${type} booking`,
        patientId: user.id,
        serviceSlotConfigId: config.id
      }
    });
  }

  revalidatePath("/patient");
  revalidatePath("/admin");
}

export async function createServiceBookingAction(formData: FormData) {
  const user = await currentUser();
  if (user?.role !== "PATIENT") redirect("/auth");
  const hospitalId = await activeHospitalFromForm(formData);

  const serviceType = asString(formData.get("serviceType")) as ServiceSlotType;
  if (!SERVICE_SLOT_TYPES.includes(serviceType)) {
    throw new Error("Choose a valid service slot.");
  }

  if (serviceType === "CONSULTATION") {
    const consultationType = asString(formData.get("consultationType")) as AppointmentType;
    if (!APPOINTMENT_TYPES.includes(consultationType)) {
      throw new Error("Choose a valid consultation type.");
    }

    await createConsultationBooking({
      userId: user.id,
      hospitalId,
      consultationType,
      reason: asString(formData.get("reason")),
      aadhaar: asOptionalString(formData.get("aadhaar")),
      preferredHospital: asString(formData.get("preferredHospital")),
      preferredTime: asOptionalString(formData.get("preferredTime"))
    });

    revalidatePath("/patient");
    revalidatePath("/doctor");
    revalidatePath("/admin");
    return;
  }

  const configs = await getServiceSlotConfigs(todayStart(), hospitalId);
  const config = configs.find((entry) => entry.serviceType === serviceType);
  if (!config) {
    throw new Error("Service slot configuration is missing.");
  }

  const bookedCount = await prisma.serviceBooking.count({
    where: { serviceSlotConfigId: config.id }
  });

  if (bookedCount >= config.slotCount) {
    throw new Error("No slots are available for this service today.");
  }

  const serialNumber = bookedCount + 1;
  const doctor = await prisma.doctor.findFirst({ where: { user: { hospitalId } }, orderBy: { id: "asc" } });
  const assignedTiming = defaultAssignedTiming(serviceType);
  const prescriptionImagePath = await savePrescriptionUpload(
    formData.get("prescriptionImage"),
    serviceType,
    user.id
  );
  const window =
    assignedTiming ||
    serviceType === "AMBULANCE" ||
    serviceType === "MEDICINE_DELIVERY" ||
    serviceType === "TELEMEDICINE_DELIVERY"
      ? {
          estimatedStart: "Pending hospital assignment",
          estimatedEnd: "Pending hospital assignment"
        }
      : estimateServiceWindow(serialNumber, serviceType, config.startTime, config.endTime);
  if (!window) {
    throw new Error("No slot remains inside this hospital's working hours.");
  }

  await prisma.serviceBooking.create({
    data: {
      serviceType,
      date: config.date,
      hospitalId,
      requestedTime: asOptionalString(formData.get("preferredTime")),
      serialNumber,
      ...window,
      adminTimingNote: assignedTiming,
      reason: asString(formData.get("reason")),
      contactNumber: asOptionalString(formData.get("contactNumber")),
      location: asOptionalString(formData.get("location")),
      manualMedicineText: asOptionalString(formData.get("manualMedicineText")),
      prescriptionImagePath,
      feeAmount:
        serviceType === "MEDICINE_DELIVERY" || serviceType === "TELEMEDICINE_DELIVERY"
          ? 60
          : serviceType === "AMBULANCE"
            ? 20
            : 20,
      patientId: user.id,
      doctorId: doctor?.id,
      serviceSlotConfigId: config.id
    }
  });

  revalidatePath("/patient");
  revalidatePath("/doctor");
  revalidatePath("/admin");
}

export async function requestTelemedicineAction(formData: FormData) {
  const user = await currentUser();
  if (user?.role !== "PATIENT") redirect("/auth");
  const hospitalId = await activeHospitalFromForm(formData);

  const serviceConfigs = await getServiceSlotConfigs(todayStart(), hospitalId);
  const config = serviceConfigs.find((entry) => entry.serviceType === "TELEMEDICINE");
  if (config) {
    const serialNumber =
      (await prisma.serviceBooking.count({ where: { serviceSlotConfigId: config.id } })) + 1;
    const telemedicineWindow = estimateServiceWindow(
      serialNumber,
      "TELEMEDICINE",
      config.startTime,
      config.endTime
    );
    if (!telemedicineWindow) {
      throw new Error("No telemedicine slot remains inside this hospital's working hours.");
    }
    const booking = await prisma.serviceBooking.create({
      data: {
        serviceType: "TELEMEDICINE",
        date: config.date,
        hospitalId,
        requestedTime: asOptionalString(formData.get("preferredTime")),
        serialNumber,
        ...telemedicineWindow,
        reason: asString(formData.get("reason")),
        feeAmount: 20,
        patientId: user.id,
        serviceSlotConfigId: config.id
      }
    });

    await prisma.telemedicineRequest.create({
      data: {
        reason: asString(formData.get("reason")),
        hospitalId,
        preferredTime: asString(formData.get("preferredTime")),
        preferredDoctorId: asOptionalString(formData.get("preferredDoctorId")),
        patientId: user.id,
        serviceBookingId: booking.id
      }
    });
  } else {
    await prisma.telemedicineRequest.create({
      data: {
        reason: asString(formData.get("reason")),
        hospitalId,
        preferredTime: asString(formData.get("preferredTime")),
        preferredDoctorId: asOptionalString(formData.get("preferredDoctorId")),
        patientId: user.id
      }
    });
  }

  revalidatePath("/patient");
  revalidatePath("/doctor");
  revalidatePath("/admin");
}

export async function savePrescriptionAction(
  _: { ok: boolean },
  formData: FormData
) {
  const user = await currentUser();
  if (user?.role !== "DOCTOR") redirect("/auth");

  const appointmentId = asString(formData.get("appointmentId"));
  const medicines = asString(formData.get("medicines"));
  const tests = asString(formData.get("tests"));
  const advice = asString(formData.get("advice"));

  if (!appointmentId || !medicines) {
    return { ok: false };
  }

  await prisma.prescription.upsert({
    where: { appointmentId },
    update: { medicines, tests, advice },
    create: { appointmentId, medicines, tests, advice }
  });

  revalidatePath("/doctor");
  revalidatePath("/patient");

  return { ok: true };
}

export async function requestBloodAction(formData: FormData) {
  const user = await currentUser();
  if (user?.role !== "PATIENT") redirect("/auth");
  const hospitalId = await activeHospitalFromForm(formData);

  const bloodType = asString(formData.get("bloodType")) as BloodType;
  const pouches = asInt(formData.get("pouches"), 1);
  const reason = asString(formData.get("reason"));
  const preferredTime = asOptionalString(formData.get("preferredTime"));

  if (!BLOOD_TYPES.includes(bloodType) || pouches < 1 || !reason) return;
  const serialNumber = (await prisma.bloodRequest.count({ where: { hospitalId } })) + 1;

  const serviceConfigs = await getServiceSlotConfigs(todayStart(), hospitalId);
  const config = serviceConfigs.find((entry) => entry.serviceType === "BLOOD_BANK");
  if (config) {
    const bookingSerial =
      (await prisma.serviceBooking.count({ where: { serviceSlotConfigId: config.id } })) + 1;
    const booking = await prisma.serviceBooking.create({
      data: {
        serviceType: "BLOOD_BANK",
        date: config.date,
        hospitalId,
        requestedTime: preferredTime,
        serialNumber: bookingSerial,
        estimatedStart: "Waiting for doctor approval",
        estimatedEnd: "Waiting for doctor approval",
        adminTimingNote: "Waiting for doctor approval",
        reason,
        bloodType,
        quantity: pouches,
        feeAmount: 20,
        patientId: user.id,
        serviceSlotConfigId: config.id
      }
    });

    await prisma.bloodRequest.create({
      data: {
        serialNumber,
        hospitalId,
        bloodType,
        pouches,
        reason,
        preferredTime,
        patientId: user.id,
        serviceBookingId: booking.id
      }
    });
  } else {
    await prisma.bloodRequest.create({
      data: {
        serialNumber,
        hospitalId,
        bloodType,
        pouches,
        reason,
        preferredTime,
        patientId: user.id
      }
    });
  }

  revalidatePath("/patient");
  revalidatePath("/doctor");
  revalidatePath("/medical-shop");
}

export async function updateBloodRequestStatusAction(formData: FormData) {
  const user = await currentUser();
  if (user?.role !== "DOCTOR") redirect("/auth");

  const id = asString(formData.get("id"));
  const status = asString(formData.get("status")) as BloodRequestStatus;
  if (!BLOOD_REQUEST_STATUSES.includes(status)) return;

  await prisma.bloodRequest.update({
    where: { id },
    data: { status, approvedByDoctorId: status === "APPROVED" ? user.id : null }
  });

  const request = await prisma.bloodRequest.findUnique({ where: { id } });
  if (request?.serviceBookingId) {
    await prisma.serviceBooking.update({
      where: { id: request.serviceBookingId },
      data: {
        status: status === "APPROVED" ? "BOOKED" : "CANCELLED",
        adminTimingNote:
          status === "APPROVED"
            ? "Doctor approved blood request"
            : "Doctor rejected blood request"
      }
    });
  }

  revalidatePath("/doctor");
  revalidatePath("/patient");
  revalidatePath("/medical-shop");
}

export async function dispenseBloodRequestAction(formData: FormData) {
  const user = await currentUser();
  if (user?.role !== "MEDICAL_SHOP" || !user.hospitalId) redirect("/auth");

  const bloodRequestId = asString(formData.get("bloodRequestId"));
  const bloodType = asString(formData.get("bloodType"));
  const pouches = asInt(formData.get("pouches"), 1);
  const bloodSerial = asString(formData.get("bloodSerial"));

  if (!bloodRequestId || !bloodType || pouches < 1) return;
  if (!(await prisma.bloodRequest.findUnique({ where: { id: bloodRequestId } }))) return;

  const stock = await prisma.bloodBankItem.findUnique({
    where: { hospitalId_bloodType: { hospitalId: user.hospitalId, bloodType } }
  });

  if (!stock || stock.pouches < pouches) {
    throw new Error("Not enough blood stock to dispense this request.");
  }

  const request = await prisma.bloodRequest.findUnique({
    where: { id: bloodRequestId }
  });
  if (!request) return;

  if (request.serviceBookingId) {
    await prisma.$transaction([
      prisma.bloodBankItem.update({
        where: { hospitalId_bloodType: { hospitalId: user.hospitalId, bloodType } },
        data: { pouches: { decrement: pouches } }
      }),
      prisma.bloodRequest.update({
        where: { id: bloodRequestId },
        data: { status: "DISPENSED" }
      }),
      prisma.serviceBooking.update({
        where: { id: request.serviceBookingId },
        data: {
          status: "COMPLETED",
          adminTimingNote: "Blood dispensed from hospital blood bank"
        }
      })
    ]);
  } else {
    await prisma.$transaction([
      prisma.bloodBankItem.update({
        where: { hospitalId_bloodType: { hospitalId: user.hospitalId, bloodType } },
        data: { pouches: { decrement: pouches } }
      }),
      prisma.bloodRequest.update({
        where: { id: bloodRequestId },
        data: { status: "DISPENSED" }
      })
    ]);
  }

  revalidatePath("/medical-shop");
  revalidatePath("/doctor");
  revalidatePath("/patient");
  revalidatePath("/admin");

  redirect(bloodSerial ? `/medical-shop?bloodSerial=${bloodSerial}` : "/medical-shop");
}

export async function updateAppointmentStatusAction(formData: FormData) {
  const user = await currentUser();
  if (user?.role !== "DOCTOR") redirect("/auth");

  await prisma.appointment.update({
    where: { id: asString(formData.get("id")) },
    data: {
      status: APPOINTMENT_STATUSES.includes(
        asString(formData.get("status")) as AppointmentStatus
      )
        ? asString(formData.get("status"))
        : "BOOKED"
    }
  });

  revalidatePath("/doctor");
}

export async function updateServiceBookingStatusAction(formData: FormData) {
  const user = await currentUser();
  if (user?.role !== "DOCTOR" && user?.role !== "ADMIN") redirect("/auth");

  await prisma.serviceBooking.update({
    where: { id: asString(formData.get("id")) },
    data: {
      status: APPOINTMENT_STATUSES.includes(
        asString(formData.get("status")) as AppointmentStatus
      )
        ? asString(formData.get("status"))
        : "BOOKED"
    }
  });

  revalidatePath("/doctor");
  revalidatePath("/admin");
  revalidatePath("/patient");
}

export async function updateServiceBookingTimingAction(formData: FormData) {
  const user = await currentUser();
  if (user?.role !== "ADMIN") redirect("/auth");

  const id = asString(formData.get("id"));
  const adminTimingNote = asOptionalString(formData.get("adminTimingNote"));
  if (!id) return;

  await prisma.serviceBooking.update({
    where: { id },
    data: { adminTimingNote: adminTimingNote ?? null }
  });

  revalidatePath("/doctor");
  revalidatePath("/admin");
  revalidatePath("/patient");
}

export async function scheduleTelemedicineAction(formData: FormData) {
  const user = await currentUser();
  if (user?.role !== "DOCTOR" && user?.role !== "ADMIN") redirect("/auth");

  const doctorId =
    user.role === "DOCTOR"
      ? user.doctor?.id
      : asString(formData.get("doctorId")) || undefined;
  const id = asString(formData.get("id"));
  const scheduledTime = asString(formData.get("scheduledTime"));

  const request = await prisma.telemedicineRequest.findUnique({ where: { id } });
  if (!request) return;

  await prisma.telemedicineRequest.update({
    where: { id },
    data: {
      scheduledTime,
      doctorId,
      status: "SCHEDULED",
      doctorDecision: "APPROVED",
      alternativeDoctorId: null,
      alternativeForPreferredTime: null
    }
  });
  await syncTelemedicineBooking(request.serviceBookingId ?? undefined, {
    requestedTime: request.preferredTime ?? null,
    adminTimingNote: scheduledTime,
    doctorId: doctorId ?? null,
    status: "BOOKED"
  });

  revalidatePath("/doctor");
  revalidatePath("/admin");
  revalidatePath("/patient");
}

export async function reviewTelemedicineAction(formData: FormData) {
  const user = await currentUser();
  if (user?.role !== "DOCTOR") redirect("/auth");

  const id = asString(formData.get("id"));
  const decision = asString(formData.get("decision"));
  const scheduledTime = asOptionalString(formData.get("scheduledTime"));
  const request = await prisma.telemedicineRequest.findUnique({ where: { id } });
  if (!request) return;

  if (decision === "APPROVE") {
    if (!scheduledTime) {
      throw new Error("Scheduled time is required to approve telemedicine.");
    }

    await prisma.telemedicineRequest.update({
      where: { id },
      data: {
        scheduledTime,
        doctorId: user.doctor?.id,
        status: "SCHEDULED",
        doctorDecision: "APPROVED",
        alternativeDoctorId: null,
        alternativeForPreferredTime: null
      }
    });
    await syncTelemedicineBooking(request.serviceBookingId ?? undefined, {
      requestedTime: request.preferredTime ?? null,
      adminTimingNote: scheduledTime,
      doctorId: user.doctor?.id ?? null,
      status: "BOOKED"
    });
  }

  if (decision === "DELAY" || decision === "REJECT") {
    await prisma.telemedicineRequest.update({
      where: { id },
      data: {
        doctorId: user.doctor?.id,
        scheduledTime: null,
        doctorDecision: decision === "DELAY" ? "DELAYED" : "REJECTED",
        status: "REQUESTED"
      }
    });
    await syncTelemedicineBooking(request.serviceBookingId ?? undefined, {
      requestedTime: request.preferredTime ?? null,
      adminTimingNote: "Waiting for administration options",
      doctorId: user.doctor?.id ?? null,
      status: "BOOKED"
    });
  }

  revalidatePath("/doctor");
  revalidatePath("/admin");
  revalidatePath("/patient");
}

export async function offerTelemedicineOptionsAction(formData: FormData) {
  const user = await currentUser();
  if (user?.role !== "ADMIN") redirect("/auth");

  const id = asString(formData.get("id"));
  const alternativeDoctorId = asOptionalString(formData.get("alternativeDoctorId"));
  const alternativeForPreferredTime = asOptionalString(
    formData.get("alternativeForPreferredTime")
  );

  await prisma.telemedicineRequest.update({
    where: { id },
    data: {
      alternativeDoctorId,
      alternativeForPreferredTime,
      status: "OPTION_PENDING"
    }
  });
  const request = await prisma.telemedicineRequest.findUnique({ where: { id } });
  await syncTelemedicineBooking(request?.serviceBookingId ?? undefined, {
    adminTimingNote: alternativeForPreferredTime ?? request?.preferredTime ?? null,
    status: "BOOKED"
  });

  revalidatePath("/admin");
  revalidatePath("/patient");
}

export async function acceptTelemedicineOptionAction(formData: FormData) {
  const user = await currentUser();
  if (user?.role !== "PATIENT") redirect("/auth");

  const id = asString(formData.get("id"));
  const choice = asString(formData.get("choice"));
  const request = await prisma.telemedicineRequest.findUnique({
    where: { id },
    include: { preferredDoctor: true, alternativeDoctor: true }
  });

  if (!request || request.patientId !== user.id) return;

  let data:
    | {
        doctorId: string;
        scheduledTime: string | null;
        status: TelemedicineStatus;
        alternativeDoctorId: null;
        alternativeForPreferredTime: null;
      }
    | undefined;

  if (choice === "ALTERNATIVE_DOCTOR" && request.alternativeDoctorId) {
    data = {
      doctorId: request.alternativeDoctorId,
      scheduledTime: request.preferredTime ?? null,
      status: "SCHEDULED",
      alternativeDoctorId: null,
      alternativeForPreferredTime: null
    };
  } else if (
    choice === "PREFERRED_DIFFERENT_TIME" &&
    request.preferredDoctorId &&
    request.alternativeForPreferredTime
  ) {
    data = {
      doctorId: request.preferredDoctorId,
      scheduledTime: request.alternativeForPreferredTime,
      status: "SCHEDULED",
      alternativeDoctorId: null,
      alternativeForPreferredTime: null
    };
  }

  if (!data) return;

  await prisma.telemedicineRequest.update({ where: { id }, data });
  await syncTelemedicineBooking(request.serviceBookingId ?? undefined, {
    adminTimingNote: data.scheduledTime,
    doctorId: data.doctorId,
    requestedTime: request.preferredTime ?? null,
    status: "BOOKED"
  });

  revalidatePath("/patient");
  revalidatePath("/admin");
  revalidatePath("/doctor");
}

export async function declineTelemedicineOptionAction(formData: FormData) {
  const user = await currentUser();
  if (user?.role !== "PATIENT") redirect("/auth");

  const id = asString(formData.get("id"));
  const request = await prisma.telemedicineRequest.findUnique({ where: { id } });
  if (!request || request.patientId !== user.id) return;

  await prisma.telemedicineRequest.update({
    where: { id },
    data: {
      status: "DECLINED",
      doctorId: null,
      scheduledTime: null
    }
  });
  await syncTelemedicineBooking(request.serviceBookingId ?? undefined, {
    adminTimingNote: null,
    doctorId: null,
    status: "CANCELLED"
  });

  revalidatePath("/patient");
  revalidatePath("/admin");
  revalidatePath("/doctor");
}

export async function upsertDoctorAction(formData: FormData) {
  const user = await currentUser();
  if (user?.role !== "ADMIN" || !user.hospitalId) redirect("/auth");

  const name = asString(formData.get("name"));
  const email = normalizeEmail(asString(formData.get("email")));
  const department = asString(formData.get("department"));
  const availability = asString(formData.get("availability"));

  if (!name || !email || !department || !availability) return;

  await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role: "DOCTOR",
      hospitalId: user.hospitalId,
      doctor: {
        upsert: {
          update: { department, availability },
          create: { department, availability }
        }
      }
    },
    create: {
      name,
      email,
      role: "DOCTOR",
      hospitalId: user.hospitalId,
      doctor: {
        create: { department, availability }
      }
    }
  });

  revalidatePath("/admin");
  revalidatePath("/patient");
}

export async function dispenseMedicineAction(formData: FormData) {
  const user = await currentUser();
  if (user?.role !== "MEDICAL_SHOP") redirect("/auth");

  const appointmentId = asOptionalString(formData.get("appointmentId"));
  const serviceBookingId = asOptionalString(formData.get("serviceBookingId"));
  const inventoryItemId = asString(formData.get("inventoryItemId"));
  const quantity = asInt(formData.get("quantity"), 1);
  const dispenseCategory = asString(formData.get("dispenseCategory")) || "CONSULTATION";
  const note = asOptionalString(formData.get("note"));

  if ((!appointmentId && !serviceBookingId) || !inventoryItemId || quantity < 1) return;

  const item = await prisma.inventoryItem.findUnique({ where: { id: inventoryItemId } });
  if (!item || item.stock < quantity) {
    throw new Error("Not enough stock to dispense this medicine.");
  }

  if (serviceBookingId) {
    await prisma.$transaction([
      prisma.inventoryItem.update({
        where: { id: inventoryItemId },
        data: { stock: { decrement: quantity } }
      }),
      prisma.medicineDispense.create({
        data: {
          appointmentId: appointmentId ?? undefined,
          serviceBookingId,
          dispenseCategory,
          inventoryItemId,
          quantity,
          note,
          dispensedById: user.id
        }
      }),
      prisma.serviceBooking.update({
        where: { id: serviceBookingId },
        data: {
          status: "COMPLETED",
          adminTimingNote:
            dispenseCategory === "MEDICINE_DELIVERY"
              ? "Medicine delivered from hospital stock"
              : dispenseCategory === "TELEMEDICINE"
                ? "Telemedicine support medicine dispensed"
                : dispenseCategory === "TELEMEDICINE_DELIVERY"
                  ? "Telemedicine delivery completed from hospital stock"
                : "Medicine dispensed"
        }
      })
    ]);
  } else {
    await prisma.$transaction([
      prisma.inventoryItem.update({
        where: { id: inventoryItemId },
        data: { stock: { decrement: quantity } }
      }),
      prisma.medicineDispense.create({
        data: {
          appointmentId: appointmentId ?? undefined,
          dispenseCategory,
          inventoryItemId,
          quantity,
          note,
          dispensedById: user.id
        }
      })
    ]);
  }

  revalidatePath("/medical-shop");
  revalidatePath("/medical-shop/daily-dispense-history");
  revalidatePath("/admin");
}

export async function completeMedicalShopServiceAction(formData: FormData) {
  const user = await currentUser();
  if (user?.role !== "MEDICAL_SHOP") redirect("/auth");

  const id = asString(formData.get("id"));
  const note = asOptionalString(formData.get("note"));
  if (!id) return;

  await prisma.serviceBooking.update({
    where: { id },
    data: {
      status: "COMPLETED",
      adminTimingNote: note ?? "Handled by medical shop"
    }
  });

  revalidatePath("/medical-shop");
  revalidatePath("/medical-shop/daily-dispense-history");
  revalidatePath("/admin");
  revalidatePath("/patient");
}
