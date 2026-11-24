# Convertit le pack nature (.glb) en js/nature.js + img/nature/*.webp :
#   python tools/nature2js.py "Stylized Nature MegaKit.undefined-glb"
# Troncs simplifiés, feuilles éclaircies puis agrandies, et version lointaine de chaque arbre.
import io, json, os, sys
import numpy as np
from PIL import Image
from glb import load, decimate, compact, comps, weld, area, b64
D = sys.argv[1] + '/'; ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); IMG = ROOT + '/img/nature'
os.makedirs(IMG, exist_ok=True); IMGS = {}; OUT = {}


def vscale(m, k): return dict(m, P=m['P'] * k)


def thin(m, n, grow=0.92):
    """garde n touffes sur le total, bien réparties (échantillonnage au plus loin), et les agrandit"""
    w, _ = weld(m['P']); c = comps(m['F'], w); ids = np.unique(c)
    ctr = np.array([m['P'][m['F'][c == i].ravel()].mean(0) for i in ids])
    if len(ids) > n:
        d = np.full(len(ids), 1e9); pick = [int(np.argmax(np.linalg.norm(ctr - ctr.mean(0), axis=1)))]
        while len(pick) < n: d = np.minimum(d, np.linalg.norm(ctr - ctr[pick[-1]], axis=1)); pick.append(int(np.argmax(d)))
    else: pick = range(len(ids))
    k = max(1, (len(ids) / len(pick)) ** 0.5 * grow); P = m['P'].copy(); F = []
    for i in pick:
        f = m['F'][c == ids[i]]; v = np.unique(f); P[v] = ctr[i] + (P[v] - ctr[i]) * k; F.append(f)
    return dict(m, P=P, F=np.concatenate(F))


def leafshade(m):
    """creux sombres, dessus clair : le feuillage prend du volume sans image supplémentaire"""
    P = m['P']; lo, hi = P.min(0), P.max(0); c = (lo + hi) / 2; r = (hi - lo) / 2
    d = np.clip(np.linalg.norm((P - c) / r, axis=1), 0, 1.15); h = (P[:, 1] - lo[1]) / (hi[1] - lo[1])
    k = np.clip(0.42 + 0.34 * d ** 2 + 0.34 * h, 0.35, 1.08)
    return dict(m, col=np.repeat(k[:, None], 3, 1))


def biggest(m, frac):
    w, _ = weld(m['P']); c = comps(m['F'], w); A = area(m['P'], m['F']); ids = np.unique(c); s = sorted(ids, key=lambda i: -A[c == i].sum()); tot = A.sum(); keep = []; acc = 0
    for i in s:
        keep.append(i); acc += A[c == i].sum()
        if acc > tot * frac: break
    return dict(m, F=m['F'][np.isin(c, keep)])


def enc(m, tex):
    m = compact(m); P = m['P']; Q = 32000 / np.abs(P).max(); u = m['uv']
    return dict(t=tex, q=round(float(Q), 3), p=b64(np.round(P * Q).astype('<i2')), n=b64(np.round(m['N'] * 127).astype('i1')), u=b64(np.clip(np.round(u * 1024), -32767, 32767).astype('<i2')), c=b64(np.clip(np.round(m['col'] * 200), 0, 255).astype('u1')), i=b64(m['F'].astype('<u2')), _n=len(m['F']))


def image(name, data, size, q=80, white=False):
    if name in IMGS: return
    im = Image.open(io.BytesIO(data)); al = 'A' in im.mode and im.getextrema()[-1][0] < 255; im = im.convert('RGBA')
    if al:  # les pixels transparents prennent la couleur voisine : pas de liseré
        a = np.array(im).astype(float)
        if white: a[..., :3] = 255
        else:
            big = np.zeros_like(a[..., :3]); wt = np.zeros(a.shape[:2], bool); al1 = a[..., 3:] / 255
            pre = Image.fromarray(np.uint8(np.concatenate([a[..., :3] * al1, a[..., 3:]], 2)))
            for s in (256, 64, 16, 4):
                t = np.asarray(pre.resize((s, s), Image.Resampling.BOX).resize(im.size, Image.Resampling.BILINEAR)).astype(float)
                ok = ~wt & (t[..., 3] > 4); big[ok] = t[ok][:, :3] / (t[ok][:, 3:] / 255); wt |= ok
            e = a[..., 3] < 200; a[e, :3] = big[e]
        im = Image.fromarray(np.uint8(a.clip(0, 255)))
    else: im = im.convert('RGB')
    im = im.resize((size, size), Image.Resampling.LANCZOS); f = f'{IMG}/{name}.webp'; im.save(f, quality=q, method=6, exact=True); IMGS[name] = os.path.getsize(f)


def tree(id, file, k, bark, leaf, nb, nl, fb, fl):
    ms = [vscale(m, k) for m in load(D + file + '.glb')]; b = next(m for m in ms if m['mat']['name'].startswith('Bark')); l = next((m for m in ms if m['mat']['name'].startswith('Lea')), None)
    image(bark, b['img'], 512, 72)
    near = [enc(decimate(biggest(b, 0.97), nb), bark)]; far = [enc(decimate(biggest(b, 0.72), fb), bark)]; info = {}
    if l is not None:
        image(leaf, l['img'], 512, 60, True); l = leafshade(l)
        near.append(enc(thin(l, nl), leaf)); far.append(enc(decimate(thin(l, fl, 0.82), 170), leaf))
        lo, hi = l['P'].min(0), l['P'].max(0); info['can'] = [round(float(x), 2) for x in (*((lo + hi) / 2), *((hi - lo) / 2 * 0.86))]
    P = b['P']; top = float(P[:, 1].max()); base = P[(P[:, 1] > 0.25) & (P[:, 1] < 1.4)]
    info['top'] = round(top, 2); info['r'] = round(float(np.percentile(np.linalg.norm(base[:, [0, 2]], axis=1), 70)), 2)
    OUT[id] = dict(near=near, far=far, **info)


