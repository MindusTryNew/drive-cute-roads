import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { randomRoomCode } from "@/lib/multiplayer";

export function Lobby({
  onJoin,
  onCancel,
}: {
  onJoin: (code: string, name: string) => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState(() => `Fahrer-${Math.floor(Math.random() * 999)}`);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8" style={{ boxShadow: "var(--hud-glow)" }}>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Online Multiplayer</p>
        <h1 className="mt-1 text-3xl font-bold">Raum betreten</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Teile den Code mit Freunden — alle im selben Raum sehen sich live.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Nickname</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Raum-Code</label>
            <div className="mt-1 flex gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="z. B. AB12CD"
                className="font-mono uppercase tracking-widest"
                maxLength={8}
              />
              <Button variant="outline" onClick={() => setCode(randomRoomCode())}>Neu</Button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <Button variant="ghost" onClick={onCancel} className="flex-1">Abbrechen</Button>
          <Button
            onClick={() => code.trim() && name.trim() && onJoin(code.trim(), name.trim())}
            disabled={!code.trim() || !name.trim()}
            className="flex-1"
          >
            Beitreten
          </Button>
        </div>

        <p className="mt-6 font-mono text-[10px] text-muted-foreground">
          Hinweis: Spieler kollidieren nicht miteinander (nur visuell). Kein Login nötig.
        </p>
      </div>
    </main>
  );
}
