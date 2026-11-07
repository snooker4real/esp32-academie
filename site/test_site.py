#!/usr/bin/env python3
"""Vérifications du site : python3 test_site.py (ne touche ni progress.json ni extra.json ni le vault)."""
import sys
sys.dont_write_bytecode = True

import http.client
import json
import re
import tempfile
import threading
from datetime import date, timedelta
from http.server import ThreadingHTTPServer
from pathlib import Path

import server

SITE_JS = ("game.js", "core.js", "home.js", "chapters.js", "shop.js", "reference.js", "dialog.js", "main.js")
CONTENT = server.load_content()
CHAPTERS = {str(c["num"]) for c in server.CHAPTERS}


def new_extra():
    return {"notes": {}, "dates": {}, "parts": {}, "bonus": {}, "quiz": {}, "projects": {}, "activity": [],
            "daily": {}, "play": {"boss": {}, "survival": 0}, "earned": {}}


def days_ago(n):
    return (date.today() - timedelta(days=n)).isoformat()


def test_streak_counts_consecutive_days():
    extra = {"activity": [days_ago(2), days_ago(1), days_ago(0)], "dates": {}}
    assert server.rhythm({}, extra)["streak"] == 3


def test_streak_survives_until_end_of_today():
    extra = {"activity": [days_ago(2), days_ago(1)], "dates": {}}
    assert server.rhythm({}, extra)["streak"] == 2
    assert server.rhythm({}, {"activity": [days_ago(3)], "dates": {}})["streak"] == 0


def test_rate_counts_idle_days():
    progress = {str(n): "done" for n in (1, 2, 3)}
    dates = {"1": days_ago(60), "2": days_ago(59), "3": days_ago(58)}
    r = server.rhythm(progress, {"activity": [], "dates": dates})
    assert r["per_week"] < 1, r  # 3 chapitres en 61 jours, pas 3 par semaine


def test_apply_extra_rejects_bad_values():
    extra = new_extra()
    assert not server.apply_extra(extra, "quiz", "1", {"score": 3, "total": 2})
    assert not server.apply_extra(extra, "quiz", "1", {"score": -1, "total": 2})
    assert not server.apply_extra(extra, "quiz", "999", {"score": 1, "total": 2})
    assert not server.apply_extra(extra, "projects", "inconnu", "done")
    assert not server.apply_extra(extra, "bonus", "1", "oui")
    assert server.apply_extra(extra, "quiz", "1", {"score": 2, "total": 2})
    assert extra["quiz"]["1"]["score"] == 2


def test_corrupt_file_is_not_treated_as_empty():
    with tempfile.TemporaryDirectory() as d:
        p = Path(d) / "x.json"
        assert server.read_json(p, {"vide": True}) == {"vide": True}
        p.write_text("{", encoding="utf-8")
        try:
            server.read_json(p, {})
        except json.JSONDecodeError:
            return
        raise AssertionError("un JSON abîmé doit lever une erreur")


def test_atomic_write_replaces_file():
    with tempfile.TemporaryDirectory() as d:
        p = Path(d) / "x.json"
        server.write_text_atomic(p, "a")
        server.write_text_atomic(p, "b")
        assert p.read_text() == "b" and not list(Path(d).glob("*.tmp"))


def test_wifi_literals_are_masked():
    with tempfile.TemporaryDirectory() as d:
        (Path(d) / "wifi.ino").write_text('const char* WIFI_SSID = "ReseauFictif";\nWiFi.softAP("Point","fictif1234");\nint led = 2;\n', encoding="utf-8")
        text = server.read_sources(Path(d))[0]["text"]
    assert "ReseauFictif" not in text and "fictif1234" not in text
    assert "int led = 2;" in text  # seules les lignes sensibles sont masquées


