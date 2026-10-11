import { cookies } from "next/headers";
import { getDB, generateId } from "../db";
import { User, UserRole } from "@/types";

const SESSION_COOKIE_NAME = "crew_vault_session";
const SESSION_DURATION_DAYS = 30;

// Web Crypto PBKDF2 Password Hashing (Cloudflare Worker compatible)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const exportedKey = new Uint8Array(await crypto.subtle.exportKey("raw", derivedKey));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(exportedKey).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const [saltHex, originalHashHex] = storedHash.split(':');
    if (!saltHex || !originalHashHex) return false;

    const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    const exportedKey = new Uint8Array(await crypto.subtle.exportKey("raw", derivedKey));
    const newHashHex = Array.from(exportedKey).map(b => b.toString(16).padStart(2, '0')).join('');
    return newHashHex === originalHashHex;
  } catch (err) {
    return false;
  }
}

export async function createSession(userId: string): Promise<string> {
  const db = await getDB();
  const sessionId = generateId("sess");
  const tokenArray = new Uint8Array(32);
  crypto.getRandomValues(tokenArray);
  const token = Array.from(tokenArray).map(b => b.toString(16).padStart(2, '0')).join('');
  
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  await db
    .prepare("INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)")
    .bind(sessionId, userId, token, expiresAt)
    .run();

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });

  return token;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    try {
      const db = await getDB();
      await db.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
    } catch (e) {
      // Ignore if session already deleted
    }
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const db = await getDB();
    const sessionRow = await db
      .prepare(
        `SELECT s.expires_at, u.id, u.email, u.full_name, u.role, u.airline, 
                u.aircraft_studied, u.subjects_studied, u.avatar_url, u.is_suspended, 
                u.created_at, u.updated_at
         FROM sessions s
         JOIN users u ON s.user_id = u.id
         WHERE s.token = ?`
      )
      .bind(token)
      .first<any>();

    if (!sessionRow) return null;

    if (new Date(sessionRow.expires_at) < new Date()) {
      await destroySession();
      return null;
    }

    if (sessionRow.is_suspended) {
      return null;
    }

    return {
      id: sessionRow.id,
      email: sessionRow.email,
      full_name: sessionRow.full_name,
      role: sessionRow.role as UserRole,
      airline: sessionRow.airline,
      aircraft_studied: sessionRow.aircraft_studied ? JSON.parse(sessionRow.aircraft_studied) : [],
      subjects_studied: sessionRow.subjects_studied ? JSON.parse(sessionRow.subjects_studied) : [],
      avatar_url: sessionRow.avatar_url,
      is_suspended: Boolean(sessionRow.is_suspended),
      created_at: sessionRow.created_at,
      updated_at: sessionRow.updated_at,
    };
  } catch (err) {
    return null;
  }
}

export async function requireAuth(requiredRole?: UserRole): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  if (requiredRole) {
    const roles: UserRole[] = ["MEMBER", "MANAGER", "ADMIN"];
    const userRoleIndex = roles.indexOf(user.role);
    const requiredRoleIndex = roles.indexOf(requiredRole);

    if (userRoleIndex < requiredRoleIndex) {
      throw new Error("FORBIDDEN");
    }
  }

  return user;
}

export async function requireRole(allowedRoles: UserRole[]): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  if (!allowedRoles.includes(user.role)) throw new Error("FORBIDDEN");
  return user;
}
