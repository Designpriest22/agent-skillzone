"""python-docx helpers for the Destination Nigeria document system.

Styles are real Word styles (Title, Heading 1–3, Normal, Quote, Caption, Overline, Table Brand…),
so every template stays editable and consistent. Placeholders are Word content controls.
"""
import copy
import itertools
from docx import Document
from docx.enum.section import WD_ORIENT, WD_SECTION
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt, Mm, RGBColor, Emu
from brand import C, KIT, CONTACT

LOGO = KIT / "02_LOGO_MASTER_FILES/PNG/DN_logo_primary_fullcolour_2000px.png"
LOGO_REV = KIT / "02_LOGO_MASTER_FILES/PNG/DN_logo_primary_reversed_2000px.png"
ROUNDEL = KIT / "02_LOGO_MASTER_FILES/PNG/DN_symbol_roundel_forest_512px.png"
BG = KIT / "05_BACKGROUNDS_AND_TEXTURES"
DISPLAY, SANS, EDIT = "Newsreader Display", "Public Sans", "Newsreader Text"
_ids = itertools.count(5000)


def rgb(h):
    return RGBColor.from_string(h.lstrip("#").upper())


def _fonts(rpr_owner, name):
    rpr = rpr_owner.get_or_add_rPr() if hasattr(rpr_owner, "get_or_add_rPr") else rpr_owner
    rf = rpr.find(qn("w:rFonts"))
    if rf is None:
        rf = OxmlElement("w:rFonts")
        rpr.insert(0, rf)
    for a in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        rf.set(qn(a), name)
    for a in ("w:asciiTheme", "w:hAnsiTheme", "w:eastAsiaTheme", "w:cstheme"):   # theme fonts would override the brand font
        if rf.get(qn(a)) is not None:
            del rf.attrib[qn(a)]


def style_font(st, name, size, color=None, bold=False, italic=False, spacing=None):
    st.font.name = name
    _fonts(st.element.get_or_add_rPr(), name)
    st.font.size = Pt(size)
    st.font.bold = bold
    st.font.italic = italic
    if color:
        st.font.color.rgb = rgb(color)
    if spacing is not None:
        sp = OxmlElement("w:spacing")
        sp.set(qn("w:val"), str(int(spacing * 20)))
        st.element.get_or_add_rPr().append(sp)


def para_fmt(st, before=0, after=6, line=1.3, keep=False):
    pf = st.paragraph_format
    pf.space_before, pf.space_after, pf.line_spacing = Pt(before), Pt(after), line
    if keep:
        pf.keep_with_next = True


