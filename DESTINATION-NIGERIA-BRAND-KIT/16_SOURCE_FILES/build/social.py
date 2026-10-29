"""Social media + digital campaign templates → 11_SOCIAL_MEDIA_TEMPLATES.

Each template is a parametric SVG with LIVE text (editable in Figma, Illustrator, Inkscape, Canva import)
and linked images (relative paths). Copy is read from content.json, so a new post is: edit JSON → run →
PNG. Logo artwork is outlined vector from the master; never type the logo.
"""
import html
import json
from brand import *
from gfx import text_path
from graphics import campaign_line, horizon_set, ribbon

S = KIT / "11_SOCIAL_MEDIA_TEMPLATES"
CONTENT = S / "content.json"
FORMATS = {"ig-portrait_1080x1350": (1080, 1350), "square_1080x1080": (1080, 1080), "story_1080x1920": (1080, 1920),
           "landscape_1200x675": (1200, 675)}
EXTRA = {"youtube-thumb_1280x720": (1280, 720), "web-banner_1920x600": (1920, 600), "mpu_300x250": (300, 250), "leaderboard_728x90": (728, 90)}
FONTFILE = {("sans", 400): "Inter-Regular", ("sans", 600): "Inter-SemiBold", ("sans", 700): "Inter-Bold",
            ("serif", 500): "PlayfairDisplay-Medium", ("serif", 400): "PlayfairDisplay-Regular", ("serif", 600): "PlayfairDisplay-SemiBold"}
FAM = {"sans": "Inter, 'Segoe UI', Arial, sans-serif", "serif": "'Playfair Display', Georgia, serif"}
DEFAULT = {
    "discover-destination": {"overline": "DISCOVER · [STATE]", "title": "[Destination name]", "body": "[One line on why it is worth the journey]", "cta": "Plan your visit", "image": "dawn"},
    "experience-culture": {"overline": "EXPERIENCE · [CITY]", "title": "[Festival or cultural experience]", "body": "[Dates — confirmed only] · [Venue]", "cta": "Learn more", "image": "dusk"},
    "explore-business": {"overline": "EXPLORE · TOURISM BUSINESS", "title": "[Business name]", "body": "[Category] · [Location]", "cta": "[website or handle]", "image": "day"},
    "meet-partner": {"overline": "MEET THE PARTNER", "title": "[Partner name]", "body": "“[Short approved quote]”", "cta": "[Role, organisation]", "image": "day"},
    "investment-opportunity": {"overline": "INVEST · OPPORTUNITY", "title": "[Project title]", "facts": ["Location: [State]", "Category: [Type]", "Stage: [Stage]"], "cta": "Request the profile"},
    "national-tourism-week": {"overline": "ANNOUNCEMENT", "title": "National Tourism Week", "body": "[Year] · [Dates — publish only once officially confirmed]", "cta": "[Venue / city]"},
    "industry-insight": {"overline": "INDUSTRY INSIGHT", "figure": "[00%]", "body": "[What the figure measures, in one sentence]", "source": "Source: [verified source, year]"},
    "official-news": {"overline": "OFFICIAL", "title": "[Headline of the announcement]", "body": "[One or two sentences of verified detail.]", "date": "[DD Month YYYY]"},
}


def wrap(text, style, size, maxw, track=0.0):
    fam, wt = style
    words, lines, cur = text.split(), [], ""
    for wd in words:
        t = (cur + " " + wd).strip()
        if cur and text_path(t, FONTFILE[(fam, wt)], size, track)[1] > maxw:
            lines.append(cur)
            cur = wd
        else:
            cur = t
    if cur:
        lines.append(cur)
    return lines


def T(x, y, text, size, fill, style=("sans", 400), maxw=None, lh=1.15, track=0.0, anchor="start", caps=False, maxlines=4):
    """Live <text>, word-wrapped with real font metrics. Returns (svg, bottom_y)."""
    lines = wrap(text, style, size, maxw, track) if maxw else [text]
    lines = lines[:maxlines]
    ts = "".join(f'<tspan x="{x:.1f}" dy="{0 if i == 0 else size * lh:.1f}">{html.escape(l)}</tspan>' for i, l in enumerate(lines))
    ls = f' letter-spacing="{track * size:.2f}"' if track else ""
    s = (f'<text x="{x:.1f}" y="{y:.1f}" font-family="{FAM[style[0]]}" font-weight="{style[1]}" font-size="{size:.1f}" fill="{fill}"'
         f'{ls} text-anchor="{anchor}">{ts}</text>')
    return s, y + size * lh * (len(lines) - 1)


