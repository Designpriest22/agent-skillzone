"""Rigged spooky party characters (SVG) for the walkthrough film.

Every character shares one skeleton so one dance engine drives them all:
  root (bounce / sway) > legs (thigh > shin) > torso > head > arms (upper > fore > hand + prop)
Pivots are stored as data-px / data-py; the JS sets rotate(a px py) on each part per frame.
Local space: x -130..130, y -110..490, hips at y 250, feet on y ~465. Facing camera.

Guests are people in costume (brown skin + makeup / masks); staff are the monsters.
"""

SKIN = ['#6b3f2a', '#5a3322', '#7a4a32', '#4e2c1d']
RIM = 'drop-shadow(-4px -2px 0 rgba(255,74,44,.85)) drop-shadow(3px 0 0 rgba(255,150,90,.35)) drop-shadow(0 20px 30px rgba(0,0,0,.7))'
BONE, INK, RED, BLOOD, EMBER = '#e8dfcf', '#0c0909', '#c4161c', '#8e0c12', '#E0592A'


def _rect(x0, y0, x1, y1, fill, rx=12, extra=''):
    return f'<rect x="{x0}" y="{y0}" width="{x1 - x0}" height="{y1 - y0}" rx="{rx}" fill="{fill}" {extra}/>'


def _bone_line(x, y0, y1, w=7):
    return (f'<line x1="{x}" y1="{y0}" x2="{x}" y2="{y1}" stroke="{BONE}" stroke-width="{w}" stroke-linecap="round"/>'
            f'<circle cx="{x - 3}" cy="{y0}" r="{w * .8}" fill="{BONE}"/><circle cx="{x + 3}" cy="{y0}" r="{w * .8}" fill="{BONE}"/>'
            f'<circle cx="{x - 3}" cy="{y1}" r="{w * .8}" fill="{BONE}"/><circle cx="{x + 3}" cy="{y1}" r="{w * .8}" fill="{BONE}"/>')


# ------------------------------------------------------------------ props (drawn in hand space; hand centre at 0,0)
def prop(kind):
    if kind == 'skewer':
        ch = ''.join(f'<rect x="-14" y="{-40 - k * 30}" width="28" height="24" rx="8" fill="#7a2a14"/>'
                     f'<path d="M-10,{-34 - k * 30} L10,{-28 - k * 30}" stroke="#2e0d06" stroke-width="4"/>' for k in range(3))
        return f'<line x1="0" y1="10" x2="0" y2="-130" stroke="#c9a46b" stroke-width="5" stroke-linecap="round"/>{ch}'
    if kind == 'ivbag':
        return ('<path d="M-22,-70 L22,-70 Q26,-70 26,-64 L26,-14 Q26,0 12,0 L-12,0 Q-26,0 -26,-14 L-26,-64 Q-26,-70 -22,-70 Z" fill="#f2ece6" opacity=".85"/>'
                f'<path d="M-24,-46 L24,-46 L24,-14 Q24,-2 12,-2 L-12,-2 Q-24,-2 -24,-14 Z" fill="{RED}"/>'
                '<rect x="-8" y="-82" width="16" height="12" fill="#f2ece6"/><path d="M0,0 L0,18" stroke="#f2ece6" stroke-width="4"/>')
    if kind == 'phone':
        return ('<rect x="-20" y="-70" width="40" height="74" rx="8" fill="#111"/>'
                '<rect x="-16" y="-64" width="32" height="60" rx="4" fill="#ffe2cf" opacity=".95"/>'
                '<circle cx="0" cy="-34" r="40" fill="#ffd9c4" opacity=".12"/>')
    if kind == 'cleaver':
        return ('<rect x="-7" y="-40" width="14" height="52" rx="5" fill="#141010"/>'
                '<path d="M-36,-130 L34,-130 Q40,-130 40,-124 L40,-44 L-30,-44 Q-38,-44 -38,-52 L-38,-126 Z" fill="#b9bcc0"/>'
                '<path d="M-36,-126 L38,-126" stroke="#eef0f2" stroke-width="5"/><circle cx="24" cy="-112" r="7" fill="#141010"/>'
                f'<path d="M-30,-58 L-26,-44 M-14,-60 L-12,-44 M6,-62 L8,-44" stroke="{RED}" stroke-width="5" stroke-linecap="round"/>')
    if kind == 'shaker':
        return ('<path d="M-18,-90 L18,-90 L24,0 L-24,0 Z" fill="#c8ccd0"/><rect x="-14" y="-108" width="28" height="20" rx="6" fill="#a7abb0"/>'
                '<path d="M-14,-80 L-18,-6" stroke="#ffffff" stroke-width="5" opacity=".7"/>')
    if kind == 'balloon':
        return ('<path d="M0,0 C10,-60 -14,-120 4,-190" stroke="#ddd" stroke-width="2" fill="none"/>'
                f'<ellipse cx="6" cy="-240" rx="46" ry="56" fill="{RED}"/><path d="M0,-186 L12,-186 L6,-178 Z" fill="{RED}"/>'
                '<ellipse cx="-10" cy="-262" rx="12" ry="18" fill="#ff6b5f" opacity=".7"/>')
    if kind == 'mic':
        return '<rect x="-6" y="-40" width="12" height="44" rx="5" fill="#222"/><circle cx="0" cy="-48" r="13" fill="#555"/>'
    if kind == 'lantern':
        return ('<path d="M0,0 L0,30" stroke="#333" stroke-width="4"/><rect x="-20" y="30" width="40" height="56" rx="8" fill="#2a2222"/>'
                '<rect x="-14" y="38" width="28" height="40" rx="5" fill="#ff8a2a"/><circle cx="0" cy="58" r="60" fill="#ff8a2a" opacity=".18"/>')
    return ''


