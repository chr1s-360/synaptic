"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { SynapticLogo } from "./logo";
import {
  User,
  Building2,
  ArrowRight,
  ShieldAlert,
  Activity,
  HeartPulse,
  Clock,
  Compass,
} from "lucide-react";

export default function RoleSelectorPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<"patient" | "hospital" | null>(null);

  const handleContinue = (role?: "patient" | "hospital") => {
    const target = role || selectedRole;
    if (target === "hospital") {
      router.push("/hospital-portal");
    } else if (target === "patient") {
      router.push("/patient-router");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SynapticLogo className="h-9 w-auto text-white" />
          <span className="text-xs uppercase tracking-wider font-semibold text-indigo-400 bg-indigo-950/80 px-2.5 py-0.5 rounded-full border border-indigo-700/60">
            Unified Portal Access
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12 flex-1 flex flex-col items-center justify-center w-full z-10">
        <div className="text-center max-w-xl mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 border border-indigo-700/60 px-3 py-1 rounded-full">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            Role Selection
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Who is accessing Synaptic?
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Select your portal to proceed to real-time emergency routing or hospital staff coordination.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Patient Card */}
          <button
            type="button"
            onClick={() => handleContinue("patient")}
            onMouseEnter={() => setSelectedRole("patient")}
            className={`group text-left p-6 sm:p-7 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between bg-slate-900/80 hover:bg-slate-900 shadow-xl backdrop-blur-md ${
              selectedRole === "patient"
                ? "border-indigo-500 ring-2 ring-indigo-500/40 shadow-indigo-950/50"
                : "border-slate-800 hover:border-slate-700"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <User className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
                  Public Access
                </span>
              </div>

              <h2 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                Patient / Care Seeker
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                Find nearest emergency care with live wait times, traffic routing, AI clinical navigator, and pre-arrival intake.
              </p>

              <div className="space-y-2 border-t border-slate-800/80 pt-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Real-time ER queues & travel duration</span>
                </div>
                <div className="flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Interactive healthcare travel map</span>
                </div>
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-3.5 h-3.5 text-indigo-400" />
                  <span>AI Symptom Navigator & triage assistance</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between font-semibold text-sm text-indigo-400 group-hover:text-indigo-300">
              <span>Go to Patient Home</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Hospital Staff Card */}
          <button
            type="button"
            onClick={() => handleContinue("hospital")}
            onMouseEnter={() => setSelectedRole("hospital")}
            className={`group text-left p-6 sm:p-7 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between bg-slate-900/80 hover:bg-slate-900 shadow-xl backdrop-blur-md ${
              selectedRole === "hospital"
                ? "border-emerald-500 ring-2 ring-emerald-500/40 shadow-emerald-950/50"
                : "border-slate-800 hover:border-slate-700"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-700/60">
                  Staff Only
                </span>
              </div>

              <h2 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                Hospital ED Staff
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                Monitor live incoming patient tickets, assess severity levels, view travel ETAs, and manage triage status in real time.
              </p>

              <div className="space-y-2 border-t border-slate-800/80 pt-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Live 5-second cloud sync incoming feed</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Acuity levels 1 to 5 triage breakdown</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>En-route tracking & status progression</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between font-semibold text-sm text-emerald-400 group-hover:text-emerald-300">
              <span>Go to Hospital Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        Synaptic Healthcare Routing · Regional Emergency Access System
      </footer>
    </div>
  );
}
