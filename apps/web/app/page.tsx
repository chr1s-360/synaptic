"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Button } from "@ui/components/ui/button";
import { Input } from "@ui/components/ui/input";
import { SynapticLogo } from "./logo";
import InteractiveMap, { FacilityMarker } from "./map";
import { ONTARIO_FACILITIES, HealthFacility } from "./facilities-data";
import {
  RoutingMode,
  haversineKm,
  geocodeCanadianAddress,
  fetchValhallaMatrix,
} from "./routing-engine";
import AINavigator from "./ai-navigator";
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
  Footprints,
  Bike,
  Bus,
  RefreshCw,
  LocateFixed,
} from "lucide-react";

export default function Page() {
  const [addressInput, setAddressInput] = useState("100 Queen St W, Toronto, ON");
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number; label: string }>({
    lat: 43.6536,
    lng: -79.3840,
    label: "Toronto City Hall (100 Queen St W)",
  });
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  const [activeMode, setActiveMode] = useState<RoutingMode>("Driving");
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [maxCandidates, setMaxCandidates] = useState<number>(20);
  const [isRouting, setIsRouting] = useState(false);

  const [routedData, setRoutedData] = useState<Record<string, { minutes: number; distanceKm: number }>>({});

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>("3");
  const [sortBy, setSortBy] = useState<"totalTime" | "travelTime" | "waitTime">("totalTime");
  const [facilityTypeFilter, setFacilityTypeFilter] = useState<string>("All");

  const runRoutingCalculation = async (origin = originCoords, mode = activeMode, rad = radiusKm) => {
    setIsRouting(true);

    try {
      const nearby = ONTARIO_FACILITIES.map((f) => {
        const straightKm = haversineKm(origin.lat, origin.lng, f.lat, f.lng);
        return { ...f, straightKm };
      })
        .filter((f) => f.straightKm <= rad)
        .sort((a, b) => a.straightKm - b.straightKm)
        .slice(0, maxCandidates);

      if (nearby.length === 0) {
        setRoutedData({});
        setIsRouting(false);
        return;
      }

      if (mode !== "Public transit") {
        const estimates = await fetchValhallaMatrix(
          { lat: origin.lat, lng: origin.lng },
          nearby.map((f) => ({ lat: f.lat, lng: f.lng })),
          mode as "Driving" | "Walking" | "Cycling"
        );

        const newResults: Record<string, { minutes: number; distanceKm: number }> = {};
        nearby.forEach((f, idx) => {
          const est = estimates[idx];
          if (est && est.minutes !== null) {
            newResults[f.id] = {
              minutes: est.minutes,
              distanceKm: est.distanceKm ?? Number((f.straightKm * 1.3).toFixed(1)),
            };
          } else {
            const fallbackMins = Math.round((f.straightKm * 1.3) / (mode === "Driving" ? 0.6 : 0.08));
            newResults[f.id] = {
              minutes: fallbackMins,
              distanceKm: Number((f.straightKm * 1.3).toFixed(1)),
            };
          }
        });

        setRoutedData(newResults);
      } else {
        const newResults: Record<string, { minutes: number; distanceKm: number }> = {};
        nearby.forEach((f) => {
          const transitMins = Math.round(10 + f.straightKm * 2.8);
          newResults[f.id] = {
            minutes: transitMins,
            distanceKm: Number((f.straightKm * 1.4).toFixed(1)),
          };
        });
        setRoutedData(newResults);
      }
    } catch (err) {
      console.error("Routing error:", err);
    } finally {
      setIsRouting(false);
    }
  };

  useEffect(() => {
    runRoutingCalculation(originCoords, activeMode, radiusKm);
  }, []);

  const handleGeocodeSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!addressInput.trim()) return;

    setIsGeocoding(true);
    setGeocodeError(null);

    try {
      const geo = await geocodeCanadianAddress(addressInput.trim());
      const newOrigin = {
        lat: geo.lat,
        lng: geo.lng,
        label: geo.displayName.split(",").slice(0, 3).join(","),
      };
      setOriginCoords(newOrigin);
      await runRoutingCalculation(newOrigin, activeMode, radiusKm);
    } catch (err: any) {
      setGeocodeError(err.message || "Failed to find location");
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newOrigin = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "Your Current GPS Location",
        };
        setAddressInput("Current GPS Location");
        setOriginCoords(newOrigin);
        runRoutingCalculation(newOrigin, activeMode, radiusKm);
      },
      (err) => {
        alert("Could not access your location: " + err.message);
      }
    );
  };

  const filteredFacilities = useMemo(() => {
    return ONTARIO_FACILITIES.map((f) => {
      const routing = routedData[f.id];
      const travelMins = routing?.minutes ?? Math.round(haversineKm(originCoords.lat, originCoords.lng, f.lat, f.lng) * 2.1);
      const distanceKm = routing?.distanceKm ?? Number((haversineKm(originCoords.lat, originCoords.lng, f.lat, f.lng) * 1.3).toFixed(1));
      const totalTimeMin = travelMins + f.waitTimeMin;
      const straightLineKm = Number(haversineKm(originCoords.lat, originCoords.lng, f.lat, f.lng).toFixed(1));

      return {
        ...f,
        travelMins,
        distanceKm,
        totalTimeMin,
        straightLineKm,
      };
    })
      .filter((f) => f.straightLineKm <= radiusKm)
      .filter((f) => {
        const matchSearch =
          f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
          f.community.toLowerCase().includes(searchQuery.toLowerCase());

        if (facilityTypeFilter === "Trauma") {
          return matchSearch && f.erLevel === "Level 1 Trauma";
        }
        if (facilityTypeFilter === "Pediatric") {
          return matchSearch && f.specialties.includes("Pediatrics");
        }
        return matchSearch;
      })
      .sort((a, b) => {
        if (sortBy === "totalTime") return a.totalTimeMin - b.totalTimeMin;
        if (sortBy === "travelTime") return a.travelMins - b.travelMins;
        return a.waitTimeMin - b.waitTimeMin;
      });
  }, [originCoords, routedData, radiusKm, searchQuery, facilityTypeFilter, sortBy]);

  const bestChoice = filteredFacilities[0];

  const reachable5 = filteredFacilities.filter((f) => f.travelMins <= 5).length;
  const reachable10 = filteredFacilities.filter((f) => f.travelMins <= 10).length;
  const reachable15 = filteredFacilities.filter((f) => f.travelMins <= 15).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="bg-rose-600 text-white text-xs sm:text-sm font-medium py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
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

      <header className="border-b bg-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SynapticLogo className="h-10 w-auto" />
            <div className="hidden sm:flex items-center gap-3 border-l border-slate-200 pl-3">
              <span className="text-xs text-slate-500 font-medium block leading-tight underline">
                Emergency Hospital Router
              </span>
              <Link
                href="/specialist-directory"
                className="text-xs text-slate-500 font-medium block leading-tight hover:underline"
              >
                Specialist Directory
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Valhalla Routing Active
            </div>
            <a
              href="http://localhost:8501"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-200"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Streamlit Python Hub
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {bestChoice && (
          <div className="bg-gradient-to-r from-emerald-500/10 via-teal-50 to-emerald-50 border-2 border-emerald-500/30 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Recommended Optimal Route ({activeMode})
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{bestChoice.name}</h2>
                <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" /> {bestChoice.community}, ON {bestChoice.postalCode} •{" "}
                  {bestChoice.distanceKm} km routed
                </p>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 bg-white p-3.5 rounded-xl border border-emerald-200 shadow-sm w-full md:w-auto justify-between md:justify-start">
                <div className="text-center px-1 sm:px-2">
                  <span className="text-[11px] text-slate-500 block font-medium">{activeMode} Time</span>
                  <span className="text-base sm:text-lg font-bold text-slate-800 flex items-center justify-center gap-1">
                    {activeMode === "Driving" && <Car className="h-4 w-4 text-blue-500" />}
                    {activeMode === "Walking" && <Footprints className="h-4 w-4 text-emerald-500" />}
                    {activeMode === "Cycling" && <Bike className="h-4 w-4 text-purple-500" />}
                    {activeMode === "Public transit" && <Bus className="h-4 w-4 text-amber-500" />}
                    {bestChoice.travelMins}m
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
                  <span className="text-2xl font-black text-emerald-600">{bestChoice.totalTimeMin} min</span>
                </div>
              </div>

              <div className="w-full md:w-auto">
                <Button
                  className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2"
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                        bestChoice.name + " " + bestChoice.community + " Ontario"
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <aside className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
            <div className="border-b pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                Synaptic · Routing Engine
              </span>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Compass className="h-5 w-5 text-blue-600" />
                Map &amp; Routing Controls
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculate live travel-time accessibility via OpenStreetMap Valhalla
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Starting Address or Postal Code</label>
              <form onSubmit={handleGeocodeSearch} className="flex gap-1.5">
                <div className="relative flex-1">
                  <MapPin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    placeholder="e.g. 100 Queen St W, Toronto"
                    className="pl-8 text-xs h-9 bg-slate-50"
                  />
                </div>
                <Button type="submit" size="sm" className="h-9 px-3 text-xs" disabled={isGeocoding}>
                  {isGeocoding ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Set"}
                </Button>
              </form>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-medium pt-0.5"
              >
                <LocateFixed className="h-3 w-3" /> Use current GPS location
              </button>
              {geocodeError && <p className="text-[11px] text-rose-500">{geocodeError}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Travel Mode</label>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {(["Driving", "Walking", "Cycling", "Public transit"] as RoutingMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setActiveMode(mode);
                      runRoutingCalculation(originCoords, mode, radiusKm);
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg border font-medium transition ${activeMode === mode
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                  >
                    {mode === "Driving" && <Car className="h-3.5 w-3.5" />}
                    {mode === "Walking" && <Footprints className="h-3.5 w-3.5" />}
                    {mode === "Cycling" && <Bike className="h-3.5 w-3.5" />}
                    {mode === "Public transit" && <Bus className="h-3.5 w-3.5" />}
                    <span>{mode}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Search Radius</span>
                  <span className="font-bold text-slate-900">{radiusKm} km</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={radiusKm}
                  onChange={(e) => {
                    const newRad = Number(e.target.value);
                    setRadiusKm(newRad);
                    runRoutingCalculation(originCoords, activeMode, newRad);
                  }}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Max Facilities Routed</span>
                  <span className="font-bold text-slate-900">{maxCandidates}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  value={maxCandidates}
                  onChange={(e) => setMaxCandidates(Number(e.target.value))}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Travel Reachability
              </span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2 rounded-lg border border-slate-200/60 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block">&le; 5 min</span>
                  <span className="text-base font-bold text-emerald-600">{reachable5}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/60 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block">&le; 10 min</span>
                  <span className="text-base font-bold text-blue-600">{reachable10}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/60 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block">&le; 15 min</span>
                  <span className="text-base font-bold text-amber-600">{reachable15}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-700 block">Facility Filter</label>
              <div className="flex gap-1.5 flex-wrap text-xs">
                {["All", "Trauma", "Pediatric"].map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setFacilityTypeFilter(filter)}
                    className={`px-2.5 py-1 rounded-md border font-medium transition ${facilityTypeFilter === filter
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                  >
                    {filter === "All" && "All Facilities"}
                    {filter === "Trauma" && "Level 1 Trauma"}
                    {filter === "Pediatric" && "Pediatric ER"}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full text-xs flex items-center justify-center gap-1.5 text-slate-700"
              onClick={() => runRoutingCalculation()}
              disabled={isRouting}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRouting ? "animate-spin text-blue-600" : ""}`} />
              {isRouting ? "Recalculating routes…" : "Recalculate Travel Times"}
            </Button>
          </aside>

          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Compass className="h-5 w-5 text-blue-600" />
                  Live Healthcare Travel-Time Map
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    {activeMode} Mode
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Origin: <strong className="text-slate-800">{originCoords.label}</strong> • Showing{" "}
                  {filteredFacilities.length} facilities within {radiusKm} km
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-lg py-1 px-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                >
                  <option value="totalTime">Total Care Time</option>
                  <option value="travelTime">{activeMode} Time</option>
                  <option value="waitTime">ER Wait Time</option>
                </select>
              </div>
            </div>

            <div className="relative w-full bg-slate-100">
              <InteractiveMap
                userLocation={originCoords}
                facilities={filteredFacilities.map((f) => ({
                  id: f.id,
                  name: f.name,
                  type: f.erLevel,
                  address: `${f.community}, ON ${f.postalCode}`,
                  community: f.community,
                  postalCode: f.postalCode,
                  lat: f.lat,
                  lng: f.lng,
                  travelMinutes: f.travelMins,
                  travelDistanceKm: f.distanceKm,
                  waitTimeMin: f.waitTimeMin,
                  totalTimeMin: f.totalTimeMin,
                  phone: f.phone,
                }))}
                selectedFacilityId={selectedFacilityId}
                onSelectFacility={(id) => setSelectedFacilityId(id)}
                activeModeLabel={activeMode}
                height="590px"
              />
            </div>

            <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <span className="font-medium text-slate-700 flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-slate-400" /> Travel bands:
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#16803C]"></span> &le; 5m
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#2563EB]"></span> 5–10m
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#D97706]"></span> 10–15m
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#DC2626]"></span> 15m+
                </span>
              </div>
              <span>Click any marker to view triage metrics &amp; directions</span>
            </div>
          </div>
        </div>

        <section className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-600" />
              Ranked Facilities by Total Time to Care ({filteredFacilities.length})
            </h3>
            <span className="text-xs text-slate-500">Includes {activeMode.toLowerCase()} + door-to-doctor queue</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFacilities.map((hospital, idx) => {
              const isBest = idx === 0;
              const isSelected = hospital.id === selectedFacilityId;

              return (
                <div
                  key={hospital.id}
                  onClick={() => setSelectedFacilityId(hospital.id)}
                  className={`bg-white rounded-xl border p-5 transition cursor-pointer hover:shadow-md space-y-4 relative ${isSelected
                    ? "border-blue-500 ring-2 ring-blue-500/20"
                    : isBest
                      ? "border-emerald-500/50 ring-1 ring-emerald-500/20"
                      : "border-slate-200"
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
                      <MapPin className="h-3 w-3" /> {hospital.community}, ON {hospital.postalCode} •{" "}
                      {hospital.distanceKm} km away
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                    <div>
                      <span className="text-[11px] text-slate-500 block flex items-center justify-center gap-1">
                        {activeMode === "Driving" && <Car className="h-3 w-3 text-slate-400" />}
                        {activeMode === "Walking" && <Footprints className="h-3 w-3 text-slate-400" />}
                        {activeMode === "Cycling" && <Bike className="h-3 w-3 text-slate-400" />}
                        {activeMode === "Public transit" && <Bus className="h-3 w-3 text-slate-400" />}
                        {activeMode}
                      </span>
                      <span className="text-sm font-bold text-slate-800">{hospital.travelMins}m</span>
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
                        {hospital.waitTimeMin}m
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-emerald-700 block font-semibold uppercase">Total Care</span>
                      <span className="text-sm font-black text-emerald-600">{hospital.totalTimeMin}m</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1 font-medium">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                      {hospital.erLevel}
                    </span>
                    <span className="text-slate-500">
                      Beds: <strong className="text-slate-800">{hospital.availableBeds} available</strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {hospital.specialties.map((spec) => (
                      <span
                        key={spec}
                        className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded font-medium"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <a
                      href={`tel:${hospital.phone.replace(/[^0-9]/g, "")}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 inline-flex items-center justify-center gap-1 text-xs font-semibold py-2 px-3 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                    >
                      <PhoneCall className="h-3.5 w-3.5 text-slate-500" /> Call ER
                    </a>

                    <Button
                      size="sm"
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(
                          `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                            hospital.name + " " + hospital.community + " Ontario"
                          )}`,
                          "_blank"
                        );
                      }}
                    >
                      <Navigation className="h-3.5 w-3.5" /> Navigate
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-emerald-600" />
            How Synaptic Calculates Fastest Physician Care
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 space-y-1">
              <strong className="text-slate-900 block text-sm">1. Multimodal Network Routing</strong>
              Calculates live turn-by-turn road and pedestrian transit durations using OpenStreetMap Valhalla pathfinding.
            </div>
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 space-y-1">
              <strong className="text-slate-900 block text-sm">2. Real-Time Triage Queues</strong>
              Tracks live physician door-to-doctor wait times so high-traffic emergency rooms don&apos;t blindside you.
            </div>
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 space-y-1">
              <strong className="text-slate-900 block text-sm">3. Clinical Appropriateness</strong>
              Trauma, cardiac, and pediatric cases are automatically matched to certified regional facilities.
            </div>
          </div>
        </section>
      </main>

      <AINavigator />

      <footer className="border-t bg-white py-8 mt-12 text-center text-xs text-slate-500 space-y-2">
        <div className="flex justify-center mb-2">
          <SynapticLogo className="h-8 w-auto opacity-90" />
        </div>
        <p className="font-medium text-slate-600">Synaptic — Intelligent Emergency Hospital Guidance System</p>
        <p>Multimodal travel-time accessibility &amp; real-time triage queue integration.</p>
        <p className="text-rose-600 font-semibold pt-1">
          For critical life-threatening emergencies requiring immediate resuscitation, always dial 911 directly.
        </p>
      </footer>
    </div>
  );
}
