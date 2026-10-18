import { NextResponse } from "next/server";
import { getInitialDemoIntakes } from "../../intake/demo-data";
import {
  PatientIntakeRecord,
  CreateIntakePayload,
  UpdateIntakePayload,
} from "../../intake/types";

// Server-side persistent memory store during running session
let inMemoryRecords: PatientIntakeRecord[] = getInitialDemoIntakes();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.toLowerCase().trim();
    const status = searchParams.get("status");
    const department = searchParams.get("department");
    const reviewOnly = searchParams.get("reviewOnly") === "true";

    let results = [...inMemoryRecords];

    if (query) {
      results = results.filter(
        (r) =>
          r.id.toLowerCase().includes(query) ||
          r.firstName.toLowerCase().includes(query) ||
          r.lastName.toLowerCase().includes(query) ||
          `${r.firstName} ${r.lastName}`.toLowerCase().includes(query) ||
          r.chiefComplaint.toLowerCase().includes(query) ||
          r.symptoms.toLowerCase().includes(query)
      );
    }

    if (status && status !== "all") {
      results = results.filter((r) => r.status.toLowerCase() === status.toLowerCase());
    }

    if (department && department !== "all") {
      results = results.filter(
        (r) => r.department.toLowerCase() === department.toLowerCase()
      );
    }

    if (reviewOnly) {
      results = results.filter((r) => r.needsStaffReview);
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      records: results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to retrieve patient intake records", details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body: CreateIntakePayload = await req.json();

    if (!body.firstName?.trim() || !body.lastName?.trim()) {
      return NextResponse.json(
        { error: "First name and last name are required." },
        { status: 400 }
      );
    }

    if (!body.chiefComplaint?.trim()) {
      return NextResponse.json(
        { error: "Chief complaint in the patient's words is required." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const generatedNum = inMemoryRecords.length + 1040 + Math.floor(Math.random() * 50);
    const newId = `PT-${new Date().getFullYear()}-${generatedNum}`;

    const arrivalTimestamp = body.arrivalTime || now;
    const initialStatus = body.status || "Arrived";
    const checkInTimestamp =
      initialStatus === "Checked In" ? now : body.checkInTime || null;

    const newRecord: PatientIntakeRecord = {
      id: newId,
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      dateOfBirth: body.dateOfBirth?.trim(),
      arrivalTime: arrivalTimestamp,
      checkInTime: checkInTimestamp,
      status: initialStatus,
      department: body.department?.trim() || "Emergency Medicine",
      chiefComplaint: body.chiefComplaint.trim(),
      symptoms: body.symptoms?.trim() || "Self-reported symptoms pending clinical triage",
      symptomOnset: body.symptomOnset?.trim() || "Onset reported today",
      staffNotes: body.staffNotes?.trim(),
      needsStaffReview: Boolean(body.needsStaffReview),
      assignedStaff: body.assignedStaff?.trim(),
      history: [
        {
          status: initialStatus,
          timestamp: now,
          changedBy: "Authorized Triage Staff",
          note: "Intake record registered via hospital operations dashboard",
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    inMemoryRecords.unshift(newRecord);

    return NextResponse.json(
      {
        success: true,
        message: "Patient intake successfully registered",
        record: newRecord,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create patient intake", details: error?.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, ...updates }: { id: string } & UpdateIntakePayload = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }

    const targetIndex = inMemoryRecords.findIndex((r) => r.id === id);
    if (targetIndex === -1) {
      return NextResponse.json({ error: "Patient record not found" }, { status: 404 });
    }

    const current = inMemoryRecords[targetIndex];
    const now = new Date().toISOString();

    const newHistory = [...current.history];
    if (updates.status && updates.status !== current.status) {
      newHistory.push({
        status: updates.status,
        timestamp: now,
        changedBy: updates.changedBy || "Hospital Staff",
        note: updates.historyNote || `Status changed from ${current.status} to ${updates.status}`,
      });
    }

    // Automatically assign checkInTime if status transitions to Checked In
    let newCheckInTime = current.checkInTime;
    if (updates.status === "Checked In" && !current.checkInTime) {
      newCheckInTime = now;
    }
    if (updates.checkInTime !== undefined) {
      newCheckInTime = updates.checkInTime;
    }

    const updatedRecord: PatientIntakeRecord = {
      ...current,
      status: updates.status || current.status,
      checkInTime: newCheckInTime,
      department: updates.department !== undefined ? updates.department : current.department,
      chiefComplaint: updates.chiefComplaint !== undefined ? updates.chiefComplaint : current.chiefComplaint,
      symptoms: updates.symptoms !== undefined ? updates.symptoms : current.symptoms,
      symptomOnset: updates.symptomOnset !== undefined ? updates.symptomOnset : current.symptomOnset,
      staffNotes: updates.staffNotes !== undefined ? updates.staffNotes : current.staffNotes,
      needsStaffReview:
        updates.needsStaffReview !== undefined ? updates.needsStaffReview : current.needsStaffReview,
      assignedStaff: updates.assignedStaff !== undefined ? updates.assignedStaff : current.assignedStaff,
      history: newHistory,
      updatedAt: now,
    };

    inMemoryRecords[targetIndex] = updatedRecord;

    return NextResponse.json({
      success: true,
      message: "Patient intake record updated",
      record: updatedRecord,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update record", details: error?.message },
      { status: 500 }
    );
  }
}
