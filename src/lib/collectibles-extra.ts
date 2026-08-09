// 300 neue Sammelitems in 10 Themenserien + zwei neue Top-Seltenheiten
// ("interplanetary", "ultimate"). Type-only Import → kein Laufzeit-Zyklus.
import type { Collectible, Effect, Rarity } from "./collectibles";
import type { BuiltinSeries, SeriesTier } from "./collectibles-themed";

type Stat = "accel" | "topSpeed" | "grip" | "brake";
const STATS: Stat[] = ["accel", "topSpeed", "grip", "brake"];

/** Generischer Effekt passend zur Seltenheit. */
function effectFor(rarity: Rarity, i: number): Effect {
  const stat = STATS[i % 4];
  switch (rarity) {
    case "common":
      return { kind: "coins", amount: 60 + (i % 5) * 15 };
    case "uncommon":
      return { kind: "coins", amount: 200 + (i % 4) * 60 };
    case "rare":
      return { kind: "temp", stat, pct: 10, seconds: 100 };
    case "epic":
      return { kind: "temp", stat, pct: 16, seconds: 160 };
    case "legendary":
      return { kind: "perm", stat, pct: 1 };
    case "mythical":
      return { kind: "perm", stat, pct: 2 };
    case "cosmic":
      return { kind: "temp", stat, pct: 32, seconds: 260 };
    case "celestial":
      return { kind: "perm", stat, pct: 3 };
    case "interplanetary":
      return { kind: "temp", stat, pct: 45, seconds: 320 };
    case "ultimate":
      return { kind: "perm", stat, pct: 5 };
  }
}

const LADDER: Rarity[] = [
  "common", "uncommon", "rare", "epic", "legendary",
  "mythical", "cosmic", "celestial", "interplanetary", "ultimate",
];

function rarityAt(i: number, len: number, top: Rarity): Rarity {
  const maxIdx = LADDER.indexOf(top);
  const p = len <= 1 ? 1 : i / (len - 1);
  const idx = Math.min(maxIdx, Math.round(Math.pow(p, 2.3) * maxIdx));
  return LADDER[idx];
}

/** [Name, Emoji, optionaler Spezial-Effekt] */
type Entry = [string, string] | [string, string, Effect];

type SeriesDef = {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  top: Rarity;
  entries: Entry[];
};

const coins = (amount: number): Effect => ({ kind: "coins", amount });
const temp = (stat: Stat, pct: number, seconds: number): Effect => ({ kind: "temp", stat, pct, seconds });
const perm = (stat: Stat, pct: number): Effect => ({ kind: "perm", stat, pct });
const cosmetic: Effect = { kind: "cosmetic" };

