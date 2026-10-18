import React, { useState } from "react";
import { PatientIntakeRecord, IntakeStatus, UpdateIntakePayload } from "../types";
import { IntakeStatusBadge } from "./IntakeStatusBadge";
import { WaitingTimeDisplay } from "./WaitingTimeDisplay";
import { calculateElapsedMinutes, formatDateDisplay } from "../calculations";
import { Button } from "@ui/components/ui/button";
import {
  X,
  User,
  Clock,
  Building2,
  Calendar,
  AlertCircle,
  FileText,
  Activity,
  History,
  CheckCircle,
  ArrowRight,
  Shield,
} from "lucide-react";

interface PatientDetailsPanelProps {
  patient: PatientIntakeRecord | null;
  onClose: () => void;
  onUpdate: (id: string, updates: UpdateIntakePayload) => Promise<void>;
  departments: string[];
}

const STATUS_TRANSITIONS: IntakeStatus[] = [
  "Expected",
  "Arrived",
  "Checked In",
  "Awaiting Triage",
  "In Assessment",
  "Completed",
  "Cancelled",
];

export function PatientDetailsPanel({
  patient,
  onClose,
  onUpdate,
  departments,
}: PatientDetailsPanelProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingNotes, setEditingNotes] = useState(patient?.staffNotes || "");
  const [selectedDept, setSelectedDept] = useState(patient?.department || "Emergency Medicine");
  const [customNote, setCustomNote] = useState("");

  // Sync state whenever selected patient changes
  React.useEffect(() => {
    if (patient) {
      setEditingNotes(patient.staffNotes || "");
      setSelectedDept(patient.department || "Emergency Medicine");
      setCustomNote("");
    }
  }, [patient]);

  if (!patient) return null;

  const elapsedMins = calculateElapsedMinutes(patient);

  const handleStatusChange = async (newStatus: IntakeStatus) => {
    setIsUpdating(true);
    try {
      await onUpdate(patient.id, {
        status: newStatus,
        historyNote: `Transitioned to ${newStatus} by attending staff`,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleReview = async () => {
    setIsUpdating(true);
    try {
      await onUpdate(patient.id, {
        needsStaffReview: !patient.needsStaffReview,
        historyNote: patient.needsStaffReview
          ? "Staff review flag cleared"
          : "Flagged for staff review",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsUpdating(true);
    try {
      await onUpdate(patient.id, {
        staffNotes: editingNotes,
        department: selectedDept,
        historyNote: customNote || "Staff notes updated",
      });
      setCustomNote("");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] bg-white shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-250">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {patient.id}
            </span>
            <IntakeStatusBadge status={patient.status} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            {patient.firstName} {patient.lastName}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-700">
        {/* Warning Review Banner */}
        {patient.needsStaffReview && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-800 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block">Flagged for Staff Attention</strong>
              Patient reported acute symptoms or requires prioritized staff review.
            </div>
          </div>
        )}

        {/* Timestamps & Waiting Duration Bar */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 grid grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Arrival Time
            </span>
            <span className="font-semibold text-slate-800">
              {formatDateDisplay(patient.arrivalTime)}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Check-In Time
            </span>
            <span className="font-semibold text-slate-800">
              {patient.checkInTime ? formatDateDisplay(patient.checkInTime) : "Pending"}
            </span>
          </div>
          <div className="col-span-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-600">
              Elapsed Waiting Duration:
            </span>
            <WaitingTimeDisplay
              elapsedMinutes={elapsedMins}
              status={patient.status}
            />
          </div>
        </div>

        {/* Clinical Intake Information */}
        <div className="space-y-2.5">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            Intake Symptoms & Complaint
          </h3>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Chief Complaint
              </span>
              <p className="text-slate-900 font-medium text-xs mt-0.5">
                &ldquo;{patient.chiefComplaint}&rdquo;
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Symptoms Summary
              </span>
              <p className="text-slate-700 text-xs mt-0.5">{patient.symptoms}</p>
            </div>
            {patient.symptomOnset && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Reported Onset
                </span>
                <p className="text-slate-600 text-xs mt-0.5">{patient.symptomOnset}</p>
              </div>
            )}
          </div>
        </div>

        {/* Workflow Actions */}
        <div className="space-y-2.5">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
            Update Intake Workflow Stage
          </h3>
          <div className="grid grid-cols-2 gap-1.5">
            {STATUS_TRANSITIONS.map((st) => (
              <button
                key={st}
                onClick={() => handleStatusChange(st)}
                disabled={isUpdating || patient.status === st}
                className={`text-left px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
                  patient.status === st
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Department & Notes Editing */}
        <div className="space-y-2.5">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            Department Assignment & Staff Notes
          </h3>
          <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Assigned Department
              </label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full h-8 px-2 rounded-md bg-slate-50 border border-slate-200 text-xs"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Internal Staff Notes
              </label>
              <textarea
                value={editingNotes}
                onChange={(e) => setEditingNotes(e.target.value)}
                rows={2}
                className="w-full p-2 rounded-md bg-slate-50 border border-slate-200 text-xs"
                placeholder="Clinical observations or coordination remarks..."
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleToggleReview}
                disabled={isUpdating}
                className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
              >
                {patient.needsStaffReview ? "Clear Review Flag" : "Flag For Review"}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveNotes}
                disabled={isUpdating}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save Updates
              </Button>
            </div>
          </div>
        </div>

        {/* Status History & Audit Log */}
        <div className="space-y-2.5">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-blue-600" />
            Audit & Status-Change History
          </h3>
          <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            {patient.history && patient.history.length > 0 ? (
              patient.history
                .slice()
                .reverse()
                .map((h, idx) => (
                  <div
                    key={idx}
                    className="pb-2 border-b border-slate-200/60 last:border-0 last:pb-0 text-slate-600 space-y-0.5"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-800 text-[11px]">
                      <span>{h.status}</span>
                      <span className="font-normal text-[10px] text-slate-400">
                        {formatDateDisplay(h.timestamp)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      By: <span className="font-medium text-slate-700">{h.changedBy}</span>
                    </p>
                    {h.note && <p className="text-[10px] italic text-slate-500">{h.note}</p>}
                  </div>
                ))
            ) : (
              <p className="text-slate-400 italic">No history records available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
