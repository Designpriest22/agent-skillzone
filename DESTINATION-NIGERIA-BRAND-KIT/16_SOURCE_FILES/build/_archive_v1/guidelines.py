"""Brand guidelines (A4 landscape) + quick-reference sheet → 14_BRAND_GUIDELINES.

Source is HTML/CSS (editable), printed to PDF with Chromium. Every logo, swatch, specimen and diagram
is drawn live from brand.py, so the guidelines can never drift from the master files.
"""
import json
import subprocess
from brand import *
from gfx import text_path
from icons import ICONS, BRIEF, LABELS, icon_body
from graphics import horizon_set, campaign_line, ribbon, pattern_contour, pattern_horizon, pattern_sundots, pattern_confluence
from tokens import CMYK_PRINT

G = KIT / "14_BRAND_GUIDELINES"
SRC = G / "source"
A = SRC / "assets"
A.mkdir(parents=True, exist_ok=True)
R = "../../"  # source/ → kit root


def thumbs():
    docs = {"letter": "LETTERHEAD/DN_Letter_Formal-Correspondence_A4.pdf", "memo": "MEMO/DN_Memo_A4.pdf", "report": "REPORTS/DN_Report_Template_A4.pdf",
            "proposal": "PROPOSALS/DN_Proposal-Concept-Note_Template_A4.pdf", "minutes": "MEETING_MINUTES/DN_Meeting-Minutes_A4.pdf",
            "invoice": "INVOICES/DN_Invoice_Template_A4.pdf", "press": "PRESS_AND_MEDIA/DN_Press-Release_A4.pdf",
            "factsheet": "PRESS_AND_MEDIA/DN_Fact-Sheet_A4.pdf", "certificate": "WORKSHOP_MATERIALS/DN_Participant-Certificate_A4.pdf",
            "investment": "INVESTMENT_PROFILE/DN_Investment-Opportunity-Profile_A4.pdf", "feedback": "WORKSHOP_MATERIALS/DN_Feedback-Form_A4.pdf",
            "advisory": "PRESS_AND_MEDIA/DN_Media-Advisory_A4.pdf"}
    for k, rel in docs.items():
        subprocess.run(["pdftocairo", "-png", "-r", "45", "-f", "1", "-l", "1", "-singlefile", str(KIT / "09_DOCUMENT_TEMPLATES" / rel), str(A / f"doc_{k}")], check=True)
    for n in (1, 3, 4, 5, 8, 9, 12, 13, 14, 19, 20, 21):
        subprocess.run(["pdftocairo", "-png", "-r", "30", "-f", str(n), "-l", str(n), "-singlefile",
                        str(KIT / "10_PRESENTATION_TEMPLATES/DN_Presentation-Template_16x9.pdf"), str(A / f"slide_{n:02d}")], check=True)


def svg(w, h, body, cls="", style=""):
    return f'<svg viewBox="0 0 {w:g} {h:g}" class="{cls}" style="{style}" xmlns="http://www.w3.org/2000/svg">{body}</svg>'


def logo(cw="fullcolour", w=LOGO_W, small=False):
    return svg(LOGO_W, LOGO_H, logo_inline(cw, 0, 0, LOGO_W, small=small))


def page(num, section, title, body, dark=False, cls=""):
    return (f'<section class="page {"dark" if dark else ""} {cls}"><header class="ph"><span class="sec">{num:02d} · {section}</span></header>'
            f'<h2 class="pt">{title}</h2><div class="pb">{body}</div>'
            f'<footer class="pf"><span>Destination Nigeria — Brand Guidelines v1.0</span><span class="pn"></span></footer></section>')


CSS = f"""
@page {{ size: 297mm 210mm; margin: 0; }}
:root {{ --f:{C['forest']}; --r:{C['ridge']}; --g:{C['gold']}; --i:{C['ivory']}; --s:{C['stone']}; --gd:{C['golddeep']}; --sg:{C['sage']}; --h:{C['haze']}; }}
* {{ box-sizing: border-box; }}
html,body {{ margin:0; font-family: Inter, Arial, sans-serif; color: {C['charcoal']}; font-size: 9.5pt; line-height: 1.5; -webkit-print-color-adjust: exact; print-color-adjust: exact; counter-reset: pg; }}
.page {{ width: 297mm; height: 210mm; position: relative; padding: 16mm 18mm 16mm; background: var(--i); page-break-after: always; overflow: hidden; counter-increment: pg; }}
.page.dark {{ background: var(--f); color: var(--i); }}
.ph {{ position:absolute; top:9mm; left:18mm; right:18mm; display:flex; justify-content:space-between; font: 600 7pt Inter; letter-spacing:.22em; text-transform:uppercase; color: var(--gd); }}
.dark .ph {{ color: var(--g); }}
.pt {{ font: 500 26pt/1.08 'Playfair Display', Georgia, serif; color: var(--f); margin: 4mm 0 6mm; max-width: 200mm; }}
.dark .pt {{ color: var(--i); }}
.pf {{ position:absolute; bottom:8mm; left:18mm; right:18mm; display:flex; justify-content:space-between; font: 7pt Inter; color: var(--s); border-top: .3mm solid rgba(16,52,40,.15); padding-top: 2mm; }}
.dark .pf {{ color: var(--sg); border-color: rgba(245,240,230,.2); }}
.pn::after {{ content: counter(pg); }}
.pb {{ position:absolute; top: 38mm; left:18mm; right:18mm; bottom: 16mm; }}
h3 {{ font: 600 10.5pt Inter; color: var(--f); margin: 0 0 2mm; }}
.dark h3 {{ color: var(--i); }}
.ov {{ font: 600 7pt Inter; letter-spacing: .22em; text-transform: uppercase; color: var(--gd); margin: 0 0 1.5mm; }}
.lead {{ font: 400 14pt/1.4 'Source Serif 4', Georgia, serif; color: var(--f); }}
.dark .lead {{ color: var(--i); }}
.cols {{ display:grid; gap: 8mm; }} .c2 {{ grid-template-columns: 1fr 1fr; }} .c3 {{ grid-template-columns: repeat(3,1fr); }} .c4 {{ grid-template-columns: repeat(4,1fr); }} .c5 {{ grid-template-columns: repeat(5,1fr); }} .c6 {{ grid-template-columns: repeat(6,1fr); }}
.card {{ background:#fff; border-radius: 3mm; padding: 5mm; }}
.dark .card {{ background: rgba(255,255,255,.06); }}
.tile {{ border-radius: 3mm; display:grid; place-items:center; padding: 6mm; }}
.tile svg {{ width: 100%; height: auto; max-height: 100%; }}
.small {{ font-size: 7.5pt; color: var(--s); }}
.dark .small {{ color: var(--sg); }}
table {{ border-collapse: collapse; width: 100%; font-size: 8pt; }}
th {{ text-align:left; font: 600 6.5pt Inter; letter-spacing:.14em; text-transform:uppercase; color: var(--f); background: var(--h); padding: 1.6mm 2mm; }}
td {{ padding: 1.4mm 2mm; border-bottom: .25mm solid #D6D9D2; vertical-align: top; }}
.sw {{ border-radius: 3mm; overflow:hidden; background:#fff; }}
.sw .chip {{ height: 26mm; padding: 3mm; display:flex; align-items:flex-end; font: 600 8pt Inter; }}
.sw .meta {{ padding: 2.5mm 3mm; font-size: 7pt; line-height: 1.45; }}
.x {{ position: relative; }}
.x::after {{ content:'✕'; position:absolute; top:2mm; right:3mm; width:6mm; height:6mm; border-radius:50%; background:{C['laterite']}; color:#fff; font: 700 8pt/6mm Inter; text-align:center; }}
.ok {{ position: relative; }}
.ok::after {{ content:'✓'; position:absolute; top:2mm; right:3mm; width:6mm; height:6mm; border-radius:50%; background:{C['canopy']}; color:#fff; font: 700 8pt/6mm Inter; text-align:center; }}
img.th {{ width:100%; display:block; border-radius: 1.5mm; box-shadow: 0 .6mm 2mm rgba(0,0,0,.15); }}
ul {{ margin: 0; padding-left: 4mm; }} li {{ margin-bottom: 1mm; }}
.cover .pt, .cover .ph, .cover .pf {{ display:none; }}
"""


