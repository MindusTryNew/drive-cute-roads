import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  listMarket,
  publishCar,
  purchaseListing,
  feeFor,
  getSellerNick,
  setSellerNick,
  type MarketListing,
} from "@/lib/market";
import { listCars, saveCar, type CustomCar } from "@/lib/garage";
import { getCoins, spendCoins, subscribeCoins, getSlots } from "@/lib/coins";
import { priceForCar } from "@/lib/car-price";

export function Market({ onBack }: { onBack: () => void }) {
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [coins, setCoins] = useState(getCoins());
  const [myCars, setMyCars] = useState<CustomCar[]>([]);
  const [sellPick, setSellPick] = useState<CustomCar | null>(null);
  const [sellPrice, setSellPrice] = useState(500);
  const [nick, setNick] = useState(getSellerNick());

  const refresh = async () => {
    setLoading(true);
    setErr(null);
    try {
      setListings(await listMarket());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Markt konnte nicht geladen werden");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    setMyCars(listCars());
    const un = subscribeCoins(setCoins);
    return () => { un(); };
  }, []);

  const handleBuy = async (l: MarketListing) => {
    setErr(null); setInfo(null);
    if (getCoins() < l.price) { setErr(`Nicht genug Coins (${l.price} 🪙 nötig).`); return; }
    if (listCars().length >= getSlots()) { setErr("Garage voll — kaufe einen weiteren Slot."); return; }
    try {
      const car = await purchaseListing(l);
      spendCoins(l.price);
      saveCar(car, false);
      setMyCars(listCars());
      setInfo(`„${car.name}" gekauft und in die Garage geparkt.`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Kauf fehlgeschlagen");
    }
  };

  const openSell = (c: CustomCar) => {
    setSellPick(c);
    setSellPrice(Math.max(100, priceForCar(c.tuning, c.appearance)));
  };

  const confirmSell = async () => {
    if (!sellPick) return;
    setErr(null); setInfo(null);
    const n = nick.trim();
    if (n.length < 2 || n.length > 20) { setErr("Nickname 2–20 Zeichen."); return; }
    if (sellPrice < 100 || sellPrice > 1_000_000) { setErr("Preis 100 – 1.000.000."); return; }
    const fee = feeFor(sellPrice);
    if (getCoins() < fee) { setErr(`Marktgebühr ${fee} 🪙 reicht nicht.`); return; }
    try {
      await publishCar(sellPick, n, sellPrice);
      spendCoins(fee);
      setSellerNick(n);
      setSellPick(null);
      setInfo(`„${sellPick.name}" gelistet — Gebühr ${fee} 🪙 bezahlt.`);
      refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Veröffentlichung fehlgeschlagen");
    }
  };

  return (
    <main className="relative h-screen w-screen overflow-y-auto">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onBack}>← Garage</Button>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Markt</p>
            <h1 className="text-xl font-bold">Öffentlicher Auto-Markt</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5">
          <span>🪙</span>
          <span className="font-mono text-sm tabular-nums">{coins}</span>
        </div>
      </header>

      {err && (
        <div className="mx-6 mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">{err}</div>
      )}
      {info && (
        <div className="mx-6 mt-4 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm">{info}</div>
      )}

      {/* My cars — sellable */}
      <section className="px-6 pt-6">
        <h2 className="text-lg font-bold">Eigene Autos verkaufen</h2>
        <p className="text-xs text-muted-foreground">
          Marktgebühr: 10 % des Listenpreises (wird sofort von deinen Coins abgezogen).
        </p>
        {myCars.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Du hast noch keine eigenen Autos.</p>
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-3 lg:grid-cols-4">
            {myCars.map((c) => (
              <div key={c.id} className="rounded-xl border bg-card p-3"
                   style={{ borderColor: c.appearance.primaryColor + "55" }}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">{c.name}</p>
                  <span className="h-4 w-4 rounded-full" style={{ background: c.appearance.primaryColor }} />
                </div>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  {Math.round(c.tuning.topSpeed)} km/h · {c.tuning.time0to100.toFixed(1)} s
                </p>
                <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => openSell(c)}>Verkaufen</Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Listings */}
      <section className="px-6 py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Aktuelle Angebote</h2>
          <Button variant="ghost" size="sm" onClick={refresh}>Aktualisieren</Button>
        </div>
        {loading ? (
          <p className="mt-3 text-sm text-muted-foreground">Lade Markt …</p>
        ) : listings.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Noch keine Angebote — sei der erste!</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <article key={l.id} className="rounded-2xl border bg-card p-4"
                       style={{ borderColor: l.primary_color + "55" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground capitalize">{l.body_type}</p>
                    <h3 className="mt-0.5 text-lg font-bold">{l.car_name}</h3>
                    <p className="font-mono text-[10px] text-muted-foreground">von {l.seller_nick}</p>
                  </div>
                  <span className="h-7 w-7 rounded-full" style={{ background: l.primary_color, boxShadow: `0 0 18px ${l.primary_color}88` }} />
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <dt className="font-mono text-[9px] uppercase text-muted-foreground">Top</dt>
                    <dd className="font-bold tabular-nums">{Math.round(l.top_speed)} km/h</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[9px] uppercase text-muted-foreground">0–100</dt>
                    <dd className="font-bold tabular-nums">{Number(l.time_0_100).toFixed(1)} s</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[9px] uppercase text-muted-foreground">Verkauft</dt>
                    <dd className="font-bold tabular-nums">{l.times_purchased}×</dd>
                  </div>
                </dl>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-mono text-base font-bold">🪙 {l.price}</span>
                  <Button size="sm" disabled={coins < l.price} onClick={() => handleBuy(l)}>
                    {coins < l.price ? "Zu teuer" : "Kaufen"}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Sell dialog */}
      {sellPick && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[min(440px,90vw)] rounded-2xl border bg-card p-6">
            <h3 className="text-lg font-bold">„{sellPick.name}" verkaufen</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {Math.round(sellPick.tuning.topSpeed)} km/h · {sellPick.tuning.time0to100.toFixed(1)} s · {sellPick.tuning.drive}
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <Label className="text-xs">Verkäufer-Nick (2–20 Zeichen)</Label>
                <Input value={nick} onChange={(e) => setNick(e.target.value)} maxLength={20} />
              </div>
              <div>
                <Label className="text-xs">Preis in Coins (100 – 1.000.000)</Label>
                <Input type="number" min={100} max={1_000_000} value={sellPrice}
                       onChange={(e) => setSellPrice(parseInt(e.target.value, 10) || 0)} />
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  Marktgebühr (10 %): 🪙 {feeFor(sellPrice)} — du hast 🪙 {coins}
                </p>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setSellPick(null)}>Abbrechen</Button>
              <Button className="flex-1" onClick={confirmSell}>Listen</Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
