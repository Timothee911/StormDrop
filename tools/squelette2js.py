# Convertit squelette.glb (mannequin statique en pose A) en js/squelette.js :
# le mesh est redimensionné (2,1 m), tourné face à -Z, les bras ramenés le long du corps,
# puis découpé sur le squelette du perso (torse, tête, bras, avant-bras, cuisses, tibias)
# et en zones de couleur (haut, pantalon, peau, mains, chaussures) teintées par chaque skin.
# Les triangles sont coupés le long des plans de découpe pour avoir des bords nets.
# Usage : python tools/squelette2js.py squelette.glb js/squelette.js [debug.npz]
import sys, json, struct, base64, math
import numpy as np

H = 2.1
SRC, DST = sys.argv[1], sys.argv[2]


def load(path):
    d = open(path, 'rb').read()
    l = struct.unpack('<I', d[12:16])[0]
    j = json.loads(d[20:20 + l])
    b = d[20 + l + 8:]

    def acc(i):
        a = j['accessors'][i]
        bv = j['bufferViews'][a['bufferView']]
        o = bv['byteOffset'] + a.get('byteOffset', 0)
        n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3}[a['type']]
        dt = {5123: np.uint16, 5126: np.float32, 5125: np.uint32}[a['componentType']]
        return np.frombuffer(b[o:o + a['count'] * n * np.dtype(dt).itemsize], dt).reshape(a['count'], n).astype(np.float64)

    pr = j['meshes'][0]['primitives'][0]
    idx = acc(pr['indices']).astype(np.int64).reshape(-1, 3)
    P = acc(pr['attributes']['POSITION'])
    N = acc(pr['attributes']['NORMAL'])
    P[:, 0] *= -1; P[:, 2] *= -1; N[:, 0] *= -1; N[:, 2] *= -1  # face -Z comme le perso du jeu
    s = H / (P[:, 1].max() - P[:, 1].min())
    P = (P - [(P[:, 0].max() + P[:, 0].min()) / 2, P[:, 1].min(), 0]) * s
    t = (P[:, 1] > 1.2) & (P[:, 1] < 1.45) & (np.abs(P[:, 0]) < 0.15)  # centre du buste en Z
    P[:, 2] -= (P[t, 2].max() + P[t, 2].min()) / 2
    # soupe de triangles : (T, 3, 6) = position + normale par coin
    return smooth(orient(np.concatenate([P[idx], N[idx]], axis=2)))


def smooth(T, crease=50):
    """Une passe de subdivision de Loop sur le corps (pas sur les petites pièces des mains),
    puis normales lissées : silhouette organique au lieu des grosses facettes du modèle."""
    V = T[:, :, :3]
    u, w = np.unique(np.round(V.reshape(-1, 3) / 1e-4).astype(int), axis=0, return_inverse=True)
    F = w.reshape(-1, 3); X = np.zeros((len(u), 3)); X[w] = V.reshape(-1, 3)
    par = list(range(len(X)))

    def fd(x):
        while par[x] != x: par[x] = par[par[x]]; x = par[x]
        return x
    for a, b, c in F: par[fd(a)] = fd(b); par[fd(b)] = fd(c)
    root = np.array([fd(a) for a in F[:, 0]])
    ids, cnt = np.unique(root, return_counts=True); main = ids[cnt.argmax()]
    body, rest = F[root == main], F[root != main]
    E, nb = {}, {}
    for f in body:
        for k in range(3):
            a, b, c = f[k], f[(k + 1) % 3], f[(k + 2) % 3]
            E.setdefault((min(a, b), max(a, b)), []).append(c)
            nb.setdefault(a, set()).update((b, c))
    hard = {}
    for (a, b), o in E.items():
        if len(o) != 2: hard.setdefault(a, []).append(b); hard.setdefault(b, []).append(a)
    Y = X.copy()
    for v, ns in nb.items():
        if v in hard:
            if len(hard[v]) == 2: Y[v] = X[v] * 0.75 + X[hard[v]].sum(0) * 0.125
            continue
        n = len(ns); beta = (0.625 - (0.375 + 0.25 * math.cos(2 * math.pi / n)) ** 2) / n
        Y[v] = X[v] * (1 - n * beta) + X[list(ns)].sum(0) * beta
    Y = list(Y); mid = {}
    for (a, b), o in E.items():
        mid[(a, b)] = len(Y)
        Y.append((X[a] + X[b]) * 0.375 + (X[o[0]] + X[o[1]]) * 0.125 if len(o) == 2 else (X[a] + X[b]) / 2)
    m = lambda a, b: mid[(min(a, b), max(a, b))]
    out = [list(f) for f in rest]
    for a, b, c in body:
        ab, bc, ca = m(a, b), m(b, c), m(c, a)
        out += [[a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]]
    Y, F = np.array(Y), np.array(out)
    G = np.cross(Y[F[:, 1]] - Y[F[:, 0]], Y[F[:, 2]] - Y[F[:, 0]])
    U = G / np.maximum(1e-12, np.linalg.norm(G, axis=1, keepdims=True))
    at = {}
    for i, f in enumerate(F):
        for v in f: at.setdefault(v, []).append(i)
    cc = math.cos(math.radians(crease)); R = np.zeros((len(F), 3, 6))
    for i, f in enumerate(F):
        for k, v in enumerate(f):
            js = at[v]; n = G[[j for j in js if U[j] @ U[i] > cc or j == i]].sum(0)
            R[i, k, :3] = Y[v]; R[i, k, 3:] = n / max(1e-12, np.linalg.norm(n))
    return R


