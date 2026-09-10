import bcrypt from "bcryptjs";
import type { Role } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { enqueueOtpDisplay } from "@/lib/rabbitmq";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createAndSendOtp(input: {
  email: string;
  name: string;
  role: Role;
  hospitalId?: string;
}) {
  const email = normalizeEmail(input.email);
  const code = generateOtp();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.otpCode.create({
    data: {
      email,
      name: input.name.trim(),
      role: input.role,
      hospitalId: input.hospitalId,
      codeHash,
      expiresAt
    }
  });
await enqueueOtpDisplay({
  email,
  name: input.name.trim(),
  role: input.role,
  code
});

  return {
    email,
    expiresAt,
    code
  };
}

export async function verifyOtp(input: {
  email: string;
  role: Role;
  code: string;
  hospitalId?: string;
}) {
  const email = normalizeEmail(input.email);

  const otp = await prisma.otpCode.findFirst({
    where: {
      email,
      role: input.role,
      hospitalId: input.hospitalId ?? null,
      usedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: "desc" }
  });

  if (!otp) {
    return { ok: false as const, message: "OTP expired or not found." };
  }

  const matches = await bcrypt.compare(input.code.trim(), otp.codeHash);

  if (!matches) {
    return { ok: false as const, message: "Invalid OTP." };
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: otp.name,
      role: otp.role,
      hospitalId: otp.hospitalId ?? undefined
    },
    create: {
      email,
      name: otp.name,
      role: otp.role,
      hospitalId: otp.hospitalId ?? undefined,
      ...(otp.role === "DOCTOR"
        ? {
            doctor: {
              create: {
                department: "General Medicine",
                availability: "10:00 AM - 5:00 PM"
              }
            }
          }
        : {})
    }
  });

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: {
      usedAt: new Date(),
      userId: user.id
    }
  });

  return { ok: true as const, user };
}