def setup(doc, landscape=False, margins=(30, 22, 24, 22)):
    s = doc.sections[0]
    s.page_width, s.page_height = (Mm(297), Mm(210)) if landscape else (Mm(210), Mm(297))
    s.orientation = WD_ORIENT.LANDSCAPE if landscape else WD_ORIENT.PORTRAIT
    s.top_margin, s.right_margin, s.bottom_margin, s.left_margin = [Mm(m) for m in margins]
    s.header_distance, s.footer_distance = Mm(10), Mm(9)
    st = doc.styles
    style_font(st["Normal"], SANS, 10, C["charcoal"])
    para_fmt(st["Normal"], 0, 6, 1.32)
    style_font(st["Title"], DISPLAY, 32, C["forest"])
    para_fmt(st["Title"], 0, 10, 1.02)
    st["Title"].element.get_or_add_pPr()
    for el in st["Title"].element.pPr.findall(qn("w:pBdr")):
        st["Title"].element.pPr.remove(el)
    style_font(st["Subtitle"], EDIT, 13, C["stone"], italic=False)
    para_fmt(st["Subtitle"], 0, 12, 1.3)
    style_font(st["Heading 1"], DISPLAY, 22, C["forest"])
    para_fmt(st["Heading 1"], 22, 8, 1.08, keep=True)
    style_font(st["Heading 2"], DISPLAY, 14, C["forest"], bold=False)
    para_fmt(st["Heading 2"], 14, 4, 1.2, keep=True)
    style_font(st["Heading 3"], SANS, 9.5, C["forest"], bold=True)
    para_fmt(st["Heading 3"], 10, 3, 1.2, keep=True)
    style_font(st["Quote"], DISPLAY, 16, C["forest"], italic=True)
    para_fmt(st["Quote"], 12, 12, 1.35)
    style_font(st["Caption"], SANS, 8, C["stone"])
    para_fmt(st["Caption"], 3, 10, 1.25)
    for n in ("List Bullet", "List Number"):
        style_font(st[n], SANS, 10, C["charcoal"])
        para_fmt(st[n], 0, 3, 1.3)
    o = st.add_style("Overline", WD_STYLE_TYPE.PARAGRAPH)
    o.base_style = st["Normal"]
    style_font(o, SANS, 7.5, C["golddeep"], bold=True, spacing=0.6)
    o.font.all_caps = True
    para_fmt(o, 0, 4, 1.2, keep=True)
    lead = st.add_style("Lead", WD_STYLE_TYPE.PARAGRAPH)
    lead.base_style = st["Normal"]
    style_font(lead, EDIT, 13, C["forest"])
    para_fmt(lead, 0, 12, 1.38)
    sm = st.add_style("Small", WD_STYLE_TYPE.PARAGRAPH)
    sm.base_style = st["Normal"]
    style_font(sm, SANS, 8, C["stone"])
    para_fmt(sm, 0, 2, 1.25)
    tb = st.add_style("Table Text", WD_STYLE_TYPE.PARAGRAPH)
    tb.base_style = st["Normal"]
    style_font(tb, SANS, 9, C["charcoal"])
    para_fmt(tb, 1, 1, 1.15)
    th = st.add_style("Table Head", WD_STYLE_TYPE.PARAGRAPH)
    th.base_style = st["Normal"]
    style_font(th, SANS, 7.5, C["forest"], bold=True, spacing=.5)
    th.font.all_caps = True
    para_fmt(th, 2, 2, 1.1)
    # document language + theme-ish defaults
    rpr = st.element.find(qn("w:docDefaults")).find(qn("w:rPrDefault")).find(qn("w:rPr"))
    _fonts(rpr, SANS)
    for el in st.element.iter(qn("w:rFonts")):      # any remaining style still pointing at theme fonts
        if el.get(qn("w:asciiTheme")) is not None:
            fam = DISPLAY if "major" in el.get(qn("w:asciiTheme")) else SANS
            for a in ("w:asciiTheme", "w:hAnsiTheme", "w:eastAsiaTheme", "w:cstheme"):
                if el.get(qn(a)) is not None:
                    del el.attrib[qn(a)]
            for a in ("w:ascii", "w:hAnsi", "w:cs"):
                if el.get(qn(a)) is None:
                    el.set(qn(a), fam)
    lang = OxmlElement("w:lang")
    lang.set(qn("w:val"), "en-GB")
    rpr.append(lang)
    return doc


def new(landscape=False, margins=(30, 22, 24, 22), title="", subject=""):
    d = setup(Document(), landscape, margins)
    cp = d.core_properties
    cp.author, cp.title, cp.subject, cp.keywords = "Destination Nigeria", title, subject, "Destination Nigeria; template"
    cp.comments = "Destination Nigeria brand kit v2.0 template. Replace bracketed placeholders with verified information only."
    return d


# ------------------------------------------------------------------ inline helpers
def run(p, text, bold=False, italic=False, color=None, size=None, font=None, caps=False, spacing=None):
    r = p.add_run(text)
    r.bold, r.italic = bold, italic
    if color:
        r.font.color.rgb = rgb(color)
    if size:
        r.font.size = Pt(size)
    if font:
        r.font.name = font
        _fonts(r._r, font)
    if caps:
        r.font.all_caps = True
    if spacing:
        sp = OxmlElement("w:spacing")
        sp.set(qn("w:val"), str(int(spacing * 20)))
        r._r.get_or_add_rPr().append(sp)
    return r


def field(p, placeholder, tag=None, color=C["stone"], bold=False, size=None):
    """Plain-text Word content control showing a bracketed placeholder."""
    sdt = OxmlElement("w:sdt")
    pr = OxmlElement("w:sdtPr")
    al = OxmlElement("w:alias")
    al.set(qn("w:val"), placeholder.strip("[]"))
    tg = OxmlElement("w:tag")
    tg.set(qn("w:val"), tag or placeholder.strip("[]").lower().replace(" ", "_"))
    pr.extend([al, tg, OxmlElement("w:text")])
    content = OxmlElement("w:sdtContent")
    r = OxmlElement("w:r")
    rpr = OxmlElement("w:rPr")
    if bold:
        rpr.append(OxmlElement("w:b"))
    c = OxmlElement("w:color")
    c.set(qn("w:val"), color.lstrip("#"))
    rpr.append(c)
    if size:
        sz = OxmlElement("w:sz")
        sz.set(qn("w:val"), str(int(size * 2)))
        rpr.append(sz)
    t = OxmlElement("w:t")
    t.text = placeholder
    t.set(qn("xml:space"), "preserve")
    r.extend([rpr, t])
    content.append(r)
    sdt.extend([pr, content])
    p._p.append(sdt)
    return sdt


