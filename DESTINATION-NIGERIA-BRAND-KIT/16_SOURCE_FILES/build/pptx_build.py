"""PowerPoint master + sample deck → 10_PRESENTATION_TEMPLATES.

Builds a real slide master: brand theme colours and fonts (Playfair Display / Inter), 21 named
layouts with typed placeholders (title, body, picture, chart, table), background art and footer.
The sample deck uses only those layouts plus native, editable shapes, charts and tables.
"""
import copy
import io
import re
from lxml import etree
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.chart.data import CategoryChartData
from pptx.enum.chart import XL_CHART_TYPE, XL_LEGEND_POSITION, XL_LABEL_POSITION
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.dml.color import RGBColor
from pptx.oxml import parse_xml
from pptx.opc.constants import RELATIONSHIP_TYPE as RT, CONTENT_TYPE as CT
from pptx.opc.packuri import PackURI
from pptx.parts.slide import SlideLayoutPart
from brand import *

OUT = KIT / "10_PRESENTATION_TEMPLATES"
BG = KIT / "05_BACKGROUNDS_AND_TEXTURES"
PH = KIT / "06_PHOTOGRAPHY_AND_MEDIA/placeholders"
LOGO = KIT / "02_LOGO_MASTER_FILES/PNG/DN_logo_primary_fullcolour_1000px.png"
LOGO_R = KIT / "02_LOGO_MASTER_FILES/PNG/DN_logo_primary_reversed_1000px.png"
NSP = 'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
E = 914400
BULLET = "E8A432"
SW, SH = 13.333, 7.5
H = lambda c: c.lstrip("#").upper()
_id = [10]


def nid():
    _id[0] += 1
    return _id[0]


def xfrm(x, y, w, h):
    return f'<a:xfrm><a:off x="{int(x * E)}" y="{int(y * E)}"/><a:ext cx="{int(w * E)}" cy="{int(h * E)}"/></a:xfrm>'


def ph(kind, idx, x, y, w, h, prompt, font="mn", size=16, color=C["charcoal"], bold=False, caps=False, spc=0, align="l",
       anchor="t", bullet=False, italic=False, name=None):
    """Layout placeholder. kind: title | body | pic | chart | tbl | sldNum."""
    t = {"title": 'type="title"', "body": f'type="body" idx="{idx}"', "pic": f'type="pic" idx="{idx}"', "chart": f'type="chart" idx="{idx}"',
         "tbl": f'type="tbl" idx="{idx}"', "sldNum": f'type="sldNum" sz="quarter" idx="{idx}"', "obj": f'idx="{idx}"'}[kind]
    bu = (f'<a:buClr><a:srgbClr val="{BULLET}"/></a:buClr><a:buFont typeface="Public Sans"/><a:buChar char="•"/>' if bullet else "<a:buNone/>")
    mar = ' marL="228600" indent="-228600"' if bullet else ' marL="0" indent="0"'
    rpr = (f'<a:defRPr sz="{int(size * 100)}" b="{1 if bold else 0}" i="{1 if italic else 0}"{" cap=\"all\"" if caps else ""} spc="{spc}">'
           f'<a:solidFill><a:srgbClr val="{H(color)}"/></a:solidFill><a:latin typeface="+{font}-lt"/></a:defRPr>')
    lvl = f'<a:lvl1pPr algn="{align}"{mar}><a:lnSpc><a:spcPct val="{"95000" if font == "mj" else "112000"}"/></a:lnSpc><a:spcBef><a:spcPts val="{0 if font == "mj" else 600}"/></a:spcBef>{bu}{rpr}</a:lvl1pPr>'
    if kind == "pic":
        sppr = f'<p:spPr>{xfrm(x, y, w, h)}<a:solidFill><a:srgbClr val="{H(C["haze"])}"/></a:solidFill></p:spPr>'
    else:
        sppr = f"<p:spPr>{xfrm(x, y, w, h)}</p:spPr>"
    i = nid()
    return (f'<p:sp><p:nvSpPr><p:cNvPr id="{i}" name="{name or kind.title() + " " + str(i)}"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>'
            f'<p:nvPr><p:ph {t}/></p:nvPr></p:nvSpPr>{sppr}'
            f'<p:txBody><a:bodyPr lIns="0" tIns="0" rIns="0" bIns="0" anchor="{anchor}"><a:normAutofit/></a:bodyPr><a:lstStyle>{lvl}</a:lstStyle>'
            + (f'<a:p><a:pPr algn="{align}"/><a:fld id="{{B6F15528-21DE-4FAA-801E-634DDDAF4B2B}}" type="slidenum"><a:rPr lang="en-GB"/><a:t>‹#›</a:t></a:fld></a:p>'
               if kind == "sldNum" else f'<a:p><a:pPr algn="{align}"/><a:r><a:rPr lang="en-GB"/><a:t>{prompt}</a:t></a:r></a:p>') + '</p:txBody></p:sp>')


