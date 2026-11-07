#!/usr/bin/env python3
"""Site local de suivi ESP32 : sert les pages, stocke l'avancement, et le
synchronise dans le vault Obsidian Jarvis (wiki/plan/esp32-progression.md).
Lancer avec: python3 server.py (puis ouvrir http://127.0.0.1:8743/)
"""
import json
import mimetypes
import os
import re
import subprocess
import threading
from datetime import date, datetime, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse, urlsplit

BASE_DIR = Path(__file__).resolve().parent.parent
SITE_DIR = BASE_DIR / "site"
SCHEMAS_DIR = BASE_DIR / "schemas"
CODE_DIR = BASE_DIR / "Code"
FREENOVE_ROOT = BASE_DIR / "Freenove_Ultimate_Starter_Kit_for_ESP32-master"
SKETCHES_DIR = FREENOVE_ROOT / "C" / "Sketches"
TUTORIAL_PDF = FREENOVE_ROOT / "C" / "C_Tutorial.pdf"
CODE_DIRS = {"Sketches", "Libraries", "Processing", "Python_Codes", "Python_Libraries"}
DOC_EXTS = {".pdf", ".jpg", ".jpeg", ".png"}
DRIVER_EXTS = {".zip", ".exe"}
CHAPTERS_FILE = SITE_DIR / "chapters.json"
PROGRESS_FILE = SITE_DIR / "progress.json"
EXTRA_FILE = SITE_DIR / "extra.json"
CONTENT_DIR = SITE_DIR / "content"
VAULT_NOTE = Path(
    "/Users/jo/Library/Mobile Documents/iCloud~md~obsidian/Documents/Jarvis Vault/wiki/plan/esp32-progression.md"
)

STATUS_LABELS = {"todo": "À faire", "doing": "En cours", "done": "Fait"}
CHAPTERS = json.loads(CHAPTERS_FILE.read_text(encoding="utf-8"))
CHAPTER_NUMS = {str(c["num"]) for c in CHAPTERS}
SECRET_LINE = re.compile(r"(ssid|passw|psk|token|api_?key|softap|wifi\.begin)", re.I)
CODE_SUFFIXES = {".ino", ".h", ".cpp", ".c", ".py", ".html"}
STATIC_FILES = {
    "index.html": "text/html; charset=utf-8",
    "game.js": "application/javascript; charset=utf-8",
    "core.js": "application/javascript; charset=utf-8",
    "home.js": "application/javascript; charset=utf-8",
    "chapters.js": "application/javascript; charset=utf-8",
    "shop.js": "application/javascript; charset=utf-8",
    "reference.js": "application/javascript; charset=utf-8",
    "dialog.js": "application/javascript; charset=utf-8",
    "main.js": "application/javascript; charset=utf-8",
    "style.css": "text/css; charset=utf-8",
    "manifest.webmanifest": "application/manifest+json; charset=utf-8",
    "traces.svg": "image/svg+xml",
}
MAX_BODY = 64_000
ALLOWED_HOSTS = {"127.0.0.1", "localhost", "::1"}  # main() y ajoute l'IP Tailscale
LOCK = threading.Lock()  # un seul « lire, modifier, écrire » à la fois


def read_json(path: Path, default):
    # Un fichier absent donne la valeur par défaut ; un fichier abîmé lève une erreur
    # plutôt que d'être pris pour un fichier vide et écrasé au prochain enregistrement.
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return default


def write_text_atomic(path: Path, text: str) -> None:
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_text(text, encoding="utf-8")
    os.replace(tmp, path)


def load_progress() -> dict:
    data = read_json(PROGRESS_FILE, {})
    for ch in CHAPTERS:
        data.setdefault(str(ch["num"]), "todo")
    return data


def save_progress(progress: dict) -> None:
    write_text_atomic(PROGRESS_FILE, json.dumps(progress, ensure_ascii=False, indent=2))


def load_extra() -> dict:
    extra = read_json(EXTRA_FILE, {})
    for key, empty in (("notes", {}), ("dates", {}), ("parts", {}), ("bonus", {}), ("quiz", {}), ("projects", {}),
                       ("activity", []), ("daily", {}), ("play", {}), ("earned", {})):
        extra.setdefault(key, empty)
    extra["play"].setdefault("boss", {})
    extra["play"].setdefault("survival", 0)
    return extra


