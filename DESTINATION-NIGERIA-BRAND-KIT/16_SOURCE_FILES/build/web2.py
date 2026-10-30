"""Website v2 → 12_WEBSITE_ASSETS: component stylesheet, component library, homepage design (desktop and
mobile), Open Graph image, hero and section image crops. Square corners, hairlines, real photography."""
import json
from html import escape
from pathlib import Path
from PIL import Image
from brand import C, KIT, CONTACT, PHOTOS, photo, write
from v2 import font_css, logo_svg, plate_svg, rel, page, job, img

W = KIT / "12_WEBSITE_ASSETS"
jobs = []

CSS = """/* Destination Nigeria: component styles v2.0. Requires tokens/dn-tokens.css. */
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:var(--dn-ivory);color:var(--dn-forest);font:400 1rem/1.6 var(--dn-font-sans);-webkit-font-smoothing:antialiased;font-feature-settings:'kern','lnum'}
img{display:block;max-width:100%}
a{color:var(--dn-forest);text-decoration-thickness:1px;text-underline-offset:.18em}
a:hover{color:var(--dn-ridge)}
:focus-visible{outline:3px solid var(--dn-gold);outline-offset:2px}
.dn-wrap{max-width:1240px;margin:0 auto;padding:0 40px}
.dn-display{font:400 clamp(2.75rem,6vw,5.5rem)/0.98 var(--dn-font-display);letter-spacing:-.02em;margin:0;text-wrap:balance}
.dn-h1{font:400 clamp(2.25rem,4vw,3.5rem)/1.04 var(--dn-font-display);letter-spacing:-.015em;margin:0 0 .4em;text-wrap:balance}
.dn-h2{font:400 clamp(1.6rem,2.6vw,2.25rem)/1.1 var(--dn-font-display);letter-spacing:-.01em;margin:0 0 .5em}
.dn-h3{font:600 1.15rem/1.3 var(--dn-font-sans);margin:0 0 .4em}
.dn-lead{font:400 1.375rem/1.45 var(--dn-font-text);margin:0 0 1em;text-wrap:pretty}
.dn-label{font:600 .75rem/1.2 var(--dn-font-sans);letter-spacing:.08em;text-transform:uppercase;color:var(--dn-golddeep);margin:0 0 .9rem}
.dn-caption{font:400 .8125rem/1.4 var(--dn-font-sans);color:var(--dn-stone);margin:.55rem 0 0}
.dn-num{font-feature-settings:'tnum','lnum'}
.dn-rule{border:0;border-top:1px solid var(--dn-haze);margin:0}
/* buttons: square, quiet, one primary per view */
.dn-btn{display:inline-flex;align-items:center;gap:.6em;font:600 .9375rem/1 var(--dn-font-sans);padding:1rem 1.35rem;border:1px solid var(--dn-forest);
  background:var(--dn-forest);color:var(--dn-white);text-decoration:none;border-radius:0;transition:background .2s var(--dn-ease),color .2s var(--dn-ease)}
.dn-btn:hover{background:var(--dn-ridge);color:var(--dn-white)}
.dn-btn--secondary{background:transparent;color:var(--dn-forest)}
.dn-btn--secondary:hover{background:var(--dn-forest);color:var(--dn-white)}
.dn-btn--sun{background:var(--dn-gold);border-color:var(--dn-gold);color:var(--dn-forest)}
.dn-link{font:600 .9375rem/1.4 var(--dn-font-sans);text-decoration:none;border-bottom:1px solid currentColor;padding-bottom:2px}
/* header */
.dn-header{display:flex;align-items:center;justify-content:space-between;padding:22px 40px;border-bottom:1px solid var(--dn-haze);background:var(--dn-ivory)}
.dn-header .dn-logo{width:150px}
.dn-nav{display:flex;gap:32px;font:500 .9375rem/1 var(--dn-font-sans)}
.dn-nav a{text-decoration:none}
.dn-nav a[aria-current]{border-bottom:1px solid var(--dn-forest);padding-bottom:4px}
/* figure: a photograph with its caption, never without one */
.dn-figure{margin:0}
.dn-figure img{width:100%;aspect-ratio:var(--ratio,3/2);object-fit:cover}
/* columns separated by hairlines, not cards */
.dn-cols{display:grid;grid-template-columns:repeat(var(--n,3),1fr);gap:0 48px}
.dn-cols>*{border-top:1px solid var(--dn-forest);padding-top:22px}
/* key figure */
.dn-figure-stat{font:400 clamp(4rem,9vw,8rem)/.86 var(--dn-font-display);letter-spacing:-.035em;font-feature-settings:'lnum'}
/* table */
.dn-table{width:100%;border-collapse:collapse;font:400 .9375rem/1.35 var(--dn-font-sans)}
.dn-table th{font:600 .75rem/1.2 var(--dn-font-sans);letter-spacing:.06em;text-transform:uppercase;text-align:left;border-bottom:1.5px solid var(--dn-forest);padding:.7rem .5rem .7rem 0}
.dn-table td{border-bottom:1px solid var(--dn-haze);padding:.7rem .5rem .7rem 0}
.dn-table td.n,.dn-table th.n{text-align:right;font-feature-settings:'tnum','lnum'}
/* forms */
.dn-field{display:grid;gap:.45rem;margin:0 0 1.25rem}
.dn-label-field{font:600 .8125rem/1.2 var(--dn-font-sans)}
.dn-input{font:400 1rem/1.4 var(--dn-font-sans);padding:.85rem .9rem;border:1px solid var(--dn-stone);border-radius:0;background:var(--dn-white);color:var(--dn-charcoal)}
.dn-input:focus{outline:3px solid var(--dn-gold);outline-offset:0;border-color:var(--dn-forest)}
.dn-help{font:400 .8125rem/1.4 var(--dn-font-sans);color:var(--dn-stone)}
.dn-field--error .dn-input{border-color:var(--dn-error)}
.dn-error{font:600 .8125rem/1.4 var(--dn-font-sans);color:var(--dn-error)}
/* notice */
.dn-notice{border-top:2px solid var(--dn-forest);padding:1rem 0;font:400 .9375rem/1.5 var(--dn-font-sans)}
.dn-notice--warning{border-color:var(--dn-warning)}
.dn-notice--error{border-color:var(--dn-error)}
/* dark band */
.dn-band{background:var(--dn-forest);color:var(--dn-ivory)}
.dn-band a{color:var(--dn-ivory)}
.dn-band .dn-caption{color:var(--dn-sage)}
.dn-band .dn-label{color:var(--dn-sage)}
@media (max-width:760px){.dn-wrap{padding:0 20px}.dn-cols{grid-template-columns:1fr;gap:28px}.dn-nav{display:none}.dn-header{padding:16px 20px}}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
"""


