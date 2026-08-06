// 250 thematische Sammelitems + Sammelserien-Definitionen.
// Type-only Import → kein Laufzeit-Zyklus mit collectibles.ts.
import type { Collectible, Effect, Rarity } from "./collectibles";

type Stat = "accel" | "topSpeed" | "grip" | "brake";
const STATS: Stat[] = ["accel", "topSpeed", "grip", "brake"];

/** Effekt passend zur Seltenheit (deterministisch über den Index). */
function effectFor(rarity: Rarity, i: number): Effect {
  const stat = STATS[i % 4];
  switch (rarity) {
    case "common":
      return { kind: "coins", amount: 40 + (i % 5) * 10 };
    case "uncommon":
      return { kind: "coins", amount: 150 + (i % 4) * 50 };
    case "rare":
      return { kind: "temp", stat, pct: 8, seconds: 90 };
    case "epic":
      return { kind: "temp", stat, pct: 14, seconds: 150 };
    case "legendary":
      return { kind: "perm", stat, pct: 1 };
    case "mythical":
      return { kind: "perm", stat, pct: 2 };
    case "cosmic":
      return { kind: "temp", stat, pct: 30, seconds: 240 };
    case "celestial":
      return { kind: "perm", stat, pct: 3 };
  }
}

/** Rarity-Verlauf innerhalb einer Serie: hinten wird es seltener. */
function rarityAt(i: number, len: number, top: Rarity): Rarity {
  const ladder: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary", "mythical", "cosmic", "celestial"];
  const maxIdx = ladder.indexOf(top);
  const p = len <= 1 ? 1 : i / (len - 1);
  // Kurve: die meisten Items sind niedrig, die letzten wenigen hoch.
  const idx = Math.min(maxIdx, Math.round(Math.pow(p, 2.2) * maxIdx));
  return ladder[idx];
}

type SeriesDef = {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  top: Rarity;
  entries: [string, string][]; // [Name, Emoji]
};

