"use client";

import { FormEvent, useState } from "react";
import { AlertTriangle, Clock3, FileUp, Inbox } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ingestionApi } from "@/lib/api";
import { Dictionary } from "@/lib/i18n";
import { IngestionJob, Locale, User } from "@/lib/types";

function getJobVariant(status: IngestionJob["status"]) {
  if (status === "completed") {
    return "success" as const;
  }

  if (status === "failed") {
    return "destructive" as const;
  }

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
      setJobs((current) => [job, ...current]);
      event.currentTarget.reset();
    } catch (error) {
      setManualError(
        error instanceof Error ? error.message : dictionary.knowledge.submitManualError,
      );
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
      setJobs((current) => [job, ...current]);
      setAlertForm({ title: "", machineType: user.allowedMachineTypes[0] ?? "", detail: "" });
    } catch (error) {
      setAlertError(
        error instanceof Error ? error.message : dictionary.knowledge.submitAlertError,
      );
    } finally {
      setAlertPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-white/70 bg-[var(--card)]/95 shadow-[var(--shadow-panel)]">
        <CardHeader>
          <CardTitle className="text-2xl">{dictionary.knowledge.title}</CardTitle>
          <CardDescription className="max-w-3xl leading-6">
            {dictionary.knowledge.description}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-white/70 bg-[var(--card)]/95 shadow-[var(--shadow-panel)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileUp className="size-5 text-[var(--primary)]" />
              {dictionary.knowledge.uploadManual}
            </CardTitle>
            <CardDescription>{dictionary.knowledge.summary}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitManual} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manual-title">{dictionary.common.title}</Label>
                <Input id="manual-title" name="title" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-machine">{dictionary.common.machineType}</Label>
                <Select id="manual-machine" name="machineType">
                  {user.allowedMachineTypes.map((machine) => (
                    <option key={machine} value={machine}>
                      {machine}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-detail">{dictionary.knowledge.summary}</Label>
                <Textarea id="manual-detail" name="detail" rows={4} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-file">{dictionary.knowledge.documentFile}</Label>
                <Input id="manual-file" name="file" type="file" className="h-11 file:mr-3" />
              </div>

              {manualError ? (
                <div className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--destructive)]">
                  {manualError}
                </div>
              ) : null}

              <Button type="submit" disabled={manualPending} className="w-full sm:w-auto">
                <Inbox className="size-4" />
                {manualPending ? dictionary.knowledge.submitting : dictionary.knowledge.queueManual}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-[var(--card)]/95 shadow-[var(--shadow-panel)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="size-5 text-[var(--warning)]" />
              {dictionary.knowledge.submitManufacturerAlert}
            </CardTitle>
            <CardDescription>{dictionary.knowledge.ingestionDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitAlert} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="alert-title">{dictionary.knowledge.alertTitle}</Label>
                <Input
                  id="alert-title"
                  value={alertForm.title}
                  onChange={(event) =>
                    setAlertForm((current) => ({ ...current, title: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alert-machine">{dictionary.common.machineType}</Label>
                <Select
                  id="alert-machine"
                  value={alertForm.machineType}
                  onChange={(event) =>
                    setAlertForm((current) => ({ ...current, machineType: event.target.value }))
                  }
                >
                  {user.allowedMachineTypes.map((machine) => (
                    <option key={machine} value={machine}>
                      {machine}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alert-detail">{dictionary.knowledge.alertDetails}</Label>
                <Textarea
                  id="alert-detail"
                  value={alertForm.detail}
                  onChange={(event) =>
                    setAlertForm((current) => ({ ...current, detail: event.target.value }))
                  }
                  rows={5}
                  required
                />
              </div>

              {alertError ? (
                <div className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--destructive)]">
                  {alertError}
                </div>
              ) : null}

              <Button type="submit" disabled={alertPending} variant="outline" className="w-full sm:w-auto">
                <AlertTriangle className="size-4" />
                {alertPending ? dictionary.knowledge.submitting : dictionary.knowledge.queueAlert}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/70 bg-[var(--card)]/95 shadow-[var(--shadow-panel)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock3 className="size-5 text-[var(--primary)]" />
            {dictionary.knowledge.ingestionStatus}
          </CardTitle>
          <CardDescription>{dictionary.knowledge.ingestionDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-3xl border border-[var(--border)] bg-[var(--muted)]/60 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[var(--foreground)]">{job.title}</p>
                      <Badge variant={getJobVariant(job.status)} className="capitalize">
                        {job.status}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {job.type}
                      </Badge>
                    </div>
                    <p className="text-sm leading-6 text-[var(--muted-foreground)]">{job.detail}</p>
                  </div>

                  <div className="text-right text-xs text-[var(--muted-foreground)]">
                    <p>{job.machineType}</p>
                    <p className="mt-1">{new Date(job.createdAt).toLocaleString(locale)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