def save_extra(extra: dict) -> None:
    write_text_atomic(EXTRA_FILE, json.dumps(extra, ensure_ascii=False, indent=2))


def load_content() -> dict:
    out = {"chapters": {}, "projects": [], "pins": {}, "board": {}, "worlds": []}
    for f in sorted(CONTENT_DIR.glob("ch*.json")):
        out["chapters"].update(read_json(f, {}))
    out["projects"] = read_json(CONTENT_DIR / "projects.json", [])
    # Un produit est décrit une seule fois (products.json) ; chaque projet n'y renvoie que par son ASIN.
    products = read_json(CONTENT_DIR / "products.json", {})
    for p in out["projects"]:
        for i, b in enumerate(p.get("buy", [])):
            p["buy"][i] = {**products[b["asin"]], **b, "url": f"https://www.amazon.fr/dp/{b['asin']}"}
    out["pins"] = read_json(CONTENT_DIR / "pins.json", {})
    out["board"] = read_json(CONTENT_DIR / "board.json", {})
    out["worlds"] = read_json(CONTENT_DIR / "worlds.json", [])
    return out


def rhythm(progress: dict, extra: dict) -> dict:
    today = date.today()
    days = {date.fromisoformat(d) for d in extra["activity"]}
    cursor = today if today in days else today - timedelta(days=1)
    streak = 0
    while cursor in days:
        streak += 1
        cursor -= timedelta(days=1)

    done_dates = sorted(date.fromisoformat(d) for n, d in extra["dates"].items() if progress.get(n) == "done")
    per_week = eta = None
    if len(done_dates) >= 2:
        weeks = max(((today - done_dates[0]).days + 1) / 7, 1)  # jusqu'à aujourd'hui : les pauses comptent
        per_week = round(len(done_dates) / weeks, 1)
        remaining = sum(1 for v in progress.values() if v != "done")
        eta = (today + timedelta(weeks=remaining / per_week)).isoformat() if remaining and per_week else None
    return {"streak": streak, "dated": len(done_dates), "per_week": per_week, "eta": eta}


def touch(extra: dict) -> None:
    today = date.today().isoformat()
    if today not in extra["activity"]:
        extra["activity"].append(today)


def is_int(v) -> bool:
    return type(v) is int


def bump(extra: dict, kind: str, n: int = 1) -> None:
    """Compteurs du jour : ils servent aux quêtes quotidiennes et hebdomadaires du site."""
    if n > 0:
        touch(extra)
        day = extra["daily"].setdefault(date.today().isoformat(), {})
        day[kind] = day.get(kind, 0) + n


def unbump(extra: dict, kind: str, day: str, n: int = 1) -> None:
    """Retire un point de quête gagné le jour `day` (action annulée)."""
    counts = extra["daily"].get(day)
    if counts and counts.get(kind, 0) > 0:
        counts[kind] = max(counts[kind] - n, 0)
        if not counts[kind]:
            del counts[kind]
        if not counts:
            del extra["daily"][day]


def earn(extra: dict, kind: str, key: str) -> None:
    """Compte un point une seule fois et note le jour : `unearn` le retire si l'action est annulée."""
    if key not in extra["earned"]:
        extra["earned"][key] = date.today().isoformat()
        bump(extra, kind)


def unearn(extra: dict, kind: str, key: str) -> None:
    day = extra["earned"].pop(key, None)
    if day:
        unbump(extra, kind, day)


def recount_chapters(extra: dict, progress: dict) -> None:
    """Quêtes « chapitre » = chapitres réellement terminés, par jour : décocher un chapitre retire ses points."""
    per_day: dict[str, int] = {}
    for num, day in extra["dates"].items():
        if progress.get(num) == "done":
            per_day[day] = per_day.get(day, 0) + 1
    for day in set(per_day) | set(extra["daily"]):
        counts = extra["daily"].setdefault(day, {})
        if per_day.get(day):
            counts["chapter"] = per_day[day]
        else:
            counts.pop("chapter", None)
        if not counts:
            del extra["daily"][day]


