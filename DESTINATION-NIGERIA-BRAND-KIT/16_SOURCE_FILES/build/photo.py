"""Photography library: client-supplied images → verified, graded brand masters + register.

Supplied files are copied untouched into 06/SUPPLIED_BY_CLIENT. Accepted images get one
consistent, restrained brand grade (no filters, no sky replacement, nothing added or removed):
a gentle tone curve, saturation reined in, shadows cooled towards Forest and highlights
warmed towards Paper. Rejected images are kept in _rejected with the reason.
"""
import csv
import shutil
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

from brand import KIT

SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else None
P6 = KIT / "06_PHOTOGRAPHY_AND_MEDIA"
LIB = P6 / "LIBRARY"
SUP = P6 / "SUPPLIED_BY_CLIENT"

# slug, supplied file, subject, place, state, id confidence, per-image tweaks, notes
ACCEPT = [
    ("zuma-rock", "zuma-rock.jpg", "Zuma Rock from the Abuja–Kaduna road", "Madalla", "Niger State",
     "High: landmark is unmistakable", dict(exp=0.02, sat=0.95, warm=0.02),
     "Canon EOS 30D, 2008 (EXIF). Strongest image for the brand: an inselberg, the same landform drawn in the logo."),
    ("agbokim-waterfalls", "Agbokim-Waterfalls.webp", "Agbokim Waterfalls with a seated visitor", "Etung", "Cross River State",
     "High: file name and the seven-stream cascade", dict(exp=0.0, sat=0.92, warm=0.01),
     "Visitor seen from behind, not identifiable. Largest file supplied (1920 px)."),
    ("tarkwa-bay", "Tarkwa-Bay-Beach.jpg", "Tarkwa Bay beach shelters at sunset", "Lagos", "Lagos State",
     "Medium: only the file name says Tarkwa Bay; turquoise water and white sand are unusual for Lagos. Client to confirm the source before captioning", dict(exp=-0.02, sat=0.8, warm=0.0, flatten=0.35, demagenta=1.0),
     "Use sparingly and never as a hero until the location is confirmed. Supplied file is heavily HDR-processed; the grade reduces saturation and halo contrast. Do not sharpen further."),
    ("idanre-hills", "breathtaking-views-and-1024x768.jpg", "Idanre town seen from Idanre Hill", "Idanre", "Ondo State",
     "Medium-high: granite domes and hill-top shelter match Idanre Hill; client to confirm", dict(exp=0.03, sat=0.92, warm=0.02),
     "Contains an identifiable person (lower right). Use crops that exclude him unless a release is obtained."),
    ("obudu-road", "images (10).jpeg", "Hairpin road up to the Obudu plateau", "Obanliku", "Cross River State",
     "High: the Obudu Mountain Resort road is distinctive", dict(exp=0.0, sat=0.9, warm=0.01),
     "Low resolution (515 px). Small sizes only, or as an engraving source."),
    ("highlands-valley", "images (7).jpeg", "Green highland valleys", "Highlands", "Nigeria (location not confirmed)",
     "Low: probably Obudu or Mambilla; do not caption with a place name", dict(exp=0.0, sat=0.9, warm=0.02),
     "Low resolution (697 px). Use small or as texture behind type, uncaptioned."),
    ("highlands-ridges", "images (5).jpeg", "Grassy ridges under cloud", "Highlands", "Nigeria (location not confirmed)",
     "Low: do not caption with a place name", dict(exp=0.0, sat=0.9, warm=0.02),
     "Low resolution (516 px). Small sizes only."),
    ("lekki-ikoyi-bridge", "images (8).jpeg", "Lekki–Ikoyi Link Bridge at dusk", "Lagos", "Lagos State",
     "High: the cable-stayed bridge is unmistakable", dict(exp=0.03, sat=0.9, warm=0.0),
     "Low resolution (399 × 501 px). Small sizes only, or as an engraving source."),
    ("bowers-tower", "images (9).jpeg", "Bower's Tower on Oke-Are hill above Ibadan", "Ibadan", "Oyo State",
     "High: the tower is unmistakable", dict(exp=0.0, sat=0.9, warm=0.02),
     "Low resolution (596 px). Small sizes only, or as an engraving source."),
]
REJECT = [
    ("Crystal-Bay-Nusa-Penida-1.jpg.webp", "Not Nigeria: Crystal Bay is on Nusa Penida, Bali, Indonesia (named in the file). Using it would misrepresent the destination."),
    ("caption.jpg", "Almost certainly not Nigeria: the single plunge fall, basalt amphitheatre and brown pool match Chamarel Falls, Mauritius. Rejected unless the photographer can prove a Nigerian location."),
    ("images (6).jpeg", "Not a photograph: a digital composite (Zuma Rock, the National Mosque, an invented waterfall, huts and hot-air balloons in one view). It shows a place that does not exist."),
    ("zuma-rock (1).jpg", "Byte-for-byte duplicate of zuma-rock.jpg (same MD5)."),
]


