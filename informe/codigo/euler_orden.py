"""Orden observado de Euler frente a una referencia RK45 de alta precisión."""
import numpy as np
from scipy.integrate import solve_ivp
from modelo import PARAMS, campo_xy, campo_logit, logit
from scipy.special import expit

def euler(z0, T, p, h):
    N = int(round(T/h)); z = np.array(z0, float); Z = [z.copy()]
    for _ in range(N):
        z = z + h*np.array(campo_xy(0, z, p)); Z.append(z.copy())
    return np.linspace(0, T, N+1), np.array(Z)

def tabla(z0, T, hs, p):
    ref = solve_ivp(campo_logit, (0, T), [logit(z0[0]), logit(z0[1])], args=(p,),
                    rtol=1e-12, atol=1e-12, dense_output=True)
    E = []
    for h in hs:
        t, Z = euler(z0, T, p, h)
        R = expit(ref.sol(t)).T
        E.append(np.max(np.abs(Z - R)))
    return E

if __name__ == "__main__":
    p = PARAMS["coexistencia"]
    hs = [0.1/2**k for k in range(8)]
    for z0, T in [((0.9, 0.05), 20), ((0.9, 0.05), 5)]:
        E = tabla(z0, T, hs, p)
        print("CI", z0, "T", T)
        for i, (h, e) in enumerate(zip(hs, E)):
            print(f"  h={h:.6f}  E={e:.3e}  p={'—' if i==0 else f'{np.log2(E[i-1]/e):.3f}'}")
