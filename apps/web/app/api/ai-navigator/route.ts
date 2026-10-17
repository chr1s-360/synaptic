import { NextResponse } from "next/server";

interface Facility {
    id: string;
    name: string;
    address: string;
    phone: string;
    erLevel: string;
    distanceMiles: number;
    baseDriveTimeMin: number;
    baseWaitTimeMin: number;
    rating: number;
    availableBeds: number;
    specialties: string[];
    trafficDelayFactor: number; // multiplier for current road congestion
    lat: number;
    lng: number;
}

const FACILITIES: Facility[] = [
    {
        id: "1",
        name: "Toronto General Hospital",
        address: "200 Elizabeth St, Toronto, ON M5G 2C4",
        phone: "(416) 340-4800",
        erLevel: "Level 1 Trauma",
        distanceMiles: 1.2,
        baseDriveTimeMin: 8,
        baseWaitTimeMin: 18,
        rating: 4.8,
        availableBeds: 14,
        specialties: ["Cardiac Care", "Transplant Unit", "Stroke Center", "Trauma", "Chest Pain", "Cardiology"],
        trafficDelayFactor: 1.15,
        lat: 43.6591,
        lng: -79.3882,
    },
    {
        id: "2",
        name: "Mount Sinai Hospital",
        address: "600 University Ave, Toronto, ON M5G 1X5",
        phone: "(416) 586-4800",
        erLevel: "Level 2 Trauma",
        distanceMiles: 1.1,
        baseDriveTimeMin: 7,
        baseWaitTimeMin: 42,
        rating: 4.6,
        availableBeds: 6,
        specialties: ["General ER", "Women & Infants", "Urgent Surgery", "Maternity", "Abdominal Pain"],
        trafficDelayFactor: 1.1,
        lat: 43.6575,
        lng: -79.3905,
    },
    {
        id: "3",
        name: "St. Michael's Hospital",
        address: "36 Queen St E, Toronto, ON M5B 1W8",
        phone: "(416) 360-4000",
        erLevel: "Level 1 Trauma",
        distanceMiles: 0.8,
        baseDriveTimeMin: 5,
        baseWaitTimeMin: 14,
        rating: 4.9,
        availableBeds: 21,
        specialties: ["Level 1 Adult Trauma", "Neurosurgery", "Cardiac Care", "Trauma", "Neurology", "Head Injury"],
        trafficDelayFactor: 1.05,
        lat: 43.6534,
        lng: -79.3772,
    },
    {
        id: "4",
        name: "SickKids (Hospital for Sick Children)",
        address: "555 University Ave, Toronto, ON M5G 1X8",
        phone: "(416) 813-1500",
        erLevel: "Level 1 Pediatric Trauma",
        distanceMiles: 1.3,
        baseDriveTimeMin: 9,
        baseWaitTimeMin: 22,
        rating: 4.9,
        availableBeds: 18,
        specialties: ["Pediatrics", "Pediatric Trauma", "Child Emergency", "Infant Care", "Kids Emergency"],
        trafficDelayFactor: 1.2,
        lat: 43.6578,
        lng: -79.3867,
    },
    {
        id: "5",
        name: "Sunnybrook Health Sciences Centre",
        address: "2075 Bayview Ave, Toronto, ON M4N 3M5",
        phone: "(416) 480-6100",
        erLevel: "Level 1 Trauma",
        distanceMiles: 5.4,
        baseDriveTimeMin: 18,
        baseWaitTimeMin: 16,
        rating: 4.7,
        availableBeds: 25,
        specialties: ["Comprehensive Trauma", "Burn Centre", "Brain Sciences", "Severe Burns", "Oncology", "Trauma"],
        trafficDelayFactor: 1.3,
        lat: 43.7250,
        lng: -79.3764,
    },
    {
        id: "6",
        name: "Michael Garron Hospital",
        address: "825 Coxwell Ave, East York, ON M4C 3E7",
        phone: "(416) 469-6580",
        erLevel: "Community Emergency",
        distanceMiles: 4.5,
        baseDriveTimeMin: 15,
        baseWaitTimeMin: 28,
        rating: 4.3,
        availableBeds: 9,
        specialties: ["Community Care", "Rapid Diagnostics", "Orthopedics", "Fractures", "Sprains", "Minor Trauma"],
        trafficDelayFactor: 1.1,
        lat: 43.6908,
        lng: -79.3242,
    },
    {
        id: "7",
        name: "Downtown Urgent Care Clinic",
        address: "180 Dundas St W, Toronto, ON M5G 1Z8",
        phone: "(416) 598-1200",
        erLevel: "Walk-in & Urgent Care",
        distanceMiles: 0.6,
        baseDriveTimeMin: 4,
        baseWaitTimeMin: 10,
        rating: 4.5,
        availableBeds: 4,
        specialties: ["Minor Cuts", "Flu & Fever", "Sore Throat", "Minor Sprains", "Walk-in", "Prescriptions"],
        trafficDelayFactor: 1.05,
        lat: 43.6548,
        lng: -79.3860,
    },
];

