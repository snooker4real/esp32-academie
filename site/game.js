/* ---------- jeu : XP, niveaux, mondes, quêtes, badges, quiz ----------
   Tout est recalculé depuis la progression et extra.json (compteurs du jour, records) :
   rien de plus à stocker ni à synchroniser. Ce fichier est chargé avant core.js, home.js… (l'ancien app.js) et n'utilise
   ses fonctions (h, icon, state, show…) qu'au moment de l'affichage. */

const RANKS = [
  [0, "Électron libre"], [150, "Résistance"], [400, "LED allumée"], [800, "Condensateur"], [1400, "Transistor"],
  [2200, "Capteur"], [3300, "Microcontrôleur"], [4800, "Connecté"], [6800, "Ingénieur"], [9000, "Maître de l'ESP32"],
  [12500, "Légende de l'ESP32"],
];

const BOSS_XP = 300;
const SURVIVAL_XP = 10;
const PERFECT_DAY_XP = 30;
const BOSS_HITS = 7;
const TIER_XP = [50, 75, 100];

const BADGES = [
  { id: "first", title: "Premier clignotement", hint: "Termine ton premier chapitre", key: "done", need: 1 },
  { id: "five", title: "Cinq chapitres", hint: "Termine 5 chapitres", key: "done", need: 5 },
  { id: "ten", title: "Dix chapitres", hint: "Termine 10 chapitres", key: "done", need: 10 },
  { id: "half", title: "Mi-parcours", hint: "Termine 18 chapitres", key: "done", need: 18 },
  { id: "most", title: "Trois quarts", hint: "Termine 27 chapitres", key: "done", need: 27 },
  { id: "all", title: "Kit terminé", hint: "Termine les 36 chapitres", key: "done", need: 36 },
  { id: "streak3", title: "Trois jours d'affilée", hint: "Avance 3 jours de suite", key: "streak", need: 3 },
  { id: "streak7", title: "Une semaine d'affilée", hint: "Avance 7 jours de suite", key: "streak", need: 7 },
  { id: "perfect1", title: "Sans faute", hint: "Réussis un quiz à 100%", key: "perfect", need: 1 },
  { id: "perfect5", title: "Cinq quiz parfaits", hint: "Réussis 5 quiz à 100%", key: "perfect", need: 5 },
  { id: "bonus1", title: "Premier défi", hint: "Réussis un défi bonus", key: "bonus", need: 1 },
  { id: "bonus5", title: "Chasseur de défis", hint: "Réussis 5 défis bonus", key: "bonus", need: 5 },
  { id: "notes5", title: "Carnet de bord", hint: "Écris des notes dans 5 chapitres", key: "notes", need: 5 },
  { id: "built1", title: "Premier projet libre", hint: "Termine un projet libre", key: "built", need: 1 },
  { id: "built3", title: "Inventeur", hint: "Termine 3 projets libres", key: "built", need: 3 },
  { id: "boss1", title: "Premier boss", hint: "Bats un boss de monde", key: "boss", need: 1 },
  { id: "boss3", title: "Chasseur de boss", hint: "Bats 3 boss de monde", key: "boss", need: 3 },
  { id: "boss6", title: "Maître des mondes", hint: "Bats les 6 boss de monde", key: "boss", need: 6 },
  { id: "stars30", title: "Trente étoiles", hint: "Gagne 30 étoiles de chapitre", key: "stars", need: 30 },
  { id: "stars108", title: "Toutes les étoiles", hint: "Gagne les 108 étoiles de chapitre", key: "stars", need: 108 },
  { id: "survie10", title: "Survivant", hint: "Tiens 10 questions d'affilée en mode survie", key: "survival", need: 10 },
  { id: "quests7", title: "Quêteur", hint: "Termine 7 quêtes", key: "quests", need: 7 },
  { id: "quests30", title: "Aventurier", hint: "Termine 30 quêtes", key: "quests", need: 30 },
];

/* quêtes : le tirage ne dépend que de la date, pour que l'XP passée reste la même à chaque calcul */
const DAILY_QUIZ = { id: "daily", title: "Fais le quiz du jour", key: "daily", need: 1, xp: 30, icon: "zap" };
const QUEST_POOL = [
  { id: "quiz", title: "Termine un quiz de chapitre", key: "quiz", need: 1, xp: 30, icon: "help" },
  { id: "review", title: "Fais une séance de révision", key: "review", need: 1, xp: 25, icon: "repeat" },
  { id: "correct", title: "Donne 8 bonnes réponses", key: "correct", need: 8, xp: 30, icon: "check" },
  { id: "note", title: "Écris une note de chapitre", key: "note", need: 1, xp: 20, icon: "file" },
  { id: "chapter", title: "Termine un chapitre", key: "chapter", need: 1, xp: 50, icon: "chip" },
  { id: "bonus", title: "Relève un défi bonus", key: "bonus", need: 1, xp: 40, icon: "star" },
  { id: "survival", title: "Tente une partie de survie", key: "survival", need: 1, xp: 25, icon: "heart" },
  { id: "parts", title: "Sors 4 pièces de la boîte", key: "parts", need: 4, xp: 15, icon: "plug" },
];
const WEEKLY = [
  { id: "w-chapters", title: "Termine 2 chapitres", key: "chapter", need: 2, xp: 100, icon: "chip" },
  { id: "w-correct", title: "Donne 20 bonnes réponses", key: "correct", need: 20, xp: 80, icon: "check" },
  { id: "w-days", title: "Sois actif 4 jours", key: "days", need: 4, xp: 60, icon: "flame" },
];

/* ---------- petits outils ---------- */

