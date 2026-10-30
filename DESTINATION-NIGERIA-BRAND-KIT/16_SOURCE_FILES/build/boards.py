"""Presentation boards → 15_MOCKUPS. Honest, flat presentations of the real deliverables.

v1's CSS 'device' mockups are retired: they imitated photographs of laptops, phones and stages and did
not convince. These boards show the actual rendered artwork, labelled as flat artwork, on Paper or Ink.
"""
import json
import subprocess
from html import escape
from pathlib import Path
from brand import C, KIT
from v2 import page, job, logo_svg, rel

M = KIT / "15_MOCKUPS"
SRC = M / "source"
TMP = KIT / "16_SOURCE_FILES/build/_doc_assets/boards"
jobs = []


def pdf_page(pdf, n, name, dpi=110):
    TMP.mkdir(parents=True, exist_ok=True)
    out = TMP / name
    subprocess.run(["pdftocairo", "-png", "-r", str(dpi), "-f", str(n), "-l", str(n), "-singlefile", str(pdf), str(out)], check=True)
    return Path(str(out) + ".png")


def pic(path, x, y, w, h=None, border=True, fit="cover", pos="50% 50%"):
    hh = f"height:{h}px;" if h else ""
    b = f"outline:1px solid {C['haze']};" if border else ""
    return (f'<img src="{rel(path, SRC)}" style="position:absolute;left:{x}px;top:{y}px;width:{w}px;{hh}object-fit:{fit};object-position:{pos};{b}">')


def cap(x, y, text, color=C["stone"], w=600):
    return f'<div class="cap" style="position:absolute;left:{x}px;top:{y}px;width:{w}px;font-size:17px;color:{color}">{escape(text)}</div>'


def frame(title, number, dark=False, note="Flat artwork presentation, not a photograph."):
    bg, fg, sub = (C["charcoal"], C["ivory"], C["sage"]) if dark else (C["ivory"], C["forest"], C["stone"])
    return (f'<div style="position:absolute;inset:0;background:{bg}"></div>'
            f'<div class="label" style="position:absolute;left:96px;top:72px;font-size:16px;color:{sub}">Board {number:02d}</div>'
            f'<div class="disp" style="position:absolute;left:94px;top:100px;font-size:52px;color:{fg}">{escape(title)}</div>'
            f'<div class="cap" style="position:absolute;right:96px;top:80px;font-size:16px;color:{sub}">{note}</div>'
            f'<div class="logo" style="position:absolute;right:96px;bottom:56px;width:130px">{logo_svg("reversed" if dark else "fullcolour")}</div>')


def board(n, name, title, body, dark=False):
    w, h = 2400, 1600
    src = page(SRC / f"DN_board_{n:02d}_{name}.html", w, h, frame(title, n, dark) + body, title=title)
    jobs.append(job(src, M / f"DN_board_{n:02d}_{name}.jpg", w, h, quality=90))


