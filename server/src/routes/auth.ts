import { Router, type Request, type Response } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { users } from "../db/schema";
import { signToken } from "../lib/jwt";
import { validate } from "../middleware/validate";
import { eq } from "drizzle-orm";

const router = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/register", validate(RegisterSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as z.infer<typeof RegisterSchema>;
    const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(users).values({ email, passwordHash }).returning();
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.status(201).json({ data: { token, user: { id: user.id, email: user.email, role: user.role } } });
  } catch {
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", validate(LoginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as z.infer<typeof LoginSchema>;
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.json({ data: { token, user: { id: user.id, email: user.email, role: user.role } } });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
});

export default router;

