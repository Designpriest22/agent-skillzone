"""Backgrounds v2 → 05_BACKGROUNDS_AND_TEXTURES. Eight grounds, each with a job, built only from the
system's materials: Paper, Forest, the horizon line, the sun, the engraved plates and the photo library.
No gradients, glows, grain, patterns or invented landscapes."""
import json
from brand import C, KIT
from v2 import page, job, plate_svg, img

B = KIT / "05_BACKGROUNDS_AND_TEXTURES"
FORMATS = {"16x9_1920x1080": (1920, 1080), "4x5_1080x1350": (1080, 1350), "9x16_1080x1920": (1080, 1920),
           "A4-portrait": (794, 1123), "A4-landscape": (1123, 794)}
jobs = []


def hz(w, h, frac, color, weight=1.5):
    return f'<div style="position:absolute;left:0;top:{h * frac:.1f}px;width:{w}px;height:0;border-top:{weight}px solid {color}"></div>'


def plate_box(slug, ink, left, top, width, recolor=None, keep_sun=True):
    s = plate_svg(slug, ink, True, keep_sun)
    if recolor:
        s = s.replace(C[ink], recolor)
    return f'<div class="plate" style="position:absolute;left:{left:.1f}px;top:{top:.1f}px;width:{width:.1f}px">{s}</div>'


def g01(w, h, od):   # minimal corporate, light: Paper and one hairline horizon
    return f'<div style="position:absolute;inset:0;background:var(--ivory)"></div>' + hz(w, h, 0.62 if h >= w else 0.66, C["haze"])


def g02(w, h, od):   # minimal corporate, dark: Forest and a Ridge horizon
    return f'<div style="position:absolute;inset:0;background:var(--forest)"></div>' + hz(w, h, 0.62 if h >= w else 0.66, C["ridge"])


def g03(w, h, od):   # campaign: the horizon and the sun, the logo's own grammar
    y = 0.6 if h >= w else 0.64
    r = min(w, h) * 0.055
    return (f'<div style="position:absolute;inset:0;background:var(--ivory)"></div>' + hz(w, h, y, C["forest"], 2)
            + f'<div style="position:absolute;left:{w * 0.72 - r:.1f}px;top:{h * y - r * 3.1:.1f}px;width:{2 * r:.1f}px;height:{2 * r:.1f}px;border-radius:50%;background:var(--gold)"></div>')


def g04(w, h, od):   # editorial / premium print: Zuma Rock plate on Paper, low
    pw = w * (1.1 if h >= w else 0.66)
    x, y = ((w - pw) / 2, h - pw * 0.6) if h >= w else (w - pw * 0.97, h - pw * 0.6)
    r = pw * 0.035
    return (f'<div style="position:absolute;inset:0;background:var(--ivory)"></div>' + plate_box("zuma-rock-vignette", "forest", x, y, pw)
            + f'<div style="position:absolute;left:{x + pw * 0.78 - r:.1f}px;top:{y + pw * 0.08:.1f}px;width:{2 * r:.1f}px;height:{2 * r:.1f}px;border-radius:50%;background:var(--gold)"></div>')


def g05(w, h, od):   # premium presentation, dark: Zuma Rock tone-on-tone
    pw = w * (1.25 if h >= w else 0.9)
    return (f'<div style="position:absolute;inset:0;background:var(--forest)"></div>'
            + plate_box("zuma-rock-vignette", "forest", (w - pw) / 2 + (0 if h >= w else w * 0.18), h - pw * 0.6, pw, recolor=C["ridge"], keep_sun=False))


def g06(w, h, od):   # event night: Agbokim plate in Paper ink on Forest, cropped to one side
    if h >= w:
        pw = w * 0.9
        return (f'<div style="position:absolute;inset:0;background:var(--forest)"></div>' + plate_box("agbokim-waterfalls", "ivory", w - pw, 0, pw))
    pw = h / 1.25
    return f'<div style="position:absolute;inset:0;background:var(--forest)"></div>' + plate_box("agbokim-waterfalls", "ivory", w - pw, 0, pw)


