import React from "react";
import { Input } from "@ui/components/ui/input";
import { Button } from "@ui/components/ui/button";
import { IntakeStatus } from "../types";
import {
  Search,
  Filter,
  X,
  SlidersHorizontal,
  AlertCircle,
} from "lucide-react";

interface PatientSearchFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  departmentFilter: string;
  onDepartmentChange: (dept: string) => void;
  reviewOnly: boolean;
  onReviewOnlyChange: (review: boolean) => void;
  departments: string[];
  onClearFilters: () => void;
}

const ALL_STATUSES: IntakeStatus[] = [
  "Expected",
  "Arrived",
  "Checked In",
  "Awaiting Triage",
  "In Assessment",
  "Completed",
  "Cancelled",
];

export function PatientSearchFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  departmentFilter,
  onDepartmentChange,
  reviewOnly,
  onReviewOnlyChange,
  departments,
  onClearFilters,
}: PatientSearchFiltersProps) {
  const hasActiveFilters =
    Boolean(searchQuery) ||
    statusFilter !== "all" ||
    departmentFilter !== "all" ||
    reviewOnly;

  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-3">
      <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search patient name, ID (PT-...), chief complaint, or symptoms..."
            className="pl-9 h-10 text-xs sm:text-sm bg-slate-50 border-slate-200 focus:bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-1"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="h-10 px-3 rounded-md text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          >
            <option value="all">All Statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Department Dropdown */}
          <select
            value={departmentFilter}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="h-10 px-3 rounded-md text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Staff Review Flag Toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onReviewOnlyChange(!reviewOnly)}
            className={`h-10 text-xs gap-1.5 px-3 transition ${
              reviewOnly
                ? "bg-rose-50 text-rose-700 border-rose-300 font-semibold"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            Flagged Review
          </Button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-10 text-xs text-slate-500 hover:text-slate-800 gap-1 px-2.5"
            >
              <X className="w-3.5 h-3.5" />
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