def test_content_links_are_valid():
    for p in CONTENT["projects"]:
        assert all(str(n) in CHAPTERS for n in p["requires"]), p["id"]
        assert p["solder"] in ("non", "oui") and p["print3d"] in ("non", "oui"), p["id"]
        assert (server.SITE_DIR / p["image"]).is_file(), p["id"]
        assert all(b["name"] and b["qty"] > 0 and b["url"].startswith("https://www.amazon.fr/dp/") for b in p.get("buy", [])), p["id"]
        assert all(re.fullmatch(r"\d+,\d{2} €", b["price"]) for b in p.get("buy", [])), p["id"]  # lu par shop.js
        if "video" in p:
            assert len(p["video"]["id"]) == 11 and (server.SITE_DIR / p["real"]).is_file(), p["id"]
            assert p["board"] and p["wiring"]["rows"], p["id"]
            assert all(kind in ("pwr", "gnd", "data", "i2c", "clk") for _, _, kind in p["wiring"]["rows"]), p["id"]
            assert all(s["url"].startswith("https://") for s in p["software"]), p["id"]
    for n, pins in CONTENT["pins"].items():
        assert n in CHAPTERS, n
        assert all(str(e["gpio"]) in CONTENT["board"] for e in pins), n
    for n, c in CONTENT["chapters"].items():
        for i, q in enumerate(c.get("quiz", [])):
            assert 0 <= q["answer"] < len(q["choices"]), (n, i)


def test_quiz_keeps_best_score_and_counts_tries():
    extra = new_extra()
    assert server.apply_extra(extra, "quiz", "1", {"score": 4, "total": 4})
    assert server.apply_extra(extra, "quiz", "1", {"score": 1, "total": 4})
    q = extra["quiz"]["1"]
    assert (q["score"], q["total"], q["tries"]) == (4, 4, 2)
    assert server.apply_extra(extra, "quiz", "2", {"score": 2, "total": 2})
    assert server.apply_extra(extra, "quiz", "2", {"score": 4, "total": 4})  # même proportion, plus de questions
    assert extra["quiz"]["2"]["total"] == 4
    assert server.apply_extra(extra, "quiz", "3", {"score": 3, "total": 4})
    assert server.apply_extra(extra, "quiz", "3", {"score": 1, "total": 2})  # 50 % < 75 %
    assert extra["quiz"]["3"]["score"] == 3


def test_play_modes_validate_and_count():
    extra = new_extra()
    today = date.today().isoformat()
    assert server.apply_extra(extra, "play", "review", {"score": 4, "total": 5})
    assert server.apply_extra(extra, "play", "daily", {"score": 3, "total": 3})
    assert server.apply_extra(extra, "play", "survival", {"run": 12})
    assert server.apply_extra(extra, "play", "survival", {"run": 5})
    assert extra["play"]["survival"] == 12
    assert server.apply_extra(extra, "play", "boss", {"world": 1, "score": 7, "total": 9, "won": True})
    assert server.apply_extra(extra, "play", "boss", {"world": 2, "score": 2, "total": 5, "won": False})
    assert list(extra["play"]["boss"]) == ["1"]
    day = extra["daily"][today]
    assert day["review"] == 1 and day["daily"] == 1 and day["survival"] == 2 and day["boss"] == 2
    assert day["correct"] == 4 + 3 + 12 + 5 + 7 + 2
    for bad in ({"world": 9, "score": 1, "total": 2, "won": True}, {"world": 1, "score": 5, "total": 2}, "x"):
        assert not server.apply_extra(extra, "play", "boss", bad)
    assert not server.apply_extra(extra, "play", "survival", {"run": -1})
    assert not server.apply_extra(extra, "play", "inconnu", {"score": 1, "total": 1})


def test_daily_counters_follow_actions():
    extra = new_extra()
    today = date.today().isoformat()
    server.apply_extra(extra, "notes", "1", "bonjour")
    server.apply_extra(extra, "notes", "1", "bonjour")  # inchangée : ne recompte pas
    server.apply_extra(extra, "bonus", "1", True)
    server.apply_extra(extra, "bonus", "1", True)
    server.apply_extra(extra, "parts", "1", {"LED": True, "Câble USB": True})
    assert extra["daily"][today] == {"note": 1, "bonus": 1, "parts": 2}


def test_undoing_an_action_removes_its_quest_points():
    today = date.today().isoformat()
    extra = new_extra()
    server.apply_extra(extra, "bonus", "1", True)
    server.apply_extra(extra, "bonus", "1", False)
    server.apply_extra(extra, "bonus", "1", True)
    server.apply_extra(extra, "parts", "1", {"LED": True})
    server.apply_extra(extra, "parts", "1", {})
    server.apply_extra(extra, "notes", "1", "a")
    server.apply_extra(extra, "notes", "1", "")
    assert extra["daily"] == {today: {"bonus": 1}}, extra["daily"]
    server.apply_extra(extra, "bonus", "1", False)
    assert extra["daily"] == {} and extra["earned"] == {}


