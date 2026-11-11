"""Genera las figuras del proyecto (Pillow, sin matplotlib)."""
from __future__ import annotations

import math
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
sys.path.insert(0, ROOT)

from plot import Fig
from replicador_atencion import Params, campo, equilibrios, jacobiano, rhs

OUT = os.path.join(ROOT, "figuras")
os.makedirs(OUT, exist_ok=True)

AZUL, ROJO, VERDE, NARANJA, GRIS = "#1f4e79", "#c00000", "#2e7d32", "#c55a11", "#7f7f7f"
EPS = 1e-12

CASOS = {
    "colapso": Params(m=20, n=100, sigma=0.5, r=1.0, d_b=1.0, cA=10.0, cH=2.0),
    "frontera": Params(m=1, n=10, sigma=0.5, r=0.12, d_b=10.0, cA=1.0, cH=1.0),
    "coexistencia": Params(m=20, n=100, sigma=0.5, r=1.0, d_b=3.0, cA=2.0, cH=2.0),
}


# ---------------------------------------------------------------------------
# integracion
# ---------------------------------------------------------------------------
def f_vec(p, Z):
    return np.array([rhs(0.0, z, p) for z in Z])


def flow(p, ic, T, dt=0.02):
    """RK4 con piso numerico (evita la absorcion artificial en x=1)."""
    Z = np.array([ic], float)
    n = int(round(T / dt))
    out = np.empty((n + 1, 2))
    out[0] = Z[0]
    for i in range(n):
        k1 = f_vec(p, Z)
        k2 = f_vec(p, np.clip(Z + dt / 2 * k1, EPS, 1 - EPS))
        k3 = f_vec(p, np.clip(Z + dt / 2 * k2, EPS, 1 - EPS))
        k4 = f_vec(p, np.clip(Z + dt * k3, EPS, 1 - EPS))
        Z = np.clip(Z + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4), EPS, 1 - EPS)
        out[i + 1] = Z[0]
    return out


def flow_many(p, Z0, T, dt=0.1):
    Z = Z0.copy()
    n = int(round(T / dt))
    for _ in range(n):
        k1 = np.stack(campo(Z[:, 0], Z[:, 1], p), axis=1)
        k2 = np.stack(campo(*np.clip(Z + dt / 2 * k1, EPS, 1 - EPS).T, p), axis=1)
        k3 = np.stack(campo(*np.clip(Z + dt / 2 * k2, EPS, 1 - EPS).T, p), axis=1)
        k4 = np.stack(campo(*np.clip(Z + dt * k3, EPS, 1 - EPS).T, p), axis=1)
        Z = np.clip(Z + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4), EPS, 1 - EPS)
    return Z


def flechas(f, p, nx=12, ny=12, color="#a9bccd"):
    xs = np.linspace(0.04, 0.96, nx)
    ys = np.linspace(0.05, 0.95, ny)
    X, Y = np.meshgrid(xs, ys)
    U, V = campo(X, Y, p)
    N = np.hypot(U, V)
    N[N == 0] = 1
    for x, y, u, v, nn in zip(X.ravel(), Y.ravel(), U.ravel(), V.ravel(), N.ravel()):
        L = 0.028 * (0.4 + 0.6 * min(1.0, nn / N.max()))
        f.arrow(x, y, x + u / nn * L, y + v / nn * L, color=color, width=0.9, head=4)


