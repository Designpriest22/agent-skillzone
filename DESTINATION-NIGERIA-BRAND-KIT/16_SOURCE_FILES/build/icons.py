"""Destination Nigeria icon family — original artwork on a 24-unit grid.

Line style: 1.5 stroke, round caps/joins, 2-unit safe margin, geometry built from circles,
gentle arcs and the logo's horizon curve. Solid style: bodies filled, inner details knocked out.

Each icon = list of (kind, d):
  body  — closed shape: stroked in line style, filled in solid style
  knock — detail inside a body: stroked in line style, cut out (transparent) in solid style
  line  — open stroke drawn in both styles
  kline — stroked in both, and also cuts a gap through bodies in solid style (interlocking)
  fill  — always filled (small dots)
"""
import json
from brand import C, KIT, write, svg_doc

ICONS = {
    # --- the 14 brief categories -------------------------------------------------------
    "destination": [("body", "M12 21.25s-6.75-5.9-6.75-11.25a6.75 6.75 0 0 1 13.5 0c0 5.35-6.75 11.25-6.75 11.25z"),
                    ("knock", "M8.6 12.6l2.35-3.6 1.6 2.1 1.25-1.5 1.6 3"), ("knock", "M14.6 7.6h.01")],
    "nature": [("body", "M4.75 19.25C4.75 10.5 9.75 4.75 19.25 4.75c0 9.5-5.75 14.5-14.5 14.5z"),
               ("knock", "M4.75 19.25 13 11"), ("knock", "M9.5 14.5h3.25M12 12V9")],
    "culture": [("body", "M7 4.25h10c0 3.6-2.6 5.1-2.6 7.75s2.6 4.15 2.6 7.75H7c0-3.6 2.6-5.1 2.6-7.75S7 7.85 7 4.25z"),  # dùndún talking drum
                ("knock", "M10.75 6.5v11M13.25 6.5v11"), ("line", "M5.5 4.25h13M5.5 19.75h13")],
    "heritage": [("body", "M4.75 20.25V9.6L12 4.75l7.25 4.85v10.65h-4.5V15.5a2.75 2.75 0 0 0-5.5 0v4.75z"),
                 ("line", "M3 20.25h18"), ("knock", "M12 9.25h.01")],
    "food": [("body", "M3.75 11.25h16.5a8.25 8.25 0 0 1-16.5 0z"), ("line", "M9 3.5c-1 1.15 1 2.35 0 3.75M13 3.5c-1 1.15 1 2.35 0 3.75M17 4.75c-.8.9.8 1.75 0 2.75"),
             ("knock", "M7.5 14.25h9")],
    "hospitality": [("body", "M4.25 17a7.75 7.75 0 0 1 15.5 0z"), ("line", "M2.75 20.25h18.5M12 9.25V6.5M10.25 6.25h3.5"),
                    ("knock", "M8.25 14.2a4.2 4.2 0 0 1 2.4-2.35")],
    "transport": [("body", "M6.25 4h11.5a1.75 1.75 0 0 1 1.75 1.75V17.5h-15V5.75A1.75 1.75 0 0 1 6.25 4z"),
                  ("knock", "M6.75 7.25h10.5v4.5H6.75z"), ("knock", "M7.75 14.75h.01M16.25 14.75h.01"),
                  ("line", "M7.5 17.5v2.75M16.5 17.5v2.75")],
    "events": [("body", "M5.75 5.75h12.5a1.5 1.5 0 0 1 1.5 1.5v11.5a1.5 1.5 0 0 1-1.5 1.5H5.75a1.5 1.5 0 0 1-1.5-1.5V7.25a1.5 1.5 0 0 1 1.5-1.5z"),
               ("line", "M8.25 3.5v4M15.75 3.5v4"), ("knock", "M4.25 10h15.5"),
               ("knock", "M12 12.6l1 2 2.2.3-1.6 1.55.4 2.2-2-1.05-2 1.05.4-2.2-1.6-1.55 2.2-.3z")],
    "investment": [("line", "M3.75 20.25h16.5"), ("body", "M5.75 15.5h3v4.75h-3zM10.5 12.5h3v7.75h-3zM15.25 9.5h3v10.75h-3z"),
                   ("line", "M5 10.25 10 6.5l3 1.75L18.75 4"), ("line", "M15.75 3.75h3.25V7")],
    "partnership": [("body", "M9.25 12m-5.5 0a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0-11 0"),
                    ("kline", "M14.75 12m-5.5 0a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0-11 0")],
    "visitor-info": [("body", "M12 12m-8.25 0a8.25 8.25 0 1 0 16.5 0a8.25 8.25 0 1 0-16.5 0"),
                     ("knock", "M12 11v5.5"), ("knock", "M12 7.75h.01")],
    "responsible-tourism": [("line", "M3.25 15.75h3l3.25 2.5h5.25c.9 0 1.6-.55 1.9-1.25l3.6-4.25"),
                            ("line", "M9.5 15.75h4.75"),
                            ("body", "M12 12.25C9 12.25 7.5 10.25 7.5 7.25c3 0 4.5 2 4.5 5zM12 12.25c0-3.75 2-5.75 5.5-5.75 0 3.5-2 5.75-5.5 5.75z")],
    "travel-planning": [("line", "M6.5 18.25c4.25 0 3-6.25 7-6.25 2.25 0 3.5-1.25 4-2.5"),
                        ("body", "M6.5 18.25m-2.25 0a2.25 2.25 0 1 0 4.5 0a2.25 2.25 0 1 0-4.5 0"),
                        ("body", "M18 9.75s-2.75-2.4-2.75-4.6a2.75 2.75 0 0 1 5.5 0c0 2.2-2.75 4.6-2.75 4.6z")],
    "media-press": [("body", "M9.5 6a2.5 2.5 0 0 1 5 0v5a2.5 2.5 0 0 1-5 0z"), ("line", "M6.25 10.75a5.75 5.75 0 0 0 11.5 0M12 16.5v3.75M9 20.25h6"),
                    ("knock", "M9.5 8.5h1.5M13 8.5h1.5")],
    # --- brand + interface extras --------------------------------------------------------
    "sun": [("body", "M12 12m-4.5 0a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0-9 0"),
            ("line", "M12 2.75v1.75M12 19.5v1.75M2.75 12h1.75M19.5 12h1.75M5.5 5.5l1.25 1.25M17.25 17.25l1.25 1.25M5.5 18.5l1.25-1.25M17.25 6.75l1.25-1.25")],
    "landmark": [("body", "M3.25 19.5c1.5-4.5 2.75-9.5 5.5-12.25 1.6-1.6 4.4-1.6 6 0 2.75 2.75 4 7.75 5.5 12.25z"),
                 ("line", "M2.25 19.5h19.5"), ("knock", "M10.5 10v6M13.5 9.5v6.5")],
    "search": [("line", "M10.75 10.75m-6.5 0a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0-13 0M15.5 15.5l4.75 4.75")],
    "arrow-right": [("line", "M4.75 12h14.5M13.5 6.25 19.25 12l-5.75 5.75")],
    "arrow-up-right": [("line", "M7 17 17 7M8.5 7H17v8.5")],
    "menu": [("line", "M4 7h16M4 12h16M4 17h10")],
    "close": [("line", "M6 6l12 12M18 6 6 18")],
    "download": [("line", "M12 4v11M7.25 10.5 12 15.25l4.75-4.75M4.75 19.75h14.5")],
    "phone": [("line", "M7.6 3.75H5.25a1.5 1.5 0 0 0-1.5 1.6c.75 8 7 14.25 15 15a1.5 1.5 0 0 0 1.6-1.5V16.5l-4-1.75-2 2a12 12 0 0 1-5.25-5.25l2-2z")],
    "mail": [("line", "M4.5 5.75h15a1 1 0 0 1 1 1v10.5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V6.75a1 1 0 0 1 1-1zM3.75 7l8.25 6 8.25-6")],
    "globe": [("line", "M12 12m-8.25 0a8.25 8.25 0 1 0 16.5 0a8.25 8.25 0 1 0-16.5 0M3.75 12h16.5M12 3.75c2.4 2.4 3.4 5.2 3.4 8.25S14.4 17.85 12 20.25C9.6 17.85 8.6 15.05 8.6 12S9.6 6.15 12 3.75z")],
    "calendar": [("line", "M5.75 5.75h12.5a1.5 1.5 0 0 1 1.5 1.5v11.5a1.5 1.5 0 0 1-1.5 1.5H5.75a1.5 1.5 0 0 1-1.5-1.5V7.25a1.5 1.5 0 0 1 1.5-1.5zM8.25 3.5v4M15.75 3.5v4M4.25 10h15.5")],
    "camera": [("line", "M4.75 7.75h3l1.5-2.5h5.5l1.5 2.5h3a1 1 0 0 1 1 1v9.5a1 1 0 0 1-1 1H4.75a1 1 0 0 1-1-1v-9.5a1 1 0 0 1 1-1zM12 13.25m-3.25 0a3.25 3.25 0 1 0 6.5 0a3.25 3.25 0 1 0-6.5 0")],
    "play": [("line", "M12 12m-8.25 0a8.25 8.25 0 1 0 16.5 0a8.25 8.25 0 1 0-16.5 0M10.25 8.75v6.5l5-3.25z")],
    "external": [("line", "M13.5 4.75h5.75v5.75M19.25 4.75 11 13M17 13.75v4.5a1 1 0 0 1-1 1H5.75a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4.5")],
    "check": [("line", "M4.75 12.5 9.5 17.25 19.25 7.5")],
    "plus": [("line", "M12 5v14M5 12h14")],
    "user": [("line", "M12 8.25m-3.75 0a3.75 3.75 0 1 0 7.5 0a3.75 3.75 0 1 0-7.5 0M4.75 20.25a7.25 7.25 0 0 1 14.5 0")],
}
BRIEF = ["destination", "nature", "culture", "heritage", "food", "hospitality", "transport", "events", "investment",
         "partnership", "visitor-info", "responsible-tourism", "travel-planning", "media-press"]
