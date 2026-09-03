"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Droplets,
  FlaskConical,
  History,
  Pill,
  Search,
  Truck,
  Video,
  Warehouse,
  X
} from "lucide-react";
import {
  completeMedicalShopServiceAction,
  dispenseBloodRequestAction,
  dispenseMedicineAction,
  updateInventoryAction
} from "@/app/actions";
import { AshwinInfoContent, type AshwinInfoKey } from "@/components/ashwin-info-content";
import { Button, Input, Panel, SectionTitle, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";

type PageView = "home" | AshwinInfoKey;
type ShopCardKey =
  | "BLOOD_BANK"
  | "BLOOD_REPORT"
  | "MEDICINE_DISPENSE"
  | "MEDICINE_DELIVERY"
  | "TELEMEDICINE_DELIVERY";

type InventoryItem = {
  id: string;
  name: string;
  stock: number;
  unit: string;
  description: string;
};

type BloodBankItem = {
  bloodType: string;
  pouches: number;
};

type DispenseEntry = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
};

type AppointmentLookup = {
  id: string;
  serialNumber: number;
  patientName: string;
  dateLabel: string;
  timingLabel: string;
  status: string;
  prescriptionText: string;
  tests: string;
  advice: string;
  medicines: string[];
  dispenses: DispenseEntry[];
} | null;

type BloodRequestLookup = {
  id: string;
  serialNumber: number;
  patientName: string;
  createdAtLabel: string;
  bloodType: string;
  pouches: number;
  status: string;
  reason: string;
  preferredTime: string;
} | null;

type ServiceBookingLookup = {
  id: string;
  serialNumber: number;
  patientName: string;
  dateLabel: string;
  preferredTime: string;
  assignedTime: string;
  status: string;
  reason: string;
  manualMedicineText?: string;
  prescriptionImagePath?: string;
  location?: string;
  confirmedDoctor?: string;
  dispenses: DispenseEntry[];
} | null;

const shopCards = [
  {
    key: "BLOOD_BANK" as const,
    title: "Blood Bank",
    description: "Preview live blood storage and dispense approved blood by serial number.",
    icon: Droplets,
    color: "border-rose-200 bg-[linear-gradient(145deg,#fff2f2_0%,#ffdede_100%)] text-rose-800 shadow-[0_18px_40px_rgba(225,29,72,0.12)]"
  },
  {
    key: "BLOOD_REPORT" as const,
    title: "Blood Report",
    description: "Check who booked blood report service and preview the serial details.",
    icon: FlaskConical,
    color: "border-orange-200 bg-[linear-gradient(145deg,#fff7ed_0%,#ffe1c1_100%)] text-orange-800 shadow-[0_18px_40px_rgba(234,88,12,0.12)]"
  },
  {
    key: "MEDICINE_DISPENSE" as const,
    title: "Medicine Dispense",
    description: "Open consultation serials and dispense medicines from live stock.",
    icon: Pill,
    color: "border-emerald-200 bg-[linear-gradient(145deg,#f3fff7_0%,#dcfce7_100%)] text-emerald-800 shadow-[0_18px_40px_rgba(22,163,74,0.12)]"
  },
  {
    key: "MEDICINE_DELIVERY" as const,
    title: "Medicine Delivery",
    description: "Check medicine delivery serials and issue stock for home delivery.",
    icon: Truck,
    color: "border-slate-200 bg-[linear-gradient(145deg,#ffffff_0%,#eef2f7_100%)] text-slate-800 shadow-[0_18px_40px_rgba(51,65,85,0.10)]"
  },
  {
    key: "TELEMEDICINE_DELIVERY" as const,
    title: "Telemedicine Delivery",
    description: "Handle telemedicine follow-up serials and dispense medicines from stock.",
    icon: Video,
    color: "border-indigo-200 bg-[linear-gradient(145deg,#f4f3ff_0%,#dde4ff_100%)] text-indigo-800 shadow-[0_18px_40px_rgba(79,70,229,0.12)]"
  }
];

function findInventoryMatch(name: string, inventory: InventoryItem[]) {
  const normalized = name.toLowerCase();
  return inventory.find((item) => normalized.includes(item.name.toLowerCase()));
}

