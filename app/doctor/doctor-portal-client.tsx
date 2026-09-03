"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Brain,
  CalendarHeart,
  HeartPulse,
  Pill,
  ScanHeart,
  ShieldPlus,
  Stethoscope,
  TestTubeDiagonal,
  UserRoundSearch,
  Video,
  Waves,
  Webcam,
  X
} from "lucide-react";
import {
  reviewTelemedicineAction,
  updateAppointmentStatusAction,
  updateBloodRequestStatusAction,
  updateServiceBookingStatusAction
} from "@/app/actions";
import { PrescriptionForm } from "@/app/doctor/prescription-form";
import { AshwinInfoContent, type AshwinInfoKey } from "@/components/ashwin-info-content";
import { Button, Input, Panel, SectionTitle } from "@/components/ui";
import {
  APPOINTMENT_STATUSES,
  appointmentTypeLabel,
  serviceSlotLabel,
  telemedicineDecisionLabel,
  type ServiceSlotType
} from "@/lib/domain";
import { cn } from "@/lib/utils";

type PageView = "home" | AshwinInfoKey;
type DoctorCardKey = ServiceSlotType | "TELEMEDICINE" | "BLOOD_REQUESTS";

type ServiceAvailabilityItem = {
  serviceType: ServiceSlotType;
  label: string;
  description: string;
  color: string;
  slotCount: number;
  used: number;
  remaining: number;
  startTime: string;
  endTime: string;
};

type AppointmentItem = {
  id: string;
  serialNumber: number;
  patientName: string;
  source: string;
  priority: string;
  reason: string;
  status: string;
  estimatedStart: string;
  estimatedEnd: string;
  prescription: {
    medicines: string;
    tests: string;
    advice: string;
  } | null;
};

type ServiceBookingItem = {
  id: string;
  serviceType: ServiceSlotType;
  serialNumber: number;
  patientName: string;
  reason: string;
  status: string;
  dateLabel: string;
  requestedTime: string;
  estimatedStart: string;
  estimatedEnd: string;
  timingLabel: string;
};

type BloodBankItem = {
  bloodType: string;
  pouches: number;
};

type TelemedicineItem = {
  id: string;
  patientName: string;
  reason: string;
  preferredTime: string;
  scheduledTime: string;
  status: string;
  doctorDecision: string;
  preferredDoctorName: string;
  confirmedDoctorName: string;
  serialNumber: number;
};

type BloodRequestItem = {
  id: string;
  patientName: string;
  serialNumber: number;
  bloodType: string;
  pouches: number;
  reason: string;
  preferredTime: string;
  status: string;
  createdAtLabel: string;
};

const serviceIcons: Record<ServiceSlotType, React.ComponentType<{ size?: number; className?: string }>> = {
  CONSULTATION: Stethoscope,
  MRI: ScanHeart,
  XRAY: Activity,
  BLOOD_REPORT: TestTubeDiagonal,
  ULTRASOUND_USG: Waves,
  CT_SCAN: UserRoundSearch,
  ECG: HeartPulse,
  ECHO: CalendarHeart,
  TMT: Activity,
  ENDOSCOPY: ShieldPlus,
  EEG: Brain,
  EMG: Brain,
  DIALYSIS: Pill,
  TELEMEDICINE: Webcam,
  TELEMEDICINE_DELIVERY: Pill,
  BLOOD_BANK: TestTubeDiagonal,
  AMBULANCE: Activity,
  MEDICINE_DELIVERY: Pill
};

function appointmentStatusMarker(status: string) {
  return {
    BOOKED: "bg-slate-100 text-slate-700 border-slate-300",
    CHECKED_IN: "bg-slate-200 text-slate-700 border-slate-400",
    IN_CONSULTATION: "bg-amber/15 text-amber border-amber/40",
    COMPLETED: "bg-leaf/15 text-leaf border-leaf/40",
    CANCELLED: "bg-coral/15 text-coral border-coral/40"
  }[status] ?? "bg-slate-100 text-slate-700 border-slate-300";
}