LABELS = {"destination": "Destinations", "nature": "Nature", "culture": "Culture", "heritage": "Heritage", "food": "Food",
          "hospitality": "Hospitality", "transport": "Transport", "events": "Events", "investment": "Investment",
          "partnership": "Business partnerships", "visitor-info": "Visitor information",
          "responsible-tourism": "Responsible tourism", "travel-planning": "Travel planning", "media-press": "Media & press"}
SW = 1.5


def icon_body(name, style="line", color="currentColor", uid=""):
    els = ICONS[name]
    st = f'fill="none" stroke="{color}" stroke-width="{SW}" stroke-linecap="round" stroke-linejoin="round"'
    if style == "line":
        inner = "".join(f'<path d="{d}"/>' for k, d in els if k != "fill")
        return f'<g {st}>{inner}</g>'
    # solid
    mid = f"m{uid}{name}"
    knocks = "".join(f'<path d="{d}" stroke-width="{SW}"/>' for k, d in els if k == "knock") + \
        "".join(f'<path d="{d}" stroke-width="{SW + 2.25}"/>' for k, d in els if k == "kline")
    bodies = "".join(f'<path d="{d}"/>' for k, d in els if k == "body")
    lines = "".join(f'<path d="{d}"/>' for k, d in els if k in ("line", "kline"))
    out = (f'<mask id="{mid}" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">'
           f'<rect width="24" height="24" fill="#fff"/><g fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round">{knocks}</g></mask>'
           f'<g mask="url(#{mid})"><g fill="{color}" stroke="{color}" stroke-width="{SW}" stroke-linejoin="round">{bodies}</g></g>'
           f'<g {st}>{lines}</g>')
    return out


