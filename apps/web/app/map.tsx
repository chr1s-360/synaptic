"use client";

import { useEffect, useRef, useState } from "react";

export interface FacilityMarker {
    id: string;
    name: string;
    type?: string;
    address?: string;
    community?: string;
    postalCode?: string;
    lat: number;
    lng: number;
    travelMinutes?: number;
    travelDistanceKm?: number;
    waitTimeMin?: number;
    totalTimeMin?: number;
    phone?: string;
}

interface InteractiveMapProps {
    userLocation: { lat: number; lng: number; label: string };
    facilities: FacilityMarker[];
    selectedFacilityId?: string;
    onSelectFacility?: (id: string) => void;
    activeModeLabel?: string;
    height?: string;
}

export default function InteractiveMap({
    userLocation = { lat: 43.6532, lng: -79.3832, label: "Your Location (Toronto)" },
    facilities,
    selectedFacilityId,
    onSelectFacility,
    activeModeLabel = "Driving",
    height = "560px",
}: InteractiveMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const lastViewKeyRef = useRef<string>("");
    const [mapLoaded, setMapLoaded] = useState(false);

    // Dynamically load Leaflet styles and script on client only
    useEffect(() => {
        if (typeof window === "undefined") return;

        // Load Leaflet CSS
        const cssId = "leaflet-stylesheet";
        if (!document.getElementById(cssId)) {
            const link = document.createElement("link");
            link.id = cssId;
            link.rel = "stylesheet";
            link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
            link.crossOrigin = "";
            document.head.appendChild(link);
        }

        // Load Leaflet JS
        const scriptId = "leaflet-script";
        const existingScript = document.getElementById(scriptId);

        const initLeafletMap = () => {
            const L = (window as any).L;
            if (!L || !mapContainerRef.current) return;

            if (!mapInstanceRef.current) {
                const map = L.map(mapContainerRef.current, {
                    center: [userLocation.lat, userLocation.lng],
                    zoom: 12,
                    zoomControl: true,
                });

                L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    maxZoom: 19,
                }).addTo(map);

                mapInstanceRef.current = map;
                setMapLoaded(true);
            }
        };

        if ((window as any).L) {
            initLeafletMap();
        } else if (!existingScript) {
            const script = document.createElement("script");
            script.id = scriptId;
            script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
            script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
            script.crossOrigin = "";
            script.onload = () => initLeafletMap();
            document.body.appendChild(script);
        } else {
            existingScript.addEventListener("load", initLeafletMap);
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
        // Initialise the Leaflet map once; markers/view are handled by the effect below
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update markers and bounds when facilities, userLocation, or selection changes
    useEffect(() => {
        const L = (window as any).L;
        const map = mapInstanceRef.current;
        if (!L || !map || !mapLoaded) return;

        // Clear old markers
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        const selectedFacility = facilities.find((f) => f.id === selectedFacilityId);
        const bounds = L.latLngBounds([
            [userLocation.lat, userLocation.lng],
        ]);

        // Add user home marker (Dark Blue Pin)
        const userIcon = L.divIcon({
            className: "custom-user-pin",
            html: `
        <div style="
          width: 34px;
          height: 34px;
          background: #0284c7;
          border: 3px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
        ">
          📍
        </div>
      `,
            iconSize: [34, 34],
            iconAnchor: [17, 17],
        });

        const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
            .addTo(map)
            .bindPopup(`<strong>${userLocation.label}</strong><br/><span style="font-size:11px;color:#64748b;">Starting Point</span>`);
        markersRef.current.push(userMarker);

        // Color code time band matching the accessibility methodology:
        // <=5m: #16803C (green)
        // 6-10m: #2563EB (blue)
        // 11-15m: #D97706 (amber)
        // 15m+: #DC2626 (red)
        // No route / undefined: #64748B
        const getTimeBandColor = (mins?: number) => {
            if (mins === undefined || mins === null || isNaN(mins)) return "#64748B";
            if (mins <= 5) return "#16803C";
            if (mins <= 10) return "#2563EB";
            if (mins <= 15) return "#D97706";
            return "#DC2626";
        };

        facilities.forEach((f) => {
            bounds.extend([f.lat, f.lng]);
            const isSelected = f.id === selectedFacilityId;
            const color = getTimeBandColor(f.travelMinutes ?? f.totalTimeMin);

            const markerHtml = `
        <div style="
          width: ${isSelected ? "42px" : "32px"};
          height: ${isSelected ? "42px" : "32px"};
          background: ${color};
          border: ${isSelected ? "4px solid #ffffff" : "2.5px solid #ffffff"};
          border-radius: 50%;
          box-shadow: ${isSelected ? "0 0 0 3px #0284c7, 0 8px 18px rgba(0,0,0,0.35)" : "0 3px 8px rgba(0,0,0,0.22)"};
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: ${isSelected ? "13px" : "11px"};
          cursor: pointer;
          transition: transform 0.15s ease;
        ">
          ${f.travelMinutes !== undefined && f.travelMinutes !== null ? f.travelMinutes + "m" : (f.totalTimeMin ? f.totalTimeMin + "m" : "🏥")}
        </div>
      `;

            const facilityIcon = L.divIcon({
                className: "custom-hospital-marker",
                html: markerHtml,
                iconSize: [isSelected ? 42 : 32, isSelected ? 42 : 32],
                iconAnchor: [isSelected ? 21 : 16, isSelected ? 21 : 16],
            });

            const marker = L.marker([f.lat, f.lng], { icon: facilityIcon }).addTo(map);

            const popupContent = `
        <div style="min-width: 220px; font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.4;">
          <strong style="font-size: 13px; color: #0f172a; display: block; margin-bottom: 2px;">${f.name}</strong>
          ${f.type ? `<span style="display:inline-block; font-size: 10px; background: #f1f5f9; color: #475569; padding: 1px 6px; border-radius: 4px; margin-bottom: 6px;">${f.type}</span><br/>` : ""}
          <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;">📍 ${f.address || (f.community ? `${f.community}, ON ${f.postalCode || ""}` : "")}</div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; background: #f8fafc; padding: 6px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 8px;">
            <div><span style="color:#64748b; font-size: 10px;">${activeModeLabel}</span><br/><strong>${f.travelMinutes !== undefined && f.travelMinutes !== null ? `${f.travelMinutes} min` : "—"}</strong></div>
            <div><span style="color:#64748b; font-size: 10px;">Routed Distance</span><br/><strong>${f.travelDistanceKm ? `${f.travelDistanceKm} km` : "—"}</strong></div>
          </div>

          ${f.waitTimeMin ? `
            <div style="display: flex; justify-content: space-between; align-items: center; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 4px 8px; border-radius: 6px; font-size: 11px; margin-bottom: 8px;">
              <span style="color: #166534;">ER Triage Queue:</span>
              <strong style="color: #166534;">${f.waitTimeMin} mins</strong>
            </div>
          ` : ""}

          <div style="text-align: center; font-weight: bold; color: ${color}; font-size: 12px; margin-bottom: 8px;">
            ${f.totalTimeMin ? `Total Care Time: ${f.totalTimeMin} min` : `${activeModeLabel} Time: ${f.travelMinutes ?? "—"} min`}
          </div>

          <a
            href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(f.name + " " + (f.address || f.community || ""))}"
            target="_blank"
            rel="noreferrer"
            style="display: block; text-align: center; background: #0f172a; color: white; padding: 6px 8px; border-radius: 6px; text-decoration: none; font-size: 11px; font-weight: 600;"
          >
            Start Directions
          </a>
        </div>
      `;

            marker.bindPopup(popupContent);

            marker.on("click", () => {
                if (onSelectFacility) {
                    onSelectFacility(f.id);
                }
            });

            if (isSelected) {
                marker.openPopup();
            }

            markersRef.current.push(marker);
        });

        if (facilities.length > 0) {
            // Re-frame only when the result set / selection / origin actually changes
            const viewKey = `${facilities.map((f) => f.id).join(",")}|${selectedFacilityId}|${userLocation.lat},${userLocation.lng}`;
            if (viewKey !== lastViewKeyRef.current) {
                lastViewKeyRef.current = viewKey;
                // If user location changed or is present, fit bounds containing user and facilities
                map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
            }
        }
    }, [facilities, userLocation, selectedFacilityId, mapLoaded, activeModeLabel, onSelectFacility]);

    return (
        <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm" style={{ height }}>
            <div ref={mapContainerRef} className="w-full h-full z-10" />

            {/* Floating Legend */}
            <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-sm border border-slate-200/80 p-2.5 rounded-lg shadow-md text-[11px] text-slate-700 space-y-1">
                <strong className="block text-[11px] text-slate-900 border-b pb-1 mb-1">
                    Travel-Time Bands ({activeModeLabel})
                </strong>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#16803C]"></span> 0–5 min</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]"></span> 5–10 min</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#D97706]"></span> 10–15 min</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]"></span> 15+ min</div>
                <div className="flex items-center gap-1.5 pt-0.5"><span className="text-xs">📍</span> Selected Origin</div>
            </div>
        </div>
    );
}
