"use client";

import { Button } from "@ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";
import { Input } from "@ui/components/ui/input";
import {
  AlertTriangle,
  ChevronDown,
  MapPin,
  PhoneCall,
  Search,
  Activity,
  SlidersHorizontal,
  User2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SynapticLogo } from "../logo";

interface Specialist {
  id: number;
  displayName: string;
  specialty: string;
  languages: string[];
  location: string | null;
  acceptingNewPatients: boolean;
}

async function getSpecialists(): Promise<Specialist[]> {
  const response = await fetch("http://localhost:3001/api/specialists", {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Failed to load specialists (${response.status})`);
  }

  return response.json();
}

export default function Page() {
  const [searchQuery, setSearchQuery] = useState("");
  const [language, setLanguage] = useState("All Languages");
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [acceptingOnly, setAcceptingOnly] = useState(false);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getSpecialists()
      .then((results) => {
        if (isMounted) {
          setSpecialists(results);
          setAvailableLanguages(
            Array.from(new Set(results.flatMap((specialist) => specialist.languages))).sort()
          );
          setLoading(false);
        }
      })
      .catch((requestError: unknown) => {
        if (isMounted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Failed to load specialists"
          );
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredSpecialists = useMemo(() => {
    return specialists.filter((specialist) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        specialist.displayName.toLowerCase().includes(query) ||
        specialist.specialty.toLowerCase().includes(query);
      const matchesLanguage =
        language === "All Languages" || specialist.languages.includes(language);
      const matchesAvailability =
        !acceptingOnly || specialist.acceptingNewPatients;

      return matchesSearch && matchesLanguage && matchesAvailability;
    });
  }, [specialists, searchQuery, language, acceptingOnly]);

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
              <Link
                href="/"
                className="text-xs text-slate-400 font-medium block leading-tight hover:text-slate-200 transition-colors"
              >
                Emergency Hospital Router
              </Link>
              <span
                className="text-xs text-indigo-400 font-semibold block leading-tight"
              >
                Specialist Directory
              </span>
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
            Specialist Physician Directory &amp; Real-time Access
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Connect with board-certified specialists <span className="text-indigo-400">near you</span>.
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Find vetted ENT, pediatric, cardiology, and orthopedics specialists alongside real-time urgent clinics for intermediate care.
          </p>

          {/* Quick Search Controls */}
          <div className="bg-slate-900/90 p-3 sm:p-4 rounded-2xl shadow-2xl border border-slate-800 max-w-2xl mx-auto mt-6 space-y-3 text-left backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by specialty (e.g. Pediatrics, Trauma, ENT)"
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
                      className="h-auto gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium"
                      aria-label={`Language: ${language}`}
                    >
                      {language}
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuRadioGroup
                      value={language}
                      onValueChange={setLanguage}
                    >
                      <DropdownMenuRadioItem value="All Languages">
                        All Languages
                      </DropdownMenuRadioItem>
                      {availableLanguages.map((availableLanguage) => (
                        <DropdownMenuRadioItem
                          key={availableLanguage}
                          value={availableLanguage}
                        >
                          {availableLanguage}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <button
                  type="button"
                  onClick={() => setAcceptingOnly(false)}
                  className={`px-2.5 py-1 rounded-md border font-medium transition ${!acceptingOnly
                    ? "bg-white text-slate-600 border-slate-200"
                    : "bg-slate-900 text-white border-slate-900 hover:bg-slate-50 hover:text-slate-600"
                    }`}
                >
                  All Specialists
                </button>
                <button
                  type="button"
                  onClick={() => setAcceptingOnly(true)}
                  className={`px-2.5 py-1 rounded-md border font-medium transition ${acceptingOnly
                    ? "bg-white text-slate-600 border-slate-200"
                    : "bg-slate-900 text-white border-slate-900 hover:bg-slate-50 hover:text-slate-600"
                    }`}
                >
                  Accepting New Patients
                </button>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Specialist Cards Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <User2 className="h-4 w-4 text-indigo-400" />
              Matching Specialists ({filteredSpecialists.length})
            </h3>
            <span className="text-xs text-slate-400">Live triage metrics refreshed</span>
          </div>

          {loading && <p className="text-sm text-white-500">Loading specialists...</p>}
          {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
          {!loading && !error && filteredSpecialists.length === 0 && (
            <p className="text-sm text-slate-500">No specialists found.</p>
          )}

          {!loading && !error && filteredSpecialists.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSpecialists.map((specialist) => (
                <div
                  key={specialist.id}
                  className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 transition hover:shadow-xl space-y-4 relative"
                >
                  <div>
                    <h4 className="font-bold text-white text-base">
                      {specialist.displayName}
                    </h4>
                    {specialist.location && (
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-500" /> {specialist.location}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                      {specialist.specialty}
                    </span>
                    {specialist.languages.map((specialistLanguage) => (
                      <span
                        key={specialistLanguage}
                        className="text-[10px] bg-indigo-950/60 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800/50"
                      >
                        {specialistLanguage}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center gap-2 border-t border-slate-800/80">
                    <span className={`text-xs font-medium ${specialist.acceptingNewPatients ? "text-emerald-700" : "text-slate-500"}`}>
                      {specialist.acceptingNewPatients
                        ? "Accepting new patients"
                        : "Not accepting new patients"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
