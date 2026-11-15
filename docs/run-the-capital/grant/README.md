# Run The Capital: ₦50M grant pack (TCM)

| File | What it is |
|---|---|
| `01_TCM_Company_Profile.pdf` | Background, operations, achievements, services, leadership (TCM facts only) |
| `02_Project_Description.pdf` | Project, objectives, expected impact, funding requirement |
| `03_Business_Plan.pdf` | Operations, market, competition, revenue model, sustainability, growth |
| `04_Project_Budget.pdf` | ₦50,000,000 by category and line item, spend by quarter |
| `05_Implementation_Plan.pdf` | Phases, timeline, deliverables, M&E, risks, governance |
| `TCM_RunTheCapital_Grant_Pack.pdf` | All five in one file |
| `TCM_RunTheCapital_Budget.xlsx` | Budget workbook with live formulas and a ₦50M check cell |
| `grant-pack.html` | The designed web version (built from `grant-pack.src.html`) |

Rebuild: `python3 docs/run-the-capital/grant/build.py && node docs/run-the-capital/grant/pdf.js`

## Sources
- TCM figures (10 years, 100+ events, 50,000+ people, 20+ brands), history, services, partners, talent and leadership: thecapitalmovement.com (this repository’s site files).
- Africa games market $1.8B (2024, +12%), 349M players; Egypt $368M, Nigeria $300M, South Africa $278M: Carry1st × Newzoo, *Africa Games Report*, Feb 2025.
- Nigeria 46.5M gamers, ~90% mobile: Maliyo Games, *Nigeria Gaming & Esports Report 2025*.
- Broadband penetration 50.58% (Nov 2025): NCC data via Nairametrics, 25 Dec 2025.
- Abuja metro ≈ 4.2M (2025 estimate): published metro projections; no official 2025 census figure exists.
- Retention benchmarks D1 ≈ 22–27%, D7 ≈ 8–13%, D30 ≈ 3–7%: GameAnalytics 2026 benchmarks and genre summaries.
- Exchange rate ₦1,347/$: CBN official rate, 6 Nov 2026.

## Assumptions to confirm before submission
- **Funder:** the pack is written for a creative-economy / digital-innovation funder. Tailor section names and length to the actual call (e.g. iDICE, a foundation or a corporate programme).
- **Gamer share 20%:** 46.5M players ÷ ~230M population; used to size the Abuja market.
- **Targets (updated from the deck):** 130,000 players, 90,000 profiles, 60 trained, 24 stages and 18% day-7 retention by month 12. These are planning estimates, not results. The analytics dashboard image uses demo data.
- **Artist licences:** C1 assumes ₦1.25M per artist for four artists; replace with negotiated fees.