def test_chapter_points_follow_real_status():
    today = date.today().isoformat()
    extra = new_extra()
    progress = {"3": "done"}
    extra["dates"]["3"] = today
    extra["daily"][today] = {"chapter": 3}  # anciens points gonflés par des allers-retours
    server.recount_chapters(extra, progress)
    assert extra["daily"][today]["chapter"] == 1
    progress["3"] = "doing"
    extra["dates"].pop("3")
    server.recount_chapters(extra, progress)
    assert extra["daily"] == {}


def test_every_boss_world_is_valid():
    worlds = CONTENT["worlds"]
    assert sorted(c for w in worlds for c in w["chapters"]) == sorted(int(n) for n in CHAPTERS)
    for w in worlds:
        assert len(w["chapters"]) * 2 <= sum(len(CONTENT["chapters"][str(n)]["quiz"]) for n in w["chapters"])
        assert (server.SITE_DIR / "badges" / f"boss-{w['id']}.webp").is_file(), w["id"]


def test_every_badge_has_an_image():
    ids = re.findall(r'^  \{ id: "(\w+)", title: "[^"]*", hint', (server.SITE_DIR / "game.js").read_text(encoding="utf-8"), re.M)
    assert len(ids) == 23, ids
    missing = [i for i in ids if not (server.SITE_DIR / "badges" / f"{i}.webp").is_file()]
    assert not missing, missing


def test_products_are_described_once():
    raw = json.loads((server.CONTENT_DIR / "projects.json").read_text(encoding="utf-8"))
    products = json.loads((server.CONTENT_DIR / "products.json").read_text(encoding="utf-8"))
    used = {b["asin"] for p in raw for b in p.get("buy", [])}
    assert used <= set(products), used - set(products)
    assert set(products) <= used, set(products) - used
    assert all(set(b) <= {"asin", "qty", "optional", "note"} for p in raw for b in p.get("buy", []))  # rien d'autre à recopier par projet


def test_scripts_are_served_in_page_order():
    page = (server.SITE_DIR / "index.html").read_text(encoding="utf-8")
    assert re.findall(r'<script src="([\w.]+\.js)">', page) == list(SITE_JS)
    assert all(f in server.STATIC_FILES for f in SITE_JS)
    assert not (server.SITE_DIR / "app.js").exists()  # sinon une copie périmée traînerait


def test_app_icon_and_manifest_are_wired():
    page = (server.SITE_DIR / "index.html").read_text(encoding="utf-8")
    manifest = json.loads((server.SITE_DIR / "manifest.webmanifest").read_text(encoding="utf-8"))
    assert "manifest.webmanifest" in server.STATIC_FILES
    for href in ('rel="icon"', 'rel="apple-touch-icon"', 'rel="manifest"'):
        assert href in page, href
    for icon in manifest["icons"]:
        assert (server.SITE_DIR / icon["src"].lstrip("/")).is_file(), icon["src"]
    assert manifest["display"] == "standalone" and manifest["start_url"] == "/"


def test_every_art_icon_exists():
    # art("nom") et art: "nom" dans les fichiers .js du site doivent pointer vers icons/<nom>.webp
    names = set()
    for f in SITE_JS:
        text = (server.SITE_DIR / f).read_text(encoding="utf-8")
        names |= set(re.findall(r'\bart\("(\w+)"', text)) | set(re.findall(r'\bart: "(\w+)"', text)) | set(re.findall(r'\bimg: "(\w+)"', text))
        names |= {"sun", "moon", "niveau-1", "niveau-2", "niveau-3"}  # choisis par art(dark ? "sun" : "moon") et art(`niveau-${level}`)
    assert len(names) >= 15, names
    missing = [n for n in sorted(names) if not (server.SITE_DIR / "icons" / f"{n}.webp").is_file()]
    assert not missing, missing
    assert all((server.SITE_DIR / "icons" / f).is_file() for f in ("icon-64.png", "apple-touch-icon.png", "icon-192.png", "icon-512.png"))


