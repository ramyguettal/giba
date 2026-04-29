import { Dictionary } from "@/lib/i18n";
import { DashboardStats, IngestionJob, Locale } from "@/lib/types";

export function DashboardOverview({
  stats,
  jobs,
  recentQueries,
  recentReports,
  locale,
  dictionary,
}: {
  stats: DashboardStats;
  jobs: IngestionJob[];
  recentQueries: Array<{ id: string; question: string; createdAt: string; confidenceLevel: string }>;
  recentReports: Array<{ id: string; machine_type: string; createdAt: string }>;
  locale: Locale;
  dictionary: Dictionary;
}) {
  const cards = [
    { label: dictionary.dashboard.cards.reports, value: stats.totalReports },
    { label: dictionary.dashboard.cards.queries, value: stats.totalQueries },
    { label: dictionary.dashboard.cards.lowConfidence, value: stats.lowConfidenceQueries },
    { label: dictionary.dashboard.cards.jobs, value: stats.activeJobs },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-panel)] p-6 shadow-[var(--shadow-panel)]">
        <h2 className="text-2xl font-semibold text-[var(--color-text-strong)]">
          {dictionary.dashboard.title}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
          {dictionary.dashboard.description}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-panel)] p-5 shadow-[var(--shadow-panel)]"
          >
            <p className="text-sm font-medium text-[var(--color-text-muted)]">{card.label}</p>
            <p className="mt-4 text-3xl font-semibold text-[var(--color-text-strong)]">{card.value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-panel)] p-6 shadow-[var(--shadow-panel)]">
          <h3 className="text-lg font-semibold text-[var(--color-text-strong)]">
            {dictionary.dashboard.recentJobs}
          </h3>
          <div className="mt-5 space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel-subtle)] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-[var(--color-text-strong)]">{job.title}</p>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize text-[var(--color-text-muted)]">
                    {job.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">{job.detail}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-panel)] p-6 shadow-[var(--shadow-panel)]">
            <h3 className="text-lg font-semibold text-[var(--color-text-strong)]">
              {dictionary.dashboard.recentQueries}
            </h3>
            <div className="mt-5 space-y-3">
              {recentQueries.length ? (
                recentQueries.map((query) => (
                  <div
                    key={query.id}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel-subtle)] p-4"
                  >
                    <p className="text-sm font-medium text-[var(--color-text-strong)]">{query.question}</p>
                    <p className="mt-2 text-xs capitalize text-[var(--color-text-muted)]">
                      {query.confidenceLevel} | {new Date(query.createdAt).toLocaleString(locale)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">{dictionary.dashboard.noQueries}</p>
              )}
            </div>
          </div>
          <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-panel)] p-6 shadow-[var(--shadow-panel)]">
            <h3 className="text-lg font-semibold text-[var(--color-text-strong)]">
              {dictionary.dashboard.recentReports}
            </h3>
            <div className="mt-5 space-y-3">
              {recentReports.length ? (
                recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel-subtle)] p-4"
                  >
                    <p className="text-sm font-medium text-[var(--color-text-strong)]">{report.id}</p>
                    <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                      {report.machine_type} | {new Date(report.createdAt).toLocaleString(locale)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">{dictionary.dashboard.noReports}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
