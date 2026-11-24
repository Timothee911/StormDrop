# Convertit le pack de meubles (.glb) en js/meubles.js :
#   python tools/meubles2js.py "Office Pack-glb"
# Chaque meuble est remis à l'échelle du jeu (mètres), posé à y = 0, face avant vers +z, simplifié,
# et ses couleurs/textures passent dans les sommets : un seul maillage sans image.
import io, json, os, sys
import numpy as np
from PIL import Image
from glb import load, decimate, compact, b64
D = sys.argv[1] + '/'; ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); OUT = {}


def colors(m):
    f = m['mat'].get('pbrMetallicRoughness', {}).get('baseColorFactor', [1, 1, 1, 1]); c = np.tile(np.array(f[:3]), (len(m['P']), 1)) * m['col']
    if m['img'] is not None:
        im = np.asarray(Image.open(io.BytesIO(m['img'])).convert('RGB')).astype(float) / 255; h, w = im.shape[:2]; u = m['uv'] % 1
        c = c * im[np.minimum(h - 1, (u[:, 1] * h).astype(int)), np.minimum(w - 1, (u[:, 0] * w).astype(int))] ** 2.2
    return np.clip(0.03 + c * 0.97, 0, 1)  # jamais tout à fait noir : les volumes restent lisibles


def fuse(m):
    # un sommet par (position, couleur) : sans cela un maillage à facettes ne se simplifie pas
    k = {}; q = np.concatenate([np.round(m['P'] / 5e-4), np.round(m['col'] * 60)], 1).astype(int)
    w = np.array([k.setdefault(tuple(x), len(k)) for x in q], int); first = np.zeros(len(k), int); first[w[::-1]] = np.arange(len(w))[::-1]
    F = w[m['F']]; F = F[(F[:, 0] != F[:, 1]) & (F[:, 1] != F[:, 2]) & (F[:, 0] != F[:, 2])]
    return dict(m, P=m['P'][first], N=m['N'][first], uv=m['uv'][first], col=m['col'][first], F=F)


def crease(m, deg=38):
    # normales refaites : lisses sous l'angle donné, arêtes vives au-delà
    P, F = m['P'], m['F']; fn = np.cross(P[F[:, 1]] - P[F[:, 0]], P[F[:, 2]] - P[F[:, 0]]); u = fn / np.maximum(1e-12, np.linalg.norm(fn, axis=1))[:, None]; cs = np.cos(np.radians(deg))
    k = {}; w = [k.setdefault(tuple(x), len(k)) for x in np.round(P / 5e-4).astype(int)]; at = {}
    for i, f in enumerate(F):
        for a in f: at.setdefault(w[a], []).append(i)
    out = {}; V = []; NN = []; G = []
    for i, f in enumerate(F):
        g = []
        for a in f:
            L = np.array(at[w[a]]); n = fn[L][u[L] @ u[i] > cs].sum(0); n = n / max(1e-12, np.linalg.norm(n)); key = (int(a), *np.round(n * 40).astype(int))
            if key not in out: out[key] = len(V); V.append(a); NN.append(n)
            g.append(out[key])
        G.append(g)
    V = np.array(V); return dict(m, P=P[V], N=np.array(NN), uv=m['uv'][V], col=m['col'][V], F=np.array(G))


