/* ---------- broches ---------- */

function gpioUsage() {
  const usage = {};
  for (const [num, entries] of Object.entries(state.content.pins)) {
    for (const e of entries) (usage[e.gpio] ||= []).push({ chapter: Number(num), role: e.role });
  }
  return usage;
}

function renderPins() {
  const board = state.content.board;
  const usage = gpioUsage();
  const gpios = Object.keys(board).map(Number).sort((a, b) => a - b);
  if (state.gpio == null) state.gpio = 13;

  const frag = document.createDocumentFragment();
  frag.append(h("div", { class: "greet" },
    h("h2", {}, "Broches de la carte"),
    h("p", {}, "Touche une broche pour voir ce qu'elle fait sur la carte WROVER et dans quels chapitres du kit elle est branchée.")));


  const grid = h("div", { class: "gpios" }, gpios.map(g => {
    const info = board[g];
    const n = (usage[g] || []).length;
    return h("button", {
      class: `gpio gpio--${info.level}`, type: "button", "aria-pressed": String(state.gpio === g), "data-fid": `g-${g}`,
      "aria-label": `GPIO ${g}, ${LEVELS[info.level]}, utilisée dans ${n} chapitre${n > 1 ? "s" : ""}`,
      onclick: () => { state.gpio = g; render(`g-${g}`); },
    }, h("span", { class: "gpio__n" }, String(g)), n > 0 && h("span", { class: "gpio__use" }, String(n)));
  }));

  const info = board[state.gpio];
  const uses = (usage[state.gpio] || []).sort((a, b) => a.chapter - b.chapter);
  const detail = h("section", { class: "card glass pin-detail", "aria-live": "polite" },
    h("h3", {}, `GPIO ${state.gpio}`),
    info && h("div", { class: "badges" },
      h("span", { class: `badge badge--${info.level}` }, LEVELS[info.level]),
      info.tags.map(t => h("span", { class: "badge" }, t))),
    info && h("p", { class: "pin-note" }, info.note),
    h("h4", {}, uses.length ? `Utilisée dans ${uses.length} chapitre${uses.length > 1 ? "s" : ""}` : "Jamais utilisée dans le kit"),
    uses.length > 0 && h("ul", { class: "rows" }, uses.map(u => h("li", {},
      h("button", { class: "row", type: "button", onclick: () => openChapter(u.chapter) },
        h("span", { class: "row__n" }, pad(u.chapter)),
        h("span", { class: "row__t" }, `${chapterTitle(u.chapter)}`),
        h("span", { class: "row__badge" }, u.role))))),
  );

  frag.append(h("div", { class: "pins-layout" },
    h("div", { class: "card glass" },
      grid,
      h("div", { class: "legend" },
        Object.entries(LEVELS).map(([k, v]) => h("span", { html: `<i class="dot dot--${k}"></i>${v}` })),
        h("span", {}, "Le petit chiffre indique le nombre de chapitres qui l'utilisent."),
      ),
      h("a", { class: "textlink", href: "/freenove/ESP32_Pinout_V3.0.png", target: "_blank", rel: "noopener" }, "Ouvrir le pinout officiel Freenove")),
    detail));
  return frag;
}

/* ---------- documentation ---------- */

function renderDocs() {
  const frag = document.createDocumentFragment();
  if (!state.docs) {
    frag.append(h("div", { class: "empty glass" }, "Chargement de la documentation…"));
    return frag;
  }
  const docs = state.docs.filter(d => !state.q || norm(`${d.title} ${d.path}`).includes(norm(state.q)));
  if (!docs.length) {
    frag.append(h("div", { class: "empty glass" }, "Aucun document ne correspond à cette recherche."));
    return frag;
  }
  const url = d => `/freenove/${encodeURI(d.path)}`;

  for (const [cat, label] of DOC_SECTIONS) {
    const items = docs.filter(d => d.category === cat);
    if (!items.length) continue;
    const sec = h("section", { class: "doc-sec" }, h("h3", {}, `${label} (${items.length})`));

    const shots = items.filter(d => d.image);
    if (shots.length) {
      sec.append(h("div", { class: "gallery" }, shots.map(d =>
        h("a", { class: "shot glass", href: url(d), target: "_blank", rel: "noopener" },
          h("img", { src: url(d), alt: "", loading: "lazy" }), h("span", {}, d.title)))));
    }

    const groups = new Map();
    for (const d of items.filter(d => !d.image)) {
      const key = d.group || "";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(d);
    }
    for (const [group, list] of groups) {
      if (group) sec.append(h("h4", {}, group.replace(/_/g, " ")));
      sec.append(h("ul", { class: "docs" }, list.map(d =>
        h("li", {}, h("a", { href: url(d), target: "_blank", rel: "noopener" },
          h("span", { html: icon("file", "icon--sm") }),
          h("span", { class: "t" }, d.title),
          h("span", { class: "ext" }, d.path.split(".").pop().toUpperCase()))))));
    }
    frag.append(sec);
  }
  return frag;
}