def better_quiz(old: dict | None, score: int, total: int) -> bool:
    """Le meilleur score reste : refaire un quiz plus mal ne fait jamais perdre d'XP."""
    if not old:
        return True
    gain = score * old["total"] - old["score"] * total  # compare les proportions sans division
    return gain > 0 or (gain == 0 and total > old["total"])


def apply_play(extra: dict, mode: str, value) -> bool:
    if not isinstance(value, dict):
        return False
    score, total = value.get("score"), value.get("total")
    if mode == "survival":
        run = value.get("run")
        if not (is_int(run) and 0 <= run <= 500):
            return False
        extra["play"]["survival"] = max(extra["play"]["survival"], run)
        bump(extra, "survival")
        bump(extra, "correct", min(run, 30))
        return True
    if not (is_int(score) and is_int(total) and 0 <= score <= total <= 30 and total > 0):
        return False
    if mode == "review" or mode == "daily":
        bump(extra, mode)
        bump(extra, "correct", score)
        return True
    if mode == "boss":
        world = str(value.get("world"))
        if world not in {str(w["id"]) for w in read_json(CONTENT_DIR / "worlds.json", [])}:
            return False
        bump(extra, "boss")
        bump(extra, "correct", score)
        if value.get("won") is True and world not in extra["play"]["boss"]:
            extra["play"]["boss"][world] = {"score": score, "total": total, "date": date.today().isoformat()}
        return True
    return False


def apply_extra(extra: dict, section: str, key: str, value) -> bool:
    if section == "play":
        return apply_play(extra, key, value)

    if section == "projects":
        ids = {p.get("id") for p in read_json(CONTENT_DIR / "projects.json", [])}
        if key not in ids or not isinstance(value, str) or value not in STATUS_LABELS:
            return False
        if value == "todo":
            extra["projects"].pop(key, None)
        else:
            extra["projects"][key] = value
            touch(extra)
        return True

    if key not in CHAPTER_NUMS:
        return False
    if section == "notes" and isinstance(value, str):
        text = value.strip()[:4000]
        if text:
            extra["notes"][key] = text
            touch(extra)
            earn(extra, "note", f"note:{key}")
        else:
            extra["notes"].pop(key, None)
            unearn(extra, "note", f"note:{key}")
    elif section == "parts" and isinstance(value, dict) and len(value) <= 40:
        old = set(extra["parts"].get(key, {}))
        extra["parts"][key] = {str(k)[:80]: True for k, v in value.items() if v is True}
        new = set(extra["parts"][key])
        for name in new - old:
            touch(extra)
            earn(extra, "parts", f"parts:{key}:{name}")
        for name in old - new:
            unearn(extra, "parts", f"parts:{key}:{name}")
    elif section == "bonus" and isinstance(value, bool):
        if value:
            extra["bonus"][key] = True
            touch(extra)
            earn(extra, "bonus", f"bonus:{key}")
        else:
            extra["bonus"].pop(key, None)
            unearn(extra, "bonus", f"bonus:{key}")
    elif section == "quiz" and isinstance(value, dict):
        score, total = value.get("score"), value.get("total")
        if not (is_int(score) and is_int(total) and 0 <= score <= total <= 30 and total > 0):
            return False
        old = extra["quiz"].get(key)
        bump(extra, "quiz")
        bump(extra, "correct", score)
        extra["quiz"][key] = {
            **({"score": score, "total": total} if better_quiz(old, score, total) else {"score": old["score"], "total": old["total"]}),
            "tries": (old or {}).get("tries", 0) + 1,
            "date": date.today().isoformat(),
        }
    else:
        return False
    return True


def state_payload() -> dict:
    progress, extra = load_progress(), load_extra()
    # « today » : le navigateur compte les jours comme le serveur, même dans un autre fuseau horaire
    return {"progress": progress, "extra": {**extra, "rhythm": rhythm(progress, extra), "today": date.today().isoformat()}}