# ---------------------------------------------------------------------------
# Fig 1: esquema conceptual
# ---------------------------------------------------------------------------
def fig_esquema():
    import plot
    _old = plot.SCALE
    plot.SCALE = 1.0
    try:
        W, H = 1000, 520
        f = Fig(W, H)

        def caja(l, t, r, b, titulo, lineas, color, fill, ts=15, bs=13):
            f.box_mm(l, t, r, b, fill=fill, outline=color, width=2.0, radius=10)
            f.text((l + r) / 2, t + 8, titulo, size=ts, anchor="mt", color=color, family="bold")
            for i, s_ in enumerate(lineas):
                f.text((l + r) / 2, t + 26 + i * 19, s_, size=bs, anchor="mt", color="#222222")

        f.text(W / 2, 8, "Estructura del modelo (dos poblaciones)", size=20, anchor="mt",
               color="#111111", family="bold")

        caja(20, 50, 300, 158, "PRODUCTORES (m)", ["eligen esfuerzo", "ingreso r por vista"], AZUL,
             "#eaf1f8", ts=15, bs=12)
        caja(20, 172, 148, 268, "Alto esfuerzo H", ["calidad bH", "costo cH", "fracción x"], AZUL,
             "#ffffff", ts=12, bs=11)
        caja(160, 172, 300, 268, "Bajo esfuerzo L", ["calidad bL", "costo 0", "fracción 1−x"], AZUL,
             "#ffffff", ts=12, bs=11)

        caja(700, 50, 980, 158, "CONSUMIDORES (n)", ["atención σ", "mσ ítems por período"], NARANJA,
             "#fdeee4", ts=15, bs=12)
        caja(700, 172, 828, 268, "Búsqueda activa A", ["paga cA", "fracción y"], NARANJA,
             "#ffffff", ts=12, bs=11)
        caja(840, 172, 980, 268, "Consumo pasivo P", ["sin costo", "fracción 1−y"], NARANJA,
             "#ffffff", ts=12, bs=11)

        f.box_mm(362, 74, 638, 140, fill="#f4f4f4", outline=GRIS, width=1.6, radius=8)
        f.text(500, 84, "visibilidad = vistas", size=14, anchor="mt", color="#333333", family="bold")
        f.text(500, 108, "recompensa r por vista", size=12, anchor="mt", color="#555555")

        f.arrow_px(300, 104, 358, 104, AZUL, 1.8, head=7)
        f.text(329, 90, "oferta", size=11, anchor="mt", color=AZUL, family="italic")
        f.arrow_px(700, 104, 642, 104, NARANJA, 1.8, head=7)
        f.text(671, 90, "atención", size=11, anchor="mt", color=NARANJA, family="italic")

        f.arrow_px(500, 140, 500, 168, VERDE, 2.0, head=7)
        f.text(510, 146, "más A  →  más vistas para H  →  sube x", size=11, anchor="lt", color=VERDE)
        f.text(510, 163, "más x  →  buscar no compensa  →  baja y", size=11, anchor="lt", color=VERDE)

        f.text(W / 2, 288, "Realimentación doble:  y ↑ → x ↑      y      x ↑ → y ↓", size=12,
               anchor="mt", color="#333333", family="italic")

        f.box_mm(120, 315, 880, 505, fill="#fbfbfb", outline="#333333", width=1.6, radius=9)
        f.text(500, 325, "Sistema replicador suave a trozos", size=16, anchor="mt", color="#111111",
               family="bold")
        f.text(500, 352, "x′ = x(1−x)·ΔπH        y′ = y(1−y)·ΔπA", size=17, anchor="mt", color=AZUL,
               family="bold")
        f.text(500, 382, "Δπ cambia según  x ≥ σ  (la calidad satura la atención)  o  x < σ", size=12,
               anchor="mt", color="#444444")
        f.text(500, 404, "conmutación en x = σ:  continuo pero no diferenciable", size=12,
               anchor="mt", color=ROJO)
        f.text(500, 426, "invariante: el cuadrado [0,1]² se conserva", size=11, anchor="mt", color="#777777")
        f.text(500, 452, "cada rama es polinomial; el pliegue aparece en x = σ", size=11,
               anchor="mt", color="#777777")
        return f.save(os.path.join(OUT, "fig1_esquema.png"))
    finally:
        plot.SCALE = _old