def add(id, file, axis, size, tris, rot=0, tint=False, h=0, drop=(), keep=None, deg=38):
    """axis : dimension imposée (0 = largeur x, 1 = hauteur y, 2 = profondeur z), size en mètres"""
    ms = [m for m in load(D + file + '.glb') if m['mat'].get('name') not in drop and m['mat'].get('pbrMetallicRoughness', {}).get('baseColorFactor', [1, 1, 1, 1])[3] > 0.9]  # sans les vitres
    if keep: ms = [dict(m, F=m['F'][keep(m['P'][m['F']].mean(1))]) for m in ms]; ms = [compact(m) for m in ms if len(m['F'])]
    P = np.concatenate([m['P'] for m in ms]); a = np.radians(rot); R = np.array([[np.cos(a), 0, np.sin(a)], [0, 1, 0], [-np.sin(a), 0, np.cos(a)]])
    P = P @ R.T; k = size / (P.max(0) - P.min(0))[axis]; P = P * k; lo, hi = P.min(0), P.max(0); off = np.array([(lo[0] + hi[0]) / 2, lo[1], (lo[2] + hi[2]) / 2])
    tot = sum(len(m['F']) for m in ms); parts = []; top = None
    for m in ms:
        m = dict(m, P=m['P'] @ R.T * k - off, N=m['N'] @ R.T, col=colors(m)); F = m['F']
        fn = np.cross(m['P'][F[:, 1]] - m['P'][F[:, 0]], m['P'][F[:, 2]] - m['P'][F[:, 0]]); inv = (fn * m['N'][F].sum(1)).sum(1) < 0
        F = F.copy(); F[inv] = F[inv][:, [0, 2, 1]]; m['F'] = F[np.linalg.norm(fn, axis=1) > 1e-9]
        if len(m['F']): parts.append(m)
    o = 0; FF = []
    for m in parts: FF.append(m['F'] + o); o += len(m['P'])
    M = dict(P=np.concatenate([m['P'] for m in parts]), N=np.concatenate([m['N'] for m in parts]), uv=np.concatenate([m['uv'] for m in parts]), col=np.concatenate([m['col'] for m in parts]), F=np.concatenate(FF))
    if h: s = h / (hi - lo)[1]; M['P'] = M['P'] * [1, s, 1]; hi = hi.copy(); hi[1] = lo[1] + h
    M = crease(compact(decimate(fuse(M), tris)), deg)
    if tint:  # la teinte principale devient blanche : elle est donnée par l'instance
        c = M['col']; M['col'] = np.repeat(np.clip(c.mean(1) / np.median(c.mean(1)), 0.15, 1.1)[:, None], 3, 1)
    Q = 32000 / np.abs(M['P']).max()
    OUT[id] = dict(near=[dict(t='ft' if tint else 'f', q=round(float(Q), 3), p=b64(np.round(M['P'] * Q).astype('<i2')), n=b64(np.round(M['N'] * 127).astype('i1')), u='', c=b64(np.clip(np.round(M['col'] * 200), 0, 255).astype('u1')), i=b64(M['F'].astype('<u2')))], size=[round(float(x), 2) for x in hi - lo])
    print('%-10s %5d -> %4d tri' % (id, tot, len(M['F'])), OUT[id]['size'])


