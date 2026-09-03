"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Ambulance,
  Brain,
  CalendarHeart,
  HeartPulse,
  PackagePlus,
  Pill,
  Save,
  ScanHeart,
  ShieldPlus,
  Stethoscope,
  TestTubeDiagonal,
  Truck,
  UserRoundSearch,
  Waves,
  Webcam,
  X
} from "lucide-react";
import {
  allocateEmergencyAction,
  offerTelemedicineOptionsAction,
  scheduleTelemedicineAction,
  updateBloodBankAction,
  updateInventoryAction,
  updateSingleServiceSlotAction,
  upsertDoctorAction
} from "@/app/actions";
import { AshwinInfoContent, type AshwinInfoKey } from "@/components/ashwin-info-content";
import { Button, Input, Panel, SectionTitle, Textarea } from "@/components/ui";
import { type ServiceSlotType, telemedicineDecisionLabel, telemedicineStatusLabel } from "@/lib/domain";
import { cn } from "@/lib/utils";

type PageView = "home" | AshwinInfoKey;
type AdminCardKey = ServiceSlotType | "DOCTOR_DETAILS" | "EMERGENCY_RESERVE" | "MEDICINE_STOCK" | "TELEMEDICINE_COORDINATION";

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

type DoctorItem = {
  id: string;
  name: string;
  department: string;
  availability: string;
};

type BloodBankItem = {
  bloodType: string;
  pouches: number;
};

type InventoryItem = {
  id: string;
  name: string;
  description: string;
  stock: number;
  unit: string;
};

type TelemedicineItem = {
  id: string;
  patientName: string;
  reason: string;
  status: string;
  doctorDecision: string;
  preferredTime: string;
  scheduledTime: string;
  preferredDoctorName: string;
  doctorName: string;
  preferredDoctorId: string;
  doctorId: string;
  alternativeDoctorId: string;
  alternativeForPreferredTime: string;
  serialNumber: number;
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
  TELEMEDICINE_DELIVERY: Truck,
  BLOOD_BANK: TestTubeDiagonal,
  AMBULANCE: Ambulance,
  MEDICINE_DELIVERY: Truck
};

const adminCards = [
  {
    key: "DOCTOR_DETAILS" as const,
    title: "Doctor Details",
    description: "Add doctors and manage specialisation and availability.",
    icon: Stethoscope,
    color: "bg-sky-100 text-sky-800 border-sky-200"
  },
  {
    key: "EMERGENCY_RESERVE" as const,
    title: "Allocate Emergency Reserve",
    description: "Assign emergency reserve slots for urgent walk-in cases.",
    icon: Ambulance,
    color: "bg-rose-100 text-rose-800 border-rose-200"
  },
  {
    key: "MEDICINE_STOCK" as const,
    title: "Medicine Stock",
    description: "Update medicine inventory shared with the medical shop.",
    icon: PackagePlus,
    color: "bg-emerald-100 text-emerald-800 border-emerald-200"
  },
  {
    key: "TELEMEDICINE_COORDINATION" as const,
    title: "Telemedicine Coordination",
    description: "Assign doctors and confirm patient telemedicine schedules.",
    icon: Webcam,
    color: "bg-violet-100 text-violet-800 border-violet-200"
  }
];