def build():
    P = []
    n = [0]

    def add(section, title, body, dark=False, cls=""):
        n[0] += 1
        P.append(page(n[0], section, title, body, dark, cls))

    # ---------------- cover
    P.append(f'''<section class="page dark cover" style="padding:0">{svg(297, 210, f'<rect width="297" height="210" fill="{C["forest"]}"/>'
             + "".join(f'<circle cx="210" cy="96" r="{r}" fill="none" stroke="{C["gold"]}" stroke-opacity="{o}" stroke-width=".35"/>' for r, o in [(34, .5), (52, .3), (72, .18), (94, .1)])
             + roundel_inline(180, 66, 60, "ivory", uid="cv") + logo_inline("reversed", 18, 22, 92)
             + f'<g transform="translate(0,176) scale({297 / 1200})">{horizon_set(C["gold"], C["ivory"])}</g>', style="position:absolute;inset:0;width:297mm;height:210mm")}
    <div style="position:absolute;left:18mm;top:96mm;width:140mm"><p class="ov" style="color:{C['gold']}">Brand identity system · v1.0</p>
    <h1 style="font:500 40pt/1.02 'Playfair Display',Georgia,serif;margin:0;color:{C['ivory']}">Brand Guidelines</h1>
    <p class="lead" style="margin-top:5mm;color:{C['sage']}">Experience. Invest. Explore.</p></div></section>''')
    # ---------------- contents
    toc = ["Brand overview", "Purpose & positioning", "Audiences, messaging & voice", "Logo: the master", "Logo architecture", "Clear space", "Minimum sizes",
           "Colour variants", "Incorrect logo usage", "Colour palette", "Supporting colours", "Colour accessibility", "Typography", "Type hierarchy",
           "Graphic language", "Patterns & textures", "Photography direction", "Image licensing & attribution", "Iconography", "Backgrounds",
           "Layout, grid & spacing", "Document templates", "Presentation design", "Social media", "Motion identity", "Sonic identity", "Accessibility",
           "Digital usage", "Print production", "File formats & naming", "Governance", "Approved & prohibited applications", "Applications gallery"]
    lis = "".join(f'<li style="list-style:none;display:flex;gap:4mm;border-bottom:.25mm solid #D6D9D2;padding:1.1mm 0"><span style="color:{C["golddeep"]};font-weight:600;width:8mm">{i + 1:02d}</span>{t}</li>' for i, t in enumerate(toc))
    add("Contents", "Contents", f'<ul style="columns:3;column-gap:10mm;padding:0">{lis}</ul>')
    # ---------------- strategy
    add("Brand overview", "Horizons, opened.",
        f'''<div class="cols c2"><div><p class="lead">Destination Nigeria is a national tourism development, investment and destination-marketing platform.
        It connects public institutions, states, businesses, communities, operators, investors and creative partners. Its identity has two jobs:
        to make Nigeria feel irresistible to experience, and credible to invest in.</p>
        <p class="small">This foundation is based on the project brief. The executive concept note was not supplied with the artwork, so check it against that note before publication.</p></div>
        <div class="card"><p class="ov">Essence</p><h3 style="font:500 18pt 'Playfair Display';margin-bottom:4mm">Horizons, opened.</h3>
        <p class="ov">Purpose</p><p>To grow Nigeria’s tourism economy by connecting the people who make experiences with the people who want to enjoy them or invest in them, through clear coordination and credible information.</p>
        <p class="ov">Promise</p><p>We will show you Nigeria as it is: varied, creative and full of opportunity. We will give you what you need to experience it, invest in it and explore it with confidence.</p></div></div>''')
    add("Purpose & positioning", "Two registers, one family",
        f'''<div class="cols c3"><div class="card"><p class="ov">Positioning</p><p>For travellers, investors and partners who want to understand Nigeria beyond the headlines,
        Destination Nigeria is the national platform that brings destinations, institutions, businesses and communities together under one trusted, coordinated identity.</p></div>
        <div class="card"><p class="ov">Personality</p><ul><li><b>Ambitious</b>, not boastful</li><li><b>Welcoming</b>, not over-familiar</li><li><b>Credible</b>, not bureaucratic</li><li><b>Curious</b>, not generic</li><li><b>Contemporary</b>, not trend-chasing</li></ul></div>
        <div class="card"><p class="ov">Values</p><ul><li>Authenticity</li><li>Coordination</li><li>Opportunity</li><li>Stewardship</li><li>Excellence</li></ul></div></div>
        <div class="cols c2" style="margin-top:6mm"><div class="card" style="background:{C['forest']};color:{C['ivory']}"><p class="ov" style="color:{C['gold']}">Destination register</p><p>Cinematic, full-bleed imagery. Display serif. Evocative copy. One sun.</p></div>
        <div class="card"><p class="ov">Institutional register</p><p>Ivory or white grounds. Structured grid. Inter. Sourced data. Restraint.</p></div></div>''')
    add("Audiences, messaging & voice", "Clear, warm, assured",
        f'''<div class="cols c3"><div><p class="ov">Audiences</p><h3>Primary</h3><ul><li>Domestic travellers and the diaspora</li><li>International leisure and cultural travellers</li><li>Investors, developers and financiers</li><li>Federal and state tourism institutions</li></ul>
        <h3 style="margin-top:3mm">Secondary</h3><ul><li>Operators, hospitality and transport</li><li>Host communities and creatives</li><li>Media and trade press</li><li>Sponsors and event partners</li></ul></div>
        <div><p class="ov">Messaging hierarchy</p>{campaign_svg()}<table style="margin-top:4mm"><tr><th>Pillar</th><th>Core message</th></tr>
        <tr><td><b>Experience</b></td><td>Culture, food, festivals and hospitality, met first-hand.</td></tr><tr><td><b>Invest</b></td><td>An investable, coordinated sector with real projects.</td></tr>
        <tr><td><b>Explore</b></td><td>From coast to plateau to savannah, with the routes made clear.</td></tr></table></div>
        <div><p class="ov">Tone of voice</p><ul><li>Name the place, the dish, the festival, the person.</li><li>Use short sentences and active verbs.</li><li>Use numbers only when they are sourced.</li><li>Write “Destination Nigeria” in full; never “DN” in public copy.</li></ul>
        <p class="small" style="margin-top:3mm"><b>Avoid:</b> “hidden gem”, “land of contrasts”, “vibrant tapestry”, unsourced superlatives, stereotypes, and any endorsement or date that has not been confirmed.</p></div></div>''')
    # ---------------- logo
    anat = (logo_inline("fullcolour", 40, 30, 200)
            + "".join(f'<path d="M{x1},{y1} L{x2},{y2}" stroke="{C["stone"]}" stroke-width=".5"/><circle cx="{x1}" cy="{y1}" r="1.6" fill="{C["laterite"]}"/>'
                      f'<text x="{x2 + (2 if x2 > x1 else -2)}" y="{y2 + 2}" font-family="Inter" font-size="6" fill="{C["forest"]}" text-anchor="{"start" if x2 > x1 else "end"}">{t}</text>'
                      for x1, y1, x2, y2, t in [(144, 36, 175, 12, "Sun — the single gold accent"), (152, 40, 120, 8, "Inselberg — granite monolith"),
                                                 (90, 50, 30, 18, "Horizon lines"), (48, 95, 62, 118, "Confluence curve — the D’s river tail"),
                                                 (185, 102, 196, 118, "NIGERIA — spaced sans")]))
    add("Logo: the master", "The supplied logo is the master",
        f'''<div class="cols c2" style="grid-template-columns:1.3fr 1fr"><div class="tile" style="background:#fff;height:120mm">{svg(290, 125, f'<g transform="translate(20,0)">{anat}</g>')}</div>
        <div><p class="lead">The landscape, sun and serif wordmark form one indivisible lockup. Every variant in this kit re-uses the supplied vector paths. Nothing has been redrawn.</p>
        <h3>Master file</h3><p>02_LOGO_MASTER_FILES/SVG/DN_logo_primary_fullcolour.svg (from supplied Asset_2).</p>
        <h3>Correction made</h3><p>In the supplied reversed file (Asset_1), the dot of the first “i” sat about 1 unit to the right of its stem. The kit’s reversed masters use the geometry from the full-colour master, so the dot is centred. The two supplied originals are kept unchanged in _SUPPLIED_ORIGINALS.</p>
        <h3>Never</h3><p>Retype, re-space, stretch, re-colour outside the approved colourways, or add a tagline inside the artwork.</p></div></div>''')
    fam = [("Primary — master", logo(), "#fff"), ("Horizontal (secondary)", svg(198.6, 38.5, roundel_inline(0, 0, 38.53, "forest", uid="lh") + f'<g transform="translate(48.6,{-20.53})">' + logo_group(WORD_DESTINATION + WORD_NIGERIA, COLOURWAYS["fullcolour"]) + "</g>"), "#fff"),
           ("Stacked (secondary)", svg(150.25, 100, roundel_inline(49, 0, 52, "forest", uid="ls") + f'<g transform="translate(0,{61 - 20.53})">' + logo_group(WORD_DESTINATION + WORD_NIGERIA, COLOURWAYS["fullcolour"]) + "</g>"), "#fff"),
           ("Horizon Roundel — compact symbol", svg(41, 41, roundel_inline(0, 0, 41, "forest", uid="lr")), "#fff"),
           ("Landscape symbol", svg(94.3, 23, f'<g transform="translate(-29.81,0)">' + logo_group(LANDSCAPE_DARK + LANDSCAPE_LIGHT + SUN, COLOURWAYS["fullcolour"]) + "</g>"), "#fff"),
           ("Small-format (≤160 px / 35 mm)", logo(small=True), "#fff")]
    add("Logo architecture", "Logo family",
        '<div class="cols c3">' + "".join(f'<div><div class="tile" style="background:{bg};height:44mm">{s}</div><p class="small" style="margin-top:2mm">{t}</p></div>' for t, s, bg in fam) + '</div>'
        '<p class="small" style="margin-top:4mm">Use the primary logo by default. Use the horizontal and stacked lockups only where the primary will not fit. The Horizon Roundel is for avatars, favicons and app icons. It shows the logo’s own landscape through a circular window and is never placed next to the full logo.</p>')
    x = X_HEIGHT
    cs = (f'<rect x="{-x}" y="{-x}" width="{LOGO_W + 2 * x}" height="{LOGO_H + 2 * x}" fill="#fff" stroke="{C["laterite"]}" stroke-width=".5" stroke-dasharray="2 2"/>'
          + logo_inline("fullcolour", 0, 0, LOGO_W)
          + "".join(f'<rect x="{px}" y="{py}" width="{x}" height="{x}" fill="{C["gold"]}" fill-opacity=".35"/>' for px, py in [(-x, -x), (LOGO_W, -x), (-x, LOGO_H), (LOGO_W, LOGO_H)])
          + f'<rect x="{88.9}" y="{30.3}" width="0" height="{x}" stroke="{C["laterite"]}" stroke-width=".6"/><text x="{LOGO_W + 2}" y="{LOGO_H / 2}" font-size="5" font-family="Inter" fill="{C["forest"]}">x</text>')
    add("Clear space", "Clear space = x",
        f'''<div class="cols c2" style="grid-template-columns:1.4fr 1fr"><div class="tile" style="background:{C['haze']};height:128mm">{svg(LOGO_W + 2 * x + 20, LOGO_H + 2 * x + 20, f'<g transform="translate({x + 10},{x + 10})">{cs}</g>')}</div>
        <div><p class="lead"><b>x</b> = the height of the lowercase “n” in the wordmark, about 11% of the logo’s width.</p><p>Keep at least 1x clear on all sides of the primary, horizontal and stacked logos. Keep 0.25 × the diameter clear around the Horizon Roundel.</p>
        <p>No text, image edge, other logo or graphic device may enter this zone. Allow more space where you can.</p></div></div>''')
    sizes = "".join(f'<div style="display:flex;align-items:flex-end;gap:3mm;margin-bottom:4mm"><div style="width:{mm}mm">{logo(small=sm)}</div><span class="small">{lab}</span></div>'
                    for mm, sm, lab in [(60, False, "60 mm — recommended for A4 letterhead"), (35, False, "35 mm / 140 px — minimum, primary"), (25, True, "25 mm / 100 px — minimum, small-format version")])
    add("Minimum sizes", "Minimum reproduction sizes",
        f'''<div class="cols c2"><div>{sizes}<div style="display:flex;gap:4mm;align-items:flex-end">{svg(41, 41, roundel_inline(0, 0, 41, "forest", uid="m1"), style="width:8mm")}{svg(41, 41, roundel_inline(0, 0, 41, "forest", uid="m2"), style="width:16mm")}<span class="small">Roundel minimum: 8 mm / 16 px (favicon)</span></div></div>
        <table><tr><th>Asset</th><th>Print min.</th><th>Digital min.</th></tr><tr><td>Primary logo</td><td>35 mm wide</td><td>140 px</td></tr><tr><td>Small-format logo</td><td>25 mm</td><td>100 px</td></tr>
        <tr><td>Horizontal lockup</td><td>40 mm</td><td>160 px</td></tr><tr><td>Stacked lockup</td><td>25 mm</td><td>100 px</td></tr><tr><td>Landscape symbol</td><td>15 mm</td><td>60 px</td></tr><tr><td>Horizon Roundel</td><td>8 mm</td><td>16 px</td></tr>
        <tr><td>Production 1-colour (engraving, embroidery)</td><td>40 mm</td><td>—</td></tr></table></div>''')
    cv = [(C["ivory"], "fullcolour", "Full colour on Ivory"), ("#FFFFFF", "fullcolour", "Full colour on White"), (C["forest"], "reversed", "Reversed on Forest"),
          (C["charcoal"], "reversed", "Reversed on Charcoal"), (C["ridge"], "white", "All-white on Ridge / photography"), ("#FFFFFF", "green", "One-colour Forest"),
          ("#FFFFFF", "black", "One-colour black"), (C["gold"], "green", "Forest on Sun Gold (campaign only)")]
    add("Colour variants", "Approved colourways",
        '<div class="cols c4">' + "".join(f'<div><div class="tile" style="background:{bg};height:34mm">{logo(cw)}</div><p class="small" style="margin-top:1.5mm">{t}</p></div>' for bg, cw, t in cv) + '</div>'
        '<p class="small" style="margin-top:3mm">On photography, place the all-white or reversed logo on a calm area, or over the Forest gradient overlay. Never put the full-colour logo on mid-tone or busy images.</p>')
    mis = [("Do not stretch or squash", f'<g transform="translate(26,-3) scale(.65,1.12)">{logo_inline("fullcolour", 0, 0, 150.25)}</g>'),
           ("Do not recolour", logo_inline(dict(word="#2E4FA8", hz="#2E4FA8", mt="#C03A7B", hzs="#C03A7B", sun="#13A8A0"), 0, 0, 150.25)),
           ("Do not rotate", f'<g transform="rotate(-12 75 30)">{logo_inline("fullcolour", 0, 0, 150.25)}</g>'),
           ("Do not add effects", f'<defs><filter id="ds"><feDropShadow dx="2" dy="3" stdDeviation="1.5" flood-opacity=".6"/></filter></defs><g filter="url(#ds)">{logo_inline("fullcolour", 0, 0, 150.25)}</g>'),
           ("Do not rearrange elements", logo_inline("fullcolour", 0, 0, 150.25).replace(PATH["sun"], PATH["sun"]) + f'<rect x="96" y="0" width="16" height="13" fill="#fff"/><path transform="translate(-95,4)" fill="{C["gold"]}" d="{PATH["sun"]}"/>'),
           ("Do not outline", f'<g fill="none" stroke="{C["forest"]}" stroke-width=".5">' + "".join(f'<path d="{PATH[p]}"/>' for p in ALL_PARTS) + "</g>"),
           ("Do not retype the wordmark", f'<text x="0" y="40" font-family="Arial" font-weight="700" font-size="22" fill="{C["forest"]}">Destination</text><text x="2" y="56" font-family="Arial" font-size="10" fill="{C["forest"]}" letter-spacing="4">NIGERIA</text>'),
           ("Do not place on busy, low-contrast grounds", f'<g transform="scale(.32)">{pattern_contour(C["ridge"], C["sage"], .9, 480, 3)}</g>' + logo_inline("fullcolour", 0, 0, 150.25))]
    add("Incorrect logo usage", "Incorrect usage",
        '<div class="cols c4">' + "".join(f'<div><div class="tile x" style="background:#fff;height:36mm;overflow:hidden">{svg(150.25, 62, b)}</div><p class="small" style="margin-top:1.5mm">{t}</p></div>' for t, b in mis) + '</div>'
        '<p class="small" style="margin-top:3mm">Also never: add a tagline inside the artwork, separate the sun from the inselberg in the primary logo, use the logo as a pattern on official documents, or put the logo inside a box other than the approved roundel.</p>')
    # ---------------- colour
    def swatch(k):
        nme, hx, grp, src, use = [(n_, h_, g_, s_, u_) for kk, n_, h_, g_, s_, u_ in COLORS if kk == k][0]
        r, g, b = hex_rgb(hx)
        tc = "#fff" if contrast(hx, "#FFFFFF") > 3 else C["forest"]
        return (f'<div class="sw"><div class="chip" style="background:{hx};color:{tc}">{nme}</div><div class="meta"><b>{hx}</b> · RGB {r} {g} {b}<br>CMYK {"/".join(map(str, CMYK_PRINT[k]))}'
                f'<br><span style="color:{C["stone"]}">{"Sampled from logo" if src == "sampled" else "Recommended"}</span></div></div>')
    add("Colour palette", "Primary palette",
        '<div class="cols c5">' + "".join(swatch(k) for k in ["forest", "ridge", "gold", "ivory", "white"]) + '</div>'
        f'<div style="display:flex;height:12mm;border-radius:2mm;overflow:hidden;margin-top:7mm"><div style="flex:60;background:{C["ivory"]};border:.3mm solid #ddd"></div><div style="flex:25;background:{C["forest"]}"></div><div style="flex:10;background:{C["ridge"]}"></div><div style="flex:5;background:{C["gold"]}"></div></div>'
        '<p class="small" style="margin-top:2mm">Typical proportion: Ivory/White 60% · Forest 25% · greens 10% · Sun Gold ≤ 5%. Gold is light, not decoration: one focal gold moment per composition.</p>')
    add("Supporting colours", "Secondary, neutral & landscape colours",
        '<div class="cols c5">' + "".join(swatch(k) for k in ["canopy", "sage", "mist", "golddeep", "charcoal"]) + '</div><div class="cols c5" style="margin-top:5mm">'
        + "".join(swatch(k) for k in ["stone", "haze", "laterite", "savannah", "confluence"]) + '</div>'
        '<p class="small" style="margin-top:3mm">Use landscape accents (Laterite, Savannah, Confluence) sparingly: at most one per piece and about 10% of the area. CMYK values are coated-stock starting points. Always ask the printer for a proof.</p>')
    pairs = [("Forest on Ivory", C["forest"], C["ivory"]), ("Charcoal on White", C["charcoal"], "#FFFFFF"), ("Stone on Ivory", C["stone"], C["ivory"]),
             ("Confluence on Ivory", C["confluence"], C["ivory"]), ("Harvest Gold on Ivory", C["golddeep"], C["ivory"]), ("Ivory on Forest", C["ivory"], C["forest"]),
             ("Sun Gold on Forest", C["gold"], C["forest"]), ("Sage on Forest", C["sage"], C["forest"]), ("Sun Gold on White", C["gold"], "#FFFFFF")]
    rows = "".join(f'<tr><td><span style="display:inline-block;padding:1mm 3mm;border-radius:1mm;background:{bg};color:{fg};font-weight:600">Aa</span> {t}</td><td>{contrast(fg, bg):.1f}:1</td>'
                   f'<td>{"AA body" if contrast(fg, bg) >= 4.5 else ("AA large/UI only" if contrast(fg, bg) >= 3 else "Fail — graphics only")}</td></tr>' for t, fg, bg in pairs)
    add("Colour accessibility", "Contrast, measured", f'<div class="cols c2"><table><tr><th>Pairing</th><th>Ratio</th><th>WCAG 2.2</th></tr>{rows}</table>'
        '<div><p class="lead">Body text must reach at least 4.5:1. Sun Gold is never used for text on light grounds. Use Harvest Gold instead.</p><p>Charts and maps must not rely on colour alone. Add labels, patterns or icons.</p></div></div>')
    # ---------------- type
    add("Typography", "Three open-licence families",
        f'''<div class="cols c3"><div class="card"><p class="ov">Display</p><div style="font:500 40pt/1 'Playfair Display'">Aa</div><h3 style="font:500 15pt 'Playfair Display'">Playfair Display</h3><p class="small">Headlines, titles, campaign lines. Echoes the high-contrast serif of the wordmark. Fallback: Georgia.</p></div>
        <div class="card"><p class="ov">Sans</p><div style="font:400 40pt/1 Inter">Aa</div><h3>Inter</h3><p class="small">UI, body, labels, tables, data (tabular figures, ₦). Overlines in caps at +0.22 em echo NIGERIA. Fallback: Calibri / Arial.</p></div>
        <div class="card"><p class="ov">Editorial</p><div style="font:400 40pt/1 'Source Serif 4'">Aa</div><h3 style="font:600 15pt 'Source Serif 4'">Source Serif 4</h3><p class="small">Long-form reading, standfirsts and pull quotes. Fallback: Cambria / Georgia.</p></div></div>
        <p class="small" style="margin-top:4mm">All three are licensed under the SIL Open Font License, are built into Google Workspace, and are supplied in 03_COLOR_AND_TYPOGRAPHY/fonts. Playfair Display has no ₦ glyph and no tabular figures, so always set prices and data in Inter.</p>''')
    rows = "".join(f'<tr><td><code>{t}</code></td><td><span style="font:{wt} {min(sz, 30) * .75}pt/{lh} {SERIF if fam == "display" else (EDIT if fam == "editorial" else SANS)};letter-spacing:{tr}em;{"text-transform:uppercase;" if t == "overline" else ""}color:{C["forest"]}">{u.split(",")[0]}</span></td><td class="small">{FONTS[fam]["family"]} {wt} · {sz}px / {lh}</td></tr>'
                   for t, fam, wt, sz, lh, tr, u in TYPE_SCALE if t not in ("data",))
    add("Type hierarchy", "Hierarchy", f'<table style="font-size:7.5pt">{rows}</table>')
    # ---------------- graphic language
    gl = [("Horizon lines", svg(1200, 180, horizon_set(C["forest"], C["ridge"]))), ("Sun disc", svg(200, 100, f'<circle cx="100" cy="50" r="40" fill="{C["gold"]}"/>')),
          ("Inselberg & ridges", svg(300, 100, f'<path fill="{C["ridge"]}" d="M0,100 C40,90 60,30 120,20 C170,15 190,70 220,80 C250,90 280,85 300,88 V100Z"/>')),
          ("Confluence curve", svg(300, 100, f'<path d="M0,30 C100,30 120,60 200,62 S280,62 300,62" fill="none" stroke="{C["confluence"]}" stroke-width="5"/><path d="M0,90 C100,90 120,64 200,62" fill="none" stroke="{C["forest"]}" stroke-width="5"/>')),
          ("Contour field", svg(480, 160, pattern_contour(C["forest"], None, .6))), ("Route line", svg(300, 80, f'<path d="M14,40 C100,0 200,80 286,40" fill="none" stroke="{C["confluence"]}" stroke-width="3" stroke-dasharray="1 8" stroke-linecap="round"/><circle cx="14" cy="40" r="7" fill="{C["forest"]}"/><circle cx="286" cy="40" r="10" fill="{C["gold"]}"/>'))]
    add("Graphic language", "Horizon & Inselberg",
        '<div class="cols c3">' + "".join(f'<div class="card"><div style="height:30mm;display:grid;place-items:center;overflow:hidden">{s}</div><h3 style="margin-top:2mm">{t}</h3></div>' for t, s in gl) + '</div>'
        '<p class="small" style="margin-top:3mm">Each device comes from the logo or from Nigeria’s land. Inselbergs are the granite monoliths of the central plateau. The confluence is where the Niger meets the Benue. Do not add unrelated ornament or generic “African” pattern.</p>')
    pats = [("Contour", pattern_contour(C["forest"], C["ivory"])), ("Horizon lines", pattern_horizon(C["ivory"], C["forest"])), ("Sun grid", pattern_sundots(C["forest"], C["ivory"])),
            ("Confluence", pattern_confluence(C["forest"], C["ivory"], C["confluence"]))]
    add("Patterns & textures", "Seamless patterns",
        '<div class="cols c4">' + "".join(f'<div>{svg(480, 480, b, style="border-radius:3mm;width:100%")}<p class="small">{t}</p></div>' for t, b in pats) + '</div>'
        '<p class="small" style="margin-top:3mm">Tiles: 04_VECTOR_GRAPHICS_AND_ICONS/patterns (SVG plus PNG previews). Paper grain: 05_BACKGROUNDS_AND_TEXTURES/textures. Patterns support layouts; they never sit behind the logo or body text at more than 12% contrast.</p>')
    add("Photography direction", "Real places, real people, warm light",
        f'''<div class="cols c3"><div><p class="ov">Principles</p><ul><li><b>Specific:</b> a named place, dish, festival or maker, never a generic “Africa” shot.</li><li><b>Human:</b> people as protagonists with agency, photographed with consent.</li><li><b>Golden-hour warmth:</b> creamy highlights and gentle shadows lifted toward Forest.</li><li><b>Horizon composition:</b> leave sky or calm space for type.</li><li><b>Dignified:</b> no poverty tourism, no exoticising and no staged “tribal” clichés.</li></ul></div>
        <div><img class="th" src="{R}06_PHOTOGRAPHY_AND_MEDIA/placeholders/DN_placeholder_landscape-dawn_3x2.jpg"><p class="small">Placeholder art direction: horizon low, sun as focal point, space for type. Replace with licensed photography.</p></div>
        <div><p class="ov">Grading</p><ul><li>Shadows +5–10% toward Forest #103428.</li><li>Keep skin tones true; never grade skin green or grey.</li><li>Text overlays use the Forest gradient (05/11), never black.</li><li>Duotone (Forest → Savannah) is for texture only, never for portraits.</li><li>Avoid HDR, heavy teal-and-orange and over-saturated greens.</li></ul></div></div>''')
    add("Image licensing & attribution", "Every image needs a record",
        f'''<div class="cols c2"><div><p class="lead">No photograph in this kit shows a real place. Every image slot holds a clearly labelled, illustrated placeholder.</p>
        <p>Stock libraries searched during production did not return verifiable Nigerian locations. Using foreign landscapes would misrepresent the country, so none were used.</p></div>
        <div class="card"><p class="ov">Before publishing any image</p><ul><li>Record the source, photographer, licence, licence ID, location (verified), date and model/property releases in 06/SOURCE_RECORDS/image-register.csv.</li>
        <li>Credit format: <i>Photo: Name / Agency</i>, in the caption or the credits list.</li><li>Use AI-generated imagery only if it is labelled as such, and never to depict real destinations, people or events.</li><li>Get written consent from identifiable people, and community approval for sacred or ceremonial subjects.</li></ul></div></div>''')
    ig = "".join(f'<div style="text-align:center"><div style="background:#fff;border-radius:2mm;padding:3mm;display:flex;gap:2mm;justify-content:center">{svg(24, 24, icon_body(k, "line", C["forest"]), style="width:10mm")}'
                 f'{svg(24, 24, icon_body(k, "solid", C["forest"], uid="g" + k), style="width:10mm")}</div><p class="small" style="margin:1mm 0 0">{LABELS[k]}</p></div>' for k in BRIEF)
    add("Iconography", "Icon family", f'<div class="cols c7" style="display:grid;grid-template-columns:repeat(7,1fr);gap:4mm">{ig}</div>'
        '<p class="small" style="margin-top:4mm">24-unit grid · 2-unit safe margin · 1.5 stroke · round caps and joins. Line and solid styles share their geometry. There are also 18 interface and brand extras. Files: SVG (Forest and currentColor versions) plus a web sprite.</p>')
    bgs = ["01_ivory-corporate", "02_forest-institutional", "04_green-ivory-editorial-gradient", "05_golden-horizon", "06_abstract-mountain-landscape", "07_topographic-contour",
           "08_subtle-geometric", "09_dark-cinematic", "10_investment-premium", "12_event-stage", "13_confluence-campaign", "14_savannah-editorial"]
    add("Backgrounds", "Background library",
        '<div class="cols c4" style="gap:4mm">' + "".join(f'<div><img class="th" src="{R}05_BACKGROUNDS_AND_TEXTURES/{b}/DN_bg_{b}_16x9_1920x1080.jpg"><p class="small" style="margin:1mm 0 0">{b[3:].replace("-", " ").capitalize()}</p></div>' for b in bgs) + '</div>'
        '<p class="small" style="margin-top:2mm">14 backgrounds, each in 16:9, 4:5, 9:16 and A4 portrait and landscape (vector PDF). SVG sources are included.</p>')
    grid = "".join(f'<rect x="{18 + i * 22.6}" y="10" width="18.6" height="130" fill="{C["gold"]}" fill-opacity=".15"/>' for i in range(12))
    add("Layout, grid & spacing", "Horizon structure",
        f'''<div class="cols c2"><div class="tile" style="background:#fff;height:100mm">{svg(297, 150, f'<rect width="297" height="150" fill="{C["ivory"]}"/>' + grid + f'<path d="M0,96 H297" stroke="{C["forest"]}" stroke-dasharray="3 2" stroke-width=".6"/><circle cx="250" cy="40" r="10" fill="{C["gold"]}"/><text x="20" y="92" font-family="Inter" font-size="6" fill="{C["forest"]}">horizon line ≈ ⅔ height: content below, sky (space) above</text>')}</div>
        <div><ul><li><b>Grid:</b> 12 columns. A4 margins 22 mm; 16:9 slides 0.75 in; web max 1240 px with 24 px gutters.</li><li><b>Spacing:</b> 8-point scale (4, 8, 12, 16, 24, 32, 48, 64, 96, 128).</li><li><b>Horizon:</b> one strong horizontal division per layout; type sits on or below it.</li><li><b>Logo position:</b> top-left by default; centred only on ceremonial items.</li><li><b>One sun:</b> one gold focal point per composition.</li></ul></div></div>''')
    dt = ["letter", "memo", "report", "proposal", "minutes", "invoice", "press", "advisory", "factsheet", "investment", "certificate", "feedback"]
    add("Document templates", "Document system",
        '<div class="cols c6" style="gap:4mm">' + "".join(f'<div><img class="th" src="assets/doc_{d}.png"><p class="small" style="margin:1mm 0 0">{d.capitalize()}</p></div>' for d in dt) + '</div>'
        '<p class="small" style="margin-top:3mm">There are 22 Word templates (DOCX, plus DOTX for the core set) with real styles and content-control placeholders, PDF exports, and calculating XLSX files for invoices, quotations and action tracking. No contact details, bank details, seals or registrations have been invented.</p>')
    add("Presentation design", "Presentation master",
        '<div class="cols c4" style="gap:4mm">' + "".join(f'<img class="th" src="assets/slide_{s:02d}.png">' for s in (1, 3, 4, 5, 8, 9, 12, 13, 14, 19, 20, 21)) + '</div>'
        '<p class="small" style="margin-top:3mm">21 named layouts with theme colours and fonts, picture, chart and table placeholders, and an always-on slide number. The sample deck includes a native, editable chart and table. Files: PPTX, POTX and PDF.</p>')
    so = ["discover-destination", "experience-culture", "explore-business", "meet-partner", "investment-opportunity", "national-tourism-week", "industry-insight", "official-news"]
    add("Social media", "Template family",
        '<div class="cols c4" style="gap:4mm">' + "".join(f'<div><img class="th" src="{R}11_SOCIAL_MEDIA_TEMPLATES/{k}/DN_social_{k}_square_1080x1080.png"><p class="small" style="margin:1mm 0 0">{k.replace("-", " ").capitalize()}</p></div>' for k in so) + '</div>'
        '<p class="small" style="margin-top:2mm">Each template comes in 4:5, 1:1, 9:16 (Stories, Reels covers, WhatsApp status) and 16:9 (LinkedIn, Facebook, X), plus YouTube and banner sizes. Edit content.json and re-run social.py. Never publish statistics, dates or endorsements that have not been verified.</p>')
    add("Motion identity", "Logo reveal storyboard",
        '<div class="cols c6" style="gap:3mm">' + "".join(f'<div><img class="th" src="assets/A_{t}.jpg"><p class="small" style="margin:1mm 0 0">{t}s</p></div>' for t in ("0.8", "1.8", "2.6", "3.3", "4.2", "6.9")) + '</div>'
        '<div class="cols c2" style="margin-top:5mm"><div class="cols c4" style="gap:3mm">' + "".join(f'<img class="th" src="assets/E_{t}.jpg">' for t in ("0.4", "1.0", "1.6", "3")) + '</div>'
        '<div><ul><li><b>A</b> Cinematic reveal, 7 s · <b>B</b> Minimal, 2.5 s · <b>C</b> Presentation opener, 8 s · <b>D</b> Seamless loop, 20 s · <b>E</b> Symbol, 3 s.</li>'
        '<li>Easing: cubic out (ease-out) and a mild back-out on the sun only. No spins, morphs, shakes or particles. The logo is only ever scaled uniformly.</li><li>Formats: MP4 (H.264), WebM, lossless alpha MOV (PNG codec), VP9 alpha, GIF previews, Lottie (B, E) and a PNG of the final frame.</li></ul></div></div>')
    add("Sonic identity", "A drum that speaks, a sun that rises",
        f'''<img src="assets/wave.png" style="width:100%;height:24mm;object-fit:fill;opacity:.9">
        <div style="display:flex;justify-content:space-between" class="small"><span>0.0 Pad · shekere</span><span>0.9 Talking-drum phrase</span><span>2.1 Thumb-piano ascent</span><span>3.3 Sun: bell + chord</span><span>6.5</span></div>
        <div class="cols c3" style="margin-top:6mm"><div class="card"><h3>Sonic logo · 6.5 s</h3><p class="small">D major pentatonic. A dùndún-style talking-drum phrase “speaks”, then a lamellophone ascent rises to the sun moment. Synced to motion A.</p></div>
        <div class="card"><h3>Sting · 2.5 s</h3><p class="small">Drum glide, three tines, bell. Used for web welcomes, short social and bumpers (motion B and E).</p></div>
        <div class="card"><h3>Intro bed · 30 s loop</h3><p class="small">A 12/8 groove with bell pattern, shekere, bass and tines. Seamless loop at −18 LUFS. The masters are −16 LUFS, 48 kHz / 24-bit WAV, plus 320 kbps MP3.</p></div></div>
        <p class="small" style="margin-top:3mm">The audio is an original composition, fully synthesised in code (16_SOURCE_FILES/build/sonic.py). It uses no samples and no third-party recordings. Recording live instruments with Nigerian musicians is recommended for v2.</p>''')
    add("Accessibility", "Designed for everyone",
        '<div class="cols c3"><div class="card"><h3>Colour & type</h3><ul><li>Body contrast ≥ 4.5:1; UI ≥ 3:1.</li><li>Body text ≥ 10 pt in print, 16 px on the web.</li><li>No gold text on light grounds.</li></ul></div>'
        '<div class="card"><h3>Digital</h3><ul><li>Visible focus: 3 px Sun Gold ring.</li><li>Alt text for every image, and captions for all video.</li><li>Honour reduced motion (the loader and cards do).</li><li>Error messages in text, not colour alone.</li></ul></div>'
        '<div class="card"><h3>Documents & events</h3><ul><li>Use real Word heading styles, so PDFs are tagged.</li><li>Large-print versions on request.</li><li>Signage: 40 mm letters for 10 m viewing, and pictograms with text.</li><li>Plain language first.</li></ul></div></div>')
    add("Digital usage", "Web system",
        f'<div class="cols c2"><img class="th" src="{R}12_WEBSITE_ASSETS/components/DN_components_preview.png" style="height:120mm;object-fit:cover;object-position:top">'
        '<div><ul><li><b>Tokens:</b> dn-tokens.css and dn-tokens.json (W3C design-token format).</li><li><b>Components:</b> buttons, search, destination, editorial and investment cards, forms, alerts, newsletter, map, 404 and empty states, loader.</li>'
        '<li><b>Icons:</b> favicon.ico/svg, 16–512 px PNGs, maskable icon, manifest.</li><li><b>Sharing:</b> Open Graph cover 1200 × 630.</li><li><b>Map:</b> MapLibre style JSON in brand colours, plus SVG maps.</li></ul></div></div>')
    add("Print production", "Print specifications",
        '<table><tr><th>Item</th><th>Size</th><th>Bleed / safe</th><th>Stock & finish (recommended)</th></tr>'
        '<tr><td>Letterhead</td><td>A4</td><td>No bleed; 10 mm minimum margin</td><td>100–120 gsm uncoated, natural white</td></tr>'
        '<tr><td>Business cards</td><td>85 × 55 mm</td><td>3 mm / 4 mm</td><td>400 gsm uncoated; premium: gold foil on the sun only</td></tr>'
        '<tr><td>Reports</td><td>A4</td><td>3 mm on covers</td><td>Cover 300 gsm silk + matt laminate; text 115 gsm</td></tr>'
        '<tr><td>Roll-up banner</td><td>850 × 2000 mm</td><td>3 mm; bottom 150 mm hidden</td><td>Anti-curl PET, matt</td></tr>'
        '<tr><td>Media wall</td><td>3000 × 2400 mm</td><td>50 mm</td><td>Matt fabric (no glare under lights)</td></tr>'
        '<tr><td>Signage A2</td><td>420 × 594 mm</td><td>3 mm</td><td>5 mm foamex or Dibond, matt</td></tr></table>'
        '<p class="small" style="margin-top:3mm">Colour: send PDF/X-4 with fonts embedded. Use the CMYK starting values in 03 and ask for a hard proof. Evaluate the Pantone candidates (Forest 3435 C / 553 C; Gold 7409 C / 7563 C) against a physical guide. Use the production 1-colour compound path for dies, foil, embossing, engraving and embroidery.</p>')
    add("File formats & naming", "Formats and naming",
        '<div class="cols c2"><table><tr><th>Use</th><th>Format</th></tr><tr><td>Logos (any size)</td><td>SVG · PDF · EPS (vector)</td></tr><tr><td>Office / web raster</td><td>PNG (transparent), JPG, WebP</td></tr>'
        '<tr><td>Documents</td><td>DOCX / DOTX → PDF</td></tr><tr><td>Presentations</td><td>PPTX / POTX → PDF</td></tr><tr><td>Motion</td><td>MP4, WebM, MOV with lossless alpha (PNG codec; ProRes 4444 on request), Lottie JSON, GIF preview</td></tr>'
        '<tr><td>Audio</td><td>WAV 48 kHz / 24-bit master, MP3 320 kbps</td></tr><tr><td>Digital system</td><td>CSS variables, JSON tokens, HTML</td></tr></table>'
        '<div><p class="ov">Naming convention</p><p><code>DN_[asset]_[variant]_[size or format]_[version].ext</code></p><p class="small">For example: DN_logo_primary_reversed_2000px.png · DN_bg_05_golden-horizon_16x9_1920x1080.jpg · DN_Report_Template_A4_v1.1.docx</p>'
        '<ul class="small"><li>Use lowercase-hyphenated descriptors.</li><li>Put the version only on edited derivatives (v1.1, v2.0). Masters keep their names.</li><li>Never overwrite masters; save derivatives to 17_EXPORTS.</li></ul></div></div>')
    add("Governance", "Brand asset governance",
        '<div class="cols c3"><div class="card"><h3>Ownership</h3><p class="small">The brand owner, to be named by Destination Nigeria, approves new templates, partner co-branding and any change to the masters.</p></div>'
        '<div class="card"><h3>Approval flow</h3><ol class="small"><li>Draft from an official template.</li><li>Fact and source check, with the verification line completed.</li><li>Brand check against the quick-reference sheet.</li><li>Sign-off by the brand owner (external use).</li></ol></div>'
        '<div class="card"><h3>Partners & co-branding</h3><p class="small">Partner logos appear only with a signed agreement and approved files. The partner badge is for contracted partners only. Never imply government affiliation, endorsement or official status that has not been confirmed in writing.</p></div></div>'
        '<p class="small" style="margin-top:4mm">Version the kit like software. Record every change in 18_QA_AND_HANDOVER/CHANGELOG.md and rebuild with the scripts in 16_SOURCE_FILES/build.</p>')
    add("Approved & prohibited applications", "Do and don’t",
        '<div class="cols c2"><div class="card"><p class="ov" style="color:#2E7D4F">Approved</p><ul><li>Official templates from this kit</li><li>The master logo files, unaltered</li><li>Verified facts with sources</li><li>Licensed, credited photography</li><li>Campaign line as a separate lockup</li><li>Partner badge with a signed agreement</li></ul></div>'
        f'<div class="card"><p class="ov" style="color:{C["laterite"]}">Prohibited</p><ul><li>Fake or implied official seals, crests or coats of arms</li><li>Unverified partner, sponsor or government logos</li><li>Invented statistics, dates, addresses or bank details</li><li>Stretched, recoloured or retyped logos</li><li>Generic “African” patterns and stereotypes</li><li>Political or commercial endorsements without approval</li></ul></div></div>')
    mk = ["01_stationery-flatlay", "03_reports-and-proposals", "04_presentation-screens", "05_digital-devices-and-website", "07_event-stage", "08_exhibition-stand",
          "09_staff-identification", "10_directional-signage", "11_presentation-folder", "12_tourism-brochure-and-info", "02_business-cards", "06_social-media-system"]
    add("Applications gallery", "In use",
        '<div class="cols c4" style="gap:3mm">' + "".join(f'<img class="th" src="{R}15_MOCKUPS/DN_mockup_{m}.jpg">' for m in mk) + '</div>'
        '<p class="small" style="margin-top:2mm">The mockups are visualisations only. Production artwork lives in folders 02–13.</p>')
    P.append(f'<section class="page dark" style="display:grid;place-items:center">{svg(LOGO_W, LOGO_H, logo_inline("reversed", 0, 0, LOGO_W), style="width:110mm")}'
             f'<p class="small" style="position:absolute;bottom:14mm;left:0;right:0;text-align:center">Brand questions and approvals: [brand owner name · email]  ·  v1.0  ·  [Month YYYY]</p></section>')
    return "".join(P)


