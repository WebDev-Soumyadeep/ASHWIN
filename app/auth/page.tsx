import { AuthForm } from "@/app/auth/auth-form";
import { AshwinInfoPanel } from "@/components/ashwin-info-panel";
import { BrandMark } from "@/components/brand-mark";
import { PageShell } from "@/components/ui";
import { getActiveHospitalLocations } from "@/lib/hospital-directory";

export default async function AuthPage() {
  const hospitals = await getActiveHospitalLocations();
  return (
    <PageShell>
      <div className="mb-8">
        <BrandMark />
        <h1 className="mt-4 text-4xl font-black text-[rgb(var(--text))]">Local OTP access</h1>
        <p className="mt-2 max-w-2xl text-[rgb(var(--text-muted))]">
          Signup and login use a RabbitMQ-backed local OTP flow for patients, doctors,
          hospital administration, and the medical shop.
        </p>
      </div>
      <AuthForm hospitals={hospitals} />
      <AshwinInfoPanel />
    </PageShell>
  );
}