def P(doc_or_cell, text="", style=None, align=None, ph=None, **kw):
    p = doc_or_cell.add_paragraph(style=style)
    if text:
        run(p, text, **kw)
    if ph:
        field(p, ph)
    if align:
        p.alignment = {"center": WD_ALIGN_PARAGRAPH.CENTER, "right": WD_ALIGN_PARAGRAPH.RIGHT}[align]
    return p


def shade_para(p, fill, border=None):
    ppr = p._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill.lstrip("#"))
    ppr.append(shd)
    if border:
        bdr = OxmlElement("w:pBdr")
        for side in ("left",):
            b = OxmlElement(f"w:{side}")
            b.set(qn("w:val"), "single")
            b.set(qn("w:sz"), "24")
            b.set(qn("w:space"), "8")
            b.set(qn("w:color"), border.lstrip("#"))
            bdr.append(b)
        ppr.append(bdr)


def left_rule(p, color=C["gold"], sz=18, space=12):
    ppr = p._p.get_or_add_pPr()
    bdr = OxmlElement("w:pBdr")
    b = OxmlElement("w:left")
    for k, v in (("w:val", "single"), ("w:sz", str(sz)), ("w:space", str(space)), ("w:color", color.lstrip("#"))):
        b.set(qn(k), v)
    bdr.append(b)
    ppr.append(bdr)


def bottom_rule(p, color=C["sage"], sz=6, space=4):
    ppr = p._p.get_or_add_pPr()
    bdr = OxmlElement("w:pBdr")
    b = OxmlElement("w:bottom")
    for k, v in (("w:val", "single"), ("w:sz", str(sz)), ("w:space", str(space)), ("w:color", color.lstrip("#"))):
        b.set(qn(k), v)
    bdr.append(b)
    ppr.append(bdr)


def page_break(doc):
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)


def simple_field(p, instr, placeholder="1"):
    f = OxmlElement("w:fldSimple")
    f.set(qn("w:instr"), instr)
    r = OxmlElement("w:r")
    t = OxmlElement("w:t")
    t.text = placeholder
    r.append(t)
    f.append(r)
    p._p.append(f)


def toc(doc, entries):
    """TOC field (Word rebuilds it with F9) pre-filled with the template's headings."""
    p = doc.add_paragraph()
    r = p.add_run()
    b = OxmlElement("w:fldChar")
    b.set(qn("w:fldCharType"), "begin")
    it = OxmlElement("w:instrText")
    it.set(qn("xml:space"), "preserve")
    it.text = 'TOC \\o "1-2" \\h \\z \\u'
    s = OxmlElement("w:fldChar")
    s.set(qn("w:fldCharType"), "separate")
    r._r.extend([b, it, s])
    for lvl, text, page in entries:
        q = doc.add_paragraph(style="Normal")
        q.paragraph_format.tab_stops.add_tab_stop(Mm(166 if lvl == 1 else 166), alignment=2, leader=1)
        q.paragraph_format.left_indent = Mm(0 if lvl == 1 else 8)
        q.paragraph_format.space_after = Pt(5 if lvl == 1 else 2)
        run(q, text, bold=lvl == 1, color=C["forest"] if lvl == 1 else C["charcoal"], size=11 if lvl == 1 else 9.5)
        run(q, f"\t{page}", color=C["stone"])
    e = doc.add_paragraph().add_run()
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    e._r.append(end)


# ------------------------------------------------------------------ tables
def cell_shade(cell, fill):
    tcpr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill.lstrip("#"))
    tcpr.append(shd)


def cell_margins(table, top=60, bottom=60, left=100, right=100):
    tblpr = table._tbl.tblPr
    m = OxmlElement("w:tblCellMar")
    for side, v in (("top", top), ("left", left), ("bottom", bottom), ("right", right)):
        e = OxmlElement(f"w:{side}")
        e.set(qn("w:w"), str(v))
        e.set(qn("w:type"), "dxa")
        m.append(e)
    tblpr.append(m)


def borders(table, color=C["sage"], sz=4, inside_v=False, outer=True):
    tblpr = table._tbl.tblPr
    b = OxmlElement("w:tblBorders")
    for side in ("top", "left", "bottom", "right", "insideH", "insideV"):
        e = OxmlElement(f"w:{side}")
        none = (side == "insideV" and not inside_v) or (side in ("left", "right") and not inside_v) or (not outer and side in ("top", "bottom"))
        e.set(qn("w:val"), "nil" if none else "single")
        if not none:
            e.set(qn("w:sz"), str(sz))
            e.set(qn("w:color"), color.lstrip("#"))
        b.append(e)
    tblpr.append(b)