# ------------------------------------------------------------------ heads (head space, neck at 0,104; head centre ~ 0,62)
def head(kind, skin):
    eyes_glow = (f'<circle cx="-13" cy="60" r="7" fill="#ff3b2f"/><circle cx="13" cy="60" r="7" fill="#ff3b2f"/>'
                 f'<circle cx="-13" cy="60" r="16" fill="#ff3b2f" opacity=".25"/><circle cx="13" cy="60" r="16" fill="#ff3b2f" opacity=".25"/>')
    face = f'<ellipse cx="0" cy="62" rx="34" ry="40" fill="{skin}"/>'
    neck = f'<rect x="-11" y="90" width="22" height="26" fill="{skin}"/>'
    if kind == 'skeleton':
        return (f'<rect x="-8" y="92" width="16" height="26" fill="{BONE}"/>'
                f'<path d="M0,18 C30,18 40,40 40,62 C40,80 32,90 26,96 L26,104 L-26,104 L-26,96 C-32,90 -40,80 -40,62 C-40,40 -30,18 0,18 Z" fill="{BONE}"/>'
                '<path d="M-26,60 C-26,48 -6,46 -4,60 C-4,72 -24,76 -26,60 Z M26,60 C26,48 6,46 4,60 C4,72 24,76 26,60 Z" fill="#0b0707"/>'
                + eyes_glow.replace('cx="-13" cy="60" r="7"', 'cx="-14" cy="61" r="5"').replace('cx="13" cy="60" r="7"', 'cx="14" cy="61" r="5"') +
                '<path d="M0,72 L-6,84 L6,84 Z" fill="#0b0707"/><rect x="-20" y="90" width="40" height="14" rx="3" fill="#0b0707"/>'
                + ''.join(f'<rect x="{-18 + i * 6.4:.1f}" y="89" width="5" height="16" rx="2" fill="{BONE}"/>' for i in range(6)) +
                '<path d="M12,22 L8,34 L16,40" stroke="#0b0707" stroke-width="2.5" fill="none"/>')
    if kind == 'vampire':
        return (neck + f'<path d="M-62,96 L-30,40 L-36,104 Z M62,96 L30,40 L36,104 Z" fill="{INK}"/><path d="M-56,94 L-34,52 L-38,104 Z M56,94 L34,52 L38,104 Z" fill="{BLOOD}"/>'
                + face.replace(skin, '#c9b8b0') +
                f'<path d="M-36,58 C-38,22 -16,14 0,30 C16,14 38,22 36,58 C30,40 16,34 0,44 C-16,34 -30,40 -36,58 Z" fill="{INK}"/>'
                '<path d="M-24,54 L-6,58 M24,54 L6,58" stroke="#1a1010" stroke-width="4"/>' + eyes_glow.replace('r="7"', 'r="5"') +
                f'<path d="M-12,82 Q0,88 12,82" stroke="{BLOOD}" stroke-width="4" fill="none"/><path d="M-8,83 L-5,93 L-2,84 Z M8,83 L5,93 L2,84 Z" fill="#fff"/>'
                f'<path d="M-6,95 L-6,104" stroke="{RED}" stroke-width="3"/>')
    if kind == 'witch':
        hair = f'<path d="M-40,50 C-50,90 -52,130 -40,160 L-26,150 C-34,120 -30,90 -26,60 Z M40,50 C50,90 52,130 40,160 L26,150 C34,120 30,90 26,60 Z" fill="#2a0c0c"/>'
        return (hair + neck + face +
                '<path d="M-24,58 C-18,52 -10,52 -6,58 M24,58 C18,52 10,52 6,58" stroke="#0b0707" stroke-width="7" stroke-linecap="round"/>'
                + eyes_glow.replace('r="7"', 'r="3.5"').replace('cy="60"', 'cy="60"') +
                f'<path d="M-10,82 Q0,90 10,82 Q0,86 -10,82 Z" fill="{RED}"/>'
                f'<ellipse cx="0" cy="30" rx="70" ry="13" fill="{INK}"/>'
                f'<path d="M-36,30 C-30,0 -14,-40 -2,-70 C8,-92 26,-104 44,-98 C26,-86 18,-64 18,-30 L36,30 Z" fill="{INK}"/>'
                f'<path d="M-34,24 L34,24 L33,12 L-31,12 Z" fill="{RED}"/><rect x="-8" y="10" width="16" height="16" fill="none" stroke="#d9a441" stroke-width="3"/>')
    if kind == 'mummy':
        wraps = ''.join(f'<path d="M-36,{30 + i * 11} L36,{24 + i * 11 + (i % 2) * 8}" stroke="#8e8166" stroke-width="2.5"/>' for i in range(7))
        return (f'<rect x="-11" y="90" width="22" height="26" fill="#c9bc9a"/><ellipse cx="0" cy="62" rx="36" ry="42" fill="#c9bc9a"/>{wraps}'
                '<rect x="-30" y="52" width="60" height="16" fill="#0b0707"/><circle cx="-12" cy="60" r="6" fill="#ff3b2f"/><circle cx="-12" cy="60" r="14" fill="#ff3b2f" opacity=".3"/>'
                '<path d="M6,60 L22,60" stroke="#3a3326" stroke-width="3"/><path d="M28,40 C50,48 58,70 50,100" stroke="#c9bc9a" stroke-width="10" fill="none"/>')
    if kind == 'pumpkin':
        return (f'<rect x="-11" y="90" width="22" height="26" fill="{INK}"/>'
                '<ellipse cx="-22" cy="58" rx="28" ry="42" fill="#b8410f"/><ellipse cx="22" cy="58" rx="28" ry="42" fill="#b8410f"/>'
                '<ellipse cx="0" cy="58" rx="32" ry="46" fill="#d5531a"/><ellipse cx="0" cy="56" rx="14" ry="44" fill="#e8702c" opacity=".55"/>'
                '<path d="M-4,14 C-6,4 0,-6 10,-8 L12,0 C6,2 4,8 4,14 Z" fill="#3a2414"/>'
                '<g fill="#ffcf5a"><path d="M-30,48 L-10,48 L-20,30 Z"/><path d="M10,48 L30,48 L20,30 Z"/><path d="M-6,62 L6,62 L0,52 Z"/>'
                '<path d="M-32,72 L-22,82 L-14,72 L-6,84 L2,72 L10,84 L18,72 L26,82 L34,72 C26,100 -24,100 -32,72 Z"/></g>'
                '<ellipse cx="0" cy="62" rx="60" ry="64" fill="#ff8a2a" opacity=".14"/>')
    if kind == 'butcher':
        return (f'<rect x="-11" y="90" width="22" height="26" fill="#141010"/><ellipse cx="0" cy="62" rx="35" ry="42" fill="#141010"/>'
                '<path d="M-26,52 L26,52 L24,70 L-24,70 Z" fill="#2a1a16"/>' + eyes_glow.replace('cy="60"', 'cy="61"') +
                '<path d="M-16,80 L16,80" stroke="#2e2020" stroke-width="3"/>'
                '<path d="M-34,30 C-50,10 -40,-30 -14,-30 C-10,-50 14,-50 18,-30 C44,-30 52,10 34,30 Z" fill="#efe9e2"/>'
                '<rect x="-34" y="18" width="68" height="18" fill="#e2dad0"/><path d="M-20,-20 C-16,-10 -18,8 -24,18 M10,-24 C14,-8 12,6 6,18" stroke="#cfc4b6" stroke-width="3" fill="none"/>'
                f'<path d="M14,22 C16,30 14,34 16,40" stroke="{RED}" stroke-width="4" stroke-linecap="round"/>')
    if kind == 'plague':
        return (f'<rect x="-11" y="90" width="22" height="26" fill="{INK}"/><ellipse cx="0" cy="62" rx="35" ry="42" fill="#2a1d16"/>'
                '<path d="M8,64 C40,64 78,82 104,120 C70,104 40,100 6,92 Z" fill="#4a3324"/><path d="M8,66 C40,66 74,82 98,112" stroke="#6b4b34" stroke-width="3" fill="none"/>'
                '<circle cx="-12" cy="56" r="13" fill="#2b1d16" stroke="#9a8a70" stroke-width="4"/><circle cx="14" cy="56" r="13" fill="#2b1d16" stroke="#9a8a70" stroke-width="4"/>'
                '<circle cx="-12" cy="56" r="7" fill="#ff3b2f"/><circle cx="14" cy="56" r="7" fill="#ff3b2f"/>'
                f'<ellipse cx="0" cy="26" rx="74" ry="14" fill="{INK}"/><path d="M-34,26 C-34,-12 34,-12 34,26 Z" fill="{INK}"/><rect x="-34" y="12" width="68" height="8" fill="#3a2a22"/>')
    if kind == 'bride':
        return (neck.replace(skin, '#d8d2d0') + '<ellipse cx="0" cy="62" rx="34" ry="40" fill="#d8d2d0"/>'
                '<ellipse cx="-13" cy="58" rx="9" ry="12" fill="#1a1010"/><ellipse cx="13" cy="58" rx="9" ry="12" fill="#1a1010"/>'
                '<circle cx="-13" cy="60" r="3" fill="#ff3b2f"/><circle cx="13" cy="60" r="3" fill="#ff3b2f"/>'
                '<path d="M-14,58 L-16,80 M13,58 L15,78" stroke="#1a1010" stroke-width="2" opacity=".6"/>'
                '<path d="M-8,84 Q0,80 8,84 Q0,90 -8,84 Z" fill="#3a1418"/>'
                '<path d="M-44,40 C-40,10 -16,4 0,4 C16,4 40,10 44,40 L60,170 L-60,170 Z" fill="#f4efe8" opacity=".38"/>'
                f'<path d="M-30,20 C-20,6 20,6 30,20" stroke="#f4efe8" stroke-width="8" fill="none"/><circle cx="-24" cy="16" r="6" fill="{RED}"/><circle cx="-14" cy="12" r="5" fill="{BLOOD}"/>')
    if kind == 'devil':
        return (neck + face +
                f'<path d="M-30,30 C-48,10 -44,-16 -34,-30 C-30,-10 -20,4 -16,22 Z M30,30 C48,10 44,-16 34,-30 C30,-10 20,4 16,22 Z" fill="{RED}"/>'
                f'<path d="M-34,40 C-36,16 -12,10 0,18 C12,10 36,16 34,40 C26,30 14,28 0,32 C-14,28 -26,30 -34,40 Z" fill="{INK}"/>'
                '<path d="M-24,52 L-6,56 M24,52 L6,56" stroke="#160c0a" stroke-width="5"/>'
                f'<circle cx="-14" cy="62" r="4" fill="{RED}"/><circle cx="14" cy="62" r="4" fill="{RED}"/>'
                f'<path d="M-10,84 Q0,90 10,84" stroke="{BLOOD}" stroke-width="4" fill="none"/><path d="M-8,96 L0,112 L8,96 Z" fill="{INK}"/>')
    if kind == 'clown':
        return (neck + '<ellipse cx="0" cy="62" rx="34" ry="40" fill="#efe9e2"/>'
                f'<path d="M-34,40 C-60,20 -64,60 -46,70 C-62,74 -56,96 -36,84 Z M34,40 C60,20 64,60 46,70 C62,74 56,96 36,84 Z" fill="{RED}"/>'
                '<path d="M-14,46 L-6,58 L-14,72 L-22,58 Z M14,46 L22,58 L14,72 L6,58 Z" fill="#0b0707"/>'
                '<circle cx="-14" cy="59" r="3" fill="#ff3b2f"/><circle cx="14" cy="59" r="3" fill="#ff3b2f"/>'
                f'<circle cx="0" cy="70" r="7" fill="{RED}"/>'
                f'<path d="M-26,78 L-18,88 L-10,82 L-2,92 L6,82 L14,90 L22,80 L28,76 C18,100 -16,100 -26,78 Z" fill="{BLOOD}"/>'
                f'<path d="M-26,80 L-18,86 L-10,82 L-2,88 L6,82 L14,88 L24,78" stroke="#efe9e2" stroke-width="2" fill="none"/>')
    if kind == 'reaper':
        return (f'<path d="M-50,120 C-56,40 -40,0 0,-6 C40,0 56,40 50,120 Z" fill="#0b0707"/><ellipse cx="0" cy="66" rx="30" ry="36" fill="#000"/>'
                + eyes_glow.replace('cy="60"', 'cy="62"'))
    if kind == 'singer':
        return neck.replace(skin, '#120c0b') + '<ellipse cx="0" cy="62" rx="34" ry="40" fill="#120c0b"/><path d="M-34,50 C-30,20 30,20 34,50 L34,40 C30,10 -30,10 -34,40 Z" fill="#000"/>'
    return neck + face