def img(w, h, mood, x=0, y=0, iw=None, ih=None, clip=None):
    iw, ih = iw or w, ih or h
    tag = "9x16" if ih / iw > 1.5 else ("4x5" if ih / iw > 1.05 else "3x2")
    href = f"../../06_PHOTOGRAPHY_AND_MEDIA/placeholders/DN_placeholder_landscape-{mood}_{tag}.jpg"
    c = f' clip-path="url(#{clip})"' if clip else ""
    return f'<image href="{href}" x="{x}" y="{y}" width="{iw}" height="{ih}" preserveAspectRatio="xMidYMid slice"{c}><title>Replace with licensed photograph</title></image>'


def grad(id_, a0=0, a1=.85, horizontal=False):
    x2, y2 = (1, 0) if horizontal else (0, 1)
    return (f'<linearGradient id="{id_}" x1="0" y1="0" x2="{x2}" y2="{y2}"><stop offset="0" stop-color="{C["forest"]}" stop-opacity="{a0}"/>'
            f'<stop offset=".45" stop-color="{C["forest"]}" stop-opacity="{a0 + .05}"/><stop offset="1" stop-color="{C["forest"]}" stop-opacity="{a1}"/></linearGradient>')


def logo(w, h, cw="reversed", pos="tl", scale=None):
    m = min(w, h)
    lw = scale or max(m * .26, 110)
    lh = LOGO_H * lw / LOGO_W
    pad = m * .065
    x = {"tl": pad, "tr": w - pad - lw, "bl": pad, "br": w - pad - lw, "tc": (w - lw) / 2, "bc": (w - lw) / 2}[pos]
    y = pad if pos[0] == "t" else h - pad - lh
    return logo_inline(cw, x, y, lw)


def cta(x, y, text, size, fill=C["gold"], color=C["forest"]):
    tw = text_path(text, "Inter-SemiBold", size, .04)[1]
    padx, h = size * 1.1, size * 2.3
    s, _ = T(x + padx, y + h * .66, text, size, color, ("sans", 600), track=.04)
    return f'<rect x="{x:.1f}" y="{y:.1f}" width="{tw + 2 * padx:.1f}" height="{h:.1f}" rx="{h / 2:.1f}" fill="{fill}"/>' + s


