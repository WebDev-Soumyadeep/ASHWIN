export const ROLES = ["PATIENT", "DOCTOR", "ADMIN", "MEDICAL_SHOP"] as const;
export type Role = (typeof ROLES)[number];

export const APPOINTMENT_STATUSES = [
  "BOOKED",
  "CHECKED_IN",
  "IN_CONSULTATION",
  "COMPLETED",
  "CANCELLED"
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const DIAGNOSTIC_TYPES = ["MRI", "XRAY", "BLOOD_REPORT"] as const;
export type DiagnosticType = (typeof DIAGNOSTIC_TYPES)[number];

export const TELEMEDICINE_STATUSES = [
  "REQUESTED",
  "OPTION_PENDING",
  "SCHEDULED",
  "COMPLETED",
  "CANCELLED",
  "DECLINED"
] as const;
export type TelemedicineStatus = (typeof TELEMEDICINE_STATUSES)[number];

export const APPOINTMENT_TYPES = [
  "CONSULTATION",
  "ELDER_AGE",
  "PREGNANT",
  "SERIOUS_ILLNESS"
] as const;
export type AppointmentType = (typeof APPOINTMENT_TYPES)[number];

export const CONSULTATION_TYPES = APPOINTMENT_TYPES;
export type ConsultationType = AppointmentType;

export const PREFERRED_HOSPITALS = [
  "Alipurduar District Hospital",
  "Falakata Super Specialty Hospital",
  "Bhatibari Rural Hospital",
  "Kalchini Rural Hospital",
  "Madarihat Rural Hospital",
  "Bankura Sammilani Medical College & Hospital",
  "Bishnupur District Hospital",
  "Khatra Sub-Divisional Hospital",
  "Sonamukhi Rural Hospital",
  "Indpur Rural Hospital",
  "Suri Sadar Hospital",
  "Rampurhat Medical College & Hospital",
  "Bolpur Sub-Divisional Hospital",
  "Nalhati Rural Hospital",
  "Dubrajpur Rural Hospital",
  "Maharaja Jitendra Narayan Medical College & Hospital",
  "Dinhata Sub-Divisional Hospital",
  "Tufanganj Sub-Divisional Hospital",
  "Mathabhanga Sub-Divisional Hospital",
  "Mekhliganj Sub-Divisional Hospital",
  "Balurghat District Hospital",
  "Balurghat Super Specialty Hospital",
  "Gangarampur Super Specialty Hospital",
  "Hili Rural Hospital",
  "Kumarganj Rural Hospital",
  "Raiganj Government Medical College & Hospital",
  "Islampur Sub-Divisional Hospital",
  "Kaliaganj Rural Hospital",
  "Goalpokhar Rural Hospital",
  "Chopra Rural Hospital",
  "Darjeeling District Hospital",
  "North Bengal Medical College & Hospital",
  "Kurseong Sub-Divisional Hospital",
  "Kalimpong District Hospital",
  "Mirik Rural Hospital",
  "Jalpaiguri Government Medical College & Hospital",
  "Jalpaiguri District Hospital",
  "Malbazar Sub-Divisional Hospital",
  "Dhupguri Rural Hospital",
  "Banarhat Rural Hospital",
  "Malda Medical College & Hospital",
  "Chanchal Sub-Divisional Hospital",
  "Harishchandrapur Rural Hospital",
  "Gazole Rural Hospital",
  "English Bazar Hospital",
  "Berhampore District Hospital",
  "Murshidabad Medical College & Hospital",
  "Jangipur Sub-Divisional Hospital",
  "Lalbagh Sub-Divisional Hospital",
  "Kandi Sub-Divisional Hospital",
  "Krishnanagar District Hospital",
  "Ranaghat Sub-Divisional Hospital",
  "Kalyani JNM Hospital",
  "Chakdaha Rural Hospital",
  "Bagula Rural Hospital",
  "Barasat Government Medical College & Hospital",
  "College of Medicine & Sagore Dutta Hospital",
  "Bongaon Sub-Divisional Hospital",
  "Barrackpore B.N. Bose Hospital",
  "Ashoknagar State General Hospital",
  "M.R. Bangur Hospital",
  "Diamond Harbour Government Medical College & Hospital",
  "Baruipur Sub-Divisional Hospital",
  "Kakdwip Sub-Divisional Hospital",
  "Canning Sub-Divisional Hospital",
  "Medical College & Hospital",
  "SSKM Hospital",
  "Nil Ratan Sircar Medical College & Hospital",
  "R.G. Kar Medical College & Hospital",
  "Calcutta National Medical College & Hospital",
  "Howrah District Hospital",
  "Uluberia Sub-Divisional Hospital",
  "Sarat Chandra Chattopadhyay Government Medical College & Hospital",
  "Bagnan Rural Hospital",
  "Amta Rural Hospital",
  "Imambara District Hospital",
  "Chandan Nagar Sub-Divisional Hospital",
  "Arambagh Medical College & Hospital",
  "Serampore Walsh Hospital",
  "Tarakeswar Rural Hospital",
  "Tamluk District Hospital",
  "Tamralipto Government Medical College & Hospital",
  "Haldia Sub-Divisional Hospital",
  "Contai Sub-Divisional Hospital",
  "Egra Sub-Divisional Hospital",
  "Midnapore Medical College & Hospital",
  "Kharagpur Sub-Divisional Hospital",
  "Ghatal Sub-Divisional Hospital",
  "Daspur Rural Hospital",
  "Keshpur Rural Hospital",
  "Jhargram Government Medical College & Hospital",
  "Jhargram District Hospital",
  "Belpahari Rural Hospital",
  "Gopiballavpur Rural Hospital",
  "Binpur Rural Hospital",
  "Deben Mahata Government Medical College & Hospital",
  "Purulia District Hospital",
  "Raghunathpur Sub-Divisional Hospital",
  "Jhalda Rural Hospital",
  "Balarampur Rural Hospital",
  "Durgapur Sub-Divisional Hospital",
  "Asansol District Hospital",
  "ESI Hospital Asansol",
  "Andal Rural Hospital",
  "Kulti Hospital",
  "Burdwan Medical College & Hospital",
  "Kalna Sub-Divisional Hospital",
  "Katwa Sub-Divisional Hospital",
  "Memari Rural Hospital",
  "Guskara Rural Hospital"
] as const;

export const BLOOD_TYPES = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-"
] as const;
export type BloodType = (typeof BLOOD_TYPES)[number];

