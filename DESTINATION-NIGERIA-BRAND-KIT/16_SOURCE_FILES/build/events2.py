"""Events and signage v2 → 13_EVENT_AND_SIGNAGE. HTML artboards at physical size (CSS mm), exported as
vector print PDFs (true size; the engraved plates and logo stay vector) and PNG previews.

Event names, dates, venues, speakers and sponsors are placeholders in [brackets]. Nothing here implies
that any event has been scheduled.
"""
import json
from html import escape
from brand import C, KIT, CONTACT, PHOTOS
from v2 import page, job, logo_svg, plate_svg, img

E = KIT / "13_EVENT_AND_SIGNAGE"
PX = 96 / 25.4
jobs = []


def mm(v):
    return f"{v * PX:.2f}px"


def emit(sub, name, w_mm, h_mm, body, title, preview_w=1400, bg=C["ivory"], screen=None):
    od = E / sub / "source"
    if screen:   # pixel artboard for screens
        w, h = screen
        src = page(od / f"{name}.html", w, h, body, title=title, bg=bg)
        jobs.append(job(src, E / sub / f"{name}.png", w, h))
        jobs.append(job(src, E / sub / f"{name}.jpg", w, h, quality=92))
        return
    w, h = w_mm * PX, h_mm * PX
    src = page(od / f"{name}.html", w, h, body, title=title, bg=bg)
    jobs.append(job(src, E / sub / f"{name}_print.pdf", w, h, format="pdf", pdfW=f"{w_mm}mm", pdfH=f"{h_mm}mm"))
    sc = min(preview_w / w, 3)
    jobs.append(job(src, E / "_previews" / f"{name}.png", w, h, scale=round(sc, 3)))


def box(x, y, w=None, h=None, extra=""):
    s = f"position:absolute;left:{mm(x)};top:{mm(y)};"
    if w is not None:
        s += f"width:{mm(w)};"
    if h is not None:
        s += f"height:{mm(h)};"
    return s + extra


def t(cls, x, y, w, size_pt, text, color=C["forest"], extra=""):
    return f'<div class="{cls}" style="{box(x, y, w)}font-size:{size_pt}pt;color:{color};{extra}">{text}</div>'


def plate_at(slug, x, y, w, ink="forest", keep_sun=True, recolor=None):
    s = plate_svg(slug, ink, True, keep_sun)
    if recolor:
        s = s.replace(C[ink], recolor)
    return f'<div class="plate" style="{box(x, y, w)}">{s}</div>'


# ---------------------------------------------------------------------------------------------- print
def programme():
    """A5 programme cover and running order, 3 mm bleed (154 × 216 mm)."""
    W, H, B = 154, 216, 3
    body = f'<div style="position:absolute;inset:0;background:var(--ivory)"></div>'
    body += plate_at("zuma-rock", B + 12, B + 14, W - 2 * B - 24)
    body += t("cap", B + 12, B + 14 + (W - 2 * B - 24) * 0.625 + 3, 100, 6.5, "Pl. 01&ensp;Zuma Rock, Niger State", C["stone"])
    body += t("label", B + 12, 128, 100, 7, "Programme", C["golddeep"])
    body += t("disp", B + 11.5, 136, W - 2 * B - 24, 30, "[Event name]")
    body += t("sans", B + 12, 168, W - 2 * B - 24, 9, "[Dates, confirmed only]<br>[Venue, City]", C["charcoal"], "line-height:1.45")
    body += f'<div class="logo" style="{box(W - B - 12 - 34, H - B - 12 - 13.4, 34)}">{logo_svg("fullcolour")}</div>'
    emit("programme", "DN_event-programme_A5_cover", W, H, body, "Programme cover, A5 + 3 mm bleed")
    rows = "".join(f'<div style="display:grid;grid-template-columns:{mm(22)} 1fr;border-top:0.3mm solid {C["haze"]};padding:{mm(2.6)} 0">'
                   f'<span class="sans num" style="font-size:9pt;font-weight:600;color:{C["golddeep"]}">[09:00]</span>'
                   f'<span><span class="sans" style="font-size:9.5pt;font-weight:600;color:{C["forest"]}">[Session title]</span><br>'
                   f'<span class="sans" style="font-size:8pt;color:{C["stone"]}">[Speaker, organisation: confirmed only]</span></span></div>' for _ in range(8))
    body = f'<div style="position:absolute;inset:0;background:var(--ivory)"></div>'
    body += f'<div class="logo" style="{box(B + 12, B + 12, 26)}">{logo_svg("fullcolour")}</div>'
    body += t("label", B + 12, 38, 100, 7, "Running order", C["golddeep"])
    body += t("disp", B + 11.5, 45, 120, 20, "[Day 1, DD Month YYYY]")
    body += f'<div style="{box(B + 12, 62, W - 2 * B - 24)}">{rows}</div>'
    body += t("cap", B + 12, H - B - 16, W - 2 * B - 24, 7, f'{CONTACT["email"]}&emsp;{CONTACT["phone"]}&emsp;{CONTACT["web"]}', C["stone"])
    emit("programme", "DN_event-programme_A5_running-order", W, H, body, "Programme running order, A5 + 3 mm bleed")