# ------------------------------------------------------------------ outfits
OUTFIT = {
    'skeleton': dict(top=INK, sleeve=INK, pants=INK, shoe='#000', hand=BONE),
    'vampire': dict(top=INK, sleeve=INK, pants='#120d0d', shoe='#000', hand='#c9b8b0'),
    'witch': dict(top='#120a0a', sleeve='#120a0a', pants='#120a0a', shoe='#000', hand=None),
    'mummy': dict(top='#c9bc9a', sleeve='#c9bc9a', pants='#c9bc9a', shoe='#6b604a', hand='#c9bc9a'),
    'pumpkin': dict(top='#0d0b0b', sleeve='#0d0b0b', pants='#0d0b0b', shoe='#000', hand='#efe9e2'),
    'butcher': dict(top='#5a5452', sleeve='#5a5452', pants='#1a1414', shoe='#000', hand='#141010'),
    'plague': dict(top=INK, sleeve=INK, pants=INK, shoe='#000', hand='#1d1512'),
    'bride': dict(top='#ece5dc', sleeve='#ece5dc', pants='#ece5dc', shoe='#ece5dc', hand='#d8d2d0'),
    'devil': dict(top='#1a1010', sleeve='#1a1010', pants='#0d0b0b', shoe='#000', hand=None),
    'clown': dict(top='#1a1010', sleeve='#1a1010', pants='#1a1010', shoe=RED, hand='#efe9e2'),
    'reaper': dict(top='#0b0707', sleeve='#0b0707', pants='#0b0707', shoe='#0b0707', hand=BONE),
    'singer': dict(top='#100b0a', sleeve='#100b0a', pants='#100b0a', shoe='#000', hand='#120c0b'),
}


