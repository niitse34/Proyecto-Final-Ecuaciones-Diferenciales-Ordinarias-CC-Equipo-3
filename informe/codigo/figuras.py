"""Figuras del informe final con un estilo gráfico único.

Uso:  python figuras.py            (necesita cuencas_200.npz, ver cuencas.py)
Código de color fijo en todo el informe:
    granate  -> colapso      petróleo -> coexistencia      ocre -> frontera
    tinta    -> estructura (sillas, separatrices, ejes)
"""
import numpy as np, matplotlib as mpl
mpl.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager as fm
from scipy.integrate import solve_ivp
from scipy.special import expit
from modelo import PARAMS, integrar, campo_xy, campo_logit, logit
from euler_orden import tabla as tabla_euler, euler

OUT = "figuras/"
for f in fm.findSystemFonts():
    if "SourceSans3" in f or "SourceSerif4" in f:
        fm.fontManager.addfont(f)

TINTA, GRANATE, PETROLEO, OCRE, PIZARRA = "#1d1d1f", "#8a2b2b", "#1f5c69", "#b07d22", "#7a7f87"
CLARO = {"colapso": "#ead9d3", "coexistencia": "#cfe0e1", "frontera": "#efe0bd"}
mpl.rcParams.update({
    "font.family": "Source Sans 3", "font.size": 7.6, "axes.titlesize": 7.6,
    "axes.labelsize": 7.6, "xtick.labelsize": 6.8, "ytick.labelsize": 6.8,
    "axes.linewidth": 0.55, "xtick.major.width": 0.55, "ytick.major.width": 0.55,
    "xtick.major.size": 2.6, "ytick.major.size": 2.6, "xtick.direction": "in", "ytick.direction": "in",
    "axes.spines.top": False, "axes.spines.right": False, "axes.edgecolor": TINTA,
    "text.color": TINTA, "axes.labelcolor": TINTA, "xtick.color": TINTA, "ytick.color": TINTA,
    "legend.frameon": False, "legend.fontsize": 6.6, "savefig.dpi": 300, "lines.linewidth": 1.1,
    "mathtext.fontset": "custom", "mathtext.rm": "Source Sans 3", "mathtext.it": "Source Sans 3:italic",
})
ANCHO, COL = 6.85, 3.3   # pulgadas: ancho de texto y de columna

def letra(ax, s, x=-0.16, y=1.04):
    ax.text(x, y, s, transform=ax.transAxes, fontsize=8.4, fontweight="semibold", va="bottom")

def equilibrio(ax, x, y, estable, color=TINTA, s=22, z=6):
    ax.scatter([x], [y], s=s, zorder=z, clip_on=False, linewidths=0.9,
               facecolors=color if estable else "white", edgecolors=color)

def campo_fondo(ax, p):
    g = np.linspace(0.005, 0.995, 40); X, Y = np.meshgrid(g, g)
    U = np.zeros_like(X); V = np.zeros_like(Y)
    for i in range(40):
        for j in range(40):
            U[i, j], V[i, j] = campo_xy(0, (X[i, j], Y[i, j]), p)
    sp = np.hypot(U, V) + 1e-12
    ax.streamplot(X, Y, U/sp, V/sp, color="#c9c6bf", linewidth=0.4, density=0.9,
                  arrowsize=0.45, arrowstyle="-|>", zorder=1)

# ---------------------------------------------------------------- portada
def portada():
    p = PARAMS["coexistencia"]
    fig = plt.figure(figsize=(5.6, 5.6)); ax = fig.add_axes([0, 0, 1, 1]); ax.axis("off")
    rng = np.random.default_rng(7)
    for k in range(70):
        z0 = (rng.uniform(0.02, 0.98), rng.uniform(0.01, 0.6))
        t, x, y = integrar(z0, 120, p, t_eval=np.linspace(0, 120, 4000))
        fin = x[-1] > 0.5
        ax.plot(x, np.sqrt(y), lw=0.32 if fin else 0.28, alpha=0.85 if fin else 0.5,
                color=PETROLEO if fin else GRANATE)
    ax.set_xlim(-0.02, 1.02); ax.set_ylim(-0.02, 0.8)
    fig.savefig(OUT + "portada.png", dpi=400, transparent=True)
    plt.close(fig)

