"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import {
  Activity,
  Ambulance,
  Brain,
  CalendarHeart,
  HeartPulse,
  History,
  PackageCheck,
  Pill,
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
  acceptTelemedicineOptionAction,
  createServiceBookingAction,
  declineTelemedicineOptionAction,
  requestTelemedicineAction,
  requestBloodAction
} from "@/app/actions";
import { AshwinInfoContent, type AshwinInfoKey } from "@/components/ashwin-info-content";
import { Button, Input, Panel, SectionTitle, Select, Textarea } from "@/components/ui";
import { APPOINTMENT_TYPES, appointmentTypeLabel, type ServiceSlotType } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { HospitalLocationSelect } from "@/components/hospital-location-select";

type PageView = "home" | AshwinInfoKey;

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

type HospitalItem = {
  id: string;
  name: string;
  state: string;
  district: string;
};

type BloodBankItem = {
  bloodType: string;
  pouches: number;
};

type TelemedicinePreview = {
  id: string;
  status: string;
  statusLabel: string;
  preferredDoctorName: string;
  confirmedDoctorName: string;
  alternativeDoctorName: string;
  preferredTime: string;
  scheduledTime: string;
  alternativeForPreferredTime: string;
} | null;

type BookingHistoryItem = {
  id: string;
  serviceType: ServiceSlotType;
  serviceLabel: string;
  serialNumber: number;
  reason: string;
  requestedTime: string;
  contactNumber: string;
  location: string;
  bloodType: string;
  quantity: number;
  feeAmount: number;
  manualMedicineText: string;
  prescriptionImagePath: string;
  estimatedStart: string;
  estimatedEnd: string;
  timingLabel: string;
  status: string;
  dateLabel: string;
  createdAtLabel: string;
  consultationType: string;
  preferredHospital: string;
  telemedicine: TelemedicinePreview;
};

