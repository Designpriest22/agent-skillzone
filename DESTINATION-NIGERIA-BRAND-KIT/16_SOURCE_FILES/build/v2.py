"""v2 layout foundation: HTML artboards set in the real brand fonts, rendered by render.mjs.

Artboards are plain HTML/CSS so they stay editable: text is live, photographs are linked from
06/LIBRARY, plates and logos are inline vector. Rendered to PNG/JPG for posting and PDF (vector
text, embedded images) for print and for import into Illustrator, Figma or Affinity.
"""
import os
from html import escape
from pathlib import Path
from brand import (C, KIT, LOGO_W, LOGO_H, ALL_PARTS, WORD_NIGERIA, COLOURWAYS, PATH, logo_group, photo, plate,
                   PHOTOS, CONTACT, SUN_C)

FONTS_DIR = KIT / "03_COLOR_AND_TYPOGRAPHY" / "fonts_v2" / "static"


def rel(target, out_dir):
    return os.path.relpath(Path(target), Path(out_dir)).replace(os.sep, "/")


def font_css(out_dir):
    faces = []
    for fam, files in [("Newsreader Display", [("NewsreaderDisplay-Regular", 400, "normal"), ("NewsreaderDisplay-Medium", 500, "normal"),
                                                ("NewsreaderDisplay-SemiBold", 600, "normal"), ("NewsreaderDisplay-RegularItalic", 400, "italic"),
                                                ("NewsreaderDisplay-MediumItalic", 500, "italic")]),
                       ("Newsreader Text", [("NewsreaderText-Regular", 400, "normal"), ("NewsreaderText-Medium", 500, "normal"),
                                             ("NewsreaderText-SemiBold", 600, "normal"), ("NewsreaderText-RegularItalic", 400, "italic")]),
                       ("Public Sans", [("PublicSans-Light", 300, "normal"), ("PublicSans-Regular", 400, "normal"), ("PublicSans-Medium", 500, "normal"),
                                        ("PublicSans-SemiBold", 600, "normal"), ("PublicSans-Bold", 700, "normal"), ("PublicSans-RegularItalic", 400, "italic")])]:
        for f, w, st in files:
            faces.append(f"@font-face{{font-family:'{fam}';src:url('{rel(FONTS_DIR / (f + '.ttf'), out_dir)}') format('truetype');"
                         f"font-weight:{w};font-style:{st};font-display:block}}")
    return "\n".join(faces)


def base_css(out_dir):
    v = ";".join(f"--{k}:{h}" for k, h in C.items())
    return font_css(out_dir) + f"""
:root{{{v}}}
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{background:transparent}}
body{{font-family:'Public Sans',Arial,sans-serif;color:var(--forest);-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision;
  font-feature-settings:'kern','liga','lnum'}}
.ab{{position:relative;overflow:hidden}}
.disp{{font-family:'Newsreader Display',Georgia,serif;font-weight:400;letter-spacing:-0.018em;line-height:1.0;text-wrap:balance;
  font-feature-settings:'kern','liga','lnum'}}
.text{{font-family:'Newsreader Text',Georgia,serif;font-weight:400;line-height:1.42;text-wrap:pretty}}
.sans{{font-family:'Public Sans',Arial,sans-serif}}
.label{{font-family:'Public Sans',Arial,sans-serif;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;line-height:1.2}}
.cap{{font-family:'Public Sans',Arial,sans-serif;font-weight:400;line-height:1.35;letter-spacing:0.005em}}
.num{{font-feature-settings:'tnum','lnum'}}
.photo{{position:absolute;display:block;object-fit:cover}}
.plate svg,.logo svg{{display:block;width:100%;height:auto}}
.hair{{position:absolute;height:0;border-top:1px solid currentColor}}
em{{font-style:italic}}
"""


def logo_svg(cw="fullcolour", parts=None, small=False, crop=None):
    """Inline vector logo. crop='wordmark' drops the landscape; crop='landscape' keeps only it."""
    parts = parts or ALL_PARTS
    vb = f"0 0 {LOGO_W} {LOGO_H}"
    if small:
        parts = [p for p in parts if p != "horizon_small"]
    cwd = COLOURWAYS[cw] if isinstance(cw, str) else cw
    g = logo_group(parts, cwd, stroke_names=WORD_NIGERIA if small else (), stroke_w=0.35)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="Destination Nigeria">{g}</svg>')


def plate_svg(slug, ink="forest", transparent=True, keep_sun=True):
    s = plate(slug, ink, transparent).read_text()
    s = s[s.index("<svg"):]
    if not keep_sun:
        import re
        s = re.sub(r'<g id="sun">.*?</g>', "", s, flags=re.S)
    return s


def img(slug, out_dir, x, y, w, h, focus=None, extra=""):
    fx, fy = focus or PHOTOS[slug]["focus"]
    return (f'<img class="photo" src="{rel(photo(slug), out_dir)}" alt="{escape(PHOTOS[slug]["caption"] or "Nigerian landscape")}" '
            f'style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;object-position:{fx * 100:.0f}% {fy * 100:.0f}%;{extra}">')


def page(out_html, w, h, body, css="", title="Destination Nigeria", bg="transparent"):
    out_html = Path(out_html)
    out_html.parent.mkdir(parents=True, exist_ok=True)
    doc = (f"<!doctype html><html lang='en'><head><meta charset='utf-8'><title>{escape(title)}</title>"
           f"<style>{base_css(out_html.parent)}\nhtml,body{{width:{w}px;height:{h}px;background:{bg}}}\n"
           f".ab{{width:{w}px;height:{h}px}}\n{css}</style></head><body><div class='ab'>{body}</div></body></html>")
    out_html.write_text(doc, encoding="utf-8")
    return out_html


def job(src, out, w, h, scale=1, **kw):
    j = {"src": str(src), "out": str(out), "w": w, "h": h, "scale": scale, "wait": 150}
    j.update(kw)
    return j
