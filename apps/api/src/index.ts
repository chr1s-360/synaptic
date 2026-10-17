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