export function AdminServicePanelClient({
  adminName,
  services,
  doctors,
  bloodBank,
  inventory,
  telemedicine
}: {
  adminName: string;
  services: ServiceAvailabilityItem[];
  doctors: DoctorItem[];
  bloodBank: BloodBankItem[];
  inventory: InventoryItem[];
  telemedicine: TelemedicineItem[];
}) {
  const [view, setView] = useState<PageView>("home");
  const [selectedCard, setSelectedCard] = useState<AdminCardKey | null>(null);

  const selectedServiceData = useMemo(
    () =>
      selectedCard && !adminCards.some((item) => item.key === selectedCard)
        ? services.find((item) => item.serviceType === selectedCard) ?? null
        : null,
    [selectedCard, services]
  );

  const selectedAdminCard = useMemo(
    () => adminCards.find((item) => item.key === selectedCard) ?? null,
    [selectedCard]
  );

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-[rgb(var(--border))] bg-white p-5 shadow-panel sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-clinic">Hospital administration</p>
            <h2 className="mt-2 text-3xl font-black text-[rgb(var(--text))]">
              Welcome, {adminName}
            </h2>
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
                      <span>{service.startTime} - {service.endTime}</span>
                      <span className="text-xs uppercase tracking-wide opacity-75">
                        Open editor
                      </span>
                    </div>
                  </button>
                );
              })}

              {adminCards.map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.key}
                    type="button"
                    onClick={() => setSelectedCard(card.key)}
                    className={cn(
                      "group rounded-3xl border p-5 text-left shadow-panel transition hover:-translate-y-0.5 hover:shadow-lg",
                      card.color
                    )}
                  >
                    <div className="grid gap-2">
                      <div className="grid size-11 place-items-center rounded-2xl bg-white/80">
                        <Icon size={20} aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-lg font-black">{card.title}</p>
                        <p className="mt-1 text-sm opacity-80">{card.description}</p>
                      </div>
                    </div>
                    <div className="mt-5 flex items-center justify-between text-sm font-semibold">
                      <span>Preloaded admin tool</span>
                      <span className="text-xs uppercase tracking-wide opacity-75">
                        Open editor
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}

          {selectedServiceData ? (
            <Panel className="rounded-3xl">
              <div className="mb-5 flex items-center justify-between gap-3">
                <SectionTitle
                  title={`${selectedServiceData.label} setup`}
                  subtitle="Update slot capacity and working time for this service."
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

              <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                <div className={cn("rounded-3xl border p-5", selectedServiceData.color)}>
                  <p className="text-sm font-semibold uppercase tracking-wide">Current overview</p>
                  <div className="mt-4 space-y-2 text-sm">
                    <p><strong>Service:</strong> {selectedServiceData.label}</p>
                    <p><strong>Booked today:</strong> {selectedServiceData.used}</p>
                    <p><strong>Slots left:</strong> {selectedServiceData.remaining}</p>
                    <p><strong>Live timing:</strong> {selectedServiceData.startTime} - {selectedServiceData.endTime}</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <form action={updateSingleServiceSlotAction} className="grid gap-4">
                    <input type="hidden" name="serviceType" value={selectedServiceData.serviceType} />
                    <Input
                      label="Slot capacity"
                      name="slotCount"
                      type="number"
                      min={0}
                      defaultValue={selectedServiceData.slotCount}
                      required
                    />
                    <Input
                      label="Start time"
                      name="startTime"
                      type="time"
                      defaultValue={selectedServiceData.startTime}
                      required
                    />
                    <Input
                      label="End time"
                      name="endTime"
                      type="time"
                      defaultValue={selectedServiceData.endTime}
                      required
                    />
                    <Button className="gap-2">
                      <Save size={16} aria-hidden="true" />
                      Save {selectedServiceData.label}
                    </Button>
                  </form>

                  {selectedServiceData.serviceType === "BLOOD_BANK" ? (
                    <Panel className="rounded-3xl border border-[rgb(var(--border))] bg-white">
                      <SectionTitle
                        title="Daily Blood Bank"
                        subtitle="Enter real-time pouch count for the hospital blood bank."
                      />
                      <form action={updateBloodBankAction} className="grid gap-3">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {bloodBank.map((item) => (
                            <Input
                              key={item.bloodType}
                              label={item.bloodType}
                              name={`blood_${item.bloodType}`}
                              type="number"
                              min={0}
                              defaultValue={item.pouches}
                            />
                          ))}
                        </div>
                        <Button variant="secondary">Save blood bank</Button>
                      </form>
                    </Panel>
                  ) : null}

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setSelectedCard(null)}
                  >
                    Home
                  </Button>
                </div>
              </div>
            </Panel>
          ) : null}

          {selectedAdminCard?.key === "DOCTOR_DETAILS" ? (
            <Panel className="rounded-3xl">
              <div className="mb-5 flex items-center justify-between gap-3">
                <SectionTitle
                  title="Doctor Details"
                  subtitle="Add doctors and their specialisation so patients can choose a preferred telemedicine doctor."
                />
                <Button type="button" variant="secondary" onClick={() => setSelectedCard(null)}>Home</Button>
              </div>
              <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <form action={upsertDoctorAction} className="grid gap-4">
                  <Input label="Doctor name" name="name" required />
                  <Input label="Doctor email" name="email" type="email" required />
                  <Input label="Specialisation" name="department" placeholder="Cardiology, Neurology, General Medicine" required />
                  <Input label="Availability" name="availability" placeholder="Mon-Sat, 10:00 AM - 5:00 PM" required />
                  <Button className="gap-2">
                    <Save size={16} aria-hidden="true" />
                    Save doctor
                  </Button>
                </form>
                <div className="grid gap-3 text-sm">
                  {doctors.map((doctor) => (
                    <div key={doctor.id} className="rounded-md border border-[rgb(var(--border))] p-3">
                      <p className="font-bold text-[rgb(var(--text))]">{doctor.name}</p>
                      <p className="text-[rgb(var(--text-muted))]">{doctor.department}</p>
                      <p className="text-[rgb(var(--text-muted))]">{doctor.availability}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          ) : null}

          {selectedAdminCard?.key === "EMERGENCY_RESERVE" ? (
            <Panel className="rounded-3xl">
              <div className="mb-5 flex items-center justify-between gap-3">
                <SectionTitle
                  title="Allocate Emergency Reserve"
                  subtitle="Only hospital staff can assign these slots after seeing the patient."
                />
                <Button type="button" variant="secondary" onClick={() => setSelectedCard(null)}>Home</Button>
              </div>
              <form action={allocateEmergencyAction} className="grid gap-4 lg:max-w-2xl">
                <Input label="Patient name" name="patientName" required />
                <Input label="Patient email" name="email" type="email" required />
                <Input label="Government ID" name="govtId" required />
                <Textarea label="Emergency condition" name="reason" required />
                <Button variant="danger" className="gap-2">
                  <Ambulance size={16} aria-hidden="true" />
                  Allocate emergency slot
                </Button>
              </form>
            </Panel>
          ) : null}

          {selectedAdminCard?.key === "MEDICINE_STOCK" ? (
            <Panel className="rounded-3xl">
              <div className="mb-5 flex items-center justify-between gap-3">
                <SectionTitle
                  title="Medicine Stock"
                  subtitle="Administration monitors and updates the medicine counter shared with the medical shop."
                />
                <Button type="button" variant="secondary" onClick={() => setSelectedCard(null)}>Home</Button>
              </div>
              <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <form action={updateInventoryAction} className="grid gap-4">
                  <Input label="Medicine name" name="name" required />
                  <Textarea label="Description" name="description" placeholder="Dose, format, or batch notes" />
                  <Input label="Stock" name="stock" type="number" min={0} required />
                  <Input label="Unit" name="unit" defaultValue="tablets" required />
                  <Button className="gap-2">
                    <PackagePlus size={16} aria-hidden="true" />
                    Save medicine stock
                  </Button>
                </form>
                <div className="grid gap-3 text-sm">
                  {inventory.map((item) => (
                    <div key={item.id} className="rounded-md border border-[rgb(var(--border))] p-3">
                      <p className="font-bold text-[rgb(var(--text))]">{item.name}</p>
                      {item.description ? <p className="text-[rgb(var(--text-muted))]">{item.description}</p> : null}
                      <p className="text-[rgb(var(--text-muted))]">{item.stock} {item.unit}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          ) : null}

          {selectedAdminCard?.key === "TELEMEDICINE_COORDINATION" ? (
            <Panel className="rounded-3xl">
              <div className="mb-5 flex items-center justify-between gap-3">
                <SectionTitle
                  title="Telemedicine Coordination"
                  subtitle="Assign an available doctor directly or offer two patient choices when the preferred doctor cannot do the requested time."
                />
                <Button type="button" variant="secondary" onClick={() => setSelectedCard(null)}>Home</Button>
              </div>
              <div className="grid gap-3">
                {telemedicine.length === 0 ? <p className="text-sm text-[rgb(var(--text-muted))]">No telemedicine requests yet.</p> : null}
                {telemedicine.map((item) => (
                  <div key={item.id} className="rounded-md border border-[rgb(var(--border))] p-4">
                    <div className="grid gap-2 text-sm text-[rgb(var(--text-muted))]">
                      <p className="font-bold text-[rgb(var(--text))]">{item.patientName}</p>
                      {item.serialNumber ? <p><strong>Serial:</strong> #{item.serialNumber}</p> : null}
                      <p><strong>Reason:</strong> {item.reason}</p>
                      <p><strong>Status:</strong> {telemedicineStatusLabel(item.status)}</p>
                      {item.doctorDecision ? <p><strong>Doctor update:</strong> {telemedicineDecisionLabel(item.doctorDecision)}</p> : null}
                      <p><strong>Preferred time:</strong> {item.preferredTime || "Flexible"}</p>
                      <p><strong>Preferred doctor:</strong> {item.preferredDoctorName || "Any available doctor"}</p>
                      {item.doctorName ? <p><strong>Confirmed doctor:</strong> {item.doctorName}</p> : null}
                      {item.scheduledTime ? <p><strong>Confirmed time:</strong> {item.scheduledTime}</p> : null}
                    </div>
                    <form action={scheduleTelemedicineAction} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                      <input type="hidden" name="id" value={item.id} />
                      <select name="doctorId" defaultValue={item.doctorId || item.preferredDoctorId || ""} className="focus-ring h-10 rounded-md border border-[rgb(var(--border))] px-3 text-sm">
                        <option value="">Choose doctor</option>
                        {doctors.map((doctor) => (
                          <option key={doctor.id} value={doctor.id}>
                            {doctor.name} · {doctor.department}
                          </option>
                        ))}
                      </select>
                      <Input label="Confirmed time" name="scheduledTime" defaultValue={item.scheduledTime || item.preferredTime || ""} required />
                      <Button variant="secondary">Confirm</Button>
                    </form>
                    <form action={offerTelemedicineOptionsAction} className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                      <input type="hidden" name="id" value={item.id} />
                      <select name="alternativeDoctorId" defaultValue={item.alternativeDoctorId || ""} className="focus-ring h-10 rounded-md border border-[rgb(var(--border))] px-3 text-sm">
                        <option value="">Alternative doctor at same time</option>
                        {doctors
                          .filter((doctor) => doctor.id !== item.preferredDoctorId)
                          .map((doctor) => (
                            <option key={doctor.id} value={doctor.id}>
                              {doctor.name} · {doctor.department}
                            </option>
                          ))}
                      </select>
                      <Input label="Preferred doctor different time" name="alternativeForPreferredTime" defaultValue={item.alternativeForPreferredTime || ""} placeholder="Tomorrow, 11:30 AM" />
                      <Button>Send options</Button>
                    </form>
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