# ---------------------------------------------------------------- borde y = 1
def borde():
    p = PARAMS["frontera"]; s = p["s"]
    x = np.linspace(0, 1, 801)
    v = np.where(x >= s, (1 - x)*(p["r"]*p["n"]*s - p["cH"]*x),
                 x*(p["r"]*p["n"]*(1 - s) - p["cH"]*(1 - x)))
    fig, ax = plt.subplots(figsize=(COL, 1.75))
    ax.axhline(0, color=TINTA, lw=0.55)
    ax.axvline(s, color=PIZARRA, lw=0.6, ls=(0, (1.5, 2)))
    ax.fill_between(x, v, 0, where=v > 0, color=CLARO["frontera"], lw=0)
    ax.plot(x[x < s], v[x < s], color=TINTA); ax.plot(x[x >= s], v[x >= s], color=TINTA)
    for xx, est in ((0, True), (0.4, False), (0.6, True), (1, False)):
        equilibrio(ax, xx, 0, est, color=OCRE if xx == 0.6 else TINTA)
    for a, b, d in ((0.33, 0.07, -1), (0.47, 0.53, 1), (0.83, 0.67, -1)):
        ax.annotate("", xy=(b, -0.008), xytext=(a, -0.008),
                    arrowprops=dict(arrowstyle="-|>", lw=0.6, color=TINTA, mutation_scale=6))
    ax.text(0.385, 0.01, r"$x_s=0.4$", ha="right", fontsize=6.8)
    ax.text(0.615, 0.01, r"$x_b=0.6$", ha="left", fontsize=6.8, color=OCRE)
    ax.text(s + 0.012, -0.043, r"$x=\sigma$", fontsize=6.6, color=PIZARRA)
    ax.text(0.2, -0.05, "rama $x<\\sigma$", ha="center", fontsize=6.6, color=PIZARRA)
    ax.text(0.8, -0.05, "rama $x\\geq\\sigma$", ha="center", fontsize=6.6, color=PIZARRA)
    ax.set_xlim(0, 1); ax.set_ylim(-0.055, 0.058)
    ax.set_xlabel("$x$ sobre la arista $y=1$"); ax.set_ylabel(r"$\dot{x}$")
    fig.tight_layout(pad=0.3); fig.savefig(OUT + "fig_borde.png"); plt.close(fig)

# ---------------------------------------------------------------- regímenes
CIS = {"colapso": [(0.1, 0.1), (0.5, 0.5), (0.9, 0.1), (0.3, 0.85)],
       "frontera": [(0.2, 0.2), (0.5, 0.5), (0.8, 0.9), (0.95, 0.6)],
       "coexistencia": [(0.2, 0.05), (0.5, 0.1), (0.8, 0.2), (0.5, 0.5)]}
EQ = {"colapso": [((0, 0), True, GRANATE), ((0, 1), False, TINTA), ((1, 0), False, TINTA), ((1, 1), False, TINTA)],
      "frontera": [((0, 0), True, GRANATE), ((0.6, 1), True, OCRE), ((0.4, 1), False, TINTA),
                   ((0, 1), False, TINTA), ((1, 0), False, TINTA), ((1, 1), False, TINTA)],
      "coexistencia": [((0, 0), True, GRANATE), ((14/15, 14/375), True, PETROLEO), ((1/15, 14/375), False, TINTA),
                       ((0, 1), False, TINTA), ((1, 0), False, TINTA), ((1, 1), False, TINTA)]}
DESTINO = {"colapso": GRANATE, "frontera": OCRE, "coexistencia": PETROLEO}

def regimenes():
    fig = plt.figure(figsize=(ANCHO, 4.1))
    gs = fig.add_gridspec(2, 3, height_ratios=[1.35, 0.75], hspace=0.42, wspace=0.28,
                          left=0.065, right=0.99, top=0.95, bottom=0.09)
    titulos = {"colapso": "Colapso", "frontera": "Frontera", "coexistencia": "Coexistencia"}
    for j, k in enumerate(("colapso", "frontera", "coexistencia")):
        p = PARAMS[k]; ax = fig.add_subplot(gs[0, j]); at = fig.add_subplot(gs[1, j])
        campo_fondo(ax, p)
        ax.axvline(p["s"], color=PIZARRA, lw=0.6, ls=(0, (1.5, 2)), zorder=2)
        T = 80
        for z0 in CIS[k]:
            t, x, y = integrar(z0, T, p, t_eval=np.linspace(0, T, 3000))
            c = GRANATE if x[-1] < 0.05 else DESTINO[k]
            ax.plot(x, y, color=c, lw=0.9, zorder=3)
            ax.scatter([z0[0]], [z0[1]], s=9, color=c, zorder=4, marker="s", linewidths=0)
            at.plot(t, x, color=c, lw=0.9); at.plot(t, y, color=c, lw=0.9, ls=(0, (3, 1.6)))
        for (ex, ey), est, c in EQ[k]:
            equilibrio(ax, ex, ey, est, c)
        ax.set_xlim(0, 1); ax.set_ylim(0, 1); ax.set_aspect("equal")
        ax.set_xlabel("$x$  (productores de alto esfuerzo)", labelpad=1.5)
        if j == 0: ax.set_ylabel("$y$  (consumidores activos)")
        ax.set_title(titulos[k], loc="left", fontweight="semibold", pad=3)
        at.set_xlim(0, T); at.set_ylim(-0.03, 1.03); at.set_xlabel("$t$", labelpad=1)
        if j == 0: at.set_ylabel("fracción")
        letra(ax, "abc"[j], x=-0.2 if j == 0 else -0.12); letra(at, "def"[j], x=-0.2 if j == 0 else -0.12, y=1.02)
    at.plot([], [], color=TINTA, lw=0.9, label="$x(t)$"); at.plot([], [], color=TINTA, lw=0.9, ls=(0, (3, 1.6)), label="$y(t)$")
    at.legend(loc="center right", handlelength=2.2)
    fig.savefig(OUT + "fig_regimenes.png"); plt.close(fig)

