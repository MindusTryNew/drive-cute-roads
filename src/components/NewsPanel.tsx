import { useEffect, useState } from "react";
import { NEWS, markRead, getReadIds, type NewsItem } from "@/lib/news";

const typeLabel: Record<NewsItem["type"], string> = {
  info: "Info",
  update: "Update",
  event: "Event",
};

const typeColor: Record<NewsItem["type"], string> = {
  info: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  update: "bg-primary/10 text-primary border-primary/30",
  event: "bg-orange-500/10 text-orange-400 border-orange-500/30",
};

export function NewsPanel({ onClose }: { onClose: () => void }) {
  const [read, setRead] = useState<Set<string>>(new Set());

  useEffect(() => {
    setRead(new Set(getReadIds()));
  }, []);

  const handleOpen = (id: string) => {
    markRead(id);
    setRead(new Set(getReadIds()));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-[min(560px,95vw)] max-h-[85vh] overflow-hidden rounded-2xl border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">News</p>
            <h2 className="text-2xl font-bold">Neuigkeiten aus Drift Lab</h2>
          </div>
          <button onClick={onClose} className="rounded-lg border px-3 py-1 text-sm hover:border-primary">✕</button>
        </div>

        <div className="max-h-[60vh] space-y-3 overflow-y-auto p-5">
          {NEWS.map((n) => {
            const isRead = read.has(n.id);
            return (
              <article
                key={n.id}
                onClick={() => handleOpen(n.id)}
                className={`cursor-pointer rounded-xl border p-4 transition hover:border-primary/50 ${isRead ? "bg-card/40" : "bg-card"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] ${typeColor[n.type]}`}>
                        {typeLabel[n.type]}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">{n.date}</span>
                      {!isRead && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </div>
                    <h3 className="mt-2 text-lg font-bold">{n.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{n.body}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="border-t p-4 text-center">
          <button onClick={onClose} className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground">
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
