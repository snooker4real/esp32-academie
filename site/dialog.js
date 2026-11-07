/* ---------- fenêtre de détail ---------- */

const dialog = document.getElementById("chapter-dialog");

const section = (title, ...kids) => h("section", { class: "dlg__sec" }, h("h3", {}, title), ...kids);
const closeBtn = () => h("button", { class: "icon-btn", type: "button", "aria-label": "Fermer", onclick: () => dialog.close(), html: icon("x") });

function show(...nodes) {
  dialog.replaceChildren(h("div", { class: "dlg" }, ...nodes));
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
}

function openChapter(num) {
  const ch = state.chapters.find(c => c.num === num);
  if (!ch) return;
  const c = chapterContent(num);
  const pins = state.content.pins[num] || [];
  const doneOn = statusOf(num) === "done" && state.extra.dates[num];

  show(
    h("div", { class: "dlg__head" },
      h("h2", { id: "dlg-title" }, `Ch${pad(num)}. ${ch.title}`),
      closeBtn()),
    segmented("chapter", num),
    h("div", { class: "dlg__stars" }, starsRow(num), h("small", {}, "Étoiles : terminé, quiz parfait, défi réussi")),
    doneOn && h("p", { class: "ch__note" }, `Terminé le ${frDate(state.extra.dates[num])}.`),
    ch.note && h("p", { class: "ch__note" }, ch.note),
    ch.schemas.length
      ? h("div", { class: "dlg__imgs" }, ch.schemas.map(f =>
          h("a", { href: `/schemas/${f}`, target: "_blank", rel: "noopener", "aria-label": "Ouvrir le schéma en grand" },
            h("img", { src: `/schemas/${f}`, alt: `Schéma de câblage : ${ch.title}` }))))
      : h("div", { class: "empty", html: `${art("logiciel", "art art--soft")}<p>Ce chapitre est 100% logiciel : rien à câbler.</p>` }),
    h("div", { class: "dlg__cols" },
      c.parts && partsSection(num, c.parts),
      section("Broches utilisées",
        pins.length
          ? h("div", { class: "reqs" }, pins.map(p => h("button", {
              type: "button", class: "req", title: p.role,
              onclick: () => { state.gpio = p.gpio; dialog.close(); location.hash = "#/broches"; render(); },
            }, `GPIO ${p.gpio} · ${p.role}`)))
          : h("p", { class: "ch__note" }, "Aucune broche : chapitre logiciel."))),
    c.bonus && bonusSection(num, c.bonus),
    c.quiz && quizSection(num, c.quiz),
    codeSection(num, ch),
    notesSection(num),
    links(ch),
  );
}

function partsSection(num, parts) {
  const checked = { ...(state.extra.parts[num] || {}) };
  const info = h("p", { class: "ch__note", "aria-live": "polite" });
  const paint = () => { info.textContent = `${parts.filter(p => checked[p]).length} pièce(s) sur ${parts.length} sorties de la boîte`; };
  paint();
  return section("Pièces à sortir", h("ul", { class: "checks" }, parts.map((name, i) => {
    const id = `part-${num}-${i}`;
    return h("li", {},
      h("input", { type: "checkbox", id, checked: !!checked[name], onchange: e => {
        if (e.target.checked) checked[name] = true; else delete checked[name];
        paint();
        saveExtra("parts", num, checked, { silent: true });
      } }),
      h("label", { for: id }, name));
  })), info);
}

function quizSection(num, items) {
  const q = state.extra.quiz[num];
  return section("Quiz",
    h("p", { class: "ch__note" }, `${items.length} questions. 20 XP par bonne réponse : seul ton meilleur score compte.`),
    q && h("p", { class: "ch__note" }, `Meilleur score : ${q.score}/${q.total}${q.tries ? `, en ${q.tries} essai${q.tries > 1 ? "s" : ""}` : ""}.`),
    h("div", {}, h("button", { class: "btn btn--primary", type: "button", onclick: () => startChapterQuiz(num) }, q ? "Retenter le quiz" : "Lancer le quiz")));
}

function bonusSection(num, text) {
  const id = `bonus-${num}`;
  return section(`Défi bonus (${challengeXp(num)} XP)`,
    h("p", { class: "bonus" }, text),
    h("div", { class: "checks" },
      h("input", { type: "checkbox", id, checked: !!state.extra.bonus[num], onchange: e => saveExtra("bonus", num, e.target.checked, { rerender: true }) }),
      h("label", { for: id }, "Défi réussi")));
}

function notesSection(num) {
  const status = h("span", { class: "save-state", "aria-live": "polite" });
  const area = h("textarea", {
    id: `note-${num}`, rows: "4", maxlength: "4000",
    placeholder: "Ce que j'ai compris, ce qui a coincé, la solution trouvée…",
  }, state.extra.notes[num] || "");
  let timer;
  area.addEventListener("input", () => {
    status.textContent = "Modifications en attente…";
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const ok = await saveExtra("notes", num, area.value, { silent: true });
      status.textContent = ok ? "Enregistré et synchronisé avec Obsidian." : "Échec de l'enregistrement.";
    }, 700);
  });
  return section("Mes notes", h("label", { class: "visually-hidden", for: `note-${num}` }, "Notes du chapitre"), area, status);
}

