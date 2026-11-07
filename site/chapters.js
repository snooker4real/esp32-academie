/* ---------- chapitres ---------- */

function renderChapters() {
  const frag = document.createDocumentFragment();
  const c = counts();
  const filters = [["all", "Tous"], ["todo", "À faire"], ["doing", "En cours"], ["done", "Fait"]];
  const list = state.chapters.filter(matches);

  frag.append(h("div", { class: "toolbar", role: "group", "aria-label": "Filtrer par statut" },
    filters.map(([key, label]) => h("button", {
      class: "pill", type: "button", "aria-pressed": String(state.filter === key), "data-fid": `f-${key}`,
      onclick: () => { state.filter = key; render(`f-${key}`); },
    }, key === "all" ? `${label} (${state.chapters.length})` : `${label} (${c[key]})`)),
    h("span", { class: "toolbar__count" }, `${list.length} affichés`),
  ));

  if (!list.length) {
    frag.append(h("div", { class: "empty glass" }, "Aucun chapitre ne correspond. Change le filtre ou la recherche."));
    return frag;
  }
  const groups = state.content.worlds.map(w => [w, list.filter(ch => w.chapters.includes(ch.num))]).filter(([, l]) => l.length);
  const ws = new Map(worldStates().map(w => [w.id, w]));
  // Par défaut seul le monde en cours est ouvert ; une recherche ou un filtre ouvre tout.
  const forced = state.filter !== "all" || !!state.q;
  ui.open ??= new Set([(ws.get(groups.find(([w]) => ws.get(w.id).done < ws.get(w.id).total)?.[0].id ?? groups[0][0].id)).id]);
  for (const [w, l] of groups) {
    const st = ws.get(w.id);
    frag.append(h("details", {
      class: `wacc${st.open ? "" : " world--locked"}`, style: `--hue:${w.hue}`, open: forced || ui.open.has(w.id),
      ontoggle: e => { if (!forced) e.target.open ? ui.open.add(w.id) : ui.open.delete(w.id); },
    },
      h("summary", { class: "wacc__head glass" },
        h("span", { class: "wacc__art" }, bossImg(st)),
        h("span", { class: "wacc__title" },
          h("strong", {}, `Monde ${st.id} · ${st.title}`),
          h("span", { class: "meter", role: "img", "aria-label": `${st.done} chapitres sur ${st.total}` }, h("span", { class: "meter__fill", style: `width:${Math.round(100 * st.done / st.total)}%` }))),
        h("span", { class: "badge" }, `${st.done}/${st.total}`),
        h("span", { class: "badge wacc__stars" }, `${worldStars(st)}/${st.total * 3} ★`),
        h("span", { class: "wacc__chev", html: icon("chevron") })),
      h("div", { class: "wacc__body" },
        h("div", { class: "wacc__intro" },
          h("p", { class: "card__sub" }, st.beaten ? `Boss vaincu : ${st.boss.name}.` : st.tagline),
          bossButton(st)),
        h("div", { class: "chapters chapters--world" }, l.map(chapterCard)))));
  }
  return frag;
}

function chapterCard(ch) {
  const s = statusOf(ch.num);
  const q = state.extra.quiz[ch.num];
  const badges = [
    q && h("span", { class: `badge${q.score === q.total ? " badge--ok" : ""}` }, `Quiz ${q.score}/${q.total}`),
    state.extra.bonus[ch.num] && h("span", { class: "badge badge--ok" }, "Défi réussi"),
    state.extra.notes[ch.num] && h("span", { class: "badge" }, "Note"),
  ];
  const thumb = ch.schemas[0]
    ? h("button", { class: "ch__thumb", type: "button", "aria-label": `Voir les schémas du chapitre ${ch.num}`, onclick: () => openChapter(ch.num) },
        h("img", { src: `/schemas/${ch.schemas[0]}`, alt: "", loading: "lazy" }))
    : h("div", { class: "ch__thumb ch__thumb--empty", html: `${art("logiciel", "art art--soft")}<span>Pas de câblage</span>` });

  return h("article", { class: `ch glass ch--${s}` },
    thumb,
    h("div", { class: "ch__body" },
      h("h3", { class: "ch__title" },
        h("button", { class: "ch__open", type: "button", onclick: () => openChapter(ch.num) },
          h("span", { class: "num" }, `Ch${pad(ch.num)}`), ch.title)),
      ch.note && h("p", { class: "ch__note" }, ch.note),
      h("div", { class: "badges" }, starsRow(ch.num), badges),
      h("div", { class: "ch__foot" }, segmented("chapter", ch.num), links(ch)),
    ),
  );
}

function segmented(kind, id) {
  const current = () => (kind === "chapter" ? statusOf(id) : projectStatus(id));
  return h("div", { class: "seg", role: "group", "aria-label": `Statut ${kind === "chapter" ? "du chapitre" : "du projet"} ${id}`, "data-kind": kind, "data-id": id },
    Object.entries(STATUS).map(([key, label]) => h("button", {
      type: "button", "data-status": key, "aria-pressed": String(current() === key), "data-fid": `s-${kind}-${id}-${key}`,
      onclick: () => (kind === "chapter" ? setStatus(id, key) : setProjectStatus(id, key)),
    }, label)));
}

function syncSegs() {
  document.querySelectorAll(".seg").forEach(seg => {
    const kind = seg.dataset.kind;
    const id = kind === "chapter" ? Number(seg.dataset.id) : seg.dataset.id;
    const cur = kind === "chapter" ? statusOf(id) : projectStatus(id);
    seg.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.status === cur)));
  });
}

function links(ch) {
  return h("div", { class: "links" },
    LOCAL && ch.code && h("button", { class: "link-btn", type: "button", onclick: () => openResource("code", ch.num), html: `${icon("folder", "icon--sm")}Code perso` }),
    LOCAL && ch.num !== 36 && h("button", { class: "link-btn", type: "button", onclick: () => openResource("freenove", ch.num), html: `${icon("code", "icon--sm")}Sketch Freenove` }),
  );
}