def invitation():
    """5 × 7 in invitation (127 × 178 mm) + 3 mm bleed."""
    W, H, B = 133, 184, 3
    body = f'<div style="position:absolute;inset:0;background:var(--ivory)"></div>'
    body += f'<div style="{box(B + 7, B + 7, W - 2 * B - 14, H - 2 * B - 14)}border:0.45mm solid {C["forest"]}"></div>'
    body += f'<div style="{box(B + 8.6, B + 8.6, W - 2 * B - 17.2, H - 2 * B - 17.2)}border:0.15mm solid {C["forest"]}"></div>'
    body += f'<div class="logo" style="{box((W - 44) / 2, 24, 44)}">{logo_svg("fullcolour")}</div>'
    c = "text-align:center"
    body += t("text", 18, 58, W - 36, 10, "Destination Nigeria requests the pleasure of your company at", C["charcoal"], c + ";line-height:1.45")
    body += t("disp", 16, 78, W - 32, 26, "[Event name]", C["forest"], c + ";line-height:1.04")
    body += f'<div class="hair" style="{box(W / 2 - 12, 112, 24)}color:{C["forest"]}"></div>'
    body += t("sans", 18, 118, W - 36, 9.5, "[Day, DD Month YYYY]<br>[HH:MM]<br>[Venue, City]", C["charcoal"], c + ";line-height:1.55")
    body += t("label", 18, 146, W - 36, 7, "RSVP", C["golddeep"], c)
    body += t("sans", 18, 151, W - 36, 8.5, f'{CONTACT["email"]}<br>{CONTACT["phone"]}', C["charcoal"], c + ";line-height:1.5")
    body += f'<div style="{box(W / 2 - 2.2, H - B - 18, 4.4, 4.4)}border-radius:50%;background:var(--gold)"></div>'
    emit("invitation", "DN_invitation_5x7in", W, H, body, "Invitation, 5 × 7 in + 3 mm bleed")


def badge():
    """A6 name badge (105 × 148 mm), role band at the foot."""
    W, H = 105, 148
    body = f'<div style="position:absolute;inset:0;background:var(--white)"></div>'
    body += f'<div style="{box(W / 2 - 7, 7, 14, 4)}border-radius:{mm(2)};background:{C["haze"]}"></div>'
    body += f'<div class="logo" style="{box(10, 18, 36)}">{logo_svg("fullcolour")}</div>'
    body += t("disp", 9.5, 52, W - 20, 34, "[First name]", C["forest"], "line-height:1")
    body += t("sans", 10, 72, W - 20, 13, "[Surname]", C["forest"], "font-weight:500")
    body += f'<div class="hair" style="{box(10, 86, W - 20)}color:{C["haze"]}"></div>'
    body += t("sans", 10, 90, W - 20, 10, "[Organisation]", C["charcoal"])
    body += f'<div style="{box(0, H - 26, W, 26)}background:var(--forest)"></div>'
    body += t("label", 10, H - 16, W - 20, 12, "[Role]", C["ivory"], "letter-spacing:0.12em")
    body += t("cap", 10, H - 9, W - 20, 6.5, "[Event name]", C["sage"])
    emit("badges", "DN_name-badge_A6", W, H, body, "Name badge, A6", bg=C["white"])


