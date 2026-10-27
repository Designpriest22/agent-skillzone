"""Print-production framework.

A Doc is one checklist item: finished size in mm, bleed, optional scale (1:10 for
large format), one or more HTML pages. Pages are rendered by headless Chromium to
vector PDF (type and shapes stay vector; textures are embedded image layers).
"""
import html as _html
import json
import os
from dataclasses import dataclass, field

ROOT = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(os.path.dirname(ROOT), 'build')
FONTS = os.path.join(ROOT, 'fonts')
ASSETS = os.path.join(ROOT, 'assets')
TEX = os.path.join(BUILD, 'tex')

BLACK, CHAR, RED, EMBER, BONE, WHITE = '#0B0909', '#2A2524', '#B3121C', '#E0592A', '#EFE6D6', '#FFFFFF'

EVENT = {
    'name': 'Meat & Greet',
    'sub': 'Halloween BBQ Party',
    'date': 'Saturday 31 October',
    'date_short': '31.10',
    'producer': 'TCM',
    'tagline': 'Enter if you dare. Leave full.',
    'headliner': 'FIRSTKLAZ MEATING',
}


def esc(s):
    return _html.escape(str(s))


def tex(name):
    return 'file://' + os.path.join(TEX, name)


def asset(name):
    return 'file://' + os.path.join(ASSETS, name)


_LOGO = None


def logo_svg(cls='logo', style='', variant='color'):
    """Inline vector logo. variant: color | bone (one-colour) | knock (black keyline, for light backgrounds)."""
    global _LOGO
    if _LOGO is None:
        _LOGO = open(os.path.join(ASSETS, 'mg-logo-paths.svg')).read()
    s = _LOGO.replace('<svg ', f'<svg class="{cls} mg-{variant}" style="{style}" preserveAspectRatio="xMidYMid meet" ', 1)
    return s


def logo_img(style='', variant='color'):
    """Raster logo (rendered from the vector at 2400 px) for small, many-page items."""
    return f'<img src="{asset("mg-logo-" + variant + ".png")}" style="{style}" alt="">'


FONT_FACES = {
    'Anton': 'Anton.ttf', 'Brush': 'SedgwickAveDisplay.ttf', 'Case': 'SpecialElite.ttf', 'Rye': 'Rye.ttf',
    'Marker': 'PermanentMarker.ttf', 'Chalk': 'RockSalt.ttf', 'Knewave': 'Knewave.ttf', 'WetPaint': 'RubikWetPaint.ttf',
}


def font_css():
    out = []
    for fam, f in FONT_FACES.items():
        out.append(f"@font-face{{font-family:'{fam}';src:url('file://{FONTS}/{f}')}}")
    for w in (400, 500, 600, 700, 800, 900):
        out.append(f"@font-face{{font-family:'Archivo';font-weight:{w};src:url('file://{FONTS}/Archivo-{w}.ttf')}}")
    for w in (400, 600, 700):
        out.append(f"@font-face{{font-family:'Narrow';font-weight:{w};src:url('file://{FONTS}/ArchivoNarrow-{w}.ttf')}}")
    for w in (400, 600):
        out.append(f"@font-face{{font-family:'Mono';font-weight:{w};src:url('file://{FONTS}/PlexMono-{w}.ttf')}}")
    return '\n'.join(out)