const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const today = () => state.extra.today ?? ymd(new Date()); // le jour du serveur : même décompte que ses compteurs
const dayAt = (iso, shift = 0) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + shift); return d; };
const weekStart = iso => ymd(dayAt(iso, -((dayAt(iso).getDay() + 6) % 7)));

function seeded(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  h = Math.imul(h ^ (h >>> 16), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909);
  let a = h ^ (h >>> 16);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(list, rnd = Math.random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function longestStreak(days) {
  const set = new Set(days);
  let best = 0;
  for (const day of set) {
    if (set.has(ymd(dayAt(day, -1)))) continue;
    let n = 0;
    while (set.has(ymd(dayAt(day, n)))) n++;
    best = Math.max(best, n);
  }
  return best;
}

/* ---------- mondes, étoiles, difficulté ---------- */

function worldStates() {
  const beaten = state.extra.play?.boss || {};
  return state.content.worlds.map(w => {
    const done = w.chapters.filter(n => statusOf(n) === "done").length;
    return { ...w, done, total: w.chapters.length, open: done === w.chapters.length, beaten: !!beaten[w.id] };
  });
}

const tierOf = num => (num <= 12 ? 1 : num <= 24 ? 2 : 3);
const challengeXp = num => TIER_XP[tierOf(num) - 1];

function starsOf(num) {
  const q = state.extra.quiz[num];
  return [statusOf(num) === "done", !!q && q.score === q.total, !!state.extra.bonus[num]];
}

/* ---------- quêtes ---------- */

const countOf = (day, key) => state.extra.daily?.[day]?.[key] || 0;
const questsFor = day => [DAILY_QUIZ, ...shuffled(QUEST_POOL, seeded(`quests-${day}`)).slice(0, 2)];
const questState = (q, count) => ({ ...q, have: Math.min(count, q.need), done: count >= q.need });
const dailyQuests = day => questsFor(day).map(q => questState(q, countOf(day, q.key)));

function weekCount(start, key) {
  let n = 0;
  for (let i = 0; i < 7; i++) {
    const d = ymd(dayAt(start, i));
    n += key === "days" ? Number(state.extra.activity.includes(d)) : countOf(d, key);
  }
  return n;
}
const weeklyQuests = start => WEEKLY.map(q => questState(q, weekCount(start, q.key)));

function questTotals() {
  let xp = 0, done = 0;
  for (const day of Object.keys(state.extra.daily || {})) {
    const qs = dailyQuests(day).filter(q => q.done);
    done += qs.length;
    xp += qs.reduce((s, q) => s + q.xp, 0) + (qs.length === 3 ? PERFECT_DAY_XP : 0);
  }
  const weeks = new Set([...Object.keys(state.extra.daily || {}), ...state.extra.activity].map(weekStart));
  for (const w of weeks) for (const q of weeklyQuests(w)) if (q.done) { done++; xp += q.xp; }
  return { xp, done };
}

/* ---------- XP, niveaux, badges ---------- */

function game() {
  const x = state.extra;
  const quiz = Object.values(x.quiz);
  const built = state.content.projects.filter(p => projectStatus(p.id) === "done");
  const worlds = worldStates();
  const qt = questTotals();
  const bonusNums = Object.keys(x.bonus).map(Number);
  const stats = {
    done: counts().done,
    streak: longestStreak(x.activity),
    perfect: quiz.filter(q => q.score === q.total).length,
    bonus: bonusNums.length,
    notes: Object.keys(x.notes).length,
    built: built.length,
    stars: state.chapters.reduce((s, c) => s + starsOf(c.num).filter(Boolean).length, 0),
    boss: worlds.filter(w => w.beaten).length,
    survival: x.play?.survival || 0,
    quests: qt.done,
  };
  const sources = [
    ["Chapitres terminés", stats.done * 100, "100 XP par chapitre"],
    ["Quiz", quiz.reduce((s, q) => s + q.score, 0) * 20, "20 XP par bonne réponse (meilleur score)"],
    ["Défis bonus", bonusNums.reduce((s, n) => s + challengeXp(n), 0), "50, 75 ou 100 XP selon la difficulté"],
    ["Notes", stats.notes * 10, "10 XP par chapitre annoté"],
    ["Projets libres", built.reduce((s, p) => s + 150 * p.level, 0), "150 XP par niveau de projet"],
    ["Boss de monde", stats.boss * BOSS_XP, `${BOSS_XP} XP par boss vaincu`],
    ["Survie", stats.survival * SURVIVAL_XP, `${SURVIVAL_XP} XP par point du record`],
    ["Quêtes", qt.xp, "quêtes du jour et de la semaine"],
  ];
  const xp = sources.reduce((s, r) => s + r[1], 0);
  const rank = RANKS.findLastIndex(([min]) => xp >= min);
  const [floor] = RANKS[rank];
  const ceil = RANKS[rank + 1]?.[0];
  const badges = BADGES.map(b => ({ ...b, have: Math.min(stats[b.key], b.need), earned: stats[b.key] >= b.need }));
  return { xp, rank, name: RANKS[rank][1], floor, ceil, pct: ceil ? (xp - floor) / (ceil - floor) : 1, sources, badges, stats, worlds };
}

/* ce qui a changé entre deux états du jeu : XP, niveau, badges, mondes, boss */
function reward(before, after) {
  const parts = [];
  const items = [];
  const gain = after.xp - before.xp;
  if (gain > 0) parts.push(`+${gain} XP`);
  if (after.rank > before.rank) {
    parts.push(`Niveau ${after.rank + 1} : ${after.name} !`);
    items.push({ kind: "rank", kicker: "Niveau supérieur", title: `Niveau ${after.rank + 1}`, sub: after.name, n: after.rank + 1 });
  }
  after.worlds.forEach((w, i) => {
    if (w.open && !before.worlds[i].open) {
      parts.push(`Monde ${w.id} terminé`);
      items.push({ kind: "world", kicker: "Monde terminé", title: w.title, sub: `${w.boss.name} t'attend dans l'Arène.`, world: w });
    }
    if (w.beaten && !before.worlds[i].beaten) {
      parts.push(`Boss « ${w.boss.name} » vaincu`);
      items.push({ kind: "boss", kicker: "Boss vaincu", title: w.boss.name, sub: `+${BOSS_XP} XP`, world: w });
    }
  });
  const won = after.badges.filter((b, i) => b.earned && !before.badges[i].earned);
  for (const b of won) {
    parts.push(`Badge « ${b.title} »`);
    items.push({ kind: "badge", kicker: "Nouveau badge", title: b.title, sub: b.hint, badge: b });
  }
  return { text: parts.join(" · "), win: items.length > 0, badge: won.at(-1), items, gain };
}

function announce(r, base = "") {
  toast([base, r.text].filter(Boolean).join(" "), r.win, r.badge);
  if (r.items.length) setTimeout(() => celebrate(r.items), 700);
}

/* ---------- images ---------- */

const badgeImg = b => h("img", { class: "badge-img", src: `/badges/${b.id}.webp`, alt: "", width: 320, height: 320, loading: "lazy" });
const bossImg = (w, cls = "") => h("img", { class: `boss-img ${cls}`, src: `/badges/boss-${w.id}.webp`, alt: "", width: 560, height: 560, loading: "lazy" });

function starsRow(num) {
  const have = starsOf(num);
  const label = ["Terminé", "Quiz parfait", "Défi réussi"].filter((_, i) => have[i]).join(", ") || "Aucune étoile";
  return h("span", { class: "stars", role: "img", "aria-label": `${have.filter(Boolean).length} étoile sur 3 : ${label}`, title: `${label}. Étoiles : terminé, quiz parfait, défi réussi.` },
    have.map(on => h("i", { class: on ? "on" : "", html: icon("star", "icon--sm") })));
}

/* ---------- effets : sons, confettis, fenêtre de récompense ---------- */

let audio;
const soundOn = () => { try { return localStorage.getItem("esp32-sound") !== "off"; } catch { return true; } };
const setSound = on => { try { localStorage.setItem("esp32-sound", on ? "on" : "off"); } catch {} };

function sfx(kind) {
  if (!soundOn()) return;
  const tunes = {
    ok: [[660, .09], [880, .13]], bad: [[220, .15], [160, .22]], win: [[523, .1], [659, .1], [784, .1], [1047, .24]],
    level: [[392, .1], [523, .1], [659, .1], [784, .1], [1047, .1], [1319, .32]], lose: [[330, .16], [262, .16], [196, .3]],
  };
  try {
    audio ||= new AudioContext();
    let t = audio.currentTime;
    for (const [freq, len] of tunes[kind]) {
      const osc = audio.createOscillator(), gain = audio.createGain();
      osc.type = kind === "bad" || kind === "lose" ? "sawtooth" : "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(.0001, t);
      gain.gain.exponentialRampToValueAtTime(.1, t + .015);
      gain.gain.exponentialRampToValueAtTime(.0001, t + len);
      osc.connect(gain).connect(audio.destination);
      osc.start(t); osc.stop(t + len + .02);
      t += len * .9;
    }
  } catch { /* pas d'audio : le jeu continue en silence */ }
}

function confetti(count = 130) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let cv = document.getElementById("fx");
  if (!cv) { cv = h("canvas", { id: "fx", popover: "manual", "aria-hidden": "true" }); document.body.append(cv); }
  // le popover remonte le canevas au-dessus des fenêtres modales déjà ouvertes
  try { cv.hidePopover(); cv.showPopover(); } catch { /* navigateur sans popover */ }
  const dpr = devicePixelRatio || 1;
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  const ctx = cv.getContext("2d");
  const colors = ["#f0b94a", "#62d6a0", "#3fbf9d", "#ff6fae", "#8cc8ff", "#ffffff"];
  const bits = Array.from({ length: count }, () => ({
    x: innerWidth / 2 + (Math.random() - .5) * 120, y: innerHeight * .55,
    vx: (Math.random() - .5) * 15, vy: -Math.random() * 15 - 5,
    w: 6 + Math.random() * 6, h: 3 + Math.random() * 5, r: Math.random() * 6, vr: (Math.random() - .5) * .4,
    c: colors[Math.floor(Math.random() * colors.length)],
  }));
  const t0 = performance.now();
  (function frame(now) {
    const age = now - t0;
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (const b of bits) {
      b.vy += .38; b.x += b.vx; b.y += b.vy; b.r += b.vr; b.vx *= .992;
      ctx.save();
      ctx.translate(b.x * dpr, b.y * dpr); ctx.rotate(b.r);
      ctx.globalAlpha = Math.max(0, 1 - age / 2600);
      ctx.fillStyle = b.c; ctx.fillRect(-b.w * dpr / 2, -b.h * dpr / 2, b.w * dpr, b.h * dpr);
      ctx.restore();
    }
    if (age < 2600) requestAnimationFrame(frame);
    else { ctx.clearRect(0, 0, cv.width, cv.height); try { cv.hidePopover(); } catch {} }
  })(t0);
}

function celebrate(items) {
  const dlg = document.getElementById("celebrate");
  const queue = [...items];
  const next = () => {
    const it = queue.shift();
    if (!it) { dlg.close(); return; }
    const art = it.kind === "badge" ? badgeImg(it.badge)
      : it.world ? bossImg(it.world)
      : h("div", { class: "cele__lvl" }, String(it.n));
    dlg.replaceChildren(h("div", { class: `cele cele--${it.kind}` },
      h("div", { class: "cele__art" }, art),
      h("p", { class: "cele__kind" }, it.kicker),
      h("h2", { id: "cele-title" }, it.title),
      h("p", { class: "cele__sub" }, it.sub),
      h("button", { class: "btn btn--primary", type: "button", onclick: next }, queue.length ? "Suivant" : "Continuer")));
    if (!dlg.open) dlg.showModal();
    sfx(it.kind === "rank" ? "level" : "win");
    confetti(it.kind === "rank" ? 190 : 130);
    dlg.querySelector("button").focus();
  };
  next();
}

/* ---------- en-tête, accueil ---------- */

const xpBar = g => h("div", { class: "meter meter--xp", role: "img", "aria-label": `${Math.round(g.pct * 100)}% du niveau` },
  h("div", { class: "meter__fill", style: `width:${Math.round(g.pct * 100)}%` }));

const fmt = n => n.toLocaleString("fr-FR");

let lastXp = null;
function paintXp() {
  const g = game();
  const streak = state.extra.rhythm?.streak || 0;
  const el = document.getElementById("xp");
  el.replaceChildren(
    h("span", { class: `xp__streak${streak ? " on" : ""}`, title: streak ? `${streak} jour${streak > 1 ? "s" : ""} d'affilée` : "Pas de série en cours", html: `${icon("flame", "icon--sm")}${streak}` }),
    h("span", { class: "xp__lvl" }, `Niv. ${g.rank + 1}`),
    h("span", { class: "xp__bar" }, h("i", { style: `width:${Math.round(g.pct * 100)}%` })),
    h("span", { class: "xp__n" }, `${fmt(g.xp)} XP`),
  );
  el.setAttribute("aria-label", `Niveau ${g.rank + 1}, ${g.name}, ${g.xp} XP, série de ${streak} jours. Voir les succès.`);
  if (lastXp !== null && g.xp > lastXp) { el.classList.remove("xp--gain"); void el.offsetWidth; el.classList.add("xp--gain"); }
  lastXp = g.xp;
}

function levelCard() {
  const g = game();
  const next = g.badges.filter(b => !b.earned).sort((a, b) => b.have / b.need - a.have / a.need).slice(0, 2);
  return h("section", { class: "card card--level glass" },
    h("div", { class: "lvl" },
      h("div", { class: "lvl__n" }, String(g.rank + 1)),
      h("div", { class: "lvl__body" },
        h("h3", {}, g.name),
        h("p", { class: "card__sub" }, g.ceil
          ? `${fmt(g.xp)} XP. Encore ${fmt(g.ceil - g.xp)} pour « ${RANKS[g.rank + 1][1]} ».`
          : `${fmt(g.xp)} XP. Niveau maximum atteint.`),
        xpBar(g)),
    ),
    h("div", { class: "goals" },
      h("h4", {}, "Prochains badges"),
      next.length
        ? next.map(b => h("div", { class: "goal" },
            h("span", { class: "goal__ico" }, badgeImg(b)),
            h("span", { class: "goal__t" }, h("strong", {}, b.title), h("small", {}, `${b.hint} (${b.have}/${b.need})`))))
        : h("p", { class: "card__sub" }, "Tous les badges sont gagnés."),
      h("a", { class: "textlink", href: "#/succes" }, "Tous les succès"),
    ),
  );
}

function questRow(q, extra = "") {
  return h("li", { class: `quest${q.done ? " quest--done" : ""}` },
    h("span", { class: "quest__ico", html: icon(q.done ? "check" : q.icon, "icon--sm") }),
    h("div", { class: "quest__t" },
      h("strong", {}, q.title),
      h("div", { class: "meter", role: "img", "aria-label": `${q.have} sur ${q.need}` }, h("div", { class: "meter__fill", style: `width:${Math.round(100 * q.have / q.need)}%` }))),
    h("span", { class: "quest__xp" }, `${q.have}/${q.need}`, h("b", {}, `+${q.xp} XP${extra}`)));
}

function questsCard() {
  const qs = dailyQuests(today());
  const all = qs.every(q => q.done);
  return h("section", { class: "card card--quests glass" },
    h("h3", {}, "Quêtes du jour"),
    h("p", { class: "card__sub" }, all ? `Journée parfaite : +${PERFECT_DAY_XP} XP gagnés en bonus.` : `Termine les trois : +${PERFECT_DAY_XP} XP de bonus.`),
    h("ul", { class: "quests" }, qs.map(q => questRow(q))),
    h("a", { class: "textlink", href: "#/arene" }, "Ouvrir l'Arène"));
}

function bossButton(w) {
  if (!w.open) {
    const left = w.total - w.done;
    return h("button", { class: "btn", type: "button", disabled: true }, `Boss verrouillé : ${left} chapitre${left > 1 ? "s" : ""} à finir`);
  }
  return h("button", { class: `btn${w.beaten ? "" : " btn--primary"}`, type: "button", onclick: () => startBoss(w) },
    w.beaten ? "Revanche" : `Affronter ${w.boss.name}`);
}

const worldStars = w => w.chapters.reduce((s, n) => s + starsOf(n).filter(Boolean).length, 0);

function worldHead(w) {
  return h("section", { class: `world glass${w.open ? "" : " world--locked"}`, style: `--hue:${w.hue}` },
    h("div", { class: "world__art" }, bossImg(w)),
    h("div", { class: "world__body" },
      h("h3", {}, `Monde ${w.id} · ${w.title}`),
      h("p", { class: "card__sub" }, w.beaten ? `Boss vaincu : ${w.boss.name}.` : w.tagline),
      h("div", { class: "meter", role: "img", "aria-label": `${w.done} chapitres sur ${w.total}` }, h("div", { class: "meter__fill", style: `width:${Math.round(100 * w.done / w.total)}%` })),
      h("div", { class: "world__foot" },
        h("span", { class: "badge" }, `${w.done}/${w.total} chapitres`),
        h("span", { class: "badge" }, `${worldStars(w)}/${w.total * 3} étoiles`),
        bossButton(w))));
}

function worldCard() {
  const ws = worldStates();
  const w = ws.find(x => !x.beaten) || ws.at(-1);
  return h("section", { class: "card card--world glass" }, worldHead(w));
}

/* ---------- Arène ---------- */

const ui = { challenge: "todo", open: null };

function questsPanel() {
  const day = today();
  const week = weekStart(day);
  const qs = dailyQuests(day);
  return h("section", { class: "card glass" },
    h("div", { class: "arena__cols" },
      h("div", {},
        h("h3", {}, "Quêtes du jour"),
        h("p", { class: "card__sub" }, `Elles changent chaque jour. Les trois terminées rapportent +${PERFECT_DAY_XP} XP de plus.`),
        h("ul", { class: "quests" }, qs.map(q => questRow(q)))),
      h("div", {},
        h("h3", {}, "Quêtes de la semaine"),
        h("p", { class: "card__sub" }, "Du lundi au dimanche."),
        h("ul", { class: "quests" }, weeklyQuests(week).map(q => questRow(q))))));
}

const doneNums = () => state.chapters.filter(c => statusOf(c.num) === "done").map(c => c.num);
const questionsOf = nums => nums.flatMap(n => (chapterContent(n).quiz || []).map(q => ({ ...q, from: n })));

function modeTile({ img, title, text, meta, label, onclick, disabled }) {
  return h("article", { class: "mode glass" },
    h("span", { class: "mode__ico", html: art(img, "art") }),
    h("h4", {}, title),
    h("p", {}, text),
    h("small", {}, meta),
    h("button", { class: "btn btn--primary", type: "button", disabled, onclick }, label));
}

function modesPanel() {
  const pool = questionsOf(doneNums()).length;
  const locked = pool === 0 ? "Termine un chapitre pour débloquer ce mode." : null;
  const dailyDone = countOf(today(), "daily") > 0;
  return h("section", { class: "card glass" },
    h("h3", {}, "Modes de jeu"),
    h("p", { class: "card__sub" }, "Les questions viennent des chapitres que tu as terminés."),
    h("div", { class: "modes" },
      modeTile({ img: "quiz", title: "Quiz du jour", text: "Trois questions, les mêmes toute la journée.", meta: dailyDone ? "Fait aujourd'hui, quête validée." : `Quête : +${DAILY_QUIZ.xp} XP`, label: dailyDone ? "Rejouer" : "Jouer", onclick: startDaily, disabled: !pool }),
      modeTile({ img: "revision", title: "Révision", text: "Cinq questions. Les chapitres où tu as fait des fautes reviennent plus souvent.", meta: locked || "Compte pour la quête de révision.", label: "Réviser", onclick: startReview, disabled: !pool }),
      modeTile({ img: "survie", title: "Survie", text: "Trois vies, une question après l'autre. Combien de suite sans te tromper ?", meta: locked || `Record : ${state.extra.play?.survival || 0}. ${SURVIVAL_XP} XP par point de record.`, label: "Tenter ma chance", onclick: startSurvival, disabled: !pool })));
}

function bossPanel() {
  const ws = worldStates();
  return h("section", { class: "card glass" },
    h("h3", {}, "Les boss"),
    h("p", { class: "card__sub" }, `Un boss garde chaque monde. Il faut ${BOSS_HITS} bonnes réponses avant de perdre tes 3 vies. Victoire : +${BOSS_XP} XP.`),
    h("div", { class: "bosses" }, ws.map(w => h("article", { class: `bosscard${w.open ? "" : " bosscard--locked"}${w.beaten ? " bosscard--beaten" : ""}`, style: `--hue:${w.hue}` },
      bossImg(w),
      h("div", { class: "bosscard__body" },
        h("strong", {}, w.boss.name),
        h("small", {}, `Monde ${w.id} · ${w.title}`),
        h("p", {}, w.beaten ? "Vaincu. Tu peux le réaffronter pour le plaisir." : w.open ? w.boss.intro : "Termine les 6 chapitres du monde pour l'affronter."),
        bossButton(w))))));
}

function challengeCard(ch) {
  const num = ch.num;
  const done = !!state.extra.bonus[num];
  const text = chapterContent(num).bonus;
  const tier = tierOf(num);
  return h("article", { class: `challenge glass${done ? " challenge--done" : ""}` },
    h("div", { class: "challenge__head" },
      h("span", { class: "challenge__tier", role: "img", "aria-label": `Difficulté ${tier} sur 3`, html: Array.from({ length: tier }, () => icon("flame", "icon--sm")).join("") }),
      h("strong", {}, `Ch${pad(num)}. ${ch.title}`),
      h("span", { class: "badge" }, `${challengeXp(num)} XP`)),
    h("p", {}, text),
    h("div", { class: "challenge__foot" },
      done
        ? [h("span", { class: "badge badge--ok" }, "Réussi"), h("button", { class: "link-btn", type: "button", onclick: () => saveExtra("bonus", num, false, { rerender: true }) }, "Annuler")]
        : [statusOf(num) === "todo" && h("small", {}, "Chapitre pas encore fait : tu peux quand même essayer."),
           h("button", { class: "btn", type: "button", onclick: () => saveExtra("bonus", num, true, { rerender: true }) }, "J'ai réussi ce défi")]));
}

function challengesPanel() {
  const withBonus = state.chapters.filter(c => chapterContent(c.num).bonus);
  const done = withBonus.filter(c => state.extra.bonus[c.num]).length;
  const filters = [["todo", "À relever"], ["done", "Réussis"], ["all", "Tous"]];
  const list = withBonus.filter(c => ui.challenge === "all" || (ui.challenge === "done") === !!state.extra.bonus[c.num]);
  return h("section", { class: "card glass" },
    h("h3", {}, `Défis bonus : ${done} sur ${withBonus.length}`),
    h("p", { class: "card__sub" }, "Un montage ou un programme à inventer par chapitre. Plus on avance, plus ils sont difficiles et plus ils rapportent."),
    h("div", { class: "toolbar", role: "group", "aria-label": "Filtrer les défis" },
      filters.map(([key, label]) => h("button", { class: "pill", type: "button", "aria-pressed": String(ui.challenge === key), "data-fid": `c-${key}`, onclick: () => { ui.challenge = key; render(`c-${key}`); } }, label))),
    list.length ? h("div", { class: "challenges" }, list.map(challengeCard)) : h("p", { class: "card__sub" }, "Rien ici pour l'instant."));
}

function renderArene() {
  const frag = document.createDocumentFragment();
  frag.append(
    h("div", { class: "greet" },
      h("h2", {}, "Arène"),
      h("p", {}, "Quêtes, quiz, survie et boss : chaque partie rapporte de l'XP et t'apprend l'ESP32.")),
    h("div", { class: "stack" }, questsPanel(), modesPanel(), bossPanel(), challengesPanel()));
  return frag;
}

/* ---------- Succès ---------- */

function heatmap() {
  const act = new Set(state.extra.activity);
  const todayIso = today();
  const start = dayAt(weekStart(todayIso), -7 * 17);
  const cells = [];
  let active = 0;
  for (let i = 0; i < 18 * 7; i++) {
    const iso = ymd(dayAt(ymd(start), i));
    const future = iso > todayIso;
    const n = Object.values(state.extra.daily?.[iso] || {}).reduce((s, v) => s + v, 0);
    const lvl = act.has(iso) ? 1 + Math.min(3, Math.floor(n / 4)) : 0;
    if (act.has(iso)) active++;
    cells.push(h("i", { class: `heat__c heat__c--${lvl}`, title: `${frDate(iso)}${act.has(iso) ? "" : " : rien"}`, style: future ? "visibility:hidden" : null }));
  }
  return h("section", { class: "card glass" },
    h("h3", {}, "Ton activité"),
    h("p", { class: "card__sub" }, `${active} jour${active > 1 ? "s" : ""} actif${active > 1 ? "s" : ""} sur les 18 dernières semaines.`),
    h("div", { class: "heat", role: "img", "aria-label": `${active} jours actifs sur 18 semaines` }, cells));
}

function renderSucces() {
  const g = game();
  const earned = g.badges.filter(b => b.earned).length;
  const s = g.stats;
  const head = h("section", { class: "card glass card--score" },
    h("div", { class: "lvl" },
      h("div", { class: "lvl__n" }, String(g.rank + 1)),
      h("div", { class: "lvl__body" },
        h("h3", {}, g.name),
        h("p", { class: "card__sub" }, g.ceil ? `${fmt(g.xp)} XP. Prochain niveau à ${fmt(g.ceil)} XP.` : `${fmt(g.xp)} XP. Niveau maximum.`),
        xpBar(g))),
    h("dl", { class: "facts" }, g.sources.map(([k, v, rule]) => [h("dt", {}, k), h("dd", {}, `${fmt(v)} XP`, h("small", { class: "rule" }, ` ${rule}`))])),
  );

  const records = h("section", { class: "card glass" },
    h("h3", {}, "Tes records"),
    h("div", { class: "records" }, [
      [`${s.stars}/${state.chapters.length * 3}`, "étoiles de chapitre"],
      [`${s.boss}/${g.worlds.length}`, "boss vaincus"],
      [String(s.survival), "record en survie"],
      [String(s.streak), s.streak > 1 ? "jours d'affilée au mieux" : "jour d'affilée au mieux"],
      [String(s.quests), "quêtes terminées"],
      [`${s.perfect}`, "quiz sans faute"],
    ].map(([n, l]) => h("div", { class: "record" }, h("strong", {}, n), h("small", {}, l)))));

  const wall = h("section", { class: "card glass" },
    h("h3", {}, `Badges : ${earned} sur ${g.badges.length}`),
    h("div", { class: "wall" }, g.badges.map(b => h("div", { class: `badge-tile${b.earned ? " badge-tile--on" : ""}` },
      h("span", { class: "badge-tile__img" }, badgeImg(b), !b.earned && h("span", { class: "badge-tile__lock", html: icon("lock") })),
      h("strong", {}, b.title),
      h("small", {}, b.earned ? "Gagné" : b.hint),
      !b.earned && h("div", { class: "meter" }, h("div", { class: "meter__fill", style: `width:${Math.round(100 * b.have / b.need)}%` })),
      !b.earned && h("small", { class: "badge-tile__n" }, `${b.have}/${b.need}`)))));

  const ladder = h("section", { class: "card glass" },
    h("h3", {}, "Les niveaux"),
    h("ol", { class: "ladder" }, RANKS.map(([min, name], i) => h("li", { class: i === g.rank ? "ladder--now" : i < g.rank ? "ladder--past" : "" },
      h("span", {}, `${i + 1}. ${name}`), h("small", {}, `${fmt(min)} XP`)))));

  return h("div", { class: "stack" }, head, records, heatmap(), wall, ladder);
}

/* ---------- le lecteur de quiz ---------- */

const PRAISE = ["Exact !", "Bien vu !", "Propre !", "Dans le mille !", "Oui !"];

/* logique pure du lecteur (testée avec test_game.js) : mélange des réponses, puis verdict de fin de partie */

const quizItems = list => list.map(q => {
  const order = shuffled(q.choices.map((_, i) => i));
  return { ...q, choices: order.map(i => q.choices[i]), answer: order.indexOf(q.answer) };
});

function quizVerdict({ score, total, goal, endless, recordBefore, bossName }) {
  const won = goal ? score >= goal : null;
  const ratio = total ? score / total : 0;
  const record = endless && score > recordBefore;
  const good = won === true || (won === null && !endless && ratio >= 1) || record;
  const lose = won === false || (endless && !record && score < 3);
  const title = won === true ? "Boss vaincu !" : won === false ? "Défaite" : endless ? (record ? "Nouveau record !" : "Partie terminée") : ratio >= 1 ? "Sans faute !" : ratio >= .7 ? "Bien joué" : ratio >= .4 ? "Pas mal" : "Encore un effort";
  const line = won === true ? `${bossName} est à terre.` : won === false ? "Révise les chapitres du monde et reviens." : endless ? `Tu as enchaîné ${score} bonne${score > 1 ? "s" : ""} réponse${score > 1 ? "s" : ""}.` : "Relis le chapitre, puis réessaie : seul ton meilleur score compte.";
  const stars = !goal && !endless ? (ratio >= 1 ? 3 : ratio >= .7 ? 2 : ratio >= .4 ? 1 : 0) : null;
  return { won, good, lose, title, line, stars };
}

function playQuiz(cfg) {
  const { title, sub, lives = 0, goal = 0, art = null, onEnd, endless = false } = cfg;
  const items = quizItems(cfg.make());
  const run = { i: 0, score: 0, hearts: lives, combo: 0, best: 0, locked: false };
  const recordBefore = state.extra.play?.survival || 0;

  const soundBtn = h("button", { class: "icon-btn", type: "button" });
  const paintSound = () => {
    soundBtn.innerHTML = icon(soundOn() ? "volume" : "mute");
    soundBtn.setAttribute("aria-label", soundOn() ? "Couper les sons" : "Activer les sons");
  };
  soundBtn.onclick = () => { setSound(!soundOn()); paintSound(); };
  paintSound();

  const body = h("div", { class: "play__body" });
  const root = h("div", { class: "play" },
    h("div", { class: "dlg__head" }, h("div", { class: "play__title" }, h("h2", { id: "dlg-title" }, title), sub && h("p", { class: "card__sub" }, sub)), soundBtn, closeBtn()),
    body);

  const finished = () => run.i >= items.length || (lives && run.hearts <= 0) || (goal && run.score >= goal);

  const hud = () => {
    const left = Math.max(0, goal - run.score);
    return h("div", { class: "hud" },
      art && h("div", { class: "hud__boss" }, bossImg(art),
        h("div", { class: "hud__hp" }, h("strong", {}, art.boss.name),
          h("div", { class: "meter meter--hp", role: "img", "aria-label": `${left} coups restants` }, h("div", { class: "meter__fill", style: `width:${Math.round(100 * left / goal)}%` })),
          h("small", {}, `${left} bonne${left > 1 ? "s" : ""} réponse${left > 1 ? "s" : ""} pour le vaincre`))),
      h("div", { class: "hud__row" },
        h("span", { class: "hud__n" }, endless ? `Série : ${run.score}` : goal ? `Coups portés : ${run.score}/${goal}` : `Question ${Math.min(run.i + 1, items.length)} sur ${items.length}`),
        lives > 0 && h("span", { class: "hearts", role: "img", "aria-label": `${run.hearts} vie${run.hearts > 1 ? "s" : ""}` },
          Array.from({ length: lives }, (_, i) => h("i", { class: i < run.hearts ? "" : "lost", html: icon("heart") }))),
        run.combo >= 2 && h("span", { class: "combo" }, `Série de ${run.combo}`)),
      !goal && !endless && h("div", { class: "meter" }, h("div", { class: "meter__fill", style: `width:${Math.round(100 * run.i / items.length)}%` })));
  };

  const draw = () => {
    run.locked = false;
    const q = items[run.i];
    const hudEl = hud();
    const fb = h("div", { class: "play__fb", "aria-live": "polite" });
    const picks = h("div", { class: "picks", role: "group", "aria-label": "Réponses" }, q.choices.map((choice, ci) => h("button", {
      class: "pick", type: "button", "data-i": ci, onclick: () => answer(ci),
    }, h("span", { class: "pick__k" }, String(ci + 1)), h("span", {}, choice))));
    body.replaceChildren(hudEl,
      h("div", { class: "play__q" }, q.from && h("p", { class: "play__from" }, `Ch${pad(q.from)} · ${chapterTitle(q.from)}`), h("h3", {}, q.q)),
      picks, fb);

    function answer(ci) {
      if (run.locked) return;
      run.locked = true;
      const ok = ci === q.answer;
      picks.querySelectorAll(".pick").forEach(b => {
        const i = Number(b.dataset.i);
        b.disabled = true;
        b.classList.toggle("pick--right", i === q.answer);
        b.classList.toggle("pick--wrong", i === ci && !ok);
      });
      if (ok) { run.score++; run.combo++; run.best = Math.max(run.best, run.combo); sfx("ok"); }
      else { run.combo = 0; if (lives) run.hearts--; sfx("bad"); }
      hudEl.replaceWith(hud());
      const last = (run.i + 1 >= items.length) || (lives && run.hearts <= 0) || (goal && run.score >= goal);
      const nextBtn = h("button", { class: "btn btn--primary", type: "button", onclick: () => { run.i++; finished() ? end() : draw(); } }, last ? "Voir le résultat" : "Question suivante");
      fb.replaceChildren(
        h("p", { class: `verdict ${ok ? "verdict--ok" : "verdict--bad"}` }, ok ? (run.combo >= 3 ? `Série de ${run.combo} !` : PRAISE[run.i % PRAISE.length]) : "Pas tout à fait."),
        h("p", { class: "play__why" }, q.why),
        nextBtn);
      nextBtn.focus();
    }
  };

  const end = () => {
    const total = run.i;
    const { won, good, lose, title, line, stars } = quizVerdict({ score: run.score, total, goal, endless, recordBefore, bossName: art?.boss.name });
    sfx(lose ? "lose" : "win");
    if (good) confetti(won ? 170 : 110);

    const gainLine = h("p", { class: "result__xp", "aria-live": "polite" }, "Enregistrement…");

    body.replaceChildren(h("div", { class: "result" },
      art && won !== null && bossImg(art, won ? "boss-img--beaten" : ""),
      h("p", { class: "result__score" }, endless ? String(run.score) : goal ? `${run.score}/${total}` : `${run.score}/${items.length}`),
      stars !== null && h("span", { class: "stars stars--big", role: "img", "aria-label": `${stars} étoile sur 3` }, [0, 1, 2].map(i => h("i", { class: i < stars ? "on" : "", html: icon("star") }))),
      h("h3", {}, title),
      h("p", { class: "card__sub" }, line),
      run.best >= 3 && h("p", { class: "result__combo" }, `Meilleure série : ${run.best}`),
      gainLine,
      h("div", { class: "result__btns" },
        h("button", { class: "btn btn--primary", type: "button", onclick: () => playQuiz(cfg) }, won === false ? "Revanche" : "Rejouer"),
        h("button", { class: "btn", type: "button", onclick: () => dialog.close() }, "Fermer"))));

    Promise.resolve(onEnd({ score: run.score, total, won })).then(r => {
      gainLine.textContent = !r ? "Échec de l'enregistrement."
        : r.gain > 0 ? `+${r.gain} XP${r.text.replace(`+${r.gain} XP`, "").replace(/^ · /, " · ")}` : cfg.noXp || "Aucun XP cette fois : ton meilleur score reste celui d'avant.";
    });
  };

  show(root);
  const onKey = e => {
    if (!root.isConnected) { dialog.removeEventListener("keydown", onKey); return; }
    const pick = !run.locked && /^[1-9]$/.test(e.key) && body.querySelector(`.pick[data-i="${Number(e.key) - 1}"]`);
    if (pick) pick.click();
  };
  dialog.addEventListener("keydown", onKey);
  if (!items.length) { body.replaceChildren(h("p", { class: "ch__note" }, "Pas encore de questions : termine d'abord un chapitre.")); return; }
  draw();
}

/* ---------- lanceurs ---------- */

const reviewPool = () => {
  const pool = [];
  for (const n of doneNums()) {
    const q = state.extra.quiz[n];
    const weight = !q ? 2 : q.score < q.total ? 3 : 1;
    for (const item of questionsOf([n])) for (let i = 0; i < weight; i++) pool.push(item);
  }
  const seen = new Set();
  return shuffled(pool).filter(q => (seen.has(q.q) ? false : seen.add(q.q)));
};

function startChapterQuiz(num) {
  playQuiz({
    title: `Quiz · Ch${pad(num)}`, sub: chapterTitle(num),
    make: () => questionsOf([num]),
    onEnd: r => saveExtra("quiz", num, { score: r.score, total: r.total }, { silent: true }),
  });
}

function startReview() {
  playQuiz({
    title: "Révision", sub: "Cinq questions piochées dans tes chapitres terminés.",
    make: () => reviewPool().slice(0, 5),
    onEnd: r => saveExtra("play", "review", { score: r.score, total: r.total }, { silent: true }),
    noXp: "Pas d'XP directe : la révision valide une quête.",
  });
}

function startDaily() {
  const nums = doneNums();
  playQuiz({
    title: "Quiz du jour", sub: frDate(today()),
    make: () => shuffled(questionsOf(nums.length ? nums : [1, 2]), seeded(`daily-${today()}`)).slice(0, 3),
    onEnd: r => saveExtra("play", "daily", { score: r.score, total: r.total }, { silent: true }),
    noXp: "Quête du quiz du jour validée.",
  });
}

function startSurvival() {
  playQuiz({
    title: "Survie", sub: "Trois vies. Chaque erreur en coûte une.", lives: 3, endless: true,
    make: () => shuffled(questionsOf(doneNums())),
    onEnd: r => saveExtra("play", "survival", { run: r.score }, { silent: true }),
    noXp: "Pas de nouveau record, donc pas d'XP.",
  });
}

function startBoss(w) {
  playQuiz({
    title: w.boss.name, sub: `Boss du monde ${w.id} : ${w.title}`, lives: 3, goal: BOSS_HITS, art: w,
    make: () => shuffled(questionsOf(w.chapters)).slice(0, 10),
    onEnd: r => saveExtra("play", "boss", { world: w.id, score: r.score, total: Math.max(r.total, 1), won: r.won }, { silent: true }),
    noXp: w.beaten ? "Déjà vaincu : pas d'XP en plus." : "Réessaie.",
  });
}