def test_undoing_does_not_count_as_activity():
    extra = new_extra()
    server.apply_extra(extra, "bonus", "1", False)
    server.apply_extra(extra, "notes", "1", "")
    server.apply_extra(extra, "parts", "1", {})
    server.apply_extra(extra, "projects", CONTENT["projects"][0]["id"], "todo")
    assert extra["activity"] == []
    server.apply_extra(extra, "bonus", "1", True)
    assert extra["activity"] == [date.today().isoformat()]


def test_state_gives_the_server_day():
    assert server.state_payload()["extra"]["today"] == date.today().isoformat()


def test_camera_page_header_is_up_to_date():
    import gzip
    folder = server.CODE_DIR / "34_Camera" / "Sketch_34.1_CameraWebServer"
    header = (folder / "camera_ui.h").read_text(encoding="utf-8")
    blob = bytes(int(h, 16) for h in re.findall(r"0x([0-9A-F]{2})", header))
    assert gzip.decompress(blob) == (folder / "ui.html").read_bytes(), "relance : python3 build_ui.py"
    assert f"camera_ui_html_gz_len {len(blob)}" in header


def test_http_layer_refuses_bad_requests():
    saved = (server.PROGRESS_FILE, server.EXTRA_FILE, server.VAULT_NOTE)
    with tempfile.TemporaryDirectory() as d:
        server.PROGRESS_FILE, server.EXTRA_FILE, server.VAULT_NOTE = (Path(d) / n for n in ("p.json", "e.json", "v.md"))
        httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        threading.Thread(target=httpd.serve_forever, daemon=True).start()
        port = httpd.server_address[1]

        def call(method, path, body=None, headers=None):
            c = http.client.HTTPConnection("127.0.0.1", port, timeout=5)
            h = {"Content-Type": "application/json", **(headers or {})}
            c.request(method, path, body, h)
            r = c.getresponse()
            r.read()
            c.close()
            return r.status

        try:
            assert call("GET", "/api/state") == 200
            assert call("GET", "/api/state", headers={"Host": "evil.example:8743"}) == 403  # DNS rebinding
            assert call("GET", "/schemas/..%2fserver.py") == 404
            assert call("GET", "/freenove/..%2fsite%2fserver.py") == 404
            assert call("GET", "/freenove/C/Sketches/Sketch_01.1_Blink/Sketch_01.1_Blink.ino") == 404  # sources : seulement via /api/code
            if server.FREENOVE_ROOT.is_dir():  # le kit Freenove n'est pas dans le dépôt GitHub
                assert call("GET", "/freenove/ESP32_Pinout_V3.0.png") == 200
            assert call("POST", "/api/progress", '{"chapter": 1, "status": "done"}', {"Content-Type": "text/plain"}) == 415
            assert call("POST", "/api/progress", '{"chapter": 1, "status": []}') == 400
            assert call("POST", "/api/extra", '{"section": "projects", "key": "x", "value": {}}') == 400
            assert call("POST", "/api/progress", b"\xff\xfe") == 400
            assert call("POST", "/api/progress", "{" + " " * (server.MAX_BODY + 1)) == 400
            assert call("POST", "/api/open", '{"kind": "freenove", "chapter": "\\u00b2"}') == 200  # 127.0.0.1 : pas de plantage
            assert call("POST", "/api/progress", '{"chapter": 1, "status": "done"}') == 200
            assert json.loads(server.PROGRESS_FILE.read_text())["1"] == "done"
        finally:
            httpd.shutdown()
            server.PROGRESS_FILE, server.EXTRA_FILE, server.VAULT_NOTE = saved


def test_game_logic_in_node():
    import shutil, subprocess
    if not shutil.which("node"):
        return
    r = subprocess.run(["node", str(server.SITE_DIR / "test_game.js")], capture_output=True, text=True)
    assert r.returncode == 0, r.stdout + r.stderr


if __name__ == "__main__":
    tests = [f for name, f in sorted(globals().items()) if name.startswith("test_")]
    for t in tests:
        t()
        print("ok", t.__name__)
    print(f"{len(tests)} vérifications passées")
