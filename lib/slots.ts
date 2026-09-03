import { prisma } from "@/lib/prisma";
import { todayStart } from "@/lib/dates";
import {
  type DiagnosticType,
  SERVICE_SLOT_DEFAULTS,
  SERVICE_SLOT_TYPES,
  type ServiceSlotType
} from "@/lib/domain";

const SLOT_STEP_MINUTES = 10;

function parseClockValue(value: string) {
  const [hours, minutes] = value.split(":").map((chunk) => Number.parseInt(chunk, 10));
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

function formatClock(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

function buildWindow(startTime: string, endTime: string, durationMinutes: number, serialNumber: number) {
  const start = parseClockValue(startTime);
  start.setMinutes(start.getMinutes() + (serialNumber - 1) * SLOT_STEP_MINUTES);

  const end = new Date(start);
  end.setMinutes(end.getMinutes() + durationMinutes);
  const limit = parseClockValue(endTime);

  if (end > limit) {
    return null;
  }

  return {
    estimatedStart: formatClock(start),
    estimatedEnd: formatClock(end)
  };
}

function maxSlotsWithinWindow(startTime: string, endTime: string, durationMinutes: number) {
  const start = parseClockValue(startTime);
  const end = parseClockValue(endTime);
  const availableMinutes = Math.floor((end.getTime() - start.getTime()) / 60000);
  const latestOffset = availableMinutes - durationMinutes;

  if (latestOffset < 0) return 0;
  return Math.floor(latestOffset / SLOT_STEP_MINUTES) + 1;
}

export function serviceDurationMinutes(type: ServiceSlotType) {
  return {
    CONSULTATION: 30,
    TELEMEDICINE: 30,
    TELEMEDICINE_DELIVERY: 45,
    BLOOD_BANK: 20,
    AMBULANCE: 20,
    MEDICINE_DELIVERY: 45,
    DIALYSIS: 180,
    MRI: 45,
    XRAY: 45,
    BLOOD_REPORT: 45,
    ULTRASOUND_USG: 45,
    CT_SCAN: 45,
    ECG: 45,
    ECHO: 45,
    TMT: 45,
    ENDOSCOPY: 45,
    EEG: 45,
    EMG: 45
  }[type];
}

export function cappedSlotCount(slotCount: number, startTime: string, endTime: string, serviceType: ServiceSlotType) {
  return Math.min(slotCount, maxSlotsWithinWindow(startTime, endTime, serviceDurationMinutes(serviceType)));
}

export async function getTodaySlotConfig(hospitalId: string) {
  const date = todayStart();
  return prisma.dailySlotConfig.upsert({
    where: { date_hospitalId: { date, hospitalId } },
    update: {},
    create: {
      date,
      hospitalId,
      publicSlots: 180,
      emergencyReserveSlots: 20,
      mriSlots: 18,
      xraySlots: 30,
      bloodReportSlots: 45,
      mriStartTime: "09:00",
      mriEndTime: "17:00",
      xrayStartTime: "09:00",
      xrayEndTime: "17:00",
      bloodReportStartTime: "09:00",
      bloodReportEndTime: "17:00"
    }
  });
}

export async function getServiceSlotConfigs(date = todayStart(), hospitalId: string) {
  await prisma.$transaction(
    SERVICE_SLOT_TYPES.map((serviceType) =>
      prisma.serviceSlotConfig.upsert({
        where: { date_hospitalId_serviceType: { date, hospitalId, serviceType } },
        update: {},
        create: {
          date,
          hospitalId,
          serviceType,
          slotCount: SERVICE_SLOT_DEFAULTS[serviceType].slotCount,
          startTime: SERVICE_SLOT_DEFAULTS[serviceType].startTime,
          endTime: SERVICE_SLOT_DEFAULTS[serviceType].endTime
        }
      })
    )
  );

  return prisma.serviceSlotConfig.findMany({
    where: { date, hospitalId },
    orderBy: { createdAt: "asc" }
  });
}

export async function getServiceAvailability(date = todayStart(), hospitalId: string) {
  const configs = await getServiceSlotConfigs(date, hospitalId);
  const groupedCounts = await prisma.serviceBooking.groupBy({
    by: ["serviceType"],
    where: { date, hospitalId },
    _count: { _all: true }
  });

  return configs.map((config) => {
    const used = groupedCounts.find((entry) => entry.serviceType === config.serviceType)?._count._all ?? 0;
    const effectiveSlotCount = cappedSlotCount(
      config.slotCount,
      config.startTime,
      config.endTime,
      config.serviceType as ServiceSlotType
    );

    return {
      ...config,
      slotCount: effectiveSlotCount,
      configuredSlotCount: config.slotCount,
      used,
      remaining: Math.max(effectiveSlotCount - used, 0),
      label: SERVICE_SLOT_DEFAULTS[config.serviceType as ServiceSlotType].label,
      description: SERVICE_SLOT_DEFAULTS[config.serviceType as ServiceSlotType].description,
      color: SERVICE_SLOT_DEFAULTS[config.serviceType as ServiceSlotType].color
    };
  });
}

export async function getAvailability(hospitalId: string) {
  const config = await getTodaySlotConfig(hospitalId);
  const serviceAvailability = await getServiceAvailability(config.date, hospitalId);
  const serviceMap = Object.fromEntries(serviceAvailability.map((item) => [item.serviceType, item])) as Record<
    ServiceSlotType,
    (typeof serviceAvailability)[number]
  >;
  const emergencyUsed = await prisma.appointment.count({
    where: {
      dailySlotConfigId: config.id,
      hospitalId,
      source: "HOSPITAL_EMERGENCY"
    }
  });

  return {
    config,
    serviceAvailability,
    publicUsed: serviceMap.CONSULTATION.used,
    consultationSlotCount: serviceMap.CONSULTATION.slotCount,
    emergencyUsed,
    mriUsed: serviceMap.MRI.used,
    xrayUsed: serviceMap.XRAY.used,
    bloodUsed: serviceMap.BLOOD_REPORT.used,
    publicRemaining: serviceMap.CONSULTATION.remaining,
    emergencyRemaining: Math.max(config.emergencyReserveSlots - emergencyUsed, 0),
    mriRemaining: serviceMap.MRI.remaining,
    xrayRemaining: serviceMap.XRAY.remaining,
    bloodRemaining: serviceMap.BLOOD_REPORT.remaining
  };
}

export function estimateWindow(serialNumber: number, startTime = "10:00", endTime = "17:00") {
  return buildWindow(startTime, endTime, 30, serialNumber);
}

export function getDiagnosticHours(
  type: DiagnosticType,
  config: {
    mriStartTime: string;
    mriEndTime: string;
    xrayStartTime: string;
    xrayEndTime: string;
    bloodReportStartTime: string;
    bloodReportEndTime: string;
  }
) {
  if (type === "MRI") {
    return { start: config.mriStartTime, end: config.mriEndTime };
  }
  if (type === "XRAY") {
    return { start: config.xrayStartTime, end: config.xrayEndTime };
  }

  return {
    start: config.bloodReportStartTime,
    end: config.bloodReportEndTime
  };
}

export function estimateDiagnosticWindow(serialNumber: number, startTime = "09:00", endTime = "17:00") {
  return buildWindow(startTime, endTime, 45, serialNumber);
}

export function estimateServiceWindow(
  serialNumber: number,
  serviceType: ServiceSlotType,
  startTime: string,
  endTime: string
) {
  return buildWindow(startTime, endTime, serviceDurationMinutes(serviceType), serialNumber);
}

export function diagnosticWindowLabel(serialNumber: number, hours: { start: string; end: string }) {
  const window = estimateDiagnosticWindow(serialNumber, hours.start, hours.end);
  return window ? `${window.estimatedStart} - ${window.estimatedEnd}` : "No window available";
}

export function diagnosticOperatingHours(hours: { start: string; end: string }) {
  const parsedStart = parseClockValue(hours.start);
  const parsedEnd = parseClockValue(hours.end);
  return `${formatClock(parsedStart)} - ${formatClock(parsedEnd)}`;
}
