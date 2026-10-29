"""Event identity & signage → 13_EVENT_AND_SIGNAGE.

All artwork is built at physical size (SVG user units = mm for print items, px for screens) with live text.
Event names, dates, venues, speakers and sponsors are placeholders — nothing here implies that any event
(including National Tourism Week) has been scheduled.
"""
import json
from brand import *
from gfx import text_path
from graphics import horizon_set, ribbon, campaign_line
from backgrounds import landscape_layers
from social import T, cta, img
from icons import icon_body

E = "13_EVENT_AND_SIGNAGE"
jobs = []


def emit(name, w, h, body, title, unit="mm", defs="", png_w=1600, pdf=True):
    rel = f"{E}/{name}.svg"
    s = svg_doc(w, h, body, title, "Placeholders in [brackets]: confirm every detail before production.", extra_defs=defs, px=(w, h))
    if unit == "mm":
        s = s.replace(f'width="{w:g}" height="{h:g}"', f'width="{w:g}mm" height="{h:g}mm"', 1)
    write(rel, s)
    ph = round(png_w * h / w)
    jobs.append(dict(src=str(KIT / rel), out=str(KIT / f"{E}/_previews/{name.split('/')[-1]}.png"), w=png_w if unit == "mm" else w,
                     h=ph if unit == "mm" else h, direct=unit == "px", scale=1 if unit == "mm" else png_w / w))
    if pdf and unit == "mm":
        vw = w * 96 / 25.4
        sc = min(1, 4000 / vw)  # keep huge formats within the browser canvas; PDF stays vector at true size
        jobs.append(dict(src=str(KIT / rel), out=str(KIT / f"{E}/{name}_print.pdf"), w=vw * sc, h=h * 96 / 25.4 * sc, format="pdf",
                         pdfW=f"{w}mm", pdfH=f"{h}mm"))


def programme():
    """A4 portrait programme, 2 pages (cover + running order), 3 mm bleed."""
    W, H, B = 216, 303, 3
    body = (f'<rect width="{W}" height="{H}" fill="{C["forest"]}"/>'
            + "".join(f'<circle cx="{W / 2}" cy="{H * .36}" r="{r}" fill="none" stroke="{C["gold"]}" stroke-opacity="{o}" stroke-width=".4"/>' for r, o in [(38, .6), (56, .35), (76, .2), (98, .1)])
            + roundel_inline(W / 2 - 26, H * .36 - 26, 52, "ivory", uid="pg")
            + f'<g transform="translate(0,{H - 34}) scale({W / 1200})">{horizon_set(C["gold"], C["ivory"])}</g>'
            + logo_inline("reversed", W / 2 - 30, 18, 60))
    for s_, _ in [T(W / 2, H * .62, "PROGRAMME", 4, C["gold"], ("sans", 600), track=.3, anchor="middle"),
                  T(W / 2, H * .62 + 16, "[Event name]", 15, C["ivory"], ("serif", 500), 170, 1.05, anchor="middle"),
                  T(W / 2, H * .62 + 32, "[Dates — confirmed only] · [Venue, City]", 4.6, C["sage"], ("sans", 400), anchor="middle")]:
        body += s_
    emit("programme/DN_event-programme_A4_cover", W, H, body, "Event programme — cover (A4 + 3 mm bleed)")
    body = f'<rect width="{W}" height="{H}" fill="{C["ivory"]}"/>' + logo_inline("fullcolour", 21, 20, 42)
    s_, _ = T(21, 52, "RUNNING ORDER", 3.4, C["golddeep"], ("sans", 600), track=.25)
    body += s_
    s_, _ = T(21, 66, "[Day 1 — DD Month YYYY]", 10, C["forest"], ("serif", 500))
    body += s_
    y = 82
    for i in range(9):
        body += f'<path d="M21,{y + 4} H195" stroke="{C["sage"]}" stroke-width=".3"/>'
        for x, txt, st, sz, col in [(21, "[09:00]", ("sans", 600), 3.6, C["golddeep"]), (45, "[Session title]", ("sans", 600), 3.8, C["forest"]),
                                    (45, "[Speaker name, organisation — confirmed only]", ("sans", 400), 3.1, C["stone"])]:
            s_, _ = T(x, y + (5.5 if "Speaker" in txt else 0), txt, sz, col, st)
            body += s_
        y += 19
    body += f'<g transform="translate(0,{H - 26}) scale({W / 1200})">{horizon_set(C["forest"], C["ridge"])}</g>'
    emit("programme/DN_event-programme_A4_running-order", W, H, body, "Event programme — running order")


