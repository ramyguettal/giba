import type {
  ChatAnswer,
  ChatHistoryMessage,
  IngestionJob,
  Locale,
  LoginPayload,
  ReformulatedReport,
  ReportDraft,
  ReportListItem,
  User,
} from "./types";

/** Parse a JSON response, throwing the server-provided error message on failure. */
async function parse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (data && typeof data.error === "string" && data.error) || "Request failed.";
    throw new Error(message);
  }
  return data as T;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parse<T>(res);
}

export const authApi = {
  login(credentials: LoginPayload): Promise<{ user: User }> {
    return postJson<{ user: User }>("/api/auth/login", credentials);
  },
  refreshToken(): Promise<{ user: User }> {
    return postJson<{ user: User }>("/api/auth/refresh", {});
  },
};

export const chatApi = {
  querySolution(input: {
    question: string;
    machine_type?: string;
    locale?: Locale;
    top_k?: number;
    history?: ChatHistoryMessage[];
  }): Promise<ChatAnswer> {
    return postJson<ChatAnswer>("/api/chat/query", input);
  },
};

export const reportApi = {
  reformulateReport(
    draft: ReportDraft & { locale?: Locale },
  ): Promise<ReformulatedReport> {
    return postJson<ReformulatedReport>("/api/reports/reformulate", draft);
  },
  modifyReformulation(input: {
    cleanFields: ReformulatedReport;
    instruction: string;
    locale?: Locale;
  }): Promise<ReformulatedReport> {
    return postJson<ReformulatedReport>("/api/reports/modify", input);
  },
  commitReport(
    payload: ReportDraft & ReformulatedReport & { locale?: Locale },
  ): Promise<{ id: string; machine_type: string }> {
    return postJson<{ id: string; machine_type: string }>(
      "/api/reports/commit",
      payload,
    );
  },
};

export const adminReportsApi = {
  listReports(): Promise<{ reports: ReportListItem[]; total: number }> {
    return postJson("/api/reports/list", {});
  },
  indexReport(id: string): Promise<void> {
    return postJson(`/api/reports/${id}/index`, {});
  },
  async deleteReport(id: string): Promise<void> {
    const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
    await parse(res);
  },
};

export const ingestionApi = {
  async submitManual(formData: FormData): Promise<IngestionJob> {
    const res = await fetch("/api/ingestion/manual", {
      method: "POST",
      body: formData,
    });
    return parse<IngestionJob>(res);
  },
  async submitManufacturerAlert(input: {
    title: string;
    machineType: string;
    detail: string;
    file?: File | null;
  }): Promise<IngestionJob> {
    if (input.file) {
      const form = new FormData();
      form.append("title", input.title);
      form.append("machineType", input.machineType);
      form.append("detail", input.detail);
      form.append("file", input.file);
      const res = await fetch("/api/ingestion/manufacturer-alert", { method: "POST", body: form });
      return parse<IngestionJob>(res);
    }
    return postJson<IngestionJob>("/api/ingestion/manufacturer-alert", input);
  },
};
