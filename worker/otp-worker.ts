import amqp from "amqplib";
import { OTP_QUEUE, type OtpDisplayJob } from "@/lib/rabbitmq";

async function main() {
  const url = process.env.RABBITMQ_URL ?? "amqp://localhost";
  const connection = await amqp.connect(url);
  const channel = await connection.createChannel();

  await channel.assertQueue(OTP_QUEUE, { durable: true });
  channel.prefetch(1);

  console.log(`OTP worker listening on ${OTP_QUEUE}`);

  channel.consume(OTP_QUEUE, async (message) => {
    if (!message) return;

    try {
      const job = JSON.parse(message.content.toString()) as OtpDisplayJob;
      channel.ack(message);
      console.log(`[OTP_LOCAL_DELIVERY] ${job.email} (${job.role}): ${job.code}`);
    } catch (error) {
      console.error("Failed to process OTP display job", error);
      channel.nack(message, false, true);
    }
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
