"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
    Activity,
    AlertTriangle,
    Clock,
    User,
    CheckCircle2,
    RefreshCw,
    Search,
    Building2,
    Radio,
    ArrowLeft,
    ShieldAlert,
} from "lucide-react";
import { Button } from "@ui/components/ui/button";

interface InboundTicket {
    id: string;
    hospitalId: string;
    chiefComplaint: string;
    patientAge: number;
    selfReportedSeverity: number;
    etaMinutes: number | null;
    status: string;
    createdAt: string;
}

const SEVERITY_CONFIG: Record<
    number,
    { label: string; badge: string }
> = {
    1: { label: "Minor", badge: "bg-emerald-950/80 text-emerald-300 border border-emerald-700/60" },
    2: { label: "Mild", badge: "bg-teal-950/80 text-teal-300 border border-teal-700/60" },
    3: { label: "Moderate", badge: "bg-amber-950/80 text-amber-300 border border-amber-700/60" },
    4: { label: "Severe", badge: "bg-orange-950/80 text-orange-300 border border-orange-700/60" },
    5: { label: "Critical", badge: "bg-rose-950/90 text-rose-300 border border-rose-600 animate-pulse" },
};

const POPULAR_HOSPITALS = [
    { id: "all", name: "All Regional Facilities" },
    { id: "1", name: "Toronto General Hospital" },
    { id: "2", name: "Mount Sinai Hospital" },
    { id: "3", name: "St. Michael's Hospital" },
    { id: "4", name: "SickKids (Hospital for Sick Children)" },
    { id: "5", name: "Sunnybrook Health Sciences Centre" },
    { id: "6", name: "Michael Garron Hospital" },
];