def character(kind, skin_i=0, prop_r='', prop_l='', scale=1.0, cid='', flip=False):
    o = OUTFIT[kind]
    skin = SKIN[skin_i % len(SKIN)]
    hand = o['hand'] or skin

    def leg(side):
        x = 16 * side
        shoe = f'<ellipse cx="{x + 6 * side}" cy="455" rx="26" ry="13" fill="{o["shoe"]}"/>'
        extra_th, extra_sh = '', ''
        if kind == 'skeleton':
            extra_th, extra_sh = _bone_line(x, 262, 340), _bone_line(x, 358, 432)
        if kind == 'mummy':
            extra_th = ''.join(f'<path d="M{x - 15},{258 + i * 18} L{x + 15},{266 + i * 18}" stroke="#8e8166" stroke-width="2.5"/>' for i in range(5))
            extra_sh = extra_th.replace('258', '354').replace('266', '362')
        if kind == 'witch':
            extra_sh = ''.join(f'<rect x="{x - 14}" y="{362 + i * 22}" width="28" height="10" fill="{RED}"/>' for i in range(4))
        if kind == 'clown':
            extra_th = f'<rect x="{x - 15}" y="300" width="30" height="12" fill="{RED}"/>'
        return (f'<g class="leg" data-px="{x}" data-py="250" data-side="{side}">{_rect(x - 15, 244, x + 15, 352, o["pants"], 13)}{extra_th}'
                f'<g class="shin" data-px="{x}" data-py="350">{_rect(x - 14, 344, x + 14, 448, o["pants"], 12)}{extra_sh}{shoe}</g></g>')

    def arm(side, pr):
        x = 46 * side
        bones_u = _bone_line(x, 136, 196, 6) if kind == 'skeleton' else ''
        bones_f = (_bone_line(x - 4, 222, 278, 4) + _bone_line(x + 4, 222, 278, 4)) if kind == 'skeleton' else ''
        wrap = ''
        if kind == 'mummy':
            wrap = ''.join(f'<path d="M{x - 13},{140 + i * 20} L{x + 13},{150 + i * 20}" stroke="#8e8166" stroke-width="2.5"/>' for i in range(4))
        cuff = ''
        if kind in ('vampire', 'pumpkin'):
            cuff = f'<rect x="{x - 14}" y="276" width="28" height="10" fill="#efe9e2"/>'
        if kind == 'butcher':
            cuff = f'<rect x="{x - 13}" y="214" width="26" height="70" rx="10" fill="{SKIN[1]}"/>'
        fingers = ''
        if kind in ('skeleton', 'reaper'):
            fingers = ''.join(f'<path d="M{x + k * 5 - 7},{300} L{x + k * 6 - 9},{318}" stroke="{BONE}" stroke-width="3.5" stroke-linecap="round"/>' for k in range(4))
        p = f'<g transform="translate({x},{300})">{prop(pr)}</g>' if pr else ''
        return (f'<g class="arm" data-px="{x}" data-py="130" data-side="{side}">{_rect(x - 13, 120, x + 13, 214, o["sleeve"], 12)}{bones_u}{wrap}'
                f'<g class="fore" data-px="{x}" data-py="210">{_rect(x - 12, 204, x + 12, 292, o["sleeve"], 11)}{cuff}{bones_f}'
                f'{wrap.replace("140", "214").replace("150", "224")}<circle cx="{x}" cy="300" r="14" fill="{hand}"/>{fingers}{p}</g></g>')

    torso = '<path d="M-48,118 Q-54,190 -38,262 L38,262 Q54,190 48,118 Q0,104 -48,118 Z" fill="{}"/>'.format(o['top'])
    over, back = '', ''
    if kind == 'skeleton':
        over = (f'<path d="M0,124 L0,250" stroke="{BONE}" stroke-width="8" stroke-dasharray="10 4"/>'
                + ''.join(f'<path d="M-4,{140 + i * 18} C-30,{136 + i * 18} -36,{152 + i * 18} -26,{162 + i * 18} M4,{140 + i * 18} C30,{136 + i * 18} 36,{152 + i * 18} 26,{162 + i * 18}" stroke="{BONE}" stroke-width="7" fill="none" stroke-linecap="round"/>' for i in range(5))
                + f'<path d="M-30,238 C-20,226 20,226 30,238 L22,256 L-22,256 Z" fill="{BONE}"/>')
    if kind == 'vampire':
        back = (f'<path d="M-50,120 C-80,200 -110,330 -124,440 L124,440 C110,330 80,200 50,120 Z" fill="{INK}"/>'
                f'<path d="M-44,130 C-70,210 -96,330 -108,430 L108,430 C96,330 70,210 44,130 Z" fill="{BLOOD}"/>')
        over = (f'<path d="M-16,120 L0,170 L16,120 Z" fill="#efe9e2"/><path d="M-10,124 L0,150 L10,124 Z" fill="{RED}"/>'
                f'<circle cx="0" cy="186" r="4" fill="{RED}"/><circle cx="0" cy="210" r="4" fill="{RED}"/>')
    if kind == 'witch':
        over = (f'<path d="M-10,130 L10,130 M-14,150 L14,150 M-14,170 L14,170 M-12,190 L12,190" stroke="{RED}" stroke-width="4"/>'
                f'<path d="M-40,240 C-60,300 -80,360 -92,410 L-70,396 L-56,416 L-36,398 L-18,418 L0,398 L18,418 L36,398 L56,416 L70,396 L92,410 C80,360 60,300 40,240 Z" fill="#120a0a"/>'
                f'<path d="M-40,240 L40,240 L42,252 L-42,252 Z" fill="{RED}"/>')
    if kind == 'mummy':
        over = ''.join(f'<path d="M-46,{128 + i * 16} L46,{120 + i * 16 + (i % 2) * 10}" stroke="#8e8166" stroke-width="2.5"/>' for i in range(9))
        over += '<path d="M40,170 C70,190 66,250 84,290" stroke="#c9bc9a" stroke-width="12" fill="none" stroke-linecap="round"/>'
    if kind == 'pumpkin':
        over = (f'<path d="M-16,120 L0,176 L16,120 Z" fill="#efe9e2"/><path d="M-14,122 L0,130 L14,122 L14,136 L0,128 L-14,136 Z" fill="{EMBER}"/>'
                '<path d="M-48,118 L-16,120 L-6,200 Z M48,118 L16,120 L6,200 Z" fill="#1d1717"/>')
    if kind == 'butcher':
        over = (f'<path d="M-40,140 L40,140 L46,262 L48,380 L-48,380 L-46,262 Z" fill="#e8e2da"/>'
                f'<path d="M-20,140 L-30,118 M20,140 L30,118" stroke="#e8e2da" stroke-width="5"/>'
                f'<path d="M-24,200 C-10,190 4,214 -4,228 C-14,238 -30,220 -24,200 Z M10,262 C22,256 30,272 22,282 C12,288 4,272 10,262 Z" fill="{RED}"/>'
                + ''.join(f'<path d="M{-30 + k * 16},{250 + (k % 3) * 20} L{-30 + k * 16},{300 + (k % 3) * 30}" stroke="{BLOOD}" stroke-width="5" stroke-linecap="round"/><circle cx="{-30 + k * 16}" cy="{302 + (k % 3) * 30}" r="5" fill="{BLOOD}"/>' for k in range(5))
                + '<path d="M-48,250 L48,250" stroke="#cfc4b6" stroke-width="5"/>')
    if kind == 'plague':
        over = ('<path d="M-50,118 C-60,220 -66,300 -70,380 L70,380 C66,300 60,220 50,118 Q0,104 -50,118 Z" fill="#0f0b0a"/>'
                '<path d="M0,120 L0,380" stroke="#2a201c" stroke-width="4"/>' + ''.join(f'<circle cx="8" cy="{150 + i * 30}" r="4" fill="#6b5a44"/>' for i in range(6))
                + '<path d="M-48,240 L48,240" stroke="#3a2a22" stroke-width="8"/>')
    if kind == 'bride':
        over = ('<path d="M-46,240 C-70,330 -96,400 -100,460 L-76,446 L-60,466 L-40,448 L-20,468 L0,450 L20,468 L40,448 L60,466 L76,446 L100,460 C96,400 70,330 46,240 Z" fill="#ece5dc"/>'
                '<path d="M-30,300 C-34,360 -40,420 -44,456 M0,300 L0,456 M30,300 C34,360 40,420 44,456" stroke="#c9c0b4" stroke-width="3" fill="none"/>'
                f'<path d="M-6,236 C-14,226 -2,218 0,228 C2,218 14,226 6,236 L0,244 Z" fill="{BLOOD}"/>')
    if kind == 'devil':
        over = (f'<path d="M-48,118 L-14,122 L-24,262 L-38,262 Q-54,190 -48,118 Z M48,118 L14,122 L24,262 L38,262 Q54,190 48,118 Z" fill="#2a1a18"/>'
                f'<path d="M-14,122 L14,122 L12,262 L-12,262 Z" fill="{RED}"/><path d="M60,240 C100,260 110,320 90,360 L104,370 L80,384 L84,360 C96,330 90,290 58,262 Z" fill="{RED}"/>')
    if kind == 'clown':
        over = (''.join(f'<path d="M{-60 + i * 20},116 L{-50 + i * 20},96 L{-40 + i * 20},116 Z" fill="{RED if i % 2 else "#efe9e2"}"/>' for i in range(6))
                + ''.join(f'<circle cx="0" cy="{160 + i * 34}" r="10" fill="{RED}"/>' for i in range(3)))
    if kind == 'reaper':
        back = '<path d="M-60,110 C-80,220 -96,360 -110,470 L110,470 C96,360 80,220 60,110 Z" fill="#0b0707"/>'
        over = '<path d="M-50,118 C-62,240 -70,360 -80,466 L80,466 C70,360 62,240 50,118 Z" fill="#0d0909"/><path d="M-60,466 L-40,450 L-20,468 L0,452 L20,468 L40,450 L60,466" stroke="#0b0707" stroke-width="10" fill="none"/>'
    if kind == 'singer':
        over = '<path d="M-48,118 L-10,118 L-16,262 L-38,262 Z M48,118 L10,118 L16,262 L38,262 Z" fill="#1d1513"/>'

    legs = leg(-1) + leg(1)
    hide_legs = kind in ('bride', 'reaper')
    body = (f'{back}{"" if hide_legs else legs}{arm(-1, prop_l)}{torso}{over}'
            f'<g class="head" data-px="0" data-py="108">{head(kind, skin)}</g>{arm(1, prop_r)}')
    fl = ' transform="scale(-1,1)"' if flip else ''
    return (f'<svg class="chr" data-kind="{kind}" id="{cid}" viewBox="-140 -120 280 610" width="{280 * scale:.0f}" height="{610 * scale:.0f}" '
            f'style="overflow:visible;filter:{RIM}"><g{fl}><g class="root">{body}</g></g></svg>')