def rect(x, y, w, h, fill, alpha=100, geom="rect"):
    a = f'<a:alpha val="{alpha * 1000}"/>' if alpha < 100 else ""
    return (f'<p:sp><p:nvSpPr><p:cNvPr id="{nid()}" name="Brand shape"/><p:cNvSpPr/><p:nvPr userDrawn="1"/></p:nvSpPr>'
            f'<p:spPr>{xfrm(x, y, w, h)}<a:prstGeom prst="{geom}"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="{H(fill)}">{a}</a:srgbClr></a:solidFill><a:ln><a:noFill/></a:ln></p:spPr>'
            f'<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="en-GB"/></a:p></p:txBody></p:sp>')


def text(x, y, w, h, s, size=9, color=C["stone"], bold=False, spc=0, caps=False, font="mn", align="l"):
    return (f'<p:sp><p:nvSpPr><p:cNvPr id="{nid()}" name="Brand text"/><p:cNvSpPr txBox="1"/><p:nvPr userDrawn="1"/></p:nvSpPr>'
            f'<p:spPr>{xfrm(x, y, w, h)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>'
            f'<p:txBody><a:bodyPr lIns="0" tIns="0" rIns="0" bIns="0" anchor="ctr"/><a:lstStyle/><a:p><a:pPr algn="{align}"/><a:r><a:rPr lang="en-GB" sz="{int(size * 100)}" b="{1 if bold else 0}"'
            f'{" cap=\"all\"" if caps else ""} spc="{spc}"><a:solidFill><a:srgbClr val="{H(color)}"/></a:solidFill><a:latin typeface="+{font}-lt"/></a:rPr><a:t>{s}</a:t></a:r></a:p></p:txBody></p:sp>')


def slide_number(x, y, w, h, color):
    """Always-on slide number: a layout text box holding a slidenum field."""
    return (f'<p:sp><p:nvSpPr><p:cNvPr id="{nid()}" name="Slide number"/><p:cNvSpPr txBox="1"/><p:nvPr userDrawn="1"/></p:nvSpPr>'
            f'<p:spPr>{xfrm(x, y, w, h)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>'
            f'<p:txBody><a:bodyPr lIns="0" tIns="0" rIns="0" bIns="0" anchor="ctr"/><a:lstStyle/><a:p><a:pPr algn="r"/>'
            f'<a:fld id="{{B6F15528-21DE-4FAA-801E-634DDDAF4B2B}}" type="slidenum"><a:rPr lang="en-GB" sz="900"><a:solidFill><a:srgbClr val="{H(color)}"/></a:solidFill>'
            f'<a:latin typeface="+mn-lt"/></a:rPr><a:t>‹#›</a:t></a:fld></a:p></p:txBody></p:sp>')


def pic(rid, x, y, w, h, name="Brand image"):
    return (f'<p:pic><p:nvPicPr><p:cNvPr id="{nid()}" name="{name}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr userDrawn="1"/></p:nvPicPr>'
            f'<p:blipFill><a:blip r:embed="{rid}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>'
            f'<p:spPr>{xfrm(x, y, w, h)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>')


# --------------------------------------------------------------------------- theme
def set_theme(prs):
    master = prs.slide_master
    theme_part = master.part.part_related_by(RT.THEME)
    xml = theme_part.blob.decode("utf-8")
    clr = {"dk1": C["charcoal"], "lt1": "#FFFFFF", "dk2": C["forest"], "lt2": C["ivory"], "accent1": C["forest"], "accent2": C["gold"],
           "accent3": C["canopy"], "accent4": C["confluence"], "accent5": C["laterite"], "accent6": C["sage"], "hlink": C["confluence"], "folHlink": C["stone"]}
    for k, v in clr.items():
        xml = re.sub(rf"<a:{k}>.*?</a:{k}>", f'<a:{k}><a:srgbClr val="{H(v)}"/></a:{k}>', xml, flags=re.S)
    xml = re.sub(r'<a:clrScheme name="[^"]*"', '<a:clrScheme name="Destination Nigeria"', xml)
    xml = re.sub(r'<a:majorFont><a:latin typeface="[^"]*"', '<a:majorFont><a:latin typeface="Playfair Display"', xml)
    xml = re.sub(r'<a:minorFont><a:latin typeface="[^"]*"', '<a:minorFont><a:latin typeface="Inter"', xml)
    xml = re.sub(r'<a:fontScheme name="[^"]*"', '<a:fontScheme name="Destination Nigeria"', xml)
    theme_part._blob = xml.encode("utf-8")
    # master: ivory background, brand text styles
    m = master._element
    csld = m.find("{http://schemas.openxmlformats.org/presentationml/2006/main}cSld")
    old = csld.find("{http://schemas.openxmlformats.org/presentationml/2006/main}bg")
    if old is not None:
        csld.remove(old)
    csld.insert(0, parse_xml(f'<p:bg {NSP}><p:bgPr><a:solidFill><a:srgbClr val="{H(C["ivory"])}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>'))
    for path, colr in [(".//p:titleStyle//a:lvl1pPr/a:defRPr", C["forest"]), (".//p:bodyStyle//a:defRPr", C["charcoal"])]:
        for el in m.xpath(path):
            for f in el.findall("{http://schemas.openxmlformats.org/drawingml/2006/main}solidFill"):
                el.remove(f)
            el.insert(0, parse_xml(f'<a:solidFill {NSP}><a:srgbClr val="{H(colr)}"/></a:solidFill>'))


