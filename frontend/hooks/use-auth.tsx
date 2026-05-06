"use client";

import { createContext, useContext, useMemo, useState } from "react";

import { authApi } from "@/lib/api";
import { LoginPayload, User } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  initialUser,
  children,
}: {
  initialUser: User | null;
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(false);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(credentials) {
        setLoading(true);

        try {
          const result = await authApi.login(credentials);
          setUser(result.user);
        } finally {
          setLoading(false);
        }
      },
      async logout() {
        setLoading(true);

        try {
          await fetch("/api/auth/logout", { method: "POST" });
          setUser(null);
        } finally {
          setLoading(false);
        }
      },
      async refresh() {
        setLoading(true);

        try {
          const result = await authApi.refreshToken();
          setUser(result.user);
        } finally {
          setLoading(false);
        }
      },
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