add('table', 'Table', 0, 1.6, 160)
add('tablerond', 'Table Large Circular', 0, 1.3, 300)
add('basse', 'Coffee Table', 0, 1.15, 312)
add('bureau', 'Desk-V86Go2rlnq', 0, 1.6, 700)
add('bureau2', 'Desk', 0, 1.55, 166, h=0.78)
add('bureau3', 'Desk-7ban171PzCS', 0, 1.6, 500)
add('chaise', 'Office Chair', 1, 1.1, 620)
add('pouf', 'Chair-1MFMOaz3zqe', 0, 0.95, 380, tint=True)
add('canape', 'Couch Medium', 0, 2.05, 560, tint=True)
add('fauteuil', 'Couch Small-ZOPP3KzNIk', 0, 1.2, 460, tint=True)
add('coussin', 'Cushions', 0, 1.6, 420, rot=90)
add('biblio', 'Medium Book Shelf', 0, 1.5, 380, h=1.75)
add('etagere', 'Shelf', 1, 1.5, 156, rot=-90)
add('meubletv', 'Shelf Small', 0, 1.5, 92)
add('ecran', 'Monitor', 0, 1.05, 292, rot=-90)
add('ordi', 'Computer', 0, 0.7, 600)
add('armoire', 'Cabinet', 0, 1.3, 324)
add('chevet', 'Night Stand', 1, 0.55, 184)
add('classeur', 'File Cabinet', 1, 1.35, 480, rot=-90)
add('plante1', 'Houseplant-VtJh4Irl4w', 1, 1.15, 316)
add('plante2', 'Houseplant-bfLOqIV5uP', 1, 1.0, 449)
add('plante3', 'Houseplant-e9oRt-Ct6js', 1, 1.0, 512)
add('plante4', 'Plant - White Pot', 1, 1.2, 640)
add('cactus', 'Houseplant', 1, 0.3, 200)
add('lampe', 'Light Floor', 1, 1.65, 226)
add('lampe2', 'Lamp', 1, 1.55, 380)
add('lampebur', 'Light Desk', 1, 0.45, 240)
add('plafond', 'Ceiling Light', 1, 0.95, 196)
add('plafond2', 'Light Cube', 1, 0.95, 400)
add('tapis', 'Rug', 0, 2.4, 192)
add('tapisrond', 'Rug Round', 0, 2.1, 376)
add('cartons', 'Cardboard Boxes', 1, 1.5, 432)
add('carton', 'Cardboard Box', 1, 0.6, 144)
add('fontaine', 'Water Cooler', 1, 1.35, 520)
add('distrib', 'Vending Machine', 1, 1.95, 700)
add('toilettes', 'Toilet', 1, 0.95, 402)
add('lavabo', 'Bathroom Sink', 1, 0.95, 350)
add('rouleaux', 'Toilet Paper stack', 1, 0.3, 200)
add('porteman', 'Coat rack', 1, 1.75, 420)
add('poubelle', 'Trashcan', 1, 0.6, 240)
add('corbeille', 'Trash Bin', 1, 0.42, 238)
add('extinct', 'Fire Extinguisher', 1, 0.55, 360)
add('imprim', 'Printer', 0, 0.45, 182)
add('livres', 'Book Stack', 1, 0.22, 400)
add('mug', 'Mug', 1, 0.12, 200)
add('cafe', 'Coffee cup', 1, 0.16, 160)
add('soda', 'Soda Can', 1, 0.13, 160)
add('papiers', 'Various Stacks of Paper', 2, 0.45, 300)
add('bloc', 'Notebook', 2, 0.28, 120)
add('trophee', 'Trophy', 1, 0.45, 300)
add('skate', 'Skateboard', 0, 0.85, 320)
# objets muraux : dos contre le mur (-z), face vers la pièce (+z)
add('horloge', 'Analog clock', 1, 0.5, 360, rot=-90)
add('tableaub', 'Whiteboard', 0, 1.5, 120)
add('liege', 'Message board', 0, 1.2, 320, rot=-90)
add('cible', 'Dartboard', 1, 0.62, 500, rot=-90)
add('calend', 'Calendar', 1, 0.75, 1600, deg=10)
add('aeration', 'Air Vent', 1, 0.5, 324, rot=-90, deg=10)
add('photos', 'Polaroids', 0, 0.8, 1000, rot=-90, deg=10)
add('etagmur', 'Wall Shelf', 0, 1.1, 92, rot=-90)
add('postit', 'Sticky Notes', 1, 0.55, 24, tint=True)
add('sortie', 'Fire Exit Sign', 0, 0.75, 643, rot=-90)
add('inter', 'Light Switch', 1, 0.17, 156, rot=-90)
add('prise', 'Electrical outlet', 1, 0.16, 120)
add('serviette', 'Towel Rack', 0, 0.7, 192)
add('rideau', 'Curtains Double', 1, 1.95, 160, tint=True, drop=('LightMetal',), keep=lambda c: c[:, 0] < 0)
add('store', 'Window Blinds', 0, 1.6, 300, h=0.4)
add('camera', 'CCTV Camera', 1, 0.36, 420)
for i, a in enumerate(['Wall Art 02', 'Wall Art 03', 'Wall Art 05', 'Wall Art 06', 'Wall Art 06-1U5roiXQZAM']): add(f'art{i}', a, 1, 1.0, 130, rot=180)
s = '// Généré par tools/meubles2js.py depuis le pack « Office Pack » : ne pas modifier à la main.\nexport const MEUBLES = ' + json.dumps(OUT, separators=(',', ':')) + ';\n'
open(ROOT + '/js/meubles.js', 'w', encoding='utf-8', newline='\n').write(s); print('meubles.js', len(s) // 1024, 'Ko', len(OUT))
