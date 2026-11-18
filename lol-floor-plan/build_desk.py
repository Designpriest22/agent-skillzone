#!/usr/bin/env python3
"""Builds desk.html: the live brand allocation desk (claude.ai artifact).

Reuses the plan drawings and slot data from build.py, so the desk, the PDF pack
and every brand document draw from the same geometry.
"""
import json
from pathlib import Path

import build as B

HERE = Path(__file__).parent

slots = [dict(id=s["id"], zone=s["zone"], wall=s["wall"], w=s["w"], where=s["where"]) for s in B.SLOTS]
svgs = {
    "S": B.combined(),
    "A": B.svg(B.ARENA_BOX, B.draw_arena(), "Event arena plan"),
    "T": B.svg(B.TABLE_BOX, B.draw_table(), "Table parking plan"),
    "V": B.svg(B.VALID_BOX, B.draw_valid(), "Validation point plan"),
}
tpl = (HERE / "desk_template.html").read_text(encoding="utf-8")
html = (tpl.replace("__SLOTS__", json.dumps(slots, ensure_ascii=False))
           .replace("__SVGS__", json.dumps(svgs, ensure_ascii=False).replace("</", "<\\/")))
(HERE / "desk.html").write_text(html, encoding="utf-8")
print("wrote desk.html", len(html) // 1024, "KB")