# ---------------------------------------------------------------- bifurcaciones
def bifurcaciones():
    fig, axs = plt.subplots(1, 3, figsize=(ANCHO, 2.15), gridspec_kw=dict(wspace=0.42))
    # (a) pliegue no suave: coexistencia variando c_A, sigma = 0.5
    ax = axs[0]; p = PARAMS["coexistencia"]; cs = p["m"]*p["s"]*(1 - p["s"])*p["D"]
    cA = np.linspace(0.01, cs, 300)
    ax.plot(cA, 1 - cA/30, color=PETROLEO, lw=1.3)
    ax.plot(cA, cA/30, color=TINTA, lw=0.9, ls=(0, (3, 1.8)))
    ax.plot([0, 20], [0, 0], color=GRANATE, lw=1.6, clip_on=False)
    ax.axhline(p["s"], color=PIZARRA, lw=0.6, ls=(0, (1.5, 2)))
    for c in np.linspace(1, 14.6, 9):     # comprobación numérica sobre la rama estable
        _, x, _ = integrar((1 - c/30 + 0.002, (1 - c/30)/25), 400, dict(p, cA=c))
        ax.scatter([c], [x[-1]], s=10, facecolors="white", edgecolors=PETROLEO, linewidths=0.8, zorder=5)
    ax.scatter([cs], [0.5], s=26, color=TINTA, zorder=6, marker="D", linewidths=0)
    ax.annotate("pliegue\nno suave", xy=(cs, 0.5), xytext=(15.8, 0.66),
                fontsize=6.4, ha="left", arrowprops=dict(arrowstyle="-", lw=0.5, color=TINTA))
    ax.text(1.2, 0.66, "$x_c$ estable", color=PETROLEO, fontsize=6.6)
    ax.text(8.5, 0.13, "$x_L$ silla", color=TINTA, fontsize=6.6)
    ax.text(16, 0.05, "colapso", color=GRANATE, fontsize=6.6)
    ax.set_xlim(0, 20); ax.set_ylim(-0.02, 1.0); ax.set_xlabel("$c_A$"); ax.set_ylabel("$x^*$")
    letra(ax, "a", x=-0.27)
    # (b) transcrítica: frontera variando r
    ax = axs[1]; p = PARAMS["frontera"]; rc = 0.16
    r1 = np.linspace(0.101, rc, 50); r2 = np.linspace(rc, 0.3, 80)
    ax.plot(r1, np.ones_like(r1), color=OCRE, lw=1.6)
    ax.plot(r2, np.ones_like(r2), color=OCRE, lw=0.9, ls=(0, (3, 1.8)))
    ax.plot(r2, 0.8/(5*r2), color=PETROLEO, lw=1.3)
    ax.plot(r1, 0.8/(5*r1), color=PETROLEO, lw=0.6, ls=(0, (1, 1.6)), alpha=0.7)
    ax.scatter([rc], [1], s=26, color=TINTA, zorder=6, marker="D", linewidths=0)
    ax.annotate("transcrítica\n$A+B=1$", xy=(rc, 1), xytext=(0.19, 1.12), fontsize=6.4,
                arrowprops=dict(arrowstyle="-", lw=0.5, color=TINTA))
    ax.text(0.105, 0.9, "$E_b$ estable", color=OCRE, fontsize=6.6)
    ax.text(0.22, 0.6, "$E_c$ estable", color=PETROLEO, fontsize=6.6)
    ax.set_xlim(0.1, 0.3); ax.set_ylim(0.45, 1.3); ax.set_xlabel("$r$"); ax.set_ylabel("$y^*$")
    letra(ax, "b", x=-0.27)
    # (c) mapa de regímenes en (sigma, c_A)
    ax = axs[2]; s = np.linspace(0.001, 0.999, 400)
    c1 = 10*s*(1 - s); c2 = np.clip(10*s*(1 - 1.2*s), 0, None)
    ax.fill_between(s, c1, 3.2, color=CLARO["colapso"], lw=0)
    ax.fill_between(s, c2, c1, color=CLARO["coexistencia"], lw=0)
    ax.fill_between(s, 0, c2, color=CLARO["frontera"], lw=0)
    ax.plot(s, c1, color=TINTA, lw=0.8); ax.plot(s, c2, color=TINTA, lw=0.6, ls=(0, (3, 1.8)))
    ax.scatter([0.5], [1.0], s=14, color=OCRE, zorder=5, marker="s", linewidths=0)
    ax.text(0.17, 2.85, "colapso", ha="center", color=GRANATE, fontsize=6.8)
    ax.text(0.775, 1.3, "coexistencia", ha="center", va="center", rotation=-63, color=PETROLEO, fontsize=6.0)
    ax.text(0.3, 0.55, "frontera", ha="center", color="#7d5a17", fontsize=6.6)
    ax.annotate("máximo en $\\sigma=1/2$", xy=(0.5, 2.5), xytext=(0.56, 2.82), fontsize=6.2,
                arrowprops=dict(arrowstyle="-", lw=0.5, color=TINTA))
    ax.set_xlim(0, 1); ax.set_ylim(0, 3.2); ax.set_xlabel(r"$\sigma$"); ax.set_ylabel("$c_A$")
    letra(ax, "c", x=-0.27)
    fig.subplots_adjust(left=0.07, right=0.99, top=0.88, bottom=0.2)
    fig.savefig(OUT + "fig_bifurcaciones.png"); plt.close(fig)

