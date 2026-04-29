"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Bot,
  CheckCircle2,
  FileText,
  SendHorizonal,
  Sparkles,
  WandSparkles,
  Wrench,
} from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useMachineScope } from "@/hooks/use-machine-scope";
import { chatApi, reportApi } from "@/lib/api";
import { Dictionary, formatTemplate } from "@/lib/i18n";
import { ChatAnswer, Locale, ReformulatedReport, ReportDraft, User } from "@/lib/types";
import { cn } from "@/lib/utils";

type Message =
  | {
      id: string;
      role: "assistant" | "user";
      type: "text";
      content: string;
      answer?: ChatAnswer;
    }
  | {
      id: string;
      role: "assistant";
      type: "status";
      content: string;
    };

const emptyDraft: ReportDraft = {
  machine_type: "",
  problem: "",
  cause: "",
  solution: "",
};

const reportFields = ["problem", "cause", "solution"] as const;

const selectClassName =
  "flex h-10 w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring)]";

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function renderConfidenceBadge(answer: ChatAnswer, dictionary: Dictionary) {
  const variant =
    answer.confidenceLevel === "high"
      ? "success"
      : answer.confidenceLevel === "medium"
        ? "warning"
        : "destructive";

  return (
    <Badge variant={variant} className="gap-1.5 px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
      {dictionary.common.confidence[answer.confidenceLevel]} {Math.round(answer.confidenceScore * 100)}%
    </Badge>
  );
}

function renderCitations(answer: ChatAnswer, dictionary: Dictionary) {
  if (!answer.citations.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      {answer.citations.map((citation) => (
        <div
          key={citation.id}
          className="rounded-2xl border border-[var(--border)] bg-[var(--muted)]/70 p-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-[var(--foreground)]">{citation.title}</p>
            <Badge variant="secondary" className="capitalize">
              {citation.source}
            </Badge>
            <Badge variant="outline">{citation.machine_type}</Badge>
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">{citation.excerpt}</p>
          <p className="mt-3 text-xs text-[var(--muted-foreground)]">
            {citation.section
              ? `${dictionary.chat.citationSection}: ${citation.section}`
              : dictionary.chat.citationReference}
            {citation.page ? ` | ${dictionary.chat.citationPage} ${citation.page}` : ""}
          </p>
        </div>
      ))}
    </div>
  );
}