def speaker():
    w, h = 1080, 1350
    body = f'<rect width="{w}" height="{h}" fill="{C["ivory"]}"/>'
    defs = f'<clipPath id="sp"><path d="M90,980 V420 C200,300 360,260 540,260 C720,260 880,300 990,420 V980 Z"/></clipPath>'
    body += f'<rect x="90" y="250" width="900" height="730" fill="{C["haze"]}" clip-path="url(#sp)"/>' + img(w, h, "day", 90, 250, 900, 730, "sp")
    body += f'<circle cx="930" cy="330" r="34" fill="{C["gold"]}"/>' + logo_inline("fullcolour", 90, 90, 260)
    for s_ in [T(90, 1070, "SPEAKER", 26, C["golddeep"], ("sans", 600), track=.22)[0], T(90, 1150, "[Speaker full name]", 72, C["forest"], ("serif", 500))[0],
               T(90, 1210, "[Title, organisation]", 34, C["stone"], ("sans", 400))[0], T(90, 1270, "[Session · Date · Time]", 30, C["forest"], ("sans", 600))[0]]:
        body += s_
    emit("speaker/DN_speaker-profile_1080x1350", w, h, body, "Speaker profile card (social / screen)", unit="px", defs=defs, png_w=1080)


def backdrop():
    # LED / projection stage screen 16:9 (px)
    w, h = 3840, 2160
    body = (f'<rect width="{w}" height="{h}" fill="{C["forest"]}"/>'
            + "".join(f'<circle cx="{w / 2}" cy="{h * .42}" r="{h * r}" fill="none" stroke="{C["gold"]}" stroke-opacity="{o}" stroke-width="4"/>' for r, o in [(.2, .5), (.3, .3), (.42, .18), (.56, .1)])
            + f'<g transform="translate(0,{h * .8}) scale({w / 1200 * 1})">{horizon_set(C["gold"], C["ivory"])}</g>'
            + logo_inline("reversed", w / 2 - 900, h * .42 - 360, 1800))
    cl, cw = campaign_line(C["ivory"], size=56, x=0, y=0)
    body += f'<g transform="translate({w / 2 - cw / 2},{h * .72})">{cl}</g>'
    emit("backdrop/DN_stage-screen_16x9_3840x2160", w, h, body, "Stage LED screen backdrop 16:9", unit="px", png_w=1920)
    # step-and-repeat / media wall (mm) — logo + roundel repeated on a staggered grid
    W, H = 3000, 2400
    cells = ""
    for r_, y in enumerate(range(150, H, 420)):
        for x in range(-100 + (r_ % 2) * 340, W, 680):
            cells += logo_inline("fullcolour", x, y, 460) if (r_ + x // 680) % 2 == 0 else roundel_inline(x + 150, y - 30, 220, "forest", uid=f"sr{r_}_{x}")
    emit("backdrop/DN_media-wall_step-and-repeat_3000x2400mm", W, H, f'<rect width="{W}" height="{H}" fill="#FFFFFF"/>' + cells,
         "Media wall / step-and-repeat 3000 × 2400 mm (add 50 mm bleed at production)", png_w=1500)


def invitation():
    w, h = 1080, 1350
    body = (f'<rect width="{w}" height="{h}" fill="{C["forest"]}"/>' + f'<circle cx="{w * .78}" cy="{h * .24}" r="70" fill="{C["gold"]}"/>'
            + landscape_layers(w, h, h * .36, ["#3E5B49", C["ridge"], "#1A4135", "#143A2E"], 4, .3) + logo_inline("reversed", 80, 80, 300))
    y = h * .62
    body += T(80, y, "YOU ARE INVITED", 26, C["gold"], ("sans", 600), track=.22)[0]
    s_, yb = T(80, y + 90, "[Event name]", 74, C["ivory"], ("serif", 500), 920, 1.05)
    for i, line in enumerate(["[Day, DD Month YYYY · HH:MM]", "[Venue, City]", "[Dress code]"]):
        body += T(80, yb + 90 + i * 50, line, 32, C["sage"], ("sans", 400))[0]
    body += cta(80, h - 150, "RSVP by [date] · [link]", 28)
    emit("invitation/DN_digital-invitation_1080x1350", w, h, body, "Digital invitation", unit="px", png_w=1080)


def badge():
    W, H = 111, 154  # A6 + 3 mm bleed
    body = (f'<rect width="{W}" height="{H}" fill="#FFFFFF"/><rect width="{W}" height="44" fill="{C["forest"]}"/>'
            + f'<rect x="{W / 2 - 7}" y="9" width="14" height="4" rx="2" fill="#FFFFFF" opacity=".9"/>'  # punch slot guide
            + logo_inline("reversed", W / 2 - 22, 18, 44))
    for s_ in [T(W / 2, 74, "[First name]", 13, C["forest"], ("serif", 500), anchor="middle")[0],
               T(W / 2, 87, "[Last name]", 8, C["forest"], ("sans", 600), anchor="middle")[0],
               T(W / 2, 98, "[Organisation]", 5, C["stone"], ("sans", 400), anchor="middle")[0]]:
        body += s_
    body += f'<rect x="0" y="{H - 24}" width="{W}" height="24" fill="{C["gold"]}"/>'
    body += T(W / 2, H - 9.5, "[ROLE]", 6, C["forest"], ("sans", 600), track=.18, anchor="middle")[0]
    body += T(W / 2, H - 30, "[Event name]", 4.2, C["stone"], ("sans", 400), anchor="middle")[0]
    emit("badges/DN_name-badge_A6", W, H, body, "Name badge A6 (105 × 148 mm + 3 mm bleed). Colour band by role.", png_w=700)


def signage():
    W, H = 420, 594  # A2
    arrows = {"left": "M70,0 L0,60 L70,120 M0,60 H180", "right": "M110,0 L180,60 L110,120 M180,60 H0", "up": "M0,70 L60,0 L120,70 M60,0 V180"}
    for d, path in arrows.items():
        body = f'<rect width="{W}" height="{H}" fill="{C["forest"]}"/>'
        aw = 180 if d != "up" else 120
        body += f'<g transform="translate({(W - aw) / 2},70)"><path d="{path}" fill="none" stroke="{C["gold"]}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/></g>'
        body += T(40, 330, "[Destination / Room]", 44, C["ivory"], ("serif", 500), 340, 1.05)[0]
        body += T(40, 410, "[Secondary line · Floor / level]", 18, C["sage"], ("sans", 400))[0]
        body += f'<g transform="translate(0,{H - 80}) scale({W / 1200})">{horizon_set(C["ridge"], "#22463A")}</g>' + logo_inline("reversed", 40, H - 70, 110)
        emit(f"signage/DN_directional-sign_A2_{d}", W, H, body, f"Directional sign A2 ({d}). Minimum letter height for 10 m viewing ≈ 40 mm.", png_w=600)


def sponsors():
    w, h = 1920, 1080
    body = f'<rect width="{w}" height="{h}" fill="{C["ivory"]}"/>' + logo_inline("fullcolour", 120, 90, 300)
    body += T(120, 330, "WITH THANKS TO", 24, C["golddeep"], ("sans", 600), track=.22)[0]
    body += T(120, 410, "[Event name] partners", 64, C["forest"], ("serif", 500))[0]
    for i in range(8):
        x, y = 120 + (i % 4) * 430, 500 + (i // 4) * 250
        body += f'<rect x="{x}" y="{y}" width="390" height="210" rx="16" fill="#FFFFFF" stroke="{C["sage"]}" stroke-width="2" stroke-dasharray="8 8"/>'
        body += T(x + 195, y + 112, "Approved partner logo", 20, C["stone"], ("sans", 400), anchor="middle")[0]
    body += T(120, h - 40, "Display only partners with a signed agreement and approved logo files.", 18, C["stone"], ("sans", 400))[0]
    emit("sponsors/DN_sponsor-acknowledgement_1920x1080", w, h, body, "Sponsor acknowledgement screen", unit="px", png_w=1920)


def rollup():
    W, H = 850, 2000
    body = (f'<rect width="{W}" height="{H}" fill="{C["forest"]}"/>' + f'<circle cx="{W * .72}" cy="{H * .48}" r="75" fill="{C["gold"]}"/>'
            + landscape_layers(W, H, H * .55, ["#3E5B49", C["ridge"], "#1A4135", "#143A2E"], 6, .3)
            + logo_inline("reversed", 80, 120, 690))
    cl, cw = campaign_line(C["ivory"], size=30, x=0, y=0)
    body += f'<g transform="translate({W / 2 - cw / 2},470)">{cl}</g>'
    body += T(80, H * .74, "[Headline for the stand]", 64, C["ivory"], ("serif", 500), 690, 1.05)[0]
    body += T(80, H * .74 + 170, "[Supporting line · website]", 30, C["sage"], ("sans", 400), 690)[0]
    body += f'<rect x="0" y="{H - 150}" width="{W}" height="150" fill="{C["charcoal"]}" opacity=".35"/>'
    body += T(W / 2, H - 70, "Bottom 150 mm sits inside the cassette — keep clear", 16, C["sage"], ("sans", 400), anchor="middle")[0]
    emit("exhibition/DN_roll-up-banner_850x2000mm", W, H, body, "Exhibition roll-up banner 850 × 2000 mm (add 3 mm bleed; bottom 150 mm hidden)", png_w=500)
    # exhibition panel 2000 x 1000 mm
    W, H = 2000, 1000
    body = f'<rect width="{W}" height="{H}" fill="{C["ivory"]}"/>' + f'<rect width="{W * .42}" height="{H}" fill="{C["forest"]}"/>'
    body += logo_inline("reversed", 90, 100, 640) + f'<circle cx="{W * .42}" cy="{H * .78}" r="70" fill="{C["gold"]}"/>'
    body += T(W * .48, 200, "EXPLORE", 22, C["golddeep"], ("sans", 600), track=.22)[0]
    body += T(W * .48, 300, "[Panel headline]", 72, C["forest"], ("serif", 500), 900, 1.05)[0]
    body += T(W * .48, 420, "[Body copy — 40 to 60 words, readable from 2 m at 24 pt minimum.]", 30, C["charcoal"], ("sans", 400), 900, 1.35)[0]
    body += f'<rect x="{W * .48}" y="580" width="900" height="330" rx="18" fill="{C["haze"]}"/>' + T(W * .48 + 450, 760, "Image / map area", 26, C["stone"], ("sans", 400), anchor="middle")[0]
    emit("exhibition/DN_exhibition-panel_2000x1000mm", W, H, body, "Exhibition panel 2000 × 1000 mm", png_w=1600)


if __name__ == "__main__":
    programme(); speaker(); backdrop(); invitation(); badge(); signage(); sponsors(); rollup()
    import shutil
    (KIT / E / "holding-slide").mkdir(exist_ok=True)
    write(f"{E}/holding-slide/README.md", "Event holding slide: use layout **20 Event holding slide** in `10_PRESENTATION_TEMPLATES/DN_Presentation-Template_16x9.pptx`. "
          "Background art: `05_BACKGROUNDS_AND_TEXTURES/12_event-stage/`. Looping version: `07_MOTION_IDENTITY/LOOPS/`.\n")
    json.dump(jobs, open(KIT / "16_SOURCE_FILES/build/_jobs/_jobs_events.json", "w"), indent=1)
    print(len(jobs), "jobs")
