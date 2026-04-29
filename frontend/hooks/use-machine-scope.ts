"use client";

import { useMemo } from "react";

import { useAuth } from "@/hooks/use-auth";

export function useMachineScope() {
  const { user } = useAuth();

  return useMemo(
    () => ({
      machines: user?.allowedMachineTypes ?? [],
      hasMachine(machineType: string) {
        return user?.allowedMachineTypes.includes(machineType) ?? false;
      },
    }),
    [user],
  );
}