BASE_CSS = """
:root{--black:#0B0909;--char:#2A2524;--red:#B3121C;--ember:#E0592A;--bone:#EFE6D6;--white:#fff}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#555}
.pg{position:relative;overflow:hidden;break-after:page;page-break-after:always;background:var(--black);color:var(--bone)}
.pg:last-child{break-after:auto;page-break-after:auto}
.t{position:absolute}
.abs{position:absolute}
.full{position:absolute;inset:0}
.ov{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none}
.ov.fill{object-fit:fill}
.cover{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
svg{display:block}
.anton{font-family:'Anton';font-weight:400;text-transform:uppercase;line-height:.92;letter-spacing:.005em}
.brush{font-family:'Brush';line-height:1}
.case{font-family:'Case'}
.rye{font-family:'Rye'}
.sans{font-family:'Archivo'}
.narrow{font-family:'Narrow'}
.mono{font-family:'Mono'}
.chalk{font-family:'Chalk'}
.marker{font-family:'Marker'}
.up{text-transform:uppercase}
.track{letter-spacing:.32em;text-transform:uppercase}
.center{text-align:center}
.nowrap{white-space:nowrap}
[data-fit]{white-space:nowrap;display:block}
[data-fit] > .fi{display:inline-block}
.flex{display:flex}.col{display:flex;flex-direction:column}
.mg-color .mg-keyline{fill:#fff}.mg-color .mg-panel{fill:#0B0909}.mg-color .mg-amp{fill:#D81E1E}.mg-color .mg-flame{fill:#F05A28}.mg-color .mg-steak{fill:#A3171E}
.mg-bone .mg-keyline{fill:var(--bone)}.mg-bone .mg-panel{fill:var(--black)}.mg-bone .mg-amp{fill:var(--bone)}.mg-bone .mg-flame{fill:var(--bone)}.mg-bone .mg-steak{fill:var(--black)}
.mg-red .mg-keyline{fill:var(--bone)}.mg-red .mg-panel{fill:var(--red)}.mg-red .mg-amp{fill:var(--black)}.mg-red .mg-flame{fill:var(--black)}.mg-red .mg-steak{fill:var(--bone)}
.mg-black .mg-keyline{fill:var(--black)}.mg-black .mg-panel{fill:var(--bone)}.mg-black .mg-amp{fill:var(--red)}.mg-black .mg-flame{fill:var(--red)}.mg-black .mg-steak{fill:var(--black)}
.stamp{display:inline-block;border-style:solid;text-transform:uppercase;line-height:1}
.rule{height:0;border-top:solid}
.dash{border-style:dashed}
"""

FIT_JS = """
async function fitAll(){
  await document.fonts.ready;
  for (const el of document.querySelectorAll('[data-fit]')){
    if(!el.querySelector(':scope > .fi')){const s=document.createElement('span');s.className='fi';while(el.firstChild)s.appendChild(el.firstChild);el.appendChild(s);}
    const span=el.querySelector(':scope > .fi');
    const max=parseFloat(el.dataset.max||'100000');
    let fs=parseFloat(getComputedStyle(el).fontSize);
    for(let i=0;i<4;i++){
      const tw=el.getBoundingClientRect().width, sw=span.getBoundingClientRect().width;
      if(!sw) break;
      fs=Math.min(max, fs*tw/sw); el.style.fontSize=fs+'px';
    }
  }
  for (const el of document.querySelectorAll('[data-shrink]')){
    let w=el.querySelector(':scope > .shr');
    if(!w){w=document.createElement('div');w.className='shr';while(el.firstChild)w.appendChild(el.firstChild);el.appendChild(w);}
    let z=1;
    for(let i=0;i<80 && (el.scrollHeight>el.clientHeight+1 || el.scrollWidth>el.clientWidth+1);i++){z*=0.97;w.style.zoom=z;}
  }
  document.body.dataset.ready='1';
}
fitAll();
"""


