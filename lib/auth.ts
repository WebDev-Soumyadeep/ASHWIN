import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "ideajam_user";

export async function setSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function currentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(COOKIE_NAME)?.value;
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    include: { doctor: true, hospital: true }
  });
}

export async function requireRole(role: Role) {
  const user = await currentUser();
  if (!user) redirect("/auth");
  if (user.role !== role) redirect("/");
  return user;
}