def widths(table, mm):
    for row in table.rows:
        for c, w in zip(row.cells, mm):
            c.width = Mm(w)


def rule_cell(cell, side="bottom", color=C["forest"], sz=8):
    tcpr = cell._tc.get_or_add_tcPr()
    tb = tcpr.find(qn("w:tcBorders"))
    if tb is None:
        tb = OxmlElement("w:tcBorders")
        tcpr.append(tb)
    e = OxmlElement(f"w:{side}")
    for k, v in (("w:val", "single"), ("w:sz", str(sz)), ("w:color", color.lstrip("#"))):
        e.set(qn(k), v)
    tb.append(e)


def data_table(doc, headers, rows, col_mm, head_fill=None, zebra=None, align_right=(), total_row=False):
    """Editorial table: a Forest rule under the header, Haze hairlines between rows, no fills."""
    t = doc.add_table(rows=1, cols=len(headers))
    t.alignment = WD_TABLE_ALIGNMENT.LEFT
    borders(t, C["haze"], 4)
    cell_margins(t)
    for j, (c, h) in enumerate(zip(t.rows[0].cells, headers)):
        c.text = ""
        p = c.paragraphs[0]
        p.style = doc.styles["Table Head"]
        run(p, h)
        rule_cell(c, "bottom", C["forest"], 8)
        if j in align_right:
            p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    for i, r in enumerate(rows):
        cells = t.add_row().cells
        for j, (c, v) in enumerate(zip(cells, r)):
            p = c.paragraphs[0]
            p.style = doc.styles["Table Text"]
            if isinstance(v, tuple):     # ("[placeholder]",) → content control
                field(p, v[0])
            else:
                run(p, str(v), bold=total_row and i == len(rows) - 1)
            if j in align_right:
                p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            if total_row and i == len(rows) - 1:
                rule_cell(c, "top", C["forest"], 8)
    widths(t, col_mm)
    # repeat header row on each page
    trpr = t.rows[0]._tr.get_or_add_trPr()
    h = OxmlElement("w:tblHeader")
    trpr.append(h)
    doc.add_paragraph(style="Small")
    return t


def field_table(doc, pairs, label_mm=38, value_mm=128, fill=None):
    """Two-column form: bold label + content-control value."""
    t = doc.add_table(rows=0, cols=2)
    borders(t, C["haze"], 4)
    cell_margins(t, 70, 70, 0, 100)
    for label, ph in pairs:
        a, b = t.add_row().cells
        pa = a.paragraphs[0]
        pa.style = doc.styles["Table Head"]
        run(pa, label)
        if fill:
            cell_shade(a, fill)
        pb = b.paragraphs[0]
        pb.style = doc.styles["Table Text"]
        field(pb, ph)
    widths(t, [label_mm, value_mm])
    doc.add_paragraph(style="Small")
    return t


def callout(doc, title, body, fill=None, rule=None):
    """A note set off by rules above and below: no tint, no box, no coloured bar."""
    t = doc.add_table(rows=1, cols=1)
    borders(t, C["forest"], 6, outer=True)
    cell_margins(t, 120, 140, 0, 0)
    c = t.rows[0].cells[0]
    p = c.paragraphs[0]
    p.style = doc.styles["Overline"]
    run(p, title)
    for line in body if isinstance(body, list) else [body]:
        q = c.add_paragraph(style="Normal")
        if isinstance(line, tuple):
            field(q, line[0])
        else:
            run(q, line)
    doc.add_paragraph(style="Small")
    return t


def signature_block(doc, roles, cols=2):
    t = doc.add_table(rows=0, cols=cols)
    borders(t, "#FFFFFF", 0, outer=False)
    for i in range(0, len(roles), cols):
        cells = t.add_row().cells
        for c, role in zip(cells, roles[i:i + cols]):
            p = c.paragraphs[0]
            p.paragraph_format.space_before = Pt(26)
            bottom_rule(p, C["forest"], 6, 2)
            q = c.add_paragraph(style="Table Text")
            field(q, "[Name]", bold=True)
            q2 = c.add_paragraph(style="Small")
            run(q2, role)
            q3 = c.add_paragraph(style="Small")
            run(q3, "Date: ")
            field(q3, "[DD Month YYYY]")
    doc.add_paragraph(style="Small")


def checkbox_row(p, options):
    for o in options:
        run(p, "☐ ", color=C["forest"], size=11)
        run(p, o + "     ")


