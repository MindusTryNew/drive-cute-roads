// Collectibles-Katalog: 450+ Items in 8 Rarity-Tiers + 6 Paket-Typen.
export type Rarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "mythical"
  | "cosmic"
  | "celestial";

export type Effect =
  | { kind: "coins"; amount: number }
  | { kind: "perm"; stat: "accel" | "topSpeed" | "grip" | "brake"; pct: number }
  | { kind: "temp"; stat: "accel" | "topSpeed" | "grip" | "brake"; pct: number; seconds: number }
  | { kind: "cosmetic" };

export type Collectible = {
  id: string;
  name: string;
  desc: string;
  rarity: Rarity;
  emoji: string;
  effect?: Effect;
};

export const RARITY_COLORS: Record<Rarity, string> = {
  common: "#9ca3af",
  uncommon: "#4ade80",
  rare: "#5b8def",
  epic: "#c084fc",
  legendary: "#f6d96a",
  mythical: "#ff6ec7",
  cosmic: "#00f0ff",
  celestial: "#ffffff",
};

export const RARITY_LABEL: Record<Rarity, string> = {
  common: "Gewöhnlich",
  uncommon: "Ungewöhnlich",
  rare: "Selten",
  epic: "Episch",
  legendary: "Legendär",
  mythical: "Mythisch",
  cosmic: "Kosmisch",
  celestial: "Himmlisch",
};

export const RARITY_ORDER: Rarity[] = [
  "common", "uncommon", "rare", "epic", "legendary", "mythical", "cosmic", "celestial",
];

// Cooldowns für aktivierbare Temp-Effekte (Sekunden).
export const RARITY_COOLDOWN_SEC: Record<Rarity, number> = {
  common: 30,
  uncommon: 60,
  rare: 120,
  epic: 300,
  legendary: 600,
  mythical: 900,
  cosmic: 1800,
  celestial: 3600,
};

function mk(id: string, name: string, desc: string, rarity: Rarity, emoji: string, effect?: Effect): Collectible {
  return { id, name, desc, rarity, emoji, effect };
}

// ============================================================
//  Bestehende Basis-Items (Kurzfassung: Coins/Cosmetic/Temp)
// ============================================================

const COMMON: Collectible[] = [
  mk("c-nut",     "Rostige Mutter",       "Aus einem alten Motor.", "common", "🔩", { kind: "coins", amount: 10 }),
  mk("c-bolt",    "Loser Bolzen",         "Klappert im Kofferraum.", "common", "🔧", { kind: "coins", amount: 12 }),
  mk("c-tape",    "Klebeband-Rest",       "Praktisch für Notfälle.", "common", "🎞️", { kind: "coins", amount: 8 }),
  mk("c-cone",    "Verkehrshütchen",      "Ein Souvenir von der Straße.", "common", "🚧", { kind: "coins", amount: 15 }),
  mk("c-wrench",  "Kleiner Schrauber",    "Notfall-Werkzeug.", "common", "🛠️", { kind: "coins", amount: 20 }),
  mk("c-oil",     "Öl-Fleck",             "Auf einem Lappen.", "common", "🛢️", { kind: "coins", amount: 14 }),
  mk("c-cap",     "Kronkorken",           "Sammlerstück Nr. 1.", "common", "🥤", { kind: "coins", amount: 5 }),
  mk("c-map",     "Alter Stadtplan",      "Zerknittert.", "common", "🗺️", { kind: "coins", amount: 25 }),
  mk("c-key",     "Verlorener Schlüssel", "Passt zu nichts hier.", "common", "🔑", { kind: "coins", amount: 30 }),
  mk("c-photo",   "Verblasstes Foto",     "Ein altes Rennauto.", "common", "🖼️", { kind: "coins", amount: 22 }),
  mk("c-nail",    "Verbogener Nagel",     "Halb im Reifen.", "common", "📌", { kind: "coins", amount: 6 }),
  mk("c-coin",    "Alte Münze",           "Nicht mehr gültig.", "common", "🪙", { kind: "coins", amount: 40 }),
  mk("c-can",     "Leere Dose",           "Umweltverschmutzung.", "common", "🥫", { kind: "coins", amount: 5 }),
  mk("c-mag",     "Zerlesenes Magazin",   "Titel: Turbos '96.", "common", "📖", { kind: "coins", amount: 18 }),
  mk("c-mirror",  "Spiegelscherbe",       "Reflektiert Sonnenlicht.", "common", "🪞", { kind: "coins", amount: 10 }),
  mk("c-lug",     "Radmutter",            "Sitzt lose.", "common", "⚙️", { kind: "coins", amount: 12 }),
  mk("c-spring",  "Kleine Feder",         "Aus einem Sitz.", "common", "🌀", { kind: "coins", amount: 15 }),
  mk("c-wiper",   "Wischerblatt-Stück",   "Alt und rissig.", "common", "🧽", { kind: "coins", amount: 8 }),
  mk("c-fuse",    "Durchgebrannte Sicherung","Nutzlos aber sammelbar.", "common", "🔌", { kind: "coins", amount: 7 }),
  mk("c-glow",    "Glühbirne",            "H7, sogar noch heil.", "common", "💡", { kind: "coins", amount: 25 }),
  mk("c-flag",    "Renn-Flaggenfetzen",   "Rot-weiß kariert.", "common", "🏁", { kind: "coins", amount: 30 }),
  mk("c-shell",   "Schneckenhaus",        "Vom Rand einer Landstraße.", "common", "🐚", { kind: "coins", amount: 8 }),
  mk("c-feather", "Feder",                "Wahrscheinlich Taube.", "common", "🪶", { kind: "coins", amount: 5 }),
  mk("c-leaf",    "Trockenes Blatt",      "Herbstbeute.", "common", "🍂", { kind: "coins", amount: 4 }),
  mk("c-berry",   "Wildbeere",            "Isst du besser nicht.", "common", "🫐", { kind: "coins", amount: 6 }),
  mk("c-battery", "Alte AA-Batterie",     "Fast leer.", "common", "🔋", { kind: "coins", amount: 10 }),
  mk("c-tag",     "Preisschild",          "500 €.", "common", "🏷️", { kind: "coins", amount: 20 }),
  mk("c-string",  "Bindfaden",            "Mehrere Meter.", "common", "🧵", { kind: "coins", amount: 3 }),
  mk("c-nutOK",   "Poliertes Muttern-Set","Aufgeräumt.", "common", "🔩", { kind: "coins", amount: 22 }),
  mk("c-fan",     "Kühler-Lüfter-Blatt",  "Ein Flügel fehlt.", "common", "🌪️", { kind: "coins", amount: 18 }),
  mk("c-belt",    "Keilriemen-Rest",      "Zu kurz zum Wiederverwenden.", "common", "➰", { kind: "coins", amount: 14 }),
  mk("c-hose",    "Kühlschlauch-Stück",   "Rissig aber sammelbar.", "common", "🌫️", { kind: "coins", amount: 12 }),
  mk("c-clip",    "Metallclip",           "Halterung für irgendwas.", "common", "📎", { kind: "coins", amount: 6 }),
  mk("c-wire",    "Kupferdraht",          "Isolation abgerissen.", "common", "🧷", { kind: "coins", amount: 15 }),
  mk("c-lock",    "Vorhängeschloss",      "Ohne Schlüssel.", "common", "🔒", { kind: "coins", amount: 20 }),
  mk("c-dice",    "Roter Würfel",         "Aus einem Rückspiegel.", "common", "🎲", { kind: "coins", amount: 25 }),
  mk("c-sock",    "Einzelne Socke",       "Wie kommt die dorthin?", "common", "🧦", { kind: "coins", amount: 3 }),
  mk("c-hat",     "Ausgeblichene Cap",    "Team-Logo unlesbar.", "common", "🧢", { kind: "coins", amount: 18 }),
  mk("c-brush",   "Alte Bürste",          "Zum Reifen putzen.", "common", "🪥", { kind: "coins", amount: 9 }),
  mk("c-plug",    "Zündkerze",            "Verbraucht.", "common", "🔥", { kind: "coins", amount: 25 }),
  mk("c-bottle",  "Wasserflasche",        "Halb voll.", "common", "🧴", { kind: "coins", amount: 10 }),
  mk("c-note",    "Post-it",              "Notiz: Reifen prüfen.", "common", "📝", { kind: "coins", amount: 12 }),
  mk("c-token",   "Auto-Chip",            "Aus einem Waschsalon.", "common", "🎟️", { kind: "coins", amount: 30 }),
  mk("c-nutBig",  "Große Mutter",         "M20 Schwerlast.", "common", "🔩", { kind: "coins", amount: 24 }),
  mk("c-tag2",    "Alter Werkstatt-Bon",  "Reifenwechsel 1998.", "common", "🧾", { kind: "coins", amount: 16 }),
  mk("c-badge",   "Emblem",               "Marke unlesbar.", "common", "🏆", { kind: "coins", amount: 35 }),
  mk("c-plateS",  "Nummernschild-Stück",  "Nur ...GT lesbar.", "common", "🚗", { kind: "coins", amount: 40 }),
  mk("c-brake",   "Alter Bremsklotz",     "Bis auf 2 mm runter.", "common", "🛑", { kind: "coins", amount: 18 }),
  mk("c-mud",     "Klumpen Rennstaub",    "Karbon-Optik.", "common", "🟫", { kind: "coins", amount: 8 }),
  mk("c-spark",   "Zündfunken-Bild",      "Aus einer Broschüre.", "common", "✨", { kind: "coins", amount: 22 }),
  mk("c-glass",   "Splitter Sicherheitsglas","Glitzert grün.", "common", "🔷", { kind: "coins", amount: 10 }),
  mk("c-tirefrg", "Reifen-Fetzen",        "Auf der Autobahn gefunden.", "common", "⭕", { kind: "coins", amount: 5 }),
  mk("c-magnet",  "Kleiner Magnet",       "Zieht Metall an.", "common", "🧲", { kind: "coins", amount: 20 }),
  mk("c-cd",      "Kratzige CD",          "Playlist unerkennbar.", "common", "💿", { kind: "coins", amount: 12 }),
  mk("c-tapec",   "Kassetten-Band",       "Zerknittert.", "common", "📼", { kind: "coins", amount: 10 }),
  mk("c-radio",   "Radio-Knopf",          "Volume 11.", "common", "📻", { kind: "coins", amount: 15 }),
  mk("c-sticker", "Racing-Sticker",       "Halb abgezogen.", "common", "🏎️", { kind: "coins", amount: 18 }),
  mk("c-brochure","Prospekt '84",          "Roter Roadster auf Cover.", "common", "📇", { kind: "coins", amount: 25 }),
  mk("c-pen",     "Werbe-Kugelschreiber", "Autohaus Klaus, seit 1978.", "common", "🖊️", { kind: "coins", amount: 6 }),
  mk("c-keyc",    "Schlüsselanhänger",    "Silberner Kranz.", "common", "🔗", { kind: "coins", amount: 20 }),
  mk("c-manual",  "Handbuch-Fetzen",      "Kapitel 4 fehlt.", "common", "📕", { kind: "coins", amount: 12 }),
];