# --------------------------------------------------------------------------- layouts
FOOT = None  # filled per presentation (logo rId resolved inside each layout part)


def add_layout(prs, name, bg=None, build=None, footer=True, dark=False, n=[100]):
    master = prs.slide_master
    n[0] += 1
    xml = (f'<p:sldLayout {NSP} preserve="1" userDrawn="1" showMasterSp="0"><p:cSld name="{name}"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
           f'<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>'
           f'<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>')
    part = SlideLayoutPart(PackURI(f"/ppt/slideLayouts/slideLayout{n[0]}.xml"), CT.PML_SLIDE_LAYOUT, prs.part.package, parse_xml(xml))
    part.relate_to(master.part, RT.SLIDE_MASTER)
    rid = master.part.relate_to(part, RT.SLIDE_LAYOUT)
    lst = master._element.get_or_add_sldLayoutIdLst()
    lst.append(parse_xml(f'<p:sldLayoutId {NSP} id="{2147483700 + n[0]}" r:id="{rid}"/>'))
    el = part._element
    csld = el[0]
    if bg:
        if isinstance(bg, str) and bg.startswith("#"):
            fill = f'<a:solidFill><a:srgbClr val="{H(bg)}"/></a:solidFill>'
        else:
            _, brid = part.get_or_add_image_part(str(bg))
            fill = f'<a:blipFill dpi="0" rotWithShape="1"><a:blip r:embed="{brid}"/><a:srcRect/><a:stretch><a:fillRect/></a:stretch></a:blipFill>'
        csld.insert(0, parse_xml(f'<p:bg {NSP}><p:bgPr>{fill}<a:effectLst/></p:bgPr></p:bg>'))
    tree = csld.find("{http://schemas.openxmlformats.org/presentationml/2006/main}spTree")
    img = lambda path: part.get_or_add_image_part(str(path))[1]
    shapes = build(img) if build else []
    if footer:
        lr = img(LOGO_R if dark else LOGO)
        shapes += [pic(lr, 0.55, 6.86, 1.05, 1.05 * LOGO_H / LOGO_W, "Footer logo"),
                   rect(1.8, 7.06, SW - 2.35 - 1.8 - .6, .01, C["sage"] if not dark else C["ridge"]),
                   slide_number(SW - 1.15, 6.93, .6, .26, C["stone"] if not dark else C["sage"])]
    for s in shapes:
        tree.append(parse_xml(s.replace("<p:sp>", f"<p:sp {NSP}>", 1).replace("<p:pic>", f"<p:pic {NSP}>", 1)))
    return prs.slide_layouts[-1]


