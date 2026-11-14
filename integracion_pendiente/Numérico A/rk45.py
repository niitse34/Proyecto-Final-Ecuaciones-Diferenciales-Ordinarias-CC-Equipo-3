import numpy as np 
from scipy.integrate import solve_ivp #solve_ivp para resolver EDOs
from modelo import campo

def simular_rk45(Y0, t_span, p, t_eval=None, rtol=1e-10, atol=1e-12):
    """
    Y0: Lista [x0, y0] con las condiciones iniciales.
    t_span: Lista [t_inicio, t_fin]. Ej: [0, 20].
    p: El objeto con los parámetros del régimen.
    t_eval: Los tiempos exactos donde queremos que se guarde la solución.
    rtol, atol: Tolerancias de error (Relative y Absolute tolerance).
    """
    solucion = solve_ivp(
        fun=campo,       # 1. Le pasamos la función de las derivadas (dx, dy)
        t_span=t_span,   # 2. El intervalo de tiempo: desde dónde hasta dónde
        y0=Y0,           # 3. El punto de partida: [x0, y0]
        args=(p,),       # Así le pasamos el objeto de parámetros a 'campo'
        method='RK45',   # 5. El método numérico a usar (Runge-Kutta 4/5)
        rtol=rtol,       # 6. Error relativo permitido (ej. 1e-8 = 0.00000001)
        atol=atol,       # 7. Error absoluto permitido
        t_eval=t_eval,   # 8. Si lo pasamos, obliga a RK45 a devolver datos EN ESTOS TIEMPOS exactos.

        dense_output=(t_eval is None)
    )
    return solucion

def graficar_simulacion(Y0, t_span, p, t_eval=None, titulo="Simulación"):
    import matplotlib.pyplot as plt 
    
    if t_eval is None:
        t_eval = np.linspace(t_span[0], t_span[1], 400)
    sol = simular_rk45(Y0, t_span, p, t_eval=t_eval)

    fig, (ax_fase, ax_series) = plt.subplots(1, 2, figsize=(12, 5))

    # ---Plano de Fase ---
    ax_fase.plot(sol.y[0], sol.y[1], color='blue', linewidth=2)
    ax_fase.scatter(Y0[0], Y0[1], color='red', marker='o', s=60, label='Inicio', zorder=5)
    ax_fase.scatter(sol.y[0][-1], sol.y[1][-1], color='green', marker='X', s=60, label='Fin simulación (t=20)', zorder=5)
    ax_fase.scatter(0.9333, 0.0373, color='black', marker='*', s=150, label='Equilibrio Teórico', zorder=10)
    ax_fase.axvline(p.sigma, color='gray', linestyle=':', label='x = sigma')
    ax_fase.set_xlabel('x (Calidad)')
    ax_fase.set_ylabel('y (Consumidores)')
    ax_fase.set_title('Plano de Fase')
    ax_fase.grid(True, alpha=0.3)
    ax_fase.legend()

    # ---Series de Tiempo ---
    ax_series.plot(sol.t, sol.y[0], color='blue', label='x(t)')
    ax_series.plot(sol.t, sol.y[1], color='orange', label='y(t)')
    ax_series.set_xlabel('Tiempo (t)')
    ax_series.set_ylabel('Proporción')
    ax_series.set_title('Series de Tiempo')
    ax_series.grid(True, alpha=0.3)
    ax_series.legend()

    fig.suptitle(titulo, fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.show()


if __name__ == "__main__":
    from parametros import REGIMENES
    
    params = REGIMENES["coexistencia"]
    
    graficar_simulacion(
        Y0=[0.5, 0.05], 
        t_span=[0, 20], 
        p=params, 
        titulo="Test: Coexistencia con valores iniciales personalizados"
    )