def srgb_to_lin(x):
    return np.where(x <= 0.04045, x / 12.92, ((x + 0.055) / 1.055) ** 2.4)


def lin_to_srgb(x):
    x = np.clip(x, 0, 1)
    return np.where(x <= 0.0031308, x * 12.92, 1.055 * x ** (1 / 2.4) - 0.055)


def grade(im, exp=0.0, sat=0.92, warm=0.015, flatten=0.0, demagenta=0.0):
    a = np.asarray(im.convert("RGB")).astype(np.float32) / 255
    if flatten:  # tame over-processed local contrast: blend towards a soft version in luminance only
        soft = np.asarray(im.convert("RGB").filter(ImageFilter.GaussianBlur(18))).astype(np.float32) / 255
        ly, lsoft = a.mean(2, keepdims=True), soft.mean(2, keepdims=True)
        a = np.clip(a + flatten * 0.35 * (lsoft - ly), 0, 1)
    a = np.clip(a * (1 + exp), 0, 1)
    if demagenta:  # HDR tone-mapping left violet casts in sand shadows: pull them back to neutral warm
        r, g, b = a[..., 0], a[..., 1], a[..., 2]
        m = np.clip(((r + b) / 2 - g) * 6, 0, 1) * np.clip((b - g) * 6, 0, 1) * demagenta
        a[..., 2] = b - m * (b - g) * 0.9
        a[..., 0] = r - m * np.clip(r - g, 0, None) * 0.3
    # tone: gentle filmic S, lifted black, soft shoulder
    t = 0.5 + (a - 0.5) * 1.05
    t = 0.025 + t * (0.965)
    # saturation in a perceptual-ish way
    y = (0.2126 * t[..., 0] + 0.7152 * t[..., 1] + 0.0722 * t[..., 2])[..., None]
    t = y + (t - y) * sat
    # split tone: shadows towards Forest, highlights towards Paper
    forest = np.array([0x10, 0x34, 0x28]) / 255
    paper = np.array([0xF5, 0xE6, 0xC8]) / 255
    ws = np.clip(1 - y / 0.45, 0, 1) ** 2 * 0.10
    wh = np.clip((y - 0.6) / 0.4, 0, 1) ** 1.5 * (0.05 + warm)
    t = t * (1 - ws) + forest * ws
    t = t * (1 - wh) + (t * paper / paper.max()) * wh + paper * wh * 0.15
    return Image.fromarray((np.clip(t, 0, 1) * 255 + 0.5).astype(np.uint8))


def main():
    assert SRC and SRC.is_dir(), "usage: python3 photo.py <folder with supplied images>"
    SUP.mkdir(parents=True, exist_ok=True)
    (SUP / "_rejected").mkdir(exist_ok=True)
    LIB.mkdir(parents=True, exist_ok=True)
    rows = []
    for i, (slug, fn, subj, place, state, conf, tw, notes) in enumerate(ACCEPT, 1):
        if SRC.resolve() != SUP.resolve():
            shutil.copy2(SRC / fn, SUP / fn)
        im = Image.open(SUP / fn)
        g = grade(im, **tw)
        out = LIB / f"DN_photo_{slug}.jpg"
        g.save(out, quality=93, subsampling=0, optimize=True)
        w, h = im.size
        cap = f"{place}, {state}" if not state.startswith("Nigeria") else "Nigeria"
        rows.append(dict(asset_id=f"DN-IMG-{i:04d}", file_name=out.name, supplied_file=fn,
                         subject_and_verified_location=f"{subj} — {cap}", identification_confidence=conf,
                         pixel_size=f"{w}x{h}", max_print_width_mm_at_300ppi=round(w / 300 * 25.4),
                         photographer_or_creator="Unknown (supplied by client)", source_or_agency="Supplied by Destination Nigeria",
                         licence_type="TO BE CONFIRMED BY CLIENT", licence_id_or_url="", licence_expiry="", territory="",
                         model_release="N.A." if "person" not in notes.lower() and "visitor" not in subj.lower() else "Not obtained",
                         property_release="N.A.", community_consent="N.A.", credit_line="Photo: [photographer to be confirmed]",
                         ai_generated="No (visual inspection)", edits="Brand grade only: tone curve, saturation, split tone. Nothing added or removed.",
                         approved_by="", approved_date="", notes=notes))
    for fn, why in REJECT:
        if (SRC / fn).exists() and SRC.resolve() != SUP.resolve():
            shutil.copy2(SRC / fn, SUP / "_rejected" / fn)
        rows.append(dict(asset_id="REJECTED", supplied_file=fn, notes=why))
    keys = list(rows[0].keys())
    with open(P6 / "SOURCE_RECORDS" / "image-register.csv", "w", newline="", encoding="utf-8") as f:
        wr = csv.DictWriter(f, fieldnames=keys)
        wr.writeheader()
        for r in rows:
            wr.writerow({k: r.get(k, "") for k in keys})
    print(f"graded {len(ACCEPT)}, rejected {len(REJECT)}")


if __name__ == "__main__":
    main()
