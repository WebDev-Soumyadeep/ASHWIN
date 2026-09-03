import { PrismaClient } from "@prisma/client";
import { BLOOD_TYPES, PREFERRED_HOSPITALS } from "@/lib/domain";

const prisma = new PrismaClient();

const todayAtMidnight = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

async function main() {
  for (const hospitalName of PREFERRED_HOSPITALS) {
    await prisma.hospital.upsert({
      where: { name: hospitalName },
      update: {},
      create: { name: hospitalName }
    });
  }

  const defaultHospital = await prisma.hospital.findUnique({
    where: { name: PREFERRED_HOSPITALS[0] }
  });

  if (!defaultHospital) {
    throw new Error("Default hospital seed failed.");
  }

  const doctorUser = await prisma.user.upsert({
    where: { email: "doctor@ideajam.health" },
    update: { hospitalId: defaultHospital.id, role: "DOCTOR" },
    create: {
      name: "Dr. Asha Sen",
      email: "doctor@ideajam.health",
      role: "DOCTOR",
      hospitalId: defaultHospital.id,
      phone: "9000000001",
      doctor: {
        create: {
          department: "General Medicine",
          availability: "10:00 AM - 5:00 PM"
        }
      }
    },
    include: { doctor: true }
  });

  await prisma.user.upsert({
    where: { email: "admin@ideajam.health" },
    update: {
      name: "Hospital Admin",
      role: "ADMIN",
      hospitalId: defaultHospital.id,
      phone: "9000000002"
    },
    create: {
      name: "Hospital Admin",
      email: "admin@ideajam.health",
      role: "ADMIN",
      hospitalId: defaultHospital.id,
      phone: "9000000002"
    }
  });

  await prisma.user.upsert({
    where: { email: "patient@ideajam.health" },
    update: {},
    create: {
      name: "Rahul Patient",
      email: "patient@ideajam.health",
      role: "PATIENT",
      phone: "9000000003",
      govtId: "DEMO-GOVT-ID"
    }
  });

  await prisma.user.upsert({
    where: { email: "medicalshop@ideajam.health" },
    update: {
      name: "Medical Shopkeeper",
      role: "MEDICAL_SHOP",
      hospitalId: defaultHospital.id,
      phone: "9000000004"
    },
    create: {
      name: "Medical Shopkeeper",
      email: "medicalshop@ideajam.health",
      role: "MEDICAL_SHOP",
      hospitalId: defaultHospital.id,
      phone: "9000000004"
    }
  });

  await prisma.user.upsert({
    where: { email: "neurology@ideajam.health" },
    update: {
      name: "Dr. Riya Das",
      role: "DOCTOR",
      hospitalId: defaultHospital.id,
      doctor: {
        upsert: {
          update: {
            department: "Neurology",
            availability: "Mon-Fri, 11:00 AM - 4:00 PM"
          },
          create: {
            department: "Neurology",
            availability: "Mon-Fri, 11:00 AM - 4:00 PM"
          }
        }
      }
    },
    create: {
      name: "Dr. Riya Das",
      email: "neurology@ideajam.health",
      role: "DOCTOR",
      hospitalId: defaultHospital.id,
      phone: "9000000005",
      doctor: {
        create: {
          department: "Neurology",
          availability: "Mon-Fri, 11:00 AM - 4:00 PM"
        }
      }
    }
  });

  await prisma.dailySlotConfig.upsert({
    where: { date_hospitalId: { date: todayAtMidnight(), hospitalId: defaultHospital.id } },
    update: {},
    create: {
      date: todayAtMidnight(),
      hospitalId: defaultHospital.id,
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

  const items = [
    ["Paracetamol", "500 mg tablets", 240, "tablets"],
    ["ORS", "Rehydration sachets", 120, "sachets"],
    ["Insulin", "Cold-chain vials", 32, "vials"],
    ["Amoxicillin", "250 mg capsules", 90, "capsules"]
  ] as const;

  for (const [name, description, stock, unit] of items) {
    await prisma.inventoryItem.upsert({
      where: { hospitalId_name: { hospitalId: defaultHospital.id, name } },
      update: { description, stock, unit },
      create: { name, description, stock, unit, hospitalId: defaultHospital.id }
    });
  }

  const pouchCounts: Record<(typeof BLOOD_TYPES)[number], number> = {
    "A+": 12,
    "A-": 4,
    "B+": 11,
    "B-": 3,
    "AB+": 7,
    "AB-": 2,
    "O+": 18,
    "O-": 5
  };

  for (const bloodType of BLOOD_TYPES) {
    await prisma.bloodBankItem.upsert({
      where: { hospitalId_bloodType: { hospitalId: defaultHospital.id, bloodType } },
      update: { pouches: pouchCounts[bloodType] },
      create: { hospitalId: defaultHospital.id, bloodType, pouches: pouchCounts[bloodType] }
    });
  }

  console.log("Seeded Ideajam healthcare demo data", {
    doctor: doctorUser.doctor?.id,
    hospital: defaultHospital.name
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