export function DoctorPortalClient({
  doctorName,
  roleLabel,
  services,
  bloodBank,
  appointments,
  serviceBookings,
  telemedicine,
  bloodRequests
}: {
  doctorName: string;
  roleLabel: string;
  services: ServiceAvailabilityItem[];
  bloodBank: BloodBankItem[];
  appointments: AppointmentItem[];
  serviceBookings: ServiceBookingItem[];
  telemedicine: TelemedicineItem[];
  bloodRequests: BloodRequestItem[];
}) {
  const [view, setView] = useState<PageView>("home");
  const [selectedCard, setSelectedCard] = useState<DoctorCardKey | null>(null);

  const selectedServiceData = useMemo(
    () =>
      selectedCard && selectedCard !== "TELEMEDICINE" && selectedCard !== "BLOOD_REQUESTS"
        ? services.find((item) => item.serviceType === selectedCard) ?? null
        : null,
    [selectedCard, services]
  );

  const selectedServiceBookings = useMemo(
    () =>
      selectedServiceData
        ? serviceBookings.filter((item) => item.serviceType === selectedServiceData.serviceType)
        : [],
    [selectedServiceData, serviceBookings]
  );

  const consultationAppointments = appointments;

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-[rgb(var(--border))] bg-white p-5 shadow-panel sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-clinic">Doctor portal</p>
            <h2 className="mt-2 text-3xl font-black text-[rgb(var(--text))]">
              Welcome, {doctorName}
            </h2>
            <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">{roleLabel}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {([
              ["home", "Home"],
              ["about", "About Us"],
              ["contact", "Contact Us"],
              ["troubleshoot", "Troubleshoot"]
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setView(key);
                  if (key === "home") {
                    setSelectedCard(null);
                  }
                }}
                className={cn(
                  "focus-ring inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold transition",
                  view === key
                    ? "bg-clinic text-white"
                    : "border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-muted))]"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {view !== "home" ? (
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5">
            <AshwinInfoContent panel={view} />
          </div>
        ) : null}
      </div>

      {view === "home" ? (
        <>
          {!selectedCard ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {services.map((service) => {
                const Icon = serviceIcons[service.serviceType];
                return (
                  <button
                    key={service.serviceType}
                    type="button"
                    onClick={() => setSelectedCard(service.serviceType)}
                    className={cn(
                      "group rounded-3xl border p-5 text-left shadow-panel transition hover:-translate-y-0.5 hover:shadow-lg",
                      service.color
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="grid gap-2">
                        <div className="grid size-11 place-items-center rounded-2xl bg-white/80">
                          <Icon size={20} aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-lg font-black">{service.label}</p>
                          <p className="mt-1 text-sm opacity-80">{service.description}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold">
                        {service.remaining} left
                      </span>
                    </div>
                    <div className="mt-5 flex items-center justify-between text-sm font-semibold">
                      <span>{service.used} booked</span>
                      <span className="text-xs uppercase tracking-wide opacity-75">Open preview</span>
                    </div>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setSelectedCard("TELEMEDICINE")}
                className="rounded-3xl border border-[rgb(var(--border))] bg-white p-5 text-left shadow-panel transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="grid gap-2">
                  <div className="grid size-11 place-items-center rounded-2xl bg-[rgb(var(--surface))] text-clinic">
                    <Video size={20} aria-hidden="true" />
                  </div>
                  <p className="text-lg font-black text-[rgb(var(--text))]">Telemedicine</p>
                  <p className="text-sm text-[rgb(var(--text-muted))]">Assign flexible consultation timings.</p>
                </div>
                <div className="mt-5 flex items-center justify-between text-sm font-semibold text-[rgb(var(--text-muted))]">
                  <span>{telemedicine.length} requests</span>
                  <span className="text-xs uppercase tracking-wide">Open preview</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCard("BLOOD_REQUESTS")}
                className="rounded-3xl border border-[rgb(var(--border))] bg-white p-5 text-left shadow-panel transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="grid gap-2">
                  <div className="grid size-11 place-items-center rounded-2xl bg-[rgb(var(--surface))] text-coral">
                    <TestTubeDiagonal size={20} aria-hidden="true" />
                  </div>
                  <p className="text-lg font-black text-[rgb(var(--text))]">Blood Request Approval</p>
                  <p className="text-sm text-[rgb(var(--text-muted))]">Approve or reject patient blood requests.</p>
                </div>
                <div className="mt-5 flex items-center justify-between text-sm font-semibold text-[rgb(var(--text-muted))]">
                  <span>{bloodRequests.filter((item) => item.status === "PENDING").length} pending</span>
                  <span className="text-xs uppercase tracking-wide">Open preview</span>
                </div>
              </button>
            </div>
          ) : null}

          {selectedServiceData ? (
            <Panel className="rounded-3xl">
              <div className="mb-5 flex items-center justify-between gap-3">
                <SectionTitle
                  title={`${selectedServiceData.label} preview`}
                  subtitle={`${selectedServiceData.remaining} slot(s) left today.`}
                />
                <button
                  type="button"
                  onClick={() => setSelectedCard(null)}
                  className="focus-ring inline-flex size-10 items-center justify-center rounded-full border border-[rgb(var(--border))] bg-white text-[rgb(var(--text))]"
                  aria-label="Back to home"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              {selectedServiceData.serviceType === "CONSULTATION" ? (
                <div className="grid gap-3">
                  {consultationAppointments.length === 0 ? <p className="text-sm text-slate-600">No appointments yet.</p> : null}
                  {consultationAppointments.map((item) => (
                    <details key={item.id} className="overflow-hidden rounded-md border border-slate-200 bg-white">
                      <summary className="cursor-pointer list-none">
                        <div className="grid gap-3 p-4 md:grid-cols-[1fr_auto]">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-lg font-bold">#{item.serialNumber} · {item.patientName}</p>
                              <span className={cn("rounded-full border px-3 py-1 text-xs font-bold uppercase", appointmentStatusMarker(item.status))}>
                                {item.status.replaceAll("_", " ")}
                              </span>
                              <span className="rounded-full bg-clinic/10 px-2.5 py-1 text-xs font-bold text-clinic">
                                {item.source.replaceAll("_", " ")}
                              </span>
                              <span className="rounded-full bg-amber/10 px-2.5 py-1 text-xs font-bold text-amber">
                                {appointmentTypeLabel(item.priority)}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-600">
                              {item.estimatedStart} - {item.estimatedEnd} · {item.reason || "No reason added"}
                            </p>
                          </div>
                          <span className="self-start rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                            Show patient details
                          </span>
                        </div>
                      </summary>
                      <div className="border-t border-slate-200 bg-white p-4">
                        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                          <div className="space-y-1 text-sm text-slate-700">
                            <p><strong>Patient:</strong> {item.patientName}</p>
                            <p><strong>Visit window:</strong> {item.estimatedStart} - {item.estimatedEnd}</p>
                            <p><strong>Reason:</strong> {item.reason || "No reason added"}</p>
                            <p><strong>Status:</strong> {item.status.replaceAll("_", " ")}</p>
                            <p><strong>Slots left:</strong> {selectedServiceData.remaining}</p>
                          </div>
                          <form action={updateAppointmentStatusAction} className="flex items-end gap-2">
                            <input type="hidden" name="id" value={item.id} />
                            <select name="status" defaultValue={item.status} className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-sm">
                              {APPOINTMENT_STATUSES.map((status) => (
                                <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
                              ))}
                            </select>
                            <Button variant="secondary">Update</Button>
                          </form>
                        </div>
                        <PrescriptionForm
                          appointmentId={item.id}
                          defaultMedicines={item.prescription?.medicines ?? ""}
                          defaultTests={item.prescription?.tests ?? ""}
                          defaultAdvice={item.prescription?.advice ?? ""}
                        />
                      </div>
                    </details>
                  ))}
                </div>
              ) : (
                <div className="grid gap-3">
                  {selectedServiceBookings.length === 0 ? <p className="text-sm text-slate-600">No service bookings yet.</p> : null}
                  {selectedServiceData.serviceType === "BLOOD_BANK" ? (
                    <div className="grid gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 md:grid-cols-4">
                      {bloodBank.map((item) => (
                        <div key={item.bloodType} className="rounded-xl border border-[rgb(var(--border))] bg-white p-3">
                          <p className="font-bold text-[rgb(var(--text))]">{item.bloodType}</p>
                          <p className="text-sm text-[rgb(var(--text-muted))]">{item.pouches} pouch(es)</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {selectedServiceBookings.map((item) => (
                    <div key={item.id} className="grid gap-4 rounded-2xl border border-[rgb(var(--border))] bg-white p-4 lg:grid-cols-[1fr_auto]">
                      <div className="space-y-1 text-sm text-[rgb(var(--text-muted))]">
                        <p className="text-base font-bold text-[rgb(var(--text))]">
                          {serviceSlotLabel(item.serviceType)} · Serial #{item.serialNumber}
                        </p>
                        <p><strong>Patient:</strong> {item.patientName}</p>
                        <p><strong>Cause:</strong> {item.reason || "Not added"}</p>
                        <p><strong>Date:</strong> {item.dateLabel}</p>
                        <p><strong>Requested time:</strong> {item.requestedTime || "Flexible"}</p>
                        <p><strong>Approx timing:</strong> {item.timingLabel}</p>
                        <p><strong>Slots left:</strong> {selectedServiceData.remaining}</p>
                      </div>
                      <form action={updateServiceBookingStatusAction} className="flex items-end gap-2">
                        <input type="hidden" name="id" value={item.id} />
                        <select name="status" defaultValue={item.status} className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-sm">
                          {APPOINTMENT_STATUSES.map((status) => (
                            <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
                          ))}
                        </select>
                        <Button variant="secondary">Update</Button>
                      </form>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          ) : null}

          {selectedCard === "TELEMEDICINE" ? (
            <Panel className="rounded-3xl">
              <div className="mb-5 flex items-center justify-between gap-3">
                <SectionTitle title="Telemedicine" subtitle="Approve, reject, or delay each telemedicine request before administration sends any fallback options." />
                <Button type="button" variant="secondary" onClick={() => setSelectedCard(null)}>Home</Button>
              </div>
              <div className="grid gap-3">
                {telemedicine.length === 0 ? <p className="text-sm text-slate-600">No requests yet.</p> : null}
                {telemedicine.map((item) => (
                  <div key={item.id} className="grid gap-3 rounded-md border border-slate-200 p-4">
                    <div className="flex items-start gap-3">
                      <div className="grid size-9 place-items-center rounded-md bg-clinic/10 text-clinic">
                        <Video size={17} aria-hidden="true" />
                      </div>
                      <div>
                        <p className="font-bold">{item.patientName}</p>
                        {item.serialNumber ? <p className="text-sm text-slate-600">Serial #{item.serialNumber}</p> : null}
                        <p className="text-sm text-slate-600">{item.reason}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Preferred: {item.preferredTime || "Flexible"} · {item.status}
                        </p>
                        {item.doctorDecision ? (
                          <p className="text-xs font-semibold text-slate-500">
                            Doctor decision: {telemedicineDecisionLabel(item.doctorDecision)}
                          </p>
                        ) : null}
                        {item.preferredDoctorName ? (
                          <p className="text-xs text-slate-500">Preferred doctor: {item.preferredDoctorName}</p>
                        ) : null}
                        {item.confirmedDoctorName ? (
                          <p className="text-xs text-slate-500">Confirmed doctor: {item.confirmedDoctorName}</p>
                        ) : null}
                      </div>
                    </div>
                    <form action={reviewTelemedicineAction} className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto] md:items-end">
                      <input type="hidden" name="id" value={item.id} />
                      <Input label="Scheduled time" name="scheduledTime" defaultValue={item.scheduledTime ?? item.preferredTime ?? ""} placeholder="Today, 6:30 PM" />
                      <Button name="decision" value="APPROVE" className="gap-2 bg-leaf text-white hover:bg-leaf/90 active:bg-leaf/80">
                        <Stethoscope size={16} aria-hidden="true" />
                        Approve
                      </Button>
                      <Button name="decision" value="REJECT" variant="danger">
                        Reject
                      </Button>
                      <Button name="decision" value="DELAY" className="bg-amber text-slate-950 hover:bg-amber/90 active:bg-amber/80">
                        Delay
                      </Button>
                    </form>
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}

          {selectedCard === "BLOOD_REQUESTS" ? (
            <Panel className="rounded-3xl">
              <div className="mb-5 flex items-center justify-between gap-3">
                <SectionTitle title="Blood Approval Requests" subtitle="Patients can request blood, but approval or decline is handled from the doctor portal." />
                <Button type="button" variant="secondary" onClick={() => setSelectedCard(null)}>Home</Button>
              </div>
              <div className="grid gap-3">
                <div className="grid gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 md:grid-cols-4">
                  {bloodBank.map((item) => (
                    <div key={item.bloodType} className="rounded-xl border border-[rgb(var(--border))] bg-white p-3">
                      <p className="font-bold text-[rgb(var(--text))]">{item.bloodType}</p>
                      <p className="text-sm text-[rgb(var(--text-muted))]">{item.pouches} pouch(es)</p>
                    </div>
                  ))}
                </div>
                {bloodRequests.length === 0 ? <p className="text-sm text-slate-600">No blood requests yet.</p> : null}
                {bloodRequests.map((item) => (
                  <div key={item.id} className="grid gap-3 rounded-md border border-slate-200 p-4 md:grid-cols-[1fr_auto_auto]">
                    <div>
                      <p className="font-bold">{item.patientName} · Blood serial #{item.serialNumber}</p>
                      <p className="text-sm text-slate-600">{item.bloodType} · {item.pouches} pouch(es)</p>
                      <p className="text-sm text-slate-600">Preferred time: {item.preferredTime || "Flexible"}</p>
                      <p className="text-sm text-slate-600">{item.createdAtLabel}</p>
                      <p className="text-sm text-slate-600">{item.reason}</p>
                      <p className="mt-1 text-xs font-semibold uppercase text-slate-500">Current: {item.status}</p>
                    </div>
                    {item.status === "PENDING" ? (
                      <>
                        <form action={updateBloodRequestStatusAction}>
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="status" value="APPROVED" />
                          <Button type="submit" className="bg-leaf text-white hover:bg-leaf/90 active:bg-leaf/80">
                            Approve
                          </Button>
                        </form>
                        <form action={updateBloodRequestStatusAction}>
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="status" value="DECLINED" />
                          <Button type="submit" variant="danger">
                            Reject
                          </Button>
                        </form>
                      </>
                    ) : (
                      <div className="md:col-span-2 flex items-center justify-end">
                        <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-bold uppercase text-slate-600">
                          {item.status}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
