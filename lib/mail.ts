import { Resend } from "resend";
import type { Role } from "@/lib/domain";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(job: {
  email: string;
  name: string;
  role: Role;
  code: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is required.");
  }

  const { data, error } = await resend.emails.send({
    from: "MedSynapse <onboarding@resend.dev>",
    to: [job.email],
    subject: "Your MedSynapse OTP",
    html: `
      <div>
        <h2>MedSynapse</h2>
        <p>Hello ${job.name},</p>
        <p>Your ${job.role.toLowerCase()} login OTP is:</p>
        <h1>${job.code}</h1>
        <p>This OTP expires in 10 minutes.</p>
      </div>
    `
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error(error.message);
  }

  console.log("OTP email sent:", data?.id);
}
