"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@ui/components/ui/button";
import { Input } from "@ui/components/ui/input";
import { SynapticLogo } from "../logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";
import {
  Clock,
  Car,
  Navigation,
  MapPin,
  Search,
  AlertTriangle,
  Building2,
  User2,
  ShieldCheck,
  PhoneCall,
  Activity,
  SlidersHorizontal,
  BadgeCheck,
  Stethoscope,
  CheckCircle2,
  ChevronDown,
  Calendar,
  Sparkles,
} from "lucide-react";

export interface SpecialistPhysician {
  id: string;
  name: string;
  credentials: string;
  specialty: string;
  category: "ENT" | "Pediatrics" | "Cardiology" | "Dermatology" | "Orthopedics" | "Neurology" | "Allergy";
  focusArea: string;
  hospitalAffiliation: string;
  address: string;
  phone: string;
  acceptingNewPatients: boolean;
  languages: string[];
  rating: number;
  consultWaitDays: number;
}

const VERIFIED_SPECIALISTS: SpecialistPhysician[] = [
  {
    id: "spec-1",
    name: "Dr. Evelyn Vance",
    credentials: "MD, FRCSC",
    specialty: "Pediatric Otolaryngology (ENT)",
    category: "ENT",
    focusArea: "Pediatric Ear Infections, Tympanostomy Tubes, Airway Obstruction & Pediatric Hearing",
    hospitalAffiliation: "The Hospital for Sick Children (SickKids)",
    address: "555 University Ave, Suite 610, Toronto, ON M5G 1X8",
    phone: "(416) 813-6400",
    acceptingNewPatients: true,
    languages: ["English", "French"],
    rating: 4.9,
    consultWaitDays: 7,
  },
  {
    id: "spec-2",
    name: "Dr. Jonathan Hayes",
    credentials: "MD, FRCSC",
    specialty: "Adult & General Otolaryngology (ENT)",
    category: "ENT",
    focusArea: "Chronic Otitis Media, Tinnitus, Sinus Surgery & Voice Disorders",
    hospitalAffiliation: "Toronto General Hospital (UHN)",
    address: "200 Elizabeth St, 7th Floor, Toronto, ON M5G 2C4",
    phone: "(416) 340-4800",
    acceptingNewPatients: true,
    languages: ["English"],
    rating: 4.8,
    consultWaitDays: 12,
  },
  {
    id: "spec-3",
    name: "Dr. Marcus Sterling",
    credentials: "MD, FRCPC",
    specialty: "General Pediatrics & Adolescent Health",
    category: "Pediatrics",
    focusArea: "Pediatric Primary Consults, Childhood Infections, Pediatric Asthma & Development",
    hospitalAffiliation: "Mount Sinai Hospital",
    address: "600 University Ave, Toronto, ON M5G 1X5",
    phone: "(416) 586-4800",
    acceptingNewPatients: true,
    languages: ["English"],
    rating: 4.9,
    consultWaitDays: 5,
  },
  {
    id: "spec-4",
    name: "Dr. Sarah Chen",
    credentials: "MD, FRCPC",
    specialty: "Cardiology & Cardiac Arrhythmia",
    category: "Cardiology",
    focusArea: "Congenital & Adult Heart Disease, Arrhythmia, Palpitations, Hypertension Management",
    hospitalAffiliation: "St. Michael's Hospital / Toronto General",
    address: "30 Bond St, Suite 400, Toronto, ON M5B 1W8",
    phone: "(416) 864-5000",
    acceptingNewPatients: true,
    languages: ["English", "Mandarin"],
    rating: 4.9,
    consultWaitDays: 14,
  },
  {
    id: "spec-5",
    name: "Dr. Leila Ansari",
    credentials: "MD, FRCPC",
    specialty: "Clinical Dermatology & Pediatric Dermatology",
    category: "Dermatology",
    focusArea: "Pediatric Eczema, Severe Rashes, Psoriasis, Complex Dermatological Lesions",
    hospitalAffiliation: "Women's College Hospital / Toronto General",
    address: "76 Grenville St, Toronto, ON M5S 1B2",
    phone: "(416) 323-6400",
    acceptingNewPatients: true,
    languages: ["English", "Persian"],
    rating: 4.8,
    consultWaitDays: 10,
  },
  {
    id: "spec-6",
    name: "Dr. David Miller",
    credentials: "MD, FRCSC",
    specialty: "Orthopedic Surgery & Sports Medicine",
    category: "Orthopedics",
    focusArea: "Ligament Tears, Knee/Shoulder Arthroscopy, Pediatric Fractures & Joint Pain",
    hospitalAffiliation: "Sunnybrook Health Sciences Centre",
    address: "2075 Bayview Ave, Suite A300, Toronto, ON M4N 3M5",
    phone: "(416) 480-6100",
    acceptingNewPatients: true,
    languages: ["English"],
    rating: 4.7,
    consultWaitDays: 9,
  },
  {
    id: "spec-7",
    name: "Dr. Robert Thorne",
    credentials: "MD, FRCPC",
    specialty: "Neurology & Headache Medicine",
    category: "Neurology",
    focusArea: "Intractable Migraines, Neuropathy, Concussion Follow-up, Seizure Assessment",
    hospitalAffiliation: "St. Michael's Hospital",
    address: "36 Queen St E, Toronto, ON M5B 1W8",
    phone: "(416) 360-4000",
    acceptingNewPatients: true,
    languages: ["English"],
    rating: 4.8,
    consultWaitDays: 15,
  },
  {
    id: "spec-8",
    name: "Dr. Maya Patel",
    credentials: "MD, FRCPC",
    specialty: "Allergy & Clinical Immunology",
    category: "Allergy",
    focusArea: "Pediatric Food Allergies, Chronic Urticaria, Environmental Anaphylaxis, Asthma",
    hospitalAffiliation: "Michael Garron Hospital",
    address: "825 Coxwell Ave, East York, ON M4C 3E7",
    phone: "(416) 469-6580",
    acceptingNewPatients: true,
    languages: ["English", "Hindi"],
    rating: 4.7,
    consultWaitDays: 8,
  },
];