def sync_obsidian() -> str:
    progress, extra = load_progress(), load_extra()
    counts = {"todo": 0, "doing": 0, "done": 0}
    for v in progress.values():
        counts[v] = counts.get(v, 0) + 1
    total = len(CHAPTERS)
    pct = round(100 * counts["done"] / total) if total else 0
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    rh = rhythm(progress, extra)
    content = load_content()

    lines = [
        "---",
        "tags: [esp32, suivi, auto]",
        "---",
        "",
        "# ESP32 — plan & progression (auto)",
        "",
        "> Généré automatiquement par le site de suivi local (`site/server.py`) à chaque modification. "
        "Ne pas éditer à la main : ce fichier sera écrasé. Le récit détaillé reste dans [[esp32]].",
        "",
        f"Dernière synchro : {now}",
        "",
        f"**Avancement : {counts['done']} / {total} chapitres terminés ({pct}%)**",
        "",
        "```chart",
        json.dumps(
            {
                "type": "bar",
                "title": "Avancement ESP32",
                "labels": ["Fait", "En cours", "À faire"],
                "values": [counts["done"], counts["doing"], counts["todo"]],
            },
            ensure_ascii=False,
        ),
        "```",
        "",
        "## Rythme",
        "",
        f"- Série : {rh['streak']} jour(s) d'activité d'affilée",
    ]
    if rh["per_week"]:
        lines.append(f"- Rythme : {rh['per_week']} chapitre(s) par semaine (sur {rh['dated']} chapitres datés)")
        if rh["eta"]:
            lines.append(f"- Fin estimée du parcours : {rh['eta']}")
    else:
        lines.append("- Rythme : pas encore assez de chapitres datés (il en faut 2 terminés depuis la mise en place du suivi)")

    lines += ["", "## Chapitres", ""]
    for ch in CHAPTERS:
        n = str(ch["num"])
        status = progress.get(n, "todo")
        box = "x" if status == "done" else " "
        bits = []
        if status == "doing":
            bits.append("en cours")
        if n in extra["dates"] and status == "done":
            bits.append(f"fait le {extra['dates'][n]}")
        q = extra["quiz"].get(n)
        if q:
            bits.append(f"quiz {q['score']}/{q['total']}")
        if extra["bonus"].get(n):
            bits.append("défi réussi")
        suffix = f" *({', '.join(bits)})*" if bits else ""
        lines.append(f"- [{box}] Ch{ch['num']:02d} — {ch['title']}{suffix}")

    if content["projects"]:
        lines += ["", "## Projets libres", ""]
        for p in content["projects"]:
            st = extra["projects"].get(p["id"], "todo")
            box = "x" if st == "done" else " "
            suffix = " *(en cours)*" if st == "doing" else ""
            lines.append(f"- [{box}] {p['title']} (niveau {p['level']}, ~{p['hours']} h){suffix}")

    if extra["notes"]:
        lines += ["", "## Notes de chapitre", ""]
        for ch in CHAPTERS:
            text = extra["notes"].get(str(ch["num"]))
            if text:
                lines.append(f"### Ch{ch['num']:02d} — {ch['title']}")
                lines += [f"> {row}" if row.strip() else ">" for row in text.splitlines()]
                lines.append("")

    lines += ["", "Retour : [[esp32]]", ""]
    write_text_atomic(VAULT_NOTE, "\n".join(lines))
    return now


def try_sync() -> str | None:
    """Les données sont déjà enregistrées : un vault absent ne doit pas faire échouer la requête."""
    try:
        return sync_obsidian()
    except OSError:
        return None


def categorize(rel: str) -> str:
    low = rel.lower()
    if low.startswith("ch340/"):
        return "drivers"
    if "part list" in low:
        return "parts"
    if "pinout" in low:
        return "pinouts"
    if low.startswith("datasheet/"):
        return "datasheets"
    return "manuals"


def scan_docs() -> list[dict]:
    docs = []
    for p in sorted(FREENOVE_ROOT.rglob("*")):
        rel = p.relative_to(FREENOVE_ROOT)
        if not p.is_file() or p.name.startswith(".") or CODE_DIRS & set(rel.parts[:-1]):
            continue
        ext = p.suffix.lower()
        if ext not in DOC_EXTS | DRIVER_EXTS:
            continue
        # les sous-dossiers de CH340/ (driver Mac déjà dézippé) ne sont pas des docs
        if ext in DRIVER_EXTS and not str(rel).lower().startswith("ch340/"):
            continue
        docs.append({
            "category": categorize(str(rel)),
            "path": str(rel),
            "title": p.stem.replace("_", " "),
            "group": rel.parts[-2] if len(rel.parts) > 2 and rel.parts[0] == "Datasheet" else None,
            "image": ext in {".jpg", ".jpeg", ".png"},
        })
    return docs


