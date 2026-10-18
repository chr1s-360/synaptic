import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export interface HealthcareFacility {
  id: string;
  name: string;
  serviceType: string;
  serviceTypeDetail?: string;
  community: string;
  postalCode: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  distanceKm: number;
  distanceMiles: number;
  driveTimeMin: number;
  waitTimeMin: number;
  totalTimeMin: number;
  erLevel: string;
  rating: number;
  availableBeds: number;
  specialties: string[];
}

const DEFAULT_ORIGIN = { lat: 43.6532, lng: -79.3832 }; // Toronto City Hall

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const radius = 6371.0088;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// In-memory cache for parsed CSV data
let cachedFacilities: HealthcareFacility[] | null = null;

function parseCsvLine(text: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

function loadAllFacilities(): HealthcareFacility[] {
  if (cachedFacilities && cachedFacilities.length > 0) {
    return cachedFacilities;
  }

  const candidatePaths = [
    path.join(process.cwd(), "public", "healthcare_facility.csv"),
    path.join(process.cwd(), "apps", "web", "public", "healthcare_facility.csv"),
    path.join(process.cwd(), "apps", "web", "app", "healthcare_facility.csv"),
    path.join(process.cwd(), "healthcare_facility.csv"),
    "/Users/sonakshibilas/Desktop/Synaptic-HTV 11/synaptic/apps/web/app/healthcare_facility.csv",
  ];

  let csvContent = "";
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      csvContent = fs.readFileSync(p, "utf-8");
      break;
    }
  }

  if (!csvContent) {
    console.warn("Could not find healthcare_facility.csv");
    return [];
  }

  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]);
  const lonIdx = header.indexOf("X");
  const latIdx = header.indexOf("Y");
  const typeIdx = header.indexOf("SERVICE_TYPE");
  const detailIdx = header.indexOf("SERVICE_TYPE_DETAIL");
  const nameIdx = header.indexOf("ENGLISH_NAME");
  const addr1Idx = header.indexOf("ADDRESS_LINE_1");
  const commIdx = header.indexOf("COMMUNITY");
  const postalIdx = header.indexOf("POSTAL_CODE");

  const facilities: HealthcareFacility[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 6) continue;

    const lng = parseFloat(cols[lonIdx]);
    const lat = parseFloat(cols[latIdx]);
    if (isNaN(lat) || isNaN(lng) || lat < 40 || lat > 85) continue;

    const name = cols[nameIdx] || "Healthcare Facility";
    const serviceType = cols[typeIdx] || "Healthcare Facility";
    const serviceTypeDetail = detailIdx !== -1 ? cols[detailIdx] : "";
    const addr1 = addr1Idx !== -1 ? cols[addr1Idx] : "";
    const community = commIdx !== -1 ? cols[commIdx] : "Ontario";
    const postalCode = postalIdx !== -1 ? cols[postalIdx] : "";

    const fullAddress = [addr1, community, "ON", postalCode].filter(Boolean).join(", ");

    const distKm = haversineKm(DEFAULT_ORIGIN.lat, DEFAULT_ORIGIN.lng, lat, lng);
    const distMiles = Math.round(distKm * 0.621371 * 10) / 10;
    const driveTime = Math.max(3, Math.round(distMiles * 2.1 + 3));

    // Categorization & clinical attributes
    let waitTime = 15;
    let erLevel = "Community Health";
    const lowerType = serviceType.toLowerCase();
    const lowerName = name.toLowerCase();

    if (lowerType.includes("hospital") || lowerName.includes("hospital")) {
      if (lowerType.includes("trauma") || lowerName.includes("general") || lowerName.includes("sunnybrook") || lowerName.includes("michael")) {
        erLevel = "Level 1 Trauma";
        waitTime = 16 + (i % 12);
      } else if (lowerType.includes("pediatric") || lowerName.includes("sickkids") || lowerName.includes("children")) {
        erLevel = "Pediatric Hospital";
        waitTime = 20 + (i % 8);
      } else {
        erLevel = "Level 2 Trauma";
        waitTime = 22 + (i % 20);
      }
    } else if (lowerType.includes("community health") || lowerType.includes("clinic")) {
      erLevel = "Community Health Centre";
      waitTime = 12 + (i % 15);
    } else if (lowerType.includes("pharmacy")) {
      erLevel = "Pharmacy";
      waitTime = 5 + (i % 5);
    } else if (lowerType.includes("lab")) {
      erLevel = "Diagnostic Lab";
      waitTime = 10 + (i % 10);
    }

    const rating = Math.round((4.0 + ((i % 10) / 10) * 0.9) * 10) / 10;
    const availableBeds = erLevel.includes("Trauma") || erLevel.includes("Hospital") ? 8 + (i % 20) : 0;

    const specialties: string[] = [serviceType];
    if (serviceTypeDetail) specialties.push(serviceTypeDetail);
    if (erLevel.includes("Trauma")) specialties.push("Emergency Triage", "Acute Care");
    if (erLevel.includes("Pediatric")) specialties.push("Pediatrics", "Child Emergency");

    facilities.push({
      id: String(i),
      name,
      serviceType,
      serviceTypeDetail,
      community,
      postalCode,
      address: fullAddress,
      phone: "(416) 555-" + String(1000 + (i % 9000)),
      lat,
      lng,
      distanceKm: Math.round(distKm * 10) / 10,
      distanceMiles: distMiles,
      driveTimeMin: driveTime,
      waitTimeMin: waitTime,
      totalTimeMin: driveTime + waitTime,
      erLevel,
      rating,
      availableBeds,
      specialties: Array.from(new Set(specialties)),
    });
  }

  cachedFacilities = facilities;
  return facilities;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.toLowerCase().trim() || "";
    const filter = searchParams.get("filter") || "all";
    const sortBy = searchParams.get("sortBy") || "totalTime";
    const limit = Math.min(parseInt(searchParams.get("limit") || "80", 10), 300);

    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");
    const userLat = latParam ? parseFloat(latParam) : null;
    const userLng = lngParam ? parseFloat(lngParam) : null;
    const hasUserCoords = userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng);

    const all = loadAllFacilities();
    let matched = all.map((f) => {
      if (!hasUserCoords) return f;
      const distKm = haversineKm(userLat, userLng, f.lat, f.lng);
      const distMiles = Math.round(distKm * 0.621371 * 10) / 10;
      const driveTime = Math.max(3, Math.round(distMiles * 2.1 + 3));
      return {
        ...f,
        distanceKm: Math.round(distKm * 10) / 10,
        distanceMiles: distMiles,
        driveTimeMin: driveTime,
        totalTimeMin: driveTime + f.waitTimeMin,
      };
    });

    // Filter strictly for healthcare facilities matching query
    if (query) {
      matched = matched.filter(
        (f) =>
          f.name.toLowerCase().includes(query) ||
          f.serviceType.toLowerCase().includes(query) ||
          (f.serviceTypeDetail && f.serviceTypeDetail.toLowerCase().includes(query)) ||
          f.community.toLowerCase().includes(query) ||
          f.postalCode.toLowerCase().includes(query) ||
          f.erLevel.toLowerCase().includes(query) ||
          f.specialties.some((s) => s.toLowerCase().includes(query))
      );
    }

    // Filter buttons (all, level1, pediatric, hospital)
    if (filter === "level1") {
      matched = matched.filter((f) => f.erLevel === "Level 1 Trauma");
    } else if (filter === "pediatric") {
      matched = matched.filter(
        (f) => f.erLevel === "Pediatric Hospital" || f.specialties.some((s) => s.toLowerCase().includes("pediatric") || s.toLowerCase().includes("child"))
      );
    } else if (filter === "hospital") {
      matched = matched.filter(
        (f) => f.serviceType.toLowerCase().includes("hospital") || f.erLevel.includes("Hospital") || f.erLevel.includes("Trauma")
      );
    }

    // Sort order
    if (sortBy === "totalTime") {
      matched.sort((a, b) => a.totalTimeMin - b.totalTimeMin);
    } else if (sortBy === "waitTime") {
      matched.sort((a, b) => a.waitTimeMin - b.waitTimeMin);
    } else if (sortBy === "driveTime") {
      matched.sort((a, b) => a.driveTimeMin - b.driveTimeMin);
    } else if (sortBy === "distance") {
      matched.sort((a, b) => a.distanceMiles - b.distanceMiles);
    }

    const paged = matched.slice(0, limit);

    return NextResponse.json({
      success: true,
      totalCount: matched.length,
      returnedCount: paged.length,
      query,
      filter,
      sortBy,
      facilities: paged,
    });
  } catch (error: any) {
    console.error("Healthcare facility search failed:", error);
    return NextResponse.json(
      { error: "Search failed", details: error?.message },
      { status: 500 }
    );
  }
}
