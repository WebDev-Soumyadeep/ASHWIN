import { prisma } from "@/lib/prisma";

export type HospitalLocation = {
  id: string;
  name: string;
  state: string;
  district: string;
};

export async function getActiveHospitalLocations(): Promise<HospitalLocation[]> {
  return prisma.hospital.findMany({
    where: { isActive: true },
    select: { id: true, name: true, state: true, district: true },
    orderBy: [{ state: "asc" }, { district: "asc" }, { name: "asc" }]
  });
}

export async function resolveActiveHospitalId(value: string | undefined) {
  if (!value) return undefined;
  const hospital = await prisma.hospital.findFirst({
    where: { id: value, isActive: true },
    select: { id: true }
  });
  return hospital?.id;
}

export function isSuperAdmin(email: string) {
  const allowlist = (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return allowlist.includes(email.trim().toLowerCase());
}