/* ---------- lecteur de code ---------- */

const KEYWORDS = new Set(("void int long short float double char bool boolean byte unsigned signed const static volatile struct class enum " +
  "if else for while do switch case default break continue return true false NULL nullptr HIGH LOW INPUT OUTPUT INPUT_PULLUP " +
  "uint8_t uint16_t uint32_t int8_t int16_t int32_t String setup loop def import from in not and or None True False self elif try except pass lambda").split(" "));
const RE_C = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(^[ \t]*#[ \t]*\w+)|(\b0x[0-9a-fA-F]+\b|\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]\w*\b)/gm;
const RE_PY = /(#[^\n]*)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(\u0000)|(\b0x[0-9a-fA-F]+\b|\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]\w*\b)/gm;
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function highlight(text, name) {
  const re = name.endsWith(".py") ? RE_PY : RE_C;
  let out = "", last = 0;
  for (const m of text.matchAll(re)) {
    out += esc(text.slice(last, m.index));
    const cls = m[1] ? "c" : m[2] ? "s" : m[3] ? "p" : m[4] ? "n" : KEYWORDS.has(m[5]) ? "k" : null;
    out += cls ? `<span class="tok-${cls}">${esc(m[0])}</span>` : esc(m[0]);
    last = m.index + m[0].length;
  }
  return out + esc(text.slice(last));
}

function codeSection(num, ch) {
  const box = h("div", { class: "codebox" });
  const btn = h("button", { class: "btn", type: "button", html: `${icon("code", "icon--sm")}Afficher le code` });
  btn.onclick = async () => {
    btn.disabled = true;
    btn.textContent = "Chargement…";
    try {
      const data = await fetch(`/api/code?chapter=${num}`).then(r => r.json());
      btn.remove();
      box.append(codeViewer(data));
    } catch {
      btn.disabled = false;
      btn.textContent = "Échec du chargement, réessayer";
    }
  };
  box.append(btn);
  return section("Code", ch.num === 36 ? h("p", { class: "ch__note" }, "Pas de sketch pour ce chapitre.") : box);
}

function codeViewer(data) {
  const sources = [["perso", "Mon code"], ["freenove", "Sketches Freenove"]].filter(([k]) => data[k].length);
  if (!sources.length) return h("p", { class: "ch__note" }, "Aucun fichier de code pour ce chapitre.");
  const wrap = h("div", { class: "viewer" });
  const bar = h("div", { class: "viewer__bar" });
  const select = h("select", { "aria-label": "Fichier à afficher" });
  const pre = h("pre", { class: "code", tabindex: "0" });
  let current = sources[0][0];

  const paintFile = () => {
    const f = data[current][Number(select.value)] || data[current][0];
    pre.innerHTML = highlight(f.text, f.name);
  };
  const paintSource = () => {
    select.replaceChildren(...data[current].map((f, i) => h("option", { value: String(i) }, f.name)));
    paintFile();
    tabs.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.k === current)));
  };
  const tabs = h("div", { class: "toolbar", role: "group", "aria-label": "Source du code" },
    sources.map(([k, label]) => h("button", { class: "pill", type: "button", "data-k": k, onclick: () => { current = k; paintSource(); } }, label)));
  select.onchange = paintFile;
  bar.append(tabs, select);
  wrap.append(bar, pre);
  paintSource();
  return wrap;
}

/* ---------- projets : fenêtre ---------- */

function openProject(id) {
  const p = state.content.projects.find(x => x.id === id);
  if (!p) return;
  const lacking = missing(p);
  show(
    h("div", { class: "dlg__head" }, h("h2", { id: "dlg-title" }, p.title), closeBtn()),
    h("div", { class: "proj__meta" }, levelDots(p.level), h("span", {}, `${p.hours} h environ`)),
    projectImg(p),
    segmented("project", id),
    h("p", { class: "bonus" }, p.summary),
    craftChips(p),
    p.video && videoSection(p),
    section("Chapitres requis",
      requireChips(p),
      lacking.length ? h("p", { class: "ch__note" }, "Tu peux commencer avant, mais ces chapitres t'apprennent les composants utilisés.") : h("p", { class: "ch__note" }, "Tout est fait : tu as les bases pour ce projet.")),
    section("Pièces du kit", h("ul", { class: "bullets" }, p.parts.map(x => h("li", {}, x)))),
    p.buy && buySection(p.buy),
    p.wiring && wiringSection(p.wiring),
    p.software && softwareSection(p.software),
    section("Étapes", h("ol", { class: "steps" }, p.steps.map(x => h("li", {}, x)))),
    p.links && section("Liens utiles", h("ul", { class: "bullets" }, p.links.map(l => h("li", {}, extLink(l.url, l.label))))),
    p.stretch && section("Pour aller plus loin", h("p", { class: "bonus" }, p.stretch)),
  );
}

dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });
dialog.addEventListener("close", () => render());
