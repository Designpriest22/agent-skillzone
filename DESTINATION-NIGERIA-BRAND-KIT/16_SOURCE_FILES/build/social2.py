"""Social v2 → 11_SOCIAL_MEDIA_TEMPLATES. Seven compositions, each with a purpose, across the main formats.

Copy lives in content.json (edit, rerun, render). Every place named is a real, captioned photograph
or plate from the library; every figure used is verifiable and sourced on the artwork.
"""
import json
import sys
from html import escape
from brand import C, KIT, CONTACT, PHOTOS
from v2 import page, job, img, logo_svg, plate_svg, rel

S = KIT / "11_SOCIAL_MEDIA_TEMPLATES"
FORMATS = {"4x5_1080x1350": (1080, 1350), "1x1_1080x1080": (1080, 1080), "9x16_1080x1920": (1080, 1920),
           "16x9_1200x675": (1200, 675)}

DEFAULT = {
    "place": {"verb": "Explore", "title": "Zuma Rock", "where": "Niger State", "photo": "zuma-rock",
              "line": "A granite dome on the road from Abuja to Kaduna."},
    "plate": {"plate": "agbokim-waterfalls", "no": "Pl. 02", "caption": "Agbokim Waterfalls, Cross River State",
              "title": "Experience Nigeria, one place at a time."},
    "statement": {"title": "Thirty-six states and the Federal Capital Territory. One destination.", "label": "Destination Nigeria"},
    "invest": {"verb": "Invest", "title": "Invest in the places people travel for.", "photo": "idanre-hills",
               "body": "Destination Nigeria brings investors, operators and communities together around tourism development across the country.",
               "cta": CONTACT["email"]},
    "figure": {"figure": "774", "unit": "local government areas", "line": "Every one of them has a place worth the journey.",
               "source": "Source: Constitution of the Federal Republic of Nigeria, 1999, First Schedule."},
    "explore-grid": {"verb": "Explore", "title": "Four corners, one country.",
                     "photos": ["lekki-ikoyi-bridge", "bowers-tower", "obudu-road", "idanre-hills"]},
    "contact": {"title": "Talk to us.", "body": "Partnerships, investment enquiries, media and visits."},
}


def u(w, h):
    return min(w, h) / 100


def logo_block(cw, x, y, width, anchor="left"):
    style = f"left:{x}px" if anchor == "left" else f"right:{x}px"
    return f'<div class="logo" style="position:absolute;{style};top:{y}px;width:{width}px">{logo_svg(cw)}</div>'


