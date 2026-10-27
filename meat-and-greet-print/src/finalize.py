"""Post-process rendered PDFs: printer boxes, previews, LED exports."""
import os
import subprocess

from pypdf import PdfReader, PdfWriter
from pypdf.generic import RectangleObject

import lib

PREV = os.path.join(lib.BUILD, 'preview')
MM = 72 / 25.4


def pdf_path(d):
    return os.path.join(lib.BUILD, 'pdf', d.folder, d.fname() + '.pdf')


def set_boxes(d):
    p = pdf_path(d)
    r = PdfReader(p)
    w = PdfWriter(clone_from=r)
    b = d.bleed / d.scale * MM
    for pg in w.pages:
        mb = pg.mediabox
        W, H = float(mb.width), float(mb.height)
        pg.bleedbox = RectangleObject([0, 0, W, H])
        pg.trimbox = RectangleObject([b, b, W - b, H - b])
        pg.artbox = RectangleObject([b, b, W - b, H - b])
    w.add_metadata({'/Title': f'Meat & Greet - {d.num} {d.title}', '/Author': 'TCM - Meat & Greet Halloween BBQ Party',
                    '/Subject': f'Finished {d.w:g}x{d.h:g} mm, bleed {d.bleed:g} mm' + (', scale 1:10' if d.scale == 10 else '')})
    with open(p, 'wb') as f:
        w.write(f)


def preview(d, page_index, longest=1800, out=None, crop_bleed=True):
    p = pdf_path(d)
    wi, hi = d.w / d.scale / 25.4, d.h / d.scale / 25.4
    dpi = longest / max(wi, hi)
    out = out or os.path.join(PREV, f'{d.fname()}_p{page_index + 1}')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    args = ['pdftoppm', '-r', f'{dpi:.3f}', '-f', str(page_index + 1), '-l', str(page_index + 1), '-png', '-singlefile']
    if crop_bleed:
        bpx = d.bleed / d.scale / 25.4 * dpi
        args += ['-x', str(round(bpx)), '-y', str(round(bpx)), '-W', str(round(wi * dpi)), '-H', str(round(hi * dpi))]
    subprocess.run(args + [p, out], check=True)
    return out + '.png'


def post(docs):
    for d in docs:
        set_boxes(d)
        for i in d.proof_pages:
            if i < len(d.pages):
                preview(d, i)
        if getattr(d, 'png_px', None):
            pxw, pxh = d.png_px
            out = os.path.join(lib.BUILD, 'pdf', d.folder, d.fname())
            dpi = pxw / (d.w / 25.4)
            subprocess.run(['pdftoppm', '-r', f'{dpi:.4f}', '-png', '-singlefile', '-scale-to-x', str(pxw), '-scale-to-y', str(pxh),
                            pdf_path(d), out], check=True)
        print('ok', d.fname())
