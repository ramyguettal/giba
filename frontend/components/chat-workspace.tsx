"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCopy,
  FileText,
  Loader2,
  SendHorizonal,
  Sparkles,
  X,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMachineScope } from "@/hooks/use-machine-scope";
import { chatApi, reportApi } from "@/lib/api";
import { Dictionary, formatTemplate } from "@/lib/i18n";
import {
  ChatAnswer,
  ChatHistoryMessage,
  ConfidenceLevel,
  Locale,
  ReportDraft,
  User,
} from "@/lib/types";
import { cn } from "@/lib/utils";

// ─── Message types ────────────────────────────────────────────────────────────

type TextMessage = {
  id: string; role: "user" | "assistant"; type: "text";
  content: string; answer?: ChatAnswer;
};
type StatusMessage = {
  id: string; role: "assistant"; type: "status"; content: string;
};
type ReportFormMessage = {
  id: string; role: "assistant"; type: "report-form";
  submitted?: { reportId: string; machineType: string };
};
type Message = TextMessage | StatusMessage | ReportFormMessage;

function createId(p: string) { return `${p}-${Math.random().toString(36).slice(2, 9)}`; }

// ─── Confidence badge ─────────────────────────────────────────────────────────

function ConfidenceBadge({ level, score }: { level: ConfidenceLevel; score: number }) {
  const cfg: Record<ConfidenceLevel, { label: string; cls: string }> = {
    high:   { label: "High",   cls: "bg-[var(--success-soft)] text-[var(--success)] border-[var(--success-border)]" },
    medium: { label: "Medium", cls: "bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning-border)]" },
    low:    { label: "Low",    cls: "bg-[var(--danger-soft)]  text-[var(--danger)]  border-[var(--danger-border)]"  },
  };
  const { label, cls } = cfg[level];
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 border rounded", cls)}>
      <Zap className="size-2.5" />{label} · {Math.round(score * 100)}%
    </span>
  );
}

// ─── Citation card ────────────────────────────────────────────────────────────