def orient(T):
    """Tourne toutes les faces vers l'extérieur : le modèle source en a beaucoup d'inversées
    (invisibles en jeu, où les faces arrière ne sont pas dessinées)."""
    V = T[:, :, :3]
    _, w = np.unique(np.round(V.reshape(-1, 3) / 1e-4).astype(int), axis=0, return_inverse=True)
    F = w.reshape(-1, 3)
    E = {}
    for i, f in enumerate(F):
        for k in range(3):
            a, b = f[k], f[(k + 1) % 3]
            E.setdefault((min(a, b), max(a, b)), []).append((i, a < b))
    adj = [[] for _ in F]
    for v in E.values():
        if len(v) == 2:
            (i, a), (j, b) = v
            adj[i].append((j, a == b)); adj[j].append((i, a == b))  # True : sens opposés
    flip = np.full(len(F), -1); patches = []
    for r in range(len(F)):
        if flip[r] >= 0: continue
        flip[r] = 0; todo = [r]; comp = []
        while todo:
            i = todo.pop(); comp.append(i)
            for j, opp in adj[i]:
                if flip[j] < 0: flip[j] = flip[i] ^ int(opp); todo.append(j)
        patches.append(comp)
    G = np.cross(V[:, 1] - V[:, 0], V[:, 2] - V[:, 0])
    A, e1, e2 = V[:, 0], V[:, 1] - V[:, 0], V[:, 2] - V[:, 0]
    rng = np.random.default_rng(1)

    def hits(o, d):  # nombre de faces traversées par le rayon
        h = np.cross(d, e2); det = (e1 * h).sum(1)
        with np.errstate(divide='ignore', invalid='ignore'):
            q_ = o - A; u = (q_ * h).sum(1) / det; qq = np.cross(q_, e1); v = (qq @ d) / det; t = (e2 * qq).sum(1) / det
            return int(((np.abs(det) > 1e-14) & (u >= 0) & (v >= 0) & (u + v <= 1) & (t > 1e-9)).sum())

    for comp in patches:
        comp = np.array(comp); score = 0.0
        area = np.linalg.norm(G[comp], axis=1)
        for i in comp[np.argsort(-area)[:40]]:
            n = G[i] / np.linalg.norm(G[i]) * (-1 if flip[i] else 1)
            for _ in range(3):
                d = n + rng.normal(size=3) * 0.35; d /= np.linalg.norm(d)
                score += 1 if hits(V[i].mean(0) + n * 1e-4, d) % 2 == 0 else -1
        if score < 0: flip[comp] ^= 1
        if len(comp) > 20 or abs(score) < 30: print('morceau', len(comp), 'faces, confiance', score, '-> retournées', int(flip[comp].sum()))
    m = flip == 1
    T[m] = T[m][:, ::-1]; T[m, :, 3:] *= -1
    return T


def clip(tris, f):
    """Coupe chaque triangle le long de la surface f(p) = 0 (f linéaire par morceaux suffit)."""
    out = []
    for t in tris:
        v = np.array([f(c[:3]) for c in t])
        if (v >= 0).all() or (v <= 0).all():
            out.append(t); continue
        for sgn in (1, -1):
            poly = []
            for i in range(3):
                a, b = t[i], t[(i + 1) % 3]; va, vb = v[i] * sgn, v[(i + 1) % 3] * sgn
                if va >= 0: poly.append(a)
                if (va >= 0) != (vb >= 0):
                    k = va / (va - vb); c = a + (b - a) * k
                    c[3:] /= max(1e-9, np.linalg.norm(c[3:])); poly.append(c)
            for i in range(1, len(poly) - 1):
                out.append(np.array([poly[0], poly[i], poly[i + 1]]))
    return np.array(out)