const UNCOMMON: Collectible[] = [
  mk("u-piston",  "Kolben",               "+50 Coins beim Öffnen.", "uncommon", "🔧", { kind: "coins", amount: 50 }),
  mk("u-turbo",   "Mini-Turbo (Deko)",    "+2 % Beschleunigung (temp 60 s).", "uncommon", "💨", { kind: "temp", stat: "accel", pct: 2, seconds: 60 }),
  mk("u-tirek",   "Sport-Reifen-Muster",  "+2 % Grip (temp 60 s).", "uncommon", "🛞", { kind: "temp", stat: "grip", pct: 2, seconds: 60 }),
  mk("u-brakep",  "Renn-Bremsbelag",      "+3 % Bremskraft (temp 60 s).", "uncommon", "🅱️", { kind: "temp", stat: "brake", pct: 3, seconds: 60 }),
  mk("u-fuel",    "Extra-Sprit",          "+2 % Top-Speed (temp 90 s).", "uncommon", "⛽", { kind: "temp", stat: "topSpeed", pct: 2, seconds: 90 }),
  mk("u-medal",   "Bronzemedaille",       "+60 Coins.", "uncommon", "🥉", { kind: "coins", amount: 60 }),
  mk("u-carbon",  "Carbon-Splitter",      "+70 Coins.", "uncommon", "◾", { kind: "coins", amount: 70 }),
  mk("u-cog",     "Getriebe-Ritzel",      "+80 Coins.", "uncommon", "⚙️", { kind: "coins", amount: 80 }),
  mk("u-alloy",   "Alu-Felgen-Muster",    "+65 Coins.", "uncommon", "🌐", { kind: "coins", amount: 65 }),
  mk("u-nitro",   "Nitro-Aufkleber",      "+3 % Beschleunigung (temp 45 s).", "uncommon", "🚀", { kind: "temp", stat: "accel", pct: 3, seconds: 45 }),
  mk("u-shock",   "Stoßdämpfer-Miniatur", "+2 % Grip (temp 90 s).", "uncommon", "🎢", { kind: "temp", stat: "grip", pct: 2, seconds: 90 }),
  mk("u-wing",    "Kleiner Heckflügel",   "+2 % Top-Speed (temp 60 s).", "uncommon", "🪽", { kind: "temp", stat: "topSpeed", pct: 2, seconds: 60 }),
  mk("u-cool",    "Kühlmittel-Flakon",    "+55 Coins.", "uncommon", "🥶", { kind: "coins", amount: 55 }),
  mk("u-filter",  "Sport-Luftfilter",     "+2 % Beschleunigung (temp 120 s).", "uncommon", "🌬️", { kind: "temp", stat: "accel", pct: 2, seconds: 120 }),
  mk("u-lightk",  "LED-Kit",              "Cosmetic — leuchtender Style.", "uncommon", "🔦", { kind: "cosmetic" }),
  mk("u-liver",   "Renn-Lackmuster",      "Cosmetic.", "uncommon", "🎨", { kind: "cosmetic" }),
  mk("u-tacho",   "Vintage-Tacho",        "Cosmetic.", "uncommon", "⏱️", { kind: "cosmetic" }),
  mk("u-badgeR",  "Rennstrecken-Pin",     "+90 Coins.", "uncommon", "📍", { kind: "coins", amount: 90 }),
  mk("u-token2",  "Wettbewerbs-Chip",     "+75 Coins.", "uncommon", "🎟️", { kind: "coins", amount: 75 }),
  mk("u-carbonB", "Carbon-Plättchen",     "+2 % Bremskraft (temp 90 s).", "uncommon", "⬛", { kind: "temp", stat: "brake", pct: 2, seconds: 90 }),
  mk("u-titW",    "Titan-Schraube",       "+100 Coins.", "uncommon", "🔩", { kind: "coins", amount: 100 }),
  mk("u-mapR",    "Rallye-Karte",         "+85 Coins.", "uncommon", "🗾", { kind: "coins", amount: 85 }),
  mk("u-glove",   "Fahrerhandschuh",      "+2 % Grip (temp 120 s).", "uncommon", "🧤", { kind: "temp", stat: "grip", pct: 2, seconds: 120 }),
  mk("u-helm",    "Rennhelm-Miniatur",    "Cosmetic.", "uncommon", "⛑️", { kind: "cosmetic" }),
  mk("u-torch",   "Werkstattlampe",       "+60 Coins.", "uncommon", "🔦", { kind: "coins", amount: 60 }),
  mk("u-wrenchG", "Vergoldeter Schrauber","+120 Coins.", "uncommon", "🛠️", { kind: "coins", amount: 120 }),
  mk("u-timer",   "Stoppuhr",             "+2 % Beschleunigung (temp 90 s).", "uncommon", "⏲️", { kind: "temp", stat: "accel", pct: 2, seconds: 90 }),
  mk("u-lugAlu",  "Alu-Radmutter",        "+70 Coins.", "uncommon", "🌀", { kind: "coins", amount: 70 }),
  mk("u-fanS",    "Sport-Lüfter",         "+2 % Top-Speed (temp 120 s).", "uncommon", "🌪️", { kind: "temp", stat: "topSpeed", pct: 2, seconds: 120 }),
  mk("u-hoseS",   "Silikon-Schlauch",     "+50 Coins.", "uncommon", "🌫️", { kind: "coins", amount: 50 }),
  mk("u-fabric",  "Kohle-Faser-Stoff",    "+65 Coins.", "uncommon", "🧶", { kind: "coins", amount: 65 }),
  mk("u-plateY",  "Gelbes Kennzeichen",   "+80 Coins.", "uncommon", "🟨", { kind: "coins", amount: 80 }),
  mk("u-emblemG", "Gold-Emblem",          "+110 Coins.", "uncommon", "🥇", { kind: "coins", amount: 110 }),
  mk("u-mapV",    "Vintage-Streckenkarte","+90 Coins.", "uncommon", "🧭", { kind: "coins", amount: 90 }),
  mk("u-stickerN","Nitro-Sticker",        "Cosmetic.", "uncommon", "💫", { kind: "cosmetic" }),
  mk("u-brakeC",  "Ceramic-Bremse",       "+3 % Bremskraft (temp 120 s).", "uncommon", "⬜", { kind: "temp", stat: "brake", pct: 3, seconds: 120 }),
  mk("u-airbox",  "Airbox-Skizze",        "+50 Coins.", "uncommon", "📐", { kind: "coins", amount: 50 }),
  mk("u-nozzle",  "Einspritz-Düse",       "+2 % Beschleunigung (temp 100 s).", "uncommon", "🎯", { kind: "temp", stat: "accel", pct: 2, seconds: 100 }),
  mk("u-tapeC",   "Karbon-Klebeband",     "+70 Coins.", "uncommon", "🎞️", { kind: "coins", amount: 70 }),
  mk("u-pin",     "Anstecker",            "+55 Coins.", "uncommon", "📌", { kind: "coins", amount: 55 }),
  mk("u-diceL",   "Leuchtwürfel",         "Cosmetic.", "uncommon", "🎲", { kind: "cosmetic" }),
  mk("u-glassT",  "Getöntes Glas",        "Cosmetic.", "uncommon", "🕶️", { kind: "cosmetic" }),
  mk("u-manualG", "Werkstatthandbuch",    "+95 Coins.", "uncommon", "📗", { kind: "coins", amount: 95 }),
  mk("u-plateR",  "Rotes Kennzeichen",    "+85 Coins.", "uncommon", "🟥", { kind: "coins", amount: 85 }),
  mk("u-clockR",  "Renn-Wanduhr",         "+80 Coins.", "uncommon", "🕰️", { kind: "coins", amount: 80 }),
];

