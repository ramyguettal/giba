/** Shared domain types for the GIBA workspace frontend. */

export type Locale = "en" | "fr";

export type ThemeMode = "light" | "dark";

export type UserRole = "admin" | "repairer";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  /** Machine types this user is authorized to query and report on. */
  allowedMachineTypes: string[];
}

export interface LoginPayload {
  username: string;
  password: string;
}

export type ConfidenceLevel = "high" | "medium" | "low";

export interface Citation {
  id: string;
  title: string;
  source: string;
  machine_type: string;
  excerpt: string;
  score: number;
  section?: string;
  page?: number;
}

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatAnswer {
  answer: string;
  confidenceScore: number;
  confidenceLevel: ConfidenceLevel;
  citations: Citation[];
  mode: "answer" | "clarify";
  clarificationQuestion?: string;
}

export interface ReportDraft {
  machine_type: string;
  problem: string;
  cause: string;
  solution: string;
}

export interface ReformulatedReport {
  clean_problem: string;
  clean_cause: string;
  clean_solution: string;
}

export type IngestionJobStatus = "queued" | "processing" | "completed" | "failed";
export type IngestionJobType = "manual" | "manufacturer-alert";

export interface IngestionJob {
  id: string;
  status: IngestionJobStatus;
  type: IngestionJobType;
  machineType: string;
  title: string;
  detail: string;
  error?: string;
  createdAt: string;
}

export interface ReportListItem {
  id: string;
  userId: string;
  username: string;
  machineType: string;
  problem: string;
  cause: string;
  solution: string;
  cleanProblem: string;
  cleanCause: string;
  cleanSolution: string;
  source: string;
  isIndexed: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalReports: number;
  totalQueries: number;
  lowConfidenceQueries: number;
  activeJobs: number;
  reportsByMachine: Record<string, number>;
  recentActivity: Array<{ action: string; timestamp: string }>;
}
