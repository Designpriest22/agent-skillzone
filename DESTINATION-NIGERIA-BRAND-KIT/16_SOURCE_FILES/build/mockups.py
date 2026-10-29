"""Presentation mockups → 15_MOCKUPS.

Scenes are HTML/CSS compositions (one light source, top-left) that place the kit's REAL exported artwork.
They are for visualisation only; the editable artwork lives in its own folders.
"""
import json
from brand import *

M = KIT / "15_MOCKUPS"
SRC = "_sources/"
R = "../"  # from 15_MOCKUPS/_scenes to kit root is ../../
jobs = []
NOISE = ("url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' "
         "baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .08 0'/></filter><rect width='240' height='240' filter='url(%23n)'/></svg>\")")
BASE_CSS = f"""
*{{box-sizing:border-box}} html,body{{margin:0;width:1920px;height:1200px;overflow:hidden;font-family:Inter,Arial,sans-serif}}
.scene{{position:relative;width:1920px;height:1200px;overflow:hidden}}
.surface{{position:absolute;inset:0}}
.grain{{position:absolute;inset:0;background:{NOISE};mix-blend-mode:multiply;pointer-events:none}}
.light{{position:absolute;inset:0;background:radial-gradient(120% 90% at 18% 8%,rgba(255,255,255,.28),rgba(255,255,255,0) 55%),radial-gradient(90% 80% at 90% 100%,rgba(0,0,0,.22),rgba(0,0,0,0) 60%);pointer-events:none}}
.obj{{position:absolute;transform-origin:center}}
.paper{{background:#fff;box-shadow:0 1px 1px rgba(0,0,0,.08),2px 6px 10px rgba(0,0,0,.12),14px 28px 50px rgba(0,0,0,.18)}}
.paper img,.obj>img{{display:block;width:100%;height:100%;object-fit:cover}}
.sheen::after{{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.18),rgba(255,255,255,0) 40%,rgba(0,0,0,.05));pointer-events:none}}
.cap{{position:absolute;left:64px;bottom:44px;font:600 13px Inter;letter-spacing:.22em;text-transform:uppercase;opacity:.75}}
"""


def scene(name, bg, inner, cap="", cap_color="#103428", title=""):
    html = (f"<!doctype html><html><head><meta charset='utf-8'><title>{title or name}</title><style>{BASE_CSS}</style></head><body>"
            f"<div class='scene'><div class='surface' style=\"background:{bg}\"></div><div class='grain'></div>{inner}<div class='light'></div>"
            f"<div class='cap' style='color:{cap_color}'>{cap}</div></div></body></html>")
    p = M / "_scenes" / f"{name}.html"
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(html)
    jobs.append(dict(src=str(p), out=str(M / f"DN_mockup_{name}.jpg"), w=1920, h=1200, scale=1.25, quality=90, wait=300))


def o(x, y, w, h, img, rot=0, cls="paper sheen", extra=""):
    return (f"<div class='obj {cls}' style='left:{x}px;top:{y}px;width:{w}px;height:{h}px;transform:rotate({rot}deg);{extra}'>"
            f"<img src='{img}'></div>")


K = "../../"
P = K + "02_LOGO_MASTER_FILES/PNG/"
CARD = K + "09_DOCUMENT_TEMPLATES/BUSINESS_CARDS/PNG_300dpi/"
S = "../" + SRC
SOC = K + "11_SOCIAL_MEDIA_TEMPLATES/"
EV = K + "13_EVENT_AND_SIGNAGE/_previews/"


