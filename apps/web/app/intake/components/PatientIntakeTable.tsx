import React, { useState } from "react";
import { PatientIntakeRecord } from "../types";
import { IntakeStatusBadge } from "./IntakeStatusBadge";
import { WaitingTimeDisplay } from "./WaitingTimeDisplay";
import {
  calculateElapsedMinutes,
  formatTimestampDisplay,
} from "../calculations";
import { Button } from "@ui/components/ui/button";
import {
  ArrowUpDown,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  UserCheck,
} from "lucide-react";

interface PatientIntakeTableProps {
  records: PatientIntakeRecord[];
  onSelectPatient: (patient: PatientIntakeRecord) => void;
  onQuickCheckIn: (id: string) => Promise<void>;
  sortBy: "name" | "arrivalTime" | "waitingTime";
  sortOrder: "asc" | "desc";
  onSortChange: (field: "name" | "arrivalTime" | "waitingTime") => void;
  referenceNowMs: number;
}

export function PatientIntakeTable({
  records,
  onSelectPatient,
  onQuickCheckIn,
  sortBy,
  sortOrder,
  onSortChange,
  referenceNowMs,
}: PatientIntakeTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const totalPages = Math.max(1, Math.ceil(records.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const pageRecords = records.slice(startIndex, startIndex + pageSize);

  const renderSortIndicator = (field: "name" | "arrivalTime" | "waitingTime") => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 ml-1 inline" />;
    }
    return (
      <span className="ml-1 text-blue-600 font-bold inline">
        {sortOrder === "asc" ? "▲" : "▼"}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3.5">Patient ID</th>
              <th
                onClick={() => onSortChange("name")}
                className="py-3 px-3.5 cursor-pointer hover:text-slate-900 transition"
              >
                Patient Name {renderSortIndicator("name")}
              </th>
              <th
                onClick={() => onSortChange("arrivalTime")}
                className="py-3 px-3.5 cursor-pointer hover:text-slate-900 transition"
              >
                Arrival Time {renderSortIndicator("arrivalTime")}
              </th>
              <th className="py-3 px-3.5">Check-in Time</th>
              <th
                onClick={() => onSortChange("waitingTime")}
                className="py-3 px-3.5 cursor-pointer hover:text-slate-900 transition"
              >
                Waiting Time {renderSortIndicator("waitingTime")}
              </th>
              <th className="py-3 px-3.5">Chief Complaint</th>
              <th className="py-3 px-3.5">Symptoms</th>
              <th className="py-3 px-3.5">Status</th>
              <th className="py-3 px-3.5">Department</th>
              <th className="py-3 px-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {pageRecords.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  <p className="text-sm font-medium">No patient records found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try adjusting search parameters or register a new incoming patient.
                  </p>
                </td>
              </tr>
            ) : (
              pageRecords.map((r) => {
                const elapsedMins = calculateElapsedMinutes(r, referenceNowMs);
                return (
                  <tr
                    key={r.id}
                    className={`hover:bg-slate-50/80 transition cursor-pointer ${r.needsStaffReview ? "bg-rose-50/30" : ""
                      }`}
                    onClick={() => onSelectPatient(r)}
                  >
                    {/* Patient ID */}
                    <td className="py-3 px-3.5 font-mono font-bold text-blue-700">
                      <div className="flex items-center gap-1.5">
                        {r.needsStaffReview && (
                          <span title="Flagged for staff review" className="inline-flex items-center">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          </span>
                        )}
                        <span>{r.id}</span>
                      </div>
                    </td>

                    {/* Patient Name */}
                    <td className="py-3 px-3.5 font-semibold text-slate-900 whitespace-nowrap">
                      {r.firstName} {r.lastName}
                    </td>

                    {/* Arrival Time */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-slate-600">
                      {formatTimestampDisplay(r.arrivalTime)}
                    </td>

                    {/* Check-In Time */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-slate-600">
                      {formatTimestampDisplay(r.checkInTime)}
                    </td>

                    {/* Waiting Time */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <WaitingTimeDisplay
                        elapsedMinutes={elapsedMins}
                        status={r.status}
                      />
                    </td>

                    {/* Chief Complaint */}
                    <td className="py-3 px-3.5 max-w-[200px] truncate" title={r.chiefComplaint}>
                      {r.chiefComplaint}
                    </td>

                    {/* Symptoms */}
                    <td className="py-3 px-3.5 max-w-[180px] truncate text-slate-500" title={r.symptoms}>
                      {r.symptoms}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <IntakeStatusBadge status={r.status} />
                    </td>

                    {/* Department */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-slate-600 font-medium">
                      {r.department}
                    </td>

                    {/* Actions */}
                    <td
                      className="py-3 px-3.5 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {r.status === "Arrived" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onQuickCheckIn(r.id)}
                            className="h-7 text-[11px] gap-1 text-teal-700 border-teal-300 hover:bg-teal-50 px-2"
                            title="Complete intake check-in"
                          >
                            <UserCheck className="w-3 h-3" />
                            Check In
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onSelectPatient(r)}
                          className="h-7 text-[11px] gap-1 text-blue-600 hover:text-blue-700 px-2"
                        >
                          <Eye className="w-3 h-3" />
                          Details
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
        <div>
          Showing{" "}
          <strong className="text-slate-700 font-medium">
            {records.length === 0 ? 0 : startIndex + 1}
          </strong>{" "}
          to{" "}
          <strong className="text-slate-700 font-medium">
            {Math.min(startIndex + pageSize, records.length)}
          </strong>{" "}
          of <strong className="text-slate-700 font-medium">{records.length}</strong> patient records
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="px-2 font-medium text-slate-700">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