function StockPreview({ inventory }: { inventory: InventoryItem[] }) {
  return (
    <div className="grid gap-3 text-sm">
      {inventory.map((item) => (
        <div key={item.id} className="rounded-md border border-[rgb(var(--border))] bg-white p-3">
          <p className="font-bold text-[rgb(var(--text))]">{item.name}</p>
          {item.description ? <p className="text-[rgb(var(--text-muted))]">{item.description}</p> : null}
          <p className="text-[rgb(var(--text-muted))]">{item.stock} {item.unit}</p>
        </div>
      ))}
    </div>
  );
}

export function MedicalShopPortalClient({
  shopName,
  hospitalName,
  initialCard,
  inventory,
  bloodBank,
  appointment,
  bloodRequest,
  bloodReportBooking,
  medicineDeliveryBooking,
  telemedicineBooking
}: {
  shopName: string;
  hospitalName: string;
  initialCard: ShopCardKey | null;
  inventory: InventoryItem[];
  bloodBank: BloodBankItem[];
  appointment: AppointmentLookup;
  bloodRequest: BloodRequestLookup;
  bloodReportBooking: ServiceBookingLookup;
  medicineDeliveryBooking: ServiceBookingLookup;
  telemedicineBooking: ServiceBookingLookup;
}) {
  const [view, setView] = useState<PageView>("home");
  const [selectedCard, setSelectedCard] = useState<ShopCardKey | null>(initialCard);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-[rgb(var(--border))] bg-white p-5 shadow-panel sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-clinic">Medical shop portal</p>
            <h2 className="mt-2 text-3xl font-black text-[rgb(var(--text))]">Welcome, {shopName}</h2>
            <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">{hospitalName}</p>
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
                  if (key === "home") setSelectedCard(null);
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
        ) : (
          <div className="flex flex-wrap gap-3">
            <Link
              href="/medical-shop/daily-dispense-history"
              className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 text-sm font-semibold text-[rgb(var(--text))] transition hover:bg-[rgb(var(--surface-muted))]"
            >
              <History size={16} aria-hidden="true" />
              Daily dispense history
            </Link>
          </div>
        )}
      </div>

      {view === "home" ? (
        <>
          {!selectedCard ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {shopCards.map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.key}
                    type="button"
                    onClick={() => setSelectedCard(card.key)}
                    className={cn(
                      "group rounded-3xl border p-5 text-left transition hover:-translate-y-1 hover:brightness-[1.02]",
                      card.color
                    )}
                  >
                    <div className="grid gap-2">
                      <div className="grid size-11 place-items-center rounded-2xl border border-white/70 bg-white/90 shadow-sm">
                        <Icon size={20} aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-lg font-black">{card.title}</p>
                        <p className="mt-1 text-sm opacity-80">{card.description}</p>
                      </div>
                    </div>
                    <div className="mt-5 flex items-center justify-between text-sm font-semibold">
                      <span>Open serial preview</span>
                      <span className="text-xs uppercase tracking-wide opacity-75">Open box</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}

          {selectedCard ? (
            <Panel className="rounded-3xl">
              <div className="mb-5 flex items-center justify-between gap-3">
                <SectionTitle
                  title={shopCards.find((card) => card.key === selectedCard)?.title ?? "Medical shop"}
                  subtitle={shopCards.find((card) => card.key === selectedCard)?.description}
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

              {selectedCard === "BLOOD_BANK" ? (
                <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="grid gap-4">
                    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
                      <p className="text-sm font-semibold text-[rgb(var(--text))]">Blood storage preview</p>
                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {bloodBank.map((item) => (
                          <div key={item.bloodType} className="rounded-xl border border-[rgb(var(--border))] bg-white p-3">
                            <p className="font-bold text-[rgb(var(--text))]">{item.bloodType}</p>
                            <p className="text-[rgb(var(--text-muted))]">{item.pouches} pouch(es)</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <form action="/medical-shop" method="get" className="grid gap-4 md:grid-cols-[1fr_auto]">
                      <Input label="Blood request serial number" name="bloodSerial" type="number" min={1} required />
                      <Button className="gap-2 self-end">
                        <Search size={16} aria-hidden="true" />
                        Check blood request
                      </Button>
                    </form>
                  </div>

                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-white p-4">
                    {!bloodRequest ? (
                      <p className="text-sm text-[rgb(var(--text-muted))]">Enter a blood request serial number to preview the request here.</p>
                    ) : (
                      <div className="grid gap-3">
                        <p className="text-lg font-bold text-[rgb(var(--text))]">
                          Blood serial #{bloodRequest.serialNumber} · {bloodRequest.patientName}
                        </p>
                        <div className="grid gap-2 text-sm text-[rgb(var(--text-muted))]">
                          <p><strong className="text-[rgb(var(--text))]">Created:</strong> {bloodRequest.createdAtLabel}</p>
                          <p><strong className="text-[rgb(var(--text))]">Blood group:</strong> {bloodRequest.bloodType}</p>
                          <p><strong className="text-[rgb(var(--text))]">Pouches:</strong> {bloodRequest.pouches}</p>
                          <p><strong className="text-[rgb(var(--text))]">Preferred time:</strong> {bloodRequest.preferredTime || "Flexible"}</p>
                          <p><strong className="text-[rgb(var(--text))]">Status:</strong> {bloodRequest.status}</p>
                          <p><strong className="text-[rgb(var(--text))]">Reason:</strong> {bloodRequest.reason}</p>
                        </div>
                        {bloodRequest.status === "APPROVED" ? (
                          <form action={dispenseBloodRequestAction} className="grid gap-3 md:grid-cols-[1fr_auto]">
                            <input type="hidden" name="bloodRequestId" value={bloodRequest.id} />
                            <input type="hidden" name="bloodType" value={bloodRequest.bloodType} />
                            <input type="hidden" name="pouches" value={bloodRequest.pouches} />
                            <input type="hidden" name="bloodSerial" value={bloodRequest.serialNumber} />
                            <p className="text-sm text-[rgb(var(--text-muted))]">
                              In stock: {bloodBank.find((item) => item.bloodType === bloodRequest.bloodType)?.pouches ?? 0} pouch(es)
                            </p>
                            <Button className="self-end">Dispense blood</Button>
                          </form>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {selectedCard === "BLOOD_REPORT" ? (
                <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="grid gap-4">
                    <form action="/medical-shop" method="get" className="grid gap-4 md:grid-cols-[1fr_auto]">
                      <Input label="Blood report serial number" name="bloodReportSerial" type="number" min={1} required />
                      <Button className="gap-2 self-end">
                        <Search size={16} aria-hidden="true" />
                        Check blood report
                      </Button>
                    </form>
                    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 text-sm text-[rgb(var(--text-muted))]">
                      This box previews who booked the blood report and lets the medical shop mark it handled so it appears in daily history.
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-white p-4">
                    {!bloodReportBooking ? (
                      <p className="text-sm text-[rgb(var(--text-muted))]">Enter a blood report serial number to preview the booking here.</p>
                    ) : (
                      <div className="grid gap-3">
                        <p className="text-lg font-bold text-[rgb(var(--text))]">
                          Blood report serial #{bloodReportBooking.serialNumber} · {bloodReportBooking.patientName}
                        </p>
                        <div className="grid gap-2 text-sm text-[rgb(var(--text-muted))]">
                          <p><strong className="text-[rgb(var(--text))]">Date:</strong> {bloodReportBooking.dateLabel}</p>
                          <p><strong className="text-[rgb(var(--text))]">Preferred time:</strong> {bloodReportBooking.preferredTime || "Flexible"}</p>
                          <p><strong className="text-[rgb(var(--text))]">Assigned time:</strong> {bloodReportBooking.assignedTime}</p>
                          <p><strong className="text-[rgb(var(--text))]">Status:</strong> {bloodReportBooking.status}</p>
                          <p><strong className="text-[rgb(var(--text))]">Reason:</strong> {bloodReportBooking.reason || "Not added"}</p>
                        </div>
                        {bloodReportBooking.status !== "COMPLETED" ? (
                          <form action={completeMedicalShopServiceAction} className="grid gap-3">
                            <input type="hidden" name="id" value={bloodReportBooking.id} />
                            <input type="hidden" name="note" value="Blood report checked by medical shop" />
                            <Button>Mark blood report handled</Button>
                          </form>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {selectedCard === "MEDICINE_DISPENSE" ? (
                <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="grid gap-4">
                    <form action="/medical-shop" method="get" className="grid gap-4 md:grid-cols-[1fr_auto]">
                      <Input label="Consultation serial number" name="consultationSerial" type="number" min={1} required />
                      <Button className="gap-2 self-end">
                        <Search size={16} aria-hidden="true" />
                        Open consultation
                      </Button>
                    </form>
                    <Panel className="rounded-2xl border border-[rgb(var(--border))] bg-white">
                      <SectionTitle title="Live medicine stock" subtitle="Stock updates here also reflect in the administrator and medical shop portals." />
                      <form action={updateInventoryAction} className="grid gap-4">
                        <Input label="Medicine name" name="name" required />
                        <Textarea label="Description" name="description" placeholder="Dose or format details" />
                        <Input label="Stock" name="stock" type="number" min={0} required />
                        <Input label="Unit" name="unit" defaultValue="tablets" required />
                        <Button className="gap-2">
                          <Warehouse size={16} aria-hidden="true" />
                          Update stock
                        </Button>
                      </form>
                    </Panel>
                  </div>

                  <div className="grid gap-4">
                    {!appointment ? (
                      <p className="rounded-2xl border border-[rgb(var(--border))] bg-white p-4 text-sm text-[rgb(var(--text-muted))]">
                        Enter a consultation serial number to preview the prescription and dispense medicines.
                      </p>
                    ) : (
                      <div className="grid gap-4 rounded-2xl border border-[rgb(var(--border))] bg-white p-4">
                        <p className="text-lg font-bold text-[rgb(var(--text))]">
                          Consultation serial #{appointment.serialNumber} · {appointment.patientName}
                        </p>
                        <div className="grid gap-2 text-sm text-[rgb(var(--text-muted))]">
                          <p><strong className="text-[rgb(var(--text))]">Date:</strong> {appointment.dateLabel}</p>
                          <p><strong className="text-[rgb(var(--text))]">Time:</strong> {appointment.timingLabel}</p>
                          <p><strong className="text-[rgb(var(--text))]">Status:</strong> {appointment.status}</p>
                        </div>
                        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
                          <p className="font-semibold text-[rgb(var(--text))]">Prescription preview</p>
                          <p className="mt-2 whitespace-pre-line text-sm text-[rgb(var(--text-muted))]">
                            {appointment.prescriptionText || "No prescription has been saved for this consultation yet."}
                          </p>
                        </div>
                        <div className="grid gap-3">
                          {appointment.medicines.map((medicine) => {
                            const item = findInventoryMatch(medicine, inventory);
                            return (
                              <div key={medicine} className="rounded-xl border border-[rgb(var(--border))] p-4">
                                <p className="font-bold text-[rgb(var(--text))]">{medicine}</p>
                                {item ? (
                                  <form action={dispenseMedicineAction} className="mt-3 grid gap-3 md:grid-cols-[1fr_140px_auto]">
                                    <input type="hidden" name="appointmentId" value={appointment.id} />
                                    <input type="hidden" name="inventoryItemId" value={item.id} />
                                    <input type="hidden" name="dispenseCategory" value="CONSULTATION" />
                                    <p className="text-sm text-[rgb(var(--text-muted))]">
                                      In stock: {item.stock} {item.unit}{item.description ? ` · ${item.description}` : ""}
                                    </p>
                                    <Input label="Dispense qty" name="quantity" type="number" min={1} defaultValue={1} />
                                    <Button variant="secondary" className="self-end">Dispense</Button>
                                  </form>
                                ) : (
                                  <p className="mt-2 text-sm font-semibold text-coral">No matching stock item found.</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
                          <p className="font-semibold text-[rgb(var(--text))]">Dispense history</p>
                          <div className="mt-2 grid gap-2 text-sm text-[rgb(var(--text-muted))]">
                            {appointment.dispenses.length === 0 ? (
                              <p>No medicines dispensed yet for this serial.</p>
                            ) : (
                              appointment.dispenses.map((entry) => (
                                <p key={entry.id}>{entry.name} · {entry.quantity} {entry.unit}</p>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    <StockPreview inventory={inventory} />
                  </div>
                </div>
              ) : null}

              {selectedCard === "MEDICINE_DELIVERY" ? (
                <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="grid gap-4">
                    <form action="/medical-shop" method="get" className="grid gap-4 md:grid-cols-[1fr_auto]">
                      <Input label="Medicine delivery serial number" name="deliverySerial" type="number" min={1} required />
                      <Button className="gap-2 self-end">
                        <Search size={16} aria-hidden="true" />
                        Check delivery serial
                      </Button>
                    </form>
                    <StockPreview inventory={inventory} />
                  </div>
                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-white p-4">
                    {!medicineDeliveryBooking ? (
                      <p className="text-sm text-[rgb(var(--text-muted))]">Enter a medicine delivery serial number to preview it here.</p>
                    ) : (
                      <div className="grid gap-3">
                        <p className="text-lg font-bold text-[rgb(var(--text))]">
                          Delivery serial #{medicineDeliveryBooking.serialNumber} · {medicineDeliveryBooking.patientName}
                        </p>
                        <div className="grid gap-2 text-sm text-[rgb(var(--text-muted))]">
                          <p><strong className="text-[rgb(var(--text))]">Date:</strong> {medicineDeliveryBooking.dateLabel}</p>
                          <p><strong className="text-[rgb(var(--text))]">Preferred time:</strong> {medicineDeliveryBooking.preferredTime || "Flexible"}</p>
                          <p><strong className="text-[rgb(var(--text))]">Assigned time:</strong> {medicineDeliveryBooking.assignedTime}</p>
                          <p><strong className="text-[rgb(var(--text))]">Location:</strong> {medicineDeliveryBooking.location || "Not added"}</p>
                          <p><strong className="text-[rgb(var(--text))]">Requested medicine / note:</strong> {medicineDeliveryBooking.reason || "Not added"}</p>
                          {medicineDeliveryBooking.manualMedicineText ? (
                            <p><strong className="text-[rgb(var(--text))]">Manual medicine input:</strong> {medicineDeliveryBooking.manualMedicineText}</p>
                          ) : null}
                          <p><strong className="text-[rgb(var(--text))]">Status:</strong> {medicineDeliveryBooking.status}</p>
                        </div>
                        {medicineDeliveryBooking.prescriptionImagePath ? (
                          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
                            <p className="mb-3 font-semibold text-[rgb(var(--text))]">Uploaded JPG prescription</p>
                            <a href={medicineDeliveryBooking.prescriptionImagePath} target="_blank" rel="noreferrer" className="text-sm font-semibold text-clinic underline">
                              Open full prescription
                            </a>
                            <div className="mt-3 overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-white p-3">
                              <Image
                                src={medicineDeliveryBooking.prescriptionImagePath}
                                alt="Medicine delivery prescription"
                                width={900}
                                height={1200}
                                className="h-auto w-full rounded-lg object-contain"
                              />
                            </div>
                          </div>
                        ) : null}
                        <form action={dispenseMedicineAction} className="grid gap-3 md:grid-cols-[1fr_140px_auto]">
                          <input type="hidden" name="serviceBookingId" value={medicineDeliveryBooking.id} />
                          <input type="hidden" name="dispenseCategory" value="MEDICINE_DELIVERY" />
                          <label className="grid gap-1.5 text-sm font-medium text-[rgb(var(--text-muted))]">
                            Medicine from stock
                            <select name="inventoryItemId" className="focus-ring h-10 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-[rgb(var(--text))]">
                              {inventory.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.name} · {item.stock} {item.unit}
                                </option>
                              ))}
                            </select>
                          </label>
                          <Input label="Dispense qty" name="quantity" type="number" min={1} defaultValue={1} />
                          <Button className="self-end">Dispense and update stock</Button>
                        </form>
                        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
                          <p className="font-semibold text-[rgb(var(--text))]">Delivery dispense history</p>
                          <div className="mt-2 grid gap-2 text-sm text-[rgb(var(--text-muted))]">
                            {medicineDeliveryBooking.dispenses.length === 0 ? (
                              <p>No medicine dispensed yet for this delivery serial.</p>
                            ) : (
                              medicineDeliveryBooking.dispenses.map((entry) => (
                                <p key={entry.id}>{entry.name} · {entry.quantity} {entry.unit}</p>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {selectedCard === "TELEMEDICINE_DELIVERY" ? (
                <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="grid gap-4">
                    <form action="/medical-shop" method="get" className="grid gap-4 md:grid-cols-[1fr_auto]">
                      <Input label="Telemedicine serial number" name="telemedicineSerial" type="number" min={1} required />
                      <Button className="gap-2 self-end">
                        <Search size={16} aria-hidden="true" />
                        Check telemedicine serial
                      </Button>
                    </form>
                    <StockPreview inventory={inventory} />
                  </div>
                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-white p-4">
                    {!telemedicineBooking ? (
                      <p className="text-sm text-[rgb(var(--text-muted))]">Enter a telemedicine serial number to preview it here.</p>
                    ) : (
                      <div className="grid gap-3">
                        <p className="text-lg font-bold text-[rgb(var(--text))]">
                          Telemedicine serial #{telemedicineBooking.serialNumber} · {telemedicineBooking.patientName}
                        </p>
                        <div className="grid gap-2 text-sm text-[rgb(var(--text-muted))]">
                          <p><strong className="text-[rgb(var(--text))]">Date:</strong> {telemedicineBooking.dateLabel}</p>
                          <p><strong className="text-[rgb(var(--text))]">Preferred time:</strong> {telemedicineBooking.preferredTime || "Flexible"}</p>
                          <p><strong className="text-[rgb(var(--text))]">Assigned time:</strong> {telemedicineBooking.assignedTime}</p>
                          <p><strong className="text-[rgb(var(--text))]">Doctor:</strong> {telemedicineBooking.confirmedDoctor || "Pending"}</p>
                          <p><strong className="text-[rgb(var(--text))]">Requested medicine / note:</strong> {telemedicineBooking.reason || "Not added"}</p>
                          {telemedicineBooking.manualMedicineText ? (
                            <p><strong className="text-[rgb(var(--text))]">Manual medicine input:</strong> {telemedicineBooking.manualMedicineText}</p>
                          ) : null}
                          <p><strong className="text-[rgb(var(--text))]">Status:</strong> {telemedicineBooking.status}</p>
                        </div>
                        {telemedicineBooking.prescriptionImagePath ? (
                          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
                            <p className="mb-3 font-semibold text-[rgb(var(--text))]">Uploaded JPG prescription</p>
                            <a href={telemedicineBooking.prescriptionImagePath} target="_blank" rel="noreferrer" className="text-sm font-semibold text-clinic underline">
                              Open full prescription
                            </a>
                            <div className="mt-3 overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-white p-3">
                              <Image
                                src={telemedicineBooking.prescriptionImagePath}
                                alt="Telemedicine prescription"
                                width={900}
                                height={1200}
                                className="h-auto w-full rounded-lg object-contain"
                              />
                            </div>
                          </div>
                        ) : null}
                        <form action={dispenseMedicineAction} className="grid gap-3 md:grid-cols-[1fr_140px_auto]">
                          <input type="hidden" name="serviceBookingId" value={telemedicineBooking.id} />
                          <input type="hidden" name="dispenseCategory" value="TELEMEDICINE_DELIVERY" />
                          <label className="grid gap-1.5 text-sm font-medium text-[rgb(var(--text-muted))]">
                            Medicine from stock
                            <select name="inventoryItemId" className="focus-ring h-10 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-[rgb(var(--text))]">
                              {inventory.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.name} · {item.stock} {item.unit}
                                </option>
                              ))}
                            </select>
                          </label>
                          <Input label="Dispense qty" name="quantity" type="number" min={1} defaultValue={1} />
                          <Button className="self-end">Dispense and update stock</Button>
                        </form>
                        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
                          <p className="font-semibold text-[rgb(var(--text))]">Telemedicine dispense history</p>
                          <div className="mt-2 grid gap-2 text-sm text-[rgb(var(--text-muted))]">
                            {telemedicineBooking.dispenses.length === 0 ? (
                              <p>No medicine dispensed yet for this telemedicine serial.</p>
                            ) : (
                              telemedicineBooking.dispenses.map((entry) => (
                                <p key={entry.id}>{entry.name} · {entry.quantity} {entry.unit}</p>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </Panel>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