function CitationCard({ citation }: { citation: ChatAnswer["citations"][number] }) {
  const [open, setOpen] = useState(false);
  const isReport = citation.source === "repairer";
  return (
    <div className="border border-[var(--border)] bg-[var(--muted)] rounded-lg overflow-hidden">
      <button type="button"
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-[var(--accent)] transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <FileText className={cn("size-3 shrink-0", isReport ? "text-[var(--success)]" : "text-[var(--primary)]")} />
          <span className="text-[11px] font-medium truncate">{citation.source} · {citation.machine_type}</span>
          <span className="text-[10px] text-[var(--muted-foreground)] font-mono">[{citation.id.slice(0,10)}]</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-[var(--muted-foreground)]">{Math.round(citation.score * 100)}%</span>
          {open ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-[var(--border)]">
          <p className="text-[11px] leading-relaxed text-[var(--muted-foreground)]">{citation.excerpt}</p>
        </div>
      )}
    </div>
  );
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function MarkdownText({ text }: { text: string }) {
  return (
    <div className="space-y-1.5">
      {text.split("\n").map((line, i) => {
        const t = line.trim();
        if (!t) return <div key={i} className="h-1" />;
        const isBullet = /^[-*•]\s/.test(t);
        const html = (isBullet ? t.slice(2) : t)
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
          .replace(/`([^`]+)`/g, `<code class="bg-[var(--muted)] px-1 py-0.5 rounded text-[11px] font-mono">$1</code>`)
          .replace(/\[([^\]]+)\]/g, `<span class="text-[var(--primary)] font-mono text-[11px]">[$1]</span>`);
        return isBullet
          ? <div key={i} className="flex gap-2"><span className="text-[var(--primary)] mt-1 shrink-0">·</span><span className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} /></div>
          : <p key={i} className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-slide-up">
      <div className="size-7 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/70 flex items-center justify-center shrink-0 shadow-sm">
        <Bot className="size-3.5 text-[var(--primary-foreground)]" />
      </div>
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          {[0,1,2].map(i => (
            <div key={i} className="size-1.5 rounded-full bg-[var(--muted-foreground)]"
              style={{ animation: `bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Inline report form ───────────────────────────────────────────────────────

const FIELDS = ["problem", "cause", "solution"] as const;
type ReportField = typeof FIELDS[number];

function InlineReportForm({
  machines,
  locale,
  dictionary,
  onSubmit,
  onCancel,
}: {
  machines: string[];
  locale: Locale;
  dictionary: Dictionary;
  onSubmit: (id: string, machine: string) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<ReportDraft>({
    machine_type: machines[0] ?? "",
    problem: "", cause: "", solution: "",
  });
  const [enhanced, setEnhanced] = useState<Partial<Record<ReportField, boolean>>>({});
  const [enhancing, setEnhancing] = useState<Partial<Record<ReportField, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allFilled = FIELDS.every(f => draft[f].trim().length > 0) && draft.machine_type;

  async function enhanceField(field: ReportField) {
    if (!draft[field].trim()) return;
    setEnhancing(e => ({ ...e, [field]: true }));
    setError(null);
    try {
      const result = await reportApi.reformulateReport({ ...draft, locale });
      const map: Record<ReportField, keyof typeof result> = {
        problem: "clean_problem", cause: "clean_cause", solution: "clean_solution",
      };
      setDraft(d => ({ ...d, [field]: result[map[field]] }));
      setEnhanced(e => ({ ...e, [field]: true }));
    } catch {
      setError("Could not enhance. Try again.");
    } finally {
      setEnhancing(e => ({ ...e, [field]: false }));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!allFilled) { setError(dictionary.chat.completeFields); return; }
    setSubmitting(true);
    setError(null);
    try {
      const result = await reportApi.commitReport({
        ...draft,
        clean_problem: draft.problem,
        clean_cause: draft.cause,
        clean_solution: draft.solution,
      });
      onSubmit(result.id, result.machine_type);
    } catch {
      setError(dictionary.chat.unableToCommit);
      setSubmitting(false);
    }
  }

  const fieldLabels: Record<ReportField, string> = {
    problem: dictionary.common.problem,
    cause: dictionary.common.cause,
    solution: dictionary.common.solution,
  };

  return (
    <Card className="border border-[var(--primary)]/20 bg-[var(--card)] w-full max-w-2xl animate-slide-up">
      <CardHeader className="px-4 py-3 border-b border-[var(--border)]">
        <CardTitle className="flex items-center justify-between text-sm font-semibold">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-[var(--primary)]" />
            {dictionary.chat.reportComposerTitle}
          </div>
          <button type="button" onClick={onCancel}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
            <X className="size-4" />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Machine */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">{dictionary.common.machineType}</Label>
            <Select value={draft.machine_type}
              onChange={e => setDraft(d => ({ ...d, machine_type: e.target.value }))}
              className="h-9 text-sm">
              {machines.map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
          </div>

          {/* Fields — each with its own Enhance button */}
          {FIELDS.map(field => (
            <div key={field} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-medium">{fieldLabels[field]}</Label>
                  {enhanced[field] && (
                    <span className="flex items-center gap-0.5 text-[10px] text-[var(--success)]">
                      <CheckCircle2 className="size-3" /> AI enhanced
                    </span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!draft[field].trim() || enhancing[field] || submitting}
                  onClick={() => enhanceField(field)}
                  className="h-6 text-[10px] px-2 gap-1"
                >
                  {enhancing[field]
                    ? <><Loader2 className="size-2.5 animate-spin" /> Enhancing…</>
                    : <><Sparkles className="size-2.5" /> {dictionary.chat.enhance}</>
                  }
                </Button>
              </div>
              <Textarea
                value={draft[field]}
                onChange={e => {
                  setDraft(d => ({ ...d, [field]: e.target.value }));
                  setEnhanced(en => ({ ...en, [field]: false }));
                }}
                rows={3}
                className="text-sm resize-none"
                placeholder={`Describe the ${field}…`}
              />
            </div>
          ))}

          {error && (
            <div className="flex items-start gap-2 border border-[var(--destructive)]/30 bg-[var(--destructive)]/5 px-3 py-2 rounded-lg">
              <AlertCircle className="size-3.5 text-[var(--destructive)] mt-0.5 shrink-0" />
              <p className="text-xs text-[var(--destructive)]">{error}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onCancel}
              className="text-xs h-8">Cancel</Button>
            <Button type="submit" size="sm" disabled={!allFilled || submitting}
              className="text-xs h-8 gap-1.5 ml-auto">
              {submitting
                ? <><Loader2 className="size-3 animate-spin" /> Submitting…</>
                : <><CheckCircle2 className="size-3" /> {dictionary.chat.submitReport}</>
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Chat message ─────────────────────────────────────────────────────────────

function ChatMessage({
  message, onCopy, machines, locale, dictionary,
  onReportSubmit, onReportCancel,
}: {
  message: Message;
  onCopy: (t: string) => void;
  machines: string[];
  locale: Locale;
  dictionary: Dictionary;
  onReportSubmit: (msgId: string, reportId: string, machine: string) => void;
  onReportCancel: (msgId: string) => void;
}) {
  if (message.type === "status") {
    return (
      <div className="flex justify-center">
        <div className="flex items-center gap-2 border border-dashed border-[var(--border)] bg-[var(--muted)] px-4 py-2 text-xs text-[var(--muted-foreground)] rounded-full">
          <Loader2 className="size-3.5 animate-spin text-[var(--primary)]" />{message.content}
        </div>
      </div>
    );
  }

  if (message.type === "report-form") {
    if (message.submitted) {
      return (
        <div className="flex gap-3 animate-slide-up">
          <div className="size-7 rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/20 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="size-3.5 text-[var(--success)]" />
          </div>
          <div className="bg-[var(--card)] border border-[var(--success)]/20 rounded-2xl rounded-tl-sm px-4 py-3 max-w-md">
            <p className="text-sm text-[var(--foreground)]">
              Report <span className="font-mono text-[var(--primary)]">{message.submitted.reportId.slice(0,8)}</span> committed for <span className="font-semibold">{message.submitted.machineType}</span>. It&apos;s now indexed in the knowledge base.
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex gap-3 animate-slide-up">
        <div className="size-7 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/70 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          <Bot className="size-3.5 text-[var(--primary-foreground)]" />
        </div>
        <InlineReportForm
          machines={machines}
          locale={locale}
          dictionary={dictionary}
          onSubmit={(id, machine) => onReportSubmit(message.id, id, machine)}
          onCancel={() => onReportCancel(message.id)}
        />
      </div>
    );
  }

  const isUser = message.role === "user";
  const answer = message.answer;

  return (
    <div className={cn("flex gap-3 animate-slide-up", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="size-7 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/70 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          <Bot className="size-3.5 text-[var(--primary-foreground)]" />
        </div>
      )}
      <div className={cn("max-w-[78%] space-y-2", isUser ? "items-end" : "items-start")}>
        <div className={cn(
          "px-4 py-3 rounded-2xl shadow-sm",
          isUser
            ? "bg-[var(--primary)] text-[var(--primary-foreground)] rounded-tr-sm"
            : "bg-[var(--card)] border border-[var(--border)] rounded-tl-sm",
        )}>
          {isUser ? <p className="text-sm">{message.content}</p> : <MarkdownText text={message.content} />}
        </div>
        {!isUser && answer && (
          <div className="space-y-2 pl-1">
            <div className="flex items-center gap-2 flex-wrap">
              <ConfidenceBadge level={answer.confidenceLevel} score={answer.confidenceScore} />
              <button type="button"
                className="flex items-center gap-1 text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                onClick={() => onCopy(answer.answer)}>
                <ClipboardCopy className="size-3" />Copy
              </button>
            </div>
            {answer.citations.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Sources ({answer.citations.length})
                </p>
                {answer.citations.slice(0,4).map(c => <CitationCard key={c.id} citation={c} />)}
              </div>
            )}
          </div>
        )}
      </div>
      {isUser && (
        <div className="size-7 rounded-lg bg-[var(--secondary)] border border-[var(--border)] flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[10px] font-semibold text-[var(--secondary-foreground)]">ME</span>
        </div>
      )}
    </div>
  );
}

// ─── Main workspace ───────────────────────────────────────────────────────────

export function ChatWorkspace({
  user, locale, dictionary,
}: {
  user: User; locale: Locale; dictionary: Dictionary;
}) {
  const { machines } = useMachineScope();
  const [messages, setMessages] = useState<Message[]>([{
    id: createId("msg"), role: "assistant", type: "text",
    content: formatTemplate(dictionary.chat.welcome, { name: user.name }),
  }]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [slashIndex, setSlashIndex] = useState(0);
  const [slashDismissed, setSlashDismissed] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Has an active (unsubmitted) report form in the thread
  const hasActiveForm = messages.some(m => m.type === "report-form" && !("submitted" in m && m.submitted));

  // Slash command menu (shown while the input starts with "/")
  const slashCommands = [
    {
      id: "report",
      label: dictionary.chat.slashSubmitReport,
      description: dictionary.chat.slashReportDescription,
      icon: FileText,
      disabled: hasActiveForm,
    },
  ];
  const slashQuery = input.startsWith("/") && !input.includes("\n")
    ? input.slice(1).trim().toLowerCase()
    : null;
  const slashMatches = slashQuery !== null
    ? slashCommands.filter(c => c.id.startsWith(slashQuery) || c.label.toLowerCase().includes(slashQuery))
    : [];
  const slashOpen = slashQuery !== null && !slashDismissed && !pending;
  const activeSlash = slashMatches[Math.min(slashIndex, Math.max(slashMatches.length - 1, 0))];

  function buildHistory(): ChatHistoryMessage[] {
    return messages
      .filter((m): m is TextMessage => m.type === "text")
      .slice(-12)
      .map(m => ({ role: m.role, content: m.content }));
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  function openReportForm() {
    if (hasActiveForm) return;
    setMessages(c => [...c, { id: createId("report"), role: "assistant", type: "report-form" }]);
  }

  function handleReportSubmit(msgId: string, reportId: string, machineType: string) {
    setMessages(c => c.map(m =>
      m.id === msgId && m.type === "report-form"
        ? { ...m, submitted: { reportId, machineType } }
        : m
    ));
  }

  function handleReportCancel(msgId: string) {
    setMessages(c => c.filter(m => m.id !== msgId));
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    setSlashDismissed(false);
    setSlashIndex(0);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  function runSlashCommand(id: string) {
    setInput("");
    setSlashIndex(0);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    if (id === "report") openReportForm();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (slashOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashIndex(i => slashMatches.length ? (i + 1) % slashMatches.length : 0);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashIndex(i => slashMatches.length ? (i - 1 + slashMatches.length) % slashMatches.length : 0);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setSlashDismissed(true);
        return;
      }
      if ((e.key === "Enter" && !e.shiftKey) || e.key === "Tab") {
        e.preventDefault();
        if (activeSlash && !activeSlash.disabled) runSlashCommand(activeSlash.id);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitQuestion();
    }
  }

  async function submitQuestion() {
    const question = input.trim();
    if (!question || pending) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setPending(true);
    setMessages(c => [...c, { id: createId("msg"), role: "user", type: "text", content: question }]);
    try {
      const answer = await chatApi.querySolution({
        question, machine_type: machines[0] || undefined, locale, history: buildHistory(),
      });
      setMessages(c => [...c, {
        id: createId("msg"), role: "assistant", type: "text",
        content: answer.answer, answer,
      }]);
    } catch (err) {
      setMessages(c => [...c, {
        id: createId("st"), role: "assistant", type: "status",
        content: err instanceof Error ? err.message : dictionary.chat.unableToAnswer,
      }]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-5 h-12 border-b border-[var(--border)] bg-[var(--card)] shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-2.5">
          <div className="size-6 rounded-md bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/70 flex items-center justify-center shadow-sm">
            <Bot className="size-3.5 text-[var(--primary-foreground)]" />
          </div>
          <span className="text-sm font-semibold">{dictionary.chat.title}</span>
          {machines[0] && <Badge variant="outline" className="text-[10px] font-mono">{machines[0]}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {copied && <span className="text-[11px] text-[var(--success)] flex items-center gap-1"><CheckCircle2 className="size-3" />Copied</span>}
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5"
            onClick={openReportForm} disabled={hasActiveForm}>
            <FileText className="size-3.5" />{dictionary.chat.slashSubmitReport}
          </Button>
        </div>
      </div>

      {/* Messages — the only scrollable region; header and input stay fixed */}
      <ScrollArea className="flex-1 min-h-0 px-4 py-5">
        <div className="space-y-5 max-w-3xl mx-auto">
          {messages.map(msg => (
            <ChatMessage key={msg.id} message={msg} onCopy={handleCopy}
              machines={machines} locale={locale} dictionary={dictionary}
              onReportSubmit={handleReportSubmit} onReportCancel={handleReportCancel} />
          ))}
          {messages.length === 1 && !pending && (
            <div className="pl-10 space-y-2 animate-slide-up" style={{ animationDelay: "120ms" }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                {dictionary.chat.suggestionsTitle}
              </p>
              <div className="flex flex-wrap gap-2">
                {dictionary.chat.suggestions.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setInput(s); textareaRef.current?.focus(); }}
                    className="text-left text-xs px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5 transition-all duration-150"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {pending && messages[messages.length - 1]?.role === "user" && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-[var(--border)] bg-[var(--card)] px-4 py-3 shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              {slashOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 z-20 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg overflow-hidden animate-slide-up">
                  <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    {dictionary.chat.slashCommands}
                  </p>
                  {slashMatches.length === 0 ? (
                    <p className="px-3 pb-2.5 text-xs text-[var(--muted-foreground)]">{dictionary.chat.noCommandMatch}</p>
                  ) : (
                    <div className="pb-1.5">
                      {slashMatches.map((cmd, i) => {
                        const Icon = cmd.icon;
                        const isActive = activeSlash?.id === cmd.id;
                        return (
                          <button
                            key={cmd.id}
                            type="button"
                            disabled={cmd.disabled}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                              isActive && !cmd.disabled ? "bg-[var(--primary)]/10" : "hover:bg-[var(--accent)]",
                              cmd.disabled && "opacity-50 cursor-not-allowed",
                            )}
                            onMouseEnter={() => setSlashIndex(i)}
                            onMouseDown={e => {
                              e.preventDefault();
                              if (!cmd.disabled) runSlashCommand(cmd.id);
                            }}
                          >
                            <div className="size-7 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center shrink-0">
                              <Icon className="size-3.5 text-[var(--primary)]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-[var(--foreground)]">{cmd.label}</p>
                              <p className="text-[11px] text-[var(--muted-foreground)] truncate">{cmd.description}</p>
                            </div>
                            <kbd className="font-mono bg-[var(--muted)] border border-[var(--border)] px-1.5 py-0.5 rounded text-[9px] text-[var(--muted-foreground)] shrink-0">
                              /{cmd.id}
                            </kbd>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              <textarea ref={textareaRef} value={input} onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={dictionary.chat.placeholder}
                rows={1} disabled={pending}
                className={cn(
                  "w-full resize-none overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-sm",
                  "px-4 py-2.5 text-sm placeholder:text-[var(--muted-foreground)]",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--primary)]/40",
                  "transition-all duration-150 leading-relaxed disabled:opacity-50",
                )}
                style={{ minHeight: "40px", maxHeight: "120px" }}
              />
            </div>
            <Button type="button" onClick={submitQuestion} disabled={!input.trim() || pending}
              size="sm" className="h-10 w-10 p-0 rounded-xl shrink-0">
              {pending ? <Loader2 className="size-4 animate-spin" /> : <SendHorizonal className="size-4" />}
            </Button>
          </div>
          <p className="text-[10px] text-[var(--muted-foreground)] mt-1.5 pl-1">
            <kbd className="font-mono bg-[var(--muted)] px-1 rounded text-[9px]">Enter</kbd> send ·{" "}
            <kbd className="font-mono bg-[var(--muted)] px-1 rounded text-[9px]">Shift+Enter</kbd> newline ·{" "}
            type <kbd className="font-mono bg-[var(--muted)] px-1 rounded text-[9px]">/</kbd> to file a report
          </p>
        </div>
      </div>
    </div>
  );
}