# ---------------------------------------------------------------------------
# Fig 2: tres regimenes
# ---------------------------------------------------------------------------
def fig_regimenes():
    W, H = 1560, 850
    f = Fig(W, H)
    nombre = {"colapso": "(a) Colapso", "frontera": "(b) Frontera", "coexistencia": "(c) Coexistencia"}
    col = {"colapso": ROJO, "frontera": NARANJA, "coexistencia": AZUL}
    Ics = {"colapso": [(0.15, 0.15), (0.7, 0.2), (0.95, 0.55), (0.5, 0.85)],
           "frontera": [(0.85, 0.95), (0.95, 0.6), (0.7, 0.98), (0.2, 0.3)],
           "coexistencia": [(0.2, 0.1), (0.6, 0.1), (0.95, 0.5), (0.5, 0.9)]}

    for i, key in enumerate(["colapso", "frontera", "coexistencia"]):
        p = CASOS[key]
        l = 30 + i * 510
        box = (l + 70, 45, l + 480, 385)
        f.axes((0, 1), (0, 1), box=box, xlabel="x: fracción de alto esfuerzo",
               ylabel="y: fracción de consumidores activos", title=nombre[key],
               xticks=[0, 0.5, 1], yticks=[0, 0.5, 1], tickfmt="{:.1f}")
        flechas(f, p)
        f.vline(p.sigma, "#555555", 1)
        f.dtext(p.sigma + 0.015, 0.05, "x = σ", size=10, anchor="lb", color="#555555")
        for ic in Ics[key]:
            Z = flow(p, ic, 600, dt=0.04)
            st = max(1, len(Z) // 700)
            f.line(Z[::st], col[key], 1.8)
        for nm, xs, ys, _ in equilibrios(p):
            if 0 <= xs <= 1 and 0 <= ys <= 1:
                ev = np.linalg.eigvals(jacobiano(xs, ys, p))
                f.marker(xs, min(ys, 0.985), VERDE if np.all(np.real(ev) < 0) else ROJO, 6)

        box2 = (l + 70, 465, l + 480, 765)
        f.axes((0, 60), (0, 1.02), box=box2, xlabel="t (períodos)", ylabel="fracciones",
               xticks=[0, 15, 30, 45, 60], yticks=[0, 0.5, 1], tickfmt="{:g}")
        Z = flow(p, Ics[key][0], 60, dt=0.02)
        t = np.linspace(0, 60, len(Z))
        f.line(np.c_[t, Z[:, 0]], AZUL, 2.0)
        f.line(np.c_[t, Z[:, 1]], ROJO, 2.0)
        if key == "coexistencia":
            nm, xs, ys, _ = [e for e in equilibrios(p) if e[0].startswith("coexisten")][0]
            f.hline(xs, GRIS, 1)
            f.hline(ys, GRIS, 1)
            f.text(f.px(56), f.py(xs) - 3, "x*", size=10, anchor="mm", color=GRIS)
            f.text(f.px(56), f.py(ys) + 11, "y*", size=10, anchor="mm", color=GRIS)
        f.d.rectangle([f.px(36) * 3, f.py(1.01) * 3, f.px(59.5) * 3, f.py(0.78) * 3], fill="#ffffff")
        f.line([(38, 0.93), (44, 0.93)], AZUL, 2.4)
        f.dtext(45.5, 0.93, "x(t)", size=11, anchor="lm", color=AZUL, family="bold")
        f.line([(38, 0.845), (44, 0.845)], ROJO, 2.4)
        f.dtext(45.5, 0.845, "y(t)", size=11, anchor="lm", color=ROJO, family="bold")
        f.dtext(58.5, 0.05, "IC = (%g, %g)" % Ics[key][0], size=10, anchor="rm", color="#666666")

    f.text(W / 2, 805, "Punto verde: equilibrio asintóticamente estable.  Punto rojo: silla.  "
                       "Línea vertical punteada: superficie de conmutación x = σ.", size=12.5,
           anchor="mt", color="#555555")
    return f.save(os.path.join(OUT, "fig2_regimenes.png"))


# ---------------------------------------------------------------------------
# Fig 3: cuencas
# ---------------------------------------------------------------------------
def fig_cuencas():
    W, H = 1560, 720
    f = Fig(W, H)
    f.text(W / 2, 10, "Cuencas de atracción en el cuadrado de condiciones iniciales (x0, y0)",
           size=19, anchor="mt", color="#111111", family="bold")
    N = 110
    xs = np.linspace(0.005, 0.995, N)
    X, Y = np.meshgrid(xs, xs)
    Z0 = np.c_[X.ravel(), Y.ravel()]
    for i, key in enumerate(["frontera", "coexistencia"]):
        p = CASOS[key]
        Z = flow_many(p, Z0.copy(), 900, dt=0.1)
        eqs = [(nm, a, b) for nm, a, b, _ in equilibrios(p)]
        d = np.array([np.hypot(Z[:, 0] - a, Z[:, 1] - b) for _, a, b in eqs]).T
        idx = np.argmin(d, axis=1)
        mind = d[np.arange(len(d)), idx]
        pal = {"colapso (0,0)": "#dcdcdc", "frontera (x*,1)": "#f8cbad", "coexistencia (x*,y*)": "#bdd7ee"}
        cols = [pal.get(eqs[k][0], "#c9c9c9") if mind[j] < 0.02 else "#f2f2f2" for j, k in enumerate(idx)]
        box = (150, 95, 720, 575) if i == 0 else (965, 95, 1525, 575)
        l = box[0] - 90
        f.axes((0, 1), (0, 1), box=box, xlabel="x0: fracción inicial de alto esfuerzo",
               ylabel="y0: fracción inicial activa",
               title="(a) Parámetros de frontera" if i == 0 else "(b) Parámetros de coexistencia",
               xticks=[0, 0.5, 1], yticks=[0, 0.5, 1], tickfmt="{:.1f}")
        dx = (box[2] - box[0]) / N
        for k in range(len(Z0)):
            x0, y0 = Z0[k]
            px, py = f.px(x0), f.py(y0)
            f.d.rectangle([px * 3, (py - dx) * 3, (px + dx) * 3, py * 3], fill=cols[k])
        flechas(f, p, nx=11, ny=11, color="#606060")
        for nm, a, b in eqs:
            if 0 <= a <= 1 and 0 <= b <= 1:
                f.marker(a, min(b, 0.985), VERDE, 6)
        items = [("#dcdcdc", "colapso (0,0)"), ("#f8cbad", "frontera (y→1)"),
                 ("#bdd7ee", "coexistencia")]
        for j, (c, s) in enumerate(items):
            bx = box[0] + j * 185
            f.d.rectangle([bx * 3, 618 * 3, (bx + 15) * 3, 633 * 3], fill=c)
            f.text(bx + 21, 626, s, size=11.5, anchor="lm", color="#333333")
    f.text(W / 2, 680, "Malla de 110 × 110 condiciones iniciales, RK4 con T = 900.  "
                       "Punto verde: equilibrio atractor correspondiente.", size=12.5,
           anchor="mt", color="#555555")
    return f.save(os.path.join(OUT, "fig3_cuencas.png"))


# ---------------------------------------------------------------------------
# Fig 4: bifurcaciones
# ---------------------------------------------------------------------------
def _estado(p):
    """(x*, y*, regimen) del atractor no trivial, o (0,0,'colapso')."""
    if p.discriminacion < p.cA:
        return 0.0, 0.0, "colapso"
    if p.incentivo > 1.0:
        xi = 1 - p.cA / (p.m * p.sigma * p.d_b)
        return xi, p.cH / (p.r * p.n * p.sigma) * xi, "coexistencia"
    xb = p.r * p.n * p.sigma / p.cH
    return min(xb, 1.0), 1.0, "frontera"


def fig_bifurcacion():
    W, H = 1560, 700
    f = Fig(W, H)
    f.text(W / 2, 10, "Bifurcaciones: pliegue no suave en x = σ  y  transcrítica en y = 1",
           size=19, anchor="mt", color="#111111", family="bold")
    base = dict(m=20, n=100, sigma=0.5, r=1.0, d_b=3.0, cH=2.0)

    # (a) vs cA
    box = (140, 90, 720, 560)
    f.axes((0, 22), (0, 1.02), box=box, xlabel="costo de la búsqueda activa  cA",
           ylabel="equilibrio", title="(a) Variando cA (r = 1 fijo)",
           xticks=[0, 5, 10, 15, 20], yticks=[0, 0.25, 0.5, 0.75, 1], tickfmt="{:g}")
    f.d.rectangle([f.px(15) * 3, f.py(1.02) * 3, f.px(22) * 3, f.py(0) * 3], fill="#ededed")
    f.text(f.px(18.4), f.py(0.5), "colapso", size=14, anchor="mm", color="#777777", rotate=90)
    cAs = np.linspace(0.001, 15, 500)
    xs_, ys_ = [], []
    for c in cAs:
        p = Params(cA=c, **base)
        a, b, r = _estado(p)
        xs_.append(a); ys_.append(b)
    f.line([(c, v) for c, v in zip(cAs, xs_) if v == v], AZUL, 3.0)
    f.line([(c, v) for c, v in zip(cAs, ys_) if v == v], ROJO, 2.2)
    f.line([(15, 0), (22, 0)], ROJO, 2.2)
    f.dtext(6.0, 0.90, "x*  (calidad)", size=12, anchor="lm", color=AZUL, family="bold")
    f.dtext(6.0, 0.83, "y*  (selectividad)", size=12, anchor="lm", color=ROJO, family="bold")
    f.vline(15, "#333333", 1.2)
    f.dtext(15.2, 0.30, "cA = mσ(1−σ)(bH−bL)", size=11.5, anchor="lb", color="#333333")
    f.dtext(15.2, 0.22, "el equilibrio interior alcanza x = σ\ny desaparece (pliegue no suave)",
           size=11, anchor="lb", color="#333333")

    # (b) vs r
    box = (900, 90, 1470, 560)
    f.axes((0, 0.1), (0, 1.02), box=box, xlabel="recompensa por vista  r",
           ylabel="equilibrio", title="(b) Variando r (cA = 10 fijo)",
           xticks=[0, 0.025, 0.05, 0.075, 0.1], yticks=[0, 0.25, 0.5, 0.75, 1], tickfmt="{:g}")
    base2 = dict(m=20, n=100, sigma=0.5, d_b=3.0, cH=2.0)
    rs = np.linspace(0.0005, 0.1, 500)
    xs_, ys_ = [], []
    for rv in rs:
        p = Params(cA=10.0, r=rv, **base2)
        a, b, rg = _estado(p)
        xs_.append(a if rg != "frontera" else np.nan)
        ys_.append(b if rg != "frontera" else np.nan)
    xb_ = [min(0.5 * 100 * rv / 2, 1) for rv in rs]
    f.line([(rv, v) for rv, v in zip(rs, xb_)], NARANJA, 3.0)
    f.line([(rv, v) for rv, v in zip(rs, xs_) if v == v], AZUL, 3.0)
    f.line([(rv, v) for rv, v in zip(rs, ys_) if v == v], ROJO, 2.2)
    f.line([(rv, 1.0) for rv in rs if rv <= 0.0267], NARANJA, 3.0)
    f.dtext(0.052, 0.90, "y* = 1  (todos activos)", size=12, anchor="lm", color=NARANJA, family="bold")
    f.dtext(0.045, 0.30, "x*  (calidad)", size=12, anchor="lm", color=AZUL, family="bold")
    f.dtext(0.045, 0.20, "y*  (selectividad)", size=12, anchor="lm", color=ROJO, family="bold")
    f.vline(0.0267, "#333333", 1.2)
    f.dtext(0.0285, 0.62, "r n σ = cH\n(transcrítica: el interior\n alcanza y = 1)", size=11,
           anchor="lb", color="#333333")
    f.dtext(0.012, 0.08, "frontera", size=12, anchor="lm", color=NARANJA, family="bold")
    f.dtext(0.055, 0.08, "coexistencia", size=12, anchor="lm", color=AZUL, family="bold")

    f.text(W / 2, 630, "m = 20, n = 100, σ = 0.5, bH−bL = 3.  En (b) el umbral de colapso "
                       "(independiente de r) no se alcanza: cA = 10 < mσ(1−σ)(bH−bL) = 15.",
           size=12.5, anchor="mt", color="#555555")
    return f.save(os.path.join(OUT, "fig4_bifurcacion.png"))


# ---------------------------------------------------------------------------
# Fig 5: mapa de regimenes
# ---------------------------------------------------------------------------
def fig_mapa():
    W, H = 1020, 780
    f = Fig(W, H)
    f.text(W / 2, 10, "Mapa de regímenes en el plano (σ, cA)", size=19, anchor="mt",
           color="#111111", family="bold")
    m, n, r, db, cH = 20, 100, 0.03, 3.0, 2.0
    box = (130, 90, 960, 620)
    f.axes((0.0, 1.0), (0, 20), box=box, xlabel="capacidad de atención σ",
           ylabel="costo de la búsqueda activa cA",
           xticks=[0, 0.25, 0.5, 0.75, 1], yticks=[0, 5, 10, 15, 20], tickfmt="{:g}")
    sig = np.linspace(0.002, 0.998, 500)
    par = m * sig * (1 - sig) * db
    seg = m * sig * db * (1 - r * n * sig / cH)
    seg = np.where(seg > 0, seg, 0.0)

    for j in range(len(sig) - 1):
        x0, x1 = f.px(sig[j]) * 3, f.px(sig[j + 1]) * 3
        f.d.rectangle([x0, f.py(20) * 3, x1, f.py(par[j]) * 3], fill="#e9e9e9")
        if seg[j] > 0 and par[j] > seg[j]:
            f.d.rectangle([x0, f.py(par[j]) * 3, x1, f.py(seg[j]) * 3], fill="#fdf0e4")
    f.line([(s, v) for s, v in zip(sig, par)], ROJO, 3.0)
    f.line([(s, v) for s, v in zip(sig, seg) if v > 0], AZUL, 3.0)
    f.dtext(0.5, 18.4, "COLAPSO", size=18, anchor="mt", color="#8a8a8a", family="bold")
    f.dtext(0.13, 12.6, "FRONTERA", size=16, anchor="mm", color=NARANJA, family="bold")
    f.dtext(0.34, 2.2, "COEXISTENCIA", size=18, anchor="mm", color=AZUL, family="bold")
    f.dtext(0.62, 15.6, "cA = mσ(1−σ)(bH−bL)", size=12.5, anchor="lb", color=ROJO, family="italic")
    f.dtext(0.16, 4.2, "cA = mσ(bH−bL)(1 − rnσ/cH)", size=12.5, anchor="lb", color=AZUL, family="italic")
    f.dtext(0.5, 0.9, "σ* = cH/(rn) = 0.67", size=11, anchor="lt", color="#666666")
    f.text(W / 2, 678, "m = 20 · n = 100 · r = 0.03 · bH−bL = 3 · cH = 2", size=9.5,
           anchor="mt", color="#555555")
    return f.save(os.path.join(OUT, "fig5_mapa.png"))


if __name__ == "__main__":
    for fn in (fig_esquema, fig_regimenes, fig_cuencas, fig_bifurcacion, fig_mapa):
        print(fn.__name__, "->", fn())