def build():
    linen = f"linear-gradient(160deg,{C['haze']},#D9CFBC)"
    # 1 stationery
    scene("01_stationery-flatlay", linen,
          o(260, 120, 640, 905, S + "letter.png", -4) + o(820, 210, 640, 905, S + "memo.png", 3)
          + o(1290, 640, 425, 275, CARD + "DN_business-card_standard_front_300dpi.png", -9, "paper")
          + o(1360, 840, 425, 275, CARD + "DN_business-card_standard_back_300dpi.png", 6, "paper")
          + "<div class='obj' style='left:120px;top:880px;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#2C5040,#0d2a20);box-shadow:10px 20px 30px rgba(0,0,0,.3)'></div>",
          "Official correspondence · Letterhead · Memo · Business cards")
    # 2 business cards close-up
    scene("02_business-cards", f"linear-gradient(140deg,{C['forest']},#0A231B)",
          o(300, 260, 680, 440, CARD + "DN_business-card_premium_front_300dpi.png", -8, "paper")
          + o(860, 470, 680, 440, CARD + "DN_business-card_premium_back_300dpi.png", 5, "paper")
          + o(520, 760, 520, 336, CARD + "DN_business-card_standard_front_300dpi.png", 14, "paper"),
          "Business cards · standard and premium (gold foil sun)", C["sage"])
    # 3 reports
    scene("03_reports-and-proposals", f"linear-gradient(170deg,#E9E2D3,#CFC5B1)",
          o(240, 150, 620, 877, S + "report_cover.png", -6) + o(760, 120, 620, 877, S + "proposal_cover.png", 2)
          + o(1240, 230, 560, 792, S + "report_page.png", 8),
          "Reports · Proposals and concept notes")
    # 4 presentation on display
    scr = lambda img, x, y, w: (f"<div class='obj' style='left:{x}px;top:{y}px;width:{w}px;height:{w * 9 / 16 + 36}px;background:#111;border-radius:22px;padding:18px;"
                                f"box-shadow:0 30px 60px rgba(0,0,0,.45)'><img src='{img}' style='width:100%;height:100%;object-fit:cover;border-radius:6px'></div>")
    scene("04_presentation-screens", f"radial-gradient(120% 100% at 30% 20%,#2a3b34,#121a17)",
          scr(S + "slide_cover.png", 180, 170, 1000)
          + scr(S + "slide_kpi.png", 1060, 520, 700),
          "Presentation template · Cover · Chart layout", C["sage"])
    # 5 digital devices
    phone = lambda img, x, y, w, rot=0: (f"<div class='obj' style='left:{x}px;top:{y}px;width:{w}px;height:{w * 2.05}px;background:#0b0b0b;border-radius:{w * .14}px;padding:{w * .045}px;"
                                         f"transform:rotate({rot}deg);box-shadow:20px 40px 60px rgba(0,0,0,.35)'><img src='{img}' style='width:100%;height:100%;object-fit:cover;border-radius:{w * .1}px'></div>")
    laptop = (f"<div class='obj' style='left:150px;top:150px;width:1160px;height:740px;background:#151515;border-radius:26px 26px 6px 6px;padding:26px;box-shadow:0 40px 70px rgba(0,0,0,.35)'>"
              f"<img src='{K}12_WEBSITE_ASSETS/components/DN_components_preview.png' style='width:100%;height:100%;object-fit:cover;object-position:top'></div>"
              f"<div class='obj' style='left:80px;top:886px;width:1300px;height:34px;background:linear-gradient(#cfcfcf,#9a9a9a);border-radius:0 0 26px 26px;box-shadow:0 20px 40px rgba(0,0,0,.3)'></div>")
    scene("05_digital-devices-and-website", f"linear-gradient(150deg,{C['ivory']},#E3DACA)",
          laptop + phone(SOC + "discover-destination/DN_social_discover-destination_story_1080x1920.png", 1380, 240, 300, 4)
          + phone(SOC + "investment-opportunity/DN_social_investment-opportunity_story_1080x1920.png", 1560, 330, 260, 10),
          "Website hero and components · Social stories")
    # 6 social grid
    tiles = ["discover-destination", "experience-culture", "national-tourism-week", "industry-insight", "meet-partner", "investment-opportunity"]
    inner = "".join(o(280 + (i % 3) * 470, 130 + (i // 3) * 480, 440, 440, SOC + f"{t}/DN_social_{t}_square_1080x1080.png", 0, "paper") for i, t in enumerate(tiles))
    scene("06_social-media-system", f"linear-gradient(160deg,#EFE8DA,#DCD2BE)", inner, "Social template family")
    # 7 event stage
    stage = (f"<div class='obj' style='left:240px;top:120px;width:1440px;height:810px;box-shadow:0 0 120px rgba(232,164,50,.25),0 0 0 14px #050807'>"
             f"<img src='{EV}DN_stage-screen_16x9_3840x2160.png'></div>"
             f"<div class='obj' style='left:-200px;top:960px;width:2320px;height:400px;background:linear-gradient(#0b0f0d,#1b2420);transform:perspective(600px) rotateX(55deg)'></div>"
             f"<div class='obj' style='left:860px;top:820px;width:200px;height:160px;background:linear-gradient(#21302a,#0d1411);border-radius:6px 6px 0 0'></div>"
             f"<img class='obj' src='{P}DN_logo_primary_reversed_1000px.png' style='left:895px;top:850px;width:130px;opacity:.9'>")
    scene("07_event-stage", "radial-gradient(90% 70% at 50% 40%,#16221d,#030504)", stage, "Event stage screen · Lectern", C["sage"])
    # 8 exhibition
    ex = (o(180, 140, 340, 800, EV + "DN_roll-up-banner_850x2000mm.png", 0, "paper") + o(560, 140, 340, 800, EV + "DN_roll-up-banner_850x2000mm.png", 0, "paper")
          + o(960, 260, 820, 410, EV + "DN_exhibition-panel_2000x1000mm.png", 0, "paper")
          + f"<div class='obj' style='left:0;top:940px;width:1920px;height:260px;background:linear-gradient(#bfb4a0,#8f8471)'></div>")
    scene("08_exhibition-stand", f"linear-gradient(#ECE6DA,#D8CFBF)", ex, "Exhibition roll-ups and panel")
    # 9 staff ID
    badge = (f"<div class='obj' style='left:900px;top:-40px;width:40px;height:420px;background:{C['forest']};transform:rotate(8deg)'></div>"
             f"<div class='obj' style='left:780px;top:-40px;width:40px;height:420px;background:{C['forest']};transform:rotate(-8deg)'></div>"
             + o(700, 330, 420, 582, EV + "DN_name-badge_A6.png", -3)
             + o(1250, 420, 420, 582, EV + "DN_name-badge_A6.png", 7))
    scene("09_staff-identification", f"linear-gradient(150deg,#E8E2D6,#CBC1AE)", badge, "Staff and delegate identification")
    # 10 signage
    sign = (f"<div class='obj' style='left:0;top:0;width:1920px;height:900px;background:linear-gradient(90deg,#d8d0c0,#e9e3d7)'></div>"
            f"<div class='obj' style='left:0;top:900px;width:1920px;height:300px;background:linear-gradient(#9c9282,#6e6556)'></div>"
            + o(360, 160, 420, 594, EV + "DN_directional-sign_A2_left.png", 0, "paper") + o(1140, 160, 420, 594, EV + "DN_directional-sign_A2_right.png", 0, "paper")
            + "<div class='obj' style='left:560px;top:754px;width:20px;height:200px;background:#3a3f3c'></div><div class='obj' style='left:1340px;top:754px;width:20px;height:200px;background:#3a3f3c'></div>")
    scene("10_directional-signage", "#ddd", sign, "Directional signage A2")
    # 11 folder (artwork defined inline as SVG, front cover of a presentation folder)
    folder_svg = svg_doc(220, 310, f'<rect width="220" height="310" fill="{C["forest"]}"/>' + roundel_inline(70, 95, 80, "ivory", uid="fd")
                         + logo_inline("reversed", 45, 220, 130), "Presentation folder").replace("\n", "")
    (M / "_sources/folder.svg").write_text(folder_svg)
    fold = (f"<div class='obj paper' style='left:420px;top:150px;width:620px;height:874px;transform:rotate(-5deg);background:{C['forest']}'><img src='../_sources/folder.svg'></div>"
            + o(980, 210, 580, 820, S + "invest.png", 6)
            + f"<div class='obj' style='left:1000px;top:640px;width:600px;height:420px;background:{C['forest']};transform:rotate(6deg);box-shadow:-6px -10px 30px rgba(0,0,0,.25);border-top:3px solid {C['gold']}'></div>")
    scene("11_presentation-folder", linen, fold, "Presentation folder · Investment opportunity profile")
    # 12 brochure / tourism info
    bro = (o(200, 200, 460, 650, SOC + "discover-destination/DN_social_discover-destination_ig-portrait_1080x1350.png", -3)
           + o(640, 200, 460, 650, K + "04_VECTOR_GRAPHICS_AND_ICONS/_previews/maps/DN_map_nigeria_routes_light.png", 0, "paper", "object-fit:contain;background:#F5F0E6")
           + o(1080, 200, 460, 650, SOC + "experience-culture/DN_social_experience-culture_ig-portrait_1080x1350.png", 3)
           + o(1380, 640, 400, 566, S + "factsheet.png", 10))
    scene("12_tourism-brochure-and-info", f"linear-gradient(160deg,{C['savannah']},#BDA77C)", bro, "Tri-fold brochure · Map · Fact sheet")


if __name__ == "__main__":
    build()
    json.dump(jobs, open(KIT / "16_SOURCE_FILES/build/_jobs/_jobs_mockups.json", "w"), indent=1)
    print(len(jobs))