def head(out_dir, title, extra=""):
    return (f"<!doctype html><html lang='en'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>"
            f"<title>{escape(title)}</title><style>{font_css(out_dir)}</style>"
            f"<link rel='stylesheet' href='{rel(W / 'tokens/dn-tokens.css', out_dir)}'><link rel='stylesheet' href='{rel(W / 'components/dn-components.css', out_dir)}'>"
            f"<style>{extra}</style></head>")


def ph(slug, out_dir, ratio="3/2", cap=True):
    c = PHOTOS[slug]["caption"]
    fx, fy = PHOTOS[slug]["focus"]
    return (f"<figure class='dn-figure' style='--ratio:{ratio}'><img src='{rel(W / 'images' / f'DN_web_{slug}.jpg', out_dir)}' alt='{escape(c or 'Nigerian highlands')}' "
            f"style='object-position:{fx * 100:.0f}% {fy * 100:.0f}%'>" + (f"<figcaption class='dn-caption'>{escape(c)}</figcaption>" if cap and c else "") + "</figure>")


def images():
    d = W / "images"
    d.mkdir(parents=True, exist_ok=True)
    for slug in PHOTOS:
        im = Image.open(photo(slug))
        im.thumbnail((1920, 1920))
        im.save(d / f"DN_web_{slug}.jpg", quality=84, optimize=True, progressive=True)
        im.save(d / f"DN_web_{slug}.webp", quality=80, method=6)
    # hero crops from the only supplied image large enough for a full-width hero
    im = Image.open(photo("agbokim-waterfalls"))
    w, h = im.size
    im.crop((0, int(h * 0.17), w, int(h * 0.17) + int(w * 0.5))).save(W / "hero" / "DN_hero_agbokim-waterfalls_1920x960.jpg", quality=86, progressive=True)
    cw = int(h * 900 / 1400)
    x0 = int(w * 0.33 - cw / 2)
    im.crop((x0, 0, x0 + cw, h)).resize((900, 1400), Image.LANCZOS).save(W / "hero" / "DN_hero_agbokim-waterfalls_mobile_900x1400.jpg", quality=86, progressive=True)


