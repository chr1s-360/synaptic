import React, { useState } from "react";
import { CreateIntakePayload, IntakeStatus } from "../types";
import { Button } from "@ui/components/ui/button";
import { Input } from "@ui/components/ui/input";
import {
  X,
  UserPlus,
  AlertCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

interface RegisterPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateIntakePayload) => Promise<void>;
  departments: string[];
}

export function RegisterPatientModal({
  isOpen,
  onClose,
  onSubmit,
  departments,
}: RegisterPatientModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [department, setDepartment] = useState("Emergency Medicine");
  const [status, setStatus] = useState<IntakeStatus>("Arrived");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [symptomOnset, setSymptomOnset] = useState("");
  const [staffNotes, setStaffNotes] = useState("");
  const [needsStaffReview, setNeedsStaffReview] = useState(false);
  const [assignedStaff, setAssignedStaff] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg("Please provide both first and last name.");
      return;
    }
    if (!chiefComplaint.trim()) {
      setErrorMsg("Please describe the patient's chief complaint.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: dateOfBirth || undefined,
        department,
        status,
        chiefComplaint: chiefComplaint.trim(),
        symptoms: symptoms.trim() || "Reported symptoms pending clinical review",
        symptomOnset: symptomOnset.trim() || undefined,
        staffNotes: staffNotes.trim() || undefined,
        needsStaffReview,
        assignedStaff: assignedStaff.trim() || undefined,
      });

      // Reset fields
      setFirstName("");
      setLastName("");
      setDateOfBirth("");
      setChiefComplaint("");
      setSymptoms("");
      setSymptomOnset("");
      setStaffNotes("");
      setNeedsStaffReview(false);
      setAssignedStaff("");
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to register patient intake.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Register Patient Intake
              </h2>
              <p className="text-xs text-slate-500">
                Authorized clinical registration & arrival workflow
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Patient Identity */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              1. Patient Identification
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. David"
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Chen"
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Date of Birth (Optional)
                </label>
                <Input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Arrival & Department */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              2. Workflow & Department
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Initial Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as IntakeStatus)}
                  className="w-full h-9 px-3 rounded-md text-xs bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Expected">Expected (Scheduled)</option>
                  <option value="Arrived">Arrived (In Lobby)</option>
                  <option value="Checked In">Checked In (Front Desk)</option>
                  <option value="Awaiting Triage">Awaiting Triage</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Service / Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full h-9 px-3 rounded-md text-xs bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Assigned Staff (Optional)
                </label>
                <Input
                  value={assignedStaff}
                  onChange={(e) => setAssignedStaff(e.target.value)}
                  placeholder="e.g. RN E. Campbell"
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Basic Intake & Complaint */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              3. Patient-Reported Intake
            </h3>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Chief Complaint (in patient&apos;s own words) <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="e.g. Severe dull pain in left side with intermittent fever"
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Reported Symptoms
                </label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g. Mild headache, dizziness, nausea"
                  rows={2}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Symptom Onset & Duration
                </label>
                <Input
                  value={symptomOnset}
                  onChange={(e) => setSymptomOnset(e.target.value)}
                  placeholder="e.g. Started 4 hours ago after lunch"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Internal Staff Notes (Optional)
              </label>
              <textarea
                value={staffNotes}
                onChange={(e) => setStaffNotes(e.target.value)}
                placeholder="Observations, mobility assistance required, family contact..."
                rows={2}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Section 4: Flag for Staff Review */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={needsStaffReview}
                onChange={(e) => setNeedsStaffReview(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span>Flag this intake record for immediate staff review</span>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5"
            >
              {isSubmitting ? "Registering..." : "Save Patient Intake"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
