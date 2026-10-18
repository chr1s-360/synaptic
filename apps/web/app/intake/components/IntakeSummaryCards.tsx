import React from "react";
import { IntakeSummaryStats } from "../types";
import {
  Users,
  UserCheck,
  Clock,
  AlertCircle,
  Activity,
} from "lucide-react";

interface IntakeSummaryCardsProps {
  stats: IntakeSummaryStats;
}

export function IntakeSummaryCards({ stats }: IntakeSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
      {/* 1. Total Patients Currently Waiting */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Active Waiting
          </span>
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
            {stats.totalWaiting}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Arrived & awaiting triage
          </p>
        </div>
      </div>

      {/* 2. Arrived Not Checked In */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Unchecked Arrivals
          </span>
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold text-amber-600 font-mono">
            {stats.arrivedNotCheckedIn}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Arrived at lobby, pending check-in
          </p>
        </div>
      </div>

      {/* 3. Checked In Today */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Checked In Today
          </span>
          <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold text-teal-700 font-mono">
            {stats.checkedInToday}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Formal intakes processed
          </p>
        </div>
      </div>

      {/* 4. Average Elapsed Waiting Time */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Avg Waiting Time
          </span>
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
            {stats.avgWaitingMinutes}{" "}
            <span className="text-sm font-sans font-normal text-slate-500">
              min
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Calculated from live timestamps
          </p>
        </div>
      </div>

      {/* 5. Flagged for Staff Review */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between col-span-2 md:col-span-1">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Staff Attention
          </span>
          <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold text-rose-600 font-mono">
            {stats.flaggedForReview}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Flagged for review / high concern
          </p>
        </div>
      </div>
    </div>
  );
}
