/* ---------- accueil ---------- */

function renderHome() {
  const c = counts();
  const total = state.chapters.length;
  const pct = total ? Math.round((100 * c.done) / total) : 0;
  const next = nextChapter();
  const hour = new Date().getHours();
  const hello = hour >= 18 || hour < 5 ? "Bonsoir" : "Bonjour";

  const greet = h("div", { class: "greet" },
    h("h2", {}, `${hello} Jo`),
    h("p", { html: next
      ? `<strong>${c.done} chapitres sur ${total}</strong> sont terminés. Prochaine étape : ${next.title}.`
      : `<strong>Les ${total} chapitres sont terminés.</strong> Il reste les projets libres.` }),
  );

  const grid = h("div", { class: "grid" }, levelCard(), questsCard(), worldCard(), homeStrip(c, total), homeNext(next), rhythmCard(), buildCard(), quickCard());
  const frag = document.createDocumentFragment();
  frag.append(greet, homeHero(c, pct, next), grid);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const fill = document.getElementById("meter-fill");
    if (fill) fill.style.width = `${pct}%`;
  }));
  state.entered = true;
  return frag;
}

/* Bandeau du prochain chapitre : titre, chiffres, actions et schéma */
function homeHero(c, pct, next) {
  const schema = next && next.schemas[0];
  const hero = h("section", { class: "hero", "aria-label": "Prochain chapitre" },
    schema && h("div", { class: "hero__bg", style: `background-image:url('/schemas/${schema}')` }),
    h("div", { class: "hero__scrim" }),
    h("div", { class: "hero__body" }, heroIntro(next),
      h("div", { class: "stats" },
        stat(c.done, "faits"), stat(c.doing, "en cours"), stat(c.todo, "à faire"), stat(`${pct}%`, "du parcours")),
      h("div", { class: "meter", role: "img", "aria-label": `${pct}% du parcours terminé` },
        h("div", { class: "meter__fill", id: "meter-fill" })),
      next && heroActions(next)),
    h("div", { class: "hero__figure" }, next && heroFigure(next, schema)));
  return hero;
}

const heroIntro = next => next
  ? [h("span", { class: "chip", html: `${icon("play", "icon--sm")}${statusOf(next.num) === "doing" ? "En cours" : "À faire ensuite"}` }),
     h("h2", { class: "hero__title" }, `Ch${pad(next.num)}. ${next.title}`),
     h("p", { class: "hero__note" }, next.note || (next.code ? "Ton code perso est déjà dans le dossier du chapitre." : "Schéma de câblage et sketch Freenove prêts à ouvrir."))]
  : h("h2", { class: "hero__title" }, "Kit terminé");

const heroActions = next => h("div", { class: "hero__actions" },
  h("button", { class: "btn btn--primary", type: "button", onclick: () => openChapter(next.num) }, "Ouvrir le chapitre"),
  statusOf(next.num) !== "doing" &&
    h("button", { class: "btn", type: "button", onclick: () => setStatus(next.num, "doing") }, "Commencer"),
  h("button", { class: "btn", type: "button", onclick: () => setStatus(next.num, "done") }, "Marquer comme fait"));

const heroFigure = (next, schema) => schema
  ? h("button", { class: "frame", type: "button", "aria-label": `Voir les schémas du chapitre ${next.num}`, onclick: () => openChapter(next.num) },
      h("img", { src: `/schemas/${schema}`, alt: `Schéma de câblage : ${next.title}` }))
  : h("div", { class: "frame frame--empty", html: `${art("logiciel", "art art--soft")}<p>Ce chapitre est 100% logiciel : pas de câblage.</p>` });

/* Une case par chapitre */
function homeStrip(c, total) {
  const strip = h("div", { class: `strip${state.entered ? "" : " strip--enter"}` });
  state.chapters.forEach((ch, i) => {
    const s = statusOf(ch.num);
    strip.append(h("button", {
      class: `cell cell--${s}`, type: "button", style: `animation-delay:${i * 14}ms`,
      "aria-label": `Chapitre ${ch.num}, ${ch.title} : ${STATUS[s]}`, title: `${ch.title} (${STATUS[s]})`,
      onclick: () => openChapter(ch.num),
    }, pad(ch.num)));
  });

  return h("section", { class: "card card--strip glass" },
    h("h3", {}, `Parcours des ${total} chapitres`),
    h("p", { class: "card__sub" }, "Clique une case pour ouvrir le chapitre."),
    strip,
    h("div", { class: "legend" },
      h("span", { html: `<i class="dot dot--done"></i>Fait (${c.done})` }),
      h("span", { html: `<i class="dot dot--doing"></i>En cours (${c.doing})` }),
      h("span", { html: `<i class="dot dot--todo"></i>À faire (${c.todo})` }),
    ),
  );
}

/* Les prochains chapitres à faire */
function homeNext(next) {
  const upcoming = state.chapters.filter(ch => statusOf(ch.num) !== "done" && ch !== next).slice(0, 4);
  return h("section", { class: "card card--next glass" },
    h("h3", {}, "Ensuite"),
    h("p", { class: "card__sub" }, "Les prochains chapitres à faire."),
    upcoming.length
      ? h("ul", { class: "rows" }, upcoming.map(ch => h("li", {},
          h("button", { class: "row", type: "button", onclick: () => openChapter(ch.num) },
            h("span", { class: "row__n" }, pad(ch.num)),
            h("span", { class: "row__t" }, ch.title),
            h("span", { class: "row__badge" }, STATUS[statusOf(ch.num)]),
          ))))
      : h("p", { class: "card__sub" }, "Rien en attente."),
  );
}

const stat = (n, label) => h("div", { class: "stat" }, h("div", { class: "stat__n" }, String(n)), h("div", { class: "stat__l" }, label));

function rhythmCard() {
  const r = state.extra.rhythm || {};
  const quizDone = Object.values(state.extra.quiz);
  const perfect = quizDone.filter(q => q.score === q.total).length;
  const bonus = Object.keys(state.extra.bonus).length;
  const reviewable = reviewPool().length > 0;

  const rows = [
    ["Série", r.streak ? `${r.streak} jour${r.streak > 1 ? "s" : ""} d'affilée` : "Aucune série en cours"],
    ["Rythme", r.per_week ? `${String(r.per_week).replace(".", ",")} chapitre${r.per_week >= 2 ? "s" : ""} par semaine` : "Pas encore mesurable"],
    ["Fin estimée", r.eta ? frDate(r.eta) : "Termine 2 chapitres pour la voir"],
    ["Quiz", quizDone.length ? `${perfect} sur ${quizDone.length} sans faute` : "Aucun quiz fait"],
    ["Défis", `${bonus} réussi${bonus > 1 ? "s" : ""}`],
  ];
  return h("section", { class: "card card--rhythm glass" },
    h("h3", {}, "Ton rythme"),
    h("dl", { class: "facts" }, rows.map(([k, v]) => [h("dt", {}, k), h("dd", {}, v)])),
    h("button", { class: "btn", type: "button", disabled: !reviewable, onclick: startReview, html: `${icon("help", "icon--sm")}Réviser 5 questions` }),
  );
}

function buildCard() {
  const projects = state.content.projects.filter(p => projectStatus(p.id) !== "done");
  const ready = projects.filter(p => !missing(p).length);
  const closest = [...projects].sort((a, b) => missing(a).length - missing(b).length)[0];
  const body = [];
  if (ready.length) {
    body.push(h("ul", { class: "rows" }, ready.slice(0, 3).map(p => h("li", {},
      h("button", { class: "row", type: "button", onclick: () => openProject(p.id) },
        h("span", { class: "row__t" }, p.title),
        h("span", { class: "row__badge" }, `niveau ${p.level}, ${p.hours} h`))))));
  } else if (closest) {
    body.push(h("p", { class: "card__sub" },
      `Prochain projet à portée : ${closest.title}. Il te manque ${missing(closest).map(n => `Ch${pad(n)}`).join(", ")}.`));
    body.push(h("button", { class: "btn", type: "button", onclick: () => openProject(closest.id) }, "Voir ce projet"));
  } else {
    body.push(h("p", { class: "card__sub" }, "Tous les projets sont faits. Invente le suivant."));
  }
  return h("section", { class: "card card--build glass" },
    h("h3", {}, "Prêt à construire"),
    h("p", { class: "card__sub" }, ready.length ? "Projets libres dont tu as fait les chapitres requis." : "Projets libres avec le kit."),
    ...body,
    h("a", { class: "textlink", href: "#/projets" }, "Tous les projets"),
  );
}

function quickCard() {
  return h("section", { class: "card card--quick glass" },
    h("h3", {}, "Sous la main"),
    h("p", { class: "card__sub" }, "Les trois documents qu'on rouvre le plus."),
    h("div", { class: "quick" },
      quickItem("/freenove/ESP32_Pinout_V3.0.png", "Pinout ESP32 v3.0", "Quelle broche fait quoi"),
      quickItem("/freenove/Part%20list.jpg", "Liste des pièces", "Ce qu'il y a dans la boîte"),
      quickItem("/schemas/ch1_composants_led.png", "Composants d'une LED", "Résistance, patte longue, sens"),
    ),
  );
}

const quickItem = (src, title, sub) =>
  h("a", { class: "quick__item", href: src, target: "_blank", rel: "noopener" },
    h("img", { src, alt: "", loading: "lazy" }), h("strong", {}, title), h("span", {}, sub));
