/* ---------- projets libres ---------- */

function renderProjects() {
  const list = state.content.projects
    .filter(p => !state.q || norm(`${p.title} ${p.summary} ${p.parts.join(" ")}`).includes(norm(state.q)))
    .sort((a, b) => projectCost(a).min - projectCost(b).min || missing(a).length - missing(b).length || a.level - b.level);

  const all = state.content.projects, count = s => all.filter(p => projectStatus(p.id) === s).length;
  const left = all.length - count("done");
  const frag = document.createDocumentFragment();
  frag.append(h("div", { class: "greet" },
    h("h2", {}, "Projets libres"),
    h("p", {}, "Des montages à inventer avec le kit, une fois les chapitres requis faits. Aucun n'est verrouillé : tu peux te lancer plus tôt."),
    h("p", { class: "projcount" },
      h("strong", {}, left ? `${left} projet${left > 1 ? "s" : ""} restant${left > 1 ? "s" : ""} à faire` : "Tous les projets sont faits"),
      ` sur ${all.length} (${count("done")} fait${count("done") > 1 ? "s" : ""}, ${count("doing")} en cours). Classés du moins cher au plus cher, d'après les achats indispensables.`)));

  if (!list.length) {
    frag.append(h("div", { class: "empty glass" }, "Aucun projet ne correspond à cette recherche."));
    return frag;
  }
  frag.append(h("div", { class: "chapters" }, list.map(projectCard)));
  return frag;
}

/* ---------- panier : tous les achats Amazon.fr des projets, sans doublon ---------- */

// shortcut: cases cochées gardées dans ce navigateur seulement (pas synchronisées entre appareils), à déplacer dans extra.json si ça gêne.
const CART_KEY = "esp32-panier";
const cartChecked = () => { try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch (e) { return {}; } };
function cartToggle(asin) {
  const c = cartChecked();
  if (c[asin]) delete c[asin]; else c[asin] = true;
  try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch (e) {}
  render(asin);
}

function cartItems() {
  const items = new Map();
  for (const p of state.content.projects) for (const b of p.buy || []) {
    const it = items.get(b.asin) || { ...b, optional: true, projects: [] };
    it.optional = it.optional && !!b.optional; // indispensable dès qu'un projet l'exige
    it.projects.push(p);
    items.set(b.asin, it);
  }
  return [...items.values()];
}

// Photo hébergée par Amazon (m.media-amazon.com), repérée par son identifiant dans products.json. Hors ligne, la case vide reste.
const cartPhoto = i => h("a", { class: "cart__photo", href: i.url, target: "_blank", rel: "noopener noreferrer", tabindex: "-1", "aria-hidden": "true" },
  h("img", { src: `https://m.media-amazon.com/images/I/${encodeURIComponent(i.img)}._AC_UL320_.jpg`, alt: "", width: 96, height: 96,
    loading: "lazy", referrerpolicy: "no-referrer", onerror: e => e.target.remove() }));

const cartRow = (i, done) => h("li", { class: `cart__row${done[i.asin] ? " cart__row--done" : ""}` },
  cartPhoto(i),
  h("div", { class: "cart__info" },
    h("label", { class: "cart__check" },
      h("input", { type: "checkbox", checked: !!done[i.asin], "data-fid": i.asin, onchange: () => cartToggle(i.asin) }),
      h("span", {}, h("strong", {}, `${i.qty} × ${i.name}`), i.optional && h("span", { class: "badge" }, "facultatif"))),
    buyLine(i),
    h("p", { class: "ch__note" }, "Pour : ", i.projects.map((p, n) => [n ? ", " : "",
      h("button", { class: "linkbtn", type: "button", onclick: () => openProject(p.id) }, p.title)]))));

function renderCart() {
  const items = cartItems(), done = cartChecked();
  const left = items.filter(i => !done[i.asin]);
  const sum = list => list.reduce((s, i) => s + priceOf(i), 0);
  const need = left.filter(i => !i.optional);
  const group = (title, list) => list.length ? section(`${title} (${list.length})`, h("ul", { class: "cart" }, list.map(i => cartRow(i, done)))) : null;

  const frag = document.createDocumentFragment();
  frag.append(
    h("div", { class: "greet" },
      h("h2", {}, "Panier de l'atelier"),
      h("p", {}, "Tous les articles Amazon.fr des projets libres, regroupés. Un article utilisé par plusieurs projets n'apparaît qu'une fois."),
      h("p", { class: "projcount" },
        h("strong", {}, `Il reste ${euro(sum(need))} à acheter`),
        ` pour les indispensables (${need.length} article${need.length > 1 ? "s" : ""}), ${euro(sum(left))} avec les facultatifs. Coche ce que tu as déjà acheté ou que tu possèdes. Prix relevés les 6 et 7 novembre 2026, ils changent.`)),
    h("div", { class: "glass cart__box" },
      group("Indispensables", items.filter(i => !i.optional)),
      group("Facultatifs", items.filter(i => i.optional))));
  return frag;
}

const LEVEL_NAMES = ["Débutant", "Intermédiaire", "Avancé"];
const levelDots = level => h("span", { class: `level level--${level}`, role: "img", "aria-label": `Niveau ${level} sur 3, ${LEVEL_NAMES[level - 1].toLowerCase()}`,
  html: `${art(`niveau-${level}`, "level__ico")}<span>Niveau ${level}</span>` });