def read_sources(folder: Path) -> list[dict]:
    files = []
    for p in sorted(folder.rglob("*")):
        if p.suffix not in CODE_SUFFIXES or not p.is_file() or p.name == "camera_pins.h" or p.stat().st_size > 60_000:
            continue
        text = p.read_text(encoding="utf-8", errors="replace")
        # le sketch web perso contient des identifiants Wi-Fi : on masque les littéraux de ces lignes
        text = "\n".join(
            re.sub(r'"[^"]*"', '"…"', row) if SECRET_LINE.search(row) else row for row in text.splitlines()
        )
        files.append({"name": str(p.relative_to(folder)), "text": text})
    return files


def code_for(num: int) -> dict:
    ch = next((c for c in CHAPTERS if c["num"] == num), None)
    perso = read_sources(CODE_DIR / ch["code"]) if ch and ch.get("code") else []
    freenove = []
    for folder in sorted(SKETCHES_DIR.glob(f"Sketch_{num:02d}.*")):
        freenove += [{**f, "name": f"{folder.name}/{f['name']}"} for f in read_sources(folder)]
    return {"perso": perso, "freenove": freenove}


def safe_open(paths: list[Path]) -> None:
    for p in paths:
        resolved = p.resolve()
        if not resolved.is_relative_to(BASE_DIR.resolve()):
            continue
        if resolved.exists():
            subprocess.run(["open", str(resolved)], check=False)


