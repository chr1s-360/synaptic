export type RoutingMode = "Driving" | "Walking" | "Cycling" | "Public transit";

export interface GeoPoint {
    lat: number;
    lng: number;
}

export interface RouteEstimate {
    minutes: number | null;
    distanceKm: number | null;
}

const VALHALLA_COSTINGS: Record<"Driving" | "Walking" | "Cycling", string> = {
    Driving: "auto",
    Walking: "pedestrian",
    Cycling: "bicycle",
};

// Haversine formula matching the Python calculation in app.py
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const radius = 6371.0088;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const p1 = toRad(lat1);
    const p2 = toRad(lat2);
    const dp = toRad(lat2 - lat1);
    const dl = toRad(lon2 - lon1);
    const a =
        Math.sin(dp / 2) ** 2 +
        Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
    return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Geocodes address via OpenStreetMap Nominatim with Canadian scope
export async function geocodeCanadianAddress(
    query: string
): Promise<{ lat: number; lng: number; displayName: string }> {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
    )}&format=jsonv2&limit=1&countrycodes=ca`;

    const res = await fetch(url, {
        headers: {
            "User-Agent": "SynapticHealthcareAccess/1.0 (educational research)",
        },
    });

    if (!res.ok) {
        throw new Error("Geocoding service unavailable");
    }

    const results = await res.json();
    if (!results || results.length === 0) {
        throw new Error("No Canadian address found. Try including city or postal code.");
    }

    return {
        lat: parseFloat(results[0].lat),
        lng: parseFloat(results[0].lon),
        displayName: results[0].display_name,
    };
}

// Fetches live route matrix from Valhalla demo service
export async function fetchValhallaMatrix(
    origin: GeoPoint,
    targets: GeoPoint[],
    mode: "Driving" | "Walking" | "Cycling"
): Promise<RouteEstimate[]> {
    if (targets.length === 0) return [];

    const costing = VALHALLA_COSTINGS[mode] || "auto";
    const payload = {
        sources: [{ lat: origin.lat, lon: origin.lng }],
        targets: targets.map((t) => ({ lat: t.lat, lon: t.lng })),
        costing,
        units: "kilometers",
    };

    try {
        const res = await fetch("https://valhalla1.openstreetmap.de/sources_to_targets", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            throw new Error(`Valhalla status ${res.status}`);
        }

        const data = await res.json();
        const matrix = data.sources_to_targets || data.sourcesToTargets || [];
        const row = Array.isArray(matrix[0]) ? matrix[0] : matrix;

        return targets.map((_, i) => {
            const item = row[i];
            if (!item || item.time === undefined || item.time === null) {
                return { minutes: null, distanceKm: null };
            }
            return {
                minutes: Math.round(Number(item.time) / 60),
                distanceKm: Number((Number(item.distance || 0)).toFixed(1)),
            };
        });
    } catch (err) {
        // Fallback: estimate from haversine distance
        const speedsKmH: Record<string, number> = { Driving: 38, Walking: 4.8, Cycling: 15 };
        const speed = speedsKmH[mode] || 35;

        return targets.map((t) => {
            const dist = haversineKm(origin.lat, origin.lng, t.lat, t.lng) * 1.3; // road factor
            const minutes = Math.round((dist / speed) * 60);
            return {
                minutes,
                distanceKm: Number(dist.toFixed(1)),
            };
        });
    }
}