def c_place(w, h, c, od):
    U, land = u(w, h), w > h * 1.3
    m = 6.5 * U
    if land:
        pw = w * 0.58
        body = img(c["photo"], od, 0, 0, pw, h)
        body += f'<div style="position:absolute;left:{pw}px;top:0;width:{w - pw}px;height:{h}px;background:var(--ivory)"></div>'
        x0, tw = pw + m, w - pw - 2 * m
        top = m
        body += f'<div class="label" style="position:absolute;left:{x0}px;top:{top}px;font-size:{2.1 * U}px;color:var(--golddeep)">{escape(c["verb"])}</div>'
        body += (f'<div class="disp" style="position:absolute;left:{x0 - 0.4 * U}px;top:{top + 6 * U}px;width:{tw}px;font-size:{10 * U}px;white-space:nowrap">{escape(c["title"])}</div>')
        body += (f'<div class="text" style="position:absolute;left:{x0}px;top:{top + 20 * U}px;width:{tw}px;font-size:{3.4 * U}px;color:var(--charcoal)">{escape(c["line"])}</div>')
        body += f'<div class="cap" style="position:absolute;left:{x0}px;bottom:{m + 0.3 * U}px;font-size:{2.2 * U}px;color:var(--stone)">{escape(c["where"])}</div>'
        body += logo_block("fullcolour", m, h - m - 7.2 * U, 18.5 * U, "right")
        return body
    ratio = {True: 0.72}.get(h > w * 1.5, 0.66 if h > w * 1.05 else 0.6)
    ph = round(h * ratio)
    body = img(c["photo"], od, 0, 0, w, ph)
    body += f'<div style="position:absolute;left:0;top:{ph}px;width:{w}px;height:{h - ph}px;background:var(--ivory)"></div>'
    band = h - ph
    ts = 12.5 * U if band > 30 * U else 10.5 * U
    y0 = ph + band * 0.5 - ts * 0.62
    body += f'<div class="label" style="position:absolute;left:{m}px;top:{ph + m * 0.75}px;font-size:{2.1 * U}px;color:var(--golddeep)">{escape(c["verb"])}</div>'
    body += f'<div class="disp" style="position:absolute;left:{m - 0.6 * U}px;top:{y0}px;font-size:{ts}px;white-space:nowrap">{escape(c["title"])}</div>'
    body += f'<div class="cap" style="position:absolute;left:{m}px;bottom:{m}px;font-size:{2.5 * U}px;color:var(--stone)">{escape(c["where"])}</div>'
    body += logo_block("fullcolour", m, h - m - 7.6 * U, 19.5 * U, "right")
    if h > w * 1.5:
        body += (f'<div class="text" style="position:absolute;left:{m}px;top:{y0 + ts * 1.25}px;width:{w - 2 * m}px;font-size:{3.6 * U}px;color:var(--charcoal)">'
                 f'{escape(c["line"])}</div>')
    return body


def c_plate(w, h, c, od):
    U, land = u(w, h), w > h * 1.3
    m = 7 * U
    body = f'<div style="position:absolute;inset:0;background:var(--ivory)"></div>'
    pr = 1500 / 1200 if c["plate"] == "agbokim-waterfalls" else 1000 / 1600
    if land:
        pwid = (h - 2 * m) / pr
        body += f'<div class="plate" style="position:absolute;left:{m}px;top:{m}px;width:{pwid}px">{plate_svg(c["plate"])}</div>'
        x0 = m * 2 + pwid
        tw = w - x0 - m
        body += f'<div class="disp" style="position:absolute;left:{x0}px;top:{m - 0.8 * U}px;width:{tw}px;font-size:{8.4 * U}px;line-height:1.04">{escape(c["title"])}</div>'
        body += f'<div class="cap" style="position:absolute;left:{x0}px;top:{h - m - 13.5 * U}px;width:{tw}px;font-size:{2.2 * U}px;color:var(--stone)"><span class="num">{escape(c["no"])}</span>&ensp;{escape(c["caption"])}</div>'
        body += logo_block("fullcolour", x0, h - m - 7.4 * U, 19 * U)
        return body
    pw = w - 2 * m
    maxh = h * (0.62 if h > w * 1.5 else 0.58 if h > w * 1.05 else 0.5)
    phh = min(pw * pr, maxh)
    pw2 = phh / pr
    px = (w - pw2) / 2
    body += f'<div class="plate" style="position:absolute;left:{px}px;top:{m}px;width:{pw2}px">{plate_svg(c["plate"])}</div>'
    cy = m + phh + 2.6 * U
    body += f'<div class="cap" style="position:absolute;left:{px}px;top:{cy}px;width:{max(pw2, 70 * U)}px;font-size:{2.2 * U}px;color:var(--stone)"><span class="num">{escape(c["no"])}</span>&ensp;{escape(c["caption"])}</div>'
    body += f'<div class="disp" style="position:absolute;left:{m}px;bottom:{m + 11 * U}px;width:{w - 2 * m}px;font-size:{(8.2 if h > w * 1.05 else 7) * U}px;line-height:1.04">{escape(c["title"])}</div>'
    body += logo_block("fullcolour", m, h - m - 7.2 * U, 18.5 * U)
    return body


