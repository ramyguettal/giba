"use client";

import { AuthProvider } from "@/hooks/use-auth";
import { User } from "@/lib/types";

export function AuthProviderShell({
  initialUser,
  children,
}: {
  initialUser: User | null;
  children: React.ReactNode;
}) {
  return <AuthProvider initialUser={initialUser}>{children}</AuthProvider>;
}