def build_layouts(prs):
    for l in list(prs.slide_layouts):
        prs.slide_layouts.remove(l)
    L = {}
    F = C["forest"]
    ov = lambda x, y, w, s="[OVERLINE]", col=C["golddeep"]: ph("body", 20, x, y, w, .3, s, size=11, color=col, bold=True, caps=True, spc=300, name="Overline")
    L["cover"] = add_layout(prs, "01 Cover", BG / "05_golden-horizon/DN_bg_05_golden-horizon_16x9_1920x1080.jpg", lambda img: [
        pic(img(LOGO_R), .75, .65, 2.3, 2.3 * LOGO_H / LOGO_W, "Logo"),
        ov(.75, 2.75, 7, "[PROGRAMME / EVENT]", C["gold"]),
        ph("title", 0, .75, 3.1, 8.6, 1.5, "[Presentation title]", "mj", 46, C["ivory"], anchor="t"),
        ph("body", 1, .75, 4.75, 8, .6, "[Subtitle · Presenter · Date]", size=16, color=C["sage"])], footer=False)
    L["cover_photo"] = add_layout(prs, "02 Cover — photograph", None, lambda img: [
        ph("pic", 13, 0, 0, SW, SH, "Insert licensed photograph (full bleed)"),
        pic(img(BG / "11_tourism-photo-overlay/DN_overlay_forest-gradient_16x9_1920x1080.png"), 0, 0, SW, SH, "Forest gradient overlay"),
        pic(img(LOGO_R), .75, .65, 2.1, 2.1 * LOGO_H / LOGO_W, "Logo"),
        ov(.75, 4.6, 7, "[DESTINATION / CAMPAIGN]", C["gold"]),
        ph("title", 0, .75, 4.95, 9, 1.2, "[Presentation title]", "mj", 44, C["ivory"], anchor="t"),
        ph("body", 1, .75, 6.25, 8, .45, "[Subtitle · Date]", size=15, color=C["ivory"])], footer=False)
    L["agenda"] = add_layout(prs, "03 Agenda", C["ivory"], lambda img: [
        rect(0, 0, 4.6, SH, F),
        ov(.75, 1.0, 3.4, "AGENDA", C["gold"]),
        ph("title", 0, .75, 1.35, 3.4, 1.6, "[Today’s agenda]", "mj", 36, C["ivory"]),
        ph("body", 1, 5.4, 1.0, 7.2, 5.4, "[Agenda item]", size=20, color=F, bullet=False)], dark=False)
    L["section"] = add_layout(prs, "04 Section divider", BG / "02_forest-institutional/DN_bg_02_forest-institutional_16x9_1920x1080.jpg", lambda img: [
        ph("body", 1, .75, 2.0, 3, 1.3, "01", "mj", 96, C["gold"], name="Section number"),
        ph("title", 0, .75, 3.6, 9, 1.2, "[Section title]", "mj", 48, C["ivory"]),
        ph("body", 2, .75, 4.85, 8, .7, "[One-line introduction]", size=18, color=C["sage"])], dark=True)
    L["exec"] = add_layout(prs, "05 Executive summary", C["ivory"], lambda img: [
        ov(.75, .7, 6), ph("title", 0, .75, 1.0, 11.5, .9, "[Executive summary]", "mj", 36, F),
        rect(.75, 2.15, .06, 3.8, C["gold"]),
        ph("body", 1, 1.05, 2.1, 4.6, 4.2, "[Lead statement — the single most important conclusion]", "mj", 24, F),
        ph("body", 2, 6.4, 2.1, 6.2, 4.4, "[Supporting point]", size=16, bullet=True)])
    L["text"] = add_layout(prs, "06 Title and content", C["ivory"], lambda img: [
        ov(.75, .7, 6), ph("title", 0, .75, 1.0, 11.5, .9, "[Slide title]", "mj", 34, F),
        ph("body", 1, .75, 2.15, 11.8, 4.3, "[Content]", size=18, bullet=True)])
    L["two"] = add_layout(prs, "07 Two columns", C["ivory"], lambda img: [
        ov(.75, .7, 6), ph("title", 0, .75, 1.0, 11.5, .9, "[Slide title]", "mj", 34, F),
        ph("body", 21, .75, 2.15, 5.7, .4, "[Column heading]", size=16, color=F, bold=True),
        ph("body", 1, .75, 2.65, 5.7, 3.8, "[Content]", size=16, bullet=True),
        ph("body", 22, 6.9, 2.15, 5.7, .4, "[Column heading]", size=16, color=F, bold=True),
        ph("body", 2, 6.9, 2.65, 5.7, 3.8, "[Content]", size=16, bullet=True)])
    L["photo"] = add_layout(prs, "08 Full-bleed photograph", None, lambda img: [
        ph("pic", 13, 0, 0, SW, SH, "Insert licensed photograph (full bleed)"),
        pic(img(BG / "11_tourism-photo-overlay/DN_overlay_forest-gradient_16x9_1920x1080.png"), 0, 0, SW, SH, "Overlay"),
        ph("title", 0, .75, 5.2, 9.5, 1.0, "[Headline over image]", "mj", 38, C["ivory"], anchor="b"),
        ph("body", 1, .75, 6.35, 9.5, .4, "[Caption · Photo: credit / licence]", size=12, color=C["ivory"])], footer=False)
    L["feature"] = add_layout(prs, "09 Destination feature", C["ivory"], lambda img: [
        ph("pic", 13, 0, 0, 7.2, SH, "Insert licensed photograph"),
        ov(7.8, .9, 5), ph("title", 0, 7.8, 1.25, 4.9, 1.6, "[Destination name]", "mj", 38, F),
        ph("body", 1, 7.8, 3.0, 4.9, 2.2, "[Two or three sentences: what makes it worth the journey.]", size=15),
        rect(7.8, 5.35, 4.9, .01, C["sage"]),
        ph("body", 2, 7.8, 5.5, 4.9, .9, "[Getting there · Best time · Highlights]", size=12, color=C["stone"])])
    L["grid"] = add_layout(prs, "10 Image grid", C["ivory"], lambda img: [
        ov(.75, .5, 6), ph("title", 0, .75, .8, 11.5, .8, "[Slide title]", "mj", 32, F),
        ph("pic", 13, .75, 1.9, 5.8, 4.65, "Image 1"), ph("pic", 14, 6.75, 1.9, 2.85, 2.25, "Image 2"),
        ph("pic", 15, 9.75, 1.9, 2.85, 2.25, "Image 3"), ph("pic", 16, 6.75, 4.3, 5.85, 2.25, "Image 4")])
    L["title_only"] = add_layout(prs, "11 Title only (diagrams, timeline, process)", C["ivory"], lambda img: [
        ov(.75, .7, 6), ph("title", 0, .75, 1.0, 11.5, .9, "[Slide title]", "mj", 34, F)])
    L["kpi"] = add_layout(prs, "12 Statistics / KPIs", BG / "10_investment-premium/DN_bg_10_investment-premium_16x9_1920x1080.jpg", lambda img: [
        ov(.75, .7, 6, col=C["gold"]), ph("title", 0, .75, 1.0, 11.5, .9, "[Key figures]", "mj", 34, C["ivory"])] + sum([[
            ph("body", 30 + k, .75 + k * 3.05, 2.6, 2.8, 1.3, "[00]", "mn", 54, C["gold"], name=f"Figure {k + 1}"),
            ph("body", 40 + k, .75 + k * 3.05, 3.95, 2.6, 1.2, "[What the figure measures · source, year]", size=13, color=C["ivory"], name=f"Figure label {k + 1}")]
            for k in range(4)], []), dark=True)
    L["chart"] = add_layout(prs, "13 Chart", C["ivory"], lambda img: [
        ov(.75, .7, 6), ph("title", 0, .75, 1.0, 11.5, .9, "[Chart title]", "mj", 34, F),
        ph("chart", 13, .75, 2.1, 8.2, 4.4, "Insert chart"),
        ph("body", 1, 9.4, 2.1, 3.2, 4.4, "[Key takeaway from the data]", size=15),
        ph("body", 2, .75, 6.5, 8.2, .3, "Source: [verified source, year]", size=10, color=C["stone"])])
    L["invest"] = add_layout(prs, "14 Investment opportunity", BG / "10_investment-premium/DN_bg_10_investment-premium_16x9_1920x1080.jpg", lambda img: [
        ph("pic", 13, 0, 0, 5.4, SH, "Insert licensed site photograph"),
        ov(6.0, .9, 6, "INVESTMENT OPPORTUNITY", C["gold"]),
        ph("title", 0, 6.0, 1.25, 6.6, 1.3, "[Project title]", "mj", 36, C["ivory"]),
        ph("body", 1, 6.0, 2.7, 6.6, 1.3, "[Location · Category · Development stage]", size=15, color=C["sage"]),
        ph("body", 2, 6.0, 4.0, 6.6, 2.4, "[Verified facts only. Unconfirmed values: ‘TBC’.]", size=14, color=C["ivory"], bullet=True)], dark=True)
    L["partners"] = add_layout(prs, "15 Partnership overview", C["ivory"], lambda img: [
        ov(.75, .7, 6), ph("title", 0, .75, 1.0, 11.5, .9, "[Partnership overview]", "mj", 34, F),
        ph("body", 1, .75, 2.15, 5.2, 4.3, "[Purpose and structure of the partnership]", size=16, bullet=True)] + [
        ph("pic", 13 + k, 6.5 + (k % 2) * 3.1, 2.15 + (k // 2) * 2.2, 2.9, 2.0, "Approved partner logo only") for k in range(4)])
    L["table"] = add_layout(prs, "16 Table / budget", C["ivory"], lambda img: [
        ov(.75, .7, 6), ph("title", 0, .75, 1.0, 11.5, .9, "[Budget breakdown]", "mj", 34, F),
        ph("tbl", 13, .75, 2.1, 11.8, 4.2, "Insert table"),
        ph("body", 1, .75, 6.4, 11.8, .3, "[Figures are estimates until confirmed in writing.]", size=10, color=C["stone"])])
    L["case"] = add_layout(prs, "17 Case study", C["ivory"], lambda img: [
        ph("pic", 13, 0, 0, SW, 2.7, "Insert licensed photograph"),
        ov(.75, 3.0, 6, "CASE STUDY"), ph("title", 0, .75, 3.3, 11.5, .8, "[Case study title]", "mj", 30, F)] + sum([[
            ph("body", 21 + k, .75 + k * 4.0, 4.25, 3.7, .35, ["Challenge", "Approach", "Outcome"][k], size=12, color=C["golddeep"], bold=True, caps=True, spc=200),
            ph("body", 1 + k, .75 + k * 4.0, 4.7, 3.7, 1.9, "[Two to three sentences]", size=14)] for k in range(3)], []))
    L["quote"] = add_layout(prs, "18 Quote", BG / "09_dark-cinematic/DN_bg_09_dark-cinematic_16x9_1920x1080.jpg", lambda img: [
        text(.75, 1.0, 1.5, 1.5, "“", 120, C["gold"], font="mj"),
        ph("body", 1, 1.6, 2.0, 10.2, 2.6, "[Approved quotation in sentence case.]", "mj", 34, C["ivory"], italic=True),
        ph("body", 2, 1.6, 4.9, 10, .5, "— [Name, title, organisation]", size=15, color=C["gold"])], dark=True)
    L["closing"] = add_layout(prs, "19 Closing", BG / "12_event-stage/DN_bg_12_event-stage_16x9_1920x1080.jpg", lambda img: [
        pic(img(LOGO_R), SW / 2 - 2.4, 1.3, 4.8, 4.8 * LOGO_H / LOGO_W, "Logo"),
        pic(img(KIT / "04_VECTOR_GRAPHICS_AND_ICONS/_previews/campaign-lockups/DN_campaign-line_white.png"), SW / 2 - 2.6, 3.55, 5.2, 5.2 * 26 / 482, "Campaign line"),
        ph("title", 0, 1.5, 4.25, SW - 3, .7, "[Thank you]", "mj", 30, C["ivory"], align="ctr"),
        ph("body", 1, 1.5, 5.0, SW - 3, .8, "[Name · email · website]", size=14, color=C["sage"], align="ctr")], footer=False)
    L["holding"] = add_layout(prs, "20 Event holding slide", BG / "12_event-stage/DN_bg_12_event-stage_16x9_1920x1080.jpg", lambda img: [
        pic(img(LOGO_R), SW / 2 - 2.0, 1.2, 4.0, 4.0 * LOGO_H / LOGO_W, "Logo"),
        ph("title", 0, 1.5, 3.25, SW - 3, 1.0, "[Event name]", "mj", 40, C["ivory"], align="ctr"),
        ph("body", 1, 1.5, 4.35, SW - 3, .5, "[Session begins at HH:MM]", size=18, color=C["gold"], align="ctr")], footer=False)
    L["blank"] = add_layout(prs, "21 Blank (branded footer)", C["ivory"], lambda img: [])
    return L


# --------------------------------------------------------------------------- sample deck
def fill(slide, idx, txt):
    for p in slide.placeholders:
        if p.placeholder_format.idx == idx:
            if isinstance(txt, list):
                tf = p.text_frame
                tf.text = txt[0]
                for t in txt[1:]:
                    tf.add_paragraph().text = t
            else:
                p.text = txt
            return p


def picfill(slide, idx, path):
    for p in slide.placeholders:
        if p.placeholder_format.idx == idx:
            return p.insert_picture(str(path))


def shape_text(sh, s, size=14, color=C["charcoal"], bold=False, align=PP_ALIGN.LEFT, font="Inter"):
    tf = sh.text_frame
    tf.margin_left = tf.margin_right = Inches(.08)
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    r = p.add_run()
    r.text = s
    r.font.size, r.font.bold, r.font.name = Pt(size), bold, font
    r.font.color.rgb = RGBColor.from_string(H(color))


def box(slide, kind, x, y, w, h, fill_, line=None):
    sh = slide.shapes.add_shape(kind, Inches(x), Inches(y), Inches(w), Inches(h))
    sh.fill.solid()
    sh.fill.fore_color.rgb = RGBColor.from_string(H(fill_))
    if line:
        sh.line.color.rgb = RGBColor.from_string(H(line))
    else:
        sh.line.fill.background()
    sh.shadow.inherit = False
    return sh


def deck(prs, L):
    P1, P2, P3 = PH / "DN_placeholder_landscape-dawn_3x2.jpg", PH / "DN_placeholder_landscape-day_3x2.jpg", PH / "DN_placeholder_landscape-dusk_3x2.jpg"
    s = prs.slides.add_slide(L["cover"])
    fill(s, 20, "DESTINATION NIGERIA")
    fill(s, 0, "Presentation title on one or two lines")
    fill(s, 1, "[Subtitle]  ·  [Presenter]  ·  [Date]")
    s = prs.slides.add_slide(L["cover_photo"])
    picfill(s, 13, P1); fill(s, 20, "[DESTINATION]"); fill(s, 0, "Alternative cover with photograph"); fill(s, 1, "Replace the placeholder with licensed photography")
    s = prs.slides.add_slide(L["agenda"])
    fill(s, 0, "Today’s agenda")
    fill(s, 1, ["01   Context", "02   Opportunity", "03   Destinations", "04   Investment", "05   Partnership and next steps"])
    s = prs.slides.add_slide(L["section"])
    fill(s, 1, "01"); fill(s, 0, "Context"); fill(s, 2, "[One-line introduction to the section]")
    s = prs.slides.add_slide(L["exec"])
    fill(s, 20, "SUMMARY"); fill(s, 0, "Executive summary")
    fill(s, 1, "[The single most important conclusion, stated plainly.]")
    fill(s, 2, ["[Supporting point one]", "[Supporting point two]", "[Supporting point three]"])
    s = prs.slides.add_slide(L["two"])
    fill(s, 20, "APPROACH"); fill(s, 0, "Two-column content")
    fill(s, 21, "Experience"); fill(s, 1, ["[Point]", "[Point]", "[Point]"]); fill(s, 22, "Invest"); fill(s, 2, ["[Point]", "[Point]", "[Point]"])
    s = prs.slides.add_slide(L["photo"])
    picfill(s, 13, P3); fill(s, 0, "A full-bleed photograph with a headline"); fill(s, 1, "[Caption]  ·  Photo: [credit / licence]")
    s = prs.slides.add_slide(L["feature"])
    picfill(s, 13, PH / "DN_placeholder_landscape-dawn_4x5.jpg"); fill(s, 20, "EXPLORE  ·  [STATE]"); fill(s, 0, "[Destination name]")
    fill(s, 1, "[Two or three sentences on what makes it worth the journey — specific, sensory, verified.]")
    fill(s, 2, "Getting there: [ ]  ·  Best time: [ ]  ·  Highlights: [ ]")
    s = prs.slides.add_slide(L["grid"])
    fill(s, 20, "GALLERY"); fill(s, 0, "Image grid")
    for i, p in zip(range(13, 17), [P2, P1, P3, P2]):
        picfill(s, i, p)
    # timeline
    s = prs.slides.add_slide(L["title_only"])
    fill(s, 20, "TIMELINE"); fill(s, 0, "Timeline")
    box(s, MSO_SHAPE.RECTANGLE, .75, 3.6, 11.85, .04, C["sage"])
    for k in range(5):
        x = .75 + k * 2.45
        box(s, MSO_SHAPE.OVAL, x, 3.45, .34, .34, C["gold"] if k == 2 else C["forest"])
        t = s.shapes.add_textbox(Inches(x), Inches(2.6), Inches(2.2), Inches(.6)); shape_text(t, f"[Month YYYY]", 13, C["golddeep"], True)
        t = s.shapes.add_textbox(Inches(x), Inches(4.0), Inches(2.2), Inches(1.6)); shape_text(t, "[Milestone — what happens and who leads]", 14)
    # process
    s = prs.slides.add_slide(L["title_only"])
    fill(s, 20, "PROCESS"); fill(s, 0, "Process diagram")
    for k, lab in enumerate(["Discover", "Plan", "Develop", "Promote", "Measure"]):
        sh = box(s, MSO_SHAPE.CHEVRON if k else MSO_SHAPE.PENTAGON, .75 + k * 2.4, 2.6, 2.5, 1.2, [C["forest"], C["ridge"], C["canopy"], C["confluence"], C["golddeep"]][k])
        shape_text(sh, lab, 15, "#FFFFFF", True, PP_ALIGN.CENTER)
        t = s.shapes.add_textbox(Inches(.85 + k * 2.4), Inches(4.0), Inches(2.2), Inches(1.6)); shape_text(t, "[Activity description]", 13)
    s = prs.slides.add_slide(L["kpi"])
    fill(s, 20, "KEY FIGURES"); fill(s, 0, "Statistics and KPIs")
    for k in range(4):
        fill(s, 30 + k, "[00]"); fill(s, 40 + k, "[Measure — source, year]")
    s = prs.slides.add_slide(L["chart"])
    fill(s, 20, "DATA"); fill(s, 0, "Chart layout")
    cd = CategoryChartData()
    cd.categories = ["[A]", "[B]", "[C]", "[D]", "[E]"]
    cd.add_series("Series 1 (illustrative)", (4, 6, 5, 7, 8))
    cd.add_series("Series 2 (illustrative)", (3, 4, 4, 5, 6))
    for p in s.placeholders:
        if p.placeholder_format.idx == 13:
            gf = p.insert_chart(XL_CHART_TYPE.COLUMN_CLUSTERED, cd)
    ch = gf.chart
    ch.has_legend = True
    ch.legend.position = XL_LEGEND_POSITION.BOTTOM
    ch.legend.include_in_layout = False
    ch.legend.font.size, ch.legend.font.name = Pt(11), "Inter"
    for ser, col in zip(ch.series, [C["forest"], C["gold"]]):
        ser.format.fill.solid(); ser.format.fill.fore_color.rgb = RGBColor.from_string(H(col))
    ch.value_axis.has_major_gridlines = True
    ch.value_axis.major_gridlines.format.line.color.rgb = RGBColor.from_string(H(C["sage"]))
    ch.value_axis.tick_labels.font.size = ch.category_axis.tick_labels.font.size = Pt(11)
    ch.font.name = "Inter"
    fill(s, 1, "[Key takeaway. Data shown is illustrative — replace via right-click → Edit Data.]")
    fill(s, 2, "Source: [verified source, year]")
    s = prs.slides.add_slide(L["invest"])
    picfill(s, 13, PH / "DN_placeholder_landscape-day_4x5.jpg"); fill(s, 0, "[Project title]"); fill(s, 1, "[Location]  ·  [Category]  ·  [Stage]")
    fill(s, 2, ["Indicative investment: TBC", "Structure: TBC", "Documentation: [list available on request]"])
    s = prs.slides.add_slide(L["partners"])
    fill(s, 20, "PARTNERSHIP"); fill(s, 0, "Partnership overview")
    fill(s, 1, ["[Purpose of the partnership]", "[Roles]", "[Governance]", "Show only partners with written approval."])
    s = prs.slides.add_slide(L["table"])
    fill(s, 20, "BUDGET"); fill(s, 0, "Budget breakdown")
    for p in s.placeholders:
        if p.placeholder_format.idx == 13:
            gt = p.insert_table(rows=6, cols=4)
    tb = gt.table
    for j, h in enumerate(["Line item", "Description", "Phase", "Amount (₦)"]):
        tb.cell(0, j).text = h
    for i in range(1, 5):
        for j, v in enumerate(["[Item]", "[Description]", "[Phase]", "[0.00]"]):
            tb.cell(i, j).text = v
    for j, v in enumerate(["Total", "", "", "[0.00]"]):
        tb.cell(5, j).text = v
    for i in range(6):
        for j in range(4):
            c = tb.cell(i, j)
            c.fill.solid()
            c.fill.fore_color.rgb = RGBColor.from_string(H(C["forest"] if i == 0 else (C["haze"] if i == 5 else ("#FFFFFF" if i % 2 else C["ivory"]))))
            for para in c.text_frame.paragraphs:
                para.alignment = PP_ALIGN.RIGHT if j == 3 else PP_ALIGN.LEFT
                for r in para.runs:
                    r.font.size, r.font.name = Pt(13), "Inter"
                    r.font.bold = i in (0, 5)
                    r.font.color.rgb = RGBColor.from_string("FFFFFF" if i == 0 else H(C["charcoal"]))
    fill(s, 1, "Figures are estimates until confirmed in writing.")
    # roadmap
    s = prs.slides.add_slide(L["title_only"])
    fill(s, 20, "ROADMAP"); fill(s, 0, "Roadmap")
    for r, lab in enumerate(["[Workstream 1]", "[Workstream 2]", "[Workstream 3]"]):
        t = s.shapes.add_textbox(Inches(.75), Inches(2.5 + r * 1.15), Inches(2.2), Inches(.6)); shape_text(t, lab, 14, C["forest"], True)
        st, ln = [(0, 3), (2, 4), (4, 4)][r]
        bar = box(s, MSO_SHAPE.ROUNDED_RECTANGLE, 3.1 + st * 1.18, 2.52 + r * 1.15, ln * 1.18, .5, [C["forest"], C["canopy"], C["gold"]][r])
        shape_text(bar, "[Deliverable]", 12, "#FFFFFF" if r < 2 else H(C["forest"]), True)
    for q in range(8):
        t = s.shapes.add_textbox(Inches(3.1 + q * 1.18), Inches(2.0), Inches(1.1), Inches(.35)); shape_text(t, f"Q{q % 4 + 1}", 11, C["stone"], True)
    s = prs.slides.add_slide(L["case"])
    picfill(s, 13, P2); fill(s, 0, "[Case study title]")
    for k in range(3):
        fill(s, 1 + k, "[Two to three sentences.]")
    s = prs.slides.add_slide(L["quote"])
    fill(s, 1, "[An approved, attributed quotation that captures the ambition.]"); fill(s, 2, "— [Name, title, organisation]")
    s = prs.slides.add_slide(L["holding"])
    fill(s, 0, "[Event name]"); fill(s, 1, "[Session begins at HH:MM]")
    s = prs.slides.add_slide(L["closing"])
    fill(s, 0, "Thank you"); fill(s, 1, "[Name]  ·  [email]  ·  [website]")


if __name__ == "__main__":
    prs = Presentation()
    prs.slide_width, prs.slide_height = Inches(SW), Inches(SH)
    set_theme(prs)
    L = build_layouts(prs)
    master_only = OUT / "DN_Presentation-Master_16x9.potx"
    deck(prs, L)
    prs.core_properties.title = "Destination Nigeria — presentation template"
    prs.core_properties.author = "Destination Nigeria"
    out = OUT / "DN_Presentation-Template_16x9.pptx"
    prs.save(out)
    # .potx (template) copy
    import zipfile
    with zipfile.ZipFile(out) as zi, zipfile.ZipFile(master_only, "w", zipfile.ZIP_DEFLATED) as zo:
        for it in zi.infolist():
            data = zi.read(it.filename)
            if it.filename == "[Content_Types].xml":
                data = data.replace(b"presentationml.presentation.main+xml", b"presentationml.template.main+xml")
            zo.writestr(it, data)
    print("saved", out, len(prs.slides), "slides", len(prs.slide_layouts), "layouts")
