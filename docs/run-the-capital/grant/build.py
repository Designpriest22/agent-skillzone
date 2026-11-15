"""Builds the grant pack: inlines images into grant-pack.html and writes the budget workbook.
Usage: python3 docs/run-the-capital/grant/build.py   (PDFs: node docs/run-the-capital/grant/pdf.js)"""
import base64, mimetypes, re
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

HERE = Path(__file__).resolve().parent


def inline_images():
    src = (HERE / "grant-pack.src.html").read_text(encoding="utf-8")

    def repl(m):
        p = HERE / m.group(1)
        mime = mimetypes.guess_type(p.name)[0] or "image/jpeg"
        return f'src="data:{mime};base64,{base64.b64encode(p.read_bytes()).decode()}"'

    out = re.sub(r'src="(img/[^"]+)"', repl, src)
    (HERE / "grant-pack.html").write_text(out, encoding="utf-8")
    print(f"grant-pack.html {len(out) / 1e6:.2f} MB")


# Code, item, quantity text, quantity number, unit cost, quarter split (Q1..Q4 share of the line)
LINES = [
    ("A", "Game content and art", None),
    ("A1", "Fighter animation sets", ("14 fighters", 14, 300_000, (0.35, 0.65, 0, 0))),
    ("A2", "Stage environment art (9 new substages)", ("9", 9, 250_000, (0.2, 0.3, 0.3, 0.2))),
    ("A3", "New bosses, art and animation", ("3", 3, 350_000, (0, 0.34, 0.33, 0.33))),
    ("A4", "Remaining portraits and interface art", ("1 lot", 1, 1_000_000, (0.6, 0.4, 0, 0))),
    ("A5", "Original music and sound (Abuja producers)", ("6 tracks", 6, 250_000, (0.33, 0.33, 0.17, 0.17))),
    ("A6", "Game and level designer (contract)", ("8 months", 8, 250_000, (0.25, 0.375, 0.375, 0))),
    ("A7", "QA testers", ("2 × 6 months", 12, 100_000, (0.17, 0.5, 0.33, 0))),
    ("A8", "Device test lab (entry and mid-range Android)", ("10 phones", 10, 130_000, (1, 0, 0, 0))),
    ("B", "Engineering and hosting", None),
    ("B1", "Lead engineer", ("9 months", 9, 500_000, (0.33, 0.33, 0.34, 0))),
    ("B2", "Game developer", ("9 months", 9, 350_000, (0.33, 0.33, 0.34, 0))),
    ("B3", "Cloud hosting, database, CDN, monitoring", ("12 months", 12, 85_000, (0.25, 0.25, 0.25, 0.25))),
    ("B4", "Domain, email, tools and licences", ("1 lot", 1, 330_000, (1, 0, 0, 0))),
    ("C", "Artist rights and talent", None),
    ("C1", "Name and likeness licences", ("4 artists", 4, 1_250_000, (1, 0, 0, 0))),
    ("C2", "Artist launch appearances and content", ("4", 4, 375_000, (0, 0.75, 0.25, 0))),
    ("C3", "Talent agreements (legal drafting)", ("1 lot", 1, 500_000, (1, 0, 0, 0))),
    ("D", "Launch and marketing", None),
    ("D1", "Festival launch activation (stage, screens, QR, crew)", ("1", 1, 3_500_000, (0, 1, 0, 0))),
    ("D2", "Targeted social ads, Abuja", ("5 months", 5, 500_000, (0, 0.4, 0.4, 0.2))),
    ("D3", "Creator and influencer content", ("10", 10, 150_000, (0, 0.5, 0.3, 0.2))),
    ("D4", "Campus ambassador programme", ("10 campuses", 10, 50_000, (0, 0.6, 0.4, 0))),
    ("D5", "Tournament prize pool and production", ("1", 1, 1_500_000, (0, 0, 1, 0))),
    ("E", "Capital Game Lab (training)", None),
    ("E1", "Trainee stipends (30 trainees × 12 weeks)", ("360 trainee-weeks", 360, 7_500, (0.25, 0.25, 0.25, 0.25))),
    ("E2", "Facilitators and mentors", ("2 cohorts", 2, 450_000, (0.25, 0.25, 0.25, 0.25))),
    ("E3", "Venue, data and equipment", ("2 cohorts", 2, 450_000, (0.25, 0.25, 0.25, 0.25))),
    ("F", "Research and evaluation", None),
    ("F1", "Player research sessions (40 players each)", ("6", 6, 150_000, (0.33, 0.33, 0.17, 0.17))),
    ("F2", "Surveys and participant incentives", ("1 lot", 1, 300_000, (0, 0.5, 0, 0.5))),
    ("F3", "Independent end-of-project evaluation", ("1", 1, 800_000, (0, 0, 0, 1))),
    ("G", "Legal and compliance", None),
    ("G1", "Data protection review and policies (NDPA 2023)", ("1", 1, 600_000, (1, 0, 0, 0))),
    ("G2", "Contracts, company secretarial, IP registration", ("1 lot", 1, 500_000, (0.6, 0.2, 0.2, 0))),
    ("G3", "External audit of grant funds", ("1", 1, 400_000, (0, 0, 0, 1))),
    ("H", "Contingency (4%)", None),
    ("H1", "Contingency, released only with funder approval", ("1", 1, 2_000_000, (0.25, 0.25, 0.25, 0.25))),
]


