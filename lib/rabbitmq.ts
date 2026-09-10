import amqp from "amqplib";
import type { Role } from "@/lib/domain";

export const OTP_QUEUE = "ideajam.otp.display";

export type OtpDisplayJob = {
  email: string;
  name: string;
  role: Role;
  code: string;
};

export async function enqueueOtpDisplay(job: OtpDisplayJob) {
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
    throw error;
  }
}
