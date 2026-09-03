"use client";

import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { bookAppointmentAction } from "@/app/actions";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { PREFERRED_HOSPITALS, appointmentTypeLabel } from "@/lib/domain";

export function AppointmentBookingForm({
  disabled
}: {
  disabled: boolean;
}) {
  const [type, setType] = useState("CONSULTATION");
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
      <Select label="Preferred hospital" name="preferredHospital" defaultValue="" required>
        <option value="" disabled>
          Select hospital
        </option>
        {PREFERRED_HOSPITALS.map((hospital) => (
          <option key={hospital} value={hospital}>
            {hospital}
          </option>
        ))}
      </Select>
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