const RARE: Collectible[] = [
  mk("r-goldnut", "Goldene Mutter",       "+0.3 % Grip DAUERHAFT.", "rare", "🌟", { kind: "perm", stat: "grip", pct: 0.3 }),
  mk("r-turboR",  "Echter Turbo",         "+0.3 % Beschleunigung DAUERHAFT.", "rare", "💨", { kind: "perm", stat: "accel", pct: 0.3 }),
  mk("r-brakeR",  "Rennsport-Bremse",     "+0.3 % Bremskraft DAUERHAFT.", "rare", "🛑", { kind: "perm", stat: "brake", pct: 0.3 }),
  mk("r-fuelR",   "Renn-Sprit",           "+0.2 % Top-Speed DAUERHAFT.", "rare", "⛽", { kind: "perm", stat: "topSpeed", pct: 0.2 }),
  mk("r-medalS",  "Silber-Medaille",      "+200 Coins.", "rare", "🥈", { kind: "coins", amount: 200 }),
  mk("r-goldbolt","Vergoldeter Bolzen",   "+180 Coins.", "rare", "🔧", { kind: "coins", amount: 180 }),
  mk("r-suspR",   "Rennfahrwerk",         "+5 % Grip (temp 5 min).", "rare", "🏋️", { kind: "temp", stat: "grip", pct: 5, seconds: 300 }),
  mk("r-nitroR",  "Nitro-Kartusche",      "+8 % Beschleunigung (temp 3 min).", "rare", "🚀", { kind: "temp", stat: "accel", pct: 8, seconds: 180 }),
  mk("r-tacho",   "Digital-Tacho",        "Cosmetic (Selten).", "rare", "📟", { kind: "cosmetic" }),
  mk("r-plateP",  "Prestige-Kennzeichen", "Cosmetic (Selten).", "rare", "🚘", { kind: "cosmetic" }),
  mk("r-goldkey", "Goldschlüssel",        "+250 Coins.", "rare", "🗝️", { kind: "coins", amount: 250 }),
  mk("r-wingC",   "Carbon-Heckflügel",    "+0.3 % Top-Speed DAUERHAFT.", "rare", "🪽", { kind: "perm", stat: "topSpeed", pct: 0.3 }),
  mk("r-suspS",   "Sport-Federung",       "+0.2 % Grip DAUERHAFT.", "rare", "🌀", { kind: "perm", stat: "grip", pct: 0.2 }),
  mk("r-tireR",   "Semi-Slicks",          "+6 % Grip (temp 4 min).", "rare", "🛞", { kind: "temp", stat: "grip", pct: 6, seconds: 240 }),
  mk("r-cog",     "Getriebe-Set",         "+0.3 % Beschleunigung DAUERHAFT.", "rare", "⚙️", { kind: "perm", stat: "accel", pct: 0.3 }),
  mk("r-oil",     "Renn-Öl",              "+220 Coins.", "rare", "🛢️", { kind: "coins", amount: 220 }),
  mk("r-carbonR", "Carbon-Motorhaube",    "Cosmetic (Selten).", "rare", "◼️", { kind: "cosmetic" }),
  mk("r-mapH",    "Historische Rallyekarte","+280 Coins.", "rare", "🗺️", { kind: "coins", amount: 280 }),
  mk("r-lightR",  "Xenon-Scheinwerfer",   "Cosmetic (Selten).", "rare", "💡", { kind: "cosmetic" }),
  mk("r-brakeD",  "Bremsscheibe Big",     "+5 % Bremskraft (temp 4 min).", "rare", "🅱️", { kind: "temp", stat: "brake", pct: 5, seconds: 240 }),
  mk("r-tokenR",  "Gold-Chip",            "+300 Coins.", "rare", "🎟️", { kind: "coins", amount: 300 }),
  mk("r-badgeE",  "Elite-Pin",            "Cosmetic (Selten).", "rare", "🏅", { kind: "cosmetic" }),
  mk("r-ecu",     "ECU-Modul",            "+0.2 % Beschleunigung DAUERHAFT.", "rare", "🧠", { kind: "perm", stat: "accel", pct: 0.2 }),
  mk("r-titan",   "Titan-Auspuff",        "+0.2 % Top-Speed DAUERHAFT.", "rare", "🎺", { kind: "perm", stat: "topSpeed", pct: 0.2 }),
  mk("r-slick",   "Slick-Reifen",         "+0.4 % Grip DAUERHAFT.", "rare", "🛞", { kind: "perm", stat: "grip", pct: 0.4 }),
  mk("r-diff",    "Sperrdifferenzial",    "+4 % Grip (temp 5 min).", "rare", "🔩", { kind: "temp", stat: "grip", pct: 4, seconds: 300 }),
  mk("r-fanR",    "Rennlüfter",           "+3 % Top-Speed (temp 4 min).", "rare", "🌀", { kind: "temp", stat: "topSpeed", pct: 3, seconds: 240 }),
  mk("r-clockG",  "Goldene Stoppuhr",     "+320 Coins.", "rare", "⏱️", { kind: "coins", amount: 320 }),
  mk("r-decalR",  "Rennsport-Decal-Set",  "Cosmetic (Selten).", "rare", "🎌", { kind: "cosmetic" }),
  mk("r-quill",   "Vintage-Rennfeder",    "+200 Coins.", "rare", "🪶", { kind: "coins", amount: 200 }),
];

