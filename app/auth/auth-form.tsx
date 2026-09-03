"use client";

import { useActionState, useState } from "react";
import { KeyRound, Mail } from "lucide-react";
import { requestOtpAction, verifyOtpAction } from "@/app/actions";
import { Button, Input, Panel, Select } from "@/components/ui";
import { PREFERRED_HOSPITALS } from "@/lib/domain";

const initialState = { ok: false, message: "" };
type RequestState = typeof initialState & {
  email?: string;
  role?: string;
  hospitalId?: string;
};

export function AuthForm() {
  const [requestRole, setRequestRole] = useState("PATIENT");
  const [verifyRole, setVerifyRole] = useState("PATIENT");
  const [requestState, requestAction, requesting] = useActionState(
    requestOtpAction,
    initialState
  );
  const [verifyState, verifyAction, verifying] = useActionState(
    verifyOtpAction,
    initialState
  );

  const typedRequestState = requestState as RequestState;
  const email = typedRequestState.ok ? typedRequestState.email ?? "" : "";
  const role = typedRequestState.ok ? typedRequestState.role ?? "PATIENT" : "PATIENT";
  const hospitalId = typedRequestState.ok ? typedRequestState.hospitalId ?? "" : "";

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel>
        <div className="mb-5 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-md bg-clinic/10 text-clinic">
            <Mail size={20} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[rgb(var(--text))]">Signup or login</h2>
            <p className="text-sm text-[rgb(var(--text-muted))]">Choose your role and receive an OTP.</p>
          </div>
        </div>
        <form action={requestAction} className="grid gap-4">
          <Input label="Full name" name="name" placeholder="Your name" required />
          <Input label="Gmail address" name="email" type="email" placeholder="name@gmail.com" required />
          <Select label="Role" name="role" value={requestRole} onChange={(event) => setRequestRole(event.target.value)}>
            <option value="PATIENT">Patient</option>
            <option value="DOCTOR">Doctor</option>
            <option value="ADMIN">Hospital Administration</option>
            <option value="MEDICAL_SHOP">Medical Shop</option>
          </Select>
          {requestRole !== "PATIENT" ? (
            <Select label="Hospital" name="hospitalId" defaultValue="" required>
              <option value="" disabled>
                Select hospital
              </option>
              {PREFERRED_HOSPITALS.map((hospital) => (
                <option key={hospital} value={hospital}>
                  {hospital}
                </option>
              ))}
            </Select>
          ) : null}
          <Button disabled={requesting}>{requesting ? "Sending..." : "Send OTP"}</Button>
          {requestState.message ? (
            <p className="rounded-md bg-clinic/10 p-3 text-sm font-semibold text-clinic">
              {requestState.message}
            </p>
          ) : null}
        </form>
      </Panel>

      <Panel>
        <div className="mb-5 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-md bg-amber/10 text-amber">
            <KeyRound size={20} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[rgb(var(--text))]">Verify OTP</h2>
            <p className="text-sm text-[rgb(var(--text-muted))]">OTP expires in 10 minutes and works once.</p>
          </div>
        </div>
        <form action={verifyAction} className="grid gap-4">
          <Input label="Gmail address" name="email" type="email" defaultValue={email} required />
          <Select label="Role" name="role" value={verifyRole || role} onChange={(event) => setVerifyRole(event.target.value)}>
            <option value="PATIENT">Patient</option>
            <option value="DOCTOR">Doctor</option>
            <option value="ADMIN">Hospital Administration</option>
            <option value="MEDICAL_SHOP">Medical Shop</option>
          </Select>
          {(verifyRole || role) !== "PATIENT" ? (
            <Select label="Hospital" name="hospitalId" defaultValue={hospitalId}>
              <option value="" disabled>
                Select hospital
              </option>
              {PREFERRED_HOSPITALS.map((hospital) => (
                <option key={hospital} value={hospital}>
                  {hospital}
                </option>
              ))}
            </Select>
          ) : null}
          <Input label="OTP" name="code" inputMode="numeric" maxLength={6} placeholder="123456" required />
          <Button disabled={verifying}>{verifying ? "Verifying..." : "Verify and open dashboard"}</Button>
          {verifyState.message ? (
            <p className="rounded-md bg-coral/10 p-3 text-sm font-semibold text-coral">
              {verifyState.message}
            </p>
          ) : null}
        </form>
      </Panel>
    </div>
  );
}
