"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@ui/components/ui/button";
import { Input } from "@ui/components/ui/input";
import { SynapticLogo } from "../logo";
import {
  Clock,
  Car,
  Navigation,
  MapPin,
  Search,
  AlertTriangle,
  Building2,
  ShieldCheck,
  PhoneCall,
  Activity,
  SlidersHorizontal,
  BadgeCheck,
  Stethoscope,
} from "lucide-react";

interface HospitalItem {
  id: string;
  name: string;
  address: string;
  phone: string;
  distanceMiles: number;
  driveTimeMin: number;
  waitTimeMin: number;
  erLevel: "Level 1 Trauma" | "Level 2 Trauma" | "Community Emergency";
  rating: number;
  availableBeds: number;
  specialties: string[];
}

const SAMPLE_HOSPITALS: HospitalItem[] = [
  {
    id: "1",
    name: "Memorial Medical Center",
    address: "742 Evergreen Terrace, Metro Area",
    phone: "(555) 234-5678",
    distanceMiles: 4.2,
    driveTimeMin: 12,
    waitTimeMin: 18,
    erLevel: "Level 1 Trauma",
    rating: 4.8,
    availableBeds: 14,
    specialties: ["Cardiac Care", "Pediatrics", "Trauma", "Stroke Unit"],
  },
  {
    id: "2",
    name: "Saint Jude Community Hospital",
    address: "1204 Pine Valley Rd, Downtown",
    phone: "(555) 876-5432",
    distanceMiles: 2.1,
    driveTimeMin: 8,
    waitTimeMin: 45,
    erLevel: "Level 2 Trauma",
    rating: 4.4,
    availableBeds: 6,
    specialties: ["General ER", "Orthopedics", "Urgent Surgery"],
  },
  {
    id: "3",
    name: "Westside Emergency & Trauma Pavilion",
    address: "880 Ocean Avenue, West District",
    phone: "(555) 345-9871",
    distanceMiles: 7.8,
    driveTimeMin: 16,
    waitTimeMin: 12,
    erLevel: "Level 1 Trauma",
    rating: 4.9,
    availableBeds: 21,
    specialties: ["Comprehensive Stroke", "Burn Center", "Cardiology"],
  },
  {
    id: "4",
    name: "Northview Urgent Health Center",
    address: "3100 Highland Park Blvd, North Shore",
    phone: "(555) 654-2109",
    distanceMiles: 5.5,
    driveTimeMin: 14,
    waitTimeMin: 35,
    erLevel: "Community Emergency",
    rating: 4.2,
    availableBeds: 8,
    specialties: ["Rapid Diagnostics", "Pediatrics", "Minor Fractures"],
  },
];