export function ChatWorkspace({
  user,
  locale,
  dictionary,
}: {
  user: User;
  locale: Locale;
  dictionary: Dictionary;
}) {
  const { machines, hasMachine } = useMachineScope();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: createId("message"),
      role: "assistant",
      type: "text",
      content: formatTemplate(dictionary.chat.welcome, { name: user.name }),
    },
  ]);
  const [input, setInput] = useState("");
  const [draft, setDraft] = useState<ReportDraft>({
    ...emptyDraft,
    machine_type: machines[0] ?? "",
  });
  const [review, setReview] = useState<ReformulatedReport | null>(null);
  const [modifyInstruction, setModifyInstruction] = useState("");
  const [reportMode, setReportMode] = useState(false);
  const [pending, setPending] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [queryMachine, setQueryMachine] = useState(machines[0] ?? "");

  const showCommands = input.trim() === "/";

  const reportReady = useMemo(
    () => Object.values(draft).every((value) => value.trim().length > 0),
    [draft],
  );

  function appendStatus(content: string) {
    setMessages((current) => [
      ...current,
      { id: createId("status"), role: "assistant", type: "status", content },
    ]);
  }

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!input.trim() || pending) {
      return;
    }

    const question = input.trim();
    setInput("");
    setPending(true);
    setMessages((current) => [
      ...current,
      { id: createId("message"), role: "user", type: "text", content: question },
    ]);

    try {
      const answer = await chatApi.querySolution({
        question,
        machine_type: queryMachine || undefined,
        locale,
      });

      setMessages((current) => [
        ...current,
        {
          id: createId("message"),
          role: "assistant",
          type: "text",
          content: answer.answer,
          answer,
        },
      ]);
    } catch (error) {
      appendStatus(error instanceof Error ? error.message : dictionary.chat.unableToAnswer);
    } finally {
      setPending(false);
    }
  }

  async function enhanceField(field: keyof Omit<ReportDraft, "machine_type">) {
    if (!draft[field].trim()) {
      const labels = {
        problem: dictionary.common.problem.toLowerCase(),
        cause: dictionary.common.cause.toLowerCase(),
        solution: dictionary.common.solution.toLowerCase(),
      };

      setReportError(
        formatTemplate(dictionary.chat.addFieldBeforeEnhancement, { field: labels[field] }),
      );
      return;
    }

    setPending(true);
    setReportError(null);

    try {
      const result = await reportApi.reformulateReport({ ...draft, locale });
      setReview(result);

      const nextValue =
        field === "problem"
          ? result.clean_problem
          : field === "cause"
            ? result.clean_cause
            : result.clean_solution;

      setDraft((current) => ({ ...current, [field]: nextValue }));
    } catch (error) {
      setReportError(error instanceof Error ? error.message : dictionary.chat.unableToEnhance);
    } finally {
      setPending(false);
    }
  }

  async function runReformulation() {
    if (!reportReady) {
      setReportError(dictionary.chat.completeFields);
      return;
    }

    if (!hasMachine(draft.machine_type)) {
      setReportError(dictionary.chat.unauthorizedMachine);
      return;
    }

    setPending(true);
    setReportError(null);

    try {
      const result = await reportApi.reformulateReport({ ...draft, locale });
      setReview(result);
      appendStatus(dictionary.chat.reviewReady);
    } catch (error) {
      setReportError(
        error instanceof Error ? error.message : dictionary.chat.unableToReformulate,
      );
    } finally {
      setPending(false);
    }
  }

  async function applyModification() {
    if (!review || !modifyInstruction.trim()) {
      return;
    }

    setPending(true);

    try {
      const result = await reportApi.modifyReformulation({
        cleanFields: review,
        instruction: modifyInstruction,
        locale,
      });
      setReview(result);
      setModifyInstruction("");
    } catch (error) {
      setReportError(error instanceof Error ? error.message : dictionary.chat.unableToModify);
    } finally {
      setPending(false);
    }
  }

  async function approveReport() {
    setPending(true);
    setReportError(null);

    try {
      const finalizedReview = review ?? (await reportApi.reformulateReport({ ...draft, locale }));
      const result = await reportApi.commitReport({
        ...draft,
        clean_problem: finalizedReview.clean_problem,
        clean_cause: finalizedReview.clean_cause,
        clean_solution: finalizedReview.clean_solution,
      });

      setMessages((current) => [
        ...current,
        {
          id: createId("message"),
          role: "assistant",
          type: "text",
          content: formatTemplate(dictionary.chat.committed, {
            id: result.id,
            machine: result.machine_type,
          }),
        },
      ]);
      setDraft({ ...emptyDraft, machine_type: machines[0] ?? "" });
      setReview(null);
      setModifyInstruction("");
      setReportMode(false);
    } catch (error) {
      setReportError(error instanceof Error ? error.message : dictionary.chat.unableToCommit);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.95fr)]">
      <Card className="overflow-hidden border-white/70 bg-[var(--card)]/95 shadow-[var(--shadow-panel)]">
        <CardHeader className="border-b border-[var(--border)] bg-[var(--muted)]/45">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Bot className="size-5 text-[var(--primary)]" />
                {dictionary.chat.title}
              </CardTitle>
              <CardDescription className="mt-1 max-w-2xl leading-6">
                {dictionary.chat.subtitle}
              </CardDescription>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] px-3 py-3">
              <Label className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                {dictionary.chat.queryMachine}
              </Label>
              <select
                value={queryMachine}
                onChange={(event) => setQueryMachine(event.target.value)}
                className={cn(selectClassName, "h-9 min-w-44 bg-white")}
              >
                {machines.map((machine) => (
                  <option key={machine} value={machine}>
                    {machine}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex h-[720px] flex-col p-0">
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={cn(
                    "max-w-[90%] rounded-3xl px-4 py-4 text-sm leading-7 shadow-sm",
                    message.role === "user"
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : message.type === "status"
                        ? "border border-dashed border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)]"
                        : "border border-[var(--border)] bg-white text-[var(--foreground)]",
                  )}
                >
                  <p>{message.content}</p>

                  {message.type === "text" && message.answer ? (
                    <div className="mt-4 space-y-4">
                      {renderConfidenceBadge(message.answer, dictionary)}

                      {message.answer.clarificationQuestion ? (
                        <div className="rounded-2xl border border-[var(--warning-border)] bg-[var(--warning-soft)] px-4 py-4 text-sm text-[var(--warning)]">
                          {message.answer.clarificationQuestion}
                        </div>
                      ) : null}

                      {renderCitations(message.answer, dictionary)}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <div className="px-5 py-5 sm:px-6">
            {showCommands ? (
              <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--muted)]/80 p-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-start rounded-xl px-4 py-6 text-left"
                  onClick={() => {
                    setInput("");
                    setReportMode(true);
                  }}
                >
                  <FileText className="size-4 text-[var(--primary)]" />
                  {dictionary.chat.slashSubmitReport}
                </Button>
              </div>
            ) : null}

            <form onSubmit={submitQuestion} className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={dictionary.chat.placeholder}
                className="h-12 flex-1 rounded-2xl bg-white"
              />
              <Button type="submit" disabled={pending} className="h-12 rounded-2xl px-5">
                {pending ? dictionary.common.working : dictionary.common.send}
                <SendHorizonal className="size-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-6">
        <Card className="border-white/70 bg-[var(--card)]/95 shadow-[var(--shadow-panel)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wrench className="size-5 text-[var(--primary)]" />
              {dictionary.chat.reportWorkflowTitle}
            </CardTitle>
            <CardDescription className="leading-6">
              {dictionary.chat.reportWorkflowDescription}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-white/70 bg-[var(--card)]/95 shadow-[var(--shadow-panel)]">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="text-lg">{dictionary.chat.reportComposerTitle}</CardTitle>
              <CardDescription className="mt-2 leading-6">
                {reportMode
                  ? dictionary.chat.reportComposerActive
                  : dictionary.chat.reportComposerOpen}
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setReportMode((current) => !current)}
            >
              {reportMode ? dictionary.common.hide : dictionary.common.open}
            </Button>
          </CardHeader>

          {reportMode ? (
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>{dictionary.common.machineType}</Label>
                <select
                  value={draft.machine_type}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, machine_type: event.target.value }))
                  }
                  className={selectClassName}
                >
                  {machines.map((machine) => (
                    <option key={machine} value={machine}>
                      {machine}
                    </option>
                  ))}
                </select>
              </div>

              {reportFields.map((key) => {
                const label = dictionary.common[key];

                return (
                  <div key={key} className="rounded-3xl border border-[var(--border)] bg-[var(--muted)]/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <Label>{label}</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => enhanceField(key)}
                      >
                        <Sparkles className="size-4 text-[var(--primary)]" />
                        {dictionary.chat.enhance}
                      </Button>
                    </div>
                    <Textarea
                      value={draft[key]}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, [key]: event.target.value }))
                      }
                      rows={4}
                      className="mt-3 rounded-2xl bg-white"
                    />
                  </div>
                );
              })}

              {reportError ? (
                <div className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--destructive)]">
                  {reportError}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="button" onClick={runReformulation} disabled={pending} className="flex-1">
                  <WandSparkles className="size-4" />
                  {dictionary.chat.reviewAiVersion}
                </Button>
                <Button type="button" variant="outline" onClick={approveReport} disabled={pending} className="flex-1">
                  <CheckCircle2 className="size-4" />
                  {dictionary.chat.submitReport}
                </Button>
              </div>
            </CardContent>
          ) : null}
        </Card>

        {review ? (
          <Card className="border-white/70 bg-[var(--card)]/95 shadow-[var(--shadow-panel)]">
            <CardHeader>
              <CardTitle className="text-lg">{dictionary.chat.aiReviewCard}</CardTitle>
              <CardDescription>{dictionary.chat.reviewReady}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3 text-sm leading-6 text-[var(--foreground)]">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--muted)]/70 p-4">
                  <p className="font-semibold text-[var(--foreground)]">{dictionary.common.problem}</p>
                  <p className="mt-2">{review.clean_problem}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--muted)]/70 p-4">
                  <p className="font-semibold text-[var(--foreground)]">{dictionary.common.cause}</p>
                  <p className="mt-2">{review.clean_cause}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--muted)]/70 p-4">
                  <p className="font-semibold text-[var(--foreground)]">{dictionary.common.solution}</p>
                  <p className="mt-2">{review.clean_solution}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Textarea
                  value={modifyInstruction}
                  onChange={(event) => setModifyInstruction(event.target.value)}
                  rows={3}
                  placeholder={dictionary.chat.modifyPlaceholder}
                  className="rounded-2xl bg-white"
                />
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={applyModification}
                    disabled={pending || !modifyInstruction.trim()}
                    className="flex-1"
                  >
                    <Sparkles className="size-4" />
                    {dictionary.chat.modifyAiVersion}
                  </Button>
                  <Button
                    type="button"
                    onClick={approveReport}
                    disabled={pending}
                    className="flex-1 bg-[var(--success)] text-white hover:opacity-95"
                  >
                    <CheckCircle2 className="size-4" />
                    {dictionary.chat.approveAndCommit}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </section>
    </div>
  );
}
