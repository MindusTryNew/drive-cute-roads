import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchOffers, fetchMyOffers, createOffer, acceptOffer, cancelOffer, claimPayout,
  describeGive, describeWant, canFulfill, matchingCars, matchingItems,
  type GivePart, type WantOption, type TradeOffer,
} from "@/lib/trading";
import { COLLECTIBLES_BY_ID, RARITY_LABEL, RARITY_ORDER, type Rarity } from "@/lib/collectibles";
import { getCollection } from "@/lib/collection";
import { getCoins } from "@/lib/coins";
import { listCars, type CustomCar } from "@/lib/garage";
import { fetchWishlists, type CloudWishlist } from "@/lib/wishlist";

type Tab = "browse" | "mine" | "new" | "wishes";

export function TradeBoard({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("browse");
  const [userId, setUserId] = useState<string | null>(null);
  const [nick, setNick] = useState("anon");
  const [offers, setOffers] = useState<TradeOffer[]>([]);
  const [mine, setMine] = useState<TradeOffer[]>([]);
  const [wishes, setWishes] = useState<CloudWishlist[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async (uid: string | null) => {
    setLoading(true);
    const [o, w] = await Promise.all([fetchOffers(), fetchWishlists()]);
    setOffers(o);
    setWishes(w);
    if (uid) setMine(await fetchMyOffers(uid));
    setLoading(false);
  };

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      setUserId(uid);
      setNick((data.user?.email ?? "anon").split("@")[0].slice(0, 24));
      await reload(uid);
    })();
  }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: "browse", label: "Angebote" },
    { id: "new", label: "+ Neues Angebot" },
    { id: "mine", label: "Meine Angebote" },
    { id: "wishes", label: "Wunschlisten" },
  ];

  return (
    <main className="h-screen w-screen overflow-y-auto p-6 pb-24">
      <div className="mx-auto max-w-5xl">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Tauschbörse</p>
            <h1 className="text-3xl font-bold">🤝 Spieler-Handel</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sammelitems, Fahrzeuge und Coins mit anderen Spielern tauschen.
            </p>
          </div>
          <button onClick={onBack} className="shrink-0 rounded-lg border px-4 py-2 text-sm hover:border-primary">← Zurück</button>
        </header>

        {!userId && (
          <div className="mt-6 rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm">
            Zum Handeln brauchst du ein Konto — melde dich über <b>☁️ Konto</b> an.
          </div>
        )}

        <nav className="mt-6 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`rounded-lg border px-4 py-2 text-sm ${tab === t.id ? "border-primary bg-primary/10" : "hover:border-primary/50"}`}>
              {t.label}
            </button>
          ))}
          <button onClick={() => void reload(userId)}
            className="rounded-lg border px-4 py-2 text-sm hover:border-primary">↻ Aktualisieren</button>
        </nav>

        {loading && <p className="mt-8 text-sm text-muted-foreground">Lade …</p>}

        {!loading && tab === "browse" && (
          <div className="mt-6 space-y-4">
            {offers.length === 0 && <Empty text="Noch keine offenen Angebote. Erstelle das erste!" />}
            {offers.map((o) => (
              <OfferCard key={o.id} offer={o} own={o.owner_id === userId}
                onDone={() => void reload(userId)} />
            ))}
          </div>
        )}

        {!loading && tab === "mine" && (
          <div className="mt-6 space-y-4">
            {mine.length === 0 && <Empty text="Du hast noch keine Angebote erstellt." />}
            {mine.map((o) => (
              <div key={o.id} className="rounded-2xl border bg-card p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {o.status === "open" ? "Offen" : "Angenommen"}
                    </p>
                    <p className="text-sm"><b>Du gibst:</b> {o.give.map(describeGive).join(" + ")}</p>
                    <p className="text-sm"><b>Du willst:</b> {o.want.map(describeWant).join(" ODER ")}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {o.status === "open" && (
                      <button onClick={async () => { const r = await cancelOffer(o); r.ok ? toast.success(r.message) : toast.error(r.message); void reload(userId); }}
                        className="rounded-lg border border-destructive/40 px-3 py-2 text-xs text-destructive hover:bg-destructive/10">
                        Zurückziehen
                      </button>
                    )}
                    {o.status === "taken" && !o.payout_claimed && (
                      <button onClick={async () => { const r = await claimPayout(o); r.ok ? toast.success(r.message) : toast.error(r.message); void reload(userId); }}
                        className="rounded-lg border border-primary bg-primary/10 px-3 py-2 text-xs font-bold">
                        Bezahlung abholen
                      </button>
                    )}
                    {o.status === "taken" && o.payout_claimed && (
                      <span className="rounded-lg border px-3 py-2 text-xs text-muted-foreground">✅ Abgeschlossen</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === "new" && (
          <NewOfferForm nick={nick} disabled={!userId} onCreated={() => { setTab("mine"); void reload(userId); }} />
        )}

        {!loading && tab === "wishes" && (
          <div className="mt-6 space-y-3">
            {wishes.length === 0 && <Empty text="Noch keine öffentlichen Wunschlisten." />}
            {wishes.filter((w) => w.item_ids.length > 0).map((w) => (
              <div key={w.user_id} className="rounded-2xl border bg-card p-4">
                <p className="font-bold">{w.nick}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {w.item_ids.slice(0, 40).map((id) => {
                    const it = COLLECTIBLES_BY_ID[id];
                    if (!it) return null;
                    return (
                      <span key={id} title={it.name} className="rounded border px-2 py-1 text-xs">
                        {it.emoji} {it.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">{text}</div>;
}

function OfferCard({ offer, own, onDone }: { offer: TradeOffer; own: boolean; onDone: () => void }) {
  const [picking, setPicking] = useState<number | null>(null);

  const pay = async (want: WantOption, pick?: { car?: CustomCar; itemId?: string }) => {
    let payWith: GivePart[];
    if (want.kind === "coins") payWith = [{ kind: "coins", amount: want.amount }];
    else if (want.kind === "car") {
      if (!pick?.car) return;
      payWith = [{ kind: "car", car: pick.car }];
    } else {
      if (!pick?.itemId) return;
      payWith = [{ kind: "item", id: pick.itemId, count: want.count }];
    }
    const r = await acceptOffer(offer, payWith);
    r.ok ? toast.success(r.message) : toast.error(r.message);
    setPicking(null);
    onDone();
  };

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">von {offer.owner_nick}</p>
          <p className="mt-1 text-sm"><b>Bietet:</b> {offer.give.map(describeGive).join(" + ")}</p>
          <p className="text-sm"><b>Sucht:</b> {offer.want.map(describeWant).join(" ODER ")}</p>
          {offer.note && <p className="mt-1 text-xs text-muted-foreground">„{offer.note}"</p>}
        </div>
      </div>

      {!own && (
        <div className="mt-3 flex flex-wrap gap-2">
          {offer.want.map((w, i) => {
            const ok = canFulfill(w);
            return (
              <button key={i} disabled={!ok}
                onClick={() => (w.kind === "coins" ? void pay(w) : setPicking(picking === i ? null : i))}
                className="rounded-lg border border-primary/60 bg-primary/10 px-3 py-2 text-xs font-medium disabled:opacity-40">
                {ok ? "Bezahlen mit: " : "Fehlt: "}{describeWant(w)}
              </button>
            );
          })}
        </div>
      )}

      {picking !== null && offer.want[picking] && (
        <div className="mt-3 rounded-xl border bg-background/50 p-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Womit bezahlen?</p>
          <div className="flex flex-wrap gap-2">
            {offer.want[picking].kind === "car" &&
              matchingCars(offer.want[picking] as Extract<WantOption, { kind: "car" }>).map((c) => (
                <button key={c.id} onClick={() => void pay(offer.want[picking!], { car: c })}
                  className="rounded-lg border px-3 py-2 text-xs hover:border-primary">
                  🚗 {c.name} · {Math.round(c.tuning.topSpeed)} km/h
                </button>
              ))}
            {offer.want[picking].kind === "item" &&
              matchingItems(offer.want[picking] as Extract<WantOption, { kind: "item" }>).map((m) => {
                const it = COLLECTIBLES_BY_ID[m.id];
                return (
                  <button key={m.id} onClick={() => void pay(offer.want[picking!], { itemId: m.id })}
                    className="rounded-lg border px-3 py-2 text-xs hover:border-primary">
                    {it?.emoji} {it?.name} (×{m.count})
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------- Angebots-Formular ------------------------- */

function NewOfferForm({ nick, disabled, onCreated }: { nick: string; disabled: boolean; onCreated: () => void }) {
  const [give, setGive] = useState<GivePart[]>([]);
  const [want, setWant] = useState<WantOption[]>([]);
  const [note, setNote] = useState("");
  const [coinsGive, setCoinsGive] = useState(1000);
  const [coinsWant, setCoinsWant] = useState(5000);
  const [itemSearch, setItemSearch] = useState("");
  const [wantRarity, setWantRarity] = useState<Rarity>("legendary");
  const [wantCount, setWantCount] = useState(1);
  const [carMinTop, setCarMinTop] = useState(300);
  const [carMaxTime, setCarMaxTime] = useState(4);

  const cars = useMemo(() => listCars(), []);
  const owned = useMemo(() => {
    const counts = getCollection();
    const term = itemSearch.trim().toLowerCase();
    return Object.entries(counts)
      .filter(([, n]) => n > 0)
      .map(([id, n]) => ({ item: COLLECTIBLES_BY_ID[id], n }))
      .filter((x) => x.item && (!term || x.item.name.toLowerCase().includes(term)))
      .slice(0, 60);
  }, [itemSearch]);

  const submit = async () => {
    const r = await createOffer({ nick, give, want, note });
    if (r.ok) { toast.success(r.message); onCreated(); }
    else toast.error(r.message);
  };

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border bg-card p-4">
        <h2 className="text-lg font-bold">Ich biete</h2>
        <p className="text-xs text-muted-foreground">Wird beim Erstellen sofort reserviert (Treuhand).</p>

        <div className="mt-3 flex items-center gap-2">
          <input type="number" min={1} value={coinsGive} onChange={(e) => setCoinsGive(Number(e.target.value))}
            className="w-32 rounded-lg border bg-background px-2 py-1.5 font-mono text-sm" />
          <button onClick={() => setGive((g) => [...g, { kind: "coins", amount: Math.max(1, coinsGive) }])}
            disabled={getCoins() < coinsGive}
            className="rounded-lg border px-3 py-1.5 text-xs hover:border-primary disabled:opacity-40">+ Coins</button>
          <span className="text-xs text-muted-foreground">Besitz: 🪙 {getCoins().toLocaleString()}</span>
        </div>

        <div className="mt-4">
          <input value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} placeholder="Eigene Items suchen …"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
            {owned.map(({ item, n }) => (
              <button key={item.id} onClick={() => setGive((g) => [...g, { kind: "item", id: item.id, count: 1 }])}
                className="flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs hover:border-primary">
                <span>{item.emoji}</span>
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                <span className="font-mono text-muted-foreground">×{n}</span>
              </button>
            ))}
          </div>
        </div>

        {cars.length > 0 && (
          <div className="mt-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Fahrzeuge</p>
            <div className="mt-1 max-h-32 space-y-1 overflow-y-auto">
              {cars.map((c) => (
                <button key={c.id} onClick={() => setGive((g) => [...g, { kind: "car", car: c }])}
                  className="flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs hover:border-primary">
                  🚗 <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  <span className="font-mono text-muted-foreground">{Math.round(c.tuning.topSpeed)} km/h</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <ChipList parts={give.map(describeGive)} onRemove={(i) => setGive((g) => g.filter((_, j) => j !== i))} />
      </section>

      <section className="rounded-2xl border bg-card p-4">
        <h2 className="text-lg font-bold">Ich suche</h2>
        <p className="text-xs text-muted-foreground">Mehrere Optionen = der Käufer darf wählen.</p>

        <div className="mt-3 flex items-center gap-2">
          <input type="number" min={1} value={coinsWant} onChange={(e) => setCoinsWant(Number(e.target.value))}
            className="w-32 rounded-lg border bg-background px-2 py-1.5 font-mono text-sm" />
          <button onClick={() => setWant((w) => [...w, { kind: "coins", amount: Math.max(1, coinsWant) }])}
            className="rounded-lg border px-3 py-1.5 text-xs hover:border-primary">+ Coins</button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <select value={wantRarity} onChange={(e) => setWantRarity(e.target.value as Rarity)}
            className="rounded-lg border bg-background px-2 py-1.5 text-sm">
            {RARITY_ORDER.map((r) => <option key={r} value={r}>{RARITY_LABEL[r]}</option>)}
          </select>
          <input type="number" min={1} max={20} value={wantCount} onChange={(e) => setWantCount(Number(e.target.value))}
            className="w-20 rounded-lg border bg-background px-2 py-1.5 font-mono text-sm" />
          <button onClick={() => setWant((w) => [...w, { kind: "item", rarity: wantRarity, count: Math.max(1, wantCount) }])}
            className="rounded-lg border px-3 py-1.5 text-xs hover:border-primary">+ Item nach Seltenheit</button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="text-xs text-muted-foreground">min. km/h</label>
          <input type="number" value={carMinTop} onChange={(e) => setCarMinTop(Number(e.target.value))}
            className="w-24 rounded-lg border bg-background px-2 py-1.5 font-mono text-sm" />
          <label className="text-xs text-muted-foreground">max. 0–100 s</label>
          <input type="number" step={0.1} value={carMaxTime} onChange={(e) => setCarMaxTime(Number(e.target.value))}
            className="w-24 rounded-lg border bg-background px-2 py-1.5 font-mono text-sm" />
          <button onClick={() => setWant((w) => [...w, { kind: "car", minTop: carMinTop, maxTime0to100: carMaxTime }])}
            className="rounded-lg border px-3 py-1.5 text-xs hover:border-primary">+ Fahrzeug-Anforderung</button>
        </div>

        <ChipList parts={want.map(describeWant)} onRemove={(i) => setWant((w) => w.filter((_, j) => j !== i))} />

        <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 300))} rows={2}
          placeholder="Notiz (optional)"
          className="mt-4 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />

        <button onClick={() => void submit()} disabled={disabled || give.length === 0 || want.length === 0}
          className="mt-4 w-full rounded-xl border-2 border-primary bg-primary/10 py-3 font-bold hover:bg-primary/20 disabled:opacity-40">
          Angebot veröffentlichen
        </button>
      </section>
    </div>
  );
}

function ChipList({ parts, onRemove }: { parts: string[]; onRemove: (i: number) => void }) {
  if (parts.length === 0) return <p className="mt-4 text-xs text-muted-foreground">Noch nichts hinzugefügt.</p>;
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {parts.map((p, i) => (
        <span key={i} className="flex items-center gap-2 rounded-lg border border-primary/50 bg-primary/10 px-2 py-1 text-xs">
          {p}
          <button onClick={() => onRemove(i)} className="text-destructive">✕</button>
        </span>
      ))}
    </div>
  );
}