T = load(SRC)

# --- repères anatomiques (mesurés sur le modèle, en mètres) ---
HIP_Y, KNEE_Y, NECK_Y, CHIN_Y, BELT_Y, SHOE_Y, COLLAR_Y = 1.0, 0.53, 1.76, 1.795, 1.07, 0.13, 1.765
HIP_X, SH_Z = 0.105, -0.02


JOINTS = {}


def armpts(sx):
    if sx in JOINTS: return tuple(v.copy() for v in JOINTS[sx])
    return (np.array([sx * 0.265, 1.655, SH_Z]), np.array([sx * 0.395, 1.405, SH_Z]), np.array([sx * 0.505, 1.165, SH_Z]))


def section(tris, f):
    """Centre et demi-étendues de la coupe du mesh par f(p) = 0 (f renvoie None hors zone)."""
    pts = []
    for t in tris:
        v = [f(c[:3]) for c in t]
        if any(x is None for x in v): continue
        for i in range(3):
            a, b = v[i], v[(i + 1) % 3]
            if (a >= 0) != (b >= 0): pts.append(t[i][:3] + (t[(i + 1) % 3][:3] - t[i][:3]) * (a / (a - b)))
    pts = np.array(pts)
    return (pts.max(0) + pts.min(0)) / 2, (pts.max(0) - pts.min(0)) / 2


def armline(p):  # > 0 côté bras (ligne d'aisselle inclinée vers le haut de l'épaule)
    x, y = abs(p[0]), p[1]
    return x - (0.2 + max(0.0, y - 1.45) * 0.33) if y > 1.3 else x - 0.24


def is_arm(c): return armline(c) > 0 and c[1] > 0.9


def hipline(p): return p[1] - (HIP_Y - 0.03 + abs(p[0]) * 0.3)


# centres réels des articulations : milieu de chaque coupe du membre
RAD = {}
for sx in (-1, 1):
    S, E, W = armpts(sx); sfx = 'R' if sx > 0 else 'L'
    S2, hs = section(T, lambda p: armline(p) if p[0] * sx > 0.1 and p[1] > 1.4 else None)
    out_ = []
    for o, d in ((E, E - S), (W, W - E)):
        n = d / np.linalg.norm(d); n[2] = 0; n /= np.linalg.norm(n)
        out_.append(section(T, lambda p: (p - o) @ n if p[0] * sx > 0.24 and 1.0 < p[1] < 1.6 else None))
    JOINTS[sx] = (S2, out_[0][0], out_[1][0])
    RAD['sh' + sfx] = hs; RAD['el' + sfx] = out_[0][1]
    for k, y0 in (('hip', 0.9), ('knee', KNEE_Y)):
        c, h = section(T, lambda p: p[1] - y0 if 0 < p[0] * sx < 0.3 else None)
        JOINTS[k + sfx] = c; RAD[k + sfx] = h

# découpes : épaules, coudes, poignets, hanches, genoux, menton, ceinture, chaussures, col
T = clip(T, lambda p: armline(p) if p[1] > 1.3 else 1.0)
for sx in (-1, 1):
    S, E, W = armpts(sx)
    u = (E - S) / np.linalg.norm(E - S); w = (W - E) / np.linalg.norm(W - E)
    T = clip(T, lambda p, E=E, u=u, sx=sx: (p - E) @ u if p[0] * sx > 0.24 else -1.0)
    T = clip(T, lambda p, E=E, W=W, w=w, sx=sx: (p - W) @ w + 0.03 if p[0] * sx > 0.24 else -1.0)
T = clip(T, lambda p: hipline(p) if abs(p[0]) < 0.26 else 1.0)
for y0 in (KNEE_Y, BELT_Y, SHOE_Y):
    T = clip(T, lambda p, y0=y0: p[1] - y0 if abs(p[0]) < 0.26 else 1.0)
for y0 in (CHIN_Y, COLLAR_Y):
    T = clip(T, lambda p, y0=y0: p[1] - y0 if abs(p[0]) < 0.15 else -1.0)

# --- os et zone de chaque triangle (selon son centre) ---
C = T[:, :, :3].mean(1)
bone = np.full(len(T), 'torso', dtype=object)
zone = np.full(len(T), 'shirt', dtype=object)
for i, c in enumerate(C):
    sx = 1 if c[0] >= 0 else -1; sfx = 'R' if sx > 0 else 'L'
    if is_arm(c):
        S, E, W = armpts(sx)
        u = (E - S) / np.linalg.norm(E - S); w = (W - E) / np.linalg.norm(W - E)
        if (c - E) @ u > 0:
            bone[i] = 'fore_' + sfx
            if (c - W) @ w + 0.03 > 0: zone[i] = 'hand'
        else:
            bone[i] = 'arm_' + sfx
        continue
    if hipline(c) < 0:
        bone[i] = ('knee_' if c[1] < KNEE_Y else 'hip_') + sfx
    elif c[1] > CHIN_Y and abs(c[0]) < 0.15:
        bone[i] = 'head'
    if c[1] < BELT_Y: zone[i] = 'pants'
    if c[1] < SHOE_Y: zone[i] = 'shoe'
    if c[1] > COLLAR_Y and abs(c[0]) < 0.15: zone[i] = 'skin'


# --- bras ramenés le long du corps (léger écart pour ne pas traverser les hanches) ---
def rot_axis(axis, ang):
    axis = axis / np.linalg.norm(axis)
    K = np.array([[0, -axis[2], axis[1]], [axis[2], 0, -axis[0]], [-axis[1], axis[0], 0]])
    return np.eye(3) + math.sin(ang) * K + (1 - math.cos(ang)) * K @ K


def rot_to(a, b):
    a = a / np.linalg.norm(a); b = b / np.linalg.norm(b)
    v = np.cross(a, b)
    if np.linalg.norm(v) < 1e-9: return np.zeros(3), 0.0
    return v, math.atan2(np.linalg.norm(v), a @ b)


def apply(R, o, pts):  # pts (n, 6)
    pts[:, :3] = (pts[:, :3] - o) @ R.T + o; pts[:, 3:] = pts[:, 3:] @ R.T


piv = {}
for sx in (-1, 1):
    sfx = 'R' if sx > 0 else 'L'
    S, E, W = armpts(sx)
    down = np.array([sx * math.sin(0.06), -math.cos(0.06), 0])
    ax1, a1 = rot_to(E - S, down); R1 = rot_axis(ax1, a1)
    E2 = R1 @ (E - S) + S; W2 = R1 @ (W - S) + S
    ax2, a2 = rot_to(W2 - E2, down); R2 = rot_axis(ax2, a2)
    for i in range(len(T)):
        b = bone[i]
        if b in ('arm_' + sfx, 'fore_' + sfx):
            apply(R1, S, T[i])
            if b == 'fore_' + sfx: apply(R2, E2, T[i])
        elif b == 'torso' and C[i][0] * sx > 0.1 and C[i][1] > 1.45:
            # le haut de l'épaule suit le bras en douceur (poids 1 sur la ligne d'aisselle)
            for c in T[i]:
                d = armline(c[:3]); k = min(1.0, max(0.0, 1 + d / 0.09)); k = k * k * (3 - 2 * k)
                h = min(1.0, max(0.0, (c[1] - 1.5) / 0.1)); k *= h * h * (3 - 2 * h)
                R = rot_axis(ax1, a1 * k); c[:3] = R @ (c[:3] - S) + S; c[3:] = R @ c[3:]
    piv['sh' + sfx], piv['el' + sfx], piv['wr' + sfx] = S, E2, R2 @ (W2 - E2) + E2
    h, k = JOINTS['hip' + sfx], JOINTS['knee' + sfx]
    piv['hip' + sfx] = np.array([h[0], HIP_Y - 0.03, h[2]])
    piv['knee' + sfx] = np.array([k[0], KNEE_Y, k[2]])
headm = bone == 'head'
hp = T[headm][:, :, :3].reshape(-1, 3)
piv['head'] = np.array([0, NECK_Y, float(np.median(hp[:, 2]))])
piv['torso'] = np.array([0, HIP_Y, 0.0])

# --- rotules : ellipsoïdes qui ferment les articulations quand un membre se plie ---
def ball(c, r, nu=10, nv=7):
    def pt(i, j):
        a, b = 2 * math.pi * (i % nu) / nu, math.pi * j / nv
        u = np.array([math.sin(b) * math.cos(a), math.cos(b), math.sin(b) * math.sin(a)])
        n = u / r
        return np.concatenate([c + u * r, n / np.linalg.norm(n)])
    tr = []
    for j in range(nv):
        for i in range(nu):
            q = [pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)]
            if j > 0: tr.append([q[0], q[1], q[2]])
            if j < nv - 1: tr.append([q[0], q[2], q[3]])
    return np.array(tr)


BALLS = []
for sfx in ('L', 'R'):
    e, k, h, sh = RAD['el' + sfx], RAD['knee' + sfx], RAD['hip' + sfx], RAD['sh' + sfx]
    re = max(0.04, min(e[2], math.hypot(e[0], e[1]))); rs = [0.06, 0.06, sh[2]]
    for g, bn, z, r in (('sh', 'arm_', 'shirt', rs), ('el', 'fore_', 'shirt', [re * 0.95] * 3),
                        ('knee', 'knee_', 'pants', [k[0] * 0.97, min(k[0], k[2]), k[2] * 0.97]),
                        ('hip', 'hip_', 'pants', [h[0] * 0.95, min(h[0], h[2]), h[2] * 0.95])):
        b_ = ball(piv[g + sfx], np.array(r)); BALLS.append(len(b_))
        T = np.concatenate([T, b_]); bone = np.append(bone, [bn + sfx] * len(b_)); zone = np.append(zone, [z] * len(b_))
bone = bone.astype(object); zone = zone.astype(object)
print({k: [round(float(x), 3) for x in v] for k, v in {**piv, **{'r_' + a: b for a, b in RAD.items()}}.items()})

parent = {'torso': None, 'head': 'torso', 'shL': 'torso', 'shR': 'torso', 'elL': 'shL', 'elR': 'shR',
          'hipL': None, 'hipR': None, 'kneeL': 'hipL', 'kneeR': 'hipR'}
gname = {'torso': 'torso', 'head': 'head', 'arm_L': 'shL', 'arm_R': 'shR', 'fore_L': 'elL', 'fore_R': 'elR',
         'hip_L': 'hipL', 'hip_R': 'hipR', 'knee_L': 'kneeL', 'knee_R': 'kneeR'}


def rel(g):
    p = parent[g]
    return piv[g] - (piv[p] if p else 0)


Q = 8192.0


def b64(a):
    return base64.b64encode(a.tobytes()).decode()


parts = {}
for bn, g in gname.items():
    parts[bn] = []
    for z in ('shirt', 'pants', 'skin', 'hand', 'shoe'):
        sel = T[(bone == bn) & (zone == z)]
        if not len(sel): continue
        V = sel.reshape(-1, 6).copy()
        V[:, :3] -= piv[g]
        V[:, 3:] /= np.maximum(1e-9, np.linalg.norm(V[:, 3:], axis=1, keepdims=True))
        qp = np.round(V[:, :3] * Q).astype('<i2'); qn = np.round(V[:, 3:] * 127).astype('i1')
        key = np.concatenate([qp.astype(np.int32), qn.astype(np.int32)], axis=1)
        _, first, inv = np.unique(key, axis=0, return_index=True, return_inverse=True)
        parts[bn].append({'m': z, 'p': b64(qp[first]), 'n': b64(qn[first]), 'i': b64(inv.ravel().astype('<u2'))})


def r5(v):
    return [round(float(x), 5) for x in v]


out = {'Q': Q, 'torsoY': HIP_Y, 'parts': parts,
       'pivots': {**{k: r5(rel(k)) for k in parent if k != 'torso'}, 'hand': r5(piv['wrR'] - piv['elR'] + [0, -0.05, 0])},
       # boîte de la tête (repère du groupe head) : pour poser chapeaux et accessoires
       'head': {'chin': round(float(hp[:, 1].min()) - NECK_Y, 4), 'top': round(float(hp[:, 1].max()) - NECK_Y, 4),
                'w': round(float(np.ptp(hp[:, 0])), 4), 'd': round(float(np.ptp(hp[:, 2])), 4),
                'z': round(float((hp[:, 2].max() + hp[:, 2].min()) / 2 - piv['head'][2]), 4)}}
with open(DST, 'w', encoding='utf-8', newline='\n') as f:
    f.write('// Mannequin commun à tous les skins : généré depuis squelette.glb par tools/squelette2js.py.\n')
    f.write('// Ne pas éditer à la main. Voir buildSquelette() dans cosmetics.js.\n')
    f.write('export const SQUELETTE = ' + json.dumps(out, separators=(',', ':')) + ';\n')
print(json.dumps({k: v for k, v in out.items() if k != 'parts'}))
print(len(T), 'triangles', {b: [p['m'] for p in v] for b, v in parts.items()})
if len(sys.argv) > 3:
    n = len(T)
    np.savez(sys.argv[3], P=T[:, :, :3].reshape(-1, 3), N=T[:, :, 3:].reshape(-1, 3), idx=np.arange(n * 3).reshape(n, 3),
             tb=bone.astype(str), zone=zone.astype(str))