def back_view(variant, scale=1.0, cid='', phone=False):
    """Crowd member seen from behind (stage scene): silhouette with costume headwear, arms up."""
    hw = {
        'witch': f'<path d="M-62,40 L62,40 L58,30 L-58,30 Z M-30,34 C-24,0 -10,-40 6,-70 C14,-84 28,-90 40,-86 C26,-76 20,-56 22,-20 L32,34 Z" fill="{INK}"/>',
        'horns': f'<path d="M-30,36 C-48,14 -44,-14 -34,-26 C-30,-8 -20,6 -16,26 Z M30,36 C48,14 44,-14 34,-26 C30,-8 20,6 16,26 Z" fill="{RED}"/>',
        'pumpkin': '<ellipse cx="-20" cy="56" rx="26" ry="40" fill="#8a3010"/><ellipse cx="20" cy="56" rx="26" ry="40" fill="#8a3010"/><ellipse cx="0" cy="56" rx="30" ry="44" fill="#a33c14"/><path d="M-4,12 C-6,2 0,-6 10,-8 L12,0 C6,2 4,8 4,14 Z" fill="#2a1a10"/>',
        'hood': '<path d="M-48,120 C-56,40 -40,0 0,-6 C40,0 56,40 48,120 Z" fill="#090606"/><path d="M0,-6 C10,30 4,80 0,120" stroke="#1d1414" stroke-width="3" fill="none"/>',
        'bunny': '<ellipse cx="-16" cy="-14" rx="10" ry="40" fill="#0a0707" transform="rotate(-12 -16 -14)"/><ellipse cx="18" cy="-14" rx="10" ry="40" fill="#0a0707" transform="rotate(14 18 -14)"/>',
        'braids': '<path d="M-30,60 C-40,100 -36,150 -30,170 M-18,70 C-24,110 -20,150 -16,176 M18,70 C24,110 20,150 16,176 M30,60 C40,100 36,150 30,170" stroke="#0a0606" stroke-width="9" fill="none" stroke-linecap="round"/>',
        'plain': '',
    }[variant]
    head = '' if variant == 'hood' else '<ellipse cx="0" cy="60" rx="34" ry="40" fill="#0a0707"/>'
    ph = (f'<g transform="translate(46,22)"><rect x="-18" y="-66" width="36" height="66" rx="7" fill="#111"/><rect x="-14" y="-60" width="28" height="54" rx="3" fill="#ffd9c4"/>'
          f'<circle cx="0" cy="-32" r="40" fill="#ffd9c4" opacity=".15"/></g>') if phone else ''
    return (f'<svg class="bk" id="{cid}" viewBox="-140 -120 280 460" width="{280 * scale:.0f}" height="{460 * scale:.0f}" style="overflow:visible;filter:{RIM}">'
            f'<g class="root"><g class="arm" data-px="-40" data-py="130" data-side="-1"><path d="M-40,130 L-60,10" stroke="#0a0707" stroke-width="26" stroke-linecap="round"/><circle cx="-60" cy="4" r="15" fill="#0a0707"/></g>'
            f'<g class="arm" data-px="40" data-py="130" data-side="1"><path d="M40,130 L60,10" stroke="#0a0707" stroke-width="26" stroke-linecap="round"/><circle cx="60" cy="4" r="15" fill="#0a0707"/>{ph}</g>'
            f'<path d="M-62,340 C-64,200 -52,130 0,118 C52,130 64,200 62,340 Z" fill="#0a0707"/><g class="head" data-px="0" data-py="108">{head}{hw}</g></g></svg>')
