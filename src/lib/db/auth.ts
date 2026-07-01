/**
 * Custom Auth System (MySQL + JWT + bcrypt)
 * Replaces Supabase Auth
 */
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query, queryOne, execute } from "./index";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
const JWT_EXPIRES = "7d";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "manager" | "staff";
  department_id: string | null;
  avatar_url: string | null;
}

export interface JWTPayload {
  sub: string; // user id
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Sign in with email + password. Returns JWT token + user profile.
 */
export async function signIn(email: string, password: string): Promise<{ token: string; user: AuthUser } | null> {
  const row = await queryOne<any>(
    "SELECT id, email, full_name, role, department_id, avatar_url, password_hash FROM profiles WHERE email = ? AND is_active = 1",
    [email]
  );
  if (!row) return null;

  const valid = await bcrypt.compare(password, row.password_hash);
  if (!valid) return null;

  const user: AuthUser = {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    role: row.role,
    department_id: row.department_id,
    avatar_url: row.avatar_url,
  };

  const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES,
  });

  return { token, user };
}

/**
 * Verify a JWT token and return the payload.
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Get user profile from token payload.
 */
export async function getUserFromToken(token: string): Promise<AuthUser | null> {
  const payload = verifyToken(token);
  if (!payload) return null;

  const row = await queryOne<any>(
    "SELECT id, email, full_name, role, department_id, avatar_url FROM profiles WHERE id = ? AND is_active = 1",
    [payload.sub]
  );
  if (!row) return null;

  return row as AuthUser;
}

/**
 * Hash a password for storage.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Create a new user with hashed password.
 */
export async function createUser(
  email: string,
  password: string,
  fullName: string,
  role: "admin" | "manager" | "staff" = "staff",
  departmentId?: string | null
): Promise<string> {
  const id = crypto.randomUUID();
  const hash = await hashPassword(password);
  await execute(
    "INSERT INTO profiles (id, full_name, email, role, department_id, password_hash, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)",
    [id, fullName, email, role, departmentId || null, hash]
  );
  return id;
}