def deco(id, file, k, spec):
    parts = []
    for m in load(D + file + '.glb'):
        tex, fn = spec[m['mat']['name']]; m = vscale(m, k); parts.append(enc(fn(m), tex))
        if tex: image(tex, m['img'], *SIZES[tex])
    OUT[id] = dict(near=parts)


SIZES = {'rocks': (512, 80), 'leaves': (512, 82), 'flowers': (512, 82), 'mush': (256, 80), 'path': (512, 78), 'leaf': (512, 60, True), 'leafr': (512, 60, True)}
same = lambda m: m
dec = lambda n: (lambda m: decimate(m, n))


def bake(m):  # l'herbe n'a qu'un dégradé : la couleur passe dans les sommets
    im = np.asarray(Image.open(io.BytesIO(m['img'])).convert('RGB')).astype(float) / 255; h, w = im.shape[:2]; u = m['uv'] % 1
    c = im[np.minimum(h - 1, (u[:, 1] * h).astype(int)), np.minimum(w - 1, (u[:, 0] * w).astype(int))]
    return dict(m, col=(c ** 2.2) * (0.55 + 0.45 * m['col']))


tree('tree0', 'Tree-t9KbsfYdXz', 1.0, 'bark', 'leaf', 420, 400, 70, 56)
tree('tree1', 'Tree-qZtx0AHhcy', 1.0, 'bark', 'leaf', 460, 440, 80, 60)
tree('tree2', 'Tree-QVOop92WmG', 0.9, 'bark', 'leaf', 420, 440, 70, 60)
tree('pine0', 'Pine-79gmlLnweB', 0.95, 'bark', 'pine', 380, 55, 60, 24)
tree('pine1', 'Pine-Zt62gceKXZ', 1.15, 'bark', 'pine', 380, 55, 60, 20)
tree('pine2', 'Pine', 1.0, 'bark', 'pine', 320, 55, 60, 24)
tree('twist', 'Twisted Tree-8oraKn9m0x', 0.62, 'bark2', 'leafr', 700, 480, 130, 70)
tree('dead0', 'Dead Tree', 0.6, 'bark2', None, 620, 0, 120, 0)
tree('dead1', 'Dead Tree-MlmK5488ou', 0.75, 'bark2', None, 620, 0, 120, 0)
for i, f in enumerate(['Rock Medium', 'Rock Medium-s1OJ3bBzqc', 'Rock Medium-JQxF95498B']): deco(f'rock{i}', f, 1, {'Rocks': ('rocks', dec(340))})
bl = lambda n: (lambda m: thin(leafshade(m), n))
deco('bush', 'Bush', 1.0, {'Leaves_TwistedTree': ('leafr', bl(230))})
deco('bushf', 'Bush with Flowers', 1.0, {'Leaves_NormalTree': ('leaf', bl(230)), 'Flowers': ('flowers', same)})
deco('fern', 'Fern', 0.24, {'Leaves': ('leaves', same)})
deco('plant', 'Plant Big-MbhbP7JrTI', 0.42, {'Leaves': ('leaves', same)})
deco('plant2', 'Plant', 0.8, {'Leaves': ('leaves', same)})
deco('clover', 'Clover', 0.35, {'Leaves': ('leaves', same)})
deco('flowA', 'Flower Group', 0.48, {'Leaves': ('leaves', dec(420)), 'Flowers': ('flowers', same)})
deco('flowB', 'Flower Single-GvfHo0roi3', 0.45, {'Leaves': ('leaves', same), 'Flowers': ('flowers', dec(300))})
deco('mush', 'Mushroom', 0.8, {'Mushrooms': ('mush', dec(320))})
deco('shelf', 'Mushroom Laetiporus', 0.5, {'Mushrooms': ('mush', dec(420))})
deco('wispy', 'Grass Wispy', 0.62, {'Grass': ('', lambda m: bake(dict(m)))})
deco('tall', 'Tall Grass', 0.62, {'Grass': ('', bake)})
for i, f in enumerate(['Pebble Square', 'Pebble Round', 'Pebble Square-6juX57sLHe']): deco(f'peb{i}', f, 1.15, {'PathRocks': ('path', same)})
for i, f in enumerate(['Flower Petal', 'Flower Petal-LqvxG9OBOU', 'Flower Petal-eVE0j49ux9', 'Flower Petal-niuBUEJdvM', 'Flower Petal-tzG4JcqYWs']): deco(f'petal{i}', f, 0.5, {'Flowers': ('flowers', same)})

for k, o in OUT.items(): print(k, 'near', [(p['t'], p['_n']) for p in o['near']], 'far', [p['_n'] for p in o.get('far', [])], o.get('can'), o.get('top'), o.get('r'))
for o in OUT.values():
    for p in o['near'] + o.get('far', []): p.pop('_n')
s = '// Généré par tools/nature2js.py depuis le pack « Stylized Nature MegaKit » : ne pas modifier à la main.\nexport const NATURE = ' + json.dumps(OUT, separators=(',', ':')) + ';\n'
open(ROOT + '/js/nature.js', 'w', encoding='utf-8', newline='\n').write(s); print('nature.js', len(s) // 1024, 'Ko ; images', IMGS, sum(IMGS.values()) // 1024, 'Ko')
