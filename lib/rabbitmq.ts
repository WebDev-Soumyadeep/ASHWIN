import amqp from "amqplib";
import type { Role } from "@/lib/domain";

export const OTP_QUEUE = "ideajam.otp.email";

export type OtpEmailJob = {
  email: string;
  name: string;
  role: Role;
  code: string;
};

export async function enqueueOtpEmail(job: OtpEmailJob) {
  const url = process.env.RABBITMQ_URL ?? "amqp://localhost";

  try {
    const connection = await amqp.connect(url);
    const channel = await connection.createChannel();
    await channel.assertQueue(OTP_QUEUE, { durable: true });
    channel.sendToQueue(OTP_QUEUE, Buffer.from(JSON.stringify(job)), {
      persistent: true,
      contentType: "application/json"
    });
    await channel.close();
    await connection.close();
  } catch (error) {
    if (process.env.OTP_DEV_FALLBACK === "true") {
      console.log("[OTP_DEV_FALLBACK]", {
        email: job.email,
        role: job.role,
        code: job.code,
        reason: error instanceof Error ? error.message : "RabbitMQ unavailable"
      });
      return;
    }

    throw error;
  }
}