const EPIC: Collectible[] = [
  mk("e-diamond", "Diamant-Emblem",       "+0.6 % Top-Speed DAUERHAFT.", "epic", "💎", { kind: "perm", stat: "topSpeed", pct: 0.6 }),
  mk("e-heart",   "Nitro-Kern",           "+0.6 % Beschleunigung DAUERHAFT.", "epic", "💜", { kind: "perm", stat: "accel", pct: 0.6 }),
  mk("e-crown",   "Rennkrone",            "+0.5 % Grip DAUERHAFT.", "epic", "👑", { kind: "perm", stat: "grip", pct: 0.5 }),
  mk("e-stone",   "Bremsstein",           "+0.6 % Bremskraft DAUERHAFT.", "epic", "🪨", { kind: "perm", stat: "brake", pct: 0.6 }),
  mk("e-gem",     "Karbon-Kristall",      "+600 Coins.", "epic", "🔮", { kind: "coins", amount: 600 }),
  mk("e-holo",    "Hologramm-Sticker",    "Cosmetic (Episch).", "epic", "🌈", { kind: "cosmetic" }),
  mk("e-suit",    "Renn-Overall",         "+15 % Grip (temp 10 min).", "epic", "🥋", { kind: "temp", stat: "grip", pct: 15, seconds: 600 }),
  mk("e-turboE",  "Twin-Turbo",           "+15 % Beschleunigung (temp 10 min).", "epic", "💨", { kind: "temp", stat: "accel", pct: 15, seconds: 600 }),
  mk("e-brakeE",  "Karbon-Keramik-Bremse","+15 % Bremskraft (temp 10 min).", "epic", "🅱️", { kind: "temp", stat: "brake", pct: 15, seconds: 600 }),
  mk("e-fuelE",   "Raketen-Sprit",        "+10 % Top-Speed (temp 8 min).", "epic", "🚀", { kind: "temp", stat: "topSpeed", pct: 10, seconds: 480 }),
  mk("e-medalG",  "Gold-Medaille",        "+800 Coins.", "epic", "🥇", { kind: "coins", amount: 800 }),
  mk("e-trophy",  "Champions-Trophäe",    "+1000 Coins.", "epic", "🏆", { kind: "coins", amount: 1000 }),
];

const LEGENDARY: Collectible[] = [
  mk("l-godspd",  "Speed-Deity-Kristall", "+2 % Top-Speed DAUERHAFT.", "legendary", "⚡", { kind: "perm", stat: "topSpeed", pct: 2 }),
  mk("l-godacc",  "Titanen-Kolben",       "+2 % Beschleunigung DAUERHAFT.", "legendary", "🔱", { kind: "perm", stat: "accel", pct: 2 }),
  mk("l-godgrp",  "Herz der Rennstrecke", "+2 % Grip DAUERHAFT.", "legendary", "❤️‍🔥", { kind: "perm", stat: "grip", pct: 2 }),
  mk("l-godbrk",  "Mond-Bremsstein",      "+2 % Bremskraft DAUERHAFT.", "legendary", "🌑", { kind: "perm", stat: "brake", pct: 2 }),
  mk("l-jackpot", "Jackpot-Chip",         "+5000 Coins.", "legendary", "💰", { kind: "coins", amount: 5000 }),
];

// ============================================================
//  Programmatisch erzeugte Erweiterung (+300 Items).
//  Wir erzeugen thematische Varianten pro Rarity.
// ============================================================

