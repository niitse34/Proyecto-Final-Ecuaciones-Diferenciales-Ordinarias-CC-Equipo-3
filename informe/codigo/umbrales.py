"""Umbral de colapso c_A*: continuación numérica frente a la fórmula m·σ(1−σ)·Δ.

Se parte del equilibrio de coexistencia con c_A pequeño y se aumenta c_A en pasos,
usando como condición inicial el estado final del paso anterior (continuación
cuasiestática). El umbral numérico es el primer c_A en que el estado seguido cae
al colapso; se afina por bisección.
"""
import numpy as np
from modelo import PARAMS, integrar

def sobrevive(z0, p, T=600):
    _, x, y = integrar(z0, T, p, rtol=1e-10, atol=1e-10)
    return x[-1] > 0.5*p["s"], (x[-1], y[-1])

def umbral(s, base="coexistencia", paso=0.002, tol=1e-6):
    p = dict(PARAMS[base], s=s)
    teo = p["m"]*s*(1 - s)*p["D"]
    cA = 0.5*teo
    A = cA/(p["m"]*s*p["D"]); x = 1 - A; z = (x, min(x/(p["r"]*p["n"]*s/p["cH"]), 0.999))
    ok_cA, ok_z = cA, z
    while True:                      # barrido ascendente con continuación
        cA = ok_cA*(1 + paso)
        vivo, zf = sobrevive(ok_z, dict(p, cA=cA))
        if not vivo: break
        ok_cA, ok_z = cA, zf
    lo, hi = ok_cA, cA               # bisección partiendo siempre del último estado vivo
    while (hi - lo)/teo > tol:
        mid = 0.5*(lo + hi)
        vivo, zf = sobrevive(ok_z, dict(p, cA=mid))
        if vivo: lo, ok_z = mid, zf
        else: hi = mid
    num = 0.5*(lo + hi)
    return teo, num, abs(num - teo)/teo

if __name__ == "__main__":
    print("sigma  teorico   numerico   error_rel")
    for s in (0.2, 0.3, 0.4, 0.5, 0.6, 0.7):
        teo, num, err = umbral(s)
        print(f"{s:.1f}  {teo:9.5f}  {num:9.5f}  {err:.2e}")
