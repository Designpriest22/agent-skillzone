"""Render the kit's Markdown documents as branded A4 PDFs (strategy, specifications, handover)."""
import json
import subprocess
import sys
import markdown
from brand import *

DOCS = [("01_BRAND_STRATEGY/DN_Brand_Strategy_v1.0.md", "Brand foundation"),
        ("03_COLOR_AND_TYPOGRAPHY/DN_Color_Specification_v1.0.md", "Colour specification"),
        ("03_COLOR_AND_TYPOGRAPHY/DN_Typography_Specification_v1.0.md", "Typography specification"),
        ("18_QA_AND_HANDOVER/DN_Handover-Report.md", "Handover report"),
        ("18_QA_AND_HANDOVER/DN_QA-Report.md", "Quality assurance report")]
CSS = f"""@page {{ size: A4; margin: 22mm 20mm 20mm; }}
body {{ font: 10pt/1.55 Inter, Arial, sans-serif; color: {C['charcoal']}; -webkit-print-color-adjust: exact; }}
h1 {{ font: 500 26pt/1.1 'Playfair Display', Georgia, serif; color: {C['forest']}; margin: 0 0 6mm; }}
h2 {{ font: 500 16pt/1.2 'Playfair Display', Georgia, serif; color: {C['forest']}; margin: 9mm 0 3mm; border-top: .3mm solid {C['sage']}; padding-top: 4mm; }}
h3 {{ font: 600 11pt Inter; color: {C['forest']}; margin: 6mm 0 2mm; }}
blockquote {{ margin: 0 0 5mm; padding: 3mm 5mm; background: {C['ivory']}; border-left: 1.2mm solid {C['gold']}; }}
table {{ border-collapse: collapse; width: 100%; font-size: 8pt; margin: 3mm 0 5mm; page-break-inside: auto; }}
th {{ text-align: left; background: {C['haze']}; color: {C['forest']}; padding: 1.6mm 2mm; font-weight: 600; }}
td {{ padding: 1.4mm 2mm; border-bottom: .25mm solid #D6D9D2; vertical-align: top; }}
tr {{ page-break-inside: avoid; }}
code {{ font: 8.5pt 'JetBrains Mono', monospace; background: {C['ivory']}; padding: 0 1mm; }}
.top {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 10mm; }}
.top span {{ font: 600 7pt Inter; letter-spacing: .22em; text-transform: uppercase; color: {C['golddeep']}; }}
"""


def render(rel, label):
    src = KIT / rel
    if not src.exists():
        return None
    body = markdown.markdown(src.read_text(), extensions=["tables", "sane_lists"])
    logo = svg_doc(LOGO_W, LOGO_H, logo_inline("fullcolour", 0, 0, LOGO_W), "Destination Nigeria").replace("<svg ", '<svg style="width:46mm" ', 1)
    html = (f"<!doctype html><html lang='en-GB'><head><meta charset='utf-8'><title>{label}</title><style>{CSS}</style></head><body>"
            f"<div class='top'>{logo}<span>{label}</span></div>{body}</body></html>")
    out = src.with_suffix(".html")
    tmp = KIT / "16_SOURCE_FILES/build/_jobs" / (src.stem + ".html")
    tmp.write_text(html)
    return dict(src=str(tmp), out=str(src.with_suffix(".pdf")), w=794, h=1123, format="pdf", cssPage=True, wait=200)


if __name__ == "__main__":
    only = sys.argv[1:]
    jobs = [j for j in (render(r, l) for r, l in DOCS if not only or any(o in r for o in only)) if j]
    p = KIT / "16_SOURCE_FILES/build/_jobs/_jobs_mdpdf.json"
    json.dump(jobs, open(p, "w"))
    subprocess.run(["node", str(KIT / "16_SOURCE_FILES/build/render.mjs"), str(p)], check=True)