const SERIES_DEFS: SeriesDef[] = [
  {
    id: "tiere", name: "Tierwelt", emoji: "🦊", desc: "40 Tiere aus aller Welt — vom Käfer bis zum Drachenfisch.", top: "celestial",
    entries: [
      ["Marienkäfer","🐞"],["Ameise","🐜"],["Biene","🐝"],["Schmetterling","🦋"],["Schnecke","🐌"],["Frosch","🐸"],["Maus","🐭"],["Hamster","🐹"],
      ["Kaninchen","🐰"],["Eichhörnchen","🐿️"],["Igel","🦔"],["Katze","🐱"],["Hund","🐶"],["Fuchs","🦊"],["Waschbär","🦝"],["Otter","🦦"],
      ["Wolf","🐺"],["Bär","🐻"],["Panda","🐼"],["Koala","🐨"],["Faultier","🦥"],["Affe","🐵"],["Elefant","🐘"],["Nashorn","🦏"],
      ["Giraffe","🦒"],["Zebra","🦓"],["Löwe","🦁"],["Tiger","🐯"],["Leopard","🐆"],["Adler","🦅"],["Eule","🦉"],["Pfau","🦚"],
      ["Papagei","🦜"],["Pinguin","🐧"],["Delfin","🐬"],["Wal","🐳"],["Hai","🦈"],["Krake","🐙"],["Drachenfisch","🐡"],["Phönix-Vogel","🔥"],
    ],
  },
  {
    id: "essen", name: "Küchen-Kollektion", emoji: "🍕", desc: "40 Leckereien — Streetfood bis Sternemenü.", top: "cosmic",
    entries: [
      ["Brotkanten","🍞"],["Butterbrot","🧈"],["Käsewürfel","🧀"],["Salzbrezel","🥨"],["Popcorn","🍿"],["Pommes","🍟"],["Chips-Tüte","🥔"],["Donut","🍩"],
      ["Croissant","🥐"],["Bagel","🥯"],["Pfannkuchen","🥞"],["Waffel","🧇"],["Toast","🍳"],["Burger","🍔"],["Hotdog","🌭"],["Pizza-Stück","🍕"],
      ["Taco","🌮"],["Burrito","🌯"],["Sandwich","🥪"],["Salatschale","🥗"],["Ramen","🍜"],["Sushi","🍣"],["Dumpling","🥟"],["Curry","🍛"],
      ["Paella","🥘"],["Steak","🥩"],["Grillhähnchen","🍗"],["Eiscreme","🍦"],["Milchshake","🥤"],["Cupcake","🧁"],["Torte","🍰"],["Schokolade","🍫"],
      ["Honigglas","🍯"],["Espresso","☕"],["Bubble-Tea","🧋"],["Champagner","🍾"],["Trüffel-Pasta","🍝"],["Goldmakrone","🥮"],["Sterne-Menü","🌟"],["Ambrosia","🍮"],
    ],
  },
  {
    id: "games", name: "Retro-Arcade", emoji: "🕹️", desc: "35 Gaming-Relikte aus vier Jahrzehnten.", top: "cosmic",
    entries: [
      ["Spielmünze","🪙"],["Joystick","🕹️"],["D-Pad","🎮"],["Cartridge","💾"],["Speicherkarte","🗃️"],["Arcade-Token","🎫"],["Pixelherz","❤️"],["Extraleben","🍄"],
      ["Powerpille","💊"],["Blockstein","🧱"],["Tetromino","🟦"],["Ping-Paddel","🏓"],["Pixel-Rakete","🚀"],["8-Bit-Wolke","☁️"],["Highscore-Liste","📜"],["Continue-Timer","⏱️"],
      ["Boss-Schlüssel","🗝️"],["Truhe","🧰"],["Zaubertrank","🧪"],["Erfahrungskugel","🔮"],["Speicherpunkt","💠"],["Level-Portal","🌀"],["Cheat-Code","⌨️"],["Konsolen-Modul","📼"],
      ["Lichtpistole","🔫"],["CRT-Röhre","📺"],["LAN-Kabel","🔌"],["Pixel-Schwert","⚔️"],["Achievement","🏅"],["Speedrun-Uhr","⏲️"],["Glitch-Fragment","🌈"],["Debug-Menü","🧷"],
      ["Golden Cartridge","🟨"],["Arcade-Krone","👑"],["Final Boss Core","👾"],
    ],
  },
  {
    id: "space", name: "Kosmos-Archiv", emoji: "🪐", desc: "30 Fundstücke aus dem Weltraum.", top: "celestial",
    entries: [
      ["Sternenstaub","✨"],["Meteoritensplitter","☄️"],["Mondgestein","🌕"],["Marsstaub","🔴"],["Sonnenflare","☀️"],["Satellitenteil","🛰️"],["Raketendüse","🚀"],["Astronautenhelm","👨‍🚀"],
      ["Sauerstofftank","🫧"],["Kompass des Alls","🧭"],["Sternenkarte","🗺️"],["Kometenkern","🌠"],["Ringfragment","🪐"],["Asteroid","🪨"],["Nebel-Probe","🌌"],["Plasmaflasche","⚗️"],
      ["Antimaterie-Zelle","⚛️"],["Warpspule","🌀"],["Gravitonlinse","🔭"],["Pulsar-Signal","📡"],["Quasarscherbe","💫"],["Dunkle Materie","⚫"],["Wurmloch-Anker","🕳️"],["Sonnensegel","⛵"],
      ["Neutronenkern","⚪"],["Galaxienstaub","🌟"],["Zeitkristall","⏳"],["Sternenschmiede","🔥"],["Urknall-Funke","💥"],["Himmelsscherbe","🤍"],
    ],
  },
  {
    id: "musik", name: "Sound-System", emoji: "🎧", desc: "25 Klangobjekte für die perfekte Fahrt.", top: "mythical",
    entries: [
      ["Kopfhörer","🎧"],["Kassette","📼"],["Vinyl","💿"],["CD-Hülle","📀"],["Mikrofon","🎤"],["Verstärker","🔊"],["Gitarrenplektrum","🎸"],["Drumstick","🥁"],
      ["Klaviertaste","🎹"],["Saxofon","🎷"],["Trompete","🎺"],["Violine","🎻"],["Synth-Modul","🎛️"],["Equalizer","📶"],["Subwoofer","📢"],["Notenblatt","🎼"],
      ["Metronom","⏲️"],["Studio-Mixer","🎚️"],["Basskabel","🔌"],["Boombox","📻"],["Neon-Visualizer","🌈"],["Goldene Schallplatte","🥇"],["Platin-Platte","🏆"],["Bass-Drop-Kern","💥"],["Sound-Reliquie","🔮"],
    ],
  },
  {
    id: "natur", name: "Naturgewalten", emoji: "🌿", desc: "25 Wetter- und Naturphänomene.", top: "cosmic",
    entries: [
      ["Kieselstein","🪨"],["Kleeblatt","🍀"],["Ahornblatt","🍁"],["Tannenzapfen","🌲"],["Muschel","🐚"],["Sanddollar","⭐"],["Regentropfen","💧"],["Schneeflocke","❄️"],
      ["Eiszapfen","🧊"],["Nebelschwade","🌫️"],["Windböe","💨"],["Regenbogen","🌈"],["Sonnenaufgang","🌅"],["Sonnenuntergang","🌇"],["Vollmond","🌝"],["Sternennacht","🌃"],
      ["Blitz","⚡"],["Donnerhall","🌩️"],["Tornado","🌪️"],["Vulkanasche","🌋"],["Lavatropfen","🔥"],["Tsunami-Welle","🌊"],["Polarlicht","🎆"],["Erdbebenkern","🪐"],["Gaia-Kristall","💎"],
    ],
  },
  {
    id: "garage", name: "Werkstatt-Set", emoji: "🔧", desc: "20 Werkzeuge und Ersatzteile.", top: "legendary",
    entries: [
      ["Schraubenschlüssel","🔧"],["Hammer","🔨"],["Schraubendreher","🪛"],["Zange","🗜️"],["Maßband","📏"],["Drehmomentschlüssel","🧰"],["Wagenheber","🛠️"],["Ölkanne","🛢️"],
      ["Zündkerze","🕯️"],["Luftfilter","🌀"],["Bremsscheibe","💿"],["Kupplung","⚙️"],["Turbolader","🌪️"],["Nockenwelle","🧲"],["Getriebeblock","🔩"],["Karbonhaube","🖤"],
      ["Rennsitz","💺"],["Überrollkäfig","🏗️"],["Titanauspuff","🎺"],["Meister-Werkzeugkoffer","🥇"],
    ],
  },
  {
    id: "mythos", name: "Mythen & Legenden", emoji: "🐉", desc: "20 sagenhafte Artefakte.", top: "celestial",
    entries: [
      ["Amulett","📿"],["Runenstein","🪧"],["Zauberbuch","📖"],["Kristallkugel","🔮"],["Elfenpfeil","🏹"],["Zwergenhammer","⚒️"],["Zentaurenhuf","🐴"],["Meerjungfrauenschuppe","🧜"],
      ["Greifenfeder","🪶"],["Einhornhorn","🦄"],["Golem-Kern","🗿"],["Drachenschuppe","🐉"],["Phönixasche","🔥"],["Titanenkette","⛓️"],["Göttertrank","🍶"],["Weltenbaum-Samen","🌳"],
      ["Schicksalsfaden","🧵"],["Orakel-Scherbe","🫧"],["Himmelsschlüssel","🗝️"],["Krone der Ewigkeit","👑"],
    ],
  },
  {
    id: "sport", name: "Sportpokale", emoji: "🏆", desc: "15 Trophäen aus dem Motorsport und mehr.", top: "mythical",
    entries: [
      ["Startnummer","🔢"],["Trillerpfeife","📣"],["Stoppuhr","⏱️"],["Zielflagge","🏁"],["Helm","🪖"],["Rennhandschuh","🧤"],["Podestplatz","🥉"],["Silbermedaille","🥈"],
      ["Goldmedaille","🥇"],["Siegerkranz","🌿"],["Champagnerdusche","🍾"],["Meisterschale","🏆"],["Rekordtafel","📊"],["Hall-of-Fame-Plakette","🎖️"],["Legenden-Pokal","👑"],
    ],
  },
];