@dataclass
class Doc:
    num: str                 # checklist item number(s), e.g. '07'
    slug: str
    title: str
    area: str
    zone: str
    qty: str
    spec: str                # material / print spec
    w: float                 # finished width mm (real size)
    h: float                 # finished height mm
    bleed: float = 3.0
    scale: int = 1           # 10 => file supplied at 1:10
    pages: list = field(default_factory=list)
    labels: list = field(default_factory=list)
    notes: list = field(default_factory=list)
    folder: str = ''
    dieline: str = ''        # SVG path (in mm, trim coords) for shaped items
    extras: list = field(default_factory=list)   # (relative out path, source path) extra deliverables
    proof_pages: list = field(default_factory=lambda: [0])
    css: str = ''
    bg: str = BLACK

    @property
    def pw(self):
        return self.w + 2 * self.bleed

    @property
    def ph(self):
        return self.h + 2 * self.bleed

    def page(self, inner, bg=None, label=''):
        """inner: HTML laid out in a full-bleed box; use T() for the trim box."""
        b = self.bleed
        z = f'zoom:{1/self.scale};' if self.scale != 1 else ''
        self.pages.append(
            f'<section class="pg" style="width:{self.pw}mm;height:{self.ph}mm;{z}background:{bg or self.bg};'
            f'--b:{b}mm;--w:{self.w}mm;--h:{self.h}mm">{inner}</section>')
        self.labels.append(label)
        return self

    def T(self, inner, style=''):
        """Trim-box container (content lives here, bleed area outside)."""
        b = self.bleed
        return f'<div class="t" style="left:{b}mm;top:{b}mm;width:{self.w}mm;height:{self.h}mm;{style}">{inner}</div>'

    def html(self):
        return (f'<!doctype html><html><head><meta charset="utf-8"><style>{font_css()}{BASE_CSS}'
                f'@page{{size:{self.pw/self.scale:.3f}mm {self.ph/self.scale:.3f}mm;margin:0}}{self.css}</style></head>'
                f'<body>{"".join(self.pages)}<script>{FIT_JS}</script></body></html>')

    def fname(self):
        sc = '_SCALE-1to10' if self.scale == 10 else ''
        return f'{self.num}_{self.slug}_{int(self.w)}x{int(self.h)}mm{sc}'


REGISTRY = []


def register(doc):
    REGISTRY.append(doc)
    return doc


# ------------------------------------------------------------ small helpers
def ov(name, opacity=1, style='', fit='cover'):
    return f'<img class="ov" src="{tex(name)}" style="opacity:{opacity};object-fit:{fit};{style}">'


def img(name, style=''):
    return f'<img src="{tex(name)}" style="{style}">'


def box(x, y, w, h, inner='', style='', cls=''):
    return f'<div class="abs {cls}" style="left:{x}mm;top:{y}mm;width:{w}mm;height:{h}mm;{style}">{inner}</div>'


def fit(text, x, y, w, size=10, cls='anton', style='', maxs=None, h=None):
    """Single-line text auto-fitted to width w (mm)."""
    mx = f' data-max="{maxs*3.7795:.1f}"' if maxs else ''
    hh = f'height:{h}mm;' if h is not None else ''
    return (f'<div class="abs {cls}" data-fit{mx} style="left:{x}mm;top:{y}mm;width:{w}mm;{hh}font-size:{size}mm;{style}">'
            f'{text}</div>')


def text(t, x, y, w, size, cls='sans', style='', h=None, shrink=False):
    hh = f'height:{h}mm;' if h is not None else ''
    sh = ' data-shrink' if shrink else ''
    return f'<div class="abs {cls}"{sh} style="left:{x}mm;top:{y}mm;width:{w}mm;{hh}font-size:{size}mm;{style}">{t}</div>'


def svgbox(svgmarkup, x, y, w, h, style=''):
    return f'<div class="abs" style="left:{x}mm;top:{y}mm;width:{w}mm;height:{h}mm;{style}">{svgmarkup.replace("<svg ", "<svg width=\"100%\" height=\"100%\" ", 1)}</div>'


def write_manifest(docs, path):
    os.makedirs(os.path.join(BUILD, 'html'), exist_ok=True)
    man = []
    for d in docs:
        hp = os.path.join(BUILD, 'html', d.fname() + '.html')
        with open(hp, 'w') as f:
            f.write(d.html())
        man.append({'html': hp, 'pdf': os.path.join(BUILD, 'pdf', d.folder, d.fname() + '.pdf'),
                    'pages': len(d.pages)})
    with open(path, 'w') as f:
        json.dump(man, f, indent=1)
    return man
