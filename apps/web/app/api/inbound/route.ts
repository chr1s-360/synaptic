import { NextResponse } from "next/server";
import client from "database";

export const dynamic = "force-dynamic";

// GET /api/inbound?hospitalId=xxx
// Fetches real-time tickets directly from Timescale Cloud DB
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const hospitalId = searchParams.get("hospitalId");

        const tickets = await client.inboundTicket.findMany({
            where: hospitalId && hospitalId !== "all" ? { hospitalId } : undefined,
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(tickets);
    } catch (error) {
        console.error("Failed to fetch inbound tickets:", error);
        return NextResponse.json(
            { error: "Failed to fetch tickets from database" },
            { status: 500 }
        );
    }
}

// POST /api/inbound
// Saves a new patient notification into Timescale Cloud DB
export async function POST(req: Request) {
    try {
        const body = await req.json();

        const hospitalId =
            typeof body.hospitalId === "string" ? body.hospitalId.trim() : "";
        const chiefComplaint =
            typeof body.chiefComplaint === "string" ? body.chiefComplaint.trim() : "";
        const patientAge = body.patientAge;
        const selfReportedSeverity = body.selfReportedSeverity;

        if (!hospitalId || !chiefComplaint) {
            return NextResponse.json(
                { error: "hospitalId and chiefComplaint are required" },
                { status: 400 }
            );
        }

        if (!Number.isInteger(patientAge) || patientAge < 0 || patientAge > 130) {
            return NextResponse.json(
                { error: "patientAge must be an integer between 0 and 130" },
                { status: 400 }
            );
        }

        if (
            !Number.isInteger(selfReportedSeverity) ||
            selfReportedSeverity < 1 ||
            selfReportedSeverity > 5
        ) {
            return NextResponse.json(
                { error: "selfReportedSeverity must be an integer from 1 to 5" },
                { status: 400 }
            );
        }

        const etaMinutes =
            Number.isInteger(body.etaMinutes) && body.etaMinutes >= 0
                ? body.etaMinutes
                : null;

        const ticket = await client.inboundTicket.create({
            data: {
                hospitalId,
                chiefComplaint,
                patientAge,
                selfReportedSeverity,
                etaMinutes,
                status: "incoming",
            },
        });

        return NextResponse.json(ticket, { status: 201 });
    } catch (error) {
        console.error("Failed to create inbound ticket:", error);
        return NextResponse.json(
            { error: "Database error creating ticket" },
            { status: 500 }
        );
    }
}

// PATCH /api/inbound
// Updates ticket status in DB (e.g., mark arrived, triaged, admitted, cancelled)
export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const id = typeof body.id === "string" ? body.id : String(body.id || "");
        const status = typeof body.status === "string" ? body.status : "";

        if (!id || !status) {
            return NextResponse.json(
                { error: "id and status are required" },
                { status: 400 }
            );
        }

        const updated = await client.inboundTicket.update({
            where: { id },
            data: { status },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Failed to update ticket status:", error);
        return NextResponse.json(
            { error: "Failed to update ticket" },
            { status: 500 }
        );
    }
}