def compose(key, w, h, c):
    m, pad = min(w, h), min(w, h) * .075
    portrait, land = h > w * 1.05, w > h * 1.3
    defs, body = "", ""
    sz = lambda k: m * k
    if key in ("discover-destination", "experience-culture"):
        defs = grad("g", 0, .88)
        body += img(w, h, c["image"]) + f'<rect width="{w}" height="{h}" fill="url(#g)"/>'
        body += logo(w, h, "reversed", "tl")
        tw = w * (.62 if land else .84)
        tsize = sz(.105 if not land else .1)
        lines = len(wrap(c["title"], ("serif", 500), tsize, tw))
        y = h - pad - sz(.12) - sz(.05) - tsize * 1.05 * (lines - 1) - sz(.06)
        s, _ = T(pad, y - tsize * .9, c["overline"], sz(.028), C["gold"], ("sans", 600), track=.2)
        body += s
        s, yb = T(pad, y, c["title"], tsize, C["ivory"], ("serif", 500), tw, 1.05)
        body += s
        s, yb = T(pad, yb + sz(.075), c["body"], sz(.034), C["ivory"], ("sans", 400), tw, 1.35)
        body += s
        body += cta(pad, h - pad - sz(.075), c["cta"], sz(.03))
        if key == "experience-culture":
            body += f'<path fill="{C["gold"]}" d="{ribbon((w * .55, h - pad * .9), (w * .7, h - pad * 1.3), (w * .85, h - pad * 1.35), (w + 5, h - pad * 1.1), m * .012, .5)}"/>'
    elif key == "explore-business":
        split = h * (.58 if portrait else .5) if not land else h
        iw = w if not land else w * .55
        body += f'<rect width="{w}" height="{h}" fill="{C["ivory"]}"/>' + img(w, h, c["image"], 0, 0, iw, split)
        body += logo(iw, split, "fullcolour", "tl")
        x0, y0 = (pad, split + sz(.1)) if not land else (iw + pad * .8, pad + sz(.1))
        tw = (w - 2 * pad) if not land else (w - iw - 1.6 * pad)
        s, _ = T(x0, y0, c["overline"], sz(.026), C["golddeep"], ("sans", 600), track=.2)
        body += s
        s, yb = T(x0, y0 + sz(.1), c["title"], sz(.085), C["forest"], ("serif", 500), tw, 1.05)
        body += s
        s, yb = T(x0, yb + sz(.065), c["body"], sz(.034), C["stone"], ("sans", 400), tw)
        body += s
        body += cta(x0, yb + sz(.05), c["cta"], sz(.028), C["forest"], C["ivory"])
        body += f'<path fill="{C["sage"]}" d="{ribbon((w * .45, h - 6), (w * .65, h - pad * .7), (w * .85, h - pad * .75), (w + 4, h - pad * .4), m * .012, .5)}"/>'
    elif key == "meet-partner":
        body += f'<rect width="{w}" height="{h}" fill="{C["forest"]}"/>'
        r = m * (.25 if not land else .3)
        cx, cy = (w / 2, pad + sz(.15) + r) if not land else (pad + r + m * .05, h / 2)
        defs = f'<clipPath id="sunwin"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath>'
        body += f'<circle cx="{cx}" cy="{cy}" r="{r + m * .03}" fill="none" stroke="{C["gold"]}" stroke-width="{m * .004}"/>'
        body += img(w, h, c["image"], cx - r, cy - r, 2 * r, 2 * r, "sunwin")
        anchor = "middle" if not land else "start"
        x0 = w / 2 if not land else cx + r + pad
        tw = w - 2 * pad if not land else w - x0 - pad
        y0 = cy + r + sz(.13) if not land else pad + sz(.18)
        s, _ = T(x0, y0, c["overline"], sz(.026), C["gold"], ("sans", 600), track=.2, anchor=anchor)
        body += s
        s, yb = T(x0, y0 + sz(.09), c["title"], sz(.07), C["ivory"], ("serif", 500), tw, 1.05, anchor=anchor)
        body += s
        s, yb = T(x0, yb + sz(.07), c["body"], sz(.038), C["ivory"], ("serif", 400), tw, 1.3, anchor=anchor)
        body += s
        s, _ = T(x0, yb + sz(.06), c["cta"], sz(.028), C["sage"], ("sans", 400), tw, anchor=anchor)
        body += s
        body += logo(w, h, "reversed", "bc" if not land else "br", m * .2)
    elif key == "investment-opportunity":
        body += f'<rect width="{w}" height="{h}" fill="{C["forest"]}"/>'
        rings = "".join(f'<circle cx="{w * .9}" cy="{h * 1.02}" r="{m * r}" fill="none" stroke="{C["gold"]}" stroke-opacity="{o}" stroke-width="{m * .002}"/>'
                        for r, o in [(.25, .5), (.4, .3), (.56, .18), (.74, .1)])
        body += rings + f'<circle cx="{w * .9}" cy="{h * 1.02}" r="{m * .13}" fill="{C["gold"]}"/>'
        body += logo(w, h, "reversed", "tl")
        tw = w * (.8 if not land else .6)
        y0 = h * (.36 if portrait else .4)
        s, _ = T(pad, y0, c["overline"], sz(.028), C["gold"], ("sans", 600), track=.2)
        body += s
        s, yb = T(pad, y0 + sz(.1), c["title"], sz(.085), C["ivory"], ("serif", 500), tw, 1.05)
        body += s
        yy = yb + sz(.08)
        for f in c["facts"]:
            body += f'<path d="M{pad},{yy - sz(.045)} H{pad + tw * .7}" stroke="{C["ridge"]}" stroke-width="{m * .002}"/>'
            s, _ = T(pad, yy, f, sz(.032), C["sage"], ("sans", 400))
            body += s
            yy += sz(.065)
        body += cta(pad, yy + sz(.01), c["cta"], sz(.028))
        s, _ = T(pad, h - pad * .6, "Verified data only. Unconfirmed values are shown as TBC.", sz(.018), C["sage"], ("sans", 400))
        body += s
    elif key == "national-tourism-week":
        body += f'<rect width="{w}" height="{h}" fill="{C["forest"]}"/>'
        cx, cy = (w * .27, h * .47) if land else (w / 2, h * (.36 if portrait else .29))
        body += "".join(f'<circle cx="{cx}" cy="{cy}" r="{m * r}" fill="none" stroke="{C["gold"]}" stroke-opacity="{o}" stroke-width="{m * .003}"/>' for r, o in [(.16, .6), (.24, .35), (.33, .2), (.44, .1)])
        body += roundel_inline(cx - m * .11, cy - m * .11, m * .22, "ivory", uid="ntw")
        body += f'<g opacity=".95" transform="translate(0,{h - m * .13}) scale({w / 1200})">{horizon_set(C["gold"], C["ivory"])}</g>'
        if land:
            x0, anchor, tw, y0 = w * .53, "start", w * .42, h * .36
        else:
            x0, anchor, tw = w / 2, "middle", w - 2 * pad
            y0 = cy + m * (.33 if portrait else .23)
        s, _ = T(x0, y0, c["overline"], sz(.028), C["gold"], ("sans", 600), track=.22, anchor=anchor)
        body += s
        s, yb = T(x0, y0 + sz(.1), c["title"], sz(.085 if not land else .08), C["ivory"], ("serif", 500), tw, 1.05, anchor=anchor)
        body += s
        s, yb = T(x0, yb + sz(.07), c["body"], sz(.032), C["sage"], ("sans", 400), tw, 1.3, anchor=anchor)
        body += s
        s, _ = T(x0, yb + sz(.06), c["cta"], sz(.03), C["ivory"], ("sans", 600), anchor=anchor)
        body += s
        body += logo(w, h, "reversed", "tr" if land else "tc", m * .2)
    elif key == "industry-insight":
        body += f'<rect width="{w}" height="{h}" fill="{C["ivory"]}"/>'
        body += f'<circle cx="{w - pad * 1.6}" cy="{pad * 2.2}" r="{m * .045}" fill="{C["gold"]}"/>'
        body += logo(w, h, "fullcolour", "tl")
        y0 = h * (.38 if portrait else .42)
        s, _ = T(pad, y0, c["overline"], sz(.028), C["golddeep"], ("sans", 600), track=.2)
        body += s
        s, yb = T(pad, y0 + sz(.24), c["figure"], sz(.24), C["forest"], ("sans", 400), track=-.02)
        body += s
        body += f'<path d="M{pad},{yb + sz(.06)} H{pad + m * .18}" stroke="{C["gold"]}" stroke-width="{m * .006}"/>'
        s, yb = T(pad, yb + sz(.14), c["body"], sz(.045), C["forest"], ("serif", 400), w * (.8 if not land else .55), 1.25)
        body += s
        s, _ = T(pad, h - pad, c["source"], sz(.022), C["stone"], ("sans", 400))
        body += s
    elif key == "official-news":
        body += f'<rect width="{w}" height="{h}" fill="#FFFFFF"/><rect width="{w}" height="{m * .018}" fill="{C["forest"]}"/>'
        body += logo(w, h, "fullcolour", "tl")
        y0 = h * (.36 if portrait else .42)
        s, _ = T(pad, y0, c["overline"] + "  ·  " + c["date"], sz(.026), C["golddeep"], ("sans", 600), track=.2)
        body += s
        s, yb = T(pad, y0 + sz(.1), c["title"], sz(.075), C["forest"], ("serif", 500), w - 2 * pad, 1.08)
        body += s
        s, yb = T(pad, yb + sz(.075), c["body"], sz(.034), C["charcoal"], ("sans", 400), w - 2 * pad, 1.4)
        body += s
        body += f'<g transform="translate(0,{h - m * .17}) scale({w / 1200})">{horizon_set(C["forest"], C["ridge"])}</g>'
    return defs, body


