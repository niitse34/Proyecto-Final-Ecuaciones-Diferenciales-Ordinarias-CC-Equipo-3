"""Cuencas de atracción en una malla N×N de condiciones iniciales (x0, y0)."""
import sys, time, numpy as np
from multiprocessing import Pool
from modelo import PARAMS, integrar

ATRACTORES = {"colapso": [(0, 0)],
              "frontera": [(0, 0), (0.6, 1.0)],
              "coexistencia": [(0, 0), (1 - 1/15, (1 - 1/15)/25)]}
T_FINAL, TOL_DIST = 400.0, 1e-3

def clasificar(args):
    k, x0, y0 = args
    _, x, y = integrar((x0, y0), T_FINAL, PARAMS[k], rtol=1e-9, atol=1e-9)
    d = [np.hypot(x[-1]-a, y[-1]-b) for a, b in ATRACTORES[k]]
    i = int(np.argmin(d))
    return i if d[i] < TOL_DIST else -1

def mapa(k, N):
    g = (np.arange(N) + 0.5)/N              # centros de celda, sin tocar los bordes
    with Pool() as pool:
        r = pool.map(clasificar, [(k, x0, y0) for y0 in g for x0 in g], chunksize=64)
    return np.array(r).reshape(N, N)        # filas = y0, columnas = x0

if __name__ == "__main__":
    N = int(sys.argv[1]) if len(sys.argv) > 1 else 200
    out = {}
    for k in ("colapso", "frontera", "coexistencia"):
        t0 = time.time(); M = mapa(k, N); out[k] = M
        vals, cnt = np.unique(M, return_counts=True)
        print(k, dict(zip(vals.tolist(), (cnt/M.size*100).round(2).tolist())), f"{time.time()-t0:.1f}s")
    np.savez(f"cuencas_{N}.npz", **out)