def c_statement(w, h, c, od):
    U, land = u(w, h), w > h * 1.3
    m = 7 * U
    body = '<div style="position:absolute;inset:0;background:var(--forest)"></div>'
    sun = 6 * U
    body += f'<div style="position:absolute;right:{m}px;top:{m}px;width:{sun}px;height:{sun}px;border-radius:50%;background:var(--gold)"></div>'
    fs = (8.6 if not land else 7.4) * U
    tw = w - 2 * m - (sun + 4 * U if land else 0)
    body += (f'<div class="disp" style="position:absolute;left:{m - 0.4 * U}px;bottom:{m + 17 * U}px;width:{tw}px;'
             f'font-size:{fs * (1.12 if h > w * 1.05 else 1)}px;line-height:1.06;color:var(--ivory)">{escape(c["title"])}</div>')
    body += f'<div class="hair" style="left:{m}px;right:{m}px;bottom:{m + 11 * U}px;color:var(--ridge)"></div>'
    body += logo_block("reversed", m, h - m - 7.2 * U, 18.5 * U)
    body += f'<div class="cap" style="position:absolute;right:{m}px;bottom:{m}px;font-size:{2.2 * U}px;color:var(--sage)">{escape(CONTACT["web"])}</div>'
    return body


def c_invest(w, h, c, od):
    U, land = u(w, h), w > h * 1.3
    m = 6.5 * U
    body = '<div style="position:absolute;inset:0;background:var(--ivory)"></div>'
    if land:
        ph = h
        pw = w * 0.36
        body += img(c["photo"], od, w - pw, 0, pw, ph)
        tw = w - pw - 2 * m
        x0 = m
        body += f'<div class="label" style="position:absolute;left:{x0}px;top:{m}px;font-size:{2.1 * U}px;color:var(--golddeep)">{escape(c["verb"])}</div>'
        body += f'<div class="disp" style="position:absolute;left:{x0 - 0.4 * U}px;top:{m + 5 * U}px;width:{tw}px;font-size:{8 * U}px;line-height:1.03">{escape(c["title"])}</div>'
        body += f'<div class="sans" style="position:absolute;left:{x0}px;top:{m + 30 * U}px;width:{tw * 0.86}px;font-size:{2.75 * U}px;line-height:1.5;color:var(--charcoal)">{escape(c["body"])}</div>'
        body += f'<div class="sans" style="position:absolute;left:{x0}px;bottom:{m}px;font-size:{2.4 * U}px;font-weight:600;color:var(--forest)">{escape(c["cta"])}</div>'
        body += logo_block("reversed", w - pw + m * 0.7, h - m - 6.5 * U, 16.5 * U)
        body += f'<div class="cap" style="position:absolute;right:{pw + m}px;bottom:{m}px;font-size:{1.9 * U}px;color:var(--stone)">Photo: {escape(PHOTOS[c["photo"]]["caption"])}</div>'
        return body
    ph = round(h * (0.34 if h > w * 1.5 else 0.38 if h > w * 1.05 else 0.36))
    body += img(c["photo"], od, 0, 0, w, ph)
    body += f'<div class="cap" style="position:absolute;right:{m}px;top:{ph + 1.6 * U}px;font-size:{2 * U}px;color:var(--stone)">{escape(PHOTOS[c["photo"]]["caption"])}</div>'
    y = ph + m * 1.1
    body += f'<div class="label" style="position:absolute;left:{m}px;top:{y}px;font-size:{2.1 * U}px;color:var(--golddeep)">{escape(c["verb"])}</div>'
    fs = (9.4 if h > w * 1.05 else 8.2) * U
    body += f'<div class="disp" style="position:absolute;left:{m - 0.5 * U}px;top:{y + 5 * U}px;width:{w - 2 * m}px;font-size:{fs}px;line-height:1.03">{escape(c["title"])}</div>'
    by = y + 5 * U + fs * 2.2 + 4 * U
    if h > w * 1.05:
        body += f'<div class="sans" style="position:absolute;left:{m}px;top:{by}px;width:{(w - 2 * m) * 0.82}px;font-size:{3 * U}px;line-height:1.5;color:var(--charcoal)">{escape(c["body"])}</div>'
    body += f'<div class="hair" style="left:{m}px;right:{m}px;bottom:{m + 10.5 * U}px;color:var(--haze)"></div>'
    body += f'<div class="sans" style="position:absolute;left:{m}px;bottom:{m + 0.4 * U}px;font-size:{2.6 * U}px;font-weight:600">{escape(c["cta"])}</div>'
    body += logo_block("fullcolour", m, h - m - 7.4 * U, 19 * U, "right")
    return body


