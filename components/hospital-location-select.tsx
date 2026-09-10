"use client";

import { useMemo, useState } from "react";
import { Select } from "@/components/ui";
import type { HospitalLocation } from "@/lib/hospital-directory";

export function HospitalLocationSelect({
  hospitals,
  name = "hospitalId",
  initialHospitalId = "",
  onHospitalChange,
  required = false,
  disabled = false
}: {
  hospitals: HospitalLocation[];
  name?: string;
  initialHospitalId?: string;
  onHospitalChange?: (hospitalId: string) => void;
  required?: boolean;
  disabled?: boolean;
}) {
  const initial = hospitals.find((hospital) => hospital.id === initialHospitalId);
  const [state, setState] = useState(initial?.state ?? "");
  const [district, setDistrict] = useState(initial?.district ?? "");
  const [hospitalId, setHospitalId] = useState(initialHospitalId);
  const states = useMemo(() => [...new Set(hospitals.map((hospital) => hospital.state))], [hospitals]);
  const districts = useMemo(
    () => [...new Set(hospitals.filter((hospital) => hospital.state === state).map((hospital) => hospital.district))],
    [hospitals, state]
  );
  const hospitalOptions = useMemo(
    () => hospitals.filter((hospital) => hospital.state === state && hospital.district === district),
    [hospitals, state, district]
  );

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Select label="State" value={state} disabled={disabled} onChange={(event) => {
        setState(event.target.value); setDistrict(""); setHospitalId(""); onHospitalChange?.("");
      }}>
        <option value="">Select state</option>
        {states.map((item) => <option key={item} value={item}>{item}</option>)}
      </Select>
      <Select label="District" value={district} disabled={disabled || !state} onChange={(event) => {
        setDistrict(event.target.value); setHospitalId(""); onHospitalChange?.("");
      }}>
        <option value="">Select district</option>
        {districts.map((item) => <option key={item} value={item}>{item}</option>)}
      </Select>
      <Select label="Government hospital" name={name} value={hospitalId} required={required} disabled={disabled || !district} onChange={(event) => {
        setHospitalId(event.target.value); onHospitalChange?.(event.target.value);
      }}>
        <option value="">{district && hospitalOptions.length === 0 ? "No government hospitals available" : "Select hospital"}</option>
        {hospitalOptions.map((hospital) => <option key={hospital.id} value={hospital.id}>{hospital.name}</option>)}
      </Select>
    </div>
  );
}

export function AssignedHospitalLocation({ hospital }: { hospital: Pick<HospitalLocation, "name" | "state" | "district"> }) {
  return <HospitalLocationSelect hospitals={[{ ...hospital, id: "assigned" }]} initialHospitalId="assigned" disabled />;
}
