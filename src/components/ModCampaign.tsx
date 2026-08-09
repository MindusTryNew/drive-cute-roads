import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CHAPTERS,
  checkTask,
  getProgress,
  saveProgress,
  isChapterDone,
  isChapterUnlocked,
  campaignComplete,
  type Chapter,
  type Progress,
} from "@/lib/mod-campaign";
import { addCoins } from "@/lib/coins";
import { addPack } from "@/lib/inventory";
import { PACK_META } from "@/lib/collectibles";

type Step = "lesson" | "task" | "quiz";

const FINAL_BONUS = 25000;

export function ModCampaign({ onBack }: { onBack: () => void }) {
  const [progress, setProgress] = useState<Progress>(() => getProgress());
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const doneCount = CHAPTERS.filter((c) => isChapterDone(progress, c.id)).length;
  const pct = Math.round((doneCount / CHAPTERS.length) * 100);

  const update = (p: Progress) => { saveProgress(p); setProgress(p); };

  const grant = (chapter: Chapter, p: Progress): Progress => {
    if (!isChapterDone(p, chapter.id) || p.rewarded.includes(chapter.id)) return p;
    addCoins(chapter.reward.coins);
    if (chapter.reward.pack) addPack(chapter.reward.pack);
    const next = { ...p, rewarded: [...p.rewarded, chapter.id] };
    toast.success(
      `Kapitel abgeschlossen: +🪙 ${chapter.reward.coins.toLocaleString()}` +
      (chapter.reward.pack ? ` + ${PACK_META[chapter.reward.pack].emoji} ${PACK_META[chapter.reward.pack].label}` : ""),
    );
    if (campaignComplete(next) && !next.rewarded.includes("__final")) {
      addCoins(FINAL_BONUS);
      addPack("celestial");
      next.rewarded = [...next.rewarded, "__final"];
      toast.success(`🏅 Titel „Modder" freigeschaltet — +🪙 ${FINAL_BONUS.toLocaleString()} und ein Himmels-Reliquiar!`);
    }
    return next;
  };

  if (openIndex !== null) {
    const chapter = CHAPTERS[openIndex];
    return (
      <ChapterView
        chapter={chapter}
        progress={progress}
        onBack={() => setOpenIndex(null)}
        onTaskDone={() => {
          const p = { ...progress, tasks: [...new Set([...progress.tasks, chapter.id])] };
          update(grant(chapter, p));
        }}
        onQuizDone={() => {
          const p = { ...progress, quizzes: [...new Set([...progress.quizzes, chapter.id])] };
          update(grant(chapter, p));
        }}
      />
    );
  }

  return (
    <main className="h-screen w-screen overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Modding-Kampagne</p>
            <h1 className="truncate text-2xl font-bold">Vom Anfänger zum Modder</h1>
          </div>
          <button onClick={onBack} className="shrink-0 rounded-lg border px-3 py-1.5 text-sm hover:border-primary">← Zurück</button>
        </header>

        <div className="mt-4 h-2 overflow-hidden rounded-full border bg-card/60">
          <div className="h-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{doneCount} / {CHAPTERS.length} Kapitel · {pct}%</p>

        <div className="mt-6 space-y-3">
          {CHAPTERS.map((c, i) => {
            const unlocked = isChapterUnlocked(progress, i);
            const done = isChapterDone(progress, c.id);
            return (
              <button
                key={c.id}
                disabled={!unlocked}
                onClick={() => setOpenIndex(i)}
                className={`w-full rounded-2xl border p-5 text-left transition ${
                  done ? "border-primary/60 bg-primary/5" : unlocked ? "hover:border-primary" : "opacity-50"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-bold">{done ? "✅" : unlocked ? "▶️" : "🔒"} {c.title}</h2>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    🪙 {c.reward.coins.toLocaleString()}
                    {c.reward.pack ? ` · ${PACK_META[c.reward.pack].emoji}` : ""}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{c.goal}</p>
                <div className="mt-2 flex gap-2 font-mono text-[10px] uppercase tracking-widest">
                  <span className={progress.tasks.includes(c.id) ? "text-primary" : "text-muted-foreground"}>Aufgabe</span>
                  <span className={progress.quizzes.includes(c.id) ? "text-primary" : "text-muted-foreground"}>Test</span>
                </div>
              </button>
            );
          })}
        </div>

        {campaignComplete(progress) && (
          <div className="mt-6 rounded-2xl border border-primary/60 bg-primary/10 p-5 text-center">
            <p className="text-lg font-bold">🏅 Titel „Modder" freigeschaltet</p>
            <p className="text-sm text-muted-foreground">Du beherrschst alle Mod-Arten inklusive Packs.</p>
          </div>
        )}
      </div>
    </main>
  );
}

function ChapterView({
  chapter,
  progress,
  onBack,
  onTaskDone,
  onQuizDone,
}: {
  chapter: Chapter;
  progress: Progress;
  onBack: () => void;
  onTaskDone: () => void;
  onQuizDone: () => void;
}) {
  const [step, setStep] = useState<Step>("lesson");
  const [code, setCode] = useState(chapter.task.starter);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [answers, setAnswers] = useState<number[]>(() => chapter.quiz.map(() => -1));
  const [checked, setChecked] = useState(false);

  const taskDone = progress.tasks.includes(chapter.id);
  const quizDone = progress.quizzes.includes(chapter.id);
  const correctCount = useMemo(
    () => chapter.quiz.filter((q, i) => answers[i] === q.answer).length,
    [answers, chapter.quiz],
  );

  const steps: { id: Step; label: string; done: boolean }[] = [
    { id: "lesson", label: "Lektion", done: true },
    { id: "task", label: "Übung", done: taskDone },
    { id: "quiz", label: "Test", done: quizDone },
  ];

  return (
    <main className="h-screen w-screen overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h1 className="truncate text-xl font-bold">{chapter.title}</h1>
          <button onClick={onBack} className="shrink-0 rounded-lg border px-3 py-1.5 text-sm hover:border-primary">← Kapitel</button>
        </header>

        <div className="mt-4 flex gap-2">
          {steps.map((s) => (
            <button key={s.id} onClick={() => setStep(s.id)}
              className={`rounded-full border px-3 py-1 font-mono text-[11px] ${step === s.id ? "border-primary bg-primary/20" : "hover:border-primary"}`}>
              {s.done ? "✅ " : ""}{s.label}
            </button>
          ))}
        </div>

        {step === "lesson" && (
          <section className="mt-5 space-y-3 rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{chapter.goal}</p>
            {chapter.lesson.map((l, i) => (
              <p key={i} className="text-sm leading-relaxed">{l}</p>
            ))}
            {chapter.code && (
              <pre className="overflow-auto rounded-xl border bg-background p-3 text-[11px]">{chapter.code}</pre>
            )}
            <button onClick={() => setStep("task")}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Weiter zur Übung →
            </button>
          </section>
        )}

        {step === "task" && (
          <section className="mt-5 space-y-3 rounded-2xl border bg-card p-5">
            <p className="font-bold">Aufgabe</p>
            <p className="text-sm text-muted-foreground">{chapter.task.prompt}</p>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={16}
              spellCheck={false}
              className="w-full rounded-xl border bg-background p-3 font-mono text-[11px] outline-none focus:border-primary"
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const res = checkTask(chapter, code);
                  setResult(res);
                  if (res.ok && !taskDone) onTaskDone();
                }}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                ✅ Prüfen
              </button>
              <button onClick={() => setShowHint((v) => !v)} className="rounded-lg border px-4 py-2 text-sm hover:border-primary">
                💡 Hinweis
              </button>
              <button onClick={() => { setCode(chapter.task.starter); setResult(null); }}
                className="rounded-lg border px-4 py-2 text-sm hover:border-primary">
                ↺ Zurücksetzen
              </button>
              {taskDone && (
                <button onClick={() => setStep("quiz")} className="rounded-lg border border-primary px-4 py-2 text-sm">
                  Weiter zum Test →
                </button>
              )}
            </div>
            {showHint && <p className="rounded-lg border border-accent/50 bg-accent/10 p-3 text-sm">{chapter.task.hint}</p>}
            {result && (
              <p className={`rounded-lg border p-3 text-sm ${result.ok ? "border-primary/60 bg-primary/10" : "border-destructive/50 bg-destructive/10 text-destructive"}`}>
                {result.ok ? "✅ " : "❌ "}{result.message}
              </p>
            )}
          </section>
        )}

        {step === "quiz" && (
          <section className="mt-5 space-y-4 rounded-2xl border bg-card p-5">
            <p className="font-bold">Test</p>
            {chapter.quiz.map((q, qi) => (
              <div key={qi} className="rounded-xl border bg-background p-3">
                <p className="text-sm font-medium">{qi + 1}. {q.question}</p>
                <div className="mt-2 space-y-1">
                  {q.options.map((o, oi) => {
                    const picked = answers[qi] === oi;
                    const isRight = checked && oi === q.answer;
                    const isWrong = checked && picked && oi !== q.answer;
                    return (
                      <button
                        key={oi}
                        onClick={() => { const a = [...answers]; a[qi] = oi; setAnswers(a); setChecked(false); }}
                        className={`w-full rounded-lg border px-3 py-1.5 text-left text-sm ${
                          isRight ? "border-primary bg-primary/15"
                            : isWrong ? "border-destructive bg-destructive/10"
                            : picked ? "border-primary/60" : "hover:border-primary/50"
                        }`}
                      >
                        {o}
                      </button>
                    );
                  })}
                </div>
                {checked && <p className="mt-2 text-xs text-muted-foreground">{q.explain}</p>}
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setChecked(true);
                  const all = chapter.quiz.every((q, i) => answers[i] === q.answer);
                  if (all) {
                    if (!quizDone) onQuizDone();
                    toast.success("Test bestanden!");
                  } else {
                    toast.error("Noch nicht alles richtig — schau dir die Erklärungen an.");
                  }
                }}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Auswerten
              </button>
              {checked && (
                <span className="font-mono text-xs text-muted-foreground">
                  {correctCount} / {chapter.quiz.length} richtig
                </span>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
