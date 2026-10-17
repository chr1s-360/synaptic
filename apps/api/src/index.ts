import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { jwt, sign } from "hono/jwt";
import bcrypt from "bcryptjs";
import client from "database";

/*
 ** we can either initialize prismaClient here or just
 ** import it from the database package,
 ** but initializing here is not a good practice reason in `database/index.ts`
 */

const app = new Hono();
const PORT = 3000;

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}

// Never return the password hash
const publicUser = {
  id: true,
  email: true,
  name: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

app.use(
  "*",
  cors({
    origin: ["http://localhost:3000"],
  })
);

// Return JSON instead of plain-text errors
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message || "Error" }, err.status);
  }
  console.error(err);
  return c.json({ error: err.message || "Internal Server Error" }, 500);
});

// ---------- Public routes ----------

app.get("/ping", async (c) => {
  return c.json({ message: "pong" });
});


app.post("/api/inbound", async (c) => {
  const body = await c.req.json();

  const hospitalId =
    typeof body.hospitalId === "string" ? body.hospitalId.trim() : "";
  const chiefComplaint =
    typeof body.chiefComplaint === "string"
      ? body.chiefComplaint.trim()
      : "";
  const patientAge = body.patientAge;
  const selfReportedSeverity = body.selfReportedSeverity;

  // Validate the incoming information.
  if (!hospitalId || !chiefComplaint) {
    return c.json(
      { error: "hospitalId and chiefComplaint are required" },
      400
    );
  }

  if (
    !Number.isInteger(patientAge) ||
    patientAge < 0 ||
    patientAge > 130
  ) {
    return c.json(
      { error: "patientAge must be an integer between 0 and 130" },
      400
    );
  }

  if (
    !Number.isInteger(selfReportedSeverity) ||
    selfReportedSeverity < 1 ||
    selfReportedSeverity > 5
  ) {
    return c.json(
      { error: "selfReportedSeverity must be an integer from 1 to 5" },
      400
    );
  }

  // Save the ticket in the database.
  const ticket = await client.inboundTicket.create({
    data: {
      hospitalId,
      chiefComplaint,
      patientAge,
      selfReportedSeverity,
    },
  });

  return c.json(ticket, 201);
});

//get incoming tickets

app.get("/api/inbound", async (c) => {
  const hospitalId = c.req.query("hospitalId");

  const tickets = await client.inboundTicket.findMany({
    where: hospitalId ? { hospitalId } : undefined,
    orderBy: {
      createdAt: "desc",
    },
  });

  return c.json(tickets);
});

app.post("/api/specialists", async (c) => {
  const body = await c.req.json();

  const displayName =
    typeof body.displayName === "string" ? body.displayName.trim() : "";
  const specialty =
    typeof body.specialty === "string" ? body.specialty.trim() : "";
  const language =
    typeof body.language === "string" ? body.language.trim() : "";
  const location =
    typeof body.location === "string" ? body.location.trim() : "";
  const phoneNumber =
    typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : "";
  const acceptingNewPatients = body.acceptingNewPatients ?? true;

  if (
    !displayName ||
    !specialty ||
    !language ||
    !location ||
    !phoneNumber
  ) {
    return c.json(
      {
        error:
          "displayName, specialty, language, location, and phoneNumber are required",
      },
      400
    );
  }

  if (typeof acceptingNewPatients !== "boolean") {
    return c.json(
      { error: "acceptingNewPatients must be true or false" },
      400
    );
  }

  const specialist = await client.specialist.create({
    data: {
      displayName,
      specialty,
      language,
      location,
      phoneNumber,
      acceptingNewPatients,
    },
  });

  return c.json(specialist, 201);
});
app.get("/api/specialists", async (c) => {
  const search = c.req.query("search")?.trim();
  const specialty = c.req.query("specialty")?.trim();
  const language = c.req.query("language")?.trim();
  const acceptingOnly = c.req.query("acceptingOnly") === "true";

  const specialists = await client.specialist.findMany({
    where: {
      ...(search
        ? {
            displayName: {
              contains: search,
              mode: "insensitive",
            },
          }
        : {}),
      ...(specialty ? { specialty } : {}),
      ...(language ? { language } : {}),
      ...(acceptingOnly ? { acceptingNewPatients: true } : {}),
    },
    orderBy: {
      displayName: "asc",
    },
  });

  return c.json(specialists);
});



app.post("/auth/signup", async (c) => {
  const { name, email, password } = await c.req.json();
  if (!email || !password) {
    return c.json({ error: "email and password are required" }, 400);
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await client.user.create({
    data: { name, email, password: hashed },
    select: publicUser,
  });
  return c.json(user, 201);
});

app.post("/auth/login", async (c) => {
  const { email, password } = await c.req.json();
  const user = email
    ? await client.user.findUnique({ where: { email } })
    : null;
  if (!user || !password || !(await bcrypt.compare(password, user.password))) {
    return c.json({ error: "Invalid credentials" }, 401);
  }
  const token = await sign(
    { sub: user.id, exp: Math.floor(Date.now() / 1000) + 60 * 60 },
    JWT_SECRET
  );
  return c.json({ token });
});

// ---------- Protected routes (Authorization: Bearer <token>) ----------

app.use("/users", jwt({ secret: JWT_SECRET }));
app.use("/users/*", jwt({ secret: JWT_SECRET }));

const requireSelf = (c: any) => {
  const payload = c.get("jwtPayload");
  return Number(payload.sub) === Number(c.req.param("id"));
};

app.get("/users", async (c) => {
  const users = await client.user.findMany({ select: publicUser });
  return c.json(users);
});

app.get("/users/:id", async (c) => {
  const user = await client.user.findUnique({
    where: { id: Number(c.req.param("id")) },
    select: publicUser,
  });
  return c.json(user);
});

app.post("/users", async (c) => {
  const { name, email, password, status } = await c.req.json();
  if (!email || !password) {
    return c.json({ error: "email and password are required" }, 400);
  }
  const user = await client.user.create({
    data: { name, email, status, password: await bcrypt.hash(password, 10) },
    select: publicUser,
  });
  return c.json(user, 201);
});

app.put("/users/:id", async (c) => {
  if (!requireSelf(c)) return c.json({ error: "Forbidden" }, 403);
  const { name, email, password, status } = await c.req.json();
  const user = await client.user.update({
    where: { id: Number(c.req.param("id")) },
    data: {
      name,
      email,
      status,
      ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
    },
    select: publicUser,
  });
  return c.json(user);
});

app.delete("/users/:id", async (c) => {
  if (!requireSelf(c)) return c.json({ error: "Forbidden" }, 403);
  const user = await client.user.delete({
    where: { id: Number(c.req.param("id")) },
    select: publicUser,
  });
  return c.json(user);
});

serve({ fetch: app.fetch, port: Number(PORT) });