def c_figure(w, h, c, od):
    U, land = u(w, h), w > h * 1.3
    m = 7 * U
    body = '<div style="position:absolute;inset:0;background:var(--ivory)"></div>'
    fs = (36 if h > w * 1.05 else 30 if not land else 34) * U
    top = m + (10 if h > w * 1.5 else 2) * U
    body += f'<div class="disp num" style="position:absolute;left:{m - 1.6 * U}px;top:{top}px;font-size:{fs}px;line-height:.86;letter-spacing:-0.035em">{escape(c["figure"])}</div>'
    body += f'<div class="sans" style="position:absolute;left:{m}px;top:{top + fs * 0.92}px;font-size:{3.4 * U}px;font-weight:600">{escape(c["unit"])}</div>'
    lx = m if not land else w * 0.52
    pos = f"bottom:{m + 17 * U}px" if not land else f"top:{top + 2 * U}px"
    body += f'<div class="disp" style="position:absolute;left:{lx}px;{pos};width:{(w - lx - m) * (0.9 if not land else 1)}px;font-size:{(7 if not land else 6) * U}px;line-height:1.06">{escape(c["line"])}</div>'
    body += f'<div class="hair" style="left:{m}px;right:{m}px;bottom:{m + 10.5 * U}px;color:var(--haze)"></div>'
    body += f'<div class="cap" style="position:absolute;left:{m}px;bottom:{m}px;width:{w * 0.55}px;font-size:{1.8 * U}px;color:var(--stone)">{escape(c["source"])}</div>'
    body += logo_block("fullcolour", m, h - m - 7.2 * U, 18.5 * U, "right")
    return body


def c_grid(w, h, c, od):
    U, land = u(w, h), w > h * 1.3
    m = 6.5 * U
    g = 1.2 * U
    body = '<div style="position:absolute;inset:0;background:var(--ivory)"></div>'
    head = (22 if h > w * 1.5 else 17 if h > w * 1.05 else 15) * U
    if land:
        cols, rows = 4, 1
        gx, gy, gw, gh = m, m + 16 * U, w - 2 * m, h - 2 * m - 16 * U - 12 * U
    else:
        cols, rows = 2, 2
        gx, gy, gw, gh = m, m + head, w - 2 * m, h - 2 * m - head - 12 * U
    capH = 4.4 * U
    cw = (gw - g * (cols - 1)) / cols
    ch = (gh - (g + capH) * (rows - 1) - capH) / rows
    for i, slug in enumerate(c["photos"][:cols * rows]):
        r, k = divmod(i, cols)
        x, y = gx + k * (cw + g), gy + r * (ch + capH + g)
        body += img(slug, od, x, y, cw, ch)
        body += f'<div class="cap" style="position:absolute;left:{x}px;top:{y + ch + 1.1 * U}px;width:{cw}px;font-size:{1.85 * U}px;color:var(--stone);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{escape(PHOTOS[slug]["caption"])}</div>'
    body += f'<div class="label" style="position:absolute;left:{m}px;top:{m}px;font-size:{2.1 * U}px;color:var(--golddeep)">{escape(c["verb"])}</div>'
    body += f'<div class="disp" style="position:absolute;left:{m - 0.4 * U}px;top:{m + 4.4 * U}px;width:{w - 2 * m}px;font-size:{(7.4 if not land else 6.4) * U}px;white-space:nowrap">{escape(c["title"])}</div>'
    body += logo_block("fullcolour", m, h - m - 7.2 * U, 18.5 * U, "right")
    body += f'<div class="cap" style="position:absolute;left:{m}px;bottom:{m}px;font-size:{2.2 * U}px;color:var(--stone)">{escape(CONTACT["web"])}</div>'
    return body


