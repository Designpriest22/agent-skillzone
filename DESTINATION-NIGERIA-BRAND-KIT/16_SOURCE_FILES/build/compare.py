"""Before/after comparison sheets → 18_QA_AND_HANDOVER/creative-audit/after and compare/."""
import glob
from PIL import Image, ImageDraw, ImageFont
from brand import KIT

CA = KIT / "18_QA_AND_HANDOVER/creative-audit"
AF, CP = CA / "after", CA / "compare"
AF.mkdir(exist_ok=True)
CP.mkdir(exist_ok=True)
F = str(KIT / "03_COLOR_AND_TYPOGRAPHY/fonts_v2/static/PublicSans-SemiBold.ttf")
FD = str(KIT / "03_COLOR_AND_TYPOGRAPHY/fonts_v2/static/NewsreaderDisplay-Regular.ttf")


def sheet(paths, cols, cell, name, bg="#5F6662"):
    ims = []
    for p in paths:
        im = Image.open(p).convert("RGB")
        im.thumbnail(cell)
        ims.append(im)
    rows = (len(ims) + cols - 1) // cols
    W = cols * (cell[0] + 16) + 16
    H = rows * (cell[1] + 16) + 16
    s = Image.new("RGB", (W, H), bg)
    for i, im in enumerate(ims):
        x = 16 + (i % cols) * (cell[0] + 16) + (cell[0] - im.width) // 2
        y = 16 + (i // cols) * (cell[1] + 16) + (cell[1] - im.height) // 2
        s.paste(im, (x, y))
    s.save(AF / name, quality=88)
    return AF / name


def compare(before, after, title, name):
    b, a = Image.open(before).convert("RGB"), Image.open(after).convert("RGB")
    h = 900
    b = b.resize((int(b.width * h / b.height), h))
    a = a.resize((int(a.width * h / a.height), h))
    W = b.width + a.width + 120
    s = Image.new("RGB", (W, h + 170), "#F5F0E6")
    d = ImageDraw.Draw(s)
    d.text((40, 30), title, font=ImageFont.truetype(FD, 52), fill="#103428")
    d.text((40, 120), "BEFORE (v1.1)", font=ImageFont.truetype(F, 22), fill="#5F6662")
    d.text((b.width + 80, 120), "AFTER (v2.0)", font=ImageFont.truetype(F, 22), fill="#8A5A0C")
    s.paste(b, (40, 155))
    s.paste(a, (b.width + 80, 155))
    s.save(CP / name, quality=86)


K = KIT
after = {
    "social": sheet(sorted(glob.glob(str(K / "11_SOCIAL_MEDIA_TEMPLATES/*/DN_social_*_4x5_1080x1350.png"))), 7, (360, 450), "after_social.jpg"),
    "backgrounds": sheet(sorted(glob.glob(str(K / "05_BACKGROUNDS_AND_TEXTURES/*/DN_bg_*_16x9_1920x1080.jpg"))), 4, (480, 270), "after_backgrounds.jpg"),
    "documents": K / "15_MOCKUPS/DN_board_01_documents-and-stationery.jpg",
    "slides": K / "15_MOCKUPS/DN_board_02_presentation.jpg",
    "events": K / "15_MOCKUPS/DN_board_05_events-and-signage.jpg",
    "mockups": sheet(sorted(glob.glob(str(K / "15_MOCKUPS/DN_board_*.jpg"))), 3, (600, 400), "after_boards.jpg"),
    "graphics": K / "15_MOCKUPS/DN_board_06_plates-and-photography.jpg",
    "intro_storyboard": K / "07_MOTION_IDENTITY/BRAND_FILM_25s/DN_brand-film-25s_storyboard_16x9.jpg",
    "web": sheet([K / "12_WEBSITE_ASSETS/homepage/DN_homepage_desktop.png"], 1, (720, 1750), "after_web.jpg"),
}
titles = {"social": "Social", "backgrounds": "Backgrounds", "documents": "Documents", "slides": "Presentation", "events": "Events",
          "mockups": "Mockups → presentation boards", "graphics": "Graphics → plates and photography", "intro_storyboard": "Intro film", "web": "Website"}
for k, a in after.items():
    b = glob.glob(str(CA / "before" / f"before_{k}.*"))[0]
    compare(b, a, titles[k], f"compare_{k}.jpg")
print("done")
