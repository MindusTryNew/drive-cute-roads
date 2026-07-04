import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { syncUp, syncDown } from "@/lib/save-sync";

type Mode = "signin" | "signup";

export function AccountMenu({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("signin");
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState<{ email?: string | null } | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ? { email: data.user.email } : null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ? { email: session.user.email } : null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) { toast.error("E-Mail und Passwort nötig."); return; }
    setBusy(true);
    try {
      if (mode === "signup") {
        const redirect = typeof window !== "undefined" ? window.location.origin : undefined;
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: redirect },
        });
        if (error) throw error;
        toast.success("Konto erstellt! Bitte prüfe ggf. dein E-Mail-Postfach.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Angemeldet!");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehler bei der Anmeldung.");
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
                onClick={() => setMode("signin")}
                className={`flex-1 rounded-md py-1.5 text-sm ${mode === "signin" ? "bg-primary/20 font-bold" : ""}`}
              >Anmelden</button>
              <button
                onClick={() => setMode("signup")}
                className={`flex-1 rounded-md py-1.5 text-sm ${mode === "signup" ? "bg-primary/20 font-bold" : ""}`}
              >Registrieren</button>
            </div>
            <input
              type="email"
              placeholder="E-Mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <input
              type="password"
              placeholder="Passwort (min. 6 Zeichen)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
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