def c_contact(w, h, c, od):
    U, land = u(w, h), w > h * 1.3
    m = 7 * U
    body = '<div style="position:absolute;inset:0;background:var(--forest)"></div>'
    # the engraved Zuma Rock in Ridge ink, tone-on-tone along the foot of the frame
    pw = w * (1.5 if h > w * 1.5 else 1.15 if not land else 0.75)
    body += (f'<div class="plate" style="position:absolute;left:{(w - pw) / 2 if not land else w - pw + 6 * U}px;bottom:{-pw * 0.06}px;width:{pw}px;opacity:1">'
             f'{plate_svg("zuma-rock-quiet", "forest", keep_sun=False).replace(C["forest"], C["ridge"]).replace(C["ivory"], "transparent")}</div>')
    body += f'<div class="disp" style="position:absolute;left:{m - 0.5 * U}px;top:{m}px;font-size:{(11 if not land else 9) * U}px;color:var(--ivory)">{escape(c["title"])}</div>'
    body += f'<div class="text" style="position:absolute;left:{m}px;top:{m + (14 if not land else 12) * U}px;width:{w * (0.7 if not land else 0.45)}px;font-size:{3.4 * U}px;color:var(--sage)">{escape(c["body"])}</div>'
    rows = [("Telephone", CONTACT["phone"]), ("General", CONTACT["email"])] + [(p["name"], p["email"]) for p in CONTACT["people"]]
    y = m + (26 if not land else 22) * U
    lines = "".join(f'<div style="display:flex;gap:{2 * U}px;padding:{1.25 * U}px 0;border-top:1px solid {C["ridge"]}"><span class="label" style="width:{19 * U}px;font-size:{1.75 * U}px;color:var(--sage);padding-top:{0.5 * U}px">{escape(k)}</span>'
                    f'<span class="sans num" style="font-size:{2.9 * U}px;color:var(--ivory)">{escape(v)}</span></div>' for k, v in rows)
    body += f'<div style="position:absolute;left:{m}px;top:{y}px;width:{w * (0.86 if not land else 0.52)}px">{lines}</div>'
    body += logo_block("reversed", m, m, 17 * U, "right") if not land else logo_block("reversed", m, h - m - 7 * U, 17.5 * U)
    return body


COMPOSE = {"place": c_place, "plate": c_plate, "statement": c_statement, "invest": c_invest, "figure": c_figure,
           "explore-grid": c_grid, "contact": c_contact}


def build(only=None, fmts=None):
    content = DEFAULT
    cj = S / "content.json"
    json.dump(DEFAULT, open(cj, "w"), indent=2, ensure_ascii=False)
    jobs = []
    for key, fn in COMPOSE.items():
        if only and key not in only:
            continue
        for fk, (w, h) in FORMATS.items():
            if fmts and fk not in fmts:
                continue
            od = S / key / "source"
            src = page(od / f"DN_social_{key}_{fk}.html", w, h, fn(w, h, content[key], od), title=f"Social: {key} {fk}")
            jobs.append(job(src, S / key / f"DN_social_{key}_{fk}.png", w, h))
    json.dump(jobs, open(KIT / "16_SOURCE_FILES/build/_jobs/_jobs_social2.json", "w"), indent=1)
    print(len(jobs), "jobs")


if __name__ == "__main__":
    a = sys.argv[1:]
    build(only=[x for x in a if x in COMPOSE] or None, fmts=[x for x in a if x in FORMATS] or None)
