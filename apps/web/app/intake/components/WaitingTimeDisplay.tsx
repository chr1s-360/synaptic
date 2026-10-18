import React from "react";
import { formatElapsedDuration } from "../calculations";
import { Clock } from "lucide-react";

interface WaitingTimeDisplayProps {
  elapsedMinutes: number | null;
  status: string;
}

export function WaitingTimeDisplay({
  elapsedMinutes,
  status,
}: WaitingTimeDisplayProps) {
  if (elapsedMinutes === null) {
    return (
      <span className="text-xs text-slate-400 italic font-mono">
        Not available
      </span>
    );
  }

  // Visual thresholds: green < 30m, amber 30-60m, rose > 60m
  let colorClass = "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (elapsedMinutes >= 60) {
    colorClass = "text-rose-700 bg-rose-50 border-rose-300 font-bold";
  } else if (elapsedMinutes >= 30) {
    colorClass = "text-amber-800 bg-amber-50 border-amber-300 font-medium";
  }

  const isTerminal = status === "Completed" || status === "In Assessment";

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border font-mono ${colorClass}`}
        title={isTerminal ? "Total wait time until assessment" : "Active elapsed waiting time"}
      >
        <Clock className="w-3 h-3 shrink-0" />
        {formatElapsedDuration(elapsedMinutes)}
      </span>
      {isTerminal && (
        <span className="text-[10px] text-slate-400 uppercase tracking-tight font-semibold">
          (Ended)
        </span>
      )}
    </div>
  );
}
