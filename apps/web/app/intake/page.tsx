"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { SynapticLogo } from "../logo";
import {
  PatientIntakeRecord,
  CreateIntakePayload,
  UpdateIntakePayload,
  IntakeStatus,
} from "./types";
import { computeIntakeStats, calculateElapsedMinutes } from "./calculations";
import {
  fetchIntakeRecords,
  createIntakeRecord,
  updateIntakeRecord,
} from "./intake-service";
import { IntakeSummaryCards } from "./components/IntakeSummaryCards";
import { PatientSearchFilters } from "./components/PatientSearchFilters";
import { PatientIntakeTable } from "./components/PatientIntakeTable";
import { RegisterPatientModal } from "./components/RegisterPatientModal";
import { PatientDetailsPanel } from "./components/PatientDetailsPanel";
import { Button } from "@ui/components/ui/button";
import {
  UserPlus,
  RefreshCw,
  Clock,
  Shield,
  Activity,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";

const DEPARTMENTS = [
  "Emergency Medicine",
  "Pediatrics",
  "Cardiology",
  "Orthopedics",
  "General Medicine",
  "Urgent Care",
];

export default function PatientIntakeDashboard() {
  const [records, setRecords] = useState<PatientIntakeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [reviewOnly, setReviewOnly] = useState(false);

  // Sort state
  const [sortBy, setSortBy] = useState<"name" | "arrivalTime" | "waitingTime">(
    "waitingTime"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selection & Modal states
  const [selectedPatient, setSelectedPatient] =
    useState<PatientIntakeRecord | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Live timer tick for active waiting times (updates every 30s)
  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Current system clock display
  const [clockDisplay, setClockDisplay] = useState("");
  useEffect(() => {
    const updateClock = () => {
      const d = new Date();
      setClockDisplay(
        d.toLocaleDateString([], {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }) +
          " · " +
          d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch records
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchIntakeRecords();
      setRecords(data);
    } catch (err: any) {
      setError(err.message || "Failed to load patient records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter & Sort
  const filteredRecords = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return records
      .filter((r) => {
        const matchesQuery =
          !q ||
          r.id.toLowerCase().includes(q) ||
          r.firstName.toLowerCase().includes(q) ||
          r.lastName.toLowerCase().includes(q) ||
          `${r.firstName} ${r.lastName}`.toLowerCase().includes(q) ||
          r.chiefComplaint.toLowerCase().includes(q) ||
          r.symptoms.toLowerCase().includes(q);

        const matchesStatus =
          statusFilter === "all" ||
          r.status.toLowerCase() === statusFilter.toLowerCase();

        const matchesDept =
          departmentFilter === "all" ||
          r.department.toLowerCase() === departmentFilter.toLowerCase();

        const matchesReview = !reviewOnly || r.needsStaffReview;

        return matchesQuery && matchesStatus && matchesDept && matchesReview;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === "name") {
          diff = a.lastName.localeCompare(b.lastName);
        } else if (sortBy === "arrivalTime") {
          diff =
            new Date(a.arrivalTime).getTime() -
            new Date(b.arrivalTime).getTime();
        } else if (sortBy === "waitingTime") {
          const aElapsed = calculateElapsedMinutes(a, nowMs) ?? -1;
          const bElapsed = calculateElapsedMinutes(b, nowMs) ?? -1;
          diff = aElapsed - bElapsed;
        }

        return sortOrder === "asc" ? diff : -diff;
      });
  }, [
    records,
    searchQuery,
    statusFilter,
    departmentFilter,
    reviewOnly,
    sortBy,
    sortOrder,
    nowMs,
  ]);

  // Compute live statistics from the underlying records
  const stats = useMemo(() => computeIntakeStats(records, nowMs), [
    records,
    nowMs,
  ]);

  // Handlers
  const handleSortChange = (field: "name" | "arrivalTime" | "waitingTime") => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDepartmentFilter("all");
    setReviewOnly(false);
  };

  const handleCreatePatient = async (payload: CreateIntakePayload) => {
    const newRecord = await createIntakeRecord(payload);
    setRecords((prev) => [newRecord, ...prev]);
  };

  const handleUpdatePatient = async (
    id: string,
    updates: UpdateIntakePayload
  ) => {
    const updated = await updateIntakeRecord(id, updates);
    setRecords((prev) => prev.map((r) => (r.id === id ? updated : r)));
    if (selectedPatient && selectedPatient.id === id) {
      setSelectedPatient(updated);
    }
  };

  const handleQuickCheckIn = async (id: string) => {
    await handleUpdatePatient(id, {
      status: "Checked In",
      checkInTime: new Date().toISOString(),
      historyNote: "Direct check-in processed at triage desk",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Top hospital operational notice bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-200">
              Hospital Operations Platform · Clinical Intake & Triage System
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Authorized Clinical Staff Only</span>
            <span className="hidden sm:inline font-mono">{clockDisplay}</span>
          </div>
        </div>
      </div>

      {/* Main Portal Navigation Bar */}
      <header className="border-b bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SynapticLogo className="h-9 w-auto" />
            <div className="hidden sm:flex items-center gap-3 border-l border-slate-200 pl-4 text-xs font-medium">
              <Link
                href="/"
                className="text-slate-500 hover:text-slate-800 transition"
              >
                Emergency Router
              </Link>
              <Link
                href="/specialist-directory"
                className="text-slate-500 hover:text-slate-800 transition"
              >
                Specialist Directory
              </Link>
              <span className="text-blue-700 font-bold border-b-2 border-blue-600 pb-1">
                Patient Intake Dashboard
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="text-xs h-9 gap-1.5 text-slate-600"
              title="Refresh intake queue"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setIsRegisterModalOpen(true)}
              className="text-xs h-9 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Register Patient
            </Button>
          </div>
        </div>
      </header>

      {/* Dashboard Body */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 space-y-5 w-full">
        {/* Page Title & Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Patient Intake Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Organize incoming arrivals, track front-desk check-ins, and monitor live waiting queues.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-medium">
              Timezone: America/Toronto (EST)
            </span>
          </div>
        </div>

        {/* 1. Summary Cards Overview */}
        <IntakeSummaryCards stats={stats} />

        {/* 2. Search & Filters Panel */}
        <PatientSearchFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          departmentFilter={departmentFilter}
          onDepartmentChange={setDepartmentFilter}
          reviewOnly={reviewOnly}
          onReviewOnlyChange={setReviewOnly}
          departments={DEPARTMENTS}
          onClearFilters={handleClearFilters}
        />

        {/* 3. Error Banner */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-800 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="h-7 text-xs text-rose-700 border-rose-300 hover:bg-rose-100"
            >
              Retry
            </Button>
          </div>
        )}

        {/* 4. Functional Patient Intake Table */}
        <PatientIntakeTable
          records={filteredRecords}
          onSelectPatient={(p) => setSelectedPatient(p)}
          onQuickCheckIn={handleQuickCheckIn}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          referenceNowMs={nowMs}
        />
      </main>

      {/* 5. Registration Modal */}
      <RegisterPatientModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSubmit={handleCreatePatient}
        departments={DEPARTMENTS}
      />

      {/* 6. Patient Details & Workflow Drawer */}
      <PatientDetailsPanel
        patient={selectedPatient}
        onClose={() => setSelectedPatient(null)}
        onUpdate={handleUpdatePatient}
        departments={DEPARTMENTS}
      />

      {/* Operational Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 space-y-1 mt-auto">
        <p className="font-medium text-slate-700">
          Synaptic Clinical Operations · Hospital Intake Dashboard
        </p>
        <p className="text-[11px] text-slate-400">
          Demonstration patient data for authorized intake management. Clinical prioritization rests with qualified triage staff.
        </p>
      </footer>
    </div>
  );
}