def icon_svg(name, style, color):
    title = LABELS.get(name, name.replace("-", " ").title())
    return svg_doc(24, 24, icon_body(name, style, color), f"{title} icon ({style})",
                   "Destination Nigeria icon family. 24 × 24 grid, 1.5 stroke.", px=(24, 24))


if __name__ == "__main__":
    D = "04_VECTOR_GRAPHICS_AND_ICONS/icons"
    for n in ICONS:
        write(f"{D}/line/DN_icon_{n}_line.svg", icon_svg(n, "line", C["forest"]))
        write(f"{D}/web-currentColor/DN_icon_{n}_line.svg", icon_svg(n, "line", "currentColor"))
        if n in BRIEF or n in ("sun", "landmark"):
            write(f"{D}/solid/DN_icon_{n}_solid.svg", icon_svg(n, "solid", C["forest"]))
            write(f"{D}/web-currentColor/DN_icon_{n}_solid.svg", icon_svg(n, "solid", "currentColor"))
    # sprite for the web
    sym = []
    for n in ICONS:
        sym.append(f'<symbol id="dn-{n}" viewBox="0 0 24 24">{icon_body(n, "line")}</symbol>')
        if n in BRIEF or n in ("sun", "landmark"):
            sym.append(f'<symbol id="dn-{n}-solid" viewBox="0 0 24 24">{icon_body(n, "solid", uid="s")}</symbol>')
    write(f"{D}/DN_icons_sprite.svg", '<svg xmlns="http://www.w3.org/2000/svg" style="display:none">' + "".join(sym) + "</svg>\n")
    json.dump({"brief_set": BRIEF, "all": list(ICONS), "labels": LABELS}, open(KIT / D / "DN_icons_index.json", "w"), indent=1)
    print(len(ICONS), "icons")
