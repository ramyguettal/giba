import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { modifyReformulation } from "@/lib/mock-data";
import { Locale, ReformulatedReport } from "@/lib/types";

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const payload = (await request.json()) as {
    cleanFields: ReformulatedReport;
    instruction: string;
    locale?: Locale;
  };

  return NextResponse.json(
    modifyReformulation(payload.cleanFields, payload.instruction, payload.locale),
  );
}
