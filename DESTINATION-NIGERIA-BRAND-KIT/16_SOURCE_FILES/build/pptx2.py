"""PowerPoint v2 → 10_PRESENTATION_TEMPLATES. Information-first layouts on a real slide master.

Theme fonts: Newsreader Display (headings) and Public Sans (body), both free from Google Fonts.
Layouts are built for the work a tourism-development body actually presents: summaries,
findings, data, timelines, investment cases, partnership proposals, financials, recommendations.
The sample deck shows each layout in use. Its figures are illustrative and labelled as such.
"""
import re
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.chart.data import CategoryChartData
from pptx.enum.chart import XL_CHART_TYPE, XL_LEGEND_POSITION, XL_LABEL_POSITION
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.oxml import parse_xml
from pptx.opc.constants import RELATIONSHIP_TYPE as RT
from brand import C, KIT, LOGO_W, LOGO_H, CONTACT, PHOTOS, photo
import pptx_build as pb
pb.BULLET = H(C["forest"]) if False else C["forest"].lstrip("#").upper()
from pptx_build import ph, rect, text, pic, slide_number, add_layout, NSP, SW, SH, H, fill, picfill

OUT = KIT / "10_PRESENTATION_TEMPLATES"
LOGO = KIT / "02_LOGO_MASTER_FILES/PNG/DN_logo_primary_fullcolour_1000px.png"
LOGO_R = KIT / "02_LOGO_MASTER_FILES/PNG/DN_logo_primary_reversed_1000px.png"
PLATES = KIT / "04_VECTOR_GRAPHICS_AND_ICONS/ENGRAVED_PLATES/PNG"
F, P, S, G = C["forest"], C["ivory"], C["stone"], C["golddeep"]
M = 0.75          # outer margin (in)
TOP = 0.62        # label line
TT = 0.95         # title top


def set_theme(prs):
    master = prs.slide_master
    tp = master.part.part_related_by(RT.THEME)
    xml = tp.blob.decode("utf-8")
    clr = {"dk1": C["charcoal"], "lt1": "#FFFFFF", "dk2": C["forest"], "lt2": C["ivory"], "accent1": C["forest"],
           "accent2": C["ridge"], "accent3": C["sage"], "accent4": C["golddeep"], "accent5": C["gold"], "accent6": C["stone"],
           "hlink": C["forest"], "folHlink": C["stone"]}
    for k, v in clr.items():
        xml = re.sub(rf"<a:{k}>.*?</a:{k}>", f'<a:{k}><a:srgbClr val="{H(v)}"/></a:{k}>', xml, flags=re.S)
    xml = re.sub(r'<a:clrScheme name="[^"]*"', '<a:clrScheme name="Destination Nigeria v2"', xml)
    xml = re.sub(r'<a:majorFont><a:latin typeface="[^"]*"', '<a:majorFont><a:latin typeface="Newsreader Display"', xml)
    xml = re.sub(r'<a:minorFont><a:latin typeface="[^"]*"', '<a:minorFont><a:latin typeface="Public Sans"', xml)
    xml = re.sub(r'<a:fontScheme name="[^"]*"', '<a:fontScheme name="Destination Nigeria v2"', xml)
    tp._blob = xml.encode("utf-8")
    m = master._element
    csld = m.find("{http://schemas.openxmlformats.org/presentationml/2006/main}cSld")
    old = csld.find("{http://schemas.openxmlformats.org/presentationml/2006/main}bg")
    if old is not None:
        csld.remove(old)
    csld.insert(0, parse_xml(f'<p:bg {NSP}><p:bgPr><a:solidFill><a:srgbClr val="{H(P)}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>'))
    for path, colr in [(".//p:titleStyle//a:lvl1pPr/a:defRPr", F), (".//p:bodyStyle//a:defRPr", C["charcoal"])]:
        for el in m.xpath(path):
            for f in el.findall("{http://schemas.openxmlformats.org/drawingml/2006/main}solidFill"):
                el.remove(f)
            el.insert(0, parse_xml(f'<a:solidFill {NSP}><a:srgbClr val="{H(colr)}"/></a:solidFill>'))


