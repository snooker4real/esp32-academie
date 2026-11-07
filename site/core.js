const STATUS = { todo: "À faire", doing: "En cours", done: "Fait" };
const DOC_SECTIONS = [
  ["manuals", "Manuels et guides"],
  ["parts", "Liste des pièces du kit"],
  ["pinouts", "Pinouts ESP32"],
  ["datasheets", "Datasheets des composants"],
  ["drivers", "Drivers CH340 (USB-série)"],
];
const VIEWS = {
  "": { title: "Accueil", label: "Accueil", icon: "home", art: "accueil" },
  chapitres: { title: "Chapitres", label: "Chapitres", icon: "list", art: "chapitres" },
  arene: { title: "Arène", label: "Arène", icon: "sword", art: "arene" },
  projets: { title: "Projets libres", label: "Projets", icon: "bulb", art: "projets" },
  panier: { title: "Panier de l'atelier", label: "Panier", icon: "cart", art: "panier", more: true },
  broches: { title: "Broches", label: "Broches", icon: "plug", art: "broches", more: true },
  succes: { title: "Succès", label: "Succès", icon: "trophy", art: "succes", more: true },
  docs: { title: "Documentation Freenove", label: "Docs", icon: "book", art: "docs", more: true },
};
const LEVELS = { ok: "Libre", warn: "À surveiller", bad: "Interdite" };

const ICONS = {
  cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 7H6"/>',
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 4.5v17"/>',
  bulb: '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z"/>',
  plug: '<path d="M9 2v6M15 2v6"/><path d="M7 8h10v4a5 5 0 0 1-10 0z"/><path d="M12 17v5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/>',
  chip: '<rect x="8" y="8" width="8" height="8" rx="1.5"/><path d="M4 9h4M4 15h4M16 9h4M16 15h4M9 4v4M15 4v4M9 16v4M15 16v4"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  code: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>',
  file: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  flame: '<path d="M12 22c4 0 7-2.8 7-7 0-3-2-5-3-7-.5 2-2 3-3 3 0-3-1-6-4-9-1 4-4 6-4 12 0 4 3 8 7 8z"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  sword: '<path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/>',
  heart: '<path d="M12 21s-7-4.6-9.3-9A5.3 5.3 0 0 1 12 6.2 5.3 5.3 0 0 1 21.3 12c-2.3 4.4-9.3 9-9.3 9z"/>',
  zap: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  volume: '<path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>',
  mute: '<path d="M11 5L6 9H3v6h3l5 4z"/><path d="M16 9l5 6M21 9l-5 6"/>',
  dots: '<circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7"/><path d="M12 17h.01"/>',
};

const state = {
  chapters: [], progress: {}, extra: emptyExtra(), content: { chapters: {}, projects: [], pins: {}, board: {}, worlds: [] },
  docs: null, filter: "all", q: "", entered: false, gpio: null,
};

function emptyExtra() {
  return { notes: {}, dates: {}, parts: {}, bonus: {}, quiz: {}, projects: {}, activity: [], rhythm: {}, daily: {}, play: { boss: {}, survival: 0 } };
}

const icon = (name, cls = "") =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
// illustrations générées dans Flow (dossier icons/), pour la barre latérale et les grands pictogrammes
const art = (name, cls = "art") => `<img class="${cls}" src="/icons/${name}.webp" alt="" width="96" height="96" decoding="async">`;

function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === "class") el.className = v;
    else if (k === "html") el.innerHTML = v;
    else if (k.startsWith("on")) el[k] = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false) el.append(kid);
  return el;
}

const pad = n => String(n).padStart(2, "0");
const statusOf = num => state.progress[num] || "todo";
const projectStatus = id => state.extra.projects[id] || "todo";
const chapterContent = num => state.content.chapters[num] || {};
const chapterTitle = num => state.chapters.find(c => c.num === num)?.title || "";
const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const post = (url, body) =>
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const frDate = iso => new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

function counts() {
  const c = { todo: 0, doing: 0, done: 0 };
  for (const ch of state.chapters) c[statusOf(ch.num)]++;
  return c;
}

function nextChapter() {
  return (
    state.chapters.find(c => statusOf(c.num) === "doing") ||
    state.chapters.find(c => statusOf(c.num) === "todo") ||
    null
  );
}

function matches(ch) {
  if (state.filter !== "all" && statusOf(ch.num) !== state.filter) return false;
  if (!state.q) return true;
  return norm(`ch${ch.num} ${ch.num} ${ch.title} ${ch.note || ""}`).includes(norm(state.q));
}

const missing = p => p.requires.filter(n => statusOf(n) !== "done");
