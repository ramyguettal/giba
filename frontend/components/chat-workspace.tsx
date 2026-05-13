"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Bot,
  FileText,
  Loader2,
  SendHorizonal,
  Sparkles,
  WandSparkles,
  CheckCircle2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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

function ChatMessage({ message, dictionary }: { message: Message; dictionary: Dictionary }) {
  if (message.type === "status") {
    return (
      <div className="flex justify-center">
        <div className="flex items-center gap-2 border border-dashed border-[var(--border)] bg-[var(--muted)] px-4 py-2.5 text-sm text-[var(--muted-foreground)] rounded-lg">
          <Loader2 className="size-4 animate-spin text-[var(--primary)]" />
          {message.content}
        </div>
      </div>
    );
  }

  const isUser = message.role === "user";
  const answer = message.answer;

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] space-y-2 animate-slide-up",
          isUser
            ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
            : "border border-[var(--border)] bg-[var(--card)]",
        )}
      >
        <div className={cn("px-4 py-3", isUser ? "text-sm" : "text-sm leading-relaxed")}>
          <p>{message.content}</p>
        </div>

        {answer && (
          <div className="px-3 pb-3 space-y-3">
            {renderAnswer(answer, dictionary)}
          </div>
        )}
      </div>
    </div>
  );
}

function renderAnswer(answer: ChatAnswer, dictionary: Dictionary) {
  const variant =
    answer.confidenceLevel === "high"
      ? "success"
      : answer.confidenceLevel === "medium"
        ? "warning"
        : "destructive";

  return (
    <>
      <Badge variant={variant} className="text-xs uppercase tracking-wider px-2 py-0.5">
        {dictionary.common.confidence[answer.confidenceLevel]} {Math.round(answer.confidenceScore * 100)}%
      </Badge>

      {answer.clarificationQuestion && (
        <div className="border border-[var(--warning-border)] bg-[var(--warning-soft)] px-3 py-2 text-sm text-[var(--warning)] rounded-lg">
          {answer.clarificationQuestion}
        </div>
      )}

      {answer.citations.length > 0 && (
        <div className="space-y-2">
          {answer.citations.map((citation) => (
            <div key={citation.id} className="border border-[var(--border)] bg-[var(--muted)] p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-[var(--foreground)] truncate">
                  {citation.title}
                </span>
                <Badge variant="secondary" className="text-xs capitalize">{citation.source}</Badge>
              </div>
              <p className="text-xs leading-relaxed text-[var(--muted-foreground)] line-clamp-2">
                {citation.excerpt}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
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
  const [reportOpen, setReportOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const queryMachine = machines[0] ?? "";

  const reportReady = useMemo(
    () => Object.values(draft).every((v) => v.trim().length > 0),
    [draft],
  );

  function appendStatus(content: string) {
    setMessages((curr) => [
      ...curr,
      { id: createId("status"), role: "assistant", type: "status", content },
    ]);
  }

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.trim() || pending) return;

    const question = input.trim();
    setInput("");
    setPending(true);
    setMessages((curr) => [
      ...curr,
      { id: createId("message"), role: "user", type: "text", content: question },
    ]);

    try {
      const answer = await chatApi.querySolution({
        question,
        machine_type: queryMachine || undefined,
        locale,
      });
      setMessages((curr) => [
        ...curr,
        { id: createId("message"), role: "assistant", type: "text", content: answer.answer, answer },
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
      setReportError(formatTemplate(dictionary.chat.addFieldBeforeEnhancement, { field: labels[field] }));
      return;
    }
    setPending(true);
    setReportError(null);
    try {
      const result = await reportApi.reformulateReport({ ...draft, locale });
      setReview(result);
      const nextValue = field === "problem" ? result.clean_problem : field === "cause" ? result.clean_cause : result.clean_solution;
      setDraft((curr) => ({ ...curr, [field]: nextValue }));
    } catch {
      setReportError(dictionary.chat.unableToEnhance);
    } finally {
      setPending(false);
    }
  }

  async function runReformulation() {
    if (!reportReady) { setReportError(dictionary.chat.completeFields); return; }
    if (!hasMachine(draft.machine_type)) { setReportError(dictionary.chat.unauthorizedMachine); return; }
    setPending(true);
    setReportError(null);
    try {
      const result = await reportApi.reformulateReport({ ...draft, locale });
      setReview(result);
      appendStatus(dictionary.chat.reviewReady);
    } catch {
      setReportError(dictionary.chat.unableToReformulate);
    } finally {
      setPending(false);
    }
  }

  async function applyModification() {
    if (!review || !modifyInstruction.trim()) return;
    setPending(true);
    try {
      const result = await reportApi.modifyReformulation({
        cleanFields: review,
        instruction: modifyInstruction,
        locale,
      });
      setReview(result);
      setModifyInstruction("");
    } catch {
      setReportError(dictionary.chat.unableToModify);
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
      setMessages((curr) => [
        ...curr,
        {
          id: createId("message"),
          role: "assistant",
          type: "text",
          content: formatTemplate(dictionary.chat.committed, { id: result.id, machine: result.machine_type }),
        },
      ]);
      setDraft({ ...emptyDraft, machine_type: machines[0] ?? "" });
      setReview(null);
      setModifyInstruction("");
      setReportOpen(false);
    } catch {
      setReportError(dictionary.chat.unableToCommit);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col">
      <div className="flex items-center justify-between gap-4 px-4 h-12 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
          <Bot className="size-4 text-[var(--primary)]" />
          {dictionary.chat.title}
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} dictionary={dictionary} />
          ))}
          {pending && messages.length > 0 && messages[messages.length - 1].role === "user" && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 border border-[var(--border)] bg-[var(--card)] px-4 py-3 rounded-lg animate-pulse">
                <Loader2 className="size-4 animate-spin text-[var(--primary)]" />
                <span className="text-sm text-[var(--muted-foreground)]">{dictionary.common.working}</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-[var(--border)] px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={submitQuestion} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={dictionary.chat.placeholder}
              className="h-9 text-sm flex-1"
            />
            {input.trim() === "/" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-sm"
                onClick={() => {
                  setInput("");
                  setReportOpen(true);
                }}
              >
                <FileText className="size-3.5 mr-1" />
                {dictionary.chat.slashSubmitReport}
              </Button>
            )}
            <Button type="submit" disabled={pending} size="sm" className="h-9 text-sm">
              {pending ? dictionary.common.working : dictionary.common.send}
              <SendHorizonal className="size-3.5 ml-1" />
            </Button>
          </form>
        </div>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">
                {dictionary.chat.reportComposerTitle}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-sm">{dictionary.common.machineType}</Label>
                <Select
                  value={draft.machine_type}
                  onChange={(e) => setDraft((c) => ({ ...c, machine_type: e.target.value }))}
                  className="h-9 text-sm"
                >
                {machines.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Select>
            </div>

            {reportFields.map((key) => (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{dictionary.common[key]}</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => enhanceField(key)} className="h-7 text-xs">
                    <Sparkles className="size-3 mr-1" />
                    {dictionary.chat.enhance}
                  </Button>
                </div>
                <Textarea
                  value={draft[key]}
                  onChange={(e) => setDraft((c) => ({ ...c, [key]: e.target.value }))}
                  rows={3}
                  className="text-sm"
                />
              </div>
            ))}

            {reportError && (
              <div className="border border-[var(--destructive)]/30 bg-[var(--destructive)]/5 px-3 py-2 text-sm text-[var(--destructive)] rounded-lg">
                {reportError}
              </div>
            )}

            {review && (
              <div className="border border-[var(--border)] bg-[var(--muted)] p-4 space-y-3 rounded-lg">
                <p className="text-sm font-semibold">{dictionary.chat.aiReviewCard}</p>
                {(["clean_problem", "clean_cause", "clean_solution"] as const).map((field) => (
                  <div key={field} className="space-y-1">
                    <p className="text-xs font-medium text-[var(--muted-foreground)]">
                      {dictionary.common[field.replace("clean_", "") as "problem" | "cause" | "solution"]}
                    </p>
                    <p className="text-sm">{review[field]}</p>
                  </div>
                ))}
                <Separator />
                <div className="space-y-2">
                  <Textarea
                    value={modifyInstruction}
                    onChange={(e) => setModifyInstruction(e.target.value)}
                    rows={2}
                    placeholder={dictionary.chat.modifyPlaceholder}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={applyModification} disabled={pending || !modifyInstruction.trim()} className="text-sm h-8">
                      <Sparkles className="size-3 mr-1" />
                      {dictionary.chat.modifyAiVersion}
                    </Button>
                    <Button size="sm" onClick={approveReport} disabled={pending} className="text-sm h-8 ml-auto">
                      <CheckCircle2 className="size-3 mr-1" />
                      {dictionary.chat.approveAndCommit}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={runReformulation} disabled={pending} className="text-sm h-8">
                <WandSparkles className="size-3 mr-1" />
                {dictionary.chat.reviewAiVersion}
              </Button>
              <Button variant="outline" size="sm" onClick={approveReport} disabled={pending} className="text-sm h-8">
                <CheckCircle2 className="size-3 mr-1" />
                {dictionary.chat.submitReport}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