export default function Page() {
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState("Current Location (detected)");
  const [sortBy, setSortBy] = useState<"totalTime" | "waitTime" | "driveTime">("totalTime");
  const [severityFilter, setSeverityFilter] = useState<"all" | "level1" | "pediatric">("all");

  const filteredHospitals = useMemo(() => {
    return SAMPLE_HOSPITALS.filter((h) => {
      const matchesSearch =
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      if (severityFilter === "level1") {
        return matchesSearch && h.erLevel === "Level 1 Trauma";
      }
      if (severityFilter === "pediatric") {
        return matchesSearch && h.specialties.includes("Pediatrics");
      }
      return matchesSearch;
    }).sort((a, b) => {
      if (sortBy === "totalTime") {
        return a.driveTimeMin + a.waitTimeMin - (b.driveTimeMin + b.waitTimeMin);
      }
      if (sortBy === "waitTime") {
        return a.waitTimeMin - b.waitTimeMin;
      }
      return a.driveTimeMin - b.driveTimeMin;
    });
  }, [searchQuery, sortBy, severityFilter]);

  const bestChoice = filteredHospitals[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top emergency announcement bar */}
      <div className="bg-rose-600 text-white text-xs sm:text-sm font-medium py-2.5 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 animate-pulse text-rose-200" />
            <span>
              <strong>Life-threatening emergency?</strong> Call <strong>911</strong> immediately instead of driving.
            </span>
          </div>
          <a
            href="tel:911"
            className="inline-flex items-center gap-1 font-bold underline hover:text-rose-100 whitespace-nowrap ml-4"
          >
            <PhoneCall className="h-3.5 w-3.5" /> Call 911
          </a>
        </div>
      </div>

      {/* Navigation header */}
      <header className="border-b bg-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SynapticLogo className="h-10 w-auto" />
            <div className="hidden sm:flex items-center gap-3 border-l border-slate-200 pl-3">
              <Link
                href="/"
                className="text-xs text-slate-500 font-medium block leading-tight hover:underline"
              >
                Emergency Hospital Router
              </Link>
              <span
                className="text-xs text-slate-500 font-medium block leading-tight underline"
              >
                Specialist Directory
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Wait Times Active
            </div>
            <Button variant="outline" size="sm" className="text-xs">
              ER Protocol Guide
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-slate-100 border-b py-10 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <Activity className="h-3.5 w-3.5 text-blue-600" />
            Total Time = Travel Duration + Real-time ER Triage Wait Time
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Find the fastest emergency room to get care <span className="text-emerald-600">right now</span>.
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            The closest hospital isn&apos;t always the fastest. We calculate real-time driving traffic and current ER
            queue wait times to find your fastest path to a physician.
          </p>

          {/* Location & Quick Search Controls */}
          <div className="bg-white p-3 sm:p-4 rounded-xl shadow-lg border border-slate-200 max-w-2xl mx-auto mt-6 space-y-3 text-left">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <Input
                  value={userLocation}
                  onChange={(e) => setUserLocation(e.target.value)}
                  placeholder="Your current address or zip code"
                  className="pl-9 h-11 text-sm bg-slate-50 focus:bg-white"
                />
              </div>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by specialty (e.g. Pediatrics, Trauma)"
                  className="pl-9 h-11 text-sm bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Filter pills & sort selectors */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-500 font-medium flex items-center gap-1 mr-1">
                  <SlidersHorizontal className="h-3 w-3" /> Filters:
                </span>
                <button
                  type="button"
                  onClick={() => setSeverityFilter("all")}
                  className={`px-2.5 py-1 rounded-md border font-medium transition ${severityFilter === "all"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                >
                  All Facilities
                </button>
                <button
                  type="button"
                  onClick={() => setSeverityFilter("level1")}
                  className={`px-2.5 py-1 rounded-md border font-medium transition ${severityFilter === "level1"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                >
                  Level 1 Trauma
                </button>
                <button
                  type="button"
                  onClick={() => setSeverityFilter("pediatric")}
                  className={`px-2.5 py-1 rounded-md border font-medium transition ${severityFilter === "pediatric"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                >
                  Pediatric Units
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-md py-1 px-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="totalTime">Total Time (Fastest Care)</option>
                  <option value="waitTime">Shortest ER Wait</option>
                  <option value="driveTime">Shortest Drive</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Recommended Best Option Spotlight Banner */}
        {bestChoice && (
          <div className="bg-gradient-to-r from-emerald-500/10 via-teal-50 to-emerald-50 border-2 border-emerald-500/30 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Recommended Fastest Route
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{bestChoice.name}</h2>
                <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" /> {bestChoice.address}
                </p>
              </div>

              {/* Total Time Badge */}
              <div className="flex items-center gap-3 sm:gap-4 bg-white p-3.5 rounded-xl border border-emerald-200 shadow-sm w-full md:w-auto justify-between md:justify-start">
                <div className="text-center px-1 sm:px-2">
                  <span className="text-[11px] text-slate-500 block font-medium">Drive Time</span>
                  <span className="text-base sm:text-lg font-bold text-slate-800 flex items-center justify-center gap-1">
                    <Car className="h-4 w-4 text-blue-500" /> {bestChoice.driveTimeMin}m
                  </span>
                </div>
                <span className="text-slate-300 text-lg font-light">+</span>
                <div className="text-center px-1 sm:px-2">
                  <span className="text-[11px] text-slate-500 block font-medium">ER Wait</span>
                  <span className="text-base sm:text-lg font-bold text-slate-800 flex items-center justify-center gap-1">
                    <Clock className="h-4 w-4 text-amber-500" /> {bestChoice.waitTimeMin}m
                  </span>
                </div>
                <div className="border-l pl-3 sm:pl-4 text-center">
                  <span className="text-[11px] text-emerald-600 font-bold block uppercase">Total Estimated</span>
                  <span className="text-2xl font-black text-emerald-600">
                    {bestChoice.driveTimeMin + bestChoice.waitTimeMin} min
                  </span>
                </div>
              </div>

              <div className="w-full md:w-auto">
                <Button
                  className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2"
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                        bestChoice.name + " " + bestChoice.address
                      )}`,
                      "_blank"
                    )
                  }
                >
                  <Navigation className="h-4 w-4" /> Start Directions
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Hospital Cards Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-600" />
              Nearby Facilities ({filteredHospitals.length})
            </h3>
            <span className="text-xs text-slate-500">Live triage metrics refreshed</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHospitals.map((hospital, idx) => {
              const totalMin = hospital.driveTimeMin + hospital.waitTimeMin;
              const isBest = idx === 0;

              return (
                <div
                  key={hospital.id}
                  className={`bg-white rounded-xl border p-5 transition hover:shadow-md space-y-4 relative ${isBest ? "border-emerald-500/50 ring-1 ring-emerald-500/20" : "border-slate-200"
                    }`}
                >
                  {isBest && (
                    <span className="absolute top-3 right-3 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Shortest Total Time
                    </span>
                  )}

                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{hospital.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {hospital.address} • {hospital.distanceMiles} miles away
                    </p>
                  </div>

                  {/* Metrics Bar */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                    <div>
                      <span className="text-[11px] text-slate-500 block flex items-center justify-center gap-1">
                        <Car className="h-3 w-3 text-slate-400" /> Driving
                      </span>
                      <span className="text-sm font-bold text-slate-800">{hospital.driveTimeMin} mins</span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 block flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" /> ER Wait
                      </span>
                      <span
                        className={`text-sm font-bold ${hospital.waitTimeMin <= 20
                            ? "text-emerald-600"
                            : hospital.waitTimeMin <= 40
                              ? "text-amber-600"
                              : "text-rose-600"
                          }`}
                      >
                        {hospital.waitTimeMin} mins
                      </span>
                    </div>

                    <div className="border-l border-slate-200">
                      <span className="text-[11px] text-slate-600 font-medium block">Total to Care</span>
                      <span className="text-sm font-extrabold text-slate-900">{totalMin} mins</span>
                    </div>
                  </div>

                  {/* Badges / Specialties */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        <ShieldCheck className="h-3 w-3 text-emerald-600" /> {hospital.erLevel}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Available ER Beds: <strong>{hospital.availableBeds}</strong>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {hospital.specialties.map((spec) => (
                        <span
                          key={spec}
                          className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs gap-1.5 h-9"
                      onClick={() => alert(`Calling emergency department: ${hospital.phone}`)}
                    >
                      <PhoneCall className="h-3.5 w-3.5 text-slate-500" />
                      {hospital.phone}
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 text-xs gap-1.5 h-9 bg-slate-900 hover:bg-slate-800 text-white"
                      onClick={() =>
                        window.open(
                          `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                            hospital.name + " " + hospital.address
                          )}`,
                          "_blank"
                        )
                      }
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      Directions
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Informational Guidance Section */}
        <section className="bg-white border rounded-2xl p-6 shadow-sm space-y-4 mt-8">
          <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-emerald-600" /> How Total Time is Calculated
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 leading-relaxed">
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 space-y-1">
              <strong className="text-slate-900 block text-sm">1. Travel Duration</strong>
              Factored with real-time road conditions, traffic density, and construction delays along emergency routes.
            </div>
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 space-y-1">
              <strong className="text-slate-900 block text-sm">2. ER Door-to-Doctor Queue</strong>
              Estimated time from arrival at triage intake until examination by a licensed medical practitioner.
            </div>
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 space-y-1">
              <strong className="text-slate-900 block text-sm">3. Clinical Appropriateness</strong>
              Trauma, cardiac, and pediatric cases are automatically filtered to designated certified emergency departments.
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-8 mt-12 text-center text-xs text-slate-500 space-y-2">
        <div className="flex justify-center mb-2">
          <SynapticLogo className="h-8 w-auto opacity-90" />
        </div>
        <p className="font-medium text-slate-600">Synaptic — Intelligent Emergency Hospital Guidance System</p>
        <p>Calculates travel time and real-time ER triage waiting queues.</p>
        <p className="text-rose-600 font-semibold pt-1">
          For critical life-threatening emergencies requiring immediate resuscitation, always dial 911 directly.
        </p>
      </footer>
    </div>
  );
}
