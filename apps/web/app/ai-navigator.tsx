"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
    MessageSquare,
    X,
    Send,
    Sparkles,
    Navigation,
    Clock,
    Car,
    AlertTriangle,
    MapPin,
    PhoneCall,
    ChevronRight,
    ShieldCheck,
    Stethoscope,
    Info,
    RotateCcw,
    UserCheck,
    CheckCircle2,
    ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface Facility {
    id: string;
    name: string;
    address: string;
    phone: string;
    erLevel: string;
    distanceMiles: number;
    rating: number;
    availableBeds: number;
    specialties: string[];
}

interface SpecialistInfo {
    type: string;
    recommendedDirectoryUrl: string;
    nextSteps: string[];
}

interface NavigationPlan {
    facility: Facility;
    calculatedDriveTimeMin: number;
    calculatedWaitTimeMin: number;
    totalTimeMin: number;
    trafficStatus: "Light" | "Moderate" | "Heavy";
    matchScore: number;
    clinicalRationale: string;
    recommendedTransport: "Driving" | "Ambulance (911)" | "Transit/Rideshare";
}

interface FollowUpQuestion {
    id: string;
    question: string;
    category: "age" | "severity" | "duration" | "mobility";
    quickOptions: string[];
}

interface ChatMessage {
    id: string;
    sender: "user" | "ai";
    text: string;
    timestamp: string;
    plan?: NavigationPlan;
    alternatives?: NavigationPlan[];
    followUpQuestions?: FollowUpQuestion[];
    specialistContext?: SpecialistInfo;
    isEmergency?: boolean;
}

// Ensure clean natural output without raw markdown asterisks
function stripAsterisks(text: string): string {
    if (!text) return "";
    return text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1");
}

