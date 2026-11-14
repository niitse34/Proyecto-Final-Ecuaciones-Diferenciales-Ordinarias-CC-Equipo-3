import numpy as np
import matplotlib.pyplot as plt
import os
from parametros import REGIMENES
from rk45 import simular_rk45

EQUILIBRIOS = {
    "coexistencia": [(0.0, 0.0), (0.0, 1.0), (1.0, 0.0), (1.0, 1.0), (0.9333, 0.0373), (0.0667, 0.0373)],
    "colapso":      [(0.0, 0.0), (0.0, 1.0), (1.0, 0.0), (1.0, 1.0)],
    "frontera":     [(0.0, 0.0), (0.0, 1.0), (1.0, 0.0), (1.0, 1.0), (0.6, 1.0)]
}

CIS = {
    "coexistencia": [(0.2, 0.05), (0.5, 0.1), (0.8, 0.2), (0.5, 0.5)],
    "colapso":      [(0.1, 0.1), (0.5, 0.5), (0.9, 0.1)],
    "frontera":     [(0.2, 0.2), (0.5, 0.5), (0.8, 0.9)]
}

def generar_regimenes():
    os.makedirs("resultados", exist_ok=True)
    t_span = [0, 30]
    t_eval = np.linspace(0, 30, 400)
    
    colores_trayectorias = ['#1f77b4', '#2ca02c', '#9467bd', '#ff7f0e', '#8c564b']

    for nombre_regimen, p in REGIMENES.items():
        fig, (ax_fase, ax_series) = plt.subplots(1, 2, figsize=(14, 6))
        
        for i, Y0 in enumerate(CIS[nombre_regimen]):
            color = colores_trayectorias[i % len(colores_trayectorias)]
            sol = simular_rk45(Y0, t_span, p, t_eval=t_eval)
            
            ax_fase.plot(sol.y[0], sol.y[1], color=color, alpha=0.8, linewidth=2, label=f'CI: {Y0}')
            ax_fase.scatter(Y0[0], Y0[1], color=color, marker='o', s=60, zorder=5)
            ax_fase.scatter(sol.y[0][-1], sol.y[1][-1], color=color, marker='X', s=80, zorder=6)
            
            ax_series.plot(sol.t, sol.y[0], color=color, linestyle='-', alpha=0.8, linewidth=2, label=f'x(t) CI:{Y0}')
            ax_series.plot(sol.t, sol.y[1], color=color, linestyle='--', alpha=0.8, linewidth=2, label=f'y(t) CI:{Y0}')

        ax_fase.axvline(p.sigma, color='gray', linestyle=':', linewidth=2, label='x = \u03C3')
        
        eqs = EQUILIBRIOS[nombre_regimen]
        eq_x = [e[0] for e in eqs]
        eq_y = [e[1] for e in eqs]
        ax_fase.scatter(eq_x, eq_y, color='black', marker='*', s=200, zorder=10, label='Equilibrios')

        ax_fase.set_title(f'Plano de Fase - {nombre_regimen.capitalize()}', fontsize=13)
        ax_fase.set_xlabel('x (Productores de alta calidad)', fontsize=11)
        ax_fase.set_ylabel('y (Consumidores activos)', fontsize=11)
        ax_fase.set_xlim(-0.05, 1.05)
        ax_fase.set_ylim(-0.05, 1.05)
        ax_fase.grid(True, alpha=0.3)
        ax_fase.legend(bbox_to_anchor=(0., -0.25), loc='upper left', ncol=2, fontsize='small')

        ax_series.set_title(f'Series de Tiempo - {nombre_regimen.capitalize()}', fontsize=13)
        ax_series.set_xlabel('Tiempo (t)', fontsize=11)
        ax_series.set_ylabel('Proporción', fontsize=11)
        ax_series.set_ylim(-0.05, 1.05)
        ax_series.grid(True, alpha=0.3)
        ax_series.legend(bbox_to_anchor=(1.04, 1), loc='upper left', fontsize='x-small')

        plt.tight_layout()
        ruta = f"resultados/regimen_{nombre_regimen}.png"
        plt.savefig(ruta, dpi=150, bbox_inches='tight')
        plt.close()

if __name__ == "__main__":
    generar_regimenes()