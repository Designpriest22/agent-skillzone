"""Engraved plates of real places, traced from the client-supplied photographs (see 06 register).

Each plate is a pure-vector SVG in one ink. The gold sun disc, where used, is the logo's sun:
it is placed only in the open sky of a plate, never over the subject.
"""
import json
import sys
import time
from brand import C, KIT, svg_doc, write
from engrave import flow_plate

SUP = KIT / "06_PHOTOGRAPHY_AND_MEDIA" / "SUPPLIED_BY_CLIENT"
OUT = "04_VECTOR_GRAPHICS_AND_ICONS/ENGRAVED_PLATES"

BOLD = dict(field=dict(sigma_grad=2, sigma_tensor=14, base_weight=0.25),
            main=dict(dsep=7.5, wmax=0.42, wmin=0.045, power=1.15, thresh=0.055))

# slug, source, title (place, state), w, h, crop, tone, extra, sun (cx, cy, r) in plate units or None
CALM = dict(sigma_grad=3, sigma_tensor=22, base_weight=0.45, coherence_gain=1.6)
PLATES = [
    ("zuma-rock", "zuma-rock.jpg", "Zuma Rock, Niger State", 1600, 1000, (0.02, 0.04, 0.98, 0.94),
     dict(clarity=1.4, lo=0.18, hi=1.0, smooth=7, passes=2), dict(fade=dict(bottom=0.3, noise=0.05), sky=0.12),
     (1235, 215, 62)),
    ("zuma-rock-quiet", "zuma-rock.jpg", "Zuma Rock, Niger State (quiet sky, for tone-on-tone use)", 1600, 1000, (0.02, 0.04, 0.98, 0.94),
     dict(clarity=1.4, lo=0.18, hi=1.0, smooth=7, passes=2), dict(fade=dict(bottom=0.3, noise=0.05), sky=0.0), None),
    ("zuma-rock-vignette", "zuma-rock.jpg", "Zuma Rock, Niger State (vignette: no sky, faded edges)", 1600, 1000, (0.02, 0.04, 0.98, 0.94),
     dict(clarity=1.4, lo=0.18, hi=1.0, smooth=7, passes=2), dict(fade=dict(bottom=0.32, left=0.14, right=0.14, noise=0.06), sky=0.0), None),
    ("agbokim-waterfalls", "Agbokim-Waterfalls.webp", "Agbokim Waterfalls, Cross River State", 1200, 1500, (0.05, 0.0, 0.685, 1.0),
     dict(clarity=1.5, lo=0.18, hi=0.92, smooth=6, passes=2, gamma=0.95),
     dict(field=dict(sigma_grad=2.5, sigma_tensor=16, base_weight=0.3, base_angle=90),
          main=dict(dsep=8.5, wmax=0.44, wmin=0.03, power=1.1, thresh=0.06), fade=dict(bottom=0.12, noise=0.04)), None),
]


def build(slugs=None, inks=(("forest", "ivory"), ("ivory", "forest"))):
    jobs = []
    for slug, src, title, w, h, crop, tone, extra, sun in PLATES:
        if slugs and slug not in slugs:
            continue
        t = time.time()
        kw = dict(BOLD)
        kw.update({k: v for k, v in extra.items() if k in ("field", "main", "cross", "fade", "sky")})
        holes = [sun] if sun else []
        res, D = flow_plate(str(SUP / src), w, h, crop=crop, tone=tone, holes=holes, **kw)
        for ink, paper in inks:
            body = "".join(f'<path fill="{C[ink]}" d="{d}"/>' for d in res.values())
            sundisc = f'<circle cx="{sun[0]}" cy="{sun[1]}" r="{sun[2]}" fill="{C["gold"]}"/>' if sun else ""
            for bg in (True, False):
                rect = f'<rect width="{w}" height="{h}" fill="{C[paper]}"/>' if bg else ""
                name = f"DN_plate_{slug}_{ink}" + ("" if bg else "_transparent")
                svg = svg_doc(w, h, rect + f'<g id="engraving">{body}</g>' + (f'<g id="sun">{sundisc}</g>' if sundisc else ""),
                              f"Engraved plate: {title}",
                              "Vector line engraving traced from a client-supplied photograph of this real place. One ink"
                              + (", plus the logo's Sun Gold disc." if sun else "."))
                write(f"{OUT}/SVG/{name}.svg", svg)
                if bg:
                    jobs.append({"src": str(KIT / OUT / "SVG" / f"{name}.svg"), "out": str(KIT / OUT / "PNG" / f"{name}.png"),
                                 "w": w, "h": h, "scale": 1})
        print(slug, round(time.time() - t, 1), "s")
    (KIT / "16_SOURCE_FILES/build/_jobs").mkdir(exist_ok=True)
    json.dump(jobs, open(KIT / "16_SOURCE_FILES/build/_jobs/_jobs_plates.json", "w"), indent=1)
    return jobs


if __name__ == "__main__":
    build(sys.argv[1:] or None)