const AVAILABLE_LANGUAGES = ["English", "French", "Hindi", "Mandarin", "Persian"];

export default function Page() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || searchParams.get("query") || "";
  const [languageSearch, setLanguageSearch] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);

  const filteredSpecialists = useMemo(() => {
    return VERIFIED_SPECIALISTS.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.specialty.toLowerCase().includes(q) ||
        s.focusArea.toLowerCase().includes(q) ||
        s.hospitalAffiliation.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q);

      const matchesCat = selectedCategory === "all" || s.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesLanguage =
        selectedLanguages.length === 0 ||
        s.languages.some((language) => selectedLanguages.includes(language));

      return matchesSearch && matchesCat && matchesLanguage;
    });
  }, [searchQuery, selectedCategory, selectedLanguages]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top emergency announcement bar */}
      <div className="bg-rose-950/80 border-b border-rose-800/60 text-rose-200 text-xs sm:text-sm font-medium py-2 px-4 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 animate-pulse text-rose-400" />
            <span>
              <strong className="text-white">Need emergency care?</strong> If symptoms are acute or worsening, call <strong className="text-white">911</strong> or visit an emergency department.
            </span>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 font-bold text-rose-300 underline hover:text-white whitespace-nowrap ml-4 transition-colors"
          >
            Go to ER Router &rarr;
          </Link>
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
              <span className="text-xs text-indigo-400 font-semibold block leading-tight">
                Specialist Directory
              </span>
              <Link
                href="/hospital-portal"
                className="text-xs text-slate-400 font-medium block leading-tight hover:text-slate-200 transition-colors"
              >
                Hospital Portal
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/60">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Accepting Referrals
            </div>
            <Link href="/">
              <Button variant="outline" size="sm" className="text-xs bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white">
                Back to Map
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-b border-slate-800/80 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-950/60 border border-purple-800/60 text-purple-300 text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            Physician Referral &amp; Specialist Navigator
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Board-Certified Medical Specialists <span className="text-purple-400">in Ontario</span>.
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Connect directly with verified specialists across Otolaryngology (ENT), Pediatrics, Cardiology, Dermatology, and Orthopedics with consultation wait times.
          </p>

          {/* Quick Search Controls */}
          <div className="bg-slate-900/90 p-3 sm:p-4 rounded-2xl shadow-2xl border border-slate-800 max-w-2xl mx-auto mt-6 space-y-3 text-left backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search specialist name, organ system, or condition (e.g. ENT, Ear, Cardiac, Rash)..."
                  className="pl-9 h-11 text-sm bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400 font-medium flex items-center gap-1 mr-1">
                  <SlidersHorizontal className="h-3 w-3" /> Specialty:
                </span>
                {[
                  { label: "All Specialists", value: "all" },
                  { label: "ENT (Ear/Nose/Throat)", value: "ent" },
                  { label: "Pediatrics", value: "pediatrics" },
                  { label: "Cardiology", value: "cardiology" },
                  { label: "Dermatology", value: "dermatology" },
                  { label: "Orthopedics", value: "orthopedics" },
                  { label: "Neurology", value: "neurology" },
                ].map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`px-2.5 py-1 rounded-md border font-medium transition ${selectedCategory === cat.value
                        ? "bg-purple-600 text-white border-purple-500 shadow-sm"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                      }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400 font-medium flex items-center gap-1 mr-1">
                  <SlidersHorizontal className="h-3 w-3" /> Languages:
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium"
                      aria-label={`Language filters: ${selectedLanguages.length > 0 ? selectedLanguages.join(", ") : "All Languages"}`}
                    >
                      {selectedLanguages.length > 0
                        ? (selectedLanguages.length > 2 ? selectedLanguages.slice(0, 2).join(", ").concat(", ...")
                        : selectedLanguages.join(", "))
                        : "All Languages"}
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <div
                      className="p-1"
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <Input
                          value={languageSearch}
                          onChange={(event) =>
                            setLanguageSearch(event.target.value)
                          }
                          placeholder="Search languages..."
                          aria-label="Search languages"
                          className="h-8 pl-8 text-xs"
                        />
                      </div>
                    </div>
                    <DropdownMenuItem
                      onSelect={() => setSelectedLanguages([])}
                    >
                      All Languages
                    </DropdownMenuItem>
                    {AVAILABLE_LANGUAGES
                      .filter((availableLanguage) =>
                        availableLanguage
                          .toLowerCase()
                          .includes(languageSearch.trim().toLowerCase())
                      )
                      .map((availableLanguage) => (
                        <DropdownMenuCheckboxItem
                          key={availableLanguage}
                          className="pl-2 pr-8 [&>span]:left-auto [&>span]:right-2"
                          checked={selectedLanguages.includes(availableLanguage)}
                          onCheckedChange={(checked) => {
                            setSelectedLanguages((currentLanguages) =>
                              checked
                                ? [...currentLanguages, availableLanguage]
                                : currentLanguages.filter(
                                    (selectedLanguage) =>
                                      selectedLanguage !== availableLanguage
                                  )
                            );
                          }}
                        >
                          {availableLanguage}
                        </DropdownMenuCheckboxItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <User2 className="h-4 w-4 text-purple-400" />
              Verified Specialists ({filteredSpecialists.length})
            </h3>
            <span className="text-xs text-slate-400">Accepting physician referrals</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSpecialists.map((spec) => (
              <div
                key={spec.id}
                className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 transition hover:shadow-xl hover:border-purple-800/60 space-y-4 relative flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-950/70 border border-purple-800/50 px-2 py-0.5 rounded">
                        {spec.specialty}
                      </span>
                      <h4 className="font-bold text-white text-lg mt-1 flex items-center gap-1.5">
                        {spec.name}
                        <span className="text-xs font-normal text-slate-400">({spec.credentials})</span>
                      </h4>
                      <p className="text-xs text-purple-300 flex items-center gap-1 mt-0.5 font-medium">
                        <Building2 className="h-3 w-3 text-purple-400" /> {spec.hospitalAffiliation}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2 py-1 rounded-lg block">
                        ★ {spec.rating}
                      </span>
                    </div>
                  </div>

                  {/* Focus Clinical Areas */}
                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Clinical Focus:
                    </span>
                    <p className="text-slate-300 leading-relaxed">{spec.focusArea}</p>
                  </div>

                  {/* Details Pill Row */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      <Calendar className="h-3 w-3 text-indigo-400" />
                      <span>Avg Consult: ~{spec.consultWaitDays} days</span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-300">New Patients Accepted</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Languages: {spec.languages.join(", ")}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-slate-500 shrink-0" /> {spec.address}
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-3 flex items-center gap-2 border-t border-slate-800/80 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs gap-1.5 h-9 bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300"
                    onClick={() => alert(`Connecting to office of ${spec.name}: ${spec.phone}`)}
                  >
                    <PhoneCall className="h-3.5 w-3.5 text-slate-400" />
                    {spec.phone}
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 text-xs gap-1.5 h-9 bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                          spec.name + " " + spec.address
                        )}`,
                        "_blank"
                      )
                    }
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    Office Directions
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Referral Preparation Guide */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 mt-8">
          <h4 className="font-bold text-white text-base flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-purple-400" /> How Specialist Referrals Work in Ontario
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400 leading-relaxed">
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <strong className="text-slate-200 block text-sm">1. General Practitioner Referral</strong>
              Ask your family doctor or walk-in physician to fax a direct referral to the specialist with relevant lab/imaging notes.
            </div>
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <strong className="text-slate-200 block text-sm">2. Triage &amp; Intake Booking</strong>
              The specialist clinic reviews clinical priority and contacts you with an appointment date and diagnostic instructions.
            </div>
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <strong className="text-slate-200 block text-sm">3. Interim Symptom Support</strong>
              If symptoms worsen before your scheduled consult date, visit an urgent care centre or emergency department immediately.
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 mt-12 text-center text-xs text-slate-400 space-y-2">
        <div className="flex justify-center mb-2">
          <SynapticLogo className="h-8 w-auto opacity-90 text-white" />
        </div>
        <p className="font-medium text-slate-300">Synaptic — Intelligent Healthcare Navigation System</p>
        <p className="text-slate-500">Board-certified specialists &amp; clinical triage network.</p>
      </footer>
    </div>
  );
}