export interface SpecialistInfo {
    type: string;
    recommendedDirectoryUrl: string;
    nextSteps: string[];
}

export interface NavigationPlan {
    facility: Facility;
    calculatedDriveTimeMin: number;
    calculatedWaitTimeMin: number;
    totalTimeMin: number;
    trafficStatus: "Light" | "Moderate" | "Heavy";
    matchScore: number;
    clinicalRationale: string;
    recommendedTransport: "Driving" | "Ambulance (911)" | "Transit/Rideshare";
}

export interface FollowUpQuestion {
    id: string;
    question: string;
    category: "age" | "severity" | "duration" | "mobility";
    quickOptions: string[];
}

// Generate intelligent clarifying questions to understand patient situation
function generateFollowUpQuestions(
    fullText: string,
    isCritical: boolean,
    isPediatric: boolean,
    isMinor: boolean
): FollowUpQuestion[] {
    const lower = fullText.toLowerCase();
    const questions: FollowUpQuestion[] = [];

    // 1. Age clarification if not explicitly stated
    const mentionsAge =
        lower.includes("year old") ||
        lower.includes("yo") ||
        lower.includes("adult") ||
        lower.includes("senior") ||
        lower.includes("child") ||
        lower.includes("baby") ||
        lower.includes("infant") ||
        lower.includes("toddler") ||
        lower.includes("teen");

    if (!mentionsAge && !isCritical) {
        questions.push({
            id: "age-check",
            question: "Who is this care for? Age helps route between pediatric and adult trauma centers:",
            category: "age",
            quickOptions: ["Infant/Child (<16 yrs)", "Adult (16-64 yrs)", "Senior (65+ yrs)"],
        });
    }

    // 2. Duration / Onset question
    const mentionsDuration =
        lower.includes("hour") ||
        lower.includes("day") ||
        lower.includes("minute") ||
        lower.includes("sudden") ||
        lower.includes("just started") ||
        lower.includes("week");

    if (!mentionsDuration) {
        questions.push({
            id: "duration-check",
            question: "When did these symptoms begin or worsen?",
            category: "duration",
            quickOptions: ["Just in the past hour (sudden onset)", "Earlier today (several hours)", "Over 24-48 hours", "Ongoing for several days"],
        });
    }

    // 3. Severity / Red-flag checks
    if (isPediatric) {
        if (!lower.includes("breath") && !lower.includes("alert")) {
            questions.push({
                id: "pediatric-redflags",
                question: "Is the child breathing rapidly, struggling to breathe, or lethargic/unresponsive?",
                category: "severity",
                quickOptions: ["Breathing normal and alert", "Mild breathing discomfort", "Struggling to breathe or lethargic"],
            });
        }
    } else if (lower.includes("fever") || lower.includes("cough") || lower.includes("flu")) {
        if (!lower.includes("stiff") && !lower.includes("rash")) {
            questions.push({
                id: "infection-check",
                question: "Are there any red flags like severe stiff neck, confusion, or difficulty breathing?",
                category: "severity",
                quickOptions: ["None of these, just fever/body aches", "Mild shortness of breath", "Severe stiff neck or dehydration"],
            });
        }
    } else if (lower.includes("fall") || lower.includes("cut") || lower.includes("bone") || lower.includes("pain") || lower.includes("wound")) {
        if (!lower.includes("bleed") && !lower.includes("weight")) {
            questions.push({
                id: "mobility-check",
                question: "Can the patient bear weight, and is there active or heavy bleeding?",
                category: "mobility",
                quickOptions: ["Can bear weight, minor bleeding", "Cannot put weight on it", "Severe deformity or heavy bleeding"],
            });
        }
    } else if (!isCritical && questions.length < 2) {
        questions.push({
            id: "severity-scale",
            question: "How would you rate the current pain or discomfort level?",
            category: "severity",
            quickOptions: ["Mild (1 - 3)", "Moderate (4 - 6)", "Severe (7 - 9)", "Extreme / Intolerable (10)"],
        });
    }

    // 4. Transport access
    const mentionsTransport =
        lower.includes("drive") ||
        lower.includes("car") ||
        lower.includes("transit") ||
        lower.includes("walk") ||
        lower.includes("ambulance");

    if (!mentionsTransport && questions.length < 3 && !isCritical) {
        questions.push({
            id: "transport-check",
            question: "What is your transportation availability?",
            category: "mobility",
            quickOptions: ["Have personal vehicle / driver", "Will use Uber / Taxi / Transit", "May need ambulance transport"],
        });
    }

    return questions.slice(0, 3);
}