const SERIES_DEFS: SeriesDef[] = [
  {
    id: "ferne", name: "Fernweh-Küche", emoji: "🥘", desc: "30 Gerichte von Straßenständen rund um die Welt.", top: "cosmic",
    entries: [
      ["Reisball", "🍙"], ["Frühlingsrolle", "🥠"], ["Empanada", "🥟"], ["Falafel", "🧆"], ["Kebabspieß", "🍢"],
      ["Arepa", "🫓"], ["Churro", "🍥"], ["Baklava", "🍮"], ["Pierogi", "🥟"], ["Bratwurst", "🌭"],
      ["Poutine", "🍟"], ["Pad Thai", "🍜"], ["Bibimbap", "🍲"], ["Feijoada", "🍛"], ["Gyros", "🥙"],
      ["Ceviche", "🐟"], ["Okonomiyaki", "🥞"], ["Bánh Mì", "🥖"], ["Tagine", "🍲", coins(900)], ["Jollof-Reis", "🍚"],
      ["Peking-Ente", "🦆"], ["Trüffelrisotto", "🍚", temp("grip", 18, 200)], ["Kaviarhäppchen", "🥄"], ["Wagyu-Filet", "🥩", perm("accel", 2)],
      ["Safran-Paella", "🥘"], ["Goldsushi", "🍣", perm("topSpeed", 2)], ["Drachenfrucht-Dessert", "🐉"],
      ["Sternekoch-Menü", "⭐", coins(9000)], ["Ewiges Festmahl", "🍾", perm("brake", 3)], ["Nektar der Straße", "🍯", temp("accel", 35, 300)],
    ],
  },
  {
    id: "legenden", name: "Auto-Legenden", emoji: "🚗", desc: "30 Fahrzeug-Ikonen aus allen Epochen.", top: "ultimate",
    entries: [
      ["Kleinwagen-Modell", "🚙"], ["Kombi-Modell", "🚐"], ["Käfer-Miniatur", "🐞"], ["Pick-up-Modell", "🛻"], ["Taxi-Schild", "🚕"],
      ["Bus-Modell", "🚌"], ["Cabrio-Modell", "🚗"], ["Coupé-Modell", "🚘"], ["Roadster-Skizze", "✏️"], ["Rallye-Modell", "🏔️"],
      ["Muscle-Car-Modell", "🐎"], ["Hot-Rod-Modell", "🔥"], ["Lowrider-Modell", "⛓️"], ["Van-Modell", "🚌"], ["Buggy-Modell", "🏜️"],
      ["Tourenwagen", "🏁"], ["GT-Modell", "🏆"], ["Prototyp-Chassis", "🧪"], ["Le-Mans-Modell", "🕛", temp("topSpeed", 20, 180)],
      ["Formel-Monoposto", "🏎️"], ["Gruppe-B-Legende", "💥", perm("accel", 1)], ["Concept-Car", "🔷"],
      ["Elektro-Hypercar", "⚡", temp("accel", 25, 220)], ["Wasserstoff-Prototyp", "💧"], ["Rekordfahrzeug", "📈", perm("topSpeed", 2)],
      ["Goldenes Lenkrad", "🥇", coins(12000)], ["Meisterschafts-Chassis", "🛠️", perm("grip", 3)],
      ["Zeitlose Ikone", "🕰️", perm("topSpeed", 4)], ["Prototyp Null", "🕳️", temp("accel", 50, 340)],
      ["Ultimatives Fahrzeug", "👑", perm("accel", 6)],
    ],
  },
  {
    id: "wetter", name: "Wetterkarte", emoji: "🌦️", desc: "30 Wetterlagen von leichter Brise bis Weltuntergang.", top: "celestial",
    entries: [
      ["Sonnenstrahl", "🌞"], ["Leichte Brise", "🍃"], ["Wölkchen", "☁️"], ["Morgentau", "💦"], ["Frühnebel", "🌫️"],
      ["Nieselregen", "🌦️"], ["Landregen", "🌧️"], ["Platzregen", "☔"], ["Graupel", "🧊"], ["Schneeschauer", "🌨️"],
      ["Raureif", "❄️"], ["Frostnacht", "🥶"], ["Hitzewelle", "🥵"], ["Wüstenwind", "🏜️"], ["Sandsturm", "🌪️"],
      ["Böenfront", "💨"], ["Gewitterzelle", "⛈️"], ["Kugelblitz", "⚡", temp("accel", 22, 150)], ["Hagelsturm", "🧊"],
      ["Sturmflut", "🌊"], ["Orkan", "🌀"], ["Monsun", "🌧️"], ["Blizzard", "🌬️", temp("grip", 20, 200)],
      ["Nordlicht", "🎇"], ["Sonnenfinsternis", "🌑", perm("brake", 1)], ["Sternschnuppenregen", "🌠"],
      ["Wetterleuchten", "🔆"], ["Jahrhundertsturm", "🌩️", perm("topSpeed", 2)], ["Klimakern", "🌍", coins(15000)],
      ["Himmelsauge", "👁️", perm("grip", 3)],
    ],
  },
  {
    id: "hightech", name: "Hightech-Garage", emoji: "🧰", desc: "30 Werkzeuge und Bauteile der Zukunft.", top: "interplanetary",
    entries: [
      ["Digital-Messschieber", "📐"], ["Akkuschrauber", "🔋"], ["Diagnose-Dongle", "🔌"], ["Reifendrucksensor", "🛞"], ["Radlager", "⚙️"],
      ["Keilriemen", "➰"], ["Lambdasonde", "🧪"], ["Kühlerlüfter", "🌀"], ["Ladeluftkühler", "❄️"], ["Downpipe", "🎺"],
      ["Sportfahrwerk", "🪜"], ["Gewindefahrwerk", "🔩"], ["Bremssattel", "🟥"], ["Sperrdifferential", "🔗"], ["Sequentielles Getriebe", "🎚️"],
      ["Carbon-Bremsscheibe", "⚫"], ["Titanpleuel", "🪶"], ["Keramikkolben", "⚪"], ["Bi-Turbo-Set", "🌪️", temp("topSpeed", 18, 180)],
      ["Hybridmodul", "🔋"], ["Aktive Aero", "🛩️", perm("grip", 1)], ["Magnetdämpfer", "🧲"],
      ["KI-Fahrhilfe", "🤖", temp("grip", 24, 220)], ["Quanten-Steuergerät", "🧠"], ["Nanolack", "🎨", cosmetic],
      ["Fusionsakku", "☢️", perm("accel", 3)], ["Antigrav-Aufhängung", "🛸", perm("grip", 3)],
      ["Plasma-Injektor", "🔥", temp("accel", 40, 300)], ["Orbital-Werkbank", "🛰️", coins(20000)],
      ["Interplanetarer Antrieb", "🚀", temp("topSpeed", 48, 330)],
    ],
  },
  {
    id: "kueste", name: "Küstenfunde", emoji: "🏝️", desc: "30 Schätze zwischen Strand und Tiefsee.", top: "cosmic",
    entries: [
      ["Treibholz", "🪵"], ["Strandglas", "🫙"], ["Seestern", "⭐"], ["Krebsschere", "🦀"], ["Garnelenpanzer", "🦐"],
      ["Fischschuppe", "🐠"], ["Algenbüschel", "🌿"], ["Korallenstück", "🪸"], ["Seeigel", "🦔"], ["Sanddüne", "🏖️"],
      ["Leuchtturm-Miniatur", "🗼"], ["Anker-Anhänger", "⚓"], ["Steuerrad", "🎡"], ["Fernglas", "🔭"], ["Seekarte", "🗺️"],
      ["Flaschenpost", "🍾"], ["Netzboje", "🟠"], ["Kompassrose", "🧭"], ["Perlmuschel", "🦪", coins(800)],
      ["Schwarze Perle", "⚫"], ["Piratenmünze", "🪙", coins(2500)], ["Schatzkarte", "📜"],
      ["Tiefseelaterne", "🏮", temp("brake", 18, 200)], ["Riesenkalmar-Ring", "🦑"], ["Wrackglocke", "🔔"],
      ["Meereskrone", "👑", perm("grip", 2)], ["Poseidons Dreizack", "🔱", perm("topSpeed", 3)],
      ["Abyss-Kristall", "💠", temp("grip", 34, 260)], ["Gezeitenkern", "🌊", coins(11000)], ["Ozean-Reliquie", "🐚", perm("brake", 3)],
    ],
  },
  {
    id: "staedte", name: "Städte der Welt", emoji: "🌆", desc: "30 Souvenirs aus Metropolen und Bergdörfern.", top: "celestial",
    entries: [
      ["Straßenschild", "🚏"], ["U-Bahn-Ticket", "🎫"], ["Ampelmännchen", "🚦"], ["Parkuhr", "🅿️"], ["Kanaldeckel", "⚫"],
      ["Zebrastreifen-Stein", "🦓"], ["Laternenglas", "💡"], ["Brückenniete", "🌉"], ["Hafenkran-Modell", "🏗️"], ["Marktstand", "🏪"],
      ["Tram-Glocke", "🚋"], ["Altstadt-Kachel", "🧱"], ["Kirchturm-Zeiger", "⛪"], ["Kuppel-Splitter", "🕌"], ["Pagodendach", "🏯"],
      ["Wolkenkratzer-Modell", "🏙️"], ["Neonreklame", "🌃"], ["Skyline-Postkarte", "📮"], ["Brunnenmünze", "⛲", coins(1200)],
      ["Stadtwappen", "🛡️"], ["Bürgermeister-Schlüssel", "🗝️"], ["Nachtmarkt-Laterne", "🏮"],
      ["Metropolen-Panorama", "🌇", temp("topSpeed", 22, 210)], ["Goldene Brücke", "🌁", perm("grip", 1)],
      ["Weltausstellungs-Pin", "📌"], ["Kaiserpalast-Siegel", "🏛️", coins(9000)], ["Sternenstadt", "✨"],
      ["Himmelsstadt-Modell", "🏙️", perm("topSpeed", 3)], ["Ewige Hauptstadt", "👑", perm("accel", 3)],
      ["Weltkarten-Reliquie", "🗺️", temp("accel", 36, 280)],
    ],
  },
  {
    id: "elektronik", name: "Elektronik-Kiste", emoji: "💻", desc: "30 Bauteile, Kabel und Displays.", top: "cosmic",
    entries: [
      ["Widerstand", "🟫"], ["Kondensator", "🔵"], ["Diode", "🔻"], ["Transistor", "🔺"], ["Platine", "🟩"],
      ["Lötzinn", "🥄"], ["Jumperkabel", "🧵"], ["Breadboard", "🍞"], ["LED-Strip", "💡"], ["Mikrocontroller", "🔲"],
      ["Sensorpaket", "📟"], ["Servo-Motor", "🔄"], ["Lüfterrad", "🌀"], ["Kühlkörper", "🧊"], ["Netzteil", "🔌"],
      ["SSD-Riegel", "💾"], ["RAM-Modul", "📏"], ["Grafikkarte", "🖥️", temp("accel", 16, 170)], ["Prozessor", "🧠"],
      ["Glasfaserader", "🕸️"], ["Antennenmast", "📡"], ["Drohnenrotor", "🚁"], ["Hologramm-Projektor", "🔮", cosmetic],
      ["Quantenchip", "⚛️", perm("accel", 2)], ["Neuralkern", "🧬"], ["Rechenzentrum-Modul", "🏢", coins(10000)],
      ["Supraleiter-Spule", "🧲", perm("grip", 2)], ["Singularitäts-Chip", "🕳️", temp("topSpeed", 38, 290)],
      ["Datenkrone", "👑", coins(18000)], ["Code der Unendlichkeit", "♾️", perm("topSpeed", 3)],
    ],
  },
  {
    id: "saison", name: "Jahreszeiten", emoji: "🍂", desc: "30 Momente aus Frühling, Sommer, Herbst und Winter.", top: "mythical",
    entries: [
      ["Krokusblüte", "🌷"], ["Kirschblüte", "🌸"], ["Osterei", "🥚"], ["Regenschirm", "☂️"], ["Frühlingswind", "🌬️"],
      ["Grillkohle", "🔥"], ["Badetuch", "🧺"], ["Eiswaffel", "🍧"], ["Sonnenbrille", "🕶️"], ["Sommerfestlicht", "🎆"],
      ["Kürbis", "🎃"], ["Kastanie", "🌰"], ["Herbstlaub", "🍂"], ["Drachenschnur", "🪁"], ["Nebelmorgen", "🌫️"],
      ["Erntekorb", "🧺"], ["Adventskerze", "🕯️"], ["Schneemann", "⛄"], ["Schlittschuh", "⛸️"], ["Glühweinbecher", "🍷"],
      ["Silvesterrakete", "🎇"], ["Neujahrsglocke", "🔔", coins(3000)], ["Sonnenwende", "☀️"],
      ["Tag-und-Nacht-Gleiche", "🌗", perm("brake", 1)], ["Mitternachtssonne", "🌅"], ["Polarnacht", "🌌"],
      ["Vier-Jahreszeiten-Rad", "🎡", temp("grip", 26, 240)], ["Zeitkreis", "⏳", perm("accel", 2)],
      ["Ewiger Kalender", "📅", coins(7000)], ["Sanduhr der Epochen", "⌛", perm("topSpeed", 2)],
    ],
  },
  {
    id: "rennsport", name: "Rennsport-Archiv", emoji: "🏁", desc: "30 Relikte aus 100 Jahren Motorsport.", top: "interplanetary",
    entries: [
      ["Boxenschild", "🪧"], ["Radmutter", "🔩"], ["Schlagschrauber", "🔧"], ["Tankstutzen", "⛽"], ["Reifenwärmer", "♨️"],
      ["Slick-Reifen", "🛞"], ["Regenreifen", "🌧️"], ["Frontflügel", "🛩️"], ["Heckflügel", "🪽"], ["Diffusor", "📐"],
      ["Funkgerät", "📻"], ["Boxenfunk-Notiz", "📝"], ["Rundenzeit-Tafel", "🕒"], ["Sicherheitsgurt", "🔗"], ["HANS-System", "🦺"],
      ["Feuerschutzanzug", "🧯"], ["Safety-Car-Licht", "🚨"], ["Startampel", "🚦"], ["Pole-Position-Plakette", "1️⃣"],
      ["Podest-Trophäe", "🏆"], ["Streckenrekord-Tafel", "📊", perm("topSpeed", 1)], ["Meisterschaftsring", "💍"],
      ["Legendärer Helm", "🪖", perm("grip", 2)], ["Sieger-Champagner", "🍾", coins(6000)],
      ["24-Stunden-Uhr", "🕛", temp("brake", 28, 250)], ["Grand-Slam-Medaille", "🎖️"],
      ["Hall-of-Fame-Schlüssel", "🗝️", coins(16000)], ["Unendlichkeits-Rundenzähler", "♾️", perm("accel", 3)],
      ["Sternenpokal", "🌟", temp("topSpeed", 44, 320)], ["Interstellares Rennlizenz", "🛸", perm("topSpeed", 4)],
    ],
  },
  {
    id: "fabel", name: "Fabelwesen", emoji: "🧝", desc: "30 Wesen aus Sagen, Träumen und dem Nichts.", top: "ultimate",
    entries: [
      ["Wichtel", "🧌"], ["Kobold", "👺"], ["Fee", "🧚"], ["Waldgeist", "🌳"], ["Nixe", "🧜"],
      ["Zwerg", "⛏️"], ["Elf", "🧝"], ["Zentaur", "🐎"], ["Satyr", "🐐"], ["Harpyie", "🪶"],
      ["Basilisk", "🐍"], ["Chimäre", "🦁"], ["Werwolf", "🐺"], ["Vampirfledermaus", "🦇"], ["Golem", "🗿"],
      ["Yeti", "❄️"], ["Kraken-Auge", "🦑"], ["Greif", "🦅"], ["Sphinx", "🐈"], ["Hydra-Zahn", "🐲"],
      ["Feuerdrache", "🔥", temp("accel", 20, 190)], ["Eisdrache", "🧊", temp("grip", 20, 190)],
      ["Phönix-Feder", "🪶", perm("accel", 2)], ["Einhorn-Mähne", "🦄"], ["Weltenschlange", "🐍", perm("brake", 2)],
      ["Titan-Herz", "💗", coins(14000)], ["Sternendrache", "🐉", perm("topSpeed", 3)],
      ["Traumwandler", "💤", temp("brake", 40, 300)], ["Schöpfergeist", "🌌", perm("grip", 4)],
      ["Ultimatives Wesen", "👁️", perm("accel", 6)],
    ],
  },
];

