# README — Módulo Numérico (EDO)

## Requisitos
Instalar numpy scipy matplotlib

## Script principal
Para generar todas las tablas y gráficas de una sola vez, ejecuta:
    python generar_png.py

Esto creará automáticamente la carpeta "resultados/" con:
- regimen_coexistencia.png
- regimen_colapso.png
- regimen_frontera.png
- tabla_error_euler.png
- tabla_costo_precision.png
No requiere modificar nada en el código.

---

## Scripts ejecutables individualmente

| Script | Qué hace | ¿Se puede modificar? |
| :--- | :--- | :--- |
| python rk45.py | Abre ventana interactiva con plano de fase y series de tiempo usando RK45. | Sí: condición inicial Y0, intervalo t_span y parámetros p. |
| python euler.py | Abre ventana comparando Euler vs RK45 (series de tiempo y plano de fase). | Sí: Y0, t_span, tamaño de paso h y parámetros p. |
| python analisis_borde.py | Compara RK45 contra la solución exacta en el borde y = 0 y muestra el error máximo. | Sí: x0, t_span y parámetros p. |
| python regimenes.py | Genera solo las imágenes de los 3 regímenes en "resultados/". | Sí: t_span, condiciones iniciales en CIS y parámetros. |

Nota: tablas_errores.py no se ejecuta directamente; se usa desde generar_png.py.

---

## Cómo modificar condición inicial, t_span o parámetros

En rk45.py y euler.py edita el bloque final del archivo (el que empieza con "if __name__ == "__main__":"). 

Ejemplo de cómo cambiarlo:
    params = REGIMENES["frontera"]   # cambia el régimen
    graficar_simulacion(
        Y0=[0.3, 0.2],               # nueva condición inicial
        t_span=[0, 50],              # nuevo intervalo de tiempo
        p=params,
        titulo="Prueba personalizada"
    )

Para regimenes.py, las condiciones iniciales están en el diccionario CIS y los parámetros en REGIMENES.

---

## Regímenes recomendados

Usa preferentemente los 3 regímenes de la guía, ya definidos en parametros.py:
- REGIMENES["coexistencia"]
- REGIMENES["colapso"]
- REGIMENES["frontera"]

No es recomendable inventar parámetros arbitrarios sin justificación.