import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { syncUp, syncDown } from "@/lib/save-sync";

type Mode = "signin" | "signup";

function friendly(err: unknown): string {
  const m = err instanceof Error ? err.message : String(err ?? "");
  const lower = m.toLowerCase();
  if (lower.includes("invalid login") || lower.includes("invalid credentials"))
    return "E-Mail oder Passwort falsch.";
  if (lower.includes("already registered") || lower.includes("user already"))
    return "Diese E-Mail ist bereits registriert. Bitte melde dich an.";
  if (lower.includes("email not confirmed"))
    return "E-Mail noch nicht bestätigt. Prüfe dein Postfach.";
  if (lower.includes("password") && (lower.includes("weak") || lower.includes("short") || lower.includes("6")))
    return "Passwort zu schwach — bitte mindestens 6 Zeichen.";
  if (lower.includes("rate limit") || lower.includes("too many"))
    return "Zu viele Versuche. Bitte kurz warten.";
  if (lower.includes("network") || lower.includes("failed to fetch"))
    return "Netzwerkproblem. Prüfe deine Verbindung.";
  return m || "Unbekannter Fehler.";
}

function validate(email: string, password: string): string | null {
  const e = email.trim();
  if (!e) return "Bitte E-Mail eingeben.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return "Bitte gültige E-Mail eingeben.";
  if (!password) return "Bitte Passwort eingeben.";
  if (password.length < 6) return "Passwort mindestens 6 Zeichen.";
  if (password.includes(" ")) return "Passwort darf keine Leerzeichen enthalten.";
  return null;
}

export function AccountMenu({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("signin");
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState<{ email?: string | null } | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ? { email: data.user.email } : null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ? { email: session.user.email } : null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async () => {
    setLocalError(null);
    const v = validate(email, password);
    if (v) { setLocalError(v); return; }
    setBusy(true);
    try {
      if (mode === "signup") {
        const redirect = typeof window !== "undefined" ? window.location.origin : undefined;
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { emailRedirectTo: redirect },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Konto erstellt und angemeldet!");
        } else {
          // Auto-Confirm aktiv → sofort einloggen
          const { error: e2 } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
          if (e2) throw e2;
          toast.success("Konto erstellt und angemeldet!");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        toast.success("Angemeldet!");
      }
      setPassword("");
    } catch (e) {
      const msg = friendly(e);
      setLocalError(msg);
      toast.error(msg);
    } finally { setBusy(false); }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.info("Abgemeldet.");
  };

  const handleUp = async () => {
    setBusy(true);
    const r = await syncUp();
    if (r.ok) { toast.success("☁️ Spielstand hochgeladen."); setLastSync(new Date().toLocaleTimeString()); }
    else toast.error(r.error ?? "Upload fehlgeschlagen.");
    setBusy(false);
  };
  const handleDown = async () => {
    if (!confirm("Lokalen Spielstand mit Cloud überschreiben?")) return;
    setBusy(true);
    const r = await syncDown();
    if (r.ok) {
      if (r.empty) toast.info("Kein Cloud-Spielstand vorhanden.");
      else { toast.success("☁️ Spielstand geladen."); setLastSync(new Date().toLocaleTimeString()); }
    } else toast.error(r.error ?? "Download fehlgeschlagen.");
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">☁️ Konto & Sync</h2>
          <button onClick={onClose} className="text-xl leading-none opacity-60 hover:opacity-100">×</button>
        </div>

        {user ? (
          <div className="space-y-3">
            <div className="rounded-lg border bg-background/50 p-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Angemeldet als</p>
              <p className="font-mono text-sm">{user.email}</p>
              {lastSync && <p className="mt-1 text-xs text-muted-foreground">Letzter Sync: {lastSync}</p>}
            </div>
            <button onClick={handleUp} disabled={busy}
              className="w-full rounded-lg border-2 border-primary bg-primary/10 py-2 font-bold hover:bg-primary/20 disabled:opacity-40">
              ⬆ Spielstand hochladen
            </button>
            <button onClick={handleDown} disabled={busy}
              className="w-full rounded-lg border py-2 hover:border-primary disabled:opacity-40">
              ⬇ Spielstand herunterladen
            </button>
            <button onClick={handleSignOut} disabled={busy}
              className="w-full rounded-lg border py-2 text-sm text-muted-foreground hover:border-destructive hover:text-destructive">
              Abmelden
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Erstelle ein Konto oder melde dich an, um deinen Spielstand (Coins, Sammelitems, Missionen) sicher in der Cloud zu speichern.
            </p>
            <div className="flex rounded-lg border p-0.5">
              <button
                onClick={() => { setMode("signin"); setLocalError(null); }}
                className={`flex-1 rounded-md py-1.5 text-sm ${mode === "signin" ? "bg-primary/20 font-bold" : ""}`}
              >Anmelden</button>
              <button
                onClick={() => { setMode("signup"); setLocalError(null); }}
                className={`flex-1 rounded-md py-1.5 text-sm ${mode === "signup" ? "bg-primary/20 font-bold" : ""}`}
              >Registrieren</button>
            </div>
            <input
              type="email"
              autoComplete="email"
              placeholder="E-Mail"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setLocalError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <input
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder="Passwort (min. 6 Zeichen)"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setLocalError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            {localError && (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {localError}
              </p>
            )}
            <button onClick={handleSubmit} disabled={busy}
              className="w-full rounded-lg border-2 border-primary bg-primary/10 py-2 font-bold hover:bg-primary/20 disabled:opacity-40">
              {busy ? "..." : mode === "signin" ? "Anmelden" : "Konto erstellen"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