def main():
    D9, D10 = KIT / "09_DOCUMENT_TEMPLATES", KIT / "10_PRESENTATION_TEMPLATES/DN_Presentation-Template_16x9.pdf"
    # 1 stationery and documents
    letter = pdf_page(D9 / "LETTERHEAD/DN_Letter_Formal-Correspondence_A4.pdf", 1, "letter")
    report = pdf_page(D9 / "REPORTS/DN_Report_Template_A4.pdf", 1, "report")
    prop = pdf_page(D9 / "PROPOSALS/DN_Proposal-Concept-Note_Template_A4.pdf", 1, "proposal")
    summ = pdf_page(D9 / "REPORTS/DN_Report_Template_A4.pdf", 3, "summary")
    BC = D9 / "BUSINESS_CARDS/PNG_300dpi"
    pw, ph_ = 430, 608
    body = ""
    for i, (p, c) in enumerate([(report, "Report cover"), (summ, "Report: executive summary"), (prop, "Proposal cover (plate composition)"), (letter, "Formal letter")]):
        x = 96 + i * (pw + 40)
        body += pic(p, x, 240, pw, ph_) + cap(x, 240 + ph_ + 14, c)
    body += pic(BC / "DN_business-card_front_300dpi.png", 96, 1010, 420, 272) + cap(96, 1296, "Business card, front")
    body += pic(BC / "DN_business-card_back_eddie-madaki_300dpi.png", 556, 1010, 420, 272) + cap(556, 1296, "Business card, back")
    body += pic(KIT / "09_DOCUMENT_TEMPLATES/EMAIL_SIGNATURE/DN_email-signature_general_preview.png", 1016, 1010, 520, 200) + cap(1016, 1224, "Email signature")
    board(1, "documents-and-stationery", "Documents and stationery", body)
    # 2 presentation
    body = cap(96, 176, "PowerPoint template: 19 layouts on a real slide master. Nine of the sixteen sample slides.", C["sage"], 1500)
    sw, sh = 680, 383
    for i, n in enumerate([1, 2, 4, 6, 8, 10, 11, 13, 16]):
        p = pdf_page(D10, n, f"slide{n}", 80)
        body += pic(p, 96 + (i % 3) * (sw + 40), 236 + (i // 3) * (sh + 34), sw, sh)
    board(2, "presentation", "Presentation", body, dark=True)
    # 3 social
    S = KIT / "11_SOCIAL_MEDIA_TEMPLATES"
    body = ""
    for i, k in enumerate(["place", "plate", "statement", "invest", "figure", "explore-grid", "contact"]):
        x = 96 + i * 316
        body += pic(S / k / f"DN_social_{k}_4x5_1080x1350.png", x, 260, 290, 362)
    for i, k in enumerate(["place", "plate", "invest", "contact"]):
        x = 96 + i * 300
        body += pic(S / k / f"DN_social_{k}_9x16_1080x1920.png", x, 700, 270, 480)
    body += pic(S / "statement" / "DN_social_statement_16x9_1200x675.png", 1330, 700, 520, 292)
    body += pic(S / "figure" / "DN_social_figure_16x9_1200x675.png", 1330, 1020, 520, 292)
    body += cap(96, 1210, "Seven compositions, each with a purpose. Four formats each.", C["stone"], 1100)
    board(3, "social", "Social", body)
    # 4 web
    W = KIT / "12_WEBSITE_ASSETS/homepage"
    body = pic(W / "DN_homepage_desktop.png", 96, 240, 1400, 1180, pos="50% 0%")
    body += pic(W / "DN_homepage_mobile.png", 1560, 240, 330, 1180, pos="50% 0%")
    body += pic(W / "DN_homepage_mobile.png", 1930, 240, 330, 1180, pos="50% 38%")
    body += cap(96, 1440, "Homepage design, desktop 1440 px and mobile 390 px, built with the v2 components. Full-page renders are in 12_WEBSITE_ASSETS/homepage.")
    board(4, "website", "Website", body)
    # 5 events
    E = KIT / "13_EVENT_AND_SIGNAGE"
    body = pic(E / "_previews/DN_roll-up_850x2000mm.png", 96, 240, 290, 716, border=False)
    body += pic(E / "_previews/DN_wayfinding_A2.png", 426, 240, 360, 509, border=False)
    body += pic(E / "holding-slide/DN_stage-screen_1920x1080.png", 826, 240, 1000, 563)
    body += pic(E / "_previews/DN_name-badge_A6.png", 1866, 240, 300, 423)
    body += pic(E / "_previews/DN_invitation_5x7in.png", 826, 840, 380, 526, border=False)
    body += pic(E / "_previews/DN_event-programme_A5_cover.png", 1246, 840, 380, 533)
    body += pic(E / "_previews/DN_media-wall_3000x2400mm.png", 1666, 840, 500, 400, border=False)
    body += cap(96, 980, "Roll-up 850 × 2000 mm, wayfinding A2, stage screen, badge A6, invitation 5 × 7 in, programme A5, media wall.", C["sage"], 700)
    board(5, "events-and-signage", "Events and signage", body, dark=True)
    # 6 materials: plates and photography
    P = KIT / "04_VECTOR_GRAPHICS_AND_ICONS/ENGRAVED_PLATES/PNG"
    L = KIT / "06_PHOTOGRAPHY_AND_MEDIA/LIBRARY"
    body = pic(P / "DN_plate_zuma-rock_forest.png", 96, 240, 900, 563) + cap(96, 816, "Pl. 01  Zuma Rock, Niger State: engraved plate, vector")
    body += pic(P / "DN_plate_agbokim-waterfalls_forest.png", 1036, 240, 450, 563) + cap(1036, 816, "Pl. 02  Agbokim Waterfalls, Cross River State")
    body += pic(L / "DN_photo_zuma-rock.jpg", 1526, 240, 780, 520) + cap(1526, 774, "The photograph Pl. 01 was traced from (graded)")
    for i, s in enumerate(["agbokim-waterfalls", "idanre-hills", "obudu-road", "lekki-ikoyi-bridge", "bowers-tower", "tarkwa-bay"]):
        x = 96 + i * 370
        body += pic(L / f"DN_photo_{s}.jpg", x, 900, 340, 255)
    body += cap(96, 1170, "Photography: client-supplied images, verified, graded and captioned. Licences to be confirmed before publication (see the image register).", C["stone"], 1500)
    board(6, "plates-and-photography", "Plates and photography", body)
    json.dump(jobs, open(KIT / "16_SOURCE_FILES/build/_jobs/_jobs_boards.json", "w"), indent=1)
    (M / "README.md").write_text("# 15 Presentation boards\n\nSix flat boards show the real v2 deliverables side by side: documents and stationery, presentation, social, website, events and signage, and plates and photography. "
                                 "Each board is labelled as a flat artwork presentation.\n\n"
                                 "The v1 'device' mockups (CSS laptops, phones, lanyards and stages) are retired: they imitated photographs and did not convince. "
                                 "For photographic mockups, place the PDFs in licensed mockup scenes (Smart Objects) and record the scene licence.\n")
    print(len(jobs), "jobs")


if __name__ == "__main__":
    main()