def campaign_svg():
    b, w = campaign_line(C["forest"], size=20, y=20)
    return svg(w + 2, 26, b, style="width:80mm")


def quickref():
    sw = "".join(f'<div style="flex:1"><div style="height:16mm;background:{C[k]};border-radius:1.5mm;border:.3mm solid #ddd"></div><div class="small"><b>{n}</b><br>{C[k]}</div></div>'
                 for k, n in [("forest", "Forest Deep"), ("ridge", "Ridge Green"), ("gold", "Sun Gold"), ("ivory", "Harmattan Ivory"), ("golddeep", "Harvest Gold"), ("stone", "Stone")])
    html = f"""<!doctype html><html><head><meta charset="utf-8"><title>Destination Nigeria — Quick Reference</title><style>{CSS}
    @page {{ size: 210mm 297mm; margin:0 }} .q {{ width:210mm;height:297mm;padding:16mm;background:{C['ivory']};position:relative;page-break-after:always }}</style></head><body>
    <div class="q"><div style="display:flex;justify-content:space-between;align-items:center">{svg(LOGO_W, LOGO_H, logo_inline("fullcolour", 0, 0, LOGO_W), style="width:60mm")}<p class="ov">Brand quick reference · v1.0</p></div>
    <h2 class="pt" style="margin-top:10mm">The essentials on one sheet</h2>
    <div class="cols c2"><div><p class="ov">Logo</p><ul><li>Use the master files only (02_LOGO_MASTER_FILES).</li><li>Clear space: 1 × the height of the “n” on all sides.</li><li>Minimum: 35 mm / 140 px (small-format: 25 mm / 100 px).</li><li>Full colour on Ivory or White, reversed on Forest or photography.</li><li>Never stretch, recolour, rotate, outline, add effects or retype.</li></ul></div>
    <div><p class="ov">Campaign line</p>{campaign_svg()}<p class="small">Set separately from the logo. Inter SemiBold, caps, +0.22 em, with Sun Gold full stops.</p></div></div>
    <p class="ov" style="margin-top:6mm">Colour</p><div style="display:flex;gap:3mm">{sw}</div><p class="small">60% Ivory/White · 25% Forest · 10% greens · ≤5% Gold. Never set gold text on light grounds.</p>
    <div class="cols c3" style="margin-top:6mm"><div><p class="ov">Display</p><div style="font:500 22pt 'Playfair Display';color:{C['forest']}">Playfair Display</div><p class="small">Headlines, titles. Office fallback: Georgia.</p></div>
    <div><p class="ov">Sans</p><div style="font:500 20pt Inter;color:{C['forest']}">Inter</div><p class="small">Body, UI, data, ₦. Office fallback: Calibri.</p></div>
    <div><p class="ov">Editorial</p><div style="font:400 20pt 'Source Serif 4';color:{C['forest']}">Source Serif 4</div><p class="small">Long reads, quotes. Office fallback: Cambria.</p></div></div>
    <div class="cols c2" style="margin-top:6mm"><div class="card"><p class="ov">Always</p><ul><li>Start from an official template.</li><li>Verify every fact, date, name and figure.</li><li>Use licensed, credited photography.</li><li>Leave space: one horizon, one sun.</li></ul></div>
    <div class="card"><p class="ov" style="color:{C['laterite']}">Never</p><ul><li>Invent seals, addresses, bank details or statistics.</li><li>Show partner logos without a signed agreement.</li><li>Imply that an unconfirmed event is scheduled.</li><li>Use generic “African” patterns or stereotypes.</li></ul></div></div>
    <p class="small" style="position:absolute;bottom:12mm">Full guidelines: 14_BRAND_GUIDELINES/DN_Brand-Guidelines_v1.0.pdf · Approvals: [brand owner · email]</p></div></body></html>"""
    (SRC / "DN_Brand-Quick-Reference.html").write_text(html)


if __name__ == "__main__":
    thumbs()
    html = (f'<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><title>Destination Nigeria — Brand Guidelines v1.0</title>'
            f'<style>{CSS}</style></head><body>{build()}</body></html>')
    (SRC / "DN_Brand-Guidelines.html").write_text(html)
    quickref()
    jobs = [dict(src=str(SRC / "DN_Brand-Guidelines.html"), out=str(G / "DN_Brand-Guidelines_v1.0.pdf"), w=1123, h=794, format="pdf", pdfW="297mm", pdfH="210mm", wait=500),
            dict(src=str(SRC / "DN_Brand-Quick-Reference.html"), out=str(G / "DN_Brand-Quick-Reference_v1.0.pdf"), w=794, h=1123, format="pdf", pdfW="210mm", pdfH="297mm", wait=300)]
    json.dump(jobs, open(KIT / "16_SOURCE_FILES/build/_jobs/_jobs_guidelines.json", "w"), indent=1)
    print("ok")
