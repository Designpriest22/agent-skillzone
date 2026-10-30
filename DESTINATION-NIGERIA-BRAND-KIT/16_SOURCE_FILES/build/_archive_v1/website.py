"""Website & digital brand components → 12_WEBSITE_ASSETS."""
import json
import shutil
from PIL import Image
from brand import *
from graphics import campaign_line, horizon_set
from backgrounds import landscape_layers

WD = "12_WEBSITE_ASSETS"
W = KIT / WD
jobs = []


def favicons():
    d = W / "favicon"
    d.mkdir(parents=True, exist_ok=True)
    R = 41.0
    svg = svg_doc(R, R, roundel_inline(0, 0, R, "forest", uid="fav"), "Destination Nigeria", px=(64, 64))
    (d / "favicon.svg").write_text(svg)
    (d / "safari-pinned-tab.svg").write_text(svg_doc(R, R, roundel_inline(0, 0, R, "mono-black", uid="pin"), "Destination Nigeria"))
    for s in (16, 32, 48, 180, 192, 512):
        jobs.append(dict(src=str(d / "favicon.svg"), out=str(d / f"icon-{s}.png"), w=s, h=s, transparent=True))
    # maskable icon: roundel inside safe zone on forest
    m = svg_doc(512, 512, f'<rect width="512" height="512" fill="{C["forest"]}"/>' + roundel_inline(512 * .14, 512 * .14, 512 * .72, "forest", uid="mk"), "maskable")
    (d / "icon-maskable.svg").write_text(m)
    jobs.append(dict(src=str(d / "icon-maskable.svg"), out=str(d / "icon-maskable-512.png"), w=512, h=512))
    (d / "site.webmanifest").write_text(json.dumps({
        "name": "Destination Nigeria", "short_name": "Destination NG", "theme_color": C["forest"], "background_color": C["ivory"],
        "display": "standalone", "icons": [{"src": "icon-192.png", "sizes": "192x192", "type": "image/png"},
                                           {"src": "icon-512.png", "sizes": "512x512", "type": "image/png"},
                                           {"src": "icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]}, indent=2))
    (d / "HEAD_SNIPPET.html").write_text("""<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/icon-180.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#103428">
<meta property="og:image" content="https://[domain]/og/DN_og-cover_1200x630.jpg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
""")


def og_and_hero():
    # Open Graph / social sharing cover
    w, h = 1200, 630
    body = (f'<rect width="{w}" height="{h}" fill="{C["forest"]}"/>'
            + f'<circle cx="{w * .82}" cy="{h * .3}" r="60" fill="{C["gold"]}"/>'
            + landscape_layers(w, h, h * .66, [C["ridge"], "#21483A", "#173D30", "#0E2C22"], 3, .75)
            + logo_inline("reversed", 80, 130, 520))
    cl, cw = campaign_line(C["ivory"], size=22, x=82, y=420)
    body += cl
    write(f"{WD}/og/DN_og-cover_1200x630.svg", svg_doc(w, h, body, "Destination Nigeria — social sharing image", px=(w, h)))
    jobs.append(dict(src=str(W / "og/DN_og-cover_1200x630.svg"), out=str(W / "og/DN_og-cover_1200x630.jpg"), w=w, h=h, quality=90))
    jobs.append(dict(src=str(W / "og/DN_og-cover_1200x630.svg"), out=str(W / "og/DN_og-cover_1200x630.png"), w=w, h=h))
    # Twitter/X summary (square)
    body = f'<rect width="600" height="600" fill="{C["forest"]}"/>' + roundel_inline(90, 90, 420, "ivory", uid="tw")
    write(f"{WD}/og/DN_social-share_square_600.svg", svg_doc(600, 600, body, "Square share image", px=(600, 600)))
    jobs.append(dict(src=str(W / "og/DN_social-share_square_600.svg"), out=str(W / "og/DN_social-share_square_600.png"), w=600, h=600))
    # hero background: wide, text-safe left zone
    w, h = 2560, 1200
    body = (f'<defs><linearGradient id="hs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{C["forest"]}"/><stop offset=".55" stop-color="{C["ridge"]}"/>'
            f'<stop offset=".7" stop-color="#C79A45"/><stop offset=".74" stop-color="{C["gold"]}"/></linearGradient></defs>'
            f'<rect width="{w}" height="{h}" fill="url(#hs)"/><circle cx="{w * .72}" cy="{h * .7}" r="120" fill="#F6C86A"/>'
            + landscape_layers(w, h, h * .7, ["#4E6B55", C["ridge"], "#173D30", C["forest"]], 8, .58))
    write(f"{WD}/hero/DN_hero_golden-hour_2560x1200.svg", svg_doc(w, h, body, "Website hero background", px=(w, h)))
    jobs.append(dict(src=str(W / "hero/DN_hero_golden-hour_2560x1200.svg"), out=str(W / "hero/DN_hero_golden-hour_2560x1200.jpg"), w=w, h=h, quality=86))
    jobs.append(dict(src=str(W / "hero/DN_hero_golden-hour_2560x1200.svg"), out=str(W / "hero/DN_hero_golden-hour_mobile_900x1400.jpg"), w=900, h=1400, quality=86))


def map_style():
    """MapLibre / Mapbox GL style in brand colours. Replace the tile source with your licensed provider."""
    style = {"version": 8, "name": "Destination Nigeria", "glyphs": "[your-glyphs-url]/{fontstack}/{range}.pbf",
             "sources": {"basemap": {"type": "vector", "url": "[your-vector-tiles-url — e.g. OpenMapTiles-compatible]"}},
             "layers": [
                 {"id": "background", "type": "background", "paint": {"background-color": C["ivory"]}},
                 {"id": "water", "type": "fill", "source": "basemap", "source-layer": "water", "paint": {"fill-color": "#CFE0DA"}},
                 {"id": "waterway", "type": "line", "source": "basemap", "source-layer": "waterway", "paint": {"line-color": "#9FC2BC", "line-width": 1.2}},
                 {"id": "landcover-park", "type": "fill", "source": "basemap", "source-layer": "park", "paint": {"fill-color": C["sage"], "fill-opacity": .45}},
                 {"id": "roads-minor", "type": "line", "source": "basemap", "source-layer": "transportation", "filter": ["in", "class", "minor", "service"],
                  "paint": {"line-color": "#FFFFFF", "line-width": 1}},
                 {"id": "roads-major", "type": "line", "source": "basemap", "source-layer": "transportation", "filter": ["in", "class", "primary", "trunk", "motorway"],
                  "paint": {"line-color": C["savannah"], "line-width": 2}},
                 {"id": "boundary-country", "type": "line", "source": "basemap", "source-layer": "boundary", "filter": ["==", "admin_level", 2],
                  "paint": {"line-color": C["forest"], "line-width": 1.4}},
                 {"id": "boundary-state", "type": "line", "source": "basemap", "source-layer": "boundary", "filter": ["==", "admin_level", 4],
                  "paint": {"line-color": C["canopy"], "line-width": .8, "line-dasharray": [2, 2]}},
                 {"id": "place-city", "type": "symbol", "source": "basemap", "source-layer": "place", "filter": ["==", "class", "city"],
                  "layout": {"text-field": "{name}", "text-font": ["Inter SemiBold"], "text-size": 13},
                  "paint": {"text-color": C["forest"], "text-halo-color": C["ivory"], "text-halo-width": 1.5}}]}
    write(f"{WD}/map/DN_map-style_maplibre.json", json.dumps(style, indent=2))
    for f in ["DN_map_nigeria_routes_light.svg", "DN_map_nigeria_routes_dark.svg", "DN_route-kit.svg"]:
        shutil.copy(KIT / "04_VECTOR_GRAPHICS_AND_ICONS/maps" / f, W / "map" / f)
    write(f"{WD}/map/DN_map-pin.svg", svg_doc(24, 30, f'<path d="M12 29s-10-8.5-10-16a10 10 0 0 1 20 0c0 7.5-10 16-10 16z" fill="{C["forest"]}"/><circle cx="12" cy="12.5" r="4" fill="{C["gold"]}"/>', "Map pin", px=(48, 60)))


def section_backgrounds():
    d = W / "section-backgrounds"
    d.mkdir(exist_ok=True)
    for src in sorted((KIT / "05_BACKGROUNDS_AND_TEXTURES").glob("*/DN_bg_*_16x9_1920x1080.jpg")):
        im = Image.open(src)
        im.save(d / (src.stem + ".webp"), "WEBP", quality=82, method=6)


def components_page():
    sprite = (KIT / "04_VECTOR_GRAPHICS_AND_ICONS/icons/DN_icons_sprite.svg").read_text()
    logo_svg = svg_doc(LOGO_W, LOGO_H, logo_inline("fullcolour", 0, 0, LOGO_W), "Destination Nigeria")
    logo_rev = svg_doc(LOGO_W, LOGO_H, logo_inline("reversed", 0, 0, LOGO_W), "Destination Nigeria")
    mapsvg = (KIT / "04_VECTOR_GRAPHICS_AND_ICONS/maps/DN_map_nigeria_routes_light.svg").read_text()
    loader = svg_doc(64, 64, f'<g class="disc">{roundel_inline(0, 0, 64, "forest", uid="ld")}</g>', "Loading")
    # make loader parts addressable: wrap landscape & sun via classes in a hand-built version
    from brand import PATH, COLOURWAYS
    cx, cy, r = 93.0, 7.5, 32.0
    s = 64 / (2 * r)
    cw = COLOURWAYS["reversed"]
    loader = (f'<svg class="dn-loader" viewBox="0 0 64 64" role="img" aria-label="Loading"><defs><clipPath id="ldc"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath></defs>'
              f'<g transform="scale({s}) translate({-(cx - r)},{-(cy - r)})"><circle class="disc" cx="{cx}" cy="{cy}" r="{r}" fill="{C["forest"]}"/>'
              f'<g clip-path="url(#ldc)"><g class="land"><path fill="{cw["hz"]}" d="{PATH["horizon"]}"/><path fill="{cw["hzs"]}" d="{PATH["horizon_small"]}"/>'
              f'<path fill="{cw["mt"]}" d="{PATH["monolith"]}"/><path fill="{cw["mt"]}" d="{PATH["ridge"]}"/></g>'
              f'<path class="sun" fill="{C["gold"]}" d="{PATH["sun"]}"/></g></g></svg>')
    ph = "../../06_PHOTOGRAPHY_AND_MEDIA/placeholders/"
    ico = lambda n, extra="": f'<svg aria-hidden="true" {extra}><use href="#dn-{n}"/></svg>'
    page = f"""<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Destination Nigeria — Web components</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,500&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="dn-components.css"><link rel="icon" href="../favicon/favicon.svg">
<style>.demo-h{{display:flex;align-items:center;justify-content:space-between;padding:20px 0}} .demo-h svg.logo{{width:170px;height:auto}}
.hero{{position:relative;min-height:620px;display:grid;align-items:center;background:url(../hero/DN_hero_golden-hour_2560x1200.jpg) center/cover}}
.hero::before{{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(16,52,40,.85),rgba(16,52,40,.1) 70%)}} .hero .dn-wrap{{position:relative}}
.swatches{{display:flex;gap:8px;flex-wrap:wrap}} .sw{{width:120px;border-radius:10px;overflow:hidden;background:#fff;font-size:.75rem}} .sw i{{display:block;height:64px}} .sw span{{display:block;padding:8px}}
.row{{display:flex;gap:12px;flex-wrap:wrap;align-items:center}}</style></head><body>
<div hidden>{sprite}</div>
<header class="dn-wrap demo-h">{logo_svg.replace('<svg ', '<svg class="logo" ', 1)}<nav class="row"><a class="dn-link" href="#">Experience</a><a class="dn-link" href="#">Invest</a><a class="dn-link" href="#">Explore</a><a class="dn-btn dn-btn--primary" href="#">Plan your visit</a></nav></header>
<section class="hero on-dark"><div class="dn-wrap"><p class="dn-overline">Experience · Invest · Explore</p><h1 class="dn-hero-title" style="max-width:14ch">Your next horizon is closer than you think.</h1>
<p class="dn-lead" style="color:var(--dn-ivory);max-width:46ch">[Supporting line — replace with approved copy.]</p>
<form class="dn-search" role="search" onsubmit="return false">{ico('search')}<input placeholder="Search destinations, festivals, experiences" aria-label="Search"><select aria-label="State"><option>All states</option></select><button class="dn-btn dn-btn--accent">Search</button></form></div></section>
<main>
<section class="dn-section"><div class="dn-wrap"><p class="dn-overline">Buttons &amp; links</p><div class="row"><a class="dn-btn dn-btn--primary" href="#">Primary {ico('arrow-right')}</a><a class="dn-btn dn-btn--accent" href="#">Accent</a><a class="dn-btn dn-btn--ghost" href="#">Ghost</a><button class="dn-btn dn-btn--primary" disabled>Disabled</button><a href="#">Inline link</a></div>
<hr class="dn-rule"><p class="dn-overline">Destination cards</p><div class="dn-grid">
""" + "".join(f"""<a class="dn-card dn-card--destination" href="#"><div class="dn-card__media"><img src="{ph}DN_placeholder_landscape-{m}_3x2.jpg" alt="Placeholder — replace with licensed photograph"><span class="dn-tag">{t}</span></div>
<div class="dn-card__body"><p class="dn-overline" style="margin:0">[State]</p><h3 class="dn-card__title">[Destination name]</h3><p class="dn-card__meta">{ico('destination')} [Region] · [Distance from city]</p></div></a>""" for m, t in [("dawn", "Nature"), ("day", "Heritage"), ("dusk", "Culture")]) + """</div>
<hr class="dn-rule"><p class="dn-overline">Editorial cards</p><div class="dn-grid">""" + "".join(f"""<a class="dn-card dn-card--editorial" href="#"><div class="dn-card__media"><img src="{ph}DN_placeholder_landscape-{m}_3x2.jpg" alt="Placeholder"></div><div class="dn-card__body"><p class="dn-overline" style="margin:0">Story · 6 min read</p><h3 class="dn-card__title">[Editorial headline in Source Serif 4]</h3><p class="dn-caption">By [Author] · [Date]</p></div></a>""" for m in ("day", "dusk", "dawn")) + """</div>
<hr class="dn-rule"><p class="dn-overline">Investment cards</p><div class="dn-grid">""" + "".join("""<article class="dn-card dn-card--invest"><div class="dn-card__body"><span class="dn-status">Opportunity · [Stage]</span><h3 class="dn-card__title">[Project title]</h3><dl><dt>Location</dt><dd>[State, LGA]</dd><dt>Category</dt><dd>[Category]</dd><dt>Investment</dt><dd>TBC</dd></dl><a class="dn-btn dn-btn--accent" href="#" style="align-self:flex-start;margin-top:12px;position:relative;z-index:1">Request profile</a></div></article>""" for _ in range(3)) + f"""</div></div></section>
<section class="dn-section" style="background:#fff"><div class="dn-wrap" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:48px">
<div><p class="dn-overline">Map</p><h2 class="dn-h1">Explore by region</h2><div class="dn-map">{mapsvg}</div><p class="dn-caption">Boundaries: Natural Earth (public domain). Illustrative.</p></div>
<div><p class="dn-overline">Form controls</p><h2 class="dn-h1">Partner enquiry</h2><form onsubmit="return false">
<div class="dn-field"><label class="dn-label" for="n">Full name</label><input class="dn-input" id="n" placeholder="Your name"></div>
<div class="dn-field dn-field--error"><label class="dn-label" for="e">Email</label><input class="dn-input" id="e" value="name@" aria-invalid="true" aria-describedby="ee"><span class="dn-error" id="ee">Enter a valid email address.</span></div>
<div class="dn-field"><label class="dn-label" for="t">Enquiry type</label><select class="dn-select" id="t"><option>Partnership</option><option>Investment</option><option>Media</option></select></div>
<div class="dn-field"><label class="dn-label" for="m">Message</label><textarea class="dn-textarea" id="m" rows="4"></textarea><span class="dn-hint">Please do not include personal financial information.</span></div>
<label class="dn-check"><input type="checkbox" checked> I agree to be contacted about this enquiry.</label><br><label class="dn-check"><input type="radio" name="r" checked> Email</label> <label class="dn-check"><input type="radio" name="r"> Telephone</label><br>
<button class="dn-btn dn-btn--primary">Send enquiry {ico('arrow-right')}</button></form>
<div style="display:grid;gap:8px;margin-top:24px"><div class="dn-alert dn-alert--success">Thank you — your enquiry has been received.</div><div class="dn-alert dn-alert--warning">Some details could not be verified.</div><div class="dn-alert dn-alert--error">Something went wrong. Please try again.</div><div class="dn-alert dn-alert--info">Information is updated as it is verified.</div></div></div></div></section>
<section class="dn-section"><div class="dn-wrap"><div class="dn-newsletter on-dark"><div><p class="dn-overline">Newsletter</p><h2 class="dn-h1" style="color:var(--dn-ivory)">Horizons, in your inbox.</h2><p>Destinations, festivals and opportunities — monthly.</p></div>
<form onsubmit="return false"><input class="dn-input" type="email" placeholder="Email address" aria-label="Email address"><button class="dn-btn dn-btn--accent">Subscribe</button><p class="dn-caption" style="color:var(--dn-sage);width:100%">[Link to privacy notice]</p></form></div></div></section>
<section class="dn-section" style="background:#fff"><div class="dn-wrap dn-grid">
<div class="dn-state"><svg class="dn-state__art" viewBox="0 0 160 90">{logo_inline("fullcolour", 0, 0, 160, parts=["horizon", "horizon_small", "monolith", "ridge", "sun"]).replace("translate(0.000,0.000)", "translate(-48,4)").replace("scale(1.06489)", "scale(1.6)")}</svg><div class="dn-state__code">404</div><h3 class="dn-h3">This path leads off the map.</h3><p class="dn-caption">The page may have moved. Try search or return home.</p><a class="dn-btn dn-btn--primary" href="#">Back to home</a></div>
<div class="dn-state">{ico('search', 'style="width:56px;height:56px;color:var(--dn-canopy)"')}<h3 class="dn-h3">No results yet</h3><p class="dn-caption">Try a different state or category.</p><a class="dn-btn dn-btn--ghost" href="#">Clear filters</a></div>
<div class="dn-state">{loader}<h3 class="dn-h3">Loading</h3><p class="dn-caption">Branded loader (CSS animation, honours reduced motion).</p></div></div></section>
<footer style="background:var(--dn-forest);padding:56px 0" class="on-dark"><div class="dn-wrap row" style="justify-content:space-between">{logo_rev.replace('<svg ', '<svg style="width:180px;height:auto" ', 1)}<span class="dn-caption" style="color:var(--dn-sage)">© [Year] Destination Nigeria · [Privacy] · [Accessibility]</span></div></footer>
</main></body></html>"""
    write(f"{WD}/components/DN_components.html", page)
    write(f"{WD}/components/DN_loader.html", f'<!doctype html><html><head><meta charset="utf-8"><title>Loader</title><link rel="stylesheet" href="dn-components.css"></head>'
                                             f'<body style="display:grid;place-items:center;height:100vh;background:var(--dn-ivory)">{loader}</body></html>')
    jobs.append(dict(src=str(W / "components/DN_components.html"), out=str(W / "components/DN_components_preview.png"), w=1440, h=900, scale=1, wait=800, fullPage=True))


if __name__ == "__main__":
    favicons()
    og_and_hero()
    map_style()
    section_backgrounds()
    components_page()
    json.dump(jobs, open(KIT / "16_SOURCE_FILES/build/_jobs/_jobs_web.json", "w"), indent=1)
    print(len(jobs), "jobs")
