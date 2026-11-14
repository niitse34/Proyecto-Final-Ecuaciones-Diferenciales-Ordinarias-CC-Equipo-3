# modelo.py
from parametros import Parametros

def campo(t, Y, p: Parametros):
    """
    Campo vectorial del sistema.
    t: tiempo (necesario para solve_ivp, aunque el sistema sea autónomo)
    Y: lista o array con [x, y]
    p: objeto de la clase Parametros
    """
    x, y = Y
    
    # Rama izquierda: x < sigma
    if x < p.sigma:
        dx = x * (-p.cH * (1 - x) + p.R * (1 - p.sigma) * y)
        dy = y * (1 - y) * (-p.cA + p.M * (1 - p.sigma) * x)
        
    # Rama derecha: x >= sigma
    else:
        dx = (1 - x) * (p.R * p.sigma * y - p.cH * x)
        dy = y * (1 - y) * (-p.cA + p.M * p.sigma * (1 - x))
        
    return [dx, dy]