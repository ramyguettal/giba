import { cookies } from "next/headers";

import type { User, UserRole } from "@/lib/types";

export const SESSION_COOKIE = "giba_access_token";
export const REFRESH_COOKIE = "giba_refresh_token";

interface AccessClaims {
  sub?: string;
  username?: string;
  role?: string;
  allowed_machines?: unknown;
  exp?: number;
}

/**
 * Decode (without verifying) a JWT payload. The backend cryptographically
 * verifies every request, so for SSR we only need to read the claims to render
 * the right UI and gate routes.
 */
function decodeAccessToken(token: string): AccessClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const json = Buffer.from(parts[1], "base64url").toString("utf-8");
    return JSON.parse(json) as AccessClaims;
  } catch {
    return null;
  }
}

function normalizeRole(role: string | undefined): UserRole {
  return role === "admin" ? "admin" : "repairer";
}

/** Resolve the current user from the session cookie, or null if signed out. */
export async function getSessionUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const claims = decodeAccessToken(token);
  if (!claims?.sub) return null;

  return {
    id: claims.sub,
    name: claims.username ?? "",
    role: normalizeRole(claims.role),
    allowedMachineTypes: Array.isArray(claims.allowed_machines)
      ? claims.allowed_machines.map(String)
      : [],
  };
}

/** Raw access token for proxying authenticated requests to the backend. */
export async function getAccessToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

/** Whether a user may operate on a given machine scope. */
export function canAccessMachine(user: User, machineType: string | null | undefined): boolean {
  if (!machineType) return false;
  return (
    user.allowedMachineTypes.includes("*") ||
    user.allowedMachineTypes.includes(machineType)
  );
}
