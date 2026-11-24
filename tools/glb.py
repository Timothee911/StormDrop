# Lecture d'un .glb, simplification de maillage et sortie compacte (partagé par nature2js et meubles2js).
import base64, heapq, json, struct
import numpy as np

CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}


def quat(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])


def load(path):
    b = open(path, 'rb').read(); n = struct.unpack_from('<I', b, 12)[0]; j = json.loads(b[20:20 + n]); o = 20 + n + 8

    def acc(i):
        a = j['accessors'][i]; t = CT[a['componentType']]; c = NC[a['type']]
        if 'bufferView' not in a: return np.zeros((a['count'], c))
        v = j['bufferViews'][a['bufferView']]; off = o + v.get('byteOffset', 0) + a.get('byteOffset', 0); st = v.get('byteStride', 0)
        if st and st != np.dtype(t).itemsize * c: r = np.array([np.frombuffer(b, t, c, off + k * st) for k in range(a['count'])])
        else: r = np.frombuffer(b, t, a['count'] * c, off).reshape(-1, c)
        r = r.astype(np.float64)
        return r / np.iinfo(t).max if a.get('normalized') else r

    def mat(nd):
        if 'matrix' in nd: return np.array(nd['matrix']).reshape(4, 4).T
        M = np.eye(4)
        if 'rotation' in nd: M[:3, :3] = quat(nd['rotation'])
        if 'scale' in nd: M[:3, :3] = M[:3, :3] * np.array(nd['scale'])
        if 'translation' in nd: M[:3, 3] = nd['translation']
        return M
    out = []

    def walk(k, M):
        nd = j['nodes'][k]; M = M @ mat(nd)
        if 'mesh' in nd:
            for q in j['meshes'][nd['mesh']]['primitives']:
                if q.get('mode', 4) != 4: continue
                A = q['attributes']; P = acc(A['POSITION']); N = acc(A['NORMAL']) if 'NORMAL' in A else None
                F = (acc(q['indices']).astype(int).ravel() if 'indices' in q else np.arange(len(P))).reshape(-1, 3)
                P = P @ M[:3, :3].T + M[:3, 3]
                if np.linalg.det(M[:3, :3]) < 0: F = F[:, [0, 2, 1]]
                if N is None:
                    N = np.zeros_like(P); fn = np.cross(P[F[:, 1]] - P[F[:, 0]], P[F[:, 2]] - P[F[:, 0]])
                    for c in range(3): np.add.at(N, F[:, c], fn)
                else: N = N @ np.linalg.inv(M[:3, :3])
                N = N / np.maximum(1e-9, np.linalg.norm(N, axis=1))[:, None]
                m = j['materials'][q['material']] if 'material' in q else {}
                tx = m.get('pbrMetallicRoughness', {}).get('baseColorTexture'); im = None
                if tx is not None:
                    i = j['images'][j['textures'][tx['index']]['source']]; v = j['bufferViews'][i['bufferView']]; im = b[o + v.get('byteOffset', 0):][:v['byteLength']]
                out.append(dict(P=P, N=N, F=F, uv=acc(A['TEXCOORD_0']) if 'TEXCOORD_0' in A else np.zeros((len(P), 2)), col=acc(A['COLOR_0'])[:, :3] if 'COLOR_0' in A else np.ones((len(P), 3)), mat=m, img=im))
        for c in nd.get('children', []): walk(c, M)
    for k in j['scenes'][j.get('scene', 0)]['nodes']: walk(k, np.eye(4))
    return out


def weld(P, tol=1e-4):
    k = {}; w = np.array([k.setdefault(tuple(x), len(k)) for x in np.round(P / tol).astype(int)], int)
    G = np.zeros((len(k), 3)); G[w] = P
    return w, G


def comps(F, w):
    par = list(range(int(w.max()) + 1))

    def fd(a):
        while par[a] != a: par[a] = par[par[a]]; a = par[a]
        return a
    for a, b, c in w[F]: par[fd(a)] = fd(b); par[fd(b)] = fd(c)
    return np.array([fd(a) for a in w[F[:, 0]]])


