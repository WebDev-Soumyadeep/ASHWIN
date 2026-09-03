"use client";

import { Mail, ShieldAlert, Users } from "lucide-react";

export type AshwinInfoKey = "about" | "contact" | "troubleshoot";

export function AshwinInfoContent({ panel }: { panel: AshwinInfoKey }) {
  if (panel === "about") {
    return (
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-full bg-clinic/12 text-clinic">
            <Users size={26} aria-hidden="true" />
          </div>
          <div>
            <p className="text-2xl font-black text-[rgb(var(--text))]">Team Ashwin</p>
            <p className="text-sm text-[rgb(var(--text-muted))]">Managed by AIEM</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-[rgb(var(--text-muted))]">
          <span>Healthcare booking</span>
          <span>Diagnostics</span>
          <span>Telemedicine</span>
          <span>Blood bank</span>
        </div>
      </div>
    );
  }

  if (panel === "contact") {
    return (
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-full bg-clinic/12 text-clinic">
            <Mail size={24} aria-hidden="true" />
          </div>
          <div>
            <p className="text-2xl font-black text-[rgb(var(--text))]">Contact Us</p>
            <p className="text-sm text-[rgb(var(--text-muted))]">Reach Team Ashwin directly</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
          <div>
            <p className="font-semibold text-[rgb(var(--text))]">Soumyadeep Mandal</p>
            <a
              href="mailto:soumyadeepmandal670@gmail.com"
              className="text-clinic underline underline-offset-2"
            >
              soumyadeepmandal670@gmail.com
            </a>
          </div>
          <div>
            <p className="font-semibold text-[rgb(var(--text))]">Sayan Das</p>
            <a
              href="mailto:dassayan5411@gmail.com"
              className="text-clinic underline underline-offset-2"
            >
              dassayan5411@gmail.com
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <div className="grid size-14 shrink-0 place-items-center rounded-full bg-coral/12 text-coral">
          <ShieldAlert size={24} aria-hidden="true" />
        </div>
        <div>
          <p className="text-2xl font-black text-[rgb(var(--text))]">Troubleshoot</p>
          <p className="text-sm text-[rgb(var(--text-muted))]">
            Login, OTP, booking, or portal issue support
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-[rgb(var(--text-muted))]">
        <span>OTP access</span>
        <span>Portal login</span>
        <span>Appointments</span>
        <a
          href="mailto:soumyadeepmandal670@gmail.com,dassayan5411@gmail.com?subject=Ashwin%20Healthcare%20System%20Troubleshoot"
          className="text-clinic underline underline-offset-2"
        >
          Email support
        </a>
      </div>
    </div>
  );
}
