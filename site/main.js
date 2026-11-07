/* ---------- actions ---------- */

const LOCAL = ["127.0.0.1", "localhost"].includes(location.hostname);

function openResource(kind, num) { post("/api/open", { kind, chapter: num }); }

let toastTimer;
function toast(msg, win = false, badge = null) {
  const el = document.getElementById("toast");
  el.replaceChildren(...(badge ? [badgeImg(badge)] : []), msg);
  el.classList.toggle("toast--win", win);
  el.classList.toggle("toast--badge", !!badge);
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), win ? 5500 : 2600);
}

const syncMsg = data => data.synced_at
  ? `Synchronisé avec Obsidian à ${data.synced_at.slice(11)}.`
  : "Enregistré, mais la synchro Obsidian a échoué.";

async function setStatus(num, status) {
  const was = game();
  const before = state.progress[num];
  state.progress[num] = status;
  const fid = document.activeElement?.dataset?.fid;
  syncSegs();
  render(fid);
  try {
    const res = await post("/api/progress", { chapter: num, status });
    if (!res.ok) throw new Error();
    const data = await res.json();
    state.progress = data.progress;
    state.extra = data.extra;
    const r = reward(was, game());
    announce(r, `Ch${pad(num)} : ${STATUS[status]}.${r.text ? "" : ` ${syncMsg(data)}`}`);
    if (status === "done" && was.stats.done < game().stats.done) { sfx("win"); confetti(70); }
  } catch {
    state.progress[num] = before;
    toast("Échec de l'enregistrement. Le serveur local tourne-t-il ?");
  }
  syncSegs();
  render(fid);
}

async function setProjectStatus(id, status) {
  const fid = document.activeElement?.dataset?.fid;
  const ok = await saveExtra("projects", id, status, {});
  syncSegs();
  if (ok) render(fid);
}

async function saveExtra(section, key, value, { silent = false, rerender = false } = {}) {
  const was = game();
  try {
    const res = await post("/api/extra", { section, key, value });
    if (!res.ok) throw new Error();
    const data = await res.json();
    state.extra = data.extra;
    const r = reward(was, game());
    if (r.text) announce(r);
    else if (!silent || !data.synced_at) toast(syncMsg(data));
    if (rerender) render();
    return r;
  } catch {
    toast("Échec de l'enregistrement. Le serveur local tourne-t-il ?");
    return false;
  }
}

/* ---------- rendu global ---------- */

function route() {
  const key = location.hash.replace(/^#\/?/, "");
  return key in VIEWS ? key : "";
}

function render(focusId) {
  const key = route();
  document.getElementById("view-title").textContent = VIEWS[key].title;
  document.title = `${VIEWS[key].title} · ESP32 Académie`;

  document.querySelectorAll(".rail__link").forEach(a => {
    if (a.dataset.view === key) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  document.getElementById("rail-plus")?.classList.toggle("is-active", !!VIEWS[key].more);
  window.closeRailMore?.();

  const views = { "": renderHome, chapitres: renderChapters, projets: renderProjects, panier: renderCart, broches: renderPins, arene: renderArene, succes: renderSucces, docs: renderDocs };
  paintXp();
  document.getElementById("view").replaceChildren(views[key]());
  if (focusId) document.querySelector(`[data-fid="${focusId}"]`)?.focus();
}

// Mobile : la barre du haut se cache quand on descend et revient quand on remonte (elle prend 180 px d'écran).
function setupScrollChrome() {
  const bar = document.querySelector(".topbar");
  const phone = matchMedia("(max-width: 760px)");
  let last = scrollY;
  addEventListener("scroll", () => {
    const delta = scrollY - last;
    if (Math.abs(delta) < 8) return;
    last = scrollY;
    bar.classList.toggle("topbar--away", phone.matches && delta > 0 && scrollY > 120 && !bar.contains(document.activeElement));
  }, { passive: true });
  bar.addEventListener("focusin", () => bar.classList.remove("topbar--away"));
}

function setupChrome() {
  setupScrollChrome();
  document.getElementById("brand").innerHTML = art("brand");
  document.getElementById("search-icon").innerHTML = icon("search", "icon--sm");
  document.getElementById("btn-pdf").innerHTML = `${icon("book", "icon--sm")}Tutoriel PDF`;
  document.getElementById("btn-pdf").onclick = () => LOCAL ? post("/api/open", { kind: "pdf" }) : window.open("/freenove/C/C_Tutorial.pdf", "_blank");

  const rail = document.getElementById("rail-items");
  const nav = rail.closest(".rail");
  const more = h("div", { class: "rail__more", id: "rail-more" });
  for (const [key, v] of Object.entries(VIEWS)) {
    (v.more ? more : rail).append(h("a", {
      class: "rail__link", href: `#/${key}`, "data-view": key, "aria-label": v.title, title: v.title,
      html: `${art(v.art)}<span class="rail__label" aria-hidden="true">${v.label}</span>`,
    }));
  }
  const plus = h("button", {
    class: "rail__plus", type: "button", id: "rail-plus", "aria-label": "Plus de pages", "aria-expanded": "false", "aria-controls": "rail-more",
    html: `<span class="rail__plus-tile">${icon("dots")}</span><span class="rail__label" aria-hidden="true">Plus</span>`,
  });
  rail.append(more, plus);
  const setMore = open => { nav.classList.toggle("rail--more-open", open); plus.setAttribute("aria-expanded", String(open)); };
  plus.onclick = () => setMore(!nav.classList.contains("rail--more-open"));
  document.addEventListener("click", e => { if (!nav.contains(e.target)) setMore(false); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && nav.classList.contains("rail--more-open")) { setMore(false); plus.focus(); } });
  window.closeRailMore = () => setMore(false);

  const themeBtns = document.querySelectorAll("#theme-btn, #theme-btn-2");
  const paintTheme = () => {
    const dark = document.documentElement.dataset.theme === "dark";
    themeBtns.forEach(b => {
      b.innerHTML = art(dark ? "sun" : "moon");
      b.setAttribute("aria-label", dark ? "Passer au thème clair" : "Passer au thème sombre");
    });
  };
  themeBtns.forEach(b => b.onclick = () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("esp32-theme", next); } catch (e) {}
    paintTheme();
  });
  paintTheme();

  document.getElementById("search").addEventListener("input", e => {
    state.q = e.target.value.trim();
    if (route() === "" || route() === "broches") location.hash = "#/chapitres";
    else render();
  });
  window.addEventListener("hashchange", () => { render(); window.scrollTo({ top: 0 }); });
}

async function main() {
  setupChrome();
  try {
    const get = url => fetch(url).then(r => { if (!r.ok) throw new Error(url); return r.json(); });
    const [chapters, st, content] = await Promise.all([
      get("/api/chapters"), get("/api/state"), get("/api/content"),
    ]);
    state.chapters = chapters;
    state.progress = st.progress;
    state.extra = st.extra;
    state.content = content;
  } catch {
    document.getElementById("view").replaceChildren(h("div", { class: "empty glass" },
      "Le serveur local ne répond pas, ou un fichier de données est abîmé. Regarde /tmp/esp32-site.log puis recharge la page."));
    return;
  }
  render();
  fetch("/api/docs").then(r => r.json()).then(d => { state.docs = d; if (route() === "docs") render(); });
}

main();