def banner(key, w, h, c):
    """Compact digital banners (web hero strip, MPU, leaderboard)."""
    m = min(w, h)
    body = f'<rect width="{w}" height="{h}" fill="{C["forest"]}"/>'
    if w / h > 5:   # leaderboard / web strip
        lw = h * 1.9
        body += logo_inline("reversed", h * .25, (h - LOGO_H * lw / LOGO_W) / 2, lw)
        s, _ = T(h * .5 + lw, h * .62, c.get("title", ""), h * .3, C["ivory"], ("serif", 500))
        body += s
        body += cta(w - h * .25 - text_path(c["cta"], "Inter-SemiBold", h * .17, .04)[1] - h * .38, h * .26, c["cta"], h * .17)
        body += f'<path fill="{C["gold"]}" d="{ribbon((w * .45, h - 2), (w * .6, h * .82), (w * .8, h * .8), (w, h * .9), h * .05, .5)}"/>'
    elif w / h > 2.5:   # web hero banner
        body = img(w, h, "dawn") + f'<rect width="{w}" height="{h}" fill="url(#gh)"/>'
        body += logo_inline("reversed", h * .12, h * .12, h * .55)
        s, _ = T(h * .12, h * .62, c.get("title", ""), h * .14, C["ivory"], ("serif", 500))
        body += s
        cl, cw_ = campaign_line(C["ivory"], size=h * .045, x=h * .12, y=h * .8)
        body += cl
        return grad("gh", .85, .1, True), body
    else:   # MPU
        body += logo_inline("reversed", m * .08, m * .08, m * .5)
        s, yb = T(m * .08, h * .52, c.get("title", ""), m * .1, C["ivory"], ("serif", 500), w * .84, 1.05)
        body += s
        body += cta(m * .08, h - m * .08 - m * .14, c["cta"], m * .06)
        body += f'<circle cx="{w - m * .12}" cy="{m * .14}" r="{m * .05}" fill="{C["gold"]}"/>'
    return "", body