# ---------------------------------------------------------------- cuencas
def separatriz(p, punto, T=60):
    """Variedad estable de una silla: integración hacia atrás desde dos puntos vecinos."""
    ramas = []
    for d in (+1, -1):
        x0, y0 = punto
        J = np.zeros((2, 2)); h = 1e-7
        for i in range(2):
            e = np.zeros(2); e[i] = h
            J[:, i] = (np.array(campo_xy(0, np.add(punto, e), p)) - np.array(campo_xy(0, np.subtract(punto, e), p)))/(2*h)
        w, V = np.linalg.eig(J); v = V[:, np.argmin(w.real)].real
        z0 = np.array(punto) + d*1e-5*v
        if not (0 < z0[0] < 1 and 0 < z0[1] < 1): continue
        f = lambda t, w_: [-a for a in campo_logit(t, w_, p)]
        sol = solve_ivp(f, (0, T), [logit(z0[0]), logit(z0[1])], rtol=1e-10, atol=1e-10, max_step=0.05)
        ramas.append((expit(sol.y[0]), expit(sol.y[1])))
    return ramas

def cuencas():
    D = np.load("cuencas_200.npz")
    fig, axs = plt.subplots(1, 3, figsize=(ANCHO, 2.45), gridspec_kw=dict(wspace=0.12))
    for j, k in enumerate(("colapso", "frontera", "coexistencia")):
        ax = axs[j]; M = D[k]; p = PARAMS[k]
        colores = [CLARO["colapso"], CLARO["frontera" if k == "frontera" else "coexistencia"]]
        img = np.zeros(M.shape + (3,))
        for v, c in enumerate(colores):
            img[M == v] = mpl.colors.to_rgb(c)
        img[M == -1] = (1, 1, 1)
        ax.imshow(img, origin="lower", extent=(0, 1, 0, 1), interpolation="nearest")
        ax.axvline(p["s"], color=PIZARRA, lw=0.6, ls=(0, (1.5, 2)))
        if k == "coexistencia":
            for xs, ys in separatriz(p, (1/15, 14/375)):
                ax.plot(xs, ys, color=TINTA, lw=0.8)
            equilibrio(ax, 1/15, 14/375, False); equilibrio(ax, 14/15, 14/375, True, PETROLEO)
        if k == "frontera":
            for xs, ys in separatriz(p, (0.4, 1 - 1e-9), T=80):
                ax.plot(xs, ys, color=TINTA, lw=0.8)
            equilibrio(ax, 0.4, 1, False); equilibrio(ax, 0.6, 1, True, OCRE)
        equilibrio(ax, 0, 0, True, GRANATE)
        pct = 100*np.mean(M == 1)
        ax.set_title(["Colapso", "Frontera", "Coexistencia"][j] + ("" if k == "colapso" else f"  ·  {pct:.1f} % sobrevive"),
                     loc="left", fontweight="semibold", pad=3)
        ax.set_xlim(0, 1); ax.set_ylim(0, 1); ax.set_xlabel("$x_0$", labelpad=1)
        if j == 0: ax.set_ylabel("$y_0$")
        else: ax.set_yticklabels([])
        for sp in ("top", "right"): ax.spines[sp].set_visible(True)
        letra(ax, "abc"[j], x=-0.17 if j == 0 else -0.06)
    fig.subplots_adjust(left=0.06, right=0.995, top=0.9, bottom=0.15)
    fig.savefig(OUT + "fig_cuencas.png"); plt.close(fig)