def g07(w, h, od):   # photo-led: the horizon composition, photograph above, Paper below
    y = 0.62 if h >= w else 0.66
    return (f'<div style="position:absolute;inset:0;background:var(--ivory)"></div>' + img("zuma-rock", od, 0, 0, w, round(h * y)))


def g08(w, h, od):   # investment / report: high horizon, a narrow photograph band
    y = 0.3 if h >= w else 0.36
    return (f'<div style="position:absolute;inset:0;background:var(--ivory)"></div>' + img("idanre-hills", od, 0, 0, w, round(h * y), focus=(0.45, 0.3)))


GROUNDS = [("01_paper-horizon", g01, "Minimal corporate, light. Paper with a hairline horizon: documents, slides, web sections."),
           ("02_forest-horizon", g02, "Minimal corporate, dark. Forest with a Ridge horizon: section openers, screens, closing slides."),
           ("03_horizon-and-sun", g03, "Campaign. The horizon and the sun, the logo's own grammar: posters, social, campaign slides."),
           ("04_plate-paper", g04, "Editorial and premium print. Zuma Rock engraved plate on Paper: covers, certificates, invitations."),
           ("05_plate-forest", g05, "Premium presentation, dark. Zuma Rock engraved tone-on-tone: openers, stage screens, cards."),
           ("06_plate-night", g06, "Events. Agbokim Waterfalls plate in Paper ink on Forest: stage and holding screens."),
           ("07_photo-horizon", g07, "Photo-led. The horizon composition with Zuma Rock: campaign, web hero, report covers."),
           ("08_report-band", g08, "Investment and reports. A narrow photograph band above a large Paper field.")]


if __name__ == "__main__":
    index = []
    for name, fn, use in GROUNDS:
        for fk, (w, h) in FORMATS.items():
            od = B / name / "source"
            src = page(od / f"DN_bg_{name}_{fk}.html", w, h, fn(w, h, od), title=f"Background {name} {fk}")
            if fk.startswith("A4"):
                pw, ph_ = ("210mm", "297mm") if fk == "A4-portrait" else ("297mm", "210mm")
                jobs.append(job(src, B / name / f"DN_bg_{name}_{fk}.pdf", w, h, format="pdf", pdfW=pw, pdfH=ph_))
                jobs.append(job(src, B / name / f"DN_bg_{name}_{fk}_150dpi.jpg", w, h, scale=1.5625, quality=90))
            else:
                jobs.append(job(src, B / name / f"DN_bg_{name}_{fk}.jpg", w, h, quality=92))
                if fk.startswith("16x9"):
                    jobs.append(job(src, B / name / f"DN_bg_{name}_{fk}.pdf", w, h, format="pdf"))
                    jobs.append(job(src, B / name / f"DN_bg_{name}_3840x2160.jpg", w, h, scale=2, quality=90))
        index.append({"id": name, "use": use})
    json.dump(index, open(B / "DN_backgrounds_index.json", "w"), indent=2)
    json.dump(jobs, open(KIT / "16_SOURCE_FILES/build/_jobs/_jobs_bg2.json", "w"), indent=1)
    (B / "README.md").write_text("# 05 Backgrounds\n\nEight grounds, each with a job, made only from the system's own materials: Paper, Forest, the horizon line, the sun, the engraved plates and the photo library. "
                                 "There are no gradients, glows, grain, patterns or invented landscapes.\n\n| Ground | Use |\n|---|---|\n"
                                 + "".join(f"| `{g['id']}` | {g['use']} |\n" for g in index)
                                 + "\nEach folder holds 16:9 (1920 × 1080 JPG, a vector PDF and a 3840 × 2160 JPG), 4:5 and 9:16 JPGs, and A4 portrait and landscape (vector PDF plus a 150 dpi JPG for Office backgrounds). "
                                   "The HTML sources are in `source/`. Plates stay vector in the PDFs.\n\n"
                                   "Photo-led grounds use client-supplied images. Confirm each image's licence before publication (see `06/SOURCE_RECORDS/image-register.csv`).\n")
    print(len(jobs), "jobs")