export const BLOOD_REQUEST_STATUSES = ["PENDING", "APPROVED", "DECLINED"] as const;
export type BloodRequestStatus = (typeof BLOOD_REQUEST_STATUSES)[number];

export const SERVICE_SLOT_TYPES = [
  "CONSULTATION",
  "MRI",
  "XRAY",
  "BLOOD_REPORT",
  "ULTRASOUND_USG",
  "CT_SCAN",
  "ECG",
  "ECHO",
  "TMT",
  "ENDOSCOPY",
  "EEG",
  "EMG",
  "DIALYSIS",
  "TELEMEDICINE",
  "TELEMEDICINE_DELIVERY",
  "BLOOD_BANK",
  "AMBULANCE",
  "MEDICINE_DELIVERY"
] as const;

export type ServiceSlotType = (typeof SERVICE_SLOT_TYPES)[number];

export const SERVICE_SLOT_DEFAULTS: Record<
  ServiceSlotType,
  { label: string; description: string; slotCount: number; startTime: string; endTime: string; color: string }
> = {
  CONSULTATION: {
    label: "Consultation",
    description: "General OPD and doctor visit queue",
    slotCount: 180,
    startTime: "10:00",
    endTime: "17:00",
    color: "bg-clinic/10 text-clinic border-clinic/20"
  },
  MRI: {
    label: "MRI",
    description: "Magnetic resonance imaging slot",
    slotCount: 18,
    startTime: "09:00",
    endTime: "17:00",
    color: "bg-leaf/10 text-leaf border-leaf/20"
  },
  XRAY: {
    label: "X-ray",
    description: "Radiology screening queue",
    slotCount: 30,
    startTime: "09:00",
    endTime: "17:00",
    color: "bg-amber/10 text-amber border-amber/20"
  },
  BLOOD_REPORT: {
    label: "Blood Report",
    description: "Blood sample and report issue slot",
    slotCount: 45,
    startTime: "09:00",
    endTime: "17:00",
    color: "bg-coral/10 text-coral border-coral/20"
  },
  ULTRASOUND_USG: {
    label: "Ultrasound (USG)",
    description: "Ultrasound imaging queue",
    slotCount: 20,
    startTime: "09:00",
    endTime: "17:00",
    color: "bg-sky-100 text-sky-700 border-sky-200"
  },
  CT_SCAN: {
    label: "CT Scan",
    description: "CT scan screening slot",
    slotCount: 16,
    startTime: "09:00",
    endTime: "17:00",
    color: "bg-violet-100 text-violet-700 border-violet-200"
  },
  ECG: {
    label: "ECG",
    description: "Electrocardiogram booking",
    slotCount: 28,
    startTime: "09:30",
    endTime: "17:30",
    color: "bg-rose-100 text-rose-700 border-rose-200"
  },
  ECHO: {
    label: "ECHO",
    description: "Echo cardiography appointment",
    slotCount: 22,
    startTime: "09:30",
    endTime: "17:30",
    color: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200"
  },
  TMT: {
    label: "TMT",
    description: "Treadmill test booking",
    slotCount: 14,
    startTime: "10:00",
    endTime: "16:00",
    color: "bg-orange-100 text-orange-700 border-orange-200"
  },
  ENDOSCOPY: {
    label: "Endoscopy",
    description: "Endoscopy slot booking",
    slotCount: 12,
    startTime: "09:00",
    endTime: "15:00",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200"
  },
  EEG: {
    label: "EEG",
    description: "Electroencephalogram booking",
    slotCount: 16,
    startTime: "09:00",
    endTime: "16:00",
    color: "bg-cyan-100 text-cyan-700 border-cyan-200"
  },
  EMG: {
    label: "EMG",
    description: "Electromyography slot",
    slotCount: 16,
    startTime: "09:00",
    endTime: "16:00",
    color: "bg-lime-100 text-lime-700 border-lime-200"
  },
  DIALYSIS: {
    label: "Dialysis",
    description: "Dialysis treatment queue",
    slotCount: 10,
    startTime: "08:00",
    endTime: "18:00",
    color: "bg-teal-100 text-teal-700 border-teal-200"
  },
  TELEMEDICINE: {
    label: "Telemedicine",
    description: "Remote doctor consultation slot",
    slotCount: 25,
    startTime: "10:00",
    endTime: "20:00",
    color: "bg-indigo-100 text-indigo-700 border-indigo-200"
  },
  TELEMEDICINE_DELIVERY: {
    label: "Telemedicine Delivery",
    description: "Medicine delivery request after telemedicine support",
    slotCount: 24,
    startTime: "10:00",
    endTime: "21:00",
    color: "bg-blue-100 text-blue-700 border-blue-200"
  },
  BLOOD_BANK: {
    label: "Blood Bank",
    description: "Blood bank issue and support queue",
    slotCount: 18,
    startTime: "09:00",
    endTime: "17:00",
    color: "bg-red-100 text-red-700 border-red-200"
  },
  AMBULANCE: {
    label: "Ambulance Booking",
    description: "Ambulance dispatch booking slot",
    slotCount: 12,
    startTime: "00:00",
    endTime: "23:30",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200"
  },
  MEDICINE_DELIVERY: {
    label: "Medicine Delivery",
    description: "Home medicine delivery queue",
    slotCount: 24,
    startTime: "09:00",
    endTime: "21:00",
    color: "bg-stone-100 text-stone-700 border-stone-200"
  }
};