def workbook():
    wb = Workbook()
    ws = wb.active
    ws.title = "Budget"
    red, black, card = "E2342E", "0D0C0C", "F4EFEA"
    thin = Side(style="thin", color="D9D2CC")
    ws["A1"] = "Run The Capital · Project budget · The Capital Movement (TCM)"
    ws["A1"].font = Font(bold=True, size=14, color=black)
    ws["A2"] = "All figures in Naira. Grant request ₦50,000,000. Exchange rate cell F2 (CBN official, 6 Nov 2026)."
    ws["A2"].font = Font(italic=True, color="6B6560")
    ws["E2"] = "₦ per US$"
    ws["F2"] = 1347
    head = ["Code", "Item", "Quantity", "Qty (number)", "Unit cost (₦)", "Total (₦)", "Q1 (₦)", "Q2 (₦)", "Q3 (₦)", "Q4 (₦)"]
    ws.append([])
    ws.append(head)
    hr = ws.max_row
    for c in range(1, len(head) + 1):
        cell = ws.cell(hr, c)
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill("solid", fgColor=black)
        cell.alignment = Alignment(vertical="center", wrap_text=True)
    group_rows, item_rows = [], {}
    current = None
    for code, item, spec in LINES:
        if spec is None:
            ws.append([code, item])
            current = ws.max_row
            group_rows.append(current)
            item_rows[current] = []
            for c in range(1, len(head) + 1):
                ws.cell(current, c).fill = PatternFill("solid", fgColor=card)
                ws.cell(current, c).font = Font(bold=True)
            continue
        qty_text, qty, unit, split = spec
        ws.append([code, item, qty_text, qty, unit])
        r = ws.max_row
        ws.cell(r, 6, f"=D{r}*E{r}")
        for i, share in enumerate(split):
            ws.cell(r, 7 + i, f"=ROUND(F{r}*{share},0)" if i < 3 else f"=F{r}-G{r}-H{r}-I{r}")
        item_rows[current].append(r)
    for g in group_rows:
        rows = item_rows[g]
        for col in "FGHIJ":
            ws[f"{col}{g}"] = f"=SUM({col}{rows[0]}:{col}{rows[-1]})"
    ws.append([])
    ws.append(["", "Total grant requested"])
    t = ws.max_row
    for col in "FGHIJ":
        ws[f"{col}{t}"] = "=" + "+".join(f"{col}{g}" for g in group_rows)
    for c in range(1, len(head) + 1):
        ws.cell(t, c).font = Font(bold=True, color="FFFFFF")
        ws.cell(t, c).fill = PatternFill("solid", fgColor=red)
    ws.append(["", "Total in US$"])
    u = ws.max_row
    ws[f"F{u}"] = f"=F{t}/$F$2"
    ws[f"F{u}"].number_format = '"$"#,##0'
    ws.append(["", "Check: equals ₦50,000,000"])
    k = ws.max_row
    ws[f"F{k}"] = f'=IF(F{t}=50000000,"OK","CHECK")'
    for row in ws.iter_rows(min_row=hr + 1, max_row=t):
        for cell in row:
            cell.border = Border(bottom=thin)
            if cell.column >= 5:
                cell.number_format = "#,##0"
    widths = [7, 50, 18, 12, 15, 15, 14, 14, 14, 14]
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.freeze_panes = ws.cell(hr + 1, 3)

    # Summary sheet linked to the budget
    s = wb.create_sheet("Summary")
    s["A1"] = "Budget summary by category"
    s["A1"].font = Font(bold=True, size=14)
    s.append(["Category", "Total (₦)", "Share"])
    for c in range(1, 4):
        s.cell(2, c).font = Font(bold=True, color="FFFFFF")
        s.cell(2, c).fill = PatternFill("solid", fgColor=black)
    for g in group_rows:
        r = s.max_row + 1
        s.cell(r, 1, f"=Budget!B{g}")
        s.cell(r, 2, f"=Budget!F{g}").number_format = "#,##0"
        s.cell(r, 3, f"=B{r}/Budget!$F${t}").number_format = "0%"
    r = s.max_row + 1
    s.cell(r, 1, "Total").font = Font(bold=True)
    s.cell(r, 2, f"=SUM(B3:B{r - 1})").number_format = "#,##0"
    s.cell(r, 3, f"=SUM(C3:C{r - 1})").number_format = "0%"
    s.column_dimensions["A"].width = 34
    s.column_dimensions["B"].width = 16
    s.column_dimensions["C"].width = 10
    out = HERE / "TCM_RunTheCapital_Budget.xlsx"
    wb.save(out)
    # sanity check: totals in Python must equal 50M, per category and by quarter
    total = sum(s_[1] * s_[2] for _, _, s_ in LINES if s_)
    quarters = [0, 0, 0, 0]
    for _, _, spec in LINES:
        if spec:
            amt = spec[1] * spec[2]
            for i in range(3):
                quarters[i] += round(amt * spec[3][i])
            quarters[3] += amt - sum(round(amt * spec[3][i]) for i in range(3))
    print("total", total, "quarters", quarters)
    assert total == 50_000_000, total


if __name__ == "__main__":
    inline_images()
    workbook()
