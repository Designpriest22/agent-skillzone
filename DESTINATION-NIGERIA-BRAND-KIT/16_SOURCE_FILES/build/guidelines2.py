"""Brand guidelines v2 (A4 landscape) and quick reference → 14_BRAND_GUIDELINES.

HTML/CSS source printed to PDF by Chromium. Logos, swatches and specimens are drawn live from
brand.py; every example image is a render of a real deliverable in this kit.
"""
import json
import subprocess
from html import escape
from pathlib import Path
from brand import C, COLORS, KIT, CONTACT, PHOTOS, LOGO_W, LOGO_H, hex_rgb, contrast, photo
from tokens import CMYK_PRINT
from v2 import font_css, logo_svg, plate_svg, rel

G = KIT / "14_BRAND_GUIDELINES"
SRC = G / "source"
A = SRC / "assets"
A.mkdir(parents=True, exist_ok=True)
VERSION = "2.0"


def pdfpng(pdf, n, name, dpi=60):
    out = A / name
    subprocess.run(["pdftocairo", "-png", "-r", str(dpi), "-f", str(n), "-l", str(n), "-singlefile", str(pdf), str(out)], check=True)
    return Path(str(out) + ".png")


def im(path, style="", cls="shot"):
    return f'<img class="{cls}" src="{rel(path, SRC)}" style="{style}">'


def page(num, section, title, body, dark=False, lead=None):
    t = f'<h2 class="pt">{title}</h2>' if title else ""
    l = f'<p class="lead">{lead}</p>' if lead else ""
    return (f'<section class="page {"dark" if dark else ""}"><div class="ph"><span>{escape(section)}</span><span class="num">{num:02d}</span></div>'
            f'{t}{l}<div class="pb">{body}</div>'
            f'<div class="pf"><span>Destination Nigeria · Brand guidelines {VERSION}</span><span>{CONTACT["web"]}</span></div></section>')


CSS = f"""
@page {{ size: 297mm 210mm; margin: 0; }}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
html,body {{ font-family: 'Public Sans', Arial, sans-serif; color: {C['charcoal']}; font-size: 9pt; line-height: 1.5;
  -webkit-print-color-adjust: exact; print-color-adjust: exact; font-feature-settings: 'kern','lnum'; }}
.page {{ width: 297mm; height: 210mm; position: relative; padding: 0; background: {C['ivory']}; page-break-after: always; overflow: hidden; }}
.page.dark {{ background: {C['forest']}; color: {C['ivory']}; }}
.ph {{ position: absolute; top: 11mm; left: 20mm; right: 20mm; display: flex; justify-content: space-between; font: 600 6.8pt 'Public Sans'; letter-spacing: .08em; text-transform: uppercase; color: {C['golddeep']}; }}
.dark .ph {{ color: {C['sage']}; }}
.ph .num {{ color: {C['stone']}; }} .dark .ph .num {{ color: {C['sage']}; }}
.pt {{ position: absolute; top: 20mm; left: 20mm; width: 150mm; font: 400 25pt/1.04 'Newsreader Display', Georgia, serif; letter-spacing: -.015em; color: {C['forest']}; }}
.dark .pt {{ color: {C['ivory']}; }}
.lead {{ position: absolute; top: 21mm; left: 178mm; width: 99mm; font: 400 10.5pt/1.45 'Newsreader Text', Georgia, serif; color: {C['forest']}; }}
.dark .lead {{ color: {C['sage']}; }}
.pb {{ position: absolute; top: 56mm; left: 20mm; right: 20mm; bottom: 18mm; }}
.pf {{ position: absolute; bottom: 9mm; left: 20mm; right: 20mm; display: flex; justify-content: space-between; font: 6.5pt 'Public Sans'; color: {C['stone']}; }}
.dark .pf {{ color: {C['sage']}; }}
.g {{ display: grid; gap: 7mm; }} .g2 {{ grid-template-columns: 1fr 1fr; }} .g3 {{ grid-template-columns: repeat(3,1fr); }} .g4 {{ grid-template-columns: repeat(4,1fr); }} .g5 {{ grid-template-columns: repeat(5,1fr); }}
.rule {{ border-top: .35mm solid {C['forest']}; padding-top: 2.6mm; }}
.dark .rule {{ border-color: {C['ridge']}; }}
h3 {{ font: 600 9pt 'Public Sans'; color: {C['forest']}; margin-bottom: 1.6mm; }}
.dark h3 {{ color: {C['ivory']}; }}
h4 {{ font: 400 15pt/1.15 'Newsreader Display'; color: {C['forest']}; margin-bottom: 2mm; }}
.dark h4 {{ color: {C['ivory']}; }}
p + p {{ margin-top: 1.8mm; }}
.cap {{ font: 7pt/1.35 'Public Sans'; color: {C['stone']}; margin-top: 1.8mm; }}
.dark .cap {{ color: {C['sage']}; }}
.shot {{ display: block; width: 100%; outline: .25mm solid {C['haze']}; }}
.dark .shot {{ outline-color: {C['ridge']}; }}
.box {{ background: #fff; display: grid; place-items: center; }}
.box svg {{ width: 70%; height: auto; }}
table {{ border-collapse: collapse; width: 100%; font-size: 7.6pt; }}
th {{ text-align: left; font: 600 6.3pt 'Public Sans'; letter-spacing: .06em; text-transform: uppercase; color: {C['forest']}; border-bottom: .45mm solid {C['forest']}; padding: 1.4mm 2mm 1.4mm 0; }}
td {{ padding: 1.3mm 2mm 1.3mm 0; border-bottom: .25mm solid {C['haze']}; vertical-align: top; }}
.dark td {{ border-color: {C['ridge']}; }}
.n {{ font-feature-settings: 'tnum','lnum'; }}
.dont {{ position: relative; }}
.dont::after {{ content: ''; position: absolute; left: 0; right: 0; top: 50%; border-top: .35mm solid {C['stone']}; transform: rotate(-12deg); }}
ul.l {{ list-style: none; }} ul.l li {{ padding: 1.2mm 0; border-bottom: .25mm solid {C['haze']}; }}
.dark ul.l li {{ border-color: {C['ridge']}; }}
"""