def hair(x, y, w, col=C["haze"], t=0.012):
    return rect(x, y, w, t, col)


def label(x, y, w, prompt, idx=20, col=G):
    return ph("body", idx, x, y, w, .26, prompt, size=10, color=col, bold=True, caps=True, spc=80, name="Label")


def title(y=TT, w=SW - 2 * M, prompt="Write the slide's conclusion as its title", size=32, col=F, h=1.05):
    return ph("title", 0, M, y, w, h, prompt, "mj", size, col, anchor="t")


def source(prompt="Source: [publisher, title, year]", y=6.55, col=S, w=8.5):
    return ph("body", 30, M, y, w, .25, prompt, size=9, color=col, name="Source")


def footer(img, dark=False):
    lr = img(LOGO_R if dark else LOGO)
    lw = 1.0
    return [pic(lr, M, 6.92, lw, lw * LOGO_H / LOGO_W, "Footer logo"),
            slide_number(SW - M - .6, 6.97, .6, .26, C["sage"] if dark else S)]


def build_layouts(prs):
    for l in list(prs.slide_layouts):
        prs.slide_layouts.remove(l)
    L = {}
    A = lambda name, bg, fn, dark=False, foot=True: add_layout(
        prs, name, bg, lambda img: fn(img) + (footer(img, dark) if foot else []), footer=False)

    L["cover_photo"] = A("01 Cover: photograph", P, lambda img: [
        ph("pic", 13, 0, 0, SW, 4.7, "Insert a photograph from 06/LIBRARY (place it, then caption it)"),
        ph("body", 31, M, 4.82, 6, .25, "Place, State", size=9, color=S, name="Photo caption"),
        title(5.25, 8.6, "Presentation title", 40, h=1.2),
        ph("body", 1, M, 6.55, 7.5, .35, "Audience  ·  Presenter  ·  Date", size=13, color=S),
        pic(img(LOGO), SW - M - 2.1, 5.45, 2.1, 2.1 * LOGO_H / LOGO_W, "Logo")], foot=False)
    L["cover_plate"] = A("02 Cover: engraved plate", P, lambda img: [
        pic(img(PLATES / "DN_plate_zuma-rock_forest_transparent_2x.png"), 6.35, .75, 6.25, 6.25 * 1000 / 1600, "Plate: Zuma Rock"),
        text(6.35, .75 + 6.25 * 1000 / 1600 + .12, 6.25, .25, "Pl. 01  Zuma Rock, Niger State", 9, S),
        pic(img(LOGO), M, .7, 2.0, 2.0 * LOGO_H / LOGO_W, "Logo"),
        title(2.6, 5.2, "Presentation title", 40, h=2.2),
        ph("body", 1, M, 5.15, 5.2, .9, "Audience  ·  Presenter  ·  Date", size=13, color=S)], foot=False)
    L["section"] = A("03 Section opener", F, lambda img: [
        ph("body", 1, M, 1.2, 3, 1.4, "01", "mj", 88, C["sage"], name="Section number"),
        hair(M, 3.25, SW - 2 * M, C["ridge"]),
        title(3.5, 9.5, "Section title", 44, C["ivory"], 1.2),
        ph("body", 2, M, 4.85, 7.5, .9, "One sentence on what this section answers.", "mj", 20, C["sage"])], dark=True)
    L["exec"] = A("04 Executive summary", P, lambda img: [
        label(M, TOP, 6, "Executive summary"),
        title(prompt="The single most important conclusion, in one sentence"),
        ph("body", 1, M, 2.35, 5.4, 3.9, "Two or three sentences that a reader could act on if they read nothing else.", "mj", 20, F),
        hair(6.85, 2.4, 5.73), ph("body", 21, 6.85, 2.55, .5, .4, "1", "mj", 22, G, name="Point number"),
        ph("body", 22, 7.45, 2.6, 5.1, .9, "First supporting point with its evidence.", size=13),
        hair(6.85, 3.75, 5.73), ph("body", 23, 6.85, 3.9, .5, .4, "2", "mj", 22, G, name="Point number"),
        ph("body", 24, 7.45, 3.95, 5.1, .9, "Second supporting point with its evidence.", size=13),
        hair(6.85, 5.1, 5.73), ph("body", 25, 6.85, 5.25, .5, .4, "3", "mj", 22, G, name="Point number"),
        ph("body", 26, 7.45, 5.3, 5.1, .9, "Third supporting point with its evidence.", size=13)])
    L["content"] = A("05 Title and content", P, lambda img: [
        label(M, TOP, 6, "Section"), title(),
        ph("body", 1, M, 2.3, 8.2, 4.1, "Text. Keep to one idea per slide.", size=16, bullet=True)])
    L["two"] = A("06 Two columns: strategy", P, lambda img: [
        label(M, TOP, 6, "Strategy"), title(),
        hair(M, 2.3, 5.6), ph("body", 21, M, 2.45, 5.6, .4, "First pillar", size=15, color=F, bold=True),
        ph("body", 1, M, 2.95, 5.6, 3.4, "What it means and what we will do.", size=14, bullet=True),
        hair(6.98, 2.3, 5.6), ph("body", 22, 6.98, 2.45, 5.6, .4, "Second pillar", size=15, color=F, bold=True),
        ph("body", 2, 6.98, 2.95, 5.6, 3.4, "What it means and what we will do.", size=14, bullet=True)])
    L["finding"] = A("07 Research finding", P, lambda img: [
        label(M, TOP, 6, "Finding"), title(prompt="State the finding as the title"),
        ph("chart", 13, M, 2.3, 7.4, 4.05, "Insert chart or image"),
        hair(8.75, 2.3, 3.83), ph("body", 21, 8.75, 2.45, 3.83, .35, "What the data shows", size=11, color=G, bold=True, caps=True, spc=80),
        ph("body", 1, 8.75, 2.9, 3.83, 3.3, "Two or three sentences of interpretation. Note sample size and method.", size=13),
        source()])
    L["chart"] = A("08 Data: full-width chart", P, lambda img: [
        label(M, TOP, 6, "Data"), title(prompt="Say what the chart proves"),
        ph("chart", 13, M, 2.25, SW - 2 * M, 4.1, "Insert chart"), source()])
    L["figures"] = A("09 Key figures", P, lambda img: [
        label(M, TOP, 6, "In figures"), title(prompt="What these figures mean together"),
        *sum([[hair(M + i * 4.0, 2.6, 3.6), ph("body", 21 + i, M + i * 4.0, 2.75, 3.6, 1.3, "000", "mj", 60, F, name="Figure"),
               ph("body", 24 + i, M + i * 4.0, 4.1, 3.6, .4, "Unit or label", size=13, color=F, bold=True),
               ph("body", 27 + i, M + i * 4.0, 4.55, 3.4, 1.0, "One line of context and the period it covers.", size=11, color=S)]
              for i in range(3)], []),
        source()])
    L["timeline"] = A("10 Timeline", P, lambda img: [
        label(M, TOP, 6, "Timeline"), title(prompt="What happens, and when"),
        hair(M, 3.35, SW - 2 * M, F, .02),
        *sum([[rect(M + i * 2.4, 3.25, .2, .2, F, geom="ellipse"),
               ph("body", 21 + i, M + i * 2.4, 2.6, 2.2, .4, "Q1 2027", size=12, color=G, bold=True, name="Date"),
               ph("body", 31 + i, M + i * 2.4, 3.75, 2.2, .45, "Milestone", "mj", 18, F, name="Milestone"),
               ph("body", 41 + i, M + i * 2.4, 4.3, 2.15, 1.6, "What is delivered and by whom.", size=11, color=S, name="Detail")]
              for i in range(5)], [])])
    L["invest"] = A("11 Investment opportunity", P, lambda img: [
        ph("pic", 13, 0, 0, 5.2, SH, "Insert a photograph of the site"),
        ph("body", 31, 5.2 + .4, 6.55, 3, .25, "Place, State", size=9, color=S, name="Photo caption"),
        label(5.95, TOP, 6, "Investment opportunity"),
        ph("title", 0, 5.95, TT, 6.6, 1.2, "Project name", "mj", 34, F),
        ph("tbl", 14, 5.95, 2.45, 6.63, 3.0, "Insert table: location, category, stage, size (₦ / US$), land status, contact"),
        ph("body", 1, 5.95, 5.6, 6.6, .8, "Status of approvals and what the investor is asked to do next.", size=12, color=S)], foot=False)
    L["partner"] = A("12 Partnership proposal", P, lambda img: [
        label(M, TOP, 6, "Partnership"), title(prompt="What we propose to do together"),
        hair(M, 2.3, 3.7), ph("body", 21, M, 2.45, 3.7, .35, "Destination Nigeria brings", size=11, color=G, bold=True, caps=True, spc=80),
        ph("body", 1, M, 2.9, 3.7, 3.4, "Commitment", size=13, bullet=True),
        hair(4.82, 2.3, 3.7), ph("body", 22, 4.82, 2.45, 3.7, .35, "The partner brings", size=11, color=G, bold=True, caps=True, spc=80),
        ph("body", 2, 4.82, 2.9, 3.7, 3.4, "Commitment", size=13, bullet=True),
        hair(8.88, 2.3, 3.7), ph("body", 23, 8.88, 2.45, 3.7, .35, "Together we deliver", size=11, color=G, bold=True, caps=True, spc=80),
        ph("body", 3, 8.88, 2.9, 3.7, 3.4, "Outcome and how it is measured", size=13, bullet=True)])
    L["financial"] = A("13 Financial table", P, lambda img: [
        label(M, TOP, 6, "Financials"), title(prompt="The headline number and what drives it"),
        ph("tbl", 14, M, 2.3, SW - 2 * M, 3.9, "Insert table"), source("Figures in ₦ million unless stated. Source: [audited accounts / budget, year]")])
    L["recs"] = A("14 Recommendations", P, lambda img: [
        label(M, TOP, 6, "Recommendations"), title(prompt="What we recommend"),
        *sum([[hair(M + (i % 2) * 5.95, 2.35 + (i // 2) * 2.05, 5.6),
               ph("body", 21 + i, M + (i % 2) * 5.95, 2.5 + (i // 2) * 2.05, .6, .6, str(i + 1), "mj", 30, G, name="Number"),
               ph("body", 31 + i, M + (i % 2) * 5.95 + .75, 2.55 + (i // 2) * 2.05, 4.85, .45, "Recommendation", size=15, color=F, bold=True, name="Recommendation"),
               ph("body", 41 + i, M + (i % 2) * 5.95 + .75, 3.0 + (i // 2) * 2.05, 4.85, 1.1, "Owner, timing and the decision required.", size=12, color=S, name="Detail")]
              for i in range(4)], [])])
    L["quote"] = A("15 Quotation", P, lambda img: [
        ph("body", 1, M, 1.3, 10.5, 3.6, "“A quotation that has been approved by the person who said it.”", "mj", 36, F),
        hair(M, 5.25, 3), ph("body", 2, M, 5.4, 8, .35, "Name", size=13, color=F, bold=True),
        ph("body", 3, M, 5.78, 8, .35, "Role, organisation", size=12, color=S)])
    L["photo"] = A("16 Photograph", F, lambda img: [
        ph("pic", 13, 0, 0, SW, 6.55, "Insert a photograph from 06/LIBRARY"),
        ph("body", 1, M, 6.78, 8.5, .3, "Place, State", size=11, color=C["ivory"], name="Caption"),
        ph("body", 2, M + 8.6, 6.78, SW - 2 * M - 8.6 - .8, .3, "Photo: credit", size=9, color=C["sage"], align="r", name="Credit")], dark=True, foot=False)
    L["closing"] = A("17 Closing and contact", F, lambda img: [
        pic(img(PLATES / "DN_plate_agbokim-waterfalls_ivory_transparent_2x.png"), 8.6, 0, 4.73, 4.73 * 1500 / 1200, "Plate: Agbokim Waterfalls"),
        pic(img(LOGO_R), M, .75, 2.2, 2.2 * LOGO_H / LOGO_W, "Logo"),
        ph("title", 0, M, 2.6, 7.2, 1.0, "Thank you.", "mj", 44, C["ivory"]),
        hair(M, 3.9, 7.2, C["ridge"]),
        text(M, 4.1, 2, .3, "TELEPHONE", 9, C["sage"], True, 80),
        text(M + 2.1, 4.1, 5, .3, CONTACT["phone"], 14, C["ivory"]),
        text(M, 4.5, 2, .3, "GENERAL", 9, C["sage"], True, 80),
        text(M + 2.1, 4.5, 5, .3, CONTACT["email"], 14, C["ivory"]),
        *sum([[text(M, 4.9 + .4 * i, 2, .3, p["name"].upper(), 9, C["sage"], True, 80),
               text(M + 2.1, 4.9 + .4 * i, 5, .3, p["email"], 14, C["ivory"])] for i, p in enumerate(CONTACT["people"])], []),
        text(M, 6.3, 5, .3, CONTACT["web"], 11, C["sage"])], dark=True, foot=False)
    L["titleonly"] = A("18 Title only", P, lambda img: [label(M, TOP, 6, "Section"), title()])
    L["blank"] = A("19 Blank", P, lambda img: [])
    return L


# --------------------------------------------------------------------------- sample deck
def run_fmt(cell, size=11, bold=False, color=C["charcoal"], align=None):
    for p in cell.text_frame.paragraphs:
        if align is not None:
            p.alignment = align
        for r in p.runs:
            r.font.size, r.font.bold, r.font.name = Pt(size), bold, "Public Sans"
            r.font.color.rgb = RGBColor.from_string(H(color))


def style_table(tbl, num_cols=()):
    tblpr = tbl._tbl.tblPr
    for k in ("bandRow", "firstRow"):
        tblpr.set(k, "0")
    sid = tblpr.find("{http://schemas.openxmlformats.org/drawingml/2006/main}tableStyleId")
    if sid is not None:
        sid.text = "{2D5ABB26-0587-4C30-8999-92F81FD0307C}"   # "No Style, No Grid"
    for r, row in enumerate(tbl.rows):
        for c, cell in enumerate(row.cells):
            cell.fill.background()
            cell.margin_left = cell.margin_right = Inches(.06)
            cell.margin_top = cell.margin_bottom = Inches(.07)
            tc = cell._tc.get_or_add_tcPr()
            for tag in ("lnL", "lnR", "lnT", "lnB"):
                for old in tc.findall("{http://schemas.openxmlformats.org/drawingml/2006/main}" + tag):
                    tc.remove(old)
            col = F if r == 0 else C["haze"]
            w = 12700 if r == 0 else 6350
            tc.append(parse_xml(f'<a:lnB {NSP} w="{w}"><a:solidFill><a:srgbClr val="{H(col)}"/></a:solidFill></a:lnB>'))
            run_fmt(cell, 10 if r == 0 else 11, r == 0, F if r == 0 else C["charcoal"],
                    PP_ALIGN.RIGHT if c in num_cols else PP_ALIGN.LEFT)
            if c in num_cols:
                for p in cell.text_frame.paragraphs:
                    for rr in p.runs:
                        rPr = rr._r.get_or_add_rPr()
                        # tabular figures are the font default for Public Sans lining numerals in tables
            if r == 0:
                for p in cell.text_frame.paragraphs:
                    for rr in p.runs:
                        rr.font._rPr.set("cap", "all")
                        rr.font._rPr.set("spc", "60")


def chart_style(ch, colors=(C["forest"], C["sage"], C["golddeep"])):
    ch.font.name, ch.font.size = "Public Sans", Pt(11)
    ch.font.color.rgb = RGBColor.from_string(H(C["charcoal"]))
    for i, s in enumerate(ch.plots[0].series):
        s.format.fill.solid()
        s.format.fill.fore_color.rgb = RGBColor.from_string(H(colors[i % len(colors)]))
        s.format.line.fill.background()
    va = ch.value_axis
    va.has_major_gridlines = True
    va.major_gridlines.format.line.color.rgb = RGBColor.from_string(H(C["haze"]))
    va.format.line.fill.background()
    va.tick_labels.font.color.rgb = RGBColor.from_string(H(S))
    ca = ch.category_axis
    ca.format.line.color.rgb = RGBColor.from_string(H(F))
    ca.tick_labels.font.color.rgb = RGBColor.from_string(H(C["charcoal"]))


def deck(prs, L):
    s = prs.slides.add_slide(L["cover_photo"])
    picfill(s, 13, photo("zuma-rock")); fill(s, 31, PHOTOS["zuma-rock"]["caption"])
    fill(s, 0, "Tourism development in Nigeria: a working presentation template")
    fill(s, 1, "Prepared for partners and investors  ·  Destination Nigeria  ·  2026")

    s = prs.slides.add_slide(L["cover_plate"])
    fill(s, 0, "An alternative cover, set beside an engraved plate")
    fill(s, 1, "Use for formal submissions, board papers and printed decks")

    s = prs.slides.add_slide(L["section"])
    fill(s, 1, "01"); fill(s, 0, "Context"); fill(s, 2, "Where Nigerian tourism stands, and why it matters now.")

    s = prs.slides.add_slide(L["exec"])
    fill(s, 20, "Executive summary"); fill(s, 0, "Write the conclusion first, then the evidence")
    for i in range(3):
        fill(s, 21 + 2 * i, str(i + 1))
    fill(s, 1, "An executive summary is the slide most people read. State what you found, what it means and what you ask for, in plain sentences.")
    for i, t in enumerate(["Lead each point with the claim; follow it with the number or source that proves it.",
                           "Keep to three points. A fourth usually belongs in the appendix.",
                           "End with the decision you need, who makes it and by when."]):
        fill(s, 22 + 2 * i, t)

    s = prs.slides.add_slide(L["two"])
    fill(s, 20, "Strategy"); fill(s, 0, "Two pillars, each with the actions that deliver it")
    fill(s, 21, "Experience"); fill(s, 1, ["Name the places and journeys to promote first.", "Say who the visitor is.", "Say how success will be counted."])
    fill(s, 22, "Invest"); fill(s, 2, ["Name the projects ready for investment.", "State what each needs: land, approvals, capital.", "Say who the investor talks to."])

    s = prs.slides.add_slide(L["finding"])
    fill(s, 20, "Finding"); fill(s, 21, "What the data shows"); fill(s, 0, "Use the finding as the title, so the slide can be read without the chart")
    cd = CategoryChartData()
    cd.categories = ["North Central", "North East", "North West", "South East", "South South", "South West"]
    cd.add_series("Illustrative values", (42, 18, 27, 31, 38, 55))
    for p in s.placeholders:
        if p.placeholder_format.idx == 13:
            ch = p.insert_chart(XL_CHART_TYPE.BAR_CLUSTERED, cd).chart
            chart_style(ch)
            ch.has_legend = False
            ch.has_title = False
            ch.plots[0].gap_width = 70
            ch.plots[0].has_data_labels = True
            ch.plots[0].data_labels.font.size = Pt(10)
            ch.plots[0].data_labels.position = XL_LABEL_POSITION.OUTSIDE_END
    fill(s, 1, "Explain the pattern in two or three sentences. Say how the data was collected and how many responses it rests on.")
    fill(s, 30, "Illustrative data only: replace with verified figures and cite the source here.")

    s = prs.slides.add_slide(L["chart"])
    fill(s, 20, "Data"); fill(s, 0, "A full-width chart for trends over time")
    cd = CategoryChartData()
    cd.categories = ["2021", "2022", "2023", "2024", "2025"]
    cd.add_series("Series A (illustrative)", (20, 26, 31, 35, 41))
    cd.add_series("Series B (illustrative)", (14, 15, 19, 24, 27))
    for p in s.placeholders:
        if p.placeholder_format.idx == 13:
            ch = p.insert_chart(XL_CHART_TYPE.LINE_MARKERS, cd).chart
            chart_style(ch)
            for i, ser in enumerate(ch.plots[0].series):
                ser.format.line.color.rgb = RGBColor.from_string(H((F, C["sage"])[i]))
                ser.format.line.width = Pt(2.25)
                ser.smooth = False
                ser.marker.format.fill.solid()
                ser.marker.format.fill.fore_color.rgb = RGBColor.from_string(H((F, C["sage"])[i]))
                ser.marker.format.line.fill.background()
            ch.has_legend = True
            ch.legend.position = XL_LEGEND_POSITION.TOP
            ch.legend.include_in_layout = False
    fill(s, 30, "Illustrative data only: replace with verified figures and cite the source here.")

    s = prs.slides.add_slide(L["figures"])
    fill(s, 20, "In figures"); fill(s, 0, "Three facts about the country, each with its source")
    for i, (fig, unit, ctx) in enumerate([("36", "states", "Plus the Federal Capital Territory, Abuja."),
                                         ("774", "local government areas", "Set out in the First Schedule of the Constitution."),
                                         ("6", "geopolitical zones", "The regional grouping used for national planning.")]):
        fill(s, 21 + i, fig); fill(s, 24 + i, unit); fill(s, 27 + i, ctx)
    fill(s, 30, "Source: Constitution of the Federal Republic of Nigeria, 1999 (as amended).")

    s = prs.slides.add_slide(L["timeline"])
    fill(s, 20, "Timeline"); fill(s, 0, "Five milestones, read from left to right")
    for i, (d, m, t) in enumerate([("Stage 1", "Scoping", "Agree aims, partners and the places in scope."),
                                   ("Stage 2", "Research", "Collect visitor, site and market evidence."),
                                   ("Stage 3", "Plan", "Prioritise destinations and projects."),
                                   ("Stage 4", "Invest", "Prepare and present investment cases."),
                                   ("Stage 5", "Launch", "Open, promote and measure.")]):
        fill(s, 21 + i, d); fill(s, 31 + i, m); fill(s, 41 + i, t)

    s = prs.slides.add_slide(L["invest"])
    picfill(s, 13, photo("agbokim-waterfalls")); fill(s, 31, PHOTOS["agbokim-waterfalls"]["caption"])
    fill(s, 20, "Investment opportunity"); fill(s, 0, "Project name")
    for p in s.placeholders:
        if p.placeholder_format.idx == 14:
            rows = [("Item", "Detail"), ("Location", "[LGA, State]"), ("Category", "[Eco-lodge / visitor centre / transport]"),
                    ("Stage", "[Concept / feasibility / shovel-ready]"), ("Investment sought", "[₦ ___ million  ·  US$ ___]"),
                    ("Land and approvals", "[Status]"), ("Contact", CONTACT["email"])]
            t = p.insert_table(len(rows), 2).table
            t.columns[0].width, t.columns[1].width = Inches(2.1), Inches(4.53)
            for r, (a, b) in enumerate(rows):
                t.cell(r, 0).text, t.cell(r, 1).text = a, b
            style_table(t)
    fill(s, 1, "Complete every row from verified project documents before sharing.")

    s = prs.slides.add_slide(L["partner"])
    fill(s, 20, "Partnership"); fill(s, 0, "Say what each side commits, and what the partnership delivers")
    fill(s, 21, "Destination Nigeria brings"); fill(s, 22, "The partner brings"); fill(s, 23, "Together we deliver")
    fill(s, 1, ["Destination promotion", "Access to the national network", "Convening and coordination"])
    fill(s, 2, ["Capital or in-kind support", "Operating expertise", "Local knowledge"])
    fill(s, 3, ["A named outcome", "A measure and a date", "A shared review point"])

    s = prs.slides.add_slide(L["financial"])
    fill(s, 20, "Financials"); fill(s, 0, "Lead with the total, then show what makes it up")
    fill(s, 30, "Figures in ₦ million. Placeholder values: replace from audited accounts or the approved budget.")
    for p in s.placeholders:
        if p.placeholder_format.idx == 14:
            rows = [("Line item", "2025", "2026", "2027", "Change"), ("Destination marketing", "000.0", "000.0", "000.0", "0.0 %"),
                    ("Site development", "000.0", "000.0", "000.0", "0.0 %"), ("Training and skills", "000.0", "000.0", "000.0", "0.0 %"),
                    ("Research and data", "000.0", "000.0", "000.0", "0.0 %"), ("Total", "000.0", "000.0", "000.0", "0.0 %")]
            t = p.insert_table(len(rows), 5).table
            for c, wdt in enumerate((4.43, 1.8, 1.8, 1.8, 2.0)):
                t.columns[c].width = Inches(wdt)
            for r, row in enumerate(rows):
                for c, v in enumerate(row):
                    t.cell(r, c).text = v
            style_table(t, num_cols=(1, 2, 3, 4))
            for c in range(5):
                run_fmt(t.cell(len(rows) - 1, c), 11, True, F, PP_ALIGN.RIGHT if c else PP_ALIGN.LEFT)

    s = prs.slides.add_slide(L["recs"])
    fill(s, 20, "Recommendations"); fill(s, 0, "Four recommendations, each with an owner and a date")
    for i in range(4):
        fill(s, 21 + i, str(i + 1))
    for i, (r_, d) in enumerate([("Recommendation one", "Owner · timing · the decision required."), ("Recommendation two", "Owner · timing · the decision required."),
                                 ("Recommendation three", "Owner · timing · the decision required."), ("Recommendation four", "Owner · timing · the decision required.")]):
        fill(s, 31 + i, r_); fill(s, 41 + i, d)

    s = prs.slides.add_slide(L["photo"])
    picfill(s, 13, photo("idanre-hills")); fill(s, 1, PHOTOS["idanre-hills"]["caption"]); fill(s, 2, "Photo: [credit to be confirmed]")

    s = prs.slides.add_slide(L["quote"])
    fill(s, 1, "“Use this layout only for a quotation that has been approved by the person who said it.”")
    fill(s, 2, "Name"); fill(s, 3, "Role, organisation")

    s = prs.slides.add_slide(L["closing"])
    fill(s, 0, "Thank you.")


def main():
    prs = Presentation()
    prs.slide_width, prs.slide_height = Inches(SW), Inches(SH)
    set_theme(prs)
    L = build_layouts(prs)
    deck(prs, L)
    out = OUT / "DN_Presentation-Template_16x9.pptx"
    prs.core_properties.title = "Destination Nigeria — presentation template v2"
    prs.save(out)
    import shutil
    shutil.copy(out, OUT / "DN_Presentation-Template_16x9.potx")
    # POTX needs the template content type
    import zipfile
    src = OUT / "DN_Presentation-Template_16x9.potx"
    tmp = OUT / "_tmp.potx"
    with zipfile.ZipFile(out) as zi, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zo:
        for it in zi.infolist():
            data = zi.read(it.filename)
            if it.filename == "[Content_Types].xml":
                data = data.replace(b"application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml",
                                    b"application/vnd.openxmlformats-officedocument.presentationml.template.main+xml")
            zo.writestr(it, data)
    tmp.replace(src)
    print("saved", out, len(prs.slides), "slides", len(prs.slide_layouts), "layouts")


if __name__ == "__main__":
    main()