def signage():
    """A2 wayfinding sign (420 × 594 mm)."""
    W, H = 420, 594
    body = f'<div style="position:absolute;inset:0;background:var(--forest)"></div>'
    body += f'<div class="sans" style="{box(30, 20, 360)}font-size:640pt;line-height:1;color:var(--ivory);font-weight:300">→</div>'
    body += t("disp", 34, 250, W - 68, 120, "[Main hall]", C["ivory"], "line-height:1")
    body += t("sans", 36, 345, W - 72, 34, "[Registration · Exhibition]", C["sage"], "line-height:1.3")
    body += plate_at("zuma-rock-quiet", -20, H - 250, W + 40, keep_sun=False, recolor=C["ridge"])
    body += f'<div class="logo" style="{box(34, H - 34 - 34, 88)}">{logo_svg("reversed")}</div>'
    emit("signage", "DN_wayfinding_A2", W, H, body, "Wayfinding sign, A2", preview_w=900, bg=C["forest"])


def rollup():
    """Roll-up banner 850 × 2000 mm visible area (+ 100 mm base tuck). Vector plate, so it prints sharp at any size."""
    W, H = 850, 2100
    body = f'<div style="position:absolute;inset:0;background:var(--ivory)"></div>'
    body += f'<div class="logo" style="{box(80, 100, 420)}">{logo_svg("fullcolour")}</div>'
    body += t("disp", 74, 360, W - 140, 400, "Experience.<br>Invest.<br>Explore.", C["forest"], "line-height:0.98")
    body += plate_at("zuma-rock", 0, 1110, W)
    body += t("cap", 80, 1110 + W * 0.625 + 14, 600, 36, "Pl. 01&ensp;Zuma Rock, Niger State", C["stone"])
    body += f'<div class="hair" style="{box(80, 1700, W - 160)}color:{C["forest"]};border-top-width:{mm(1.2)}"></div>'
    body += t("sans", 80, 1730, W - 160, 64, f'{CONTACT["web"]}', C["forest"], "font-weight:600")
    body += t("sans", 80, 1830, W - 160, 44, f'{CONTACT["email"]}<br>{CONTACT["phone"]}', C["charcoal"], "line-height:1.45")
    body += f'<div style="{box(0, 2000, W, 100)}background:var(--haze)"></div>'
    body += t("cap", 80, 2035, W - 160, 30, "Base tuck: 100 mm, not visible", C["stone"])
    emit("backdrop", "DN_roll-up_850x2000mm", W, H, body, "Roll-up banner 850 × 2000 mm", preview_w=600)


def mediawall():
    """Step-and-repeat media wall, 3000 × 2400 mm: reversed logo on Forest, staggered rows."""
    W, H = 3000, 2400
    body = f'<div style="position:absolute;inset:0;background:var(--forest)"></div>'
    lw, gx, gy = 420, 750, 480
    for r in range(6):
        for k in range(5):
            x = 120 + k * gx + (gx / 2 if r % 2 else 0)
            y = 150 + r * gy
            if x + lw < W - 60:
                body += f'<div class="logo" style="{box(x, y, lw)}">{logo_svg("reversed")}</div>'
    emit("backdrop", "DN_media-wall_3000x2400mm", W, H, body, "Media wall, 3000 × 2400 mm", preview_w=1200, bg=C["forest"])


