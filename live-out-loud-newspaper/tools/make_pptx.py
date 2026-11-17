"""Build the PowerPoint version of the carousel from the 2x page renders.

    node build.mjs && python3 tools/make_pptx.py  -> out/live-out-loud-times.pptx

Each slide is one page, full-bleed at 4:5 (7.5 x 9.375 in). The page's text goes in
the speaker notes so the copy stays searchable and easy to lift.
"""
import json
from pathlib import Path
from pptx import Presentation
from pptx.util import Inches

ROOT = Path(__file__).parent.parent
HI = ROOT / "out" / "hires"
TITLES = ["Cover", "Live Experience", "Festival Essentials", "The Big Wiz Word Hunt"]

prs = Presentation()
prs.slide_width, prs.slide_height = Inches(7.5), Inches(9.375)
blank = prs.slide_layouts[6]
text = json.loads((HI / "text.json").read_text())
for i, title in enumerate(TITLES, start=1):
    slide = prs.slides.add_slide(blank)
    pic = slide.shapes.add_picture(str(HI / f"page-{i}@2x.png"), 0, 0, width=prs.slide_width, height=prs.slide_height)
    pic.name = f"Page {i}: {title}"
    slide.notes_slide.notes_text_frame.text = f"Page {i}: {title}\n\n" + text[i - 1]
prs.core_properties.title = "The Live Out Loud Times"
prs.core_properties.subject = "Live Out Loud Music Festival · Wizkid · 13 Dec 2026 · Eagle Square, Abuja · wizkid.tix.africa"
out = ROOT / "out" / "live-out-loud-times.pptx"
prs.save(out)
print("wrote", out)