export default function AiHealthcareNavigator() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: "welcome-1",
            sender: "ai",
            text: "Hello! I am your Synaptic AI Healthcare Navigator.\n\nPlease describe your symptoms, what you or your patient are experiencing, or ask for specialist/clinic recommendations. I will evaluate your situation using Google Gemini and calculate your most optimized care plan.",
            timestamp: "Just now",
        },
    ]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    const handleSend = async (userPrompt?: string) => {
        const textToSend = (userPrompt || input).trim();
        if (!textToSend || loading) return;

        const userMessage: ChatMessage = {
            id: "user-" + Date.now(),
            sender: "user",
            text: textToSend,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const historyPayload = messages.slice(-6).map((m) => ({
                sender: m.sender,
                text: m.text,
            }));

            const res = await fetch("/api/ai-navigator", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: textToSend, conversationHistory: historyPayload }),
            });

            if (!res.ok) {
                throw new Error("Unable to contact AI Navigator");
            }

            const data = await res.json();

            const aiMessage: ChatMessage = {
                id: "ai-" + Date.now(),
                sender: "ai",
                text: stripAsterisks(data.aiSynthesis || "Here is your optimized healthcare navigation plan:"),
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                plan: data.primaryPlan,
                alternatives: data.alternatives,
                followUpQuestions: data.followUpQuestions,
                specialistContext: data.specialistContext,
                isEmergency: data.isEmergency,
            };

            setMessages((prev) => [...prev, aiMessage]);
        } catch (err: any) {
            setMessages((prev) => [
                ...prev,
                {
                    id: "err-" + Date.now(),
                    sender: "ai",
                    text: "I encountered an issue calculating the real-time plan. Please try again or dial 911 immediately if this is an emergency.",
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setMessages([
            {
                id: "welcome-reset",
                sender: "ai",
                text: "Ready for a new assessment. Describe your symptoms or ask for guidance to get an optimized plan.",
                timestamp: "Just now",
            },
        ]);
    };

    // Hide the AI triage chatbot on role selector and hospital staff pages
    if (pathname === "/" || pathname?.startsWith("/hospital-portal")) {
        return null;
    }

    return (
        <>
            {/* Floating Toggle Button (Sleek Dark Theme) */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
                {!isOpen && (
                    <div className="mb-2 bg-slate-900/95 text-slate-200 text-xs px-3.5 py-1.5 rounded-full shadow-2xl border border-slate-700/80 flex items-center gap-2 backdrop-blur-md animate-bounce">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="font-semibold text-slate-100">AI Navigator</span>
                        <span className="text-slate-400">· Live Triage</span>
                    </div>
                )}

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Open AI Healthcare Navigator"
                    className="relative group p-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-2xl border border-slate-700/90 hover:border-indigo-500 hover:shadow-indigo-500/20 active:scale-95 transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-indigo-900/50"
                >
                    {isOpen ? (
                        <X className="w-6 h-6 text-slate-200" />
                    ) : (
                        <>
                            <MessageSquare className="w-6 h-6 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-900"></span>
                            </span>
                        </>
                    )}
                </button>
            </div>

            {/* Slide-out Dark Mode Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-[92vw] sm:w-[450px] max-h-[82vh] h-[650px] bg-slate-950 text-slate-100 rounded-2xl shadow-2xl border border-slate-800/90 flex flex-col overflow-hidden backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 border-b border-slate-800/90 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                                <Sparkles className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-sm tracking-wide text-white">Synaptic AI Navigator</h3>
                                    <span className="bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                                        Online
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400">Triage · Live Traffic · ER Queues · Specialists</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleReset}
                                title="Restart conversation"
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                title="Close window"
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Quick Disclaimer */}
                    <div className="bg-amber-950/40 border-b border-amber-900/50 px-3.5 py-1.5 flex items-center gap-2 text-[11px] text-amber-200/90">
                        <Info className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                        <span>AI triage guidance. For acute emergencies, call 911 immediately.</span>
                    </div>

                    {/* Messages Stream */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/60">
                        {messages.map((m) => (
                            <div
                                key={m.id}
                                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
                            >
                                <div
                                    className={`max-w-[92%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-sm ${m.sender === "user"
                                        ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-br-none"
                                        : "bg-slate-900/95 text-slate-200 border border-slate-800/90 rounded-bl-none"
                                        }`}
                                >
                                    <div className="whitespace-pre-line leading-relaxed">{m.text}</div>

                                    {/* Render Optimization Card or Specialist Next Steps */}
                                    {(m.plan || m.specialistContext) && (
                                        <div className="mt-3 pt-3 border-t border-slate-800 space-y-2.5">
                                            {m.isEmergency && (
                                                <div className="p-2.5 bg-rose-950/50 border border-rose-800/80 rounded-xl flex items-center gap-2 text-rose-200 text-xs font-semibold">
                                                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
                                                    <span>High-Acuity Emergency: Call 911 for paramedic stabilization.</span>
                                                </div>
                                            )}

                                            {/* Specialist Referral & Directory Action Card */}
                                            {m.specialistContext && (
                                                <div className="p-3 bg-gradient-to-br from-purple-950/60 via-slate-900 to-indigo-950/40 border border-purple-800/50 rounded-xl space-y-2.5 shadow-sm">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-900/50 px-2 py-0.5 rounded flex items-center gap-1 w-fit border border-purple-700/50">
                                                                <UserCheck className="w-3 h-3 text-purple-400" />
                                                                Recommended Specialist Pathway
                                                            </span>
                                                            <h4 className="font-bold text-white text-sm mt-1">{m.specialistContext.type}</h4>
                                                        </div>
                                                        <span className="bg-purple-600/30 text-purple-300 border border-purple-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                            Referral
                                                        </span>
                                                    </div>

                                                    {/* Next Steps List */}
                                                    <div className="space-y-1.5 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/90">
                                                        <p className="text-[11px] font-bold text-slate-300">Actionable Next Steps:</p>
                                                        {m.specialistContext.nextSteps.map((step, idx) => (
                                                            <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                                                <span>{step}</span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Action Button to Specialist Directory */}
                                                    <Link
                                                        href={m.specialistContext.recommendedDirectoryUrl}
                                                        className="flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition"
                                                    >
                                                        <span>Open specialist directory</span>
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </Link>
                                                </div>
                                            )}

                                            {/* Primary Recommended Facility */}
                                            {m.plan && (
                                                <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2.5">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 border border-indigo-800/60 px-2 py-0.5 rounded">
                                                                {m.specialistContext ? "Closest Clinic for Immediate Care" : "Optimal Destination"}
                                                            </span>
                                                            <h4 className="font-bold text-white text-sm mt-1">{m.plan.facility.name}</h4>
                                                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                                <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                                                                {m.plan.facility.address}
                                                            </p>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2 py-1 rounded-lg">
                                                                ★ {m.plan.facility.rating}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Metrics Bar */}
                                                    <div className="grid grid-cols-3 gap-1.5 py-1.5 bg-slate-950/80 rounded-lg p-2 border border-slate-800 text-center">
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 block font-medium">Traffic / Drive</span>
                                                            <span className="text-xs font-bold text-blue-400 flex items-center justify-center gap-1">
                                                                <Car className="w-3 h-3 text-blue-400" />
                                                                {m.plan.calculatedDriveTimeMin} min
                                                            </span>
                                                            <span className="text-[9px] text-slate-500">({m.plan.trafficStatus})</span>
                                                        </div>
                                                        <div className="border-x border-slate-800">
                                                            <span className="text-[10px] text-slate-400 block font-medium">ER Wait</span>
                                                            <span className="text-xs font-bold text-amber-400 flex items-center justify-center gap-1">
                                                                <Clock className="w-3 h-3 text-amber-400" />
                                                                {m.plan.calculatedWaitTimeMin} min
                                                            </span>
                                                            <span className="text-[9px] text-slate-500">Queue</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 block font-medium">Door-to-Care</span>
                                                            <span className="text-xs font-extrabold text-indigo-300 flex items-center justify-center gap-1">
                                                                {m.plan.totalTimeMin} min
                                                            </span>
                                                            <span className="text-[9px] text-emerald-400 font-semibold">Fastest</span>
                                                        </div>
                                                    </div>

                                                    {/* Rationale & Action */}
                                                    <p className="text-[11px] text-slate-300 bg-slate-950/60 p-2 rounded border border-slate-800/70 italic">
                                                        &ldquo;{stripAsterisks(m.plan.clinicalRationale)}&rdquo;
                                                    </p>

                                                    <div className="flex items-center gap-2 pt-1">
                                                        <a
                                                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                                                                m.plan.facility.name + " " + m.plan.facility.address
                                                            )}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                                                        >
                                                            <Navigation className="w-3.5 h-3.5" />
                                                            Directions
                                                        </a>
                                                        <a
                                                            href={`tel:${m.plan.facility.phone.replace(/[^0-9]/g, "")}`}
                                                            className="flex items-center justify-center gap-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition"
                                                        >
                                                            <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                                                            Call ER
                                                        </a>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Secondary Alternatives */}
                                            {m.alternatives && m.alternatives.length > 0 && (
                                                <div className="pt-1">
                                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                                                        Alternative Options
                                                    </p>
                                                    <div className="space-y-1.5">
                                                        {m.alternatives.map((alt) => (
                                                            <div
                                                                key={alt.facility.id}
                                                                className="p-2 bg-slate-950/80 rounded-lg border border-slate-800/90 flex items-center justify-between text-xs"
                                                            >
                                                                <div>
                                                                    <p className="font-semibold text-slate-200">{alt.facility.name}</p>
                                                                    <p className="text-[10px] text-slate-400">
                                                                        {alt.calculatedDriveTimeMin}m drive + {alt.calculatedWaitTimeMin}m wait
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="text-[11px] font-bold text-slate-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                                                                        {alt.totalTimeMin}m total
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Clarifying Follow-Up Questions to Understand Patient Situation */}
                                            {m.followUpQuestions && m.followUpQuestions.length > 0 && (
                                                <div className="pt-2 mt-2 border-t border-slate-800">
                                                    <p className="text-[11px] font-bold text-indigo-400 flex items-center gap-1.5 mb-2">
                                                        <Stethoscope className="w-3.5 h-3.5 text-indigo-400" />
                                                        Help me refine your plan:
                                                    </p>
                                                    <div className="space-y-2.5">
                                                        {m.followUpQuestions.map((q) => (
                                                            <div key={q.id} className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                                                                <p className="text-xs font-semibold text-slate-200 mb-1.5">{q.question}</p>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {q.quickOptions.map((opt, optIdx) => (
                                                                        <button
                                                                            key={optIdx}
                                                                            onClick={() => handleSend(opt)}
                                                                            disabled={loading}
                                                                            className="text-left text-[11px] bg-slate-900 hover:bg-indigo-600 hover:text-white text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-indigo-500 shadow-2xs transition font-medium"
                                                                        >
                                                                            {opt}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] text-slate-500 mt-1 px-1">{m.timestamp}</span>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex items-center gap-2 p-3 bg-slate-900 border border-slate-800 rounded-2xl w-fit text-xs text-slate-300 shadow-sm animate-pulse">
                                <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
                                <span>Evaluating symptoms with Gemini AI & live emergency queues...</span>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input Field */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="p-3 bg-slate-950 border-t border-slate-800/90 flex items-center gap-2"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Describe symptoms, age, or health concern..."
                            disabled={loading}
                            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl shadow-md transition focus:outline-none"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
