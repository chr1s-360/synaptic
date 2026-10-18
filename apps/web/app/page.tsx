"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";
import { Input } from "@ui/components/ui/input";
import { SynapticLogo } from "./logo";
import InteractiveMap, { FacilityMarker } from "./map";
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
  Compass,
  ExternalLink,
  Layers,
  Loader2,
  ChevronDown,
} from "lucide-react";

interface HospitalItem {
  id: string;
  name: string;
  address: string;
  phone: string;
  distanceMiles: number;
  driveTimeMin: number;
  waitTimeMin: number;
  erLevel: string;
  rating: number;
  availableBeds: number;
  specialties: string[];
  lat: number;
  lng: number;
}

const FACILITY_TYPE_OPTIONS = [
  { value: "all", label: "Facility" },
  { value: "hospital", label: "Hospital" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "walk-in clinic", label: "Walk-in" },
  { value: "er", label: "ER" },
] as const;

const SAMPLE_HOSPITALS: HospitalItem[] = [
  {
    id: "1",
    name: "Toronto General Hospital",
    address: "200 Elizabeth St, Toronto, ON M5G 2C4",
    phone: "(416) 340-4800",
    distanceMiles: 1.2,
    driveTimeMin: 8,
    waitTimeMin: 18,
    erLevel: "Level 1 Trauma",
    rating: 4.8,
    availableBeds: 14,
    specialties: ["Cardiac Care", "Transplant Unit", "Stroke Center", "Trauma"],
    lat: 43.6591,
    lng: -79.3882,
  },
  {
    id: "2",
    name: "Mount Sinai Hospital",
    address: "600 University Ave, Toronto, ON M5G 1X5",
    phone: "(416) 586-4800",
    distanceMiles: 1.1,
    driveTimeMin: 7,
    waitTimeMin: 42,
    erLevel: "Level 2 Trauma",
    rating: 4.6,
    availableBeds: 6,
    specialties: ["General ER", "Women & Infants", "Urgent Surgery"],
    lat: 43.6575,
    lng: -79.3905,
  },
  {
    id: "3",
    name: "St. Michael's Hospital",
    address: "36 Queen St E, Toronto, ON M5B 1W8",
    phone: "(416) 360-4000",
    distanceMiles: 0.8,
    driveTimeMin: 5,
    waitTimeMin: 14,
    erLevel: "Level 1 Trauma",
    rating: 4.9,
    availableBeds: 21,
    specialties: ["Level 1 Adult Trauma", "Neurosurgery", "Cardiac Care"],
    lat: 43.6534,
    lng: -79.3772,
  },
  {
    id: "4",
    name: "SickKids (Hospital for Sick Children)",
    address: "555 University Ave, Toronto, ON M5G 1X8",
    phone: "(416) 813-1500",
    distanceMiles: 1.3,
    driveTimeMin: 9,
    waitTimeMin: 22,
    erLevel: "Level 1 Trauma",
    rating: 4.9,
    availableBeds: 18,
    specialties: ["Pediatrics", "Pediatric Trauma", "Child Emergency"],
    lat: 43.6578,
    lng: -79.3867,
  },
  {
    id: "5",
    name: "Sunnybrook Health Sciences Centre",
    address: "2075 Bayview Ave, Toronto, ON M4N 3M5",
    phone: "(416) 480-6100",
    distanceMiles: 5.4,
    driveTimeMin: 18,
    waitTimeMin: 16,
    erLevel: "Level 1 Trauma",
    rating: 4.7,
    availableBeds: 25,
    specialties: ["Comprehensive Trauma", "Burn Centre", "Brain Sciences"],
    lat: 43.7250,
    lng: -79.3764,
  },
  {
    id: "6",
    name: "Michael Garron Hospital",
    address: "825 Coxwell Ave, East York, ON M4C 3E7",
    phone: "(416) 469-6580",
    distanceMiles: 4.5,
    driveTimeMin: 15,
    waitTimeMin: 28,
    erLevel: "Community Emergency",
    rating: 4.3,
    availableBeds: 9,
    specialties: ["Community Care", "Rapid Diagnostics", "Orthopedics"],
    lat: 43.6908,
    lng: -79.3242,
  },
];

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlQuery = searchParams.get("query") || "";
  const urlFilter = searchParams.get("filter") || "all";
  const urlSort = (searchParams.get("sortBy") as any) || "totalTime";

  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [userLocation, setUserLocation] = useState("Toronto, ON (detected)");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number; label: string }>({
    lat: 43.6532,
    lng: -79.3832,
    label: "Current Location (Toronto City Hall)",
  });

  const [hospitals, setHospitals] = useState<HospitalItem[]>(SAMPLE_HOSPITALS);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>("3");
  const [sortBy, setSortBy] = useState<"totalTime" | "waitTime" | "driveTime">(urlSort);
  const [severityFilter, setSeverityFilter] = useState<"all" | "level1" | "pediatric" | "hospital" | "pharmacy" | "walk-in clinic" | "er">(
    (urlFilter as any) || "all"
  );
  const [mapMode, setMapMode] = useState<"interactive" | "streamlit">("interactive");
  const [loading, setLoading] = useState<boolean>(false);
  const [totalDatasetCount, setTotalDatasetCount] = useState<number>(SAMPLE_HOSPITALS.length);

  // Synchronize state with URL parameters (router-driven)
  const updateRoute = (newQuery: string, newFilter: string, newSort: string) => {
    const params = new URLSearchParams();
    if (newQuery) params.set("query", newQuery);
    if (newFilter && newFilter !== "all") params.set("filter", newFilter);
    if (newSort && newSort !== "totalTime") params.set("sortBy", newSort);
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  // Fetch real facilities from the 11,625-row healthcare CSV via router parameters
  useEffect(() => {
    let ignore = false;
    async function fetchFacilities() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set("query", searchQuery.trim());
        if (severityFilter !== "all") params.set("filter", severityFilter);
        params.set("sortBy", sortBy);
        params.set("limit", "100");

        const res = await fetch(`/api/facilities?${params.toString()}`);
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        if (!ignore && data.facilities) {
          setHospitals(data.facilities);
          setTotalDatasetCount(data.totalCount || data.facilities.length);
          if (data.facilities.length > 0) {
            setSelectedHospitalId(data.facilities[0].id);
          }
        }
      } catch (err) {
        console.warn("Failed loading live CSV facilities, using fallback:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchFacilities();
    }, 250);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [searchQuery, severityFilter, sortBy]);

  const bestChoice = hospitals[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top emergency announcement bar */}
      <div className="bg-rose-950/80 border-b border-rose-800/60 text-rose-200 text-xs sm:text-sm font-medium py-2 px-4 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 animate-pulse text-rose-400" />
            <span>
              <strong className="text-white">Life-threatening emergency?</strong> Call <strong className="text-white">911</strong> immediately instead of driving.
            </span>
          </div>
          <a
            href="tel:911"
            className="inline-flex items-center gap-1 font-bold text-rose-300 underline hover:text-white whitespace-nowrap ml-4 transition-colors"
          >
            <PhoneCall className="h-3.5 w-3.5" /> Call 911
          </a>
        </div>
      </div>

      {/* Navigation header */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SynapticLogo className="h-10 w-auto text-white" />
            <div className="hidden sm:flex items-center gap-3 border-l border-slate-800 pl-3">
              <span
                className="text-xs text-indigo-400 font-semibold block leading-tight"
              >
                Emergency Hospital Router
              </span>
              <Link
                href="/specialist-directory"
                className="text-xs text-slate-400 font-medium block leading-tight hover:text-slate-200 transition-colors"
              >
                Specialist Directory
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/60">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Wait Times Active
            </div>
            <Button variant="outline" size="sm" className="text-xs bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white">
              ER Protocol Guide
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-b border-slate-800/80 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 text-xs font-semibold backdrop-blur-sm">
            <Activity className="h-3.5 w-3.5 text-indigo-400" />
            Total Time = Travel Duration + Real-time ER Triage Wait Time
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Find the fastest emergency room to get care <span className="text-emerald-400">right now</span>.
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            The closest hospital isn&apos;t always the fastest. We calculate real-time driving traffic and current ER
            queue wait times to find your fastest path to a physician.
          </p>

          {/* Location & Quick Search Controls */}
          <div className="bg-slate-900/90 p-3 sm:p-4 rounded-2xl shadow-2xl border border-slate-800 max-w-2xl mx-auto mt-6 space-y-3 text-left backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    updateRoute(val, severityFilter, sortBy);
                  }}
                  placeholder="Search health facilities (e.g. Toronto General, SickKids, Pharmacy, Clinic)..."
                  className="pl-9 h-11 text-sm bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Filter pills & sort selectors */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400 font-medium flex items-center gap-1 mr-1">
                  <SlidersHorizontal className="h-3 w-3" /> Filters:
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto gap-1.5 rounded-md border-slate-800 bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white"
                    >
                      {FACILITY_TYPE_OPTIONS.find(
                        (option) => option.value === severityFilter
                      )?.label ?? "Facility Type"}
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuRadioGroup
                      value={
                        FACILITY_TYPE_OPTIONS.some(
                          (option) => option.value === severityFilter
                        )
                          ? severityFilter
                          : ""
                      }
                      onValueChange={(value) => {
                        const selectedOption = FACILITY_TYPE_OPTIONS.find(
                          (option) => option.value === value
                        );
                        if (selectedOption) {
                          setSeverityFilter(selectedOption.value);
                          updateRoute(searchQuery, selectedOption.value, sortBy);
                        }
                      }}
                    >
                      {FACILITY_TYPE_OPTIONS.map((option) => (
                        <DropdownMenuRadioItem
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <button
                  type="button"
                  onClick={() => {
                    setSeverityFilter("level1");
                    updateRoute(searchQuery, "level1", sortBy);
                  }}
                  className={`px-2.5 py-1 rounded-md border font-medium transition ${severityFilter === "level1"
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                >
                  Level 1 Trauma
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSeverityFilter("pediatric");
                    updateRoute(searchQuery, "pediatric", sortBy);
                  }}
                  className={`px-2.5 py-1 rounded-md border font-medium transition ${severityFilter === "pediatric"
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                >
                  Pediatric Units
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setSortBy(val);
                    updateRoute(searchQuery, severityFilter, val);
                  }}
                  className="bg-slate-950 border border-slate-800 rounded-md py-1 px-2.5 text-xs font-medium text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="totalTime">Total Time (Fastest Care)</option>
                  <option value="waitTime">Shortest ER Wait</option>
                  <option value="driveTime">Shortest Drive</option>
                  <option value="distance">Nearest Distance</option>
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
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/40 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 border border-emerald-700/60 px-2.5 py-0.5 rounded-full">
                  <BadgeCheck className="h-3.5 w-3.5 text-emerald-400" />
                  Recommended Fastest Route
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">{bestChoice.name}</h2>
                <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" /> {bestChoice.address}
                </p>
              </div>

              {/* Total Time Badge */}
              <div className="flex items-center gap-3 sm:gap-4 bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 shadow-md w-full md:w-auto justify-between md:justify-start">
                <div className="text-center px-1 sm:px-2">
                  <span className="text-[11px] text-slate-400 block font-medium">Drive Time</span>
                  <span className="text-base sm:text-lg font-bold text-blue-400 flex items-center justify-center gap-1">
                    <Car className="h-4 w-4 text-blue-400" /> {bestChoice.driveTimeMin}m
                  </span>
                </div>
                <span className="text-slate-600 text-lg font-light">+</span>
                <div className="text-center px-1 sm:px-2">
                  <span className="text-[11px] text-slate-400 block font-medium">ER Wait</span>
                  <span className="text-base sm:text-lg font-bold text-amber-400 flex items-center justify-center gap-1">
                    <Clock className="h-4 w-4 text-amber-400" /> {bestChoice.waitTimeMin}m
                  </span>
                </div>
                <div className="border-l border-slate-800 pl-3 sm:pl-4 text-center">
                  <span className="text-[11px] text-emerald-400 font-bold block uppercase">Total Estimated</span>
                  <span className="text-2xl font-black text-emerald-400">
                    {bestChoice.driveTimeMin + bestChoice.waitTimeMin} min
                  </span>
                </div>
              </div>

              <div className="w-full md:w-auto">
                <Button
                  className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40"
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

        {/* Interactive Accessibility Map Container */}
        <section className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/70">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Interactive Healthcare Travel-Time Map
                  <span className="text-[11px] font-semibold text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-700/60">
                    Live OpenStreetMap
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time hospital facility mapping with total travel-time bands to emergency care
                </p>
              </div>
            </div>

            {/* Map Mode Toggle & External Link */}
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-xs shadow-xs">
                <button
                  type="button"
                  onClick={() => setMapMode("interactive")}
                  className={`px-3 py-1 font-medium rounded-md transition ${mapMode === "interactive"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                    }`}
                >
                  Native Interactive Map
                </button>
                <button
                  type="button"
                  onClick={() => setMapMode("streamlit")}
                  className={`px-3 py-1 font-medium rounded-md transition ${mapMode === "streamlit"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                    }`}
                >
                  Streamlit Routing Hub
                </button>
              </div>

              <a
                href="http://localhost:8501"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 shadow-xs transition"
              >
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" /> Full Screen
              </a>
            </div>
          </div>

          <div className="relative w-full bg-slate-950">
            {mapMode === "interactive" ? (
              <InteractiveMap
                userLocation={userCoords}
                facilities={hospitals.map((h) => ({
                  id: h.id,
                  name: h.name,
                  type: h.erLevel,
                  address: h.address,
                  lat: h.lat,
                  lng: h.lng,
                  driveTimeMin: h.driveTimeMin,
                  waitTimeMin: h.waitTimeMin,
                  totalTimeMin: h.driveTimeMin + h.waitTimeMin,
                }))}
                selectedFacilityId={selectedHospitalId}
                onSelectFacility={(id) => setSelectedHospitalId(id)}
                height="560px"
              />
            ) : (
              <div className="h-[620px] w-full">
                <iframe
                  src="http://localhost:8501/?embedded=true"
                  title="Synaptic Healthcare Travel-Time Accessibility Map"
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              </div>
            )}
          </div>

          <div className="p-3.5 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-medium text-slate-300">
                <Layers className="h-3.5 w-3.5 text-slate-500" /> Time to Care Bands:
              </span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#16803C]"></span> &le; 20m</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#2563EB]"></span> 21–35m</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#D97706]"></span> 36–50m</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#DC2626]"></span> &gt; 50m</span>
            </div>
            <span>Click any marker to view triage metrics &amp; direct navigation</span>
          </div>
        </section>

        {/* Hospital Cards Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-400" />
              Healthcare Facilities Found ({hospitals.length} of {totalDatasetCount})
              {loading && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
            </h3>
            <span className="text-xs text-slate-400">Live triage metrics from Ontario dataset</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hospitals.map((hospital, idx) => {
              const totalMin = hospital.driveTimeMin + hospital.waitTimeMin;
              const isBest = idx === 0;

              return (
                <div
                  key={hospital.id}
                  className={`bg-slate-900/90 rounded-2xl border p-5 transition hover:shadow-xl space-y-4 relative ${isBest ? "border-emerald-500/50 ring-1 ring-emerald-500/20" : "border-slate-800"
                    }`}
                >
                  {isBest && (
                    <span className="absolute top-3 right-3 bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Shortest Total Time
                    </span>
                  )}

                  <div>
                    <h4 className="font-bold text-white text-base">{hospital.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-500" /> {hospital.address} • {hospital.distanceMiles} miles away
                    </p>
                  </div>

                  {/* Metrics Bar */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
                    <div>
                      <span className="text-[11px] text-slate-400 block flex items-center justify-center gap-1">
                        <Car className="h-3 w-3 text-blue-400" /> Driving
                      </span>
                      <span className="text-sm font-bold text-slate-200">{hospital.driveTimeMin} mins</span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3 text-amber-400" /> ER Wait
                      </span>
                      <span
                        className={`text-sm font-bold ${hospital.waitTimeMin <= 20
                          ? "text-emerald-400"
                          : hospital.waitTimeMin <= 40
                            ? "text-amber-400"
                            : "text-rose-400"
                          }`}
                      >
                        {hospital.waitTimeMin} mins
                      </span>
                    </div>

                    <div className="border-l border-slate-800">
                      <span className="text-[11px] text-slate-400 font-medium block">Total to Care</span>
                      <span className="text-sm font-extrabold text-white">{totalMin} mins</span>
                    </div>
                  </div>

                  {/* Badges / Specialties */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                        <ShieldCheck className="h-3 w-3 text-emerald-400" /> {hospital.erLevel}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Available ER Beds: <strong className="text-slate-200">{hospital.availableBeds}</strong>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {hospital.specialties.map((spec) => (
                        <span
                          key={spec}
                          className="text-[10px] bg-indigo-950/60 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800/50"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center gap-2 border-t border-slate-800/80">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs gap-1.5 h-9 bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300"
                      onClick={() => alert(`Calling emergency department: ${hospital.phone}`)}
                    >
                      <PhoneCall className="h-3.5 w-3.5 text-slate-400" />
                      {hospital.phone}
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 text-xs gap-1.5 h-9 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
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
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 mt-8">
          <h4 className="font-bold text-white text-base flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-emerald-400" /> How Total Time is Calculated
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400 leading-relaxed">
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <strong className="text-slate-200 block text-sm">1. Travel Duration</strong>
              Factored with real-time road conditions, traffic density, and construction delays along emergency routes.
            </div>
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <strong className="text-slate-200 block text-sm">2. ER Door-to-Doctor Queue</strong>
              Estimated time from arrival at triage intake until examination by a licensed medical practitioner.
            </div>
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <strong className="text-slate-200 block text-sm">3. Clinical Appropriateness</strong>
              Trauma, cardiac, and pediatric cases are automatically filtered to designated certified emergency departments.
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 mt-12 text-center text-xs text-slate-400 space-y-2">
        <div className="flex justify-center mb-2">
          <SynapticLogo className="h-8 w-auto opacity-90 text-white" />
        </div>
        <p className="font-medium text-slate-300">Synaptic — Intelligent Emergency Hospital Guidance System</p>
        <p className="text-slate-500">Calculates travel time and real-time ER triage waiting queues.</p>
        <p className="text-rose-400 font-semibold pt-1">
          For critical life-threatening emergencies requiring immediate resuscitation, always dial 911 directly.
        </p>
      </footer>
    </div>
  );
}