def swatch(k, name, hx, group, src, use):
    r, g, b = hex_rgb(hx)
    fg = C["ivory"] if contrast(hx, "#FFFFFF") > 4.5 else C["forest"]
    return (f'<div><div style="height:30mm;background:{hx};outline:.25mm solid {C["haze"]};padding:2.4mm;color:{fg};font:600 7.5pt \'Public Sans\';display:flex;align-items:flex-end">{escape(name)}</div>'
            f'<div class="cap n" style="color:{C["charcoal"]}">{hx}<br>RGB {r} {g} {b}<br>CMYK {"/".join(map(str, CMYK_PRINT[k]))}</div>'
            f'<div class="cap">{escape(use)}</div></div>')


def build():
    D9, D10 = KIT / "09_DOCUMENT_TEMPLATES", KIT / "10_PRESENTATION_TEMPLATES/DN_Presentation-Template_16x9.pdf"
    S = KIT / "11_SOCIAL_MEDIA_TEMPLATES"
    PL = KIT / "04_VECTOR_GRAPHICS_AND_ICONS/ENGRAVED_PLATES/PNG"
    BG = KIT / "05_BACKGROUNDS_AND_TEXTURES"
    FILM = KIT / "07_MOTION_IDENTITY/BRAND_FILM_25s"
    P = []
    n = [1]

    def add(section, title, body, dark=False, lead=None):
        n[0] += 1
        P.append(page(n[0], section, title, body, dark, lead))

    # ---------------------------------------------------------------- cover
    P.append(f'''<section class="page"><div style="position:absolute;left:20mm;top:18mm;width:62mm">{logo_svg("fullcolour")}</div>
<div class="plate" style="position:absolute;right:0;top:0;width:175mm">{plate_svg("zuma-rock", "forest")}</div>
<div style="position:absolute;right:20mm;top:{175 * 0.625 + 4:.1f}mm;font:7pt 'Public Sans';color:{C['stone']}">Pl. 01&ensp;Zuma Rock, Niger State</div>
<div style="position:absolute;left:20mm;bottom:40mm;font:400 46pt/0.98 'Newsreader Display';letter-spacing:-.02em;color:{C['forest']}">Brand<br>guidelines</div>
<div style="position:absolute;left:20mm;bottom:22mm;font:400 10pt 'Newsreader Text';color:{C['stone']}">Version {VERSION}. The land, drawn and photographed.</div></section>''')

    # ---------------------------------------------------------------- contents
    toc = [("The idea", 3), ("Logo", 5), ("Colour", 9), ("Typography", 11), ("Composition", 14), ("Photography", 16),
           ("Engraved plates", 18), ("Backgrounds", 19), ("Applications", 20), ("Motion and sound", 27), ("Voice", 29), ("Files and contacts", 30)]
    body = '<div class="g g2" style="gap:0 16mm">' + "".join(
        f'<div class="rule" style="display:flex;justify-content:space-between;padding-bottom:3mm;margin-bottom:2mm"><span style="font:400 13pt \'Newsreader Display\';color:{C["forest"]}">{t}</span><span class="n" style="color:{C["stone"]}">{p:02d}</span></div>'
        for t, p in toc) + "</div>"
    add("Contents", "Contents", body)

    # ---------------------------------------------------------------- 1 the idea
    body = f'''<div class="g g3">
<div><div class="box" style="height:62mm">{logo_svg("fullcolour")}</div><p class="cap">The logo: an inselberg and a sun on a horizon, above the name.</p></div>
<div>{im(PL / "DN_plate_zuma-rock_forest.png", "height:62mm;object-fit:cover")}<p class="cap">The plate: Zuma Rock, engraved from a photograph.</p></div>
<div>{im(photo("zuma-rock"), "height:62mm;object-fit:cover")}<p class="cap">The place: Zuma Rock, Niger State.</p></div></div>
<div class="g g3" style="margin-top:9mm"><div class="rule"><h3>One idea</h3><p>The logo is a drawing of a real kind of place. The identity extends that drawing in two honest ways: photographs of real places, and engraved plates traced from those photographs.</p></div>
<div class="rule"><h3>One structure</h3><p>Every layout is divided by a horizon, the way the logo is: land above, words below. The horizon is a photograph's edge, a plate's edge or a single hairline.</p></div>
<div class="rule"><h3>One sun</h3><p>Sun Gold is the sun: the disc in the logo, one disc in a plate, one figure or one call to action. It is never decoration.</p></div></div>'''
    add("The idea", "The land, drawn and photographed.", body, lead="Destination Nigeria shows the country as it is. Nothing in this system is invented: every place is real, captioned and credited.")

    body = '<div class="g g3">' + "".join(f'''<div class="rule"><h4>{w}</h4><p>{d}</p><p class="cap">{a}</p></div>''' for w, d, a in [
        ("Experience.", "Nigeria's places, culture, food, festivals and hospitality, met first-hand.", "For travellers and the diaspora."),
        ("Invest.", "Tourism is a coordinated, investable sector with real projects and verified information.", "For investors and partners."),
        ("Explore.", "Landscapes from coast to plateau to savannah, with the routes made clear.", "For everyone.")]) + "</div>"
    body += f'''<div style="margin-top:12mm" class="g g2"><div class="rule"><h3>Essence</h3><p style="font:400 18pt/1.2 'Newsreader Display';color:{C['forest']}">Horizons, opened.</p></div>
<div class="rule"><h3>Promise</h3><p style="font:400 11pt/1.45 'Newsreader Text';color:{C['forest']}">We will show you Nigeria as it is: varied, creative and full of opportunity, and give you what you need to experience it, invest in it and explore it with confidence.</p></div></div>'''
    add("The idea", "Experience. Invest. Explore.", body, lead="The proposition is set in sentence case with full stops, in Newsreader Display. It is a sign-off, not a headline on every piece.")

    # ---------------------------------------------------------------- 2 logo
    body = f'''<div class="g g2" style="grid-template-columns:1.4fr 1fr"><div class="box" style="height:118mm">{logo_svg("fullcolour")}</div>
<div><ul class="l"><li><b>Landscape.</b> The inselberg, its neighbour and the horizon swashes, in Forest and Ridge.</li><li><b>Sun.</b> Sun Gold. The only gold in the logo.</li>
<li><b>Destination.</b> A high-contrast serif wordmark with a river-like tail on the D.</li><li><b>NIGERIA.</b> Spaced capitals beneath.</li></ul>
<p class="cap" style="margin-top:4mm">The master is the supplied full-colour artwork, preserved exactly. The reversed version corrects one misplaced i-dot in the supplied Asset_1. Nothing else has been redrawn.</p>
<p class="cap">Files: 02_LOGO_MASTER_FILES (SVG, PDF, EPS, PNG).</p></div></div>'''
    add("Logo", "The master logo", body)

    cws = [("fullcolour", C["ivory"], "Full colour on Paper or White: the default."), ("reversed", C["forest"], "Reversed on Forest, Ink or dark photography."),
           ("white", C["charcoal"], "White: one colour, on busy dark grounds and video."), ("green", "#FFFFFF", "Forest: one-colour print."), ("black", "#FFFFFF", "Black: newsprint and stamps.")]
    body = '<div class="g g5">' + "".join(f'<div><div class="box" style="height:52mm;background:{bg}">{logo_svg(cw)}</div><p class="cap">{t}</p></div>' for cw, bg, t in cws) + "</div>"
    body += f'''<div class="g g2" style="margin-top:10mm"><div class="rule"><h3>Small sizes</h3><p>Below 160 px or 35 mm, use the small-format version. It drops the hairline secondary horizon and adds an optical stroke to NIGERIA.</p></div>
<div class="rule"><h3>The roundel</h3><p>The horizon roundel is used only where the full logo cannot be read: avatars, app icons and favicons. Never use it as ornament or next to the logo.</p></div></div>'''
    add("Logo", "Colourways", body)

    x = LOGO_H * 0.274
    body = f'''<div class="g g2"><div class="box" style="height:110mm;background:#fff;position:relative">
<svg viewBox="-{x * 1.6:.1f} -{x * 1.6:.1f} {LOGO_W + x * 3.2:.1f} {LOGO_H + x * 3.2:.1f}" style="width:80%">
<rect x="-{x:.1f}" y="-{x:.1f}" width="{LOGO_W + 2 * x:.1f}" height="{LOGO_H + 2 * x:.1f}" fill="none" stroke="{C['golddeep']}" stroke-width=".4" stroke-dasharray="1.5 1.5"/>
{logo_svg("fullcolour")[logo_svg("fullcolour").index(">") + 1:-6]}</svg></div>
<div><table><tr><th>Item</th><th>Rule</th></tr>
<tr><td>Clear space</td><td>1x on every side, where x is the height of the lowercase n (about 11 % of the logo's width).</td></tr>
<tr><td>Minimum size, primary</td><td class="n">35 mm in print · 140 px on screen</td></tr>
<tr><td>Minimum size, small format</td><td class="n">25 mm · 100 px</td></tr>
<tr><td>Minimum size, roundel</td><td class="n">8 mm · 16 px</td></tr>
<tr><td>Placement</td><td>Top left or bottom right in most layouts. Never centred over a photograph's subject.</td></tr></table></div></div>'''
    add("Logo", "Clear space and minimum size", body)

    lg = logo_svg("fullcolour")
    inner = lg[lg.index(">") + 1:-6]
    vb = f"0 0 {LOGO_W} {LOGO_H}"
    donts = [(f'<svg viewBox="{vb}" style="width:70%;transform:scaleX(1.35)">{inner}</svg>', "Don't stretch or squash it."),
             (f'<svg viewBox="{vb}" style="width:70%;filter:hue-rotate(160deg)">{inner}</svg>', "Don't recolour it."),
             (f'<svg viewBox="{vb}" style="width:70%;transform:rotate(-12deg)">{inner}</svg>', "Don't rotate it."),
             (f'<svg viewBox="{vb}" style="width:70%;filter:drop-shadow(1.2mm 1.2mm 1mm rgba(0,0,0,.45))">{inner}</svg>', "Don't add shadows, glows or bevels."),
             (f'<div style="width:70%;position:relative">{logo_svg("fullcolour")}<div style="position:absolute;inset:-6mm;border:.4mm solid {C["forest"]};border-radius:50%"></div></div>', "Don't enclose it in shapes or seals."),
             (f'<div style="width:100%;height:100%;display:grid;place-items:center;background:url({rel(photo("agbokim-waterfalls"), SRC)}) center/cover"><div style="width:62%">{logo_svg("fullcolour")}</div></div>', "Don't place it over busy photography."),
             (f'<svg viewBox="{vb}" style="width:70%;opacity:.35">{inner}</svg>', "Don't fade it or use it as a watermark."),
             (f'<div style="width:70%;font:400 15pt \'Newsreader Display\';color:{C["forest"]};text-align:center">Destination<br><span style="font:600 7pt \'Public Sans\';letter-spacing:.3em">NIGERIA</span></div>', "Don't retype it.")]
    body = '<div class="g g4" style="gap:8mm 6mm">' + "".join(f'<div><div class="box dont" style="height:50mm;overflow:hidden">{d}</div><p class="cap">{t}</p></div>' for d, t in donts) + "</div>"
    add("Logo", "Misuse", body)

    # ---------------------------------------------------------------- 3 colour
    body = '<div class="g g5" style="gap:5mm">' + "".join(swatch(*c) for c in COLORS) + "</div>"
    add("Colour", "Ten colours", body, lead="Forest, Ridge and Sun Gold come from the logo. Paper and the neutrals were developed for the system. Photography brings every other colour.")
    bar = "".join(f'<div style="flex:{w};background:{c}"></div>' for c, w in [(C["ivory"], 55), (C["forest"], 28), (C["ridge"], 6), (C["haze"], 6), (C["stone"], 3), (C["gold"], 2)])
    body = f'''<div style="display:flex;height:30mm;outline:.25mm solid {C['haze']}">{bar}</div><p class="cap">Typical proportion: Paper 55 % · Forest 28 % · Ridge, Haze and Stone for structure · Sun Gold under 3 %.</p>
<div class="g g3" style="margin-top:10mm"><div class="rule"><h3>Sun Gold is the sun</h3><p>Use it for the disc, one figure or one call to action, never more. Never set text in Sun Gold on Paper (1.9:1 fails). Use Gold Text #8A5A0C (5.2:1).</p></div>
<div class="rule"><h3>No effects</h3><p>No gradients, glows, tints or overlays on photographs. If text needs a quiet ground, move it off the image into the Paper band. That is the horizon composition.</p></div>
<div class="rule"><h3>Data</h3><p>Charts use Forest, then Sage, then Gold Text. Rules and table lines are Haze, with a Forest rule under headers. No tinted table fills.</p></div></div>'''
    add("Colour", "Proportion and rules", body)

    # ---------------------------------------------------------------- 4 typography
    body = f'''<div class="g g3">
<div class="rule"><p style="font:400 46pt/1 'Newsreader Display';color:{C['forest']};letter-spacing:-.02em">Aa</p><h3 style="margin-top:3mm">Newsreader Display</h3><p>Titles and single large figures. Regular, Medium and SemiBold, with italics.</p><p style="font:400 14pt 'Newsreader Display';color:{C['forest']};margin-top:3mm">Zuma Rock, Niger State</p></div>
<div class="rule"><p style="font:400 46pt/1 'Newsreader Text';color:{C['forest']}">Aa</p><h3 style="margin-top:3mm">Newsreader Text</h3><p>Long reading: standfirsts, report text, quotations.</p><p style="font:400 11pt/1.45 'Newsreader Text';color:{C['charcoal']};margin-top:3mm">At first light the rock turns from grey to amber. Bring water and good shoes.</p></div>
<div class="rule"><p style="font:400 46pt/1 'Public Sans';color:{C['forest']}">Aa</p><h3 style="margin-top:3mm">Public Sans</h3><p>Information: labels, tables, data, interfaces and signage. Tabular figures and the Naira sign.</p><p class="n" style="font:400 14pt 'Public Sans';color:{C['forest']};margin-top:3mm">₦ 1,250,000 · 0123456789</p></div></div>
<p class="cap" style="margin-top:8mm">All three are SIL Open Font License 1.1. They are free for any use, installed from 03_COLOR_AND_TYPOGRAPHY/fonts_v2, and available in Google Fonts and Google Workspace. Office fallbacks: Georgia and Arial.</p>'''
    add("Typography", "Two families, three roles", body)

    body = f'''<div class="g g2" style="grid-template-columns:1.25fr 1fr"><div style="background:#fff;padding:9mm">
<p style="font:600 6.5pt 'Public Sans';letter-spacing:.08em;text-transform:uppercase;color:{C['golddeep']}">Label</p>
<p style="font:400 30pt/1.02 'Newsreader Display';letter-spacing:-.015em;color:{C['forest']};margin-top:2mm">A title says the conclusion</p>
<p style="font:400 12pt/1.42 'Newsreader Text';color:{C['forest']};margin-top:4mm">A standfirst tells the reader what the page is for, in one or two sentences.</p>
<p style="font:400 8.5pt/1.6 'Public Sans';color:{C['charcoal']};margin-top:3mm">Body text in Public Sans is neutral and legible. Keep paragraphs short. Name the place, the dish, the festival and the person. Use numbers only when they are sourced.</p>
<p style="font:7pt 'Public Sans';color:{C['stone']};margin-top:4mm">Idanre Hills, Ondo State</p></div>
<table><tr><th>Token</th><th>Face</th><th class="n">Size / line</th></tr>
<tr><td>display</td><td>Newsreader Display 400</td><td class="n">96 / 0.98</td></tr><tr><td>h1</td><td>Newsreader Display 400</td><td class="n">56 / 1.04</td></tr>
<tr><td>h2</td><td>Newsreader Display 500</td><td class="n">36 / 1.12</td></tr><tr><td>h3</td><td>Public Sans 600</td><td class="n">20 / 1.30</td></tr>
<tr><td>label</td><td>Public Sans 600, caps +0.08 em</td><td class="n">12 / 1.30</td></tr><tr><td>lead</td><td>Newsreader Text 400</td><td class="n">22 / 1.42</td></tr>
<tr><td>body</td><td>Public Sans 400</td><td class="n">16 / 1.60</td></tr><tr><td>caption</td><td>Public Sans 400</td><td class="n">12 / 1.45</td></tr>
<tr><td>figure</td><td>Newsreader Display 400</td><td class="n">72 / 1.00</td></tr></table></div>'''
    add("Typography", "Hierarchy", body, lead="Size follows hierarchy, not drama. One display line per layout. Sentence case everywhere; capitals only for short labels.")

    body = f'''<div class="g g3"><div class="rule"><h3>Captions name the place</h3><p>Every photograph and plate is captioned with its place and state. The caption is the system's signature detail.</p><p style="font:7.5pt 'Public Sans';color:{C['stone']};margin-top:3mm">Agbokim Waterfalls, Cross River State</p></div>
<div class="rule"><h3>Labels, sparingly</h3><p>Public Sans SemiBold, capitals, +0.08 em, in Gold Text or Stone. Use one per block, as a signpost and never as decoration.</p><p style="font:600 7pt 'Public Sans';letter-spacing:.08em;color:{C['golddeep']};margin-top:3mm">INVESTMENT OPPORTUNITY</p></div>
<div class="rule"><h3>Figures</h3><p>Tables use tabular lining figures, right-aligned. A single key figure may be set large in Newsreader Display, with its unit and source in caption size.</p><p style="font:400 30pt/1 'Newsreader Display';color:{C['forest']};margin-top:2mm">774</p><p class="cap">Local government areas. Source: Constitution of the Federal Republic of Nigeria, 1999.</p></div></div>'''
    add("Typography", "Details", body)

    # ---------------------------------------------------------------- 5 composition
    def diag(frac, label, dark=False, img=False, plate=False):
        bg = C["forest"] if dark else "#fff"
        fill = (f'<div style="position:absolute;left:0;top:0;right:0;height:{frac * 100}%;background:url({rel(photo("zuma-rock"), SRC)}) center/cover"></div>' if img else "")
        line = f'<div style="position:absolute;left:0;right:0;top:{frac * 100}%;border-top:.35mm solid {C["forest"] if not dark else C["ridge"]}"></div>' if not img else ""
        return (f'<div><div style="position:relative;height:42mm;background:{bg};outline:.25mm solid {C["haze"]}">{fill}{line}'
                f'<div style="position:absolute;left:4mm;bottom:3mm;font:400 11pt \'Newsreader Display\';color:{C["ivory"] if dark else C["forest"]}">Title</div></div><p class="cap">{label}</p></div>')
    body = '<div class="g g4">' + diag(.7, "Low horizon, 70 : 30. Campaign, social, film.", img=True) + diag(.5, "Middle, 50 : 50. Openers, invitations, web hero.", img=True) + diag(.3, "High, 30 : 70. Reports, proposals, data.", img=True) + diag(.62, "No image: type with a hairline horizon.") + "</div>"
    body += f'''<div class="g g4" style="margin-top:8mm">{"".join(f'<div>{im(S / k / f"DN_social_{k}_4x5_1080x1350.png")}</div>' for k in ("place", "plate", "invest", "statement"))}</div>'''
    add("Composition", "The horizon composition", body, lead="Every layout is divided by a horizon, the way the logo is. Its height changes with the job, so compositions vary while the system stays recognisable.")

    body = f'''<div class="g g2" style="grid-template-columns:1.3fr 1fr"><div style="background:#fff;padding:10mm">{plate_svg("zuma-rock", "forest", False)}<p style="font:7pt 'Public Sans';color:{C['stone']};margin-top:3mm">Pl. 01&ensp;Zuma Rock, Niger State</p></div>
<div><div class="rule"><h3>The plate composition</h3><p>An engraved plate is mounted on Paper with a wide margin and captioned like a museum print, with its plate number. Use it for covers, certificates, section openers and premium print.</p></div>
<div class="rule" style="margin-top:6mm"><h3>Grid</h3><p>Print uses a 12-column grid with 20 mm outer margins on A4 and 6.5 % of the shortest side on social formats. Corners are square: no rounded cards, no pills, no shadows.</p></div>
<div class="rule" style="margin-top:6mm"><h3>Columns, not cards</h3><p>Group information under a Forest hairline, never in boxes. Three columns only when there are three equal ideas.</p></div></div></div>'''
    add("Composition", "Plates, grid and structure", body)

    # ---------------------------------------------------------------- 6 photography
    SUP = KIT / "06_PHOTOGRAPHY_AND_MEDIA/SUPPLIED_BY_CLIENT"
    body = f'''<div class="g g2"><div>{im(SUP / "zuma-rock.jpg", "height:64mm;object-fit:cover")}<p class="cap">As supplied.</p></div><div>{im(photo("zuma-rock"), "height:64mm;object-fit:cover")}<p class="cap">Graded: a gentle curve, saturation reined in, shadows towards Forest, highlights towards Paper. Nothing added or removed.</p></div></div>
<div class="g g4" style="margin-top:7mm">{"".join(f'<div>{im(photo(s), "height:30mm;object-fit:cover")}<p class="cap">{PHOTOS[s]["caption"]}</p></div>' for s in ("agbokim-waterfalls", "idanre-hills", "obudu-road", "lekki-ikoyi-bridge"))}</div>'''
    add("Photography", "Real places, honestly graded", body, lead="Photography leads wherever a place, person or food is meant. Use only verified, licensed images of the place named, always with a caption.")
    body = f'''<div class="g g3">{"".join(f'<div>{im(SUP / "_rejected" / f, "height:48mm;object-fit:cover;filter:grayscale(1);opacity:.75")}<p class="cap"><b>Rejected.</b> {why}</p></div>' for f, why in [
        ("Crystal-Bay-Nusa-Penida-1.jpg.webp", "Crystal Bay, Nusa Penida: Bali, Indonesia."),
        ("caption.jpg", "Almost certainly Chamarel Falls, Mauritius."),
        ("images (6).jpeg", "A digital composite of places that do not appear together.")])}</div>
<div class="g g3" style="margin-top:8mm"><div class="rule"><h3>Use</h3><p>Natural light, real activity, people with consent, specific places. Caption every image with place and state.</p></div>
<div class="rule"><h3>Avoid</h3><p>HDR, sky replacement, heavy filters, AI-generated scenes presented as real, and images of other countries.</p></div>
<div class="rule"><h3>Record</h3><p>Every image needs its photographer, licence and releases in 06/SOURCE_RECORDS/image-register.csv before publication.</p></div></div>'''
    add("Photography", "What we will not publish", body, lead="Three of the supplied images were rejected because they would misrepresent the destination.")

    # ---------------------------------------------------------------- 7 plates
    body = f'''<div class="g g3"><div>{im(PL / "DN_plate_zuma-rock_forest.png")}<p class="cap">Pl. 01 Zuma Rock, Forest ink</p></div>
<div>{im(PL / "DN_plate_zuma-rock_ivory.png")}<p class="cap">Pl. 01 Paper ink on Forest</p></div><div>{im(PL / "DN_plate_agbokim-waterfalls_forest.png", "height:51.4mm;object-fit:cover;object-position:50% 40%")}<p class="cap">Pl. 02 Agbokim Waterfalls</p></div></div>
<div class="g g3" style="margin-top:7mm"><div class="rule"><h3>How they are made</h3><p>Lines follow the form of the land, swelling in shadow and thinning to a hairline in light, as in banknote and survey-plate engraving. Each plate is traced from a verified photograph of the place it names.</p></div>
<div class="rule"><h3>Rules</h3><p>Use one ink: Forest, Paper or Ridge (tone-on-tone on Forest). The only added colour is the logo's Sun Gold disc, in open sky. Never stretch a plate, and never use it for a place it was not traced from.</p></div>
<div class="rule"><h3>New plates</h3><p>Add a verified high-resolution photograph to the library, then run 16_SOURCE_FILES/build/plates.py. Plates work best on strong silhouettes.</p></div></div>'''
    add("Engraved plates", "The engraved plates", body, lead="The illustration language of the brand. Vector, so it reproduces at any size, from a business card to a roll-up banner.")

    # ---------------------------------------------------------------- 8 backgrounds
    grounds = json.load(open(BG / "DN_backgrounds_index.json"))
    body = '<div class="g g4" style="gap:5mm 6mm">' + "".join(f'<div>{im(BG / g["id"] / ("DN_bg_" + g["id"] + "_16x9_1920x1080.jpg"))}<p class="cap"><b>{g["id"][3:].replace("-", " ").capitalize()}.</b> {g["use"].split(".")[0]}.</p></div>' for g in grounds) + "</div>"
    add("Backgrounds", "Eight grounds", body)

    # ---------------------------------------------------------------- 9 applications
    body = '<div class="g g4" style="gap:5mm">' + "".join(f'<div>{im(S / k / f"DN_social_{k}_4x5_1080x1350.png")}</div>' for k in ("place", "plate", "statement", "invest")) + "</div>"
    body += '<div class="g g4" style="gap:5mm;margin-top:5mm">' + "".join(f'<div>{im(S / k / f"DN_social_{k}_16x9_1200x675.png")}</div>' for k in ("figure", "explore-grid", "contact", "place")) + "</div>"
    add("Applications", "Social", body, lead="Seven compositions with distinct jobs, in 4:5, 1:1, 9:16 and 16:9. Copy lives in content.json; every place is captioned.")
    shots = [pdfpng(D10, k, f"slide{k:02d}", 50) for k in (1, 2, 4, 6, 8, 9, 11, 13)]
    body = '<div class="g g4" style="gap:5mm">' + "".join(f'<div>{im(s)}</div>' for s in shots) + "</div>"
    body += '<p class="cap" style="margin-top:4mm">19 layouts on a real slide master: covers, section opener, executive summary, two columns, research finding, chart, key figures, timeline, investment opportunity, partnership, financial table, recommendations, quotation, photograph, closing and contact, title only and blank.</p>'
    add("Applications", "Presentation", body, lead="Write the conclusion as the title. Layouts are built for the work a tourism body actually presents.")
    docs = [pdfpng(D9 / r, p, nm, 45) for r, p, nm in [("REPORTS/DN_Report_Template_A4.pdf", 1, "d_report"), ("REPORTS/DN_Report_Template_A4.pdf", 3, "d_summary"),
                                                       ("REPORTS/DN_Report_Template_A4.pdf", 4, "d_divider"), ("PROPOSALS/DN_Proposal-Concept-Note_Template_A4.pdf", 1, "d_proposal"),
                                                       ("LETTERHEAD/DN_Letter_Formal-Correspondence_A4.pdf", 1, "d_letter"), ("INVESTMENT_PROFILE/DN_Investment-Opportunity-Profile_A4.pdf", 1, "d_invest")]]
    body = '<div class="g" style="grid-template-columns:repeat(6,1fr);gap:5mm">' + "".join(f'<div>{im(d)}</div>' for d in docs) + "</div>"
    body += f'''<div class="g g3" style="margin-top:7mm"><div class="rule"><h3>Editorial, not decorated</h3><p>Small logo, generous margins, Newsreader titles, Public Sans text. Tables have a Forest rule and Haze hairlines, with no fills.</p></div>
<div class="rule"><h3>Real details only</h3><p>Contact details are the supplied ones. Anything unverified (addresses, registration numbers, figures) stays a bracketed content control.</p></div>
<div class="rule"><h3>Files</h3><p>22 Word templates with PDFs and DOTX, plus calculating spreadsheets, in 09_DOCUMENT_TEMPLATES.</p></div></div>'''
    add("Applications", "Documents", body)
    BC = D9 / "BUSINESS_CARDS/PNG_300dpi"
    body = f'''<div class="g g3"><div>{im(BC / "DN_business-card_front_300dpi.png")}<p class="cap">Front: Zuma Rock tone-on-tone.</p></div><div>{im(BC / "DN_business-card_back_eddie-madaki_300dpi.png")}<p class="cap">Back: name, email, telephone, web.</p></div>
<div>{im(D9 / "EMAIL_SIGNATURE/DN_email-signature_general_preview.png")}<p class="cap">Email signature (general, Eddie Madaki, Lulu).</p></div></div>
<div class="g g2" style="margin-top:8mm"><div class="rule"><h3>Contacts</h3><table><tr><td>Telephone</td><td class="n">{CONTACT['phone']}</td></tr><tr><td>General</td><td>{CONTACT['email']}</td></tr>
{"".join(f"<tr><td>{p['name']}</td><td>{p['email']}</td></tr>" for p in CONTACT['people'])}<tr><td>Web</td><td>{CONTACT['web']} (confirm before print)</td></tr></table></div>
<div class="rule"><h3>Card specification</h3><p>85 × 55 mm, 3 mm bleed, 4 mm safe area. Print PDFs with and without crop marks are in 09/BUSINESS_CARDS. No roles are shown because none were supplied; add them in cards.py once confirmed.</p></div></div>'''
    add("Applications", "Stationery", body)
    W = KIT / "12_WEBSITE_ASSETS"
    body = f'''<div class="g" style="grid-template-columns:2.4fr 1fr 1fr;gap:6mm"><div>{im(W / "homepage/DN_homepage_desktop.png", "height:118mm;object-fit:cover;object-position:50% 0")}</div>
<div>{im(W / "homepage/DN_homepage_mobile.png", "height:118mm;object-fit:cover;object-position:50% 0")}</div><div>{im(W / "homepage/DN_homepage_mobile.png", "height:118mm;object-fit:cover;object-position:50% 45%")}</div></div>
<p class="cap" style="margin-top:3mm">Homepage design, desktop and mobile, built from tokens/dn-tokens.css and components/dn-components.css: square buttons, hairline structure, captioned photography, AA contrast throughout.</p>'''
    add("Applications", "Website", body)
    E = KIT / "13_EVENT_AND_SIGNAGE"
    body = f'''<div class="g" style="grid-template-columns:.55fr .75fr 2fr .9fr;gap:6mm;align-items:start"><div>{im(E / "_previews/DN_roll-up_850x2000mm.png")}<p class="cap">Roll-up</p></div>
<div>{im(E / "_previews/DN_wayfinding_A2.png")}<p class="cap">Wayfinding A2</p></div><div>{im(E / "holding-slide/DN_stage-screen_1920x1080.png")}<p class="cap">Stage screen</p></div>
<div>{im(E / "_previews/DN_name-badge_A6.png")}<p class="cap">Badge A6</p></div></div>'''
    add("Applications", "Events and signage", body, lead="Built at physical size with vector plates, so large formats stay sharp. Event names, dates and partners remain placeholders until confirmed.")
    BD = KIT / "15_MOCKUPS"
    body = f'''<div class="g g2">{im(BD / "DN_board_01_documents-and-stationery.jpg")}{im(BD / "DN_board_06_plates-and-photography.jpg")}</div><p class="cap" style="margin-top:3mm">Presentation boards: flat artwork, labelled as such. The v1 'device' mockups are retired.</p>'''
    add("Applications", "Presentation boards", body)

    # ---------------------------------------------------------------- 10 motion and sound
    frames = []
    mp4 = FILM / "DN_motion_G_brand-film-25s_16x9_1920x1080.mp4"
    for i, t in enumerate([2.6, 4.6, 8.5, 11.0, 13.8, 16.8, 18.5, 24.5]):
        out = A / f"film_{i}.jpg"
        if mp4.exists():
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(t), "-i", str(mp4), "-frames:v", "1", "-vf", "scale=640:-1", str(out)], check=True)
        frames.append((out, t))
    body = '<div class="g g4" style="gap:5mm">' + "".join(f'<div>{im(f)}<p class="cap n">{t:.1f} s</p></div>' for f, t in frames) + "</div>"
    body += f'''<div class="g g3" style="margin-top:6mm"><div class="rule"><h3>The film</h3><p>25 s, four formats. A plate of Zuma Rock is engraved stroke by stroke, the sun sets in place, and the plate becomes the photograph it was traced from.</p></div>
<div class="rule"><h3>Principles</h3><p>Hard cuts on the downbeat, unhurried moves, one thing at a time. No blooms, rings, swooshes, particles or pop-in cards.</p></div>
<div class="rule"><h3>Files</h3><p>07/BRAND_FILM_25s, LOGO_ANIMATIONS (logo reveal and sting, with alpha versions) and LOOPS (a seamless plate loop).</p></div></div>'''
    add("Motion and sound", "Motion", body)
    body = f'''<div class="g g3"><div class="rule"><h4>Sonic logo</h4><p>6.5 s. Shekere, then a talking-drum phrase ("Ex-pe-rience"), then a rising thumb-piano line. The sun lands on a bell at 3.3 s.</p></div>
<div class="rule"><h4>Sting</h4><p>2.5 s. The same motif compressed, for the ends of stories and short videos.</p></div>
<div class="rule"><h4>Film score</h4><p>25 s in 12/8 at 96 bpm. The burin's scrape, then the groove, then the motif. Every cut and word lands on a cue shared with the picture.</p></div></div>
<p class="cap" style="margin-top:8mm">All audio is fully synthesised: original, sample-free and owned outright. 48 kHz / 24-bit WAV and 320 kbps MP3, loudness-normalised to −16 LUFS. Files are in 08_SONIC_IDENTITY.</p>'''
    add("Motion and sound", "Sound", body)

    # ---------------------------------------------------------------- 11 voice
    body = f'''<div class="g g2"><div><table><tr><th>Context</th><th>Example</th></tr>
<tr><td>Campaign</td><td>"Nigeria, one place at a time."</td></tr><tr><td>Destination</td><td>"At first light the rock turns from grey to amber. Bring water and good shoes."</td></tr>
<tr><td>Investment</td><td>"This profile summarises the opportunity, its development stage and the documents available on request."</td></tr>
<tr><td>Media</td><td>"Destination Nigeria today announced…" (verified facts only)</td></tr></table></div>
<div><div class="rule"><h3>Do</h3><p>Use short sentences, specific nouns and active verbs. Name the place and the state. Credit communities and photographers. Use numbers only when they are sourced.</p></div>
<div class="rule" style="margin-top:5mm"><h3>Don't</h3><p>Use clichés ("hidden gem", "land of contrasts"), overclaim, stereotype, or imply endorsements, partners or schedules that have not been confirmed.</p></div>
<div class="rule" style="margin-top:5mm"><h3>Style</h3><p>British English. Write "Destination Nigeria" in full; never "DN" in public copy. Write the proposition in sentence case: Experience. Invest. Explore.</p></div></div></div>'''
    add("Voice", "Clear, warm, assured", body)

    # ---------------------------------------------------------------- 12 files
    rows = [("02", "Logo masters (SVG, PDF, EPS, PNG)"), ("03", "Colour and type specifications, palettes, fonts (fonts_v2)"), ("04", "Engraved plates, proposition lockups, icons, maps"),
            ("05", "Eight backgrounds"), ("06", "Photo library, supplied originals, image register"), ("07", "Brand film, logo animations, loops"), ("08", "Sonic logo, sting, film score, bed"),
            ("09", "Word templates, cards, signatures, spreadsheets"), ("10", "PowerPoint template"), ("11", "Social templates"), ("12", "Web tokens, components, homepage design"),
            ("13", "Events and signage"), ("14", "These guidelines"), ("15", "Presentation boards"), ("16", "Source code: rebuild everything with build_all.sh"), ("18", "Creative audit, QA, change report")]
    body = f'''<div class="g g2"><table><tr><th>Folder</th><th>Contents</th></tr>{"".join(f"<tr><td class='n'>{a}</td><td>{b}</td></tr>" for a, b in rows)}</table>
<div><div class="rule"><h4>Contact</h4><p class="n" style="font-size:10pt;line-height:1.7">{CONTACT['phone']}<br>{CONTACT['email']}<br>{"<br>".join(p['name'] + ' · ' + p['email'] for p in CONTACT['people'])}<br>{CONTACT['web']}</p></div>
<div class="rule" style="margin-top:6mm"><h3>Before publication</h3><p>Confirm the photographers and licences for the supplied images, the Tarkwa Bay location, the website address, and any roles to add to cards and signatures.</p></div></div></div>'''
    add("Files and contacts", "Where everything is", body)
    # back cover
    P.append(f'''<section class="page dark"><div class="plate" style="position:absolute;left:0;right:0;bottom:-6mm;width:297mm">{plate_svg("zuma-rock-vignette", "forest", True, False).replace(C["forest"], C["ridge"])}</div>
<div style="position:absolute;left:50%;top:44mm;width:84mm;transform:translateX(-50%)">{logo_svg("reversed")}</div>
<div style="position:absolute;left:0;right:0;top:92mm;text-align:center;font:400 16pt 'Newsreader Display';color:{C['ivory']}">Experience. Invest. Explore.</div></section>''')

    html = (f"<!doctype html><html lang='en'><head><meta charset='utf-8'><title>Destination Nigeria — Brand guidelines {VERSION}</title>"
            f"<style>{font_css(SRC)}{CSS}</style></head><body>{''.join(P)}</body></html>")
    out = SRC / "guidelines.html"
    out.write_text(html, encoding="utf-8")
    return out, len(P)