type Stat = "accel" | "topSpeed" | "grip" | "brake";
const STATS: Stat[] = ["accel", "topSpeed", "grip", "brake"];

function gen(
  prefix: string,
  rarity: Rarity,
  names: string[],
  emojis: string[],
  makeEffect: (i: number) => Effect | undefined,
  descPrefix = "",
): Collectible[] {
  const out: Collectible[] = [];
  for (let i = 0; i < names.length; i++) {
    const em = emojis[i % emojis.length];
    out.push(mk(`${prefix}-${i}`, names[i], `${descPrefix}${names[i]}.`.trim(), rarity, em, makeEffect(i)));
  }
  return out;
}

// ---------- +80 common ----------
const COMMON_EXT_NAMES = [
  "Alter Reifenheber","Öllappen","Kaffeetasse-Deko","Verrostete Kette","Alte Scheibe","Motorhaubenstern","Autoradio-Antenne",
  "Verrostete Schraube","Chrom-Splitter","Fußmatten-Rest","Alter Bierdeckel","Streusalz-Klumpen","Fensterheber-Kurbel",
  "Vergilbte Landkarte","Bremshebel-Federchen","Aufkleber-Rolle","Alte Batteriezelle","Fahrer-Notizbuch","Trocknerblatt",
  "Kleines Emblem","Reparatur-Zettel","Verrostete Klammer","Werkstatt-Handtuch","Zylinder-Rest","Fließband-Schnipsel",
  "Kunststoff-Blende","Alte Zange","Rissiger Spiegel","Gebrauchter Kabelbinder","Vergessene Handschellen","Motoröl-Kanister",
  "Verrostete Antenne","Kupferrohr","Radio-Frequenzskala","Zylinderkopf-Splitter","Auspuff-Endstück","Rennkleber-Rest",
  "Fensterheber-Griff","Halterungs-Winkel","Gummi-Distanz","Sicherungs-Karton","Alte Landkarte","Vintage-Verschluss",
  "Aluminium-Winkel","Kurze Kette","Nietenrest","Klingel-Schraube","Alter Halterungsknopf","Verzinkte Schelle",
  "Alter Kabelclip","Kleiner Verschluss","Fensterheber-Rad","Verzinkte Feder","Ballstopper","Verlorene Öse","Schaumstoff-Rest",
  "Rissiger Kunststoffgriff","Kleine Schutzkappe","Zerkratzter Aufkleber","Ausleger-Rest","Radlager-Bruchstück",
  "Kompressor-Feder","Ventilkegel","Fühlerlehre","Kabel-Ummantelung","Reflektor-Fetzen","Alte Türklinke",
  "Vintage-Türgriff","Verrostetes Scharnier","Tankdeckel-Reste","Windschutz-Stück","Alter Klebstoff","Radialdichtung",
  "Distanzscheibe","Verrostetes Rohr","Alte Rohrschelle","Feuerlöscher-Blende","Zünd-Kontakt","Windleitblech-Stück",
  "Vergessene Rasterschraube","Verrostete Feder-Ummantelung","Bordwerkzeug-Reste",
];
const COMMON_EMOJIS = ["🔩","🔧","🛠️","⚙️","🗝️","🪛","🔗","🧲","📎","🧷","🧵","🪥","🧴","🥤","🥫","📻","💿","📼","🎞️","📓"];
const COMMON_EXT = gen("cx", "common", COMMON_EXT_NAMES, COMMON_EMOJIS, (i) => ({ kind: "coins", amount: 5 + (i % 30) }));

// ---------- +50 uncommon ----------
const UNCOMMON_EXT_NAMES = [
  "Sport-Bremsleitung","Renn-Kupplung","Alu-Halterung","Kevlar-Fetzen","Titan-Distanz","Sport-Feder","Rennfeder Set",
  "Digitaler Drehzahlmesser","Sport-Auspuff-Aufsatz","Vintage-Getriebe","Zünd-Booster","Sport-Kupplungsfeder",
  "Anti-Roll-Bar-Miniatur","Karbon-Türgriff","LED-Konsole","Sport-Federbein","Renn-Zündspule","Titan-Ventildeckel",
  "Sport-Turbo-Mini","Carbon-Splitterlippe","LED-Rückleuchte","Sport-Kupplungsscheibe","Renn-Schaltknüppel-Miniatur",
  "Titan-Radbolzen","Karbon-Pedal-Set","Rennsport-Filter","Sport-Kühler-Miniatur","Alu-Kotflügelverbreiterung",
  "Renn-Bremskolben","LED-Innenraumkit","Karbon-Instrumententafel","Renn-Sportsitz-Miniatur","Titan-Gasfeder",
  "Sport-Startergetriebe","Alu-Motorschutz","Karbon-Diffusor-Mini","Renn-Zündschloss","Sport-Zylinderkopfdichtung",
  "LED-Blinker-Set","Sport-Kolbenring","Titan-Auspuffhalter","Karbon-Spoiler-Mini","Renn-Schaltmatrix","LED-Lauflicht-Modul",
  "Sport-Wärmeleitpaste","Rennsport-Nockenwelle","Alu-Achsschenkel","Karbon-Türverkleidung","Sport-Schwungrad",
  "Titan-Ölwannenschraube",
];
const UNCOMMON_EMOJIS = ["🔧","💨","⚡","🌀","🌐","🎯","🌪️","🎢","🚀","🅱️","🧤","⚙️","🎨","🕶️","💫","📐","📗"];
const UNCOMMON_EXT = gen("ux", "uncommon", UNCOMMON_EXT_NAMES, UNCOMMON_EMOJIS, (i) => {
  const kind = i % 3;
  if (kind === 0) return { kind: "coins", amount: 50 + (i % 100) };
  if (kind === 1) return { kind: "temp", stat: STATS[i % 4], pct: 2 + (i % 3), seconds: 45 + (i % 6) * 15 };
  return { kind: "cosmetic" };
});

