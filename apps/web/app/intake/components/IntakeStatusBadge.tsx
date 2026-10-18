import React from "react";
import { IntakeStatus } from "../types";

interface IntakeStatusBadgeProps {
  status: IntakeStatus;
}

export function IntakeStatusBadge({ status }: IntakeStatusBadgeProps) {
  let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200";
  let dotColor = "bg-slate-400";

  switch (status) {
    case "Expected":
      badgeStyle = "bg-blue-50 text-blue-700 border-blue-200";
      dotColor = "bg-blue-500";
      break;
    case "Arrived":
      badgeStyle = "bg-amber-50 text-amber-800 border-amber-300";
      dotColor = "bg-amber-500 animate-pulse";
      break;
    case "Checked In":
      badgeStyle = "bg-teal-50 text-teal-800 border-teal-200";
      dotColor = "bg-teal-500";
      break;
    case "Awaiting Triage":
      badgeStyle = "bg-orange-50 text-orange-800 border-orange-300";
      dotColor = "bg-orange-500 animate-pulse";
      break;
    case "In Assessment":
      badgeStyle = "bg-indigo-50 text-indigo-800 border-indigo-300";
      dotColor = "bg-indigo-600";
      break;
    case "Completed":
      badgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-200";
      dotColor = "bg-emerald-500";
      break;
    case "Cancelled":
      badgeStyle = "bg-rose-50 text-rose-700 border-rose-200";
      dotColor = "bg-rose-400";
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {status}
    </span>
  );
}