def quickref():
    html = f"""<!doctype html><html><head><meta charset='utf-8'><title>Quick reference</title><style>{font_css(SRC)}{CSS}
@page {{ size: 210mm 297mm; margin: 0; }} .q {{ width:210mm;height:297mm;padding:18mm;background:{C['ivory']};position:relative;overflow:hidden }}</style></head><body><section class="q">
<div style="width:48mm">{logo_svg('fullcolour')}</div>
<p style="font:400 26pt/1.04 'Newsreader Display';color:{C['forest']};margin-top:10mm">Quick reference</p>
<p style="font:400 10pt 'Newsreader Text';color:{C['stone']};margin-top:2mm">Brand guidelines {VERSION}, on one page.</p>
<div class="g g2" style="margin-top:9mm;gap:6mm 10mm">
<div class="rule"><h3>Logo</h3><p>Use the supplied master. Clear space 1x (height of the n). Minimum 35 mm or 140 px. Reversed on Forest. The roundel is for avatars only.</p></div>
<div class="rule"><h3>Colour</h3><div style="display:flex;gap:1.5mm;margin:1mm 0 2mm">{"".join(f'<div style="flex:1;height:10mm;background:{h};outline:.2mm solid {C["haze"]}"></div>' for _, _, h, *_ in COLORS)}</div><p>Paper and Forest carry the system. Sun Gold is the sun: under 3 %, never text on Paper.</p></div>
<div class="rule"><h3>Type</h3><p><span style="font:400 13pt 'Newsreader Display';color:{C['forest']}">Newsreader Display</span> for titles. <span style="font-family:'Newsreader Text'">Newsreader Text</span> for reading. Public Sans for information, with ₦ and tabular figures.</p></div>
<div class="rule"><h3>Composition</h3><p>A horizon divides every layout: land above, words below. Captions name the place. Square corners, hairlines, no boxes or shadows.</p></div>
<div class="rule"><h3>Images</h3><p>Real, verified, licensed photographs of the place named, with the brand grade. Engraved plates are traced from them. Never fabricate or misplace a location.</p></div>
<div class="rule"><h3>Never</h3><p>Gradients, glows, ribbons, rings, patterns, seals, pill buttons, fake mockups, retyped logos, stretched images, clichés.</p></div></div>
<div class="plate" style="position:absolute;left:0;right:0;bottom:16mm">{plate_svg('zuma-rock-vignette', 'forest', True)}</div>
<p style="position:absolute;left:18mm;bottom:14mm;font:7pt 'Public Sans';color:{C['stone']}">{CONTACT['phone']} · {CONTACT['email']} · {CONTACT['web']}</p>
</section></body></html>"""
    out = SRC / "quick-reference.html"
    out.write_text(html, encoding="utf-8")
    return out


if __name__ == "__main__":
    g, n = build()
    q = quickref()
    jobs = [dict(src=str(g), out=str(G / f"DN_Brand-Guidelines_v{VERSION}.pdf"), w=1123, h=794, format="pdf", pdfW="297mm", pdfH="210mm", cssPage=True, wait=800),
            dict(src=str(q), out=str(G / f"DN_Brand-Quick-Reference_v{VERSION}.pdf"), w=794, h=1123, format="pdf", pdfW="210mm", pdfH="297mm", wait=500)]
    json.dump(jobs, open(KIT / "16_SOURCE_FILES/build/_jobs/_jobs_guidelines2.json", "w"), indent=1)
    print(n, "pages")