// ---------- +40 rare ----------
const RARE_EXT_NAMES = [
  "Renn-Motorblock","Karbon-Chassis-Bauteil","Titan-Achswelle","Vollkarbon-Radkasten","Renn-Kupplungspaket",
  "Titan-Federbein","Renn-Sechsganggetriebe","Motorsteuergerät Pro","Renn-Auspuffanlage","Karbon-Fahrwerkslenker",
  "Titan-Bremsanker","Renn-Kraftstoffpumpe","Karbon-Karosserie-Stützstrebe","Motorsport-Wasserkühler","Renn-Ölkühler",
  "Titan-Schaltgestänge","Karbon-Doppelkupplung","Renn-Fahrwerksfeder","Titan-Kolben-Set","Karbon-Bremssattel-Skin",
  "Renn-Getriebe-Kit","Motorsport-Verteilerkappe","Titan-Nockenwellen-Set","Karbon-Ansaugbrücke","Renn-Zündverteiler",
  "Titan-Kurbelwelle","Karbon-Türverstärkung","Renn-Anti-Squat-Set","Titan-Kolbenpin","Karbon-Getriebetunnel",
  "Renn-Ölfilter","Titan-Zylinderkopfschraube","Karbon-Frontsplitter","Renn-Motorhalter","Titan-Kupplungspaket",
  "Karbon-Airbox","Renn-Fahrwerksdämpfer","Titan-Schmiederad","Karbon-Diffusor","Renn-Elektroniksteuergerät",
];
const RARE_EMOJIS = ["🌟","💨","🛑","🔩","⚙️","🅱️","🎺","🧠","🪽","🏋️","🚀","🛞","🗺️","🎌"];
const RARE_EXT = gen("rx", "rare", RARE_EXT_NAMES, RARE_EMOJIS, (i) => {
  const k = i % 4;
  if (k === 0) return { kind: "perm", stat: STATS[i % 4], pct: 0.2 + (i % 3) * 0.1 };
  if (k === 1) return { kind: "temp", stat: STATS[i % 4], pct: 4 + (i % 4), seconds: 180 + (i % 4) * 60 };
  if (k === 2) return { kind: "coins", amount: 180 + (i % 6) * 30 };
  return { kind: "cosmetic" };
});

// ---------- +35 epic ----------
const EPIC_EXT_NAMES = [
  "Meister-Motorblock","Prototyp-Turbolader","Werksrenn-Fahrwerk","Prototype-ECU","Meister-Kupplungspaket",
  "Prototyp-Karbon-Chassis","Werksrenn-Getriebe","Meister-Nockenwellen-Set","Prototyp-Kraftstoff-System",
  "Werksrenn-Auspuffanlage","Meister-Bremsanlage","Prototyp-Doppelturbo","Werksrenn-Aerodynamikkit",
  "Meister-Getriebesatz","Prototyp-Zylinderkopf","Werksrenn-Kurbelwelle","Meister-Kolben-Set","Prototyp-Direkteinspritzung",
  "Werksrenn-Motorsteuerung","Meister-Fahrwerksdämpfer","Prototyp-Karbon-Aero","Werksrenn-Federung","Meister-Antriebswelle",
  "Prototyp-Elektromagnet-Kupplung","Werksrenn-Bremsscheiben-Kit","Meister-Getriebetunnel","Prototyp-Aero-Splitter",
  "Werksrenn-Kompressor","Meister-Motorhaube","Prototyp-Airbox","Werksrenn-Schaltmatrix","Meister-Nockenwellenrad",
  "Prototyp-Bremskolben","Werksrenn-Kupplungsscheibe","Meister-Fahrwerkskit",
];
const EPIC_EMOJIS = ["💎","💜","👑","🪨","🔮","🌈","🥋","💨","🅱️","🚀","🥇","🏆"];
const EPIC_EXT = gen("ex", "epic", EPIC_EXT_NAMES, EPIC_EMOJIS, (i) => {
  const k = i % 4;
  if (k === 0) return { kind: "perm", stat: STATS[i % 4], pct: 0.5 + (i % 3) * 0.15 };
  if (k === 1) return { kind: "temp", stat: STATS[i % 4], pct: 12 + (i % 5), seconds: 480 + (i % 3) * 120 };
  if (k === 2) return { kind: "coins", amount: 700 + (i % 5) * 100 };
  return { kind: "cosmetic" };
});

// ---------- +25 legendary ----------
const LEGENDARY_EXT_NAMES = [
  "Königs-Nockenwelle","Drachen-Kolben","Phönix-Auspuff","Titanen-Kurbelwelle","Ewige Kupplung","Aurum-Bremsanlage",
  "Rubin-Getriebe","Saphir-Zylinderkopf","Diamant-Krankshaft","Onyx-ECU","Meteor-Turbo","Vulkan-Auspuffkit",
  "Sturm-Reifensatz","Blitz-Fahrwerk","Nova-Airbox","Stern-Kompressor","Kristall-Antriebswelle","Legenden-Chassis",
  "Uralt-Motorblock","Königs-Bremsscheiben","Drachen-Turbo","Phönix-Getriebe","Legenden-Fahrwerk","Titan-Krone-Kit",
  "Meister-Championenkit",
];
const LEGENDARY_EMOJIS = ["⚡","🔱","❤️‍🔥","🌑","💰","🏆","👑","💎"];
const LEGENDARY_EXT = gen("lx", "legendary", LEGENDARY_EXT_NAMES, LEGENDARY_EMOJIS, (i) => {
  const k = i % 3;
  if (k === 0) return { kind: "perm", stat: STATS[i % 4], pct: 1.5 + (i % 4) * 0.5 };
  if (k === 1) return { kind: "temp", stat: STATS[i % 4], pct: 20 + (i % 5) * 3, seconds: 600 + (i % 4) * 120 };
  return { kind: "coins", amount: 4000 + (i % 5) * 500 };
});

// ---------- +30 mythical (NEU) ----------
const MYTHICAL_NAMES = [
  "Mythischer Sturmkolben","Nebel-Turbolader","Schatten-Fahrwerk","Mondrenn-Getriebe","Sonnen-Kupplung",
  "Sternen-Bremsanlage","Wind-Nockenwelle","Phantom-Auspuff","Traum-Chassis","Feuer-Airbox",
  "Eis-Kühlmittel","Sturm-Turbokit","Nebel-Reifensatz","Schatten-Motorsteuerung","Mondrenn-Kolben",
  "Sonnen-Aerokit","Sternen-Kurbelwelle","Wind-Zylinderkopf","Phantom-Kompressor","Traum-Bremskolben",
  "Feuer-Doppelkupplung","Eis-Doppelturbo","Sturm-Nockenwellenset","Nebel-Karbonchassis","Schatten-Kraftstoffpumpe",
  "Mondrenn-Airbox","Sonnen-Kolbenpin","Sternen-Fahrwerk","Wind-Schaltmatrix","Phantom-Krone",
];
const MYTHICAL_EMOJIS = ["🌪️","🌫️","🌑","🌕","☀️","⭐","🌬️","👻","💭","🔥","🧊","🌟"];
const MYTHICAL_EXT = gen("mx", "mythical", MYTHICAL_NAMES, MYTHICAL_EMOJIS, (i) => {
  const k = i % 3;
  if (k === 0) return { kind: "perm", stat: STATS[i % 4], pct: 3 + (i % 3) * 0.5 };
  if (k === 1) return { kind: "temp", stat: STATS[i % 4], pct: 25 + (i % 5) * 3, seconds: 900 + (i % 4) * 180 };
  return { kind: "coins", amount: 8000 + (i % 5) * 1000 };
});

