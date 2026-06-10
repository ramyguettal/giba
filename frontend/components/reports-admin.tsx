"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  BookPlus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminReportsApi } from "@/lib/api";
import { ReportListItem } from "@/lib/types";
import { cn } from "@/lib/utils";

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function ReportRow({
  report,
  onIndex,
  indexing,
  onDelete,
  deleting,
}: {
  report: ReportListItem;
  onIndex: (id: string) => void;
  indexing: boolean;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Auto-cancel the delete confirmation if the admin doesn't follow through.
  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 4000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  return (
    <div className="border border-[var(--border)] bg-[var(--card)] rounded-xl overflow-hidden transition-all">
      {/* Header row */}
      <div className="flex items-start gap-3 px-4 py-3">
        {/* User avatar */}
        <div className="size-7 rounded-lg bg-[var(--muted)] border border-[var(--border)] flex items-center justify-center shrink-0 mt-0.5">
          <User className="size-3.5 text-[var(--muted-foreground)]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <span className="text-xs font-semibold text-[var(--foreground)]">{report.username}</span>
            <Badge variant="outline" className="text-[10px] font-mono py-0">{report.machineType}</Badge>
            <span className="text-[10px] text-[var(--muted-foreground)]">{timeAgo(report.createdAt)}</span>
            <span className={cn(
              "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border",
              report.isIndexed
                ? "bg-[var(--success-soft,#f0fdf4)] text-[var(--success,#16a34a)] border-[var(--success-border,#bbf7d0)]"
                : "bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]",
            )}>
              {report.isIndexed
                ? <><CheckCircle2 className="size-2.5" /> Indexed</>
                : <><ClipboardList className="size-2.5" /> Not indexed</>
              }
            </span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] truncate">{report.problem}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!report.isIndexed && (
            <Button
              variant="outline"
              size="sm"
              disabled={indexing}
              onClick={() => onIndex(report.id)}
              className="h-7 text-[11px] gap-1.5"
            >
              {indexing
                ? <><Loader2 className="size-3 animate-spin" /> Indexing…</>
                : <><BookPlus className="size-3" /> Add to RAG</>
              }
            </Button>
          )}
          <Button
            variant={confirmDelete ? "destructive" : "outline"}
            size="sm"
            disabled={deleting}
            onClick={() => {
              if (confirmDelete) { setConfirmDelete(false); onDelete(report.id); }
              else setConfirmDelete(true);
            }}
            className={cn("h-7 text-[11px] gap-1.5", !confirmDelete && "text-[var(--destructive)] hover:text-[var(--destructive)]")}
          >
            {deleting
              ? <><Loader2 className="size-3 animate-spin" /> Deleting…</>
              : confirmDelete
                ? <><Trash2 className="size-3" /> Confirm?</>
                : <Trash2 className="size-3" />
            }
          </Button>
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-[var(--border)] space-y-3">
          {/* Original fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(["problem", "cause", "solution"] as const).map(field => (
              <div key={field} className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  {field}
                </p>
                <p className="text-xs leading-relaxed text-[var(--foreground)]">{report[field]}</p>
              </div>
            ))}
          </div>

          {/* AI-enhanced fields (if different) */}
          {(report.cleanProblem !== report.problem || report.cleanCause !== report.cause || report.cleanSolution !== report.solution) && (
            <div className="border border-[var(--primary)]/20 bg-[var(--primary)]/5 rounded-lg p-3 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--primary)]">AI enhanced version</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(["cleanProblem", "cleanCause", "cleanSolution"] as const).map((field, i) => {
                  const labels = ["problem", "cause", "solution"];
                  return (
                    <div key={field} className="space-y-1">
                      <p className="text-[10px] text-[var(--muted-foreground)] capitalize">{labels[i]}</p>
                      <p className="text-xs leading-relaxed text-[var(--foreground)]">{report[field]}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 pt-1">
            <span className="text-[10px] text-[var(--muted-foreground)] font-mono">ID: {report.id.slice(0, 16)}…</span>
            <span className="text-[10px] text-[var(--muted-foreground)]">Source: {report.source}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function ReportsAdmin() {
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [indexingIds, setIndexingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  async function loadReports() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminReportsApi.listReports();
      setReports(data.reports);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadReports(); }, []);

  async function handleIndex(id: string) {
    setIndexingIds(s => new Set(s).add(id));
    try {
      await adminReportsApi.indexReport(id);
      setReports(r => r.map(rpt => rpt.id === id ? { ...rpt, isIndexed: true } : rpt));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Indexing failed.");
    } finally {
      setIndexingIds(s => { const n = new Set(s); n.delete(id); return n; });
    }
  }

  async function handleDelete(id: string) {
    setDeletingIds(s => new Set(s).add(id));
    setError(null);
    try {
      await adminReportsApi.deleteReport(id);
      setReports(r => r.filter(rpt => rpt.id !== id));
      setTotal(t => Math.max(t - 1, 0));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setDeletingIds(s => { const n = new Set(s); n.delete(id); return n; });
    }
  }

  const filtered = reports.filter(r => {
    const q = search.toLowerCase();
    return !q
      || r.username.toLowerCase().includes(q)
      || r.machineType.toLowerCase().includes(q)
      || r.problem.toLowerCase().includes(q)
      || r.cause.toLowerCase().includes(q)
      || r.solution.toLowerCase().includes(q);
  });

  const indexedCount = reports.filter(r => r.isIndexed).length;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[var(--foreground)]">Reports</h1>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            All maintenance reports submitted by technicians. Add unindexed reports to the RAG knowledge base.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadReports} disabled={loading}
          className="h-8 text-xs gap-1.5 shrink-0">
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total reports", value: total, accent: "var(--primary)" },
          { label: "Indexed in RAG", value: indexedCount, accent: "var(--success,#16a34a)" },
          { label: "Pending indexing", value: total - indexedCount, accent: "var(--warning,#d97706)" },
        ].map(({ label, value, accent }) => (
          <Card key={label} className="overflow-hidden">
            <div className="h-0.5" style={{ background: accent }} />
            <CardContent className="px-4 py-3">
              <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider">{label}</p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: accent }}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[var(--muted-foreground)]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by user, machine, or content…"
          className={cn(
            "w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[var(--border)]",
            "bg-[var(--background)] placeholder:text-[var(--muted-foreground)]",
            "focus:outline-none focus:ring-2 focus:ring-[var(--ring)]",
          )}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 border border-[var(--destructive)]/30 bg-[var(--destructive)]/5 px-4 py-3 rounded-xl">
          <AlertCircle className="size-4 text-[var(--destructive)] mt-0.5 shrink-0" />
          <p className="text-sm text-[var(--destructive)]">{error}</p>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center gap-3 py-16 text-[var(--muted-foreground)]">
          <Loader2 className="size-6 animate-spin text-[var(--primary)]" />
          <p className="text-sm">Loading reports…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-[var(--muted-foreground)]">
          <ClipboardList className="size-8 opacity-30" />
          <p className="text-sm">{search ? "No reports match your search." : "No reports submitted yet."}</p>
        </div>
      ) : (
        <Card>
          <CardHeader className="px-4 py-3 border-b border-[var(--border)]">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList className="size-4 text-[var(--primary)]" />
              {filtered.length} report{filtered.length !== 1 ? "s" : ""}
              {search && <span className="text-[var(--muted-foreground)] font-normal">matching &ldquo;{search}&rdquo;</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {filtered.map(report => (
              <ReportRow
                key={report.id}
                report={report}
                onIndex={handleIndex}
                indexing={indexingIds.has(report.id)}
                onDelete={handleDelete}
                deleting={deletingIds.has(report.id)}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
