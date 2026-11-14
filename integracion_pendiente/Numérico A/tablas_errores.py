import numpy as np
import os
import matplotlib.pyplot as plt
from parametros import REGIMENES
from rk45 import simular_rk45
from euler import euler

# Dibujar tablas
def _guardar_tabla_png(encabezados, filas, titulo, nombre_archivo):
    fig, ax = plt.subplots(figsize=(8, 3))
    ax.axis('off') 
    
    tabla = ax.table(cellText=filas, colLabels=encabezados, loc='center', cellLoc='center')
    
    tabla.auto_set_font_size(False)
    tabla.set_fontsize(11)
    tabla.scale(1, 1.8)
    
    for (row, col), cell in tabla.get_celld().items():
        if row == 0:
            cell.set_facecolor('#e0e0e0')
            cell.set_text_props(weight='bold')
            
    plt.title(titulo, pad=20, fontsize=14, fontweight='bold')
    plt.tight_layout() 
    
    os.makedirs("resultados", exist_ok=True)
    plt.savefig(f"resultados/{nombre_archivo}.png", dpi=150, bbox_inches='tight')
    plt.close() 

# Precision Euler vs Referencia (rk45)

def generar_tabla_error():
    p = REGIMENES["coexistencia"]
    Y0 = [0.8, 0.1]
    t_span = [0, 20]
    
    hs = [0.1, 0.05, 0.025, 0.0125]
    filas_tabla = []
    errores_maximos = []

    for i, h in enumerate(hs):
        ts_eu, Ys_eu = euler(Y0, t_span, p, h)
        # t_eval=ts_eu obliga a RK45 a darte los resultados exactamente en los 
        # mismos instantes de tiempo en los que Euler calculó los suyos.
        ref_eu = simular_rk45(Y0, t_span, p, t_eval=ts_eu, rtol=1e-10, atol=1e-12)
        
        err_x = np.max(np.abs(Ys_eu[:, 0] - ref_eu.y[0]))
        err_y = np.max(np.abs(Ys_eu[:, 1] - ref_eu.y[1]))
        
        err_total = max(err_x, err_y)
        errores_maximos.append(err_total)
        
        p_est = "---" if i == 0 else f"{np.log2(errores_maximos[i-1] / errores_maximos[i]):.2f}"
        
        filas_tabla.append({
            "h": f"{h:.4f}", 
            "error_x": f"{err_x:.3e}", 
            "error_y": f"{err_y:.3e}", 
            "orden_p": p_est
        })
            
    encabezados = ["Paso (h)", "Error Máx en x", "Error Máx en y", "Orden (p)"]
    datos = [[f['h'], f['error_x'], f['error_y'], f['orden_p']] for f in filas_tabla]
    _guardar_tabla_png(encabezados, datos, "Convergencia del Método de Euler", "tabla_error_euler")

# Tabla COSTO vs PRECISION
def generar_tabla_costo_precision():
    p = REGIMENES["coexistencia"]
    Y0 = [0.5, 0.05]
    t_span = [0, 20]
    t_eval = np.linspace(0, 20, 20001)
    
    verdad = simular_rk45(Y0, t_span, p, t_eval=t_eval, rtol=1e-12, atol=1e-14)

    resultados = []
    
    hs_euler = [0.1, 0.01, 0.001]
    for h in hs_euler:
        ts, Ys = euler(Y0, t_span, p, h)
        ref_eu = simular_rk45(Y0, t_span, p, t_eval=ts, rtol=1e-12, atol=1e-14)
        error = np.max(np.abs(Ys - ref_eu.y.T))
        nfev = int(round((t_span[1] - t_span[0]) / h))
        resultados.append(("Euler", f"h={h}", f"{error:.3e}", str(nfev)))

    tolerancias = [1e-4, 1e-6, 1e-8, 1e-10]
    for rtol in tolerancias:
        sol = simular_rk45(Y0, t_span, p, t_eval=t_eval, rtol=rtol, atol=rtol*1e-2)
        error = np.max(np.abs(sol.y.T - verdad.y.T))
        resultados.append(("RK45", f"rtol={rtol:.0e}", f"{error:.3e}", str(sol.nfev)))
            
    encabezados = ["Método", "Parámetro", "Error Máximo", "Costo (nfev)"]
    _guardar_tabla_png(encabezados, resultados, "Eficiencia: Costo vs Precisión", "tabla_costo_precision")