// ---------- +25 cosmic (NEU) ----------
const COSMIC_NAMES = [
  "Kosmischer Kern","Galaxie-Turbolader","Nebula-Fahrwerk","Supernova-Getriebe","Quasar-Kupplung",
  "Pulsar-Bremsanlage","Meteor-Nockenwelle","Komet-Auspuff","Asteroid-Chassis","Blackhole-Airbox",
  "Sonnensystem-Reifensatz","Milchstraßen-Motor","Andromeda-Doppelturbo","Orion-Fahrwerkskit",
  "Antares-Kolben","Sirius-Kurbelwelle","Vega-Zylinderkopf","Rigel-Kompressor","Polaris-Bremskolben",
  "Aldebaran-Doppelkupplung","Capella-Kraftstoffsystem","Betelgeuse-Aerokit","Deneb-Nockenwellenset",
  "Arcturus-Karbonchassis","Antimaterie-Kernblock",
];
const COSMIC_EMOJIS = ["🌌","🪐","☄️","🌠","🌟","⚛️","🛸","🔭"];
const COSMIC_EXT = gen("cmx", "cosmic", COSMIC_NAMES, COSMIC_EMOJIS, (i) => {
  const k = i % 3;
  if (k === 0) return { kind: "perm", stat: STATS[i % 4], pct: 5 + (i % 3) };
  if (k === 1) return { kind: "temp", stat: STATS[i % 4], pct: 35 + (i % 5) * 4, seconds: 1200 + (i % 4) * 300 };
  return { kind: "coins", amount: 20000 + (i % 5) * 2500 };
});

// ---------- +15 celestial (NEU) ----------
const CELESTIAL_NAMES = [
  "Himmels-Zepter","Ur-Motor","Genesis-Chassis","Ewiger Turbolader","Zeitloses Getriebe",
  "Absoluter Kolben","Prima-Kurbelwelle","Alpha-Fahrwerk","Omega-Airbox","Infinitum-Auspuff",
  "Astralkraft-Kupplung","Divinum-Bremsanlage","Sanctum-Motorsteuerung","Aeon-Doppelturbo","Empyreum-Krone",
];
const CELESTIAL_EMOJIS = ["✨","🕊️","🌟","👼","☄️","💫","🌠"];
const CELESTIAL_EXT = gen("celx", "celestial", CELESTIAL_NAMES, CELESTIAL_EMOJIS, (i) => {
  const k = i % 3;
  if (k === 0) return { kind: "perm", stat: STATS[i % 4], pct: 8 + (i % 4) };
  if (k === 1) return { kind: "temp", stat: STATS[i % 4], pct: 50 + (i % 4) * 10, seconds: 1800 + (i % 3) * 600 };
  return { kind: "coins", amount: 75000 + (i % 4) * 15000 };
});

// ---------- +150 neue Sammelitems (6 Themen-Serien à 25) ----------
const AURORA_NAMES = Array.from({ length: 25 }, (_, i) => `Aurora ${["Fragment","Kristall","Splitter","Ring","Puls","Prisma","Schleier","Nebel","Funke","Aura","Welle","Kern","Staub","Feder","Bogen","Herz","Krone","Zunge","Schild","Flamme","Auge","Rune","Kelch","Schlange","Stein"][i]}`);
const AURORA = gen("aur", "epic", AURORA_NAMES, ["🌌","💚","💙","💜","✨"], (i) => {
  const k = i % 3;
  if (k === 0) return { kind: "perm", stat: STATS[i % 4], pct: 0.4 + (i % 3) * 0.1 };
  if (k === 1) return { kind: "temp", stat: STATS[i % 4], pct: 10 + (i % 5), seconds: 300 + (i % 4) * 60 };
  return { kind: "coins", amount: 500 + (i % 6) * 80 };
}, "Aurora-Serie: ");

const DEEPSEA_NAMES = Array.from({ length: 25 }, (_, i) => `Tiefsee-${["Perle","Koralle","Muschel","Schuppe","Zahn","Auge","Flosse","Anker","Netz","Kompass","Fossil","Ring","Kristall","Schatz","Kette","Amulett","Krug","Kelch","Amphore","Skarabäus","Runenstein","Sextant","Fernrohr","Steuerrad","Truhe"][i]}`);
const DEEPSEA = gen("dsea", "rare", DEEPSEA_NAMES, ["🐚","🪸","🐟","⚓","🧭","🔱","🦑","🐙"], (i) => {
  const k = i % 3;
  if (k === 0) return { kind: "perm", stat: STATS[i % 4], pct: 0.2 + (i % 3) * 0.1 };
  if (k === 1) return { kind: "temp", stat: STATS[i % 4], pct: 4 + (i % 4), seconds: 180 + (i % 4) * 60 };
  return { kind: "coins", amount: 200 + (i % 6) * 50 };
}, "Tiefsee-Serie: ");

const CHROME_NAMES = Array.from({ length: 25 }, (_, i) => `Chrom-${["Flügel","Feder","Schild","Klinge","Speer","Bogen","Ring","Krone","Herz","Auge","Zahn","Kralle","Griff","Kette","Anhänger","Hammer","Amboss","Zirkel","Schlüssel","Schloss","Rune","Sigill","Talisman","Stern","Kompass"][i]}`);
const CHROME = gen("chr", "uncommon", CHROME_NAMES, ["🪽","⚔️","🛡️","🔱","👑","💍","🗝️","⭐"], (i) => {
  const k = i % 4;
  if (k === 0) return { kind: "coins", amount: 60 + (i % 5) * 20 };
  if (k === 1) return { kind: "temp", stat: STATS[i % 4], pct: 3 + (i % 3), seconds: 60 + (i % 4) * 30 };
  if (k === 2) return { kind: "cosmetic" };
  return { kind: "perm", stat: STATS[i % 4], pct: 0.1 };
}, "Chrom-Serie: ");

const NEON_NAMES = Array.from({ length: 25 }, (_, i) => `Neon-${["Chip","Modul","Kern","Kabel","Widerstand","Diode","LED","Platine","Prozessor","Speicher","Kondensator","Spule","Transistor","Resonator","Emitter","Sensor","Antenne","Relais","Schalter","Display","Konsole","Terminal","Netzwerk","Server","Kristall"][i]}`);
const NEON = gen("neo", "epic", NEON_NAMES, ["💠","💻","🔌","⚡","🎮","📟","📡","🖥️"], (i) => {
  const k = i % 3;
  if (k === 0) return { kind: "perm", stat: STATS[i % 4], pct: 0.5 + (i % 3) * 0.15 };
  if (k === 1) return { kind: "temp", stat: STATS[i % 4], pct: 12 + (i % 5), seconds: 360 + (i % 4) * 60 };
  return { kind: "coins", amount: 700 + (i % 5) * 100 };
}, "Neon-Serie: ");