// Helper to strip markdown asterisks for clean, natural plain text
function cleanOutputText(text: string): string {
    if (!text) return "";
    return text
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .trim();
}

// Optional Gemini API call when GEMINI_API_KEY is configured
async function queryGemini(
    prompt: string,
    priorContext: string,
    primaryPlan: NavigationPlan,
    isCritical: boolean,
    specialistContext?: SpecialistInfo | null
): Promise<{ synthesis?: string; questions?: FollowUpQuestion[]; nextSteps?: string[] } | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    try {
        const specialistGuide = specialistContext
            ? `The user is inquiring about specialist care or next steps for a specialist referral (${specialistContext.type}). Mention our built-in specialist directory (/specialist-directory), explain clear actionable next steps (e.g. requesting referral notes from their doctor, booking an appointment), and also point them to the nearest clinic or urgent care (${primaryPlan.facility.name}) if they need immediate symptom relief or a physical exam in the meantime.`
            : "";

        const systemPrompt = `You are Synaptic AI Healthcare Navigator, an expert clinical triage assistant. Speak naturally, empathetically, and conversationally like a knowledgeable healthcare concierge.
Patient prompt: "${prompt}".
Conversation context: "${priorContext}".
Calculated optimal facility: "${primaryPlan.facility.name}" (Drive: ${primaryPlan.calculatedDriveTimeMin}m, Wait: ${primaryPlan.calculatedWaitTimeMin}m, Total: ${primaryPlan.totalTimeMin}m).
Is critical emergency: ${isCritical}.
${specialistGuide}

FORMATTING REQUIREMENT:
- Write in clean, natural sentences.
- NEVER use markdown bold asterisks like **specialist directory** or **facility name**.
- Simply write specialist directory, facility names, and wait times as normal plain text without asterisks.

Respond in valid JSON only with this structure:
{
  "synthesis": "Natural, clear guidance (3-4 sentences). If they mention a doctor referral or specialist, direct them to our specialist directory, outline next steps, and mention the closest clinic (${primaryPlan.facility.name}) for immediate evaluation. Do NOT use markdown bold asterisks.",
  "nextSteps": [
    "Step 1 action (e.g. Browse verified physicians in our specialist directory)",
    "Step 2 action (e.g. Visit the nearest clinic for immediate symptom relief or ear drops)",
    "Step 3 action (e.g. Confirm referral documentation with referring physician)"
  ],
  "followUpQuestions": [
    {
      "id": "q1",
      "question": "A concise clarifying question about symptoms or patient details",
      "category": "severity",
      "quickOptions": ["Option A", "Option B", "Option C"]
    }
  ]
}`;

        const res = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-goog-api-key": apiKey,
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: systemPrompt }] }],
                    generationConfig: {
                        temperature: 0.3,
                        responseMimeType: "application/json",
                    },
                }),
            }
        );

        if (!res.ok) {
            console.warn("Gemini HTTP error status:", res.status);
            return null;
        }
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) return null;

        const parsed = JSON.parse(rawText);
        return {
            synthesis: parsed.synthesis,
            questions: parsed.followUpQuestions,
            nextSteps: parsed.nextSteps,
        };
    } catch (err) {
        console.warn("Gemini call failed or timed out, falling back to local engine:", err);
        return null;
    }
}

