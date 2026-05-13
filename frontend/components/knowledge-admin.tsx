"use client";

import { FormEvent, useState } from "react";
import { AlertTriangle, Clock3, FileUp, Inbox } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ingestionApi } from "@/lib/api";
import { Dictionary } from "@/lib/i18n";
import { IngestionJob, Locale, User } from "@/lib/types";

function getJobVariant(status: IngestionJob["status"]) {
  if (status === "completed") return "success" as const;
  if (status === "failed") return "destructive" as const;
  return "warning" as const;
}

export function KnowledgeAdmin({
  user,
  locale,
  dictionary,
  initialJobs,
}: {
  user: User;
  locale: Locale;
  dictionary: Dictionary;
  initialJobs: IngestionJob[];
}) {
  const [jobs, setJobs] = useState(initialJobs);
  const [manualError, setManualError] = useState<string | null>(null);
  const [alertError, setAlertError] = useState<string | null>(null);
  const [manualPending, setManualPending] = useState(false);
  const [alertPending, setAlertPending] = useState(false);
  const [alertForm, setAlertForm] = useState({
    title: "",
    machineType: user.allowedMachineTypes[0] ?? "",
    detail: "",
  });

  async function submitManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setManualPending(true);
    setManualError(null);
    try {
      const form = new FormData(event.currentTarget);
      const job = await ingestionApi.submitManual(form);
      setJobs((c) => [job, ...c]);
      event.currentTarget.reset();
    } catch (error) {
      setManualError(error instanceof Error ? error.message : dictionary.knowledge.submitManualError);
    } finally {
      setManualPending(false);
    }
  }

  async function submitAlert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAlertPending(true);
    setAlertError(null);
    try {
      const job = await ingestionApi.submitManufacturerAlert(alertForm);
      setJobs((c) => [job, ...c]);
      setAlertForm({ title: "", machineType: user.allowedMachineTypes[0] ?? "", detail: "" });
    } catch (error) {
      setAlertError(error instanceof Error ? error.message : dictionary.knowledge.submitAlertError);
    } finally {
      setAlertPending(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-lg font-semibold">{dictionary.knowledge.title}</h1>
        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{dictionary.knowledge.description}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border border-[var(--border)] bg-[var(--card)]">
          <CardHeader className="px-4 py-3 border-b border-[var(--border)]">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold">
              <FileUp className="size-4 text-[var(--primary)]" />
              {dictionary.knowledge.uploadManual}
            </CardTitle>
            <CardDescription className="text-[11px]">{dictionary.knowledge.summary}</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <form onSubmit={submitManual} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">{dictionary.common.title}</Label>
                <Input id="manual-title" name="title" required className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{dictionary.common.machineType}</Label>
                <Select id="manual-machine" name="machineType" className="h-9 text-xs">
                  {user.allowedMachineTypes.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{dictionary.knowledge.summary}</Label>
                <Textarea id="manual-detail" name="detail" rows={3} required className="text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{dictionary.knowledge.documentFile}</Label>
                <Input id="manual-file" name="file" type="file" className="h-9 text-xs" />
              </div>
              {manualError && (
                <div className="border border-[var(--destructive)]/30 bg-[var(--destructive)]/5 px-3 py-2 text-xs text-[var(--destructive)]">
                  {manualError}
                </div>
              )}
              <Button type="submit" disabled={manualPending} size="sm" className="text-xs h-8">
                <Inbox className="size-3.5 mr-1" />
                {manualPending ? dictionary.knowledge.submitting : dictionary.knowledge.queueManual}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-[var(--border)] bg-[var(--card)]">
          <CardHeader className="px-4 py-3 border-b border-[var(--border)]">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold">
              <AlertTriangle className="size-4 text-[var(--warning)]" />
              {dictionary.knowledge.submitManufacturerAlert}
            </CardTitle>
            <CardDescription className="text-[11px]">{dictionary.knowledge.ingestionDescription}</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <form onSubmit={submitAlert} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">{dictionary.knowledge.alertTitle}</Label>
                <Input value={alertForm.title} onChange={(e) => setAlertForm((c) => ({ ...c, title: e.target.value }))} required className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{dictionary.common.machineType}</Label>
                <Select value={alertForm.machineType} onChange={(e) => setAlertForm((c) => ({ ...c, machineType: e.target.value }))} className="h-9 text-xs">
                  {user.allowedMachineTypes.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{dictionary.knowledge.alertDetails}</Label>
                <Textarea value={alertForm.detail} onChange={(e) => setAlertForm((c) => ({ ...c, detail: e.target.value }))} rows={4} required className="text-xs" />
              </div>
              {alertError && (
                <div className="border border-[var(--destructive)]/30 bg-[var(--destructive)]/5 px-3 py-2 text-xs text-[var(--destructive)]">
                  {alertError}
                </div>
              )}
              <Button type="submit" disabled={alertPending} variant="outline" size="sm" className="text-xs h-8">
                <AlertTriangle className="size-3.5 mr-1" />
                {alertPending ? dictionary.knowledge.submitting : dictionary.knowledge.queueAlert}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-[var(--border)] bg-[var(--card)]">
        <CardHeader className="px-4 py-3 border-b border-[var(--border)]">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold">
            <Clock3 className="size-4 text-[var(--primary)]" />
            {dictionary.knowledge.ingestionStatus}
          </CardTitle>
          <CardDescription className="text-[11px]">{dictionary.knowledge.ingestionDescription}</CardDescription>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-[var(--border)]">
          {jobs.map((job) => (
            <div key={job.id} className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-[var(--foreground)]">{job.title}</p>
                  <Badge variant={getJobVariant(job.status)} className="text-[10px] capitalize">{job.status}</Badge>
                  <Badge variant="outline" className="text-[10px] capitalize">{job.type}</Badge>
                </div>
                <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5 truncate">{job.detail}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11px] text-[var(--muted-foreground)]">{job.machineType}</p>
                <p className="text-[11px] text-[var(--muted-foreground)]">{new Date(job.createdAt).toLocaleString(locale)}</p>
              </div>
            </div>
          ))}
          {jobs.length === 0 && (
            <p className="px-4 py-6 text-xs text-[var(--muted-foreground)] text-center">No jobs yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
