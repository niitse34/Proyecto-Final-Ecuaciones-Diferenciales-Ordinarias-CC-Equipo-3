"""Modelo replicador de la economía de la atención (Chujyo et al., 2026).

Integración en coordenadas logit u = ln(x/(1-x)), v = ln(y/(1-y)):
    u' = Δπ_H(x, y),   v' = Δπ_A(x, y)
Es una reescritura exacta del sistema x' = x(1-x)Δπ_H, y' = y(1-y)Δπ_A que
evita la pérdida de precisión cuando x o y se acercan a 0 o a 1.
"""
import numpy as np
from scipy.integrate import solve_ivp
from scipy.special import expit

PARAMS = {  # m, n, sigma, r, Delta, cA, cH
    "colapso":      dict(m=20, n=100, s=0.5, r=1.0,  D=1.0,  cA=10.0, cH=2.0),
    "frontera":     dict(m=1,  n=10,  s=0.5, r=0.12, D=10.0, cA=1.0,  cH=1.0),
    "coexistencia": dict(m=20, n=100, s=0.5, r=1.0,  D=3.0,  cA=2.0,  cH=2.0),
}

def ventajas(x, y, p):
    m, n, s, r, D, cA, cH = (p[k] for k in ("m", "n", "s", "r", "D", "cA", "cH"))
    if x >= s:
        return -cH + r*n*s*y/x, -cA + m*s*D*(1 - x)
    return -cH + r*n*(1 - s)*y/(1 - x), -cA + m*(1 - s)*D*x

def campo_xy(t, z, p):
    x, y = z
    dH, dA = ventajas(x, y, p)
    return [x*(1 - x)*dH, y*(1 - y)*dA]

def campo_logit(t, w, p):
    return list(ventajas(expit(w[0]), expit(w[1]), p))

def logit(q):
    return np.log(q/(1 - q))

def integrar(z0, T, p, t_eval=None, rtol=1e-10, atol=1e-10):
    sol = solve_ivp(campo_logit, (0, T), [logit(z0[0]), logit(z0[1])], args=(p,),
                    method="RK45", rtol=rtol, atol=atol, t_eval=t_eval, max_step=0.5)
    return sol.t, expit(sol.y[0]), expit(sol.y[1])