type PaymentIntent = {
  title: string;
  helperText: string;
  label: string;
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

export function PatientPortalClient({
  patientName,
  services,
  hospitals,
  selectedHospitalId,
  doctors,
  bloodBank,
  bookings
}: {
  patientName: string;
  services: ServiceAvailabilityItem[];
  hospitals: HospitalItem[];
  selectedHospitalId: string;
  doctors: DoctorItem[];
  bloodBank: BloodBankItem[];
  bookings: BookingHistoryItem[];
}) {
  const [view, setView] = useState<PageView>("home");
  const [selectedService, setSelectedService] = useState<ServiceSlotType | "BOOKING_HISTORY" | null>(null);
  const [consultationType, setConsultationType] = useState<(typeof APPOINTMENT_TYPES)[number]>("CONSULTATION");
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const pendingFormRef = useRef<HTMLFormElement | null>(null);
  const bypassConfirmationRef = useRef(false);

  const latestBooking = bookings[0] ?? null;
  const selectedServiceData = useMemo(
    () =>
      selectedService && selectedService !== "BOOKING_HISTORY"
        ? services.find((item) => item.serviceType === selectedService) ?? null
        : null,
    [selectedService, services]
  );
  const telemedicineDeliveryData = useMemo(
    () => services.find((item) => item.serviceType === "TELEMEDICINE_DELIVERY") ?? null,
    [services]
  );
  const consultationNeedsAadhaar = consultationType !== "CONSULTATION";

  function openPaymentModal(
    event: React.FormEvent<HTMLFormElement>,
    title: string,
    helperText: string,
    label: string
  ) {
    if (bypassConfirmationRef.current) {
      bypassConfirmationRef.current = false;
      return;
    }

    event.preventDefault();
    pendingFormRef.current = event.currentTarget;
    setPaymentIntent({ title, helperText, label });
  }

  function confirmPayment() {
    if (!pendingFormRef.current) return;
    bypassConfirmationRef.current = true;
    const form = pendingFormRef.current;
    setPaymentIntent(null);
    pendingFormRef.current = null;
    form.requestSubmit();
  }

  function cancelPayment() {
    pendingFormRef.current = null;
    setPaymentIntent(null);
  }

  return (
    <>
      <div className="grid gap-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-[rgb(var(--border))] bg-white p-5 shadow-panel sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-clinic">Patient portal</p>
              <h2 className="mt-2 text-3xl font-black text-[rgb(var(--text))]">Welcome, {patientName}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[rgb(var(--text-muted))]">
                Book hospital services, choose your preferred timing, and track both your request and the hospital-assigned timing from one place.
              </p>
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
                      setSelectedService(null);
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

          {view === "home" ? (
            latestBooking ? (
              <div className="rounded-2xl border border-clinic/20 bg-clinic/5 p-4">
                <p className="text-sm font-semibold text-clinic">Latest serial preview</p>
                <div className="mt-2 grid gap-2 text-sm text-[rgb(var(--text-muted))] md:grid-cols-2">
                  <p><strong className="text-[rgb(var(--text))]">Service:</strong> {latestBooking.serviceLabel}</p>
                  <p><strong className="text-[rgb(var(--text))]">Serial:</strong> #{latestBooking.serialNumber}</p>
                  <p><strong className="text-[rgb(var(--text))]">Status:</strong> {latestBooking.status}</p>
                  <p><strong className="text-[rgb(var(--text))]">Date:</strong> {latestBooking.dateLabel}</p>
                  <p><strong className="text-[rgb(var(--text))]">Cause:</strong> {latestBooking.reason || "Not added"}</p>
                  <p><strong className="text-[rgb(var(--text))]">Patient preferred time:</strong> {latestBooking.requestedTime || "Flexible"}</p>
                  <p><strong className="text-[rgb(var(--text))]">Hospital assigned time:</strong> {latestBooking.timingLabel}</p>
                  <p><strong className="text-[rgb(var(--text))]">Booked on:</strong> {latestBooking.createdAtLabel}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 text-sm text-[rgb(var(--text-muted))]">
                Your newest serial preview will appear here right after a booking.
              </div>
            )
          ) : (
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5">
              <AshwinInfoContent panel={view} />
            </div>
          )}

          {view === "home" ? (
            <div className="grid gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 md:grid-cols-[1fr_auto] md:items-end">
              <HospitalLocationSelect
                hospitals={hospitals}
                initialHospitalId={selectedHospitalId}
                onHospitalChange={(nextHospitalId) => {
                  if (nextHospitalId) window.location.href = `/patient?hospital=${nextHospitalId}`;
                }}
              />
              <p className="text-sm text-[rgb(var(--text-muted))]">
                Slots below are live for the selected hospital only.
              </p>
            </div>
          ) : null}
        </div>

        {view === "home" ? (
          <>
            {!selectedService ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {services
                  .filter((service) => service.serviceType !== "TELEMEDICINE_DELIVERY")
                  .map((service) => {
                  const Icon = serviceIcons[service.serviceType];
                  return (
                    <button
                      key={service.serviceType}
                      type="button"
                      onClick={() => setSelectedService(service.serviceType)}
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
                        <span className="text-xs uppercase tracking-wide opacity-75">Tap to book</span>
                      </div>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setSelectedService("BOOKING_HISTORY")}
                  className="rounded-3xl border border-[rgb(var(--border))] bg-white p-5 text-left shadow-panel transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="grid gap-2">
                    <div className="grid size-11 place-items-center rounded-2xl bg-[rgb(var(--surface))] text-clinic">
                      <History size={20} aria-hidden="true" />
                    </div>
                    <p className="text-lg font-black text-[rgb(var(--text))]">Booking History</p>
                    <p className="text-sm text-[rgb(var(--text-muted))]">Track every serial booked from this patient account.</p>
                  </div>
                  <div className="mt-5 flex items-center justify-between text-sm font-semibold text-[rgb(var(--text-muted))]">
                    <span>{bookings.length} serials saved</span>
                    <span className="text-xs uppercase tracking-wide">Open history</span>
                  </div>
                </button>
              </div>
            ) : null}

            {selectedServiceData ? (
              <Panel className="rounded-3xl">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <SectionTitle
                    title={`Book ${selectedServiceData.label}`}
                    subtitle={`${selectedServiceData.remaining} slot(s) left today. Your preferred timing and the hospital-assigned timing will both appear in the serial preview.`}
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedService(null)}
                    className="focus-ring inline-flex size-10 items-center justify-center rounded-full border border-[rgb(var(--border))] bg-white text-[rgb(var(--text))]"
                    aria-label="Close booking form"
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>
                <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                  <div className={cn("rounded-3xl border p-5", selectedServiceData.color)}>
                    <p className="text-sm font-semibold uppercase tracking-wide">Booking preview</p>
                    <div className="mt-4 space-y-2 text-sm">
                      <p><strong>Patient:</strong> {patientName}</p>
                      <p><strong>Service:</strong> {selectedServiceData.label}</p>
                      <p><strong>Working hours:</strong> {selectedServiceData.startTime} - {selectedServiceData.endTime}</p>
                      {selectedServiceData.serviceType === "CONSULTATION" ? (
                        <p><strong>Hospital:</strong> {hospitals.find((hospital) => hospital.id === selectedHospitalId)?.name}</p>
                      ) : null}
                      {selectedServiceData.serviceType === "AMBULANCE" ? (
                        <p><strong>Assigned time note:</strong> Arrival will be a random hospital guess between 30 minutes and 2 hours after booking.</p>
                      ) : null}
                      {selectedServiceData.serviceType === "MEDICINE_DELIVERY" ? (
                        <p><strong>Assigned time note:</strong> Delivery will be assigned after 2 hours of booking. Delivery charge is Rs 60.</p>
                      ) : null}
                      {selectedServiceData.serviceType === "BLOOD_BANK" ? (
                        <p><strong>Approval flow:</strong> The blood request first goes to a doctor for approval.</p>
                      ) : null}
                      {selectedServiceData.serviceType === "TELEMEDICINE" ? (
                        <p><strong>Telemedicine support:</strong> Choose whether you want a doctor booking or medicine delivery.</p>
                      ) : (
                        <p><strong>Hospital assigned time:</strong> Shown after booking based on hospital handling.</p>
                      )}
                    </div>

                    {selectedServiceData.serviceType === "BLOOD_BANK" ? (
                      <div className="mt-5 rounded-2xl border border-white/60 bg-white/70 p-4">
                        <p className="text-sm font-semibold text-[rgb(var(--text))]">Blood bank storage preview</p>
                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                          {bloodBank.map((item) => (
                            <div key={item.bloodType} className="rounded-xl border border-[rgb(var(--border))] bg-white p-3">
                              <p className="font-bold text-[rgb(var(--text))]">{item.bloodType}</p>
                              <p className="text-[rgb(var(--text-muted))]">{item.pouches} pouch(es)</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {selectedServiceData.serviceType === "MEDICINE_DELIVERY" ? (
                      <div className="mt-5 rounded-2xl border border-white/60 bg-white/70 p-4">
                        <p className="text-sm font-semibold text-[rgb(var(--text))]">Delivery charge</p>
                        <p className="mt-2 text-2xl font-black text-[rgb(var(--text))]">Rs 60</p>
                        <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">Medicine delivery charge for each booking.</p>
                      </div>
                    ) : null}
                  </div>

                  {selectedServiceData.serviceType === "TELEMEDICINE" ? (
                    <div className="grid gap-4">
                      <div className="grid gap-4 xl:grid-cols-2">
                        <div className="rounded-3xl border border-[rgb(var(--border))] bg-white p-5">
                          <div className="mb-4">
                            <p className="text-lg font-black text-[rgb(var(--text))]">1. Telemedicine Booking</p>
                            <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
                              Book telemedicine support with your preferred doctor and preferred time. The doctor can accept directly, or administration can send fallback options if the request is rejected.
                            </p>
                            <p className="mt-2 text-sm font-semibold text-[rgb(var(--text))]">
                              Remaining today: {selectedServiceData.remaining}
                            </p>
                          </div>
                          <form
                            action={requestTelemedicineAction}
                            onSubmit={(event) =>
                              openPaymentModal(
                                event,
                                "Pay 20 rupees to book",
                                "Demo payment for telemedicine booking. Click OK after scanning.",
                                "telemedicine booking"
                              )
                            }
                            className="grid gap-4"
                          >
                            <input type="hidden" name="hospitalId" value={selectedHospitalId} />
                            <Select label="Preferred doctor" name="preferredDoctorId" defaultValue="">
                              <option value="">Any available doctor</option>
                              {doctors.map((doctor) => (
                                <option key={doctor.id} value={doctor.id}>
                                  {doctor.name} · {doctor.department}
                                </option>
                              ))}
                            </Select>
                            <Input label="Preferred timing" name="preferredTime" placeholder="Today, 6:30 PM" required />
                            <Textarea
                              label="Consultation note"
                              name="reason"
                              placeholder="Describe what telemedicine support you need."
                              required
                            />
                            <Button className="justify-center gap-2" disabled={selectedServiceData.remaining <= 0}>
                              <PackageCheck size={16} aria-hidden="true" />
                              Book Telemedicine Support
                            </Button>
                          </form>
                        </div>

                        <div className="rounded-3xl border border-[rgb(var(--border))] bg-white p-5">
                          <div className="mb-4">
                            <p className="text-lg font-black text-[rgb(var(--text))]">2. Telemedicine Delivery</p>
                            <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
                              Send medicine requirements directly to the medical shopkeeper with a preferred slot and message. You can type medicine names manually or upload a JPG prescription.
                            </p>
                            <p className="mt-2 text-sm font-semibold text-[rgb(var(--text))]">
                              Remaining today: {telemedicineDeliveryData?.remaining ?? 0}
                            </p>
                          </div>
                          <form
                            action={createServiceBookingAction}
                            onSubmit={(event) =>
                              openPaymentModal(
                                event,
                                "Pay 60 rupees for delivery",
                                "Demo payment for telemedicine delivery. Click OK after scanning.",
                                "telemedicine delivery"
                              )
                            }
                            className="grid gap-4"
                          >
                            <input type="hidden" name="hospitalId" value={selectedHospitalId} />
                            <input type="hidden" name="serviceType" value="TELEMEDICINE_DELIVERY" />
                            <Textarea
                              label="Required medicine name"
                              name="manualMedicineText"
                              placeholder="Write the medicine names needed for delivery."
                            />
                            <Input
                              label="Upload prescription (JPG only)"
                              name="prescriptionImage"
                              type="file"
                              accept=".jpg,.jpeg,image/jpeg"
                            />
                            <Input label="Preferred time slot" name="preferredTime" placeholder="Today, 8:00 PM" required />
                            <Textarea
                              label="Message for medical shopkeeper"
                              name="reason"
                              placeholder="Add delivery details, dosage note, landmark, or any instruction for the shopkeeper."
                              required
                            />
                            <Button className="justify-center gap-2" disabled={(telemedicineDeliveryData?.remaining ?? 0) <= 0}>
                              <PackageCheck size={16} aria-hidden="true" />
                              Book Telemedicine Delivery
                            </Button>
                          </form>
                        </div>
                      </div>
                    </div>
                  ) : selectedServiceData.serviceType === "BLOOD_BANK" ? (
                    <form
                      action={requestBloodAction}
                      onSubmit={(event) =>
                        openPaymentModal(
                          event,
                          "Pay 20 rupees to book",
                          "Demo payment for blood bank request. Click OK after scanning.",
                          "blood bank request"
                        )
                      }
                      className="grid gap-4"
                    >
                      <input type="hidden" name="hospitalId" value={selectedHospitalId} />
                      <Select label="Blood category needed" name="bloodType" defaultValue="" required>
                        <option value="" disabled>Choose blood group</option>
                        {bloodBank.map((item) => (
                          <option key={item.bloodType} value={item.bloodType}>
                            {item.bloodType} · {item.pouches} pouch(es) in storage
                          </option>
                        ))}
                      </Select>
                      <Input label="How much needed" name="pouches" type="number" min={1} placeholder="2" required />
                      <Input label="Preferred timing" name="preferredTime" placeholder="Today, 3:00 PM" required />
                      <Textarea
                        label="Cause / note"
                        name="reason"
                        placeholder="Why do you need this blood support?"
                        required
                      />
                      <Button className="justify-center gap-2" disabled={selectedServiceData.remaining <= 0}>
                        <PackageCheck size={16} aria-hidden="true" />
                        Request For Doctor Approval
                      </Button>
                    </form>
                  ) : (
                    <form
                      action={createServiceBookingAction}
                      onSubmit={(event) =>
                        openPaymentModal(event,
                          selectedServiceData.serviceType === "CONSULTATION"
                            ? "Pay 10 rupees to book"
                            : selectedServiceData.serviceType === "MEDICINE_DELIVERY"
                              ? "Pay 60 rupees for delivery"
                              : "Pay 20 rupees to book",
                          selectedServiceData.serviceType === "MEDICINE_DELIVERY"
                            ? "Demo payment for medicine delivery. Click OK after scanning."
                            : `Demo payment for ${selectedServiceData.label}. Click OK after scanning.`,
                          selectedServiceData.label
                        )
                      }
                      className="grid gap-4"
                    >
                      <input type="hidden" name="hospitalId" value={selectedHospitalId} />
                      <input type="hidden" name="serviceType" value={selectedServiceData.serviceType} />
                      {selectedServiceData.serviceType === "CONSULTATION" ? (
                        <>
                          <Select
                            label="Consultation type"
                            name="consultationType"
                            value={consultationType}
                            onChange={(event) => setConsultationType(event.target.value as (typeof APPOINTMENT_TYPES)[number])}
                          >
                            {APPOINTMENT_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {appointmentTypeLabel(type)}
                              </option>
                            ))}
                          </Select>
                          <input
                            type="hidden"
                            name="preferredHospital"
                            value={hospitals.find((hospital) => hospital.id === selectedHospitalId)?.name ?? ""}
                          />
                          {consultationNeedsAadhaar ? (
                            <Input
                              label="Aadhaar number"
                              name="aadhaar"
                              inputMode="numeric"
                              minLength={12}
                              maxLength={12}
                              pattern="[0-9]{12}"
                              placeholder="12 digit Aadhaar number"
                              required
                            />
                          ) : null}
                        </>
                      ) : null}
                      {selectedServiceData.serviceType === "AMBULANCE" ? (
                        <Input
                          label="Booker mobile number"
                          name="contactNumber"
                          inputMode="tel"
                          placeholder="9876543210"
                          required
                        />
                      ) : null}
                      {selectedServiceData.serviceType === "MEDICINE_DELIVERY" ? (
                        <>
                          <Input
                            label="Delivery location"
                            name="location"
                            placeholder="House no, area, landmark"
                            required
                          />
                          <Textarea
                            label="Required medicine name"
                            name="manualMedicineText"
                            placeholder="Write the medicines you need if you want the medical shop to prepare them manually."
                          />
                          <Input
                            label="Upload prescription (JPG only)"
                            name="prescriptionImage"
                            type="file"
                            accept=".jpg,.jpeg,image/jpeg"
                          />
                        </>
                      ) : null}
                      <Input label="Preferred timing" name="preferredTime" placeholder="Today, 4:30 PM" required />
                      <Textarea
                        label="Cause / note"
                        name="reason"
                        placeholder={`Why do you need ${selectedServiceData.label.toLowerCase()}?`}
                        required
                      />
                      <Button className="justify-center gap-2" disabled={selectedServiceData.remaining <= 0}>
                        <PackageCheck size={16} aria-hidden="true" />
                        Book {selectedServiceData.label}
                      </Button>
                    </form>
                  )}
                </div>
              </Panel>
            ) : null}

            {selectedService === "BOOKING_HISTORY" ? (
              <Panel className="rounded-3xl">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <SectionTitle title="Booking history" subtitle="Every service serial booked from this patient portal." />
                  <Button variant="secondary" onClick={() => setSelectedService(null)}>
                    Back to slots
                  </Button>
                </div>
                <div className="grid gap-3">
                  {bookings.length === 0 ? (
                    <p className="text-sm text-[rgb(var(--text-muted))]">No bookings yet.</p>
                  ) : (
                    bookings.map((booking) => (
                      <div key={booking.id} className="rounded-2xl border border-[rgb(var(--border))] bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-base font-bold text-[rgb(var(--text))]">
                            {booking.serviceLabel} · Serial #{booking.serialNumber}
                          </p>
                          <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-1 text-xs font-bold uppercase text-[rgb(var(--text-muted))]">
                            {booking.status}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm text-[rgb(var(--text-muted))] md:grid-cols-2">
                          <p><strong className="text-[rgb(var(--text))]">Cause:</strong> {booking.reason || "Not added"}</p>
                          <p><strong className="text-[rgb(var(--text))]">Date:</strong> {booking.dateLabel}</p>
                          <p><strong className="text-[rgb(var(--text))]">Patient preferred time:</strong> {booking.requestedTime || "Flexible"}</p>
                          <p><strong className="text-[rgb(var(--text))]">Hospital assigned time:</strong> {booking.timingLabel}</p>
                          <p><strong className="text-[rgb(var(--text))]">Booked on:</strong> {booking.createdAtLabel}</p>
                          <p><strong className="text-[rgb(var(--text))]">Name:</strong> {patientName}</p>
                          {booking.consultationType ? (
                            <p><strong className="text-[rgb(var(--text))]">Consultation type:</strong> {booking.consultationType}</p>
                          ) : null}
                          {booking.preferredHospital ? (
                            <p><strong className="text-[rgb(var(--text))]">Preferred hospital:</strong> {booking.preferredHospital}</p>
                          ) : null}
                          {booking.contactNumber ? (
                            <p><strong className="text-[rgb(var(--text))]">Booker mobile:</strong> {booking.contactNumber}</p>
                          ) : null}
                          {booking.location ? (
                            <p><strong className="text-[rgb(var(--text))]">Location:</strong> {booking.location}</p>
                          ) : null}
                          {booking.bloodType ? (
                            <p><strong className="text-[rgb(var(--text))]">Blood group:</strong> {booking.bloodType}</p>
                          ) : null}
                          {booking.quantity ? (
                            <p><strong className="text-[rgb(var(--text))]">Quantity:</strong> {booking.quantity}</p>
                          ) : null}
                          {booking.feeAmount > 0 ? (
                            <p><strong className="text-[rgb(var(--text))]">Booking fee:</strong> Rs {booking.feeAmount}</p>
                          ) : null}
                          {booking.manualMedicineText ? (
                            <p><strong className="text-[rgb(var(--text))]">Medicine request:</strong> {booking.manualMedicineText}</p>
                          ) : null}
                          {booking.prescriptionImagePath ? (
                            <p>
                              <strong className="text-[rgb(var(--text))]">Prescription file:</strong>{" "}
                              <a href={booking.prescriptionImagePath} target="_blank" rel="noreferrer" className="text-clinic underline">
                                Open JPG
                              </a>
                            </p>
                          ) : null}
                        </div>

                        {booking.serviceType === "TELEMEDICINE" && booking.telemedicine ? (
                          <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
                            <p className="text-sm font-semibold text-[rgb(var(--text))]">Telemedicine support</p>
                            <div className="mt-2 grid gap-2 text-sm text-[rgb(var(--text-muted))] md:grid-cols-2">
                              <p><strong className="text-[rgb(var(--text))]">Status:</strong> {booking.telemedicine.statusLabel}</p>
                              <p><strong className="text-[rgb(var(--text))]">Preferred doctor:</strong> {booking.telemedicine.preferredDoctorName || "Any available doctor"}</p>
                              <p><strong className="text-[rgb(var(--text))]">Preferred time:</strong> {booking.telemedicine.preferredTime || "Flexible"}</p>
                              <p><strong className="text-[rgb(var(--text))]">Confirmed doctor:</strong> {booking.telemedicine.confirmedDoctorName || "Pending"}</p>
                              <p><strong className="text-[rgb(var(--text))]">Confirmed time:</strong> {booking.telemedicine.scheduledTime || "Pending"}</p>
                              {booking.telemedicine.alternativeDoctorName ? (
                                <p><strong className="text-[rgb(var(--text))]">Different doctor same time:</strong> {booking.telemedicine.alternativeDoctorName}</p>
                              ) : null}
                              {booking.telemedicine.alternativeForPreferredTime ? (
                                <p><strong className="text-[rgb(var(--text))]">Same doctor different time:</strong> {booking.telemedicine.alternativeForPreferredTime}</p>
                              ) : null}
                            </div>

                            {booking.telemedicine.status === "OPTION_PENDING" ? (
                              <div className="mt-4 flex flex-wrap gap-2">
                                {booking.telemedicine.alternativeDoctorName ? (
                                  <form action={acceptTelemedicineOptionAction}>
                                    <input type="hidden" name="id" value={booking.telemedicine.id} />
                                    <input type="hidden" name="choice" value="ALTERNATIVE_DOCTOR" />
                                    <Button type="submit" variant="secondary">
                                      Accept different doctor same time
                                    </Button>
                                  </form>
                                ) : null}
                                {booking.telemedicine.alternativeForPreferredTime ? (
                                  <form action={acceptTelemedicineOptionAction}>
                                    <input type="hidden" name="id" value={booking.telemedicine.id} />
                                    <input type="hidden" name="choice" value="PREFERRED_DIFFERENT_TIME" />
                                    <Button type="submit" variant="secondary">
                                      Accept same doctor different time
                                    </Button>
                                  </form>
                                ) : null}
                                <form action={declineTelemedicineOptionAction}>
                                  <input type="hidden" name="id" value={booking.telemedicine.id} />
                                  <Button type="submit" variant="danger">
                                    Decline
                                  </Button>
                                </form>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </Panel>
            ) : null}
          </>
        ) : null}
      </div>

      {paymentIntent ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
          <div className="w-full max-w-md rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-2xl">
            <p className="text-lg font-black text-[rgb(var(--text))]">{paymentIntent.title}</p>
            <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">
              {paymentIntent.helperText}
            </p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3">
              <Image
                src="/payment-qr.jpeg"
                alt="Demo payment QR scanner"
                width={512}
                height={512}
                className="mx-auto w-full max-w-xs rounded-2xl object-contain"
              />
            </div>
            <div className="mt-5 flex gap-3">
              <Button type="button" className="flex-1" onClick={confirmPayment}>
                OK
              </Button>
              <Button type="button" variant="secondary" className="flex-1" onClick={cancelPayment}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