if __name__ == "__main__":
    if not CONTENT.exists():
        CONTENT.write_text(json.dumps(DEFAULT, indent=2, ensure_ascii=False))
    content = json.loads(CONTENT.read_text())
    jobs = []
    for key, c in content.items():
        for tag, (w, h) in FORMATS.items():
            defs, body = compose(key, w, h, c)
            rel = f"11_SOCIAL_MEDIA_TEMPLATES/{key}/DN_social_{key}_{tag}.svg"
            write(rel, svg_doc(w, h, body, f"Destination Nigeria social template — {key} ({tag})",
                               "Live text: edit in Figma/Illustrator/Inkscape, or edit content.json and re-run social.py.", px=(w, h), extra_defs=defs))
            jobs.append(dict(src=str(KIT / rel), out=str(KIT / rel.replace(".svg", ".png")), w=w, h=h, direct=True))
    for key, fmts in [("national-tourism-week", ["youtube-thumb_1280x720", "web-banner_1920x600", "mpu_300x250", "leaderboard_728x90"]),
                      ("discover-destination", ["youtube-thumb_1280x720", "web-banner_1920x600"]),
                      ("investment-opportunity", ["mpu_300x250", "leaderboard_728x90"])]:
        for tag in fmts:
            w, h = EXTRA[tag]
            defs, body = compose(key, w, h, content[key]) if tag.startswith("youtube") else banner(key, w, h, content[key])
            rel = f"11_SOCIAL_MEDIA_TEMPLATES/{key}/DN_social_{key}_{tag}.svg"
            write(rel, svg_doc(w, h, body, f"Destination Nigeria — {key} ({tag})", px=(w, h), extra_defs=defs))
            jobs.append(dict(src=str(KIT / rel), out=str(KIT / rel.replace(".svg", ".png")), w=w, h=h, direct=True))
    json.dump(jobs, open(KIT / "16_SOURCE_FILES/build/_jobs/_jobs_social.json", "w"), indent=1)
    print(len(jobs), "templates")