class Handler(BaseHTTPRequestHandler):
    timeout = 10  # un client qui n'envoie plus rien ne garde pas son thread

    def _send_json(self, payload, status: int = 200) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _host_ok(self) -> bool:
        """Refuse un en-tête Host étranger : sinon une page piégée (DNS rebinding) parlerait au serveur comme à son propre site."""
        try:
            host = urlsplit("//" + self.headers.get("Host", "")).hostname
        except ValueError:
            host = None
        if host in ALLOWED_HOSTS:
            return True
        self._send_json({"error": "hôte refusé"}, 403)
        return False

    def _send_file(self, path: Path, content_type: str, cache: bool = False) -> None:
        data = path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        if cache:  # PDF, pinouts, schémas : ils ne changent pas
            self.send_header("Cache-Control", "max-age=86400")
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, fmt, *args):  # quieter console
        pass

    def do_GET(self):
        if not self._host_ok():
            return
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        if path == "/":
            path = "/index.html"

        if path == "/api/state":
            self._send_json(state_payload())
            return

        if path == "/api/content":
            self._send_json(load_content())
            return

        if path == "/api/code":
            try:
                num = int(parse_qs(parsed.query).get("chapter", [""])[0])
            except ValueError:
                self._send_json({"error": "chapitre invalide"}, 400)
                return
            self._send_json(code_for(num))
            return

        if path == "/api/chapters":
            self._send_json(CHAPTERS)
            return

        if path == "/api/docs":
            self._send_json(scan_docs())
            return

        if path.startswith("/freenove/"):
            f = (FREENOVE_ROOT / path[len("/freenove/"):]).resolve()
            # mêmes types que la liste des docs : les sketches (identifiants Wi-Fi) ne sortent que masqués par /api/code
            if f.is_file() and f.suffix.lower() in DOC_EXTS | DRIVER_EXTS and f.is_relative_to(FREENOVE_ROOT.resolve()):
                self._send_file(f, mimetypes.guess_type(f.name)[0] or "application/octet-stream", cache=True)
                return
            self.send_error(404)
            return

        image_mimes = {".webp": "image/webp", ".png": "image/png"}
        for prefix, exts in (("/badges/", {".webp"}), ("/projets/", {".webp"}), ("/icons/", {".webp", ".png"})):
            if path.startswith(prefix):
                folder = SITE_DIR / prefix.strip("/")
                f = folder / path[len(prefix):]
                if f.suffix in exts and f.is_file() and f.resolve().parent == folder.resolve():
                    self._send_file(f, image_mimes[f.suffix], cache=True)
                    return
                self.send_error(404)
                return

        if path.startswith("/schemas/"):
            f = SCHEMAS_DIR / path[len("/schemas/"):]
            if f.exists() and f.resolve().parent == SCHEMAS_DIR.resolve():
                self._send_file(f, "image/png")  # pas de cache : les schémas peuvent être refaits
                return
            self.send_error(404)
            return

        if path.lstrip("/") in STATIC_FILES:
            self._send_file(SITE_DIR / path.lstrip("/"), STATIC_FILES[path.lstrip("/")])
            return

        self.send_error(404)

    def do_POST(self):
        if not self._host_ok():
            return
        path = unquote(urlparse(self.path).path)
        # JSON exigé : un formulaire ou un fetch venu d'un autre site ne peut pas l'envoyer sans autorisation préalable.
        if not self.headers.get("Content-Type", "").startswith("application/json"):
            self._send_json({"error": "JSON attendu"}, 415)
            return
        try:
            length = int(self.headers.get("Content-Length", 0))
        except ValueError:
            length = -1
        if not 0 <= length <= MAX_BODY:
            self._send_json({"error": "taille invalide"}, 400)
            return
        try:
            body = json.loads(self.rfile.read(length) or b"{}")
        except ValueError:  # JSON abîmé ou octets non UTF-8
            body = None
        if not isinstance(body, dict):
            self._send_json({"error": "JSON invalide"}, 400)
            return

        if path == "/api/progress":
            num = str(body.get("chapter"))
            status = body.get("status")
            if not isinstance(status, str) or status not in STATUS_LABELS or num not in CHAPTER_NUMS:
                self._send_json({"error": "statut ou chapitre invalide"}, 400)
                return
            with LOCK:
                progress, extra = load_progress(), load_extra()
                progress[num] = status
                if status == "done":
                    extra["dates"].setdefault(num, date.today().isoformat())
                else:
                    extra["dates"].pop(num, None)
                recount_chapters(extra, progress)
                if status != "todo":
                    touch(extra)
                save_progress(progress)
                save_extra(extra)
                payload = {**state_payload(), "synced_at": try_sync()}
            self._send_json(payload)
            return

        if path == "/api/extra":
            with LOCK:
                extra = load_extra()
                if not apply_extra(extra, str(body.get("section")), str(body.get("key")), body.get("value")):
                    self._send_json({"error": "valeur invalide"}, 400)
                    return
                save_extra(extra)
                payload = {**state_payload(), "synced_at": try_sync()}
            self._send_json(payload)
            return

        if path == "/api/open":
            if self.client_address[0] not in ("127.0.0.1", "::1"):
                self._send_json({"error": "ouverture réservée au Mac"}, 403)
                return
            kind = body.get("kind")
            num = body.get("chapter")
            if kind == "pdf":
                safe_open([TUTORIAL_PDF])
            elif kind == "code" and num is not None:
                ch = next((c for c in CHAPTERS if c["num"] == num), None)
                if ch and ch.get("code"):
                    safe_open([CODE_DIR / ch["code"]])
            elif kind == "freenove" and is_int(num):
                matches = sorted(SKETCHES_DIR.glob(f"Sketch_{num:02d}.*"))
                safe_open(matches)
            self._send_json({"ok": True})
            return

        self.send_error(404)


def tailscale_ip():
    for cmd in ("tailscale", "/Applications/Tailscale.app/Contents/MacOS/Tailscale"):
        try:
            out = subprocess.run([cmd, "ip", "-4"], capture_output=True, text=True, timeout=5).stdout.split()
            if out:
                return out[0]
        except (OSError, subprocess.SubprocessError):
            pass
    return None


if __name__ == "__main__":
    port = 8743
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"ESP32 — site de suivi sur http://127.0.0.1:{port}/")
    # Tailscale seulement (jamais 0.0.0.0) : le Wi-Fi local ne voit pas le site.
    ts = tailscale_ip()
    try:
        if not ts:
            raise OSError("Tailscale introuvable")
        remote = ThreadingHTTPServer((ts, port), Handler)
        ALLOWED_HOSTS.add(ts)
        threading.Thread(target=remote.serve_forever, daemon=True).start()
        print(f"Tailscale : http://{ts}:{port}/")
    except OSError as e:
        print(f"Accès téléphone désactivé ({e}). Lance Tailscale puis relance le serveur.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
