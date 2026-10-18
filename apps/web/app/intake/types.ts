export type IntakeStatus =
  | "Expected"
  | "Arrived"
  | "Checked In"
  | "Awaiting Triage"
  | "In Assessment"
  | "Completed"
  | "Cancelled";

export interface StatusHistoryEntry {
  status: IntakeStatus;
  timestamp: string; // ISO string
  changedBy: string;
  note?: string;
}

export interface PatientIntakeRecord {
  id: string; // e.g. "PT-2026-0042"
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  arrivalTime: string; // ISO string
  checkInTime?: string | null; // ISO string when check-in completed
  status: IntakeStatus;
  department: string;
  chiefComplaint: string;
  symptoms: string;
  symptomOnset?: string;
  staffNotes?: string;
  needsStaffReview: boolean;
  assignedStaff?: string;
  history: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface IntakeSummaryStats {
  totalWaiting: number;
  arrivedNotCheckedIn: number;
  checkedInToday: number;
  avgWaitingMinutes: number;
  flaggedForReview: number;
}

export interface CreateIntakePayload {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  arrivalTime?: string;
  status?: IntakeStatus;
  checkInTime?: string | null;
  department: string;
  chiefComplaint: string;
  symptoms: string;
  symptomOnset?: string;
  staffNotes?: string;
  needsStaffReview?: boolean;
  assignedStaff?: string;
}

export interface UpdateIntakePayload {
  status?: IntakeStatus;
  checkInTime?: string | null;
  department?: string;
  chiefComplaint?: string;
  symptoms?: string;
  symptomOnset?: string;
  staffNotes?: string;
  needsStaffReview?: boolean;
  assignedStaff?: string;
  historyNote?: string;
  changedBy?: string;
}
