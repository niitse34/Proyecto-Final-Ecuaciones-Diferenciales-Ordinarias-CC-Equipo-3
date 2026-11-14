import numpy as np
from modelo import campo

def euler(Y0, t_span, p, h):
    """
    Y0: Cond inicial [x0, y0]
    t_span: Tupla con (tiempo_inicial, tiempo_final
    p: Objeto de la clase Parametros
    h: Tamno de paso (delta t)
    """
    t0, tf = t_span
    
    #cantidad de pasos
    n = int(round((tf - t0) / h))
    
    ts = np.linspace(t0, tf, n + 1) #Los tiempos que calculamos
    Ys = np.zeros((n + 1, len(Y0))) # n+1 filas y 2 columnas (x y y)
    
    # Condición inicial
    Ys[0] = Y0
    
    # Euler
    for k in range(n):
        Ys[k + 1] = Ys[k] + h * np.array(campo(ts[k], Ys[k], p))
        
    return ts, Ys

def graficar_comparacion_euler(Y0, t_span, p, h, titulo="RK45 vs Euler"):
    import matplotlib.pyplot as plt
    from rk45 import simular_rk45
    
    t_eval = np.linspace(t_span[0], t_span[1], 400)
    sol_rk = simular_rk45(Y0, t_span, p, t_eval=t_eval)
    ts_eu, Ys_eu = euler(Y0, t_span, p, h)
    
    fig, (ax_series, ax_fase) = plt.subplots(1, 2, figsize=(14, 5))
    
    # ---Series de Tiempo ---
    ax_series.plot(sol_rk.t, sol_rk.y[0], color='blue', linewidth=2.5, label='x(t) RK45')
    ax_series.plot(sol_rk.t, sol_rk.y[1], color='orange', linewidth=2.5, label='y(t) RK45')
    ax_series.plot(ts_eu, Ys_eu[:, 0], '--', color='cyan', linewidth=1.5, label=f'x(t) Euler')
    ax_series.plot(ts_eu, Ys_eu[:, 1], '--', color='red', linewidth=1.5, label=f'y(t) Euler')
    ax_series.set_title('Comparación de Series de Tiempo')
    ax_series.set_xlabel('Tiempo (t)')
    ax_series.set_ylabel('Proporción')
    ax_series.legend(loc='best')
    ax_series.grid(True, alpha=0.3)
    
    # -- Plano de Fase ---
    ax_fase.plot(sol_rk.y[0], sol_rk.y[1], color='blue', linewidth=2.5, label='Trayectoria RK45')
    ax_fase.plot(Ys_eu[:, 0], Ys_eu[:, 1], '--', color='red', linewidth=1.5, label=f'Trayectoria Euler')
    
    ax_fase.scatter(Y0[0], Y0[1], color='black', marker='o', s=60, label='Inicio', zorder=5)
    
    ax_fase.scatter(sol_rk.y[0][-1], sol_rk.y[1][-1], color='green', marker='X', s=80, label='Fin RK45', zorder=6)
    
    ax_fase.scatter(Ys_eu[-1, 0], Ys_eu[-1, 1], color='magenta', marker='X', s=80, label='Fin Euler', zorder=6)
    
    ax_fase.scatter(0.9333, 0.0373, color='black', marker='*', s=200, label='Equilibrio Exacto', zorder=10)

    ax_fase.set_title('Comparación en el Plano de Fase')
    ax_fase.set_xlabel('x (Calidad)')
    ax_fase.set_ylabel('y (Consumidores)')
    ax_fase.legend(loc='best', fontsize='small')
    ax_fase.grid(True, alpha=0.3)
    

    fig.suptitle(titulo, fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.show()


if __name__ == "__main__":
    from parametros import REGIMENES

    params = REGIMENES["coexistencia"]
    graficar_comparacion_euler(
        Y0=[0.5, 0.05], 
        t_span=[0, 20], 
        p=params, 
        h=0.025, 
        titulo="Coexistencia: Euler vs RK45"
    )