export default function HospitalPortalPage() {
    const [tickets, setTickets] = useState<InboundTicket[]>([]);
    const [selectedHospital, setSelectedHospital] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [severityFilter, setSeverityFilter] = useState<number | "all">("all");
    const [loading, setLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        try {
            const url =
                selectedHospital && selectedHospital !== "all"
                    ? `/api/inbound?hospitalId=${encodeURIComponent(selectedHospital)}`
                    : `/api/inbound`;

            const res = await fetch(url, { cache: "no-store" });
            if (!res.ok) throw new Error("Failed to fetch tickets");
            const data = await res.json();
            setTickets(Array.isArray(data) ? data : []);
            setLastRefreshed(new Date());
        } catch (err) {
            console.error("Error fetching inbound tickets from cloud DB:", err);
        } finally {
            setLoading(false);
        }
    }, [selectedHospital]);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    // Real-time polling every 5 seconds so different devices stay synchronized
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(fetchTickets, 5000);
        return () => clearInterval(interval);
    }, [autoRefresh, fetchTickets]);

    const updateStatus = async (ticketId: string, nextStatus: string) => {
        try {
            const res = await fetch("/api/inbound", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: ticketId, status: nextStatus }),
            });
            if (res.ok) {
                setTickets((prev) =>
                    prev.map((t) => (t.id === ticketId ? { ...t, status: nextStatus } : t))
                );
            }
        } catch (err) {
            console.error("Status update error:", err);
        }
    };

    const filteredTickets = useMemo(() => {
        return tickets.filter((t) => {
            if (statusFilter !== "all" && t.status !== statusFilter) return false;
            if (severityFilter !== "all" && t.selfReportedSeverity !== severityFilter) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                return (
                    t.chiefComplaint.toLowerCase().includes(q) ||
                    t.hospitalId.toLowerCase().includes(q) ||
                    t.id.toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [tickets, statusFilter, severityFilter, searchQuery]);

    const stats = useMemo(() => {
        const inbound = tickets.filter(
            (t) => t.status === "incoming" || t.status === "inbound"
        ).length;
        const critical = tickets.filter(
            (t) =>
                t.selfReportedSeverity >= 4 &&
                (t.status === "incoming" || t.status === "inbound")
        ).length;
        const arrived = tickets.filter((t) => t.status === "arrived").length;
        return { total: tickets.length, inbound, critical, arrived };
    }, [tickets]);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            {/* Top Header */}
            <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/patient-router"
                            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Patient View</span>
                        </Link>
                        <span className="text-slate-800">|</span>
                        <div className="flex items-center gap-2 text-sm font-bold text-white">
                            <Building2 className="w-4 h-4 text-indigo-400" />
                            <span>Hospital Inbound Triage Portal</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition-all ${autoRefresh
                                ? "border-emerald-700/60 bg-emerald-950/60 text-emerald-300"
                                : "border-slate-800 bg-slate-900 text-slate-400"
                                }`}
                        >
                            <Radio className={`w-3 h-3 ${autoRefresh ? "animate-pulse text-emerald-400" : ""}`} />
                            {autoRefresh ? "Live Cloud Sync (5s)" : "Paused"}
                        </button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchTickets}
                            disabled={loading}
                            className="text-xs bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800"
                            title="Refresh tickets from DB"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl">
                        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                            <span>En Route (Incoming)</span>
                            <Clock className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="mt-2 text-3xl font-extrabold text-blue-400">
                            {stats.inbound}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Live patients on the road</p>
                    </div>

                    <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl">
                        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                            <span>Critical / Urgent</span>
                            <AlertTriangle className="w-4 h-4 text-rose-400" />
                        </div>
                        <div className="mt-2 text-3xl font-extrabold text-rose-400">
                            {stats.critical}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Severity 4 & 5 inbound</p>
                    </div>

                    <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl">
                        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                            <span>Arrived in Waiting</span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="mt-2 text-3xl font-extrabold text-emerald-400">
                            {stats.arrived}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Checked in at ED front desk</p>
                    </div>

                    <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl">
                        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                            <span>Total Volume Today</span>
                            <Activity className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="mt-2 text-3xl font-extrabold text-white">
                            {stats.total}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Recorded across database</p>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row gap-3 items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                        <select
                            value={selectedHospital}
                            onChange={(e) => setSelectedHospital(e.target.value)}
                            className="text-xs bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            {POPULAR_HOSPITALS.map((h) => (
                                <option key={h.id} value={h.id}>
                                    {h.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="text-xs bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="all">All Statuses</option>
                            <option value="incoming">Incoming / En Route</option>
                            <option value="arrived">Arrived</option>
                            <option value="triaged">Triaged</option>
                            <option value="cancelled">Dismissed</option>
                        </select>

                        <select
                            value={severityFilter}
                            onChange={(e) =>
                                setSeverityFilter(e.target.value === "all" ? "all" : Number(e.target.value))
                            }
                            className="text-xs bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="all">All Severities</option>
                            <option value="5">Severity 5 (Critical)</option>
                            <option value="4">Severity 4 (Severe)</option>
                            <option value="3">Severity 3 (Moderate)</option>
                            <option value="2">Severity 2 (Mild)</option>
                            <option value="1">Severity 1 (Minor)</option>
                        </select>
                    </div>

                    <div className="relative w-full md:w-72">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search symptoms or ticket ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                {/* Real-Time Tickets Table */}
                <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                            <Activity className="w-4 h-4 text-indigo-400" />
                            Incoming Patient Feed ({filteredTickets.length})
                        </h2>
                        <span className="text-xs text-slate-400">
                            Synced: {lastRefreshed.toLocaleTimeString()}
                        </span>
                    </div>

                    {filteredTickets.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <Clock className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                            <p className="text-sm font-medium">No incoming patient notifications in database.</p>
                            <p className="text-xs text-slate-500 mt-1">
                                Patients submitting notifications on any device will appear here instantly.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase border-b border-slate-800">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">Ticket ID</th>
                                        <th className="px-6 py-3 font-semibold">Facility ID</th>
                                        <th className="px-6 py-3 font-semibold">Severity</th>
                                        <th className="px-6 py-3 font-semibold">Chief Complaint / Symptoms</th>
                                        <th className="px-6 py-3 font-semibold">Age</th>
                                        <th className="px-6 py-3 font-semibold">ETA</th>
                                        <th className="px-6 py-3 font-semibold">Status</th>
                                        <th className="px-6 py-3 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {filteredTickets.map((t) => {
                                        const sev = SEVERITY_CONFIG[t.selfReportedSeverity] || SEVERITY_CONFIG[3];
                                        return (
                                            <tr
                                                key={t.id}
                                                className={`hover:bg-slate-800/40 transition-colors ${t.selfReportedSeverity >= 5 ? "bg-rose-950/20" : ""
                                                    }`}
                                            >
                                                <td className="px-6 py-4 font-mono text-xs text-slate-400">
                                                    #{t.id.slice(0, 8)}...
                                                    <div className="text-[10px] text-slate-500 mt-0.5">
                                                        {new Date(t.createdAt).toLocaleTimeString([], {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 text-xs font-semibold text-slate-300">
                                                    {t.hospitalId}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${sev.badge}`}
                                                    >
                                                        Level {t.selfReportedSeverity}: {sev.label}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 max-w-xs font-medium text-slate-200">
                                                    <p className="line-clamp-2">{t.chiefComplaint}</p>
                                                </td>

                                                <td className="px-6 py-4 text-xs text-slate-300 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <User className="w-3.5 h-3.5 text-slate-400" />
                                                        <span>Age {t.patientAge}</span>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 text-xs font-semibold text-blue-400 whitespace-nowrap">
                                                    {t.etaMinutes !== null && t.etaMinutes !== undefined ? (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            ~{t.etaMinutes} mins
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-500">Unknown</span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${t.status === "incoming" || t.status === "inbound"
                                                            ? "bg-sky-950 text-sky-300 border border-sky-800"
                                                            : t.status === "arrived"
                                                                ? "bg-amber-950 text-amber-300 border border-amber-800"
                                                                : t.status === "triaged"
                                                                    ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                                                    : "bg-slate-800 text-slate-300 border border-slate-700"
                                                            }`}
                                                    >
                                                        {t.status.toUpperCase()}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    <div className="inline-flex gap-1.5">
                                                        {(t.status === "incoming" || t.status === "inbound") && (
                                                            <button
                                                                onClick={() => updateStatus(t.id, "arrived")}
                                                                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
                                                            >
                                                                Mark Arrived
                                                            </button>
                                                        )}
                                                        {t.status === "arrived" && (
                                                            <button
                                                                onClick={() => updateStatus(t.id, "triaged")}
                                                                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
                                                            >
                                                                Triaged
                                                            </button>
                                                        )}
                                                        {t.status !== "cancelled" && t.status !== "triaged" && (
                                                            <button
                                                                onClick={() => updateStatus(t.id, "cancelled")}
                                                                className="px-2 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition"
                                                            >
                                                                Dismiss
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