# ---------------------------------------------------------------- integradores
def integradores():
    p = PARAMS["coexistencia"]; hs = [0.1/2**k for k in range(8)]
    fig, axs = plt.subplots(1, 2, figsize=(ANCHO, 2.05), gridspec_kw=dict(wspace=0.3))
    ax = axs[0]
    for T, c, lab in ((20, TINTA, "$t\\in[0,20]$"), (5, PIZARRA, "$t\\in[0,5]$")):
        E = tabla_euler((0.9, 0.05), T, hs, p)
        ax.loglog(hs, E, "o-", color=c, ms=3, lw=0.9, mfc="white", mew=0.8, label=lab)
    h0, h1 = 2e-3, 1.6e-2; e0 = 2.2e-4
    ax.plot([h0, h1, h1, h0], [e0, e0, e0*h1/h0, e0], color=PIZARRA, lw=0.6)
    ax.text(h1*1.12, e0*2.6, "pendiente 1", fontsize=6.4, color=PIZARRA)
    ax.axvspan(0.0125, 0.11, color="#f2eee6", lw=0, zorder=0)
    ax.text(0.036, 0.13, "pasos de\nNumérico A", ha="center", fontsize=6.2, color=PIZARRA)
    ax.set_xlabel("paso $h$"); ax.set_ylabel("error máximo de Euler"); ax.legend(loc="upper left")
    letra(ax, "a", x=-0.2)
    ax = axs[1]; z0, T = (0.5, 0.05), 20
    ref = solve_ivp(campo_logit, (0, T), [logit(z0[0]), logit(z0[1])], args=(p,), rtol=1e-12, atol=1e-12, dense_output=True)
    te = np.linspace(0, T, 4001); R = expit(ref.sol(te)).T
    eu = []
    for h in (0.1, 0.03, 0.01, 0.003, 0.001):
        t, Z = euler(z0, T, p, h); eu.append((round(T/h), np.max(np.abs(Z - expit(ref.sol(t)).T))))
    rk = []
    for tol in (1e-4, 1e-6, 1e-8, 1e-10):
        s = solve_ivp(campo_xy, (0, T), z0, args=(p,), rtol=tol, atol=tol*1e-2, t_eval=te)
        rk.append((s.nfev, np.max(np.abs(s.y.T - R))))
    eu, rk = np.array(eu), np.array(rk)
    ax.loglog(eu[:, 0], eu[:, 1], "o-", color=GRANATE, ms=3, lw=0.9, mfc="white", mew=0.8, label="Euler")
    ax.loglog(rk[:, 0], rk[:, 1], "s-", color=PETROLEO, ms=3, lw=0.9, mfc="white", mew=0.8, label="RK45 (Dormand–Prince)")
    for (n, e), tol in zip(rk, ("$10^{-4}$", "$10^{-6}$", "$10^{-8}$", "$10^{-10}$")):
        ax.text(n*1.15, e, "rtol " + tol, fontsize=5.8, color=PETROLEO, va="center")
    ax.set_xlabel("evaluaciones del campo"); ax.set_ylabel("error máximo"); ax.legend(loc="lower left")
    ax.set_xlim(100, 6e4)
    letra(ax, "b", x=-0.2)
    fig.subplots_adjust(left=0.08, right=0.99, top=0.9, bottom=0.2)
    fig.savefig(OUT + "fig_integradores.png"); plt.close(fig)
    np.savetxt(OUT + "costo_euler.txt", eu); np.savetxt(OUT + "costo_rk45.txt", rk)

if __name__ == "__main__":
    import os, sys
    os.makedirs(OUT, exist_ok=True)
    quien = sys.argv[1:] or ["portada", "borde", "regimenes", "bifurcaciones", "integradores", "cuencas"]
    for f in quien:
        globals()[f](); print("ok", f)