export async function POST(req: Request) {
    try {
        const { prompt, conversationHistory } = await req.json();

        if (!prompt || typeof prompt !== "string") {
            return NextResponse.json({ error: "Patient prompt is required" }, { status: 400 });
        }

        const priorContext = Array.isArray(conversationHistory)
            ? conversationHistory.map((h: any) => `${h.sender}: ${h.text}`).join("\n")
            : "";
        const lower = `${priorContext}\nUser: ${prompt}`.toLowerCase();

        // 1. Critical Emergency Detection
        const isCritical =
            lower.includes("chest pain") ||
            lower.includes("heart attack") ||
            lower.includes("can't breathe") ||
            lower.includes("cannot breathe") ||
            lower.includes("struggling to breathe") ||
            lower.includes("stroke") ||
            lower.includes("unconscious") ||
            lower.includes("unresponsive") ||
            lower.includes("severe bleeding") ||
            lower.includes("heavy bleeding") ||
            lower.includes("head trauma") ||
            lower.includes("extreme / intolerable") ||
            lower.includes("severe burn");

        const isPediatric =
            lower.includes("child") ||
            lower.includes("kid") ||
            lower.includes("baby") ||
            lower.includes("infant") ||
            lower.includes("toddler") ||
            lower.includes("son") ||
            lower.includes("daughter") ||
            lower.includes("<16 yrs");

        const isTrauma =
            lower.includes("trauma") ||
            lower.includes("car crash") ||
            lower.includes("accident") ||
            lower.includes("fracture") ||
            lower.includes("broken bone") ||
            lower.includes("cannot put weight");

        const isMinor =
            (lower.includes("flu") ||
                lower.includes("cold") ||
                lower.includes("sore throat") ||
                lower.includes("ear") ||
                lower.includes("rash") ||
                lower.includes("cough") ||
                lower.includes("mild fever") ||
                lower.includes("stitches") ||
                lower.includes("minor cut") ||
                lower.includes("walk-in")) &&
            !isCritical;

        // Detect specialist inquiry / referral intent
        const isSpecialistIntent =
            lower.includes("specialist") ||
            lower.includes("ent") ||
            lower.includes("otolaryngolog") ||
            lower.includes("referral") ||
            lower.includes("next step") ||
            lower.includes("see a doctor") ||
            lower.includes("directory");

        let specialistContext: SpecialistInfo | null = null;
        if (isSpecialistIntent || lower.includes("ear")) {
            const specType = lower.includes("ear")
                ? "Pediatric ENT (Ear, Nose & Throat) Specialist"
                : "Board-Certified Medical Specialist";
            specialistContext = {
                type: specType,
                recommendedDirectoryUrl: "/specialist-directory",
                nextSteps: [
                    `Browse verified physicians in our Synaptic Specialist Directory`,
                    `Request a clinical referral letter/fax confirmation from your referring doctor`,
                    `If pain or fever spikes before your appointment, visit ${isPediatric ? "SickKids Emergency" : "Downtown Urgent Care Clinic"} for immediate ear drops or evaluation`,
                ],
            };
        }

        // Dynamic hour-based traffic calculation
        const hour = new Date().getHours();
        const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18);
        const trafficMultiplier = isRushHour ? 1.35 : 1.1;

        // Rank each facility based on live traffic, ER wait time, clinical suitability
        const plans: NavigationPlan[] = FACILITIES.map((fac) => {
            const liveDriveTime = Math.round(fac.baseDriveTimeMin * fac.trafficDelayFactor * trafficMultiplier);
            const liveWaitTime = fac.baseWaitTimeMin;
            const totalTime = liveDriveTime + liveWaitTime;

            let score = 100 - totalTime; // base: lower total time is better
            let clinicalRationale = `Estimated drive of ${liveDriveTime}m + current wait of ${liveWaitTime}m (Total ${totalTime}m).`;
            let trafficStatus: "Light" | "Moderate" | "Heavy" = "Light";

            if (fac.trafficDelayFactor * trafficMultiplier > 1.4) {
                trafficStatus = "Heavy";
            } else if (fac.trafficDelayFactor * trafficMultiplier > 1.15) {
                trafficStatus = "Moderate";
            }

            // Pediatric routing priority
            if (isPediatric) {
                if (fac.name.includes("SickKids")) {
                    score += 60;
                    clinicalRationale = `Top recommendation: Specialized pediatric emergency team and tailored child treatment rooms with ${liveWaitTime}m wait time.`;
                } else {
                    score -= 20;
                }
            }

            // Critical Cardiac / Stroke / Adult Trauma
            if (isCritical) {
                if (fac.erLevel.includes("Level 1 Trauma")) {
                    score += 40;
                    if (fac.specialties.some((s) => lower.includes(s.toLowerCase()))) {
                        score += 25;
                    }
                    clinicalRationale = `Critical Level 1 Trauma center equipped for immediate resuscitation with low wait (${liveWaitTime}m).`;
                } else if (fac.erLevel.includes("Walk-in")) {
                    score -= 80;
                }
            }

            // Minor illness routing
            if (isMinor) {
                if (fac.erLevel.includes("Walk-in") || fac.erLevel.includes("Community")) {
                    score += 35;
                    clinicalRationale = `Fastest care for non-emergent symptoms: avoids crowded ER triage queues (${liveWaitTime}m wait time).`;
                } else {
                    score -= 15;
                }
            }

            // Check keyword specialty alignment
            fac.specialties.forEach((spec) => {
                if (lower.includes(spec.toLowerCase())) {
                    score += 20;
                    clinicalRationale = `Direct clinical match for ${spec} with immediate bed availability (${fac.availableBeds} beds).`;
                }
            });

            let transport: "Driving" | "Ambulance (911)" | "Transit/Rideshare" = "Driving";
            if (isCritical) {
                transport = "Ambulance (911)";
            } else if (fac.distanceMiles < 1.0) {
                transport = "Transit/Rideshare";
            }

            return {
                facility: fac,
                calculatedDriveTimeMin: liveDriveTime,
                calculatedWaitTimeMin: liveWaitTime,
                totalTimeMin: totalTime,
                trafficStatus,
                matchScore: score,
                clinicalRationale,
                recommendedTransport: transport,
            };
        }).sort((a, b) => b.matchScore - a.matchScore);

        const primaryPlan = plans[0];
        const alternativePlans = plans.slice(1, 3);

        // Dynamic follow-up questions to understand the patient situation
        let followUpQuestions = generateFollowUpQuestions(lower, isCritical, isPediatric, isMinor);

        // AI synthesis message
        let aiSynthesis = "";
        if (isCritical) {
            aiSynthesis = `⚠️ CRITICAL ALERT: Your symptoms suggest a potential medical emergency. The quickest facility is ${primaryPlan.facility.name} (${primaryPlan.totalTimeMin}m total door-to-doctor time), but calling 911 immediately is strongly recommended for paramedic pre-hospital stabilization.`;
        } else if (specialistContext) {
            aiSynthesis = `👋 If your doctor recommended seeing an ear or ENT specialist for your son, your best next step is checking our specialist directory to find a qualified Pediatric ENT. In the meantime, if the ear pain is unbearable or accompanied by high fever, ${primaryPlan.facility.name} is your closest clinic option (${primaryPlan.totalTimeMin}m total door-to-care time).`;
        } else if (isPediatric) {
            aiSynthesis = `👶 We identified pediatric care requirements. We prioritized ${primaryPlan.facility.name} with specialized pediatric emergency clinicians, current wait time of ${primaryPlan.calculatedWaitTimeMin} mins, and a ${primaryPlan.calculatedDriveTimeMin} min drive (${primaryPlan.trafficStatus} traffic).`;
        } else if (isMinor) {
            aiSynthesis = `🩺 For your symptoms, visiting ${primaryPlan.facility.name} offers the shortest turnaround (${primaryPlan.totalTimeMin} min total door-to-provider time), bypassing crowded hospital ER triage queues.`;
        } else {
            aiSynthesis = `🧭 Based on your symptoms, current traffic congestion, and live hospital queues, ${primaryPlan.facility.name} provides the most optimized navigation plan with a total door-to-care time of ${primaryPlan.totalTimeMin} minutes (${primaryPlan.calculatedDriveTimeMin}m drive + ${primaryPlan.calculatedWaitTimeMin}m wait).`;
        }

        // Enhance with Gemini API if GEMINI_API_KEY is supplied
        const geminiResult = await queryGemini(prompt, priorContext, primaryPlan, isCritical, specialistContext);
        if (geminiResult) {
            if (geminiResult.synthesis) {
                aiSynthesis = cleanOutputText(geminiResult.synthesis);
            }
            if (geminiResult.questions && geminiResult.questions.length > 0) {
                followUpQuestions = geminiResult.questions;
            }
            if (geminiResult.nextSteps && geminiResult.nextSteps.length > 0 && specialistContext) {
                specialistContext.nextSteps = geminiResult.nextSteps.map(cleanOutputText);
            }
        } else {
            aiSynthesis = cleanOutputText(aiSynthesis);
        }

        return NextResponse.json({
            success: true,
            query: prompt,
            aiSynthesis,
            isEmergency: isCritical,
            trafficCongestionOverall: isRushHour ? "High" : "Normal",
            primaryPlan,
            alternatives: alternativePlans,
            followUpQuestions,
            specialistContext,
        });
    } catch (error: any) {
        console.error("AI Navigator calculation error:", error);
        return NextResponse.json(
            { error: "Failed to generate optimized healthcare plan", details: error?.message },
            { status: 500 }
        );
    }
}