def homepage(width, mobile=False):
    od = W / "homepage"
    name = f"DN_homepage_{'mobile' if mobile else 'desktop'}"
    hero_h = 540 if mobile else 720
    places = ["idanre-hills", "obudu-road", "lekki-ikoyi-bridge", "bowers-tower"]
    extra = f"""
.hero{{position:relative;height:{hero_h}px;overflow:hidden}}
.hero img{{width:100%;height:100%;object-fit:cover;object-position:40% 40%}}
.intro{{display:grid;grid-template-columns:{'1fr' if mobile else '1.35fr 1fr'};gap:{'20px' if mobile else '64px'};padding:{'26px 0 64px' if mobile else '36px 0 96px'}}}
.section{{padding:{'64px 0' if mobile else '104px 0'}}}
.places{{display:grid;grid-template-columns:{'1fr 1fr' if mobile else 'repeat(4,1fr)'};gap:{'20px 14px' if mobile else '28px'}}}
.plate-band{{display:grid;grid-template-columns:{'1fr' if mobile else '1fr 1fr'};gap:{'28px' if mobile else '72px'};align-items:center}}
.stat{{display:grid;grid-template-columns:{'1fr' if mobile else 'auto 1fr'};gap:{'12px' if mobile else '72px'};align-items:end}}
.contact{{display:grid;grid-template-columns:{'1fr' if mobile else '1fr 1fr'};gap:48px;padding:{'64px 0 40px' if mobile else '96px 0 56px'}}}
.contact dl{{margin:0;display:grid;grid-template-columns:{'1fr' if mobile else '150px 1fr'};row-gap:0}}
.contact dt,.contact dd{{margin:0;padding:{'10px 0 2px' if mobile else '14px 0'};border-top:1px solid var(--dn-ridge)}}
.contact dt{{font:600 .72rem/1.6 var(--dn-font-sans);letter-spacing:.08em;text-transform:uppercase;color:var(--dn-sage)}}
.contact dd{{font:400 1.05rem/1.5 var(--dn-font-sans);{'border-top:0;padding-top:0;' if mobile else ''}}}
.foot{{display:flex;justify-content:space-between;align-items:end;padding:28px 0 40px;border-top:1px solid var(--dn-ridge);font:400 .8125rem/1.4 var(--dn-font-sans);color:var(--dn-sage)}}
"""
    nav = "" if mobile else "<nav class='dn-nav' aria-label='Main'><a href='#' aria-current='page'>Experience</a><a href='#'>Invest</a><a href='#'>Explore</a><a href='#'>About</a><a href='#'>Contact</a></nav>"
    menu = "<span style='font:600 .9rem var(--dn-font-sans)'>Menu</span>" if mobile else ""
    html = head(od, "Destination Nigeria — homepage design", extra) + f"""<body>
<header class='dn-header'><a href='#' class='dn-logo' aria-label='Destination Nigeria home'>{logo_svg('fullcolour')}</a>{nav}{menu}</header>
<main>
<section class='hero'><img src='{rel(W / 'hero' / ('DN_hero_agbokim-waterfalls_mobile_900x1400.jpg' if mobile else 'DN_hero_agbokim-waterfalls_1920x960.jpg'), od)}' alt='Agbokim Waterfalls, Cross River State'></section>
<div class='dn-wrap'>
 <p class='dn-caption' style='margin-top:12px'>Agbokim Waterfalls, Cross River State</p>
 <div class='intro'>
  <h1 class='dn-display'>Nigeria, one place at a time.</h1>
  <div><p class='dn-lead'>Destination Nigeria brings travellers, investors and communities together around the places that make the country worth the journey.</p>
   <p style='display:flex;gap:12px;flex-wrap:wrap;margin:0'><a class='dn-btn' href='#'>Plan a visit</a><a class='dn-btn dn-btn--secondary' href='#'>Investment enquiries</a></p></div>
 </div>
 <div class='dn-cols' style='--n:3'>
  <div><p class='dn-label'>Experience</p><h2 class='dn-h2'>Go and see it.</h2><p>Waterfalls, granite hills, coastlines and cities, with the practical detail needed to plan the journey.</p><a class='dn-link' href='#'>Places to visit</a></div>
  <div><p class='dn-label'>Invest</p><h2 class='dn-h2'>Build what visitors need.</h2><p>Tourism projects across the country, presented with verified information and a named contact.</p><a class='dn-link' href='#'>Opportunities</a></div>
  <div><p class='dn-label'>Explore</p><h2 class='dn-h2'>Know the country better.</h2><p>Stories, research and data on Nigerian tourism, published with their sources.</p><a class='dn-link' href='#'>Read more</a></div>
 </div>
</div>
<section class='section'><div class='dn-wrap'>
 <p class='dn-label'>Places to begin</p><h2 class='dn-h1' style='margin-bottom:36px'>Four corners, one country.</h2>
 <div class='places'>{''.join(ph(s, od, '4/5') for s in places)}</div>
</div></section>
<section class='dn-band section'><div class='dn-wrap plate-band'>
 <figure class='dn-figure' style='margin:0'><div class='plate'>{plate_svg('zuma-rock', 'ivory')}</div><figcaption class='dn-caption'>Pl. 01&ensp;Zuma Rock, Niger State</figcaption></figure>
 <div><p class='dn-label'>The land in our name</p><h2 class='dn-h1'>A granite dome on the road from Abuja to Kaduna.</h2>
 <p class='dn-lead' style='color:var(--dn-sage)'>The logo draws the kind of place Nigeria is known for: an inselberg on the horizon, with the sun beside it. Our engraved plates are traced from photographs of real places, so every illustration is somewhere you can go.</p></div>
</div></section>
<section class='section'><div class='dn-wrap stat'>
 <div class='dn-figure-stat dn-num'>774</div>
 <div><p class='dn-h2' style='margin:0 0 10px'>local government areas, and every one has a place worth the journey.</p><p class='dn-caption'>Source: Constitution of the Federal Republic of Nigeria, 1999, First Schedule.</p></div>
</div></section>
<footer class='dn-band'><div class='dn-wrap'>
 <div class='contact'>
  <div><h2 class='dn-h1' style='color:var(--dn-ivory)'>Talk to us.</h2><p class='dn-lead' style='color:var(--dn-sage)'>Partnerships, investment enquiries, media and visits.</p></div>
  <dl><dt>Telephone</dt><dd class='dn-num'>{CONTACT['phone']}</dd><dt>General</dt><dd>{CONTACT['email']}</dd>
  {''.join(f"<dt>{escape(p['name'])}</dt><dd>{p['email']}</dd>" for p in CONTACT['people'])}</dl>
 </div>
 <div class='foot'><div style='width:150px'>{logo_svg('reversed')}</div><span>{CONTACT['web']}</span></div>
</div></footer>
</main></body></html>"""
    od.mkdir(parents=True, exist_ok=True)
    out = od / f"{name}.html"
    out.write_text(html, encoding="utf-8")
    jobs.append(job(out, od / f"{name}.png", width, 900, 1, fullPage=True, wait=400))