# ---------------------------------------------------------------------------------------------- screens
def stage_screen():
    w, h = 1920, 1080
    body = '<div style="position:absolute;inset:0;background:var(--forest)"></div>'
    pw = 760
    body += f'<div class="plate" style="position:absolute;right:0;top:0;width:{pw}px">{plate_svg("agbokim-waterfalls", "ivory")}</div>'
    body += f'<div class="logo" style="position:absolute;left:120px;top:110px;width:300px">{logo_svg("reversed")}</div>'
    body += '<div class="label" style="position:absolute;left:120px;top:470px;font-size:24px;color:var(--sage)">[Event type]</div>'
    body += '<div class="disp" style="position:absolute;left:116px;top:520px;width:960px;font-size:118px;line-height:1.0;color:var(--ivory)">[Event name]</div>'
    body += '<div class="sans" style="position:absolute;left:120px;bottom:120px;font-size:30px;color:var(--sage)">[Venue, City]&emsp;[DD Month YYYY]</div>'
    body += f'<div class="cap" style="position:absolute;right:40px;bottom:40px;font-size:18px;color:var(--sage)">Pl. 02&ensp;Agbokim Waterfalls, Cross River State</div>'
    emit("holding-slide", "DN_stage-screen_1920x1080", 0, 0, body, "Stage holding screen", screen=(w, h), bg=C["forest"])


def speaker():
    w, h = 1080, 1350
    m = 70
    body = '<div style="position:absolute;inset:0;background:var(--ivory)"></div>'
    body += (f'<div style="position:absolute;left:{m}px;top:{m}px;width:{w - 2 * m}px;height:760px;background:var(--haze);display:flex;align-items:center;justify-content:center">'
             f'<span class="sans" style="font-size:22px;color:var(--stone)">Speaker photograph (supplied, with consent)</span></div>')
    body += f'<div class="label" style="position:absolute;left:{m}px;top:{m + 800}px;font-size:22px;color:var(--golddeep)">Speaker</div>'
    body += f'<div class="disp" style="position:absolute;left:{m - 4}px;top:{m + 845}px;width:{w - 2 * m}px;font-size:96px">[Full name]</div>'
    body += f'<div class="sans" style="position:absolute;left:{m}px;top:{m + 960}px;width:{w - 2 * m}px;font-size:30px;color:var(--charcoal)">[Role, organisation]</div>'
    body += f'<div class="hair" style="left:{m}px;right:{m}px;bottom:{m + 80}px;color:var(--haze)"></div>'
    body += f'<div class="sans" style="position:absolute;left:{m}px;bottom:{m + 4}px;font-size:24px;color:var(--stone)">[Event name]&emsp;[DD Month YYYY]</div>'
    body += f'<div class="logo" style="position:absolute;right:{m}px;bottom:{m}px;width:200px">{logo_svg("fullcolour")}</div>'
    emit("speaker", "DN_speaker-card_1080x1350", 0, 0, body, "Speaker announcement", screen=(w, h))


def sponsors():
    w, h = 1920, 1080
    body = '<div style="position:absolute;inset:0;background:var(--ivory)"></div>'
    body += '<div class="label" style="position:absolute;left:120px;top:110px;font-size:24px;color:var(--golddeep)">With thanks to</div>'
    body += '<div class="disp" style="position:absolute;left:116px;top:150px;font-size:80px">[Event name] partners</div>'
    for i in range(8):
        x, y = 120 + (i % 4) * 430, 400 + (i // 4) * 260
        body += (f'<div style="position:absolute;left:{x}px;top:{y}px;width:390px;height:200px;border-top:1.5px solid var(--forest);display:flex;align-items:center;justify-content:center">'
                 f'<span class="sans" style="font-size:20px;color:var(--stone)">[Partner logo, approved]</span></div>')
    body += f'<div class="logo" style="position:absolute;right:120px;bottom:90px;width:260px">{logo_svg("fullcolour")}</div>'
    body += '<div class="cap" style="position:absolute;left:120px;bottom:100px;font-size:20px;color:var(--stone)">Show only partners with a signed agreement, in the order agreed.</div>'
    emit("sponsors", "DN_sponsor-screen_1920x1080", 0, 0, body, "Partner screen", screen=(w, h))


if __name__ == "__main__":
    for f in (programme, invitation, badge, signage, rollup, mediawall, stage_screen, speaker, sponsors):
        f()
    json.dump(jobs, open(KIT / "16_SOURCE_FILES/build/_jobs/_jobs_events2.json", "w"), indent=1)
    print(len(jobs), "jobs")