# ------------------------------------------------------------------ images
def picture(doc_or_par, path, width_mm=None, height_mm=None):
    p = doc_or_par if hasattr(doc_or_par, "add_run") else doc_or_par.add_paragraph()
    r = p.add_run()
    r.add_picture(str(path), width=Mm(width_mm) if width_mm else None, height=Mm(height_mm) if height_mm else None)
    return p, r


def float_picture(paragraph, path, x_mm, y_mm, w_mm, h_mm, behind=True, rel="page"):
    """Anchor an image at an absolute page position (full-bleed covers, bands, watermarks)."""
    r = paragraph.add_run()
    r.add_picture(str(path), width=Mm(w_mm), height=Mm(h_mm))
    inline = r._r.xpath(".//wp:inline")[0]
    anchor = OxmlElement("wp:anchor")
    for k, v in dict(distT="0", distB="0", distL="0", distR="0", simplePos="0", relativeHeight=str(251658240 + next(_ids)),
                     behindDoc="1" if behind else "0", locked="1", layoutInCell="1", allowOverlap="1").items():
        anchor.set(k, v)
    sp = OxmlElement("wp:simplePos")
    sp.set("x", "0")
    sp.set("y", "0")
    anchor.append(sp)
    for axis, val in (("H", x_mm), ("V", y_mm)):
        pos = OxmlElement(f"wp:position{axis}")
        pos.set("relativeFrom", rel)
        off = OxmlElement("wp:posOffset")
        off.text = str(int(Mm(val)))
        pos.append(off)
        anchor.append(pos)
    anchor.append(inline.find(qn("wp:extent")))
    ee = OxmlElement("wp:effectExtent")
    for k in "ltrb":
        ee.set(k, "0")
    anchor.append(ee)
    anchor.append(OxmlElement("wp:wrapNone"))
    docpr = inline.find(qn("wp:docPr"))
    docpr.set("id", str(next(_ids)))
    anchor.append(docpr)
    anchor.append(inline.find(qn("wp:cNvGraphicFramePr")))
    anchor.append(inline.find(qn("a:graphic")))
    inline.getparent().replace(inline, anchor)
    return r


# ------------------------------------------------------------------ headers & footers
def contact_footer(section, running=None, page_numbers=True, dark=False):
    f = section.footer
    f.is_linked_to_previous = False
    p = f.paragraphs[0]
    p.style = None          # Normal: drops the Footer style's default centre/right tab stops
    ppr = p._p.get_or_add_pPr()
    bdr = OxmlElement("w:pBdr")
    tp = OxmlElement("w:top")
    for k, v in (("w:val", "single"), ("w:sz", "4"), ("w:space", "6"), ("w:color", C["haze"].lstrip("#"))):
        tp.set(qn(k), v)
    bdr.append(tp)
    ppr.append(bdr)
    width = section.page_width - section.left_margin - section.right_margin
    p.paragraph_format.tab_stops.add_tab_stop(width, alignment=2)
    run(p, "Destination Nigeria", bold=True, color=C["forest"], size=7.5)
    run(p, "   ", color=C["stone"], size=7.5)
    if running:
        run(p, running, color=C["stone"], size=7.5)
    else:
        run(p, f'{CONTACT["web"]}   {CONTACT["email"]}   {CONTACT["phone"]}', color=C["stone"], size=7.5)
    if page_numbers:
        run(p, "\t", size=7.5)
        r = run(p, "", color=C["forest"], size=7.5)
        simple_field(p, "PAGE", "1")


def logo_header(section, logo_mm=44, right_lines=None, first=False):
    h = section.first_page_header if first else section.header
    h.is_linked_to_previous = False
    p = h.paragraphs[0]
    width = section.page_width - section.left_margin - section.right_margin
    p.paragraph_format.tab_stops.add_tab_stop(width, alignment=2)
    r = p.add_run()
    r.add_picture(str(LOGO), width=Mm(logo_mm))
    if right_lines:
        # contact block as a right-aligned paragraph group under the logo row
        for line in right_lines:
            q = h.add_paragraph(style=None)
            q.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            q.paragraph_format.space_after = Pt(0)
            if isinstance(line, tuple):
                field(q, line[0], size=7.5)
            else:
                run(q, line, size=7.5, color=C["stone"])
    return h


def small_header(section, text):
    h = section.header
    h.is_linked_to_previous = False
    p = h.paragraphs[0]
    p.style = None
    width = section.page_width - section.left_margin - section.right_margin
    p.paragraph_format.tab_stops.add_tab_stop(width, alignment=2)
    p.add_run().add_picture(str(LOGO), width=Mm(30))
    run(p, "\t" + text, size=7.5, color=C["stone"], caps=True, spacing=0.5)
    return h
