"""Vector graphics v2 → 04_VECTOR_GRAPHICS_AND_ICONS/campaign-lockups.

The proposition is set in Newsreader Display, sentence case, outlined to vector so it reproduces
exactly without the font installed. The v1 tracked capitals with gold full stops are retired.
"""
import json
from brand import C, KIT, LOGO_W, LOGO_H, logo_inline, svg_doc, write
from gfx import text_path

D = "04_VECTOR_GRAPHICS_AND_ICONS/campaign-lockups"
jobs = []


def line_paths(color, size=10.0, x=0, y=0, gap=0.32):
    """'Experience. Invest. Explore.' on one line. Returns (svg, width)."""
    d, w = text_path("Experience. Invest. Explore.", "NewsreaderDisplay-Regular", size, -0.01, x, y)
    return f'<path fill="{color}" d="{d}"/>', w


def stacked_line(color, size=10.0, x=0, y=0, lh=1.02):
    out, wmax = "", 0
    for i, word in enumerate(["Experience.", "Invest.", "Explore."]):
        d, w = text_path(word, "NewsreaderDisplay-Regular", size, -0.015, x, y + i * size * lh)
        out += f'<path fill="{color}" d="{d}"/>'
        wmax = max(wmax, w)
    return out, wmax


def emit(name, w, h, body, title, bg):
    write(f"{D}/{name}.svg", svg_doc(w, h, body, title, "Outlined vector. Do not retype or re-space.", px=(w * 6, h * 6)))
    jobs.append(dict(src=str(KIT / D / f"{name}.svg"), out=str(KIT / D / "PNG" / f"{name}.png"), w=w * 6, h=h * 6, scale=2, transparent=True))
    jobs.append(dict(src=str(KIT / D / f"{name}.svg"), out=str(KIT / D / "PDF" / f"{name}.pdf"), w=w * 6, h=h * 6, format="pdf"))


if __name__ == "__main__":
    for tag, col, cw in [("forest", C["forest"], "fullcolour"), ("paper", C["ivory"], "reversed")]:
        s, w = line_paths(col, 10, 0, 8.4)
        emit(f"DN_proposition-line_{tag}", w + 0.5, 11, s, f"Proposition line, {tag}", col)
        s, w = stacked_line(col, 10, 0, 8.4)
        emit(f"DN_proposition-stacked_{tag}", w + 0.5, 31.5, s, f"Proposition, stacked, {tag}", col)
        # lockup: logo above, proposition below at 0.8 × logo width, separated by a hairline
        lw = 60
        lh = LOGO_H * lw / LOGO_W
        s, w = line_paths(col, 5.2, 0, lh + 11)
        body = logo_inline(cw, 0, 0, lw) + f'<path d="M0,{lh + 4.2} H{lw}" stroke="{C["haze"] if tag == "forest" else C["ridge"]}" stroke-width="0.25"/>' + s
        emit(f"DN_lockup_logo-proposition_{tag}", max(lw, w) + 0.5, lh + 13, body, f"Logo with proposition, {tag}", col)
    json.dump(jobs, open(KIT / "16_SOURCE_FILES/build/_jobs/_jobs_graphics2.json", "w"), indent=1)
    print(len(jobs), "jobs")
