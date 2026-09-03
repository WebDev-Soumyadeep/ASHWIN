import Link from "next/link";
import { Activity, CalendarClock, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { PageShell, Panel } from "@/components/ui";
import { currentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await currentUser();
  const href =
    user?.role === "PATIENT"
      ? "/patient"
      : user?.role === "DOCTOR"
        ? "/doctor"
        : user?.role === "ADMIN"
          ? "/admin"
          : user?.role === "MEDICAL_SHOP"
            ? "/medical-shop"
          : "/auth";

  return (
    <PageShell className="bg-[linear-gradient(135deg,rgba(var(--bg),1)_0%,rgba(var(--bg-accent),0.85)_48%,rgba(var(--surface),0.92)_100%)]">
      <section className="grid min-h-[calc(100vh-3rem)] items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="max-w-4xl rounded-3xl border border-[rgb(var(--border))] bg-white p-8 shadow-panel sm:p-10">
          <BrandMark linked={false} size="hero" />
          <h1 className="mt-5 max-w-3xl text-5xl font-black leading-tight text-[rgb(var(--text))] sm:text-6xl">
            Healthcare queues that patients and hospitals can trust.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[rgb(var(--text-muted))]">
            Daily slot setup, public bookings, hospital-only emergency allocation,
            diagnostics, inventory, telemedicine requests, and OTP login in one
            responsive demo.
          </p>
          <Link
            href={href}
            className="focus-ring mt-8 inline-flex h-12 items-center rounded-md bg-clinic px-6 text-base font-bold text-white hover:bg-clinic/90"
          >
            {user ? "Open dashboard" : "Start with OTP login"}
          </Link>
        </div>
        <Panel className="grid gap-4 border-0 bg-white p-6">
          {[
            {
              icon: CalendarClock,
              title: "Public booking pool",
              body: "Patients book only the slots released by administration for that day."
            },
            {
              icon: ShieldCheck,
              title: "Hospital emergency reserve",
              body: "Emergency slots stay protected for hospital staff to allot after in-person assessment."
            },
            {
              icon: Activity,
              title: "Live resource visibility",
              body: "Doctors, patients, and admins see the same live appointment, diagnostic, and inventory state."
            }
          ].map((item) => (
            <div
              key={item.title}
              className="flex gap-4 rounded-lg border border-[rgb(var(--border))] bg-white p-4"
            >
              <div className="grid size-11 shrink-0 place-items-center rounded-md bg-clinic/10 text-clinic">
                <item.icon size={22} aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-bold text-[rgb(var(--text))]">{item.title}</h2>
                <p className="mt-1 text-sm leading-6 text-[rgb(var(--text-muted))]">{item.body}</p>
              </div>
            </div>
          ))}
        </Panel>
      </section>
    </PageShell>
  );
}
