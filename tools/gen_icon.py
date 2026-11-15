"""Build the GOALBOUND icon SVGs (orange split shield + white football on near-black) and render every PNG size."""
import math, cairosvg, pathlib, sys
OUT = pathlib.Path(sys.argv[1]); SRC = OUT / 'src'; SRC.mkdir(parents=True, exist_ok=True)
BG, OR1, OR2, INK, WH = '#070606', '#ff7a1a', '#d9560a', '#070606', '#ffffff'

# Regular pentagon points around (cx, cy) with radius r, first vertex at angle a0 (degrees)
def pent(cx, cy, r, a0):
    return ' '.join(f'{cx + r * math.cos(math.radians(a0 + 72 * i)):.1f},{cy + r * math.sin(math.radians(a0 + 72 * i)):.1f}' for i in range(5))

# Football: white disc, centre pentagon, five edge pentagons (clipped by the disc) and the seams between them
def ball(cx, cy, r, stroke):
    p = [f'<clipPath id="bc"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath>', f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{WH}"/>', f'<g clip-path="url(#bc)" fill="{INK}" stroke="{INK}" stroke-width="{stroke * .7}" stroke-linejoin="round" stroke-linecap="round">']
    pr = r * .3
    p.append(f'<polygon points="{pent(cx, cy, pr, -90)}"/>')
    for k in range(5):
        a = -90 + 72 * k; d = r * .98
        ox, oy = cx + d * math.cos(math.radians(a)), cy + d * math.sin(math.radians(a))
        p.append(f'<polygon points="{pent(ox, oy, pr * .8, a + 180)}" stroke-width="0"/>')
        ix, iy = cx + pr * math.cos(math.radians(a)), cy + pr * math.sin(math.radians(a))
        jx, jy = cx + (d - pr * .8) * math.cos(math.radians(a)), cy + (d - pr * .8) * math.sin(math.radians(a))
        p.append(f'<line x1="{ix:.1f}" y1="{iy:.1f}" x2="{jx:.1f}" y2="{jy:.1f}" fill="none"/>')
    p.append('</g>'); p.append(f'<circle cx="{cx}" cy="{cy}" r="{r - stroke / 2}" fill="none" stroke="{INK}" stroke-width="{stroke}"/>')
    return ''.join(p)

SHIELD = 'M256 88 L400 138 V266 C400 352 340 406 256 436 C172 406 112 352 112 266 V138 Z'
# The emblem: split two-tone shield (like the in-game crests), white rim, football in the middle
def emblem(detail=True):
    return (f'<path d="{SHIELD}" fill="{WH}" transform="translate(256 262) scale(1.07) translate(-256 -262)"/>'
            f'<clipPath id="sh"><path d="{SHIELD}"/></clipPath><g clip-path="url(#sh)"><rect x="0" y="0" width="512" height="512" fill="{OR1}"/>'
            f'<path d="M256 60 L470 60 L470 470 L256 470 Z" fill="{OR2}"/></g>' + (ball(256, 258, 96, 9) if detail else f'<circle cx="256" cy="258" r="96" fill="{WH}" stroke="{INK}" stroke-width="12"/><polygon points="{pent(256, 258, 38, -90)}" fill="{INK}"/>'))

def svg(body, rounded):
    bg = f'<rect width="512" height="512" rx="{112 if rounded else 0}" fill="{BG}"/>'
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">{bg}{body}</svg>'

files = {'icon.svg': svg(emblem(), True), 'icon-maskable.svg': svg(f'<g transform="translate(256 262) scale(.86) translate(-256 -262)">{emblem()}</g>', False), 'icon-small.svg': svg(emblem(False), True)}
for n, s in files.items(): (SRC / n).write_text(s)
# file name → (source svg, pixel size)
for name, (src, px) in {'icon-192.png': ('icon.svg', 192), 'icon-512.png': ('icon.svg', 512), 'icon-maskable-192.png': ('icon-maskable.svg', 192), 'icon-maskable-512.png': ('icon-maskable.svg', 512),
                        'apple-touch-icon.png': ('icon-maskable.svg', 180), 'favicon-32.png': ('icon-small.svg', 32), 'favicon-16.png': ('icon-small.svg', 16)}.items():
    cairosvg.svg2png(bytestring=files[src].encode(), write_to=str(OUT / name), output_width=px, output_height=px)
print('ok', sorted(p.name for p in OUT.iterdir()))
