"""
replicador_atencion.py
======================
Reproduccion numerica del modelo de "economia de la atencion" de
Chujyo, Okada, Yamamoto, Lim & Toriumi (2026), arXiv:2602.06437.

Sistema replicador 2-poblacional, suave a trozos:

    x' = x (1-x) * Dx(x,y)
    y' = y (1-y) * Dy(x,y)

con

  Caso 1  (x >= sigma, la oferta de contenido de alta calidad satura la
           capacidad de atencion de los consumidores activos):

      Dx = -cH + r n sigma * y / x
      Dy = -cA + m sigma (bH-bL) (1-x)

  Caso 2  (x <  sigma, oferta insuficiente: los activos consumen todo lo
           de alta calidad y rellenan con contenido de baja calidad):

      Dx = -cH + r n y (1-sigma) / (1-x)
      Dy = -cA + m (1-sigma)(bH-bL) x

Ambas ramas coinciden en x = sigma (el campo es continuo pero no C^1:
la superficie de conmutacion x = sigma es un pliegue no suave).

Solo requiere numpy. Si matplotlib esta disponible, genera las figuras.

Uso:
    python replicador_atencion.py            # tablas de equilibrios y estabilidad
    python replicador_atencion.py --figuras  # ademas guarda las figuras PNG
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass

import numpy as np

# --------------------------------------------------------------------------
# Parametros
# --------------------------------------------------------------------------


@dataclass
class Params:
    m: float = 20.0          # numero de productores
    n: float = 100.0         # numero de consumidores
    sigma: float = 0.5       # capacidad de atencion (fraccion de items)
    r: float = 1.0           # recompensa por vista
    d_b: float = 3.0         # bH - bL (brecha de calidad)
    cA: float = 2.0          # costo de la estrategia activa
    cH: float = 2.0          # costo de la estrategia de alto esfuerzo

    # --- umbrales -------------------------------------------------------
    @property
    def discriminacion(self) -> float:
        """Primer umbral: m*sigma*(1-sigma)*(bH-bL)   (comparar con cA)."""
        return self.m * self.sigma * (1.0 - self.sigma) * self.d_b

    @property
    def incentivo(self) -> float:
        """Segundo umbral: cA/(m sigma db) + r n sigma/cH  (comparar con 1)."""
        return self.cA / (self.m * self.sigma * self.d_b) + self.r * self.n * self.sigma / self.cH

    @property
    def regimen(self) -> str:
        if self.discriminacion < self.cA:
            return "colapso"
        return "coexistencia" if self.incentivo > 1.0 else "frontera"


# --------------------------------------------------------------------------
# Campo vectorial
# --------------------------------------------------------------------------


def rhs(t, z, p: Params):
    x, y = z
    if x >= p.sigma:                                  # Caso 1
        dx = -p.cH + p.r * p.n * p.sigma * y / max(x, 1e-300)
        dy = -p.cA + p.m * p.sigma * p.d_b * (1.0 - x)
    else:                                             # Caso 2
        dx = -p.cH + p.r * p.n * y * (1.0 - p.sigma) / max(1.0 - x, 1e-300)
        dy = -p.cA + p.m * (1.0 - p.sigma) * p.d_b * x
    return np.array([x * (1.0 - x) * dx, y * (1.0 - y) * dy])


def campo(x, y, p: Params):
    """Version vectorizada del campo (para mapas de fases y cuencas)."""
    x = np.asarray(x, float)
    y = np.asarray(y, float)
    caso1 = x >= p.sigma
    dx = np.where(
        caso1,
        -p.cH + p.r * p.n * p.sigma * y / np.maximum(x, 1e-12),
        -p.cH + p.r * p.n * y * (1.0 - p.sigma) / np.maximum(1.0 - x, 1e-12),
    )
    dy = np.where(
        caso1,
        -p.cA + p.m * p.sigma * p.d_b * (1.0 - x),
        -p.cA + p.m * (1.0 - p.sigma) * p.d_b * x,
    )
    return x * (1.0 - x) * dx, y * (1.0 - y) * dy


# --------------------------------------------------------------------------
# Equilibrios, Jacobiano y estabilidad
# --------------------------------------------------------------------------


def equilibrios(p: Params):
    """Devuelve [(nombre, x*, y*, tipo)] con los equilibrios relevantes."""
    out = [("colapso (0,0)", 0.0, 0.0, "siempre estable")]
    xb = p.r * p.n * p.sigma / p.cH                     # frontera (x,1)
    if 0.0 < xb < 1.0:
        out.append(("frontera (x*,1)", xb, 1.0, "silla/nodo segun umbrales"))
    xi = 1.0 - p.cA / (p.m * p.sigma * p.d_b)           # coexistencia
    if 0.0 < xi < 1.0:
        yi = p.cH / (p.r * p.n * p.sigma) * xi
        out.append(("coexistencia (x*,y*)", xi, yi, "foco/nodo estable"))
    return out


def jacobiano(x, y, p: Params):
    """Jacobiano analitico (cada rama es polinomial, el campo es continuo en x=sigma)."""
    if x >= p.sigma:                                    # Caso 1
        # x' = -cH x(1-x) + r n sigma y (1-x)   ;   y' = y(1-y)(-cA + m sigma db (1-x))
        dxx = -p.cH * (1 - 2 * x) - p.r * p.n * p.sigma * y
        dxy = p.r * p.n * p.sigma * (1 - x)
        dyx = -y * (1 - y) * p.m * p.sigma * p.d_b
        dyy = (1 - 2 * y) * (-p.cA + p.m * p.sigma * p.d_b * (1 - x))
    else:                                               # Caso 2
        # x' = -cH x(1-x) + r n y (1-sigma) x   ;   y' = y(1-y)(-cA + m (1-sigma) db x)
        dxx = -p.cH * (1 - 2 * x) + p.r * p.n * y * (1 - p.sigma)
        dxy = p.r * p.n * x * (1 - p.sigma)
        dyx = y * (1 - y) * p.m * (1 - p.sigma) * p.d_b
        dyy = (1 - 2 * y) * (-p.cA + p.m * (1 - p.sigma) * p.d_b * x)
    return np.array([[dxx, dxy], [dyx, dyy]])


def clasificar(J):
    tr = np.trace(J)
    det = np.linalg.det(J)
    disc = tr * tr - 4 * det
    if det < 0:
        return "silla"
    if det > 0:
        if disc < 0:
            return "foco estable" if tr < 0 else ("foco inestable" if tr > 0 else "centro")
        return "nodo estable" if tr < 0 else ("nodo inestable" if tr > 0 else "degenerado")
    return "no hiperbolico"


# --------------------------------------------------------------------------
# Integrador RK45 (Dormand-Prince) con paso adaptativo
# --------------------------------------------------------------------------

_A = np.array([
    [0, 0, 0, 0, 0, 0],
    [1 / 5, 0, 0, 0, 0, 0],
    [3 / 40, 9 / 40, 0, 0, 0, 0],
    [44 / 45, -56 / 15, 32 / 9, 0, 0, 0],
    [19372 / 6561, -25360 / 2187, 64448 / 6561, -212 / 729, 0, 0],
    [9017 / 3168, -355 / 33, 46732 / 5247, 49 / 176, -5103 / 18656, 0],
    [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84],
])
_C = np.array([0.0, 1 / 5, 3 / 10, 4 / 5, 8 / 9, 1.0, 1.0])
_B5 = np.r_[_A[6], 0.0]
_B4 = np.array([5179 / 57600, 0, 7571 / 16695, 393 / 640, -92097 / 339200, 187 / 2100, 1 / 40])


def rk45(f, z0, t0, t1, h=1e-2, tol=1e-8, hmin=1e-10, nmax=2_000_000):
    """Dormand-Prince 5(4) con control de paso adaptativo."""
    z = np.asarray(z0, float)
    t = t0
    ts, zs = [t], [z.copy()]
    for _ in range(nmax):
        if t >= t1:
            break
        h = min(h, t1 - t)
        k = np.zeros((7, z.size))
        k[0] = f(t, z)
        for i in range(1, 7):
            k[i] = f(t + _C[i] * h, z + h * (_A[i, :i] @ k[:i]))
        z5 = z + h * (_B5 @ k)
        z4 = z + h * (_B4 @ k)
        err = np.linalg.norm(z5 - z4) / max(np.linalg.norm(z5), 1e-12)
        if err <= tol or h <= hmin:
            t += h
            z = z5          # sin recortar: [0,1]^2 es invariante y recortar crea atractores falsos
            ts.append(t)
            zs.append(z.copy())
        h = h * min(2.0, max(0.2, 0.9 * (tol / max(err, 1e-16)) ** 0.2))
    return np.array(ts), np.array(zs)


def euler(f, z0, t0, t1, dt):
    n = int(round((t1 - t0) / dt))
    ts = t0 + dt * np.arange(n + 1)
    zs = np.zeros((n + 1, 2))
    zs[0] = z0
    z = np.asarray(z0, float)
    for i in range(n):
        z = z + dt * f(ts[i], z)
        zs[i + 1] = z
    return ts, zs


# --------------------------------------------------------------------------
# Informe por consola
# --------------------------------------------------------------------------

CASOS = {
    "colapso": dict(m=20, n=100, sigma=0.5, r=1.0, d_b=1.0, cA=10.0, cH=2.0),
    "frontera": dict(m=1, n=10, sigma=0.5, r=0.12, d_b=10.0, cA=1.0, cH=1.0),
    "coexistencia": dict(m=20, n=100, sigma=0.5, r=1.0, d_b=3.0, cA=2.0, cH=2.0),
}


def informe():
    for nombre, kw in CASOS.items():
        p = Params(**kw)
        print("\n== %s | regimen = %s" % (nombre.upper(), p.regimen))
        print("   umbral de discriminacion  m*sigma*(1-sigma)*db = %.3f   (cA = %.3f)"
              % (p.discriminacion, p.cA))
        print("   umbral de incentivos      cA/(m*s*db) + r*n*s/cH = %.4f   (comparar con 1)"
              % p.incentivo)
        for nm, x, y, _ in equilibrios(p):
            J = jacobiano(x, y, p)
            ev = np.linalg.eigvals(J)
            print("   %-22s (%8.4f, %8.4f)  eig = %s  %s"
                  % (nm, x, y, np.round(ev, 4), clasificar(J)))
    print("\nEjecuta 'python tools/figs.py' para regenerar las figuras.")


if __name__ == "__main__":
    informe()
