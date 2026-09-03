import amqp from "amqplib";
import { OTP_QUEUE, type OtpEmailJob } from "@/lib/rabbitmq";
import { sendOtpEmail } from "@/lib/mail";

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
      const job = JSON.parse(message.content.toString()) as OtpEmailJob;
      await sendOtpEmail(job);
      channel.ack(message);
      console.log(`Sent OTP email to ${job.email}`);
    } catch (error) {
      console.error("Failed to process OTP email", error);
      channel.nack(message, false, true);
    }
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
