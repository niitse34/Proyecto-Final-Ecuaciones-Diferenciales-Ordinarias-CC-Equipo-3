import numpy as np
import matplotlib.pyplot as plt
from parametros import REGIMENES
from rk45 import simular_rk45

def verificar_borde_y0():
    # 1. Configuramos el caso
    p = REGIMENES["coexistencia"] 
    x0 = 0.5
    Y0 = [x0, 0.0]
    t_span = [0, 5.0]
    t_eval = np.linspace(0, 5.0, 200)

    sol_num = simular_rk45(Y0, t_span, p, t_eval=t_eval, rtol=1e-10, atol=1e-12)
    
    x_exacta = x0 / (x0 + (1 - x0) * np.exp(p.cH * t_eval))
    
    error_max = np.max(np.abs(sol_num.y[0] - x_exacta))
    
    plt.figure(figsize=(8, 5))
    plt.plot(t_eval, x_exacta, 'k-', linewidth=4, label='Solución Exacta (Fórmula)')
    plt.plot(t_eval, sol_num.y[0], 'r--', linewidth=2, label='RK45 Numérico')

    texto_error = f"Error Máximo: {error_max:.2e}"
    
    # caja con fondo blanco semi-transparente para mostrar el error
    plt.text(3.0, 0.47, texto_error, fontsize=12, fontweight='bold', color='darkred', bbox=dict(facecolor='white', alpha=0.8, edgecolor='darkred', boxstyle='round,pad=0.5'))
    
    plt.title('Verificación en el borde exacto (y=0)')
    plt.xlabel('Tiempo (t)')
    plt.ylabel('x(t)')
    plt.legend(loc='lower right')
    plt.grid(True, alpha=0.3)
    plt.show()

if __name__ == "__main__":
    verificar_borde_y0()