def area(P, F): return np.linalg.norm(np.cross(P[F[:, 1]] - P[F[:, 0]], P[F[:, 2]] - P[F[:, 0]]), axis=1) / 2


def decimate(m, target, tol=1e-4):
    """Effondrement d'arêtes (quadriques) : un sommet rejoint un voisin existant, les coutures UV et
    de normales suivent (chaque « coin » retrouve celui du même côté de la couture)."""
    if len(m['F']) <= target: return m
    w, G = weld(m['P'], tol); F = [tuple(t) for t in m['F']]; V = [tuple(int(x) for x in w[list(t)]) for t in F]
    alive = [len(set(v)) == 3 for v in V]; nt = sum(alive); adj = {}
    for i, v in enumerate(V):
        if alive[i]:
            for a in v: adj.setdefault(a, set()).add(i)
    Q = np.zeros((len(G), 4, 4)); ec = {}
    for i, v in enumerate(V):
        if not alive[i]: continue
        n = np.cross(G[v[1]] - G[v[0]], G[v[2]] - G[v[0]]); l = np.linalg.norm(n)
        if l < 1e-14: continue
        n = n / l; p = np.append(n, -n @ G[v[0]]); K = np.outer(p, p) * l
        for a in v: Q[a] += K
        for k in range(3): ec.setdefault(tuple(sorted((v[k], v[(k + 1) % 3]))), []).append((i, n, l))
    for (a, b), L in ec.items():  # bords ouverts : plan de garde
        if len(L) == 1:
            e = G[b] - G[a]; n = np.cross(e, L[0][1]); l = np.linalg.norm(n)
            if l > 1e-12:
                n /= l; p = np.append(n, -n @ G[a]); K = np.outer(p, p) * (e @ e) * 2
                Q[a] += K; Q[b] += K
    ver = [0] * len(G)

    def cost(a, b):
        x = np.append(G[b], 1); d = G[a] - G[b]
        return float(x @ (Q[a] + Q[b]) @ x) + 1e-7 * float(d @ d)
    H = []

    def push(a):
        for b in {x for i in adj[a] for x in V[i]}:
            if b != a:
                heapq.heappush(H, (cost(a, b), a, b, ver[a], ver[b])); heapq.heappush(H, (cost(b, a), b, a, ver[b], ver[a]))
    for a in list(adj): push(a)
    while nt > target and H:
        _, a, b, va, vb = heapq.heappop(H)
        if ver[a] != va or ver[b] != vb or a not in adj or b not in adj: continue
        sh = adj[a] & adj[b]
        if not sh: continue
        cm = {}
        for i in sh: cm[F[i][V[i].index(a)]] = F[i][V[i].index(b)]
        ok = True; new = []
        for i in adj[a] - sh:
            k = V[i].index(a); old = G[list(V[i])]; nv = list(V[i]); nv[k] = b
            if F[i][k] not in cm: ok = False; break
            n0 = np.cross(old[1] - old[0], old[2] - old[0]); q = G[nv]; n1 = np.cross(q[1] - q[0], q[2] - q[0])
            if n0 @ n1 < 0.15 * np.linalg.norm(n0) * np.linalg.norm(n1) or np.linalg.norm(n1) < 1e-10: ok = False; break
            nf = list(F[i]); nf[k] = cm[F[i][k]]; new.append((i, tuple(nv), tuple(nf)))
        if not ok: continue
        for i in sh:
            alive[i] = False; nt -= 1
            for c in V[i]: adj[c].discard(i)
        for i, nv, nf in new: V[i] = nv; F[i] = nf; adj[b].add(i)
        del adj[a]; Q[b] += Q[a]; ver[a] += 1; ver[b] += 1; push(b)
    return dict(m, F=np.array([F[i] for i in range(len(F)) if alive[i]]))


def compact(m):
    u, inv = np.unique(m['F'], return_inverse=True)
    return dict(m, P=m['P'][u], N=m['N'][u], uv=m['uv'][u], col=m['col'][u], F=inv.reshape(-1, 3))


def b64(a): return base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()
