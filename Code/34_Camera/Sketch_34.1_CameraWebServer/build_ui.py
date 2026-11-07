#!/usr/bin/env python3
"""Compresse ui.html dans camera_ui.h (la carte sert la page compressée). À relancer après chaque changement de ui.html :
python3 build_ui.py"""
import gzip
from pathlib import Path

here = Path(__file__).resolve().parent
data = gzip.compress((here / "ui.html").read_bytes(), compresslevel=9, mtime=0)
rows = [", ".join(f"0x{b:02X}" for b in data[i:i + 24]) for i in range(0, len(data), 24)]
(here / "camera_ui.h").write_text(
    "// Généré par build_ui.py à partir de ui.html : ne pas modifier à la main.\n"
    f"#define camera_ui_html_gz_len {len(data)}\n"
    "const unsigned char camera_ui_html_gz[] = {\n  " + ",\n  ".join(rows) + "\n};\n",
    encoding="utf-8",
)
print(f"camera_ui.h : {len(data)} octets compressés")