function buildSeries(def: SeriesDef): Collectible[] {
  return def.entries.map(([name, emoji], i) => {
    const rarity = rarityAt(i, def.entries.length, def.top);
    return {
      id: `${def.id}-${i}`,
      name,
      desc: `${def.name}: ${name}.`,
      rarity,
      emoji,
      effect: effectFor(rarity, i),
    };
  });
}

export const THEMED_ITEMS: Collectible[] = SERIES_DEFS.flatMap(buildSeries);

export type SeriesTier = { pct: number; coins: number; label: string };

export type BuiltinSeries = {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  itemIds: string[];
  tiers: SeriesTier[];
};

/** Belohnungsstufen skalieren mit der Seriengröße. */
function tiersFor(size: number): SeriesTier[] {
  const base = size * 60;
  return [
    { pct: 25, coins: Math.round(base * 0.5), label: "Sammler" },
    { pct: 50, coins: Math.round(base * 1.0), label: "Kenner" },
    { pct: 75, coins: Math.round(base * 1.8), label: "Experte" },
    { pct: 100, coins: Math.round(base * 3.5), label: "Meister" },
  ];
}

export const BUILTIN_SERIES: BuiltinSeries[] = SERIES_DEFS.map((d) => {
  const itemIds = d.entries.map((_, i) => `${d.id}-${i}`);
  return {
    id: `series-${d.id}`,
    name: d.name,
    emoji: d.emoji,
    desc: d.desc,
    itemIds,
    tiers: tiersFor(itemIds.length),
  };
});