def components():
    od = W / "components"
    (od / "dn-components.css").write_text(CSS)
    swatches = "".join(f"<div><div style='height:64px;background:var(--dn-{k});border:1px solid var(--dn-haze)'></div><p class='dn-caption'>{n}<br><span class='dn-num'>{h}</span></p></div>"
                       for k, n, h in [("forest", "Forest", C["forest"]), ("ridge", "Ridge", C["ridge"]), ("gold", "Sun Gold", C["gold"]),
                                       ("ivory", "Paper", C["ivory"]), ("charcoal", "Ink", C["charcoal"]), ("stone", "Stone", C["stone"]),
                                       ("haze", "Haze", C["haze"]), ("sage", "Sage", C["sage"]), ("golddeep", "Gold Text", C["golddeep"])])
    html = head(od, "Destination Nigeria — components v2", ".grid{display:grid;grid-template-columns:repeat(9,1fr);gap:16px}.two{display:grid;grid-template-columns:1fr 1fr;gap:64px}section{padding:56px 0;border-top:1px solid var(--dn-haze)}") + f"""<body>
<header class='dn-header'><a class='dn-logo' href='#'>{logo_svg('fullcolour')}</a><nav class='dn-nav'><a href='#' aria-current='page'>Experience</a><a href='#'>Invest</a><a href='#'>Explore</a><a href='#'>Contact</a></nav></header>
<div class='dn-wrap'>
<section style='border:0'><p class='dn-label'>Components v2.0</p><h1 class='dn-display'>The web kit.</h1><p class='dn-lead' style='max-width:720px'>Square corners, hairline structure, real photography with captions. One primary action per view.</p></section>
<section><p class='dn-label'>Colour</p><div class='grid'>{swatches}</div></section>
<section class='two'><div><p class='dn-label'>Type</p><p class='dn-h1'>Headline in Newsreader Display</p><p class='dn-h2'>Second-level heading</p><p class='dn-h3'>Third-level heading in Public Sans</p>
<p class='dn-lead'>A standfirst in Newsreader Text, for the paragraph that tells the reader what the page is for.</p><p>Body text in Public Sans: legible, neutral, with tabular figures (<span class='dn-num'>₦ 1,250,000</span>) and the Naira sign.</p><p class='dn-caption'>Zuma Rock, Niger State</p></div>
<div><p class='dn-label'>Actions</p><p style='display:flex;gap:12px;flex-wrap:wrap'><a class='dn-btn' href='#'>Primary action</a><a class='dn-btn dn-btn--secondary' href='#'>Secondary</a></p>
<p><a class='dn-link' href='#'>Text link</a></p><div class='dn-band' style='padding:24px'><a class='dn-btn dn-btn--sun' href='#'>Sun action on Forest</a><p class='dn-caption' style='margin-top:12px'>Sun Gold buttons appear only on Forest, once per view.</p></div>
<p class='dn-label' style='margin-top:36px'>Notices</p><div class='dn-notice'>Applications open on the date confirmed by the organiser.</div><div class='dn-notice dn-notice--error'>We couldn’t send your message. Check the email address and try again.</div></div></section>
<section class='two'><div><p class='dn-label'>Figure</p>{ph('zuma-rock', od)}</div>
<div><p class='dn-label'>Form</p><div class='dn-field'><label class='dn-label-field' for='n'>Full name</label><input class='dn-input' id='n' value='Eddie Madaki'></div>
<div class='dn-field dn-field--error'><label class='dn-label-field' for='e'>Email</label><input class='dn-input' id='e' value='eddiemadaki@' aria-invalid='true' aria-describedby='ee'><span class='dn-error' id='ee'>Enter a complete email address, like name@example.com.</span></div>
<div class='dn-field'><label class='dn-label-field' for='m'>Message</label><textarea class='dn-input' id='m' rows='3'>I would like to discuss an investment enquiry.</textarea><span class='dn-help'>We reply within two working days.</span></div><a class='dn-btn' href='#'>Send message</a></div></section>
<section><p class='dn-label'>Table</p><table class='dn-table'><thead><tr><th>Project</th><th>State</th><th>Stage</th><th class='n'>Investment sought (₦ m)</th></tr></thead>
<tbody><tr><td>[Project name]</td><td>[State]</td><td>[Stage]</td><td class='n'>000.0</td></tr><tr><td>[Project name]</td><td>[State]</td><td>[Stage]</td><td class='n'>000.0</td></tr><tr><td>[Project name]</td><td>[State]</td><td>[Stage]</td><td class='n'>000.0</td></tr></tbody></table></section>
<section><p class='dn-label'>Columns, not cards</p><div class='dn-cols' style='--n:3'><div><h3 class='dn-h2'>Experience</h3><p>Hairline above, no box, no shadow.</p></div><div><h3 class='dn-h2'>Invest</h3><p>Three columns only when there are three equal ideas.</p></div><div><h3 class='dn-h2'>Explore</h3><p>Otherwise use two, or one.</p></div></div></section>
</div></body></html>"""
    out = od / "DN_components.html"
    out.write_text(html, encoding="utf-8")
    jobs.append(job(out, od / "DN_components_preview.png", 1440, 900, 1, fullPage=True, wait=400))