const VOLCANIC_NAMES = Array.from({ length: 25 }, (_, i) => `Vulkan-${["Ascheklumpen","Obsidian","Basaltbrocken","Lavatropfen","Feuerstein","Magmakern","Glutrune","Flammenring","Rauchsplitter","Kohlekristall","Schwefelstein","Feuerauge","Glutklaue","Lavaperle","Aschekern","Schlackenstück","Rissstein","Berserkerherz","Drachenzahn","Salamanderei","Vulkantropfen","Flammenschuppe","Glutfeder","Aschekrone","Lavatorc"][i]}`);
const VOLCANIC = gen("vol", "legendary", VOLCANIC_NAMES, ["🌋","🔥","🪨","🖤","⚫","🟥","♨️"], (i) => {
  const k = i % 3;
  if (k === 0) return { kind: "perm", stat: STATS[i % 4], pct: 1.5 + (i % 3) * 0.4 };
  if (k === 1) return { kind: "temp", stat: STATS[i % 4], pct: 20 + (i % 5) * 3, seconds: 600 + (i % 4) * 120 };
  return { kind: "coins", amount: 4500 + (i % 5) * 500 };
}, "Vulkan-Serie: ");

const STORM_NAMES = Array.from({ length: 25 }, (_, i) => `Sturm-${["Blitz","Donner","Wolke","Regen","Hagel","Wind","Auge","Tornado","Wirbel","Kraft","Puls","Welle","Bogen","Zorn","Ruf","Faust","Herz","Klaue","Zahn","Krone","Speer","Klinge","Schild","Ring","Kern"][i]}`);
const STORM = gen("sto", "mythical", STORM_NAMES, ["⛈️","🌩️","⚡","🌪️","💨","☁️","🌀"], (i) => {
  const k = i % 3;
  if (k === 0) return { kind: "perm", stat: STATS[i % 4], pct: 3 + (i % 3) * 0.7 };
  if (k === 1) return { kind: "temp", stat: STATS[i % 4], pct: 25 + (i % 5) * 4, seconds: 900 + (i % 4) * 180 };
  return { kind: "coins", amount: 9000 + (i % 5) * 1200 };
}, "Sturm-Serie: ");

export const COLLECTIBLES: Collectible[] = [
  ...COMMON, ...COMMON_EXT,
  ...UNCOMMON, ...UNCOMMON_EXT,
  ...RARE, ...RARE_EXT,
  ...EPIC, ...EPIC_EXT,
  ...LEGENDARY, ...LEGENDARY_EXT,
  ...MYTHICAL_EXT,
  ...COSMIC_EXT,
  ...CELESTIAL_EXT,
  ...AURORA, ...DEEPSEA, ...CHROME, ...NEON, ...VOLCANIC, ...STORM,
];
export const COLLECTIBLES_BY_ID: Record<string, Collectible> = Object.fromEntries(COLLECTIBLES.map((c) => [c.id, c]));
export const TOTAL_COUNT = COLLECTIBLES.length;

// ============================================================
//  Pakete
// ============================================================
export type PackType = "starter" | "standard" | "deluxe" | "mythic" | "ultra" | "celestial";

export const PACK_META: Record<PackType, { label: string; emoji: string; color: string; size: number; desc: string }> = {
  starter:   { label: "Starter-Paket",    emoji: "📦", color: "#9ca3af", size: 3,  desc: "Kleine Kiste mit 3 Items." },
  standard:  { label: "Standard-Kiste",   emoji: "🎁", color: "#4ade80", size: 5,  desc: "5 Items, oft ungewöhnlich." },
  deluxe:    { label: "Deluxe-Truhe",     emoji: "🧰", color: "#c084fc", size: 8,  desc: "8 Items, garantiert selten." },
  mythic:    { label: "Mythische Kiste",  emoji: "🌟", color: "#f6d96a", size: 12, desc: "12 Items, garantiert episch." },
  ultra:     { label: "Ultra-Tresor",     emoji: "💠", color: "#ff6ec7", size: 18, desc: "18 Items, garantiert mythisch, kosmisch möglich." },
  celestial: { label: "Himmels-Reliquiar",emoji: "🌠", color: "#00f0ff", size: 25, desc: "25 Items, garantiert kosmisch, himmlisch möglich." },
};

const WEIGHTS: Record<PackType, Record<Rarity, number>> = {
  starter:   { common: 75, uncommon: 22, rare: 3,  epic: 0,  legendary: 0, mythical: 0, cosmic: 0, celestial: 0 },
  standard:  { common: 45, uncommon: 40, rare: 13, epic: 2,  legendary: 0, mythical: 0, cosmic: 0, celestial: 0 },
  deluxe:    { common: 20, uncommon: 40, rare: 30, epic: 9,  legendary: 1, mythical: 0, cosmic: 0, celestial: 0 },
  mythic:    { common: 5,  uncommon: 20, rare: 40, epic: 27, legendary: 6, mythical: 2, cosmic: 0, celestial: 0 },
  ultra:     { common: 0,  uncommon: 8,  rare: 25, epic: 35, legendary: 20,mythical: 10,cosmic: 2, celestial: 0 },
  celestial: { common: 0,  uncommon: 0,  rare: 10, epic: 25, legendary: 25,mythical: 22,cosmic: 15,celestial: 3 },
};

const GUARANTEES: Record<PackType, Rarity | null> = {
  starter: null,
  standard: null,
  deluxe: "rare",
  mythic: "epic",
  ultra: "mythical",
  celestial: "cosmic",
};

const BY_RARITY: Record<Rarity, Collectible[]> = {
  common:    COLLECTIBLES.filter((c) => c.rarity === "common"),
  uncommon:  COLLECTIBLES.filter((c) => c.rarity === "uncommon"),
  rare:      COLLECTIBLES.filter((c) => c.rarity === "rare"),
  epic:      COLLECTIBLES.filter((c) => c.rarity === "epic"),
  legendary: COLLECTIBLES.filter((c) => c.rarity === "legendary"),
  mythical:  COLLECTIBLES.filter((c) => c.rarity === "mythical"),
  cosmic:    COLLECTIBLES.filter((c) => c.rarity === "cosmic"),
  celestial: COLLECTIBLES.filter((c) => c.rarity === "celestial"),
};

function pickRarity(pack: PackType): Rarity {
  const w = WEIGHTS[pack];
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [rar, weight] of Object.entries(w) as [Rarity, number][]) {
    r -= weight;
    if (r <= 0) return rar;
  }
  return "common";
}

function pickItem(rarity: Rarity): Collectible {
  const pool = BY_RARITY[rarity];
  if (pool.length === 0) return BY_RARITY.common[0];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function rollPack(pack: PackType): Collectible[] {
  const size = PACK_META[pack].size;
  const items: Collectible[] = [];
  const guarantee = GUARANTEES[pack];
  if (guarantee) items.push(pickItem(guarantee));
  while (items.length < size) items.push(pickItem(pickRarity(pack)));
  return items;
}

export function rollWorldPackType(): PackType {
  const r = Math.random();
  if (r < 0.60) return "starter";
  if (r < 0.82) return "standard";
  if (r < 0.93) return "deluxe";
  if (r < 0.98) return "mythic";
  if (r < 0.997) return "ultra";
  return "celestial";
}

export const PACK_TYPES: PackType[] = ["starter", "standard", "deluxe", "mythic", "ultra", "celestial"];
