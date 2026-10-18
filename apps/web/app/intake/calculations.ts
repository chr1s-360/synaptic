import { PatientIntakeRecord, IntakeSummaryStats } from "./types";

/**
 * Waiting time calculation logic:
 * - "Arrived": elapsed duration since arrival
 * - "Checked In", "Awaiting Triage": elapsed duration since checkInTime (or arrivalTime if checkInTime is missing)
 * - "In Assessment", "Completed", "Cancelled": elapsed timer stopped (either difference between checkIn and completion or frozen)
 */
export function calculateElapsedMinutes(
  record: PatientIntakeRecord,
  referenceNowMs: number = Date.now()
): number | null {
  if (record.status === "Expected" || record.status === "Cancelled") {
    return null;
  }

  const arrivalMs = new Date(record.arrivalTime).getTime();
  if (isNaN(arrivalMs)) return null;

  // For Arrived (not yet checked in)
  if (record.status === "Arrived") {
    const diff = Math.max(0, referenceNowMs - arrivalMs);
    return Math.floor(diff / 60000);
  }

  // If Completed or In Assessment, stop timer at the last status transition in history
  if (record.status === "Completed" || record.status === "In Assessment") {
    const terminalEntry = record.history
      .slice()
      .reverse()
      .find((h) => h.status === record.status);

    const stopTimeMs = terminalEntry
      ? new Date(terminalEntry.timestamp).getTime()
      : new Date(record.updatedAt).getTime();

    const startMs = record.checkInTime
      ? new Date(record.checkInTime).getTime()
      : arrivalMs;

    if (isNaN(startMs) || isNaN(stopTimeMs)) return null;
    return Math.max(0, Math.floor((stopTimeMs - startMs) / 60000));
  }

  // Active waiting statuses: "Checked In" or "Awaiting Triage"
  const startMs = record.checkInTime
    ? new Date(record.checkInTime).getTime()
    : arrivalMs;

  if (isNaN(startMs)) return null;
  const diff = Math.max(0, referenceNowMs - startMs);
  return Math.floor(diff / 60000);
}

export function formatElapsedDuration(minutes: number | null): string {
  if (minutes === null || isNaN(minutes)) {
    return "Not available";
  }
  if (minutes < 1) {
    return "< 1 min";
  }
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
}

export function formatTimestampDisplay(isoString?: string | null): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

export function formatDateDisplay(isoString?: string | null): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function computeIntakeStats(
  records: PatientIntakeRecord[],
  nowMs: number = Date.now()
): IntakeSummaryStats {
  const waitingStatuses = new Set([
    "Arrived",
    "Checked In",
    "Awaiting Triage",
  ]);

  let totalWaiting = 0;
  let arrivedNotCheckedIn = 0;
  let checkedInToday = 0;
  let flaggedForReview = 0;
  let totalWaitingMins = 0;
  let waitingCountForAvg = 0;

  const todayStr = new Date(nowMs).toISOString().split("T")[0];

  for (const r of records) {
    if (r.needsStaffReview) {
      flaggedForReview++;
    }

    if (r.status === "Arrived") {
      arrivedNotCheckedIn++;
    }

    // Checked in today check
    if (r.checkInTime) {
      const checkInDate = r.checkInTime.split("T")[0];
      if (checkInDate === todayStr) {
        checkedInToday++;
      }
    }

    if (waitingStatuses.has(r.status)) {
      totalWaiting++;
      const elapsed = calculateElapsedMinutes(r, nowMs);
      if (elapsed !== null) {
        totalWaitingMins += elapsed;
        waitingCountForAvg++;
      }
    }
  }

  const avgWaitingMinutes =
    waitingCountForAvg > 0
      ? Math.round(totalWaitingMins / waitingCountForAvg)
      : 0;

  return {
    totalWaiting,
    arrivedNotCheckedIn,
    checkedInToday,
    avgWaitingMinutes,
    flaggedForReview,
  };
}
