import {
  PatientIntakeRecord,
  CreateIntakePayload,
  UpdateIntakePayload,
} from "./types";

export async function fetchIntakeRecords(params?: {
  query?: string;
  status?: string;
  department?: string;
  reviewOnly?: boolean;
}): Promise<PatientIntakeRecord[]> {
  const queryParams = new URLSearchParams();
  if (params?.query) queryParams.set("query", params.query);
  if (params?.status) queryParams.set("status", params.status);
  if (params?.department) queryParams.set("department", params.department);
  if (params?.reviewOnly) queryParams.set("reviewOnly", "true");

  const res = await fetch(`/api/intake?${queryParams.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to load patient records (HTTP ${res.status})`);
  }

  const data = await res.json();
  return data.records || [];
}

export async function createIntakeRecord(
  payload: CreateIntakePayload
): Promise<PatientIntakeRecord> {
  const res = await fetch("/api/intake", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create patient intake record");
  }

  const data = await res.json();
  return data.record;
}

export async function updateIntakeRecord(
  id: string,
  updates: UpdateIntakePayload
): Promise<PatientIntakeRecord> {
  const res = await fetch("/api/intake", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...updates }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to update record");
  }

  const data = await res.json();
  return data.record;
}