function build(def: SeriesDef): Collectible[] {
  return def.entries.map((e, i) => {
    const [name, emoji, special] = e as [string, string, Effect | undefined];
    const rarity = rarityAt(i, def.entries.length, def.top);
    return {
      id: `x-${def.id}-${i}`,
      name,
      desc: `${def.name}: ${name}.`,
      rarity,
      emoji,
      effect: special ?? effectFor(rarity, i),
      series: def.name,
    };
  });
}

export const EXTRA_ITEMS: Collectible[] = SERIES_DEFS.flatMap(build);

function tiersFor(size: number): SeriesTier[] {
  const base = size * 90;
  return [
    { pct: 25, coins: Math.round(base * 0.5), label: "Sammler" },
    { pct: 50, coins: Math.round(base * 1.0), label: "Kenner" },
    { pct: 75, coins: Math.round(base * 1.8), label: "Experte" },
    { pct: 100, coins: Math.round(base * 3.5), label: "Meister" },
  ];
}

export const EXTRA_SERIES: BuiltinSeries[] = SERIES_DEFS.map((d) => ({
  id: `series-x-${d.id}`,
  name: d.name,
  emoji: d.emoji,
  desc: d.desc,
  itemIds: d.entries.map((_, i) => `x-${d.id}-${i}`),
  tiers: tiersFor(d.entries.length),
}));