function requireChips(p) {
  return h("div", { class: "reqs" }, p.requires.map(n => h("button", {
    type: "button", class: `req req--${statusOf(n)}`, title: chapterTitle(n),
    onclick: () => openChapter(n),
  }, `Ch${pad(n)} ${statusOf(n) === "done" ? "fait" : "à faire"}`)));
}

/* Prix saisis comme "19,92 €" : on les lit ici, pour n'avoir qu'une seule source. */
const euro = n => `${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 }).format(n)} €`;
const priceOf = b => parseFloat(b.price.replace(",", ".")) * b.qty;
function projectCost(p) {
  const buy = p.buy || [];
  const min = buy.filter(b => !b.optional).reduce((s, b) => s + priceOf(b), 0);
  return { min, all: buy.reduce((s, b) => s + priceOf(b), 0) };
}

const craftChips = p => h("div", { class: "craft" },
  h("span", { class: `badge ${p.buy ? "badge--warn" : "badge--ok"}`, title: p.buy ? "Achats indispensables sur Amazon.fr" : "Que des pièces du kit" },
    `Coût : ${euro(projectCost(p).min)}`),
  [["Soudure", p.solder], ["Impression 3D", p.print3d]]
    .map(([label, v]) => h("span", { class: `badge${v === "non" ? "" : " badge--warn"}` }, `${label} : ${v}`)),
  p.video && h("span", { class: "badge" }, "D'après une vidéo"));

const WIRE_KINDS = { pwr: "alimentation", gnd: "masse", data: "données", i2c: "I2C données (SDA)", clk: "horloge" };

const videoSection = p => {
  const v = p.video, url = `https://youtu.be/${v.id}`;
  return section("Vidéo source",
    h("a", { class: "vid", href: url, target: "_blank", rel: "noopener noreferrer", "aria-label": `Regarder la vidéo : ${v.title}` },
      h("img", { src: `/${p.real}`, alt: "", width: 640, height: 360, loading: "lazy" })),
    h("p", { class: "ch__note" }, extLink(url, v.title), ` · ${v.channel} · ${v.duration} · ${v.date} · ${v.views}`),
    h("p", { class: "ch__note" }, `Carte : ${p.board}`));
};

const wiringSection = w => section("Câblage",
  h("p", { class: "ch__note" }, `${w.board} vers les composants`),
  h("ul", { class: "wiring" }, w.rows.map(([pin, part, kind]) => h("li", { class: `wire wire--${kind}` },
    h("span", { class: "wire__pin" }, pin), h("span", { class: "wire__line", "aria-hidden": "true", title: WIRE_KINDS[kind] }), h("span", {}, part)))),
  h("p", { class: "ch__note" }, "Fil gris : masse. Rouge : alimentation. Orange : données. Bleu : I2C SDA. Vert : I2C SCL ou horloge."),
  w.note && h("p", { class: "ch__note" }, w.note));

const softwareSection = list => section("Logiciels à installer",
  h("ul", { class: "buy" }, list.map(s => h("li", {}, h("strong", {}, extLink(s.url, s.name)), h("p", { class: "ch__note" }, s.note)))));
const projectImg = p => h("img", { class: "proj__img", src: `/${p.image}`, alt: "", width: 640, height: 360, loading: "lazy" });
const extLink = (href, text) => h("a", { href, target: "_blank", rel: "noopener noreferrer" }, text);

// Prix, note, lien Amazon.fr et variante d'un article : même ligne dans le panier et dans la fiche d'un projet.
const buyLine = (b, withNote) => h("p", { class: "ch__note" }, `${b.price} · ${b.rating}. `, withNote && b.note && `${b.note} `,
  extLink(b.url, "Voir sur Amazon.fr"), b.alt && [" · ", extLink(b.alt.url, `${b.alt.name} (${b.alt.price}, ${b.alt.rating})`)]);

const buySection = buy => section("À acheter sur Amazon.fr",
  h("ul", { class: "buy" }, buy.map(b => h("li", {},
    h("strong", {}, `${b.qty} × ${b.name}`), b.optional && h("span", { class: "badge" }, "facultatif"),
    buyLine(b, true)))),
  h("p", { class: "ch__note" }, h("strong", {}, `Achats indispensables : ${euro(projectCost({ buy }).min)}.`),
    ` Avec tous les articles facultatifs : ${euro(projectCost({ buy }).all)}.`),
  h("p", { class: "ch__note" }, "Prix et notes relevés sur Amazon.fr les 6 et 7 novembre 2026. Ils changent : vérifie le produit avant d'acheter."));

function projectCard(p) {
  const lacking = missing(p);
  return h("article", { class: `ch glass ch--${projectStatus(p.id)}` },
    projectImg(p),
    h("div", { class: "ch__body" },
      h("div", { class: "proj__meta" }, levelDots(p.level), h("span", {}, `${p.hours} h environ`),
        h("span", { class: `badge${lacking.length ? "" : " badge--ok"}` }, lacking.length ? `${lacking.length} chapitre${lacking.length > 1 ? "s" : ""} à faire` : "Prêt à construire")),
      h("h3", { class: "ch__title" },
        h("button", { class: "ch__open", type: "button", onclick: () => openProject(p.id) }, p.title)),
      h("p", { class: "ch__note" }, p.summary),
      craftChips(p),
      requireChips(p),
      h("div", { class: "ch__foot" }, segmented("project", p.id)),
    ));
}