export function appointmentTypeLabel(type: string) {
  return (
    {
      CONSULTATION: "Consultation",
      ELDER_AGE: "Elder age (60 above)",
      PREGNANT: "Pregnant",
      SERIOUS_ILLNESS: "Serious illness",
      NORMAL: "Consultation",
      PRIORITY: "Priority"
    }[type] ?? type.replaceAll("_", " ")
  );
}

export function diagnosticTypeLabel(type: string) {
  return (
    {
      MRI: "MRI",
      XRAY: "X-ray",
      BLOOD_REPORT: "Blood report"
    }[type] ?? type.replaceAll("_", " ")
  );
}

export function telemedicineStatusLabel(status: string) {
  return (
    {
      REQUESTED: "Requested",
      OPTION_PENDING: "Patient choice pending",
      SCHEDULED: "Scheduled",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
      DECLINED: "Declined by patient"
    }[status] ?? status.replaceAll("_", " ")
  );
}

export function telemedicineDecisionLabel(decision: string) {
  return (
    {
      APPROVED: "Approved by doctor",
      DELAYED: "Delayed by doctor",
      REJECTED: "Rejected by doctor"
    }[decision] ?? decision.replaceAll("_", " ")
  );
}

export function serviceSlotLabel(type: string) {
  return SERVICE_SLOT_DEFAULTS[type as ServiceSlotType]?.label ?? type.replaceAll("_", " ");
}