def og():
    od = W / "og" / "source"
    w, h = 1200, 630
    body = img("zuma-rock", od, 0, 0, 760, h)
    body += f'<div style="position:absolute;left:760px;top:0;width:440px;height:{h}px;background:var(--ivory)"></div>'
    body += f'<div class="logo" style="position:absolute;left:810px;top:60px;width:220px">{logo_svg("fullcolour")}</div>'
    body += f'<div class="disp" style="position:absolute;left:806px;top:300px;width:350px;font-size:54px;line-height:1.02">Nigeria, one place at a time.</div>'
    body += f'<div class="cap" style="position:absolute;left:810px;bottom:56px;font-size:17px;color:var(--stone)">{CONTACT["web"]}</div>'
    src = page(od / "DN_og-cover_1200x630.html", w, h, body, title="Open Graph image")
    jobs.append(job(src, W / "og" / "DN_og-cover_1200x630.jpg", w, h, quality=90))
    jobs.append(job(src, W / "og" / "DN_og-cover_1200x630.png", w, h))


if __name__ == "__main__":
    for sub in ("hero", "og", "components", "homepage", "images"):
        (W / sub).mkdir(parents=True, exist_ok=True)
    images()
    components()
    homepage(1440)
    homepage(390, mobile=True)
    og()
    json.dump(jobs, open(KIT / "16_SOURCE_FILES/build/_jobs/_jobs_web2.json", "w"), indent=1)
    print(len(jobs), "jobs")
