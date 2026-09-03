import nodemailer from "nodemailer";
import type { OtpEmailJob } from "@/lib/rabbitmq";

export async function sendOtpEmail(job: OtpEmailJob) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    if (process.env.OTP_DEV_FALLBACK === "true") {
      console.log("[OTP_EMAIL_MOCK]", job);
      return;
    }
    throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD are required.");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass }
  });

  await transporter.sendMail({
    from: `"Ashwin HealthCare System" <${user}>`,
    to: job.email,
    subject: "Your Ashwin HealthCare System OTP",
    text: `Hello ${job.name}, your ${job.role.toLowerCase()} login OTP is ${job.code}. It expires in 10 minutes.`,
    html: `<p>Hello ${job.name},</p><p>Your <strong>${job.role.toLowerCase()}</strong> login OTP is <strong>${job.code}</strong>.</p><p>It expires in 10 minutes.</p>`
  });
}
