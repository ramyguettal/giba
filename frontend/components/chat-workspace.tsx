"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Bot,
  CheckCircle2,
  FileText,
  SendHorizonal,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
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
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const queryMachine = machines[0] ?? "";

  const showCommands = input.trim() === "/";

  const reportReady = useMemo(
    () => Object.values(draft).every((value) => value.trim().length > 0),
    [draft],
  );

  useEffect(() => {
    if (!reportModalOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setReportModalOpen(false);
        setReportError(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [reportModalOpen]);

  useEffect(() => {
    if (!reportModalOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [reportModalOpen]);

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
      setReportModalOpen(false);

      setMessages((current) => [
        ...current,
        {
          id: createId("message"),
          role: "assistant",
          type: "text",
          content: "Well done. Your report has been submitted successfully.",
        },
      ]);
    } catch (error) {
      setReportError(error instanceof Error ? error.message : dictionary.chat.unableToCommit);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="h-[calc(100vh-2rem)]">
      <Card className="flex h-full flex-col overflow-hidden border-[var(--border)] bg-[var(--card)] shadow-none">
        <CardHeader className="border-b border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="size-5 text-[var(--primary)]" />
              {dictionary.chat.title}
            </CardTitle>
                      </div>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={cn(
                    "max-w-[90%] rounded-3xl px-4 py-4 text-sm leading-7",
                    message.role === "user"
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : message.type === "status"
                        ? "border border-dashed border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)]"
                        : "border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]",
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

          <div className="relative px-5 py-5 sm:px-6">
            {showCommands ? (
              <div className="absolute bottom-[5.5rem] left-5 right-5 z-20 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-lg sm:left-6 sm:right-6">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-start rounded-xl px-4 py-5 text-left"
                  onClick={() => {
                    setInput("");
                    setReportModalOpen(true);
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
                className="h-12 flex-1 rounded-2xl bg-[var(--background)]"
              />
              <Button type="submit" disabled={pending} className="h-12 rounded-2xl px-5">
                {pending ? dictionary.common.working : dictionary.common.send}
                <SendHorizonal className="size-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {reportModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setReportModalOpen(false);
              setReportError(null);
            }
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[var(--border)] bg-[var(--card)] px-5 py-4 sm:px-6">
              <div>
                <p className="text-base font-semibold text-[var(--foreground)]">
                  {dictionary.chat.reportComposerTitle}
                </p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {dictionary.chat.reportComposerActive}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setReportModalOpen(false);
                  setReportError(null);
                }}
              >
                {dictionary.common.hide}
              </Button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--muted)]/45 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  {dictionary.common.machineType}
                </p>
                <Label>{dictionary.common.machineType}</Label>
                <Select
                  value={draft.machine_type}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, machine_type: event.target.value }))
                  }
                  className="bg-[var(--background)]"
                >
                  {machines.map((machine) => (
                    <option key={machine} value={machine}>
                      {machine}
                    </option>
                  ))}
                </Select>
              </div>

              {reportFields.map((key) => {
                const label = dictionary.common[key];

                return (
                  <div key={key} className="rounded-2xl border border-[var(--border)] bg-[var(--muted)]/45 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <Label>{label}</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => enhanceField(key)}>
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
                      className="mt-3 rounded-2xl bg-[var(--background)]"
                    />
                  </div>
                );
              })}

              {reportError ? (
                <div className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--destructive)]">
                  {reportError}
                </div>
              ) : null}

              {review ? (
                <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                  <p className="text-sm font-semibold text-[var(--foreground)]">{dictionary.chat.aiReviewCard}</p>
                  <div className="space-y-3 text-sm leading-6 text-[var(--foreground)]">
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--muted)] p-4">
                      <p className="font-semibold text-[var(--foreground)]">{dictionary.common.problem}</p>
                      <p className="mt-2">{review.clean_problem}</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--muted)] p-4">
                      <p className="font-semibold text-[var(--foreground)]">{dictionary.common.cause}</p>
                      <p className="mt-2">{review.clean_cause}</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--muted)] p-4">
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
                      className="rounded-2xl bg-[var(--background)]"
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
                </div>
              ) : null}
            </div>

            <div className="sticky bottom-0 z-10 border-t border-[var(--border)] bg-[var(--card)] px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setReportModalOpen(false);
                    setReportError(null);
                  }}
                  className="sm:min-w-36"
                >
                  {dictionary.common.hide}
                </Button>
                <Button type="button" onClick={runReformulation} disabled={pending} className="flex-1">
                  <WandSparkles className="size-4" />
                  {dictionary.chat.reviewAiVersion}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={approveReport}
                  disabled={pending}
                  className="flex-1"
                >
                  <CheckCircle2 className="size-4" />
                  {dictionary.chat.submitReport}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
