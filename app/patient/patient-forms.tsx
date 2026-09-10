"use client";

import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { bookAppointmentAction } from "@/app/actions";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { HospitalLocationSelect } from "@/components/hospital-location-select";
import { appointmentTypeLabel } from "@/lib/domain";
import type { HospitalLocation } from "@/lib/hospital-directory";

export function AppointmentBookingForm({
  disabled,
  hospitals
}: {
  disabled: boolean;
  hospitals: HospitalLocation[];
}) {
  const [type, setType] = useState("CONSULTATION");
  const [hospitalId, setHospitalId] = useState("");
  const needsAadhaar = type !== "CONSULTATION";

  return (
    <form action={bookAppointmentAction} className="grid gap-4">
      <Select
        label="Booking type"
        name="appointmentType"
        value={type}
        onChange={(event) => setType(event.target.value)}
      >
        <option value="CONSULTATION">{appointmentTypeLabel("CONSULTATION")}</option>
        <option value="ELDER_AGE">{appointmentTypeLabel("ELDER_AGE")}</option>
        <option value="PREGNANT">{appointmentTypeLabel("PREGNANT")}</option>
        <option value="SERIOUS_ILLNESS">{appointmentTypeLabel("SERIOUS_ILLNESS")}</option>
      </Select>
      <HospitalLocationSelect hospitals={hospitals} required onHospitalChange={setHospitalId} />
      <input type="hidden" name="preferredHospital" value={hospitals.find((hospital) => hospital.id === hospitalId)?.name ?? ""} />
      {needsAadhaar ? (
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
      <Textarea
        label="Cause for visit"
        name="reason"
        placeholder="Describe symptoms or consultation need"
      />
      <Button className="gap-2" disabled={disabled}>
        <CalendarPlus size={16} aria-hidden="true" />
        Book appointment
      </Button>
    </form>
  );
}
