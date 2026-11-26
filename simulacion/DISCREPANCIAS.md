# Qué separa la simulación de agentes de la predicción de las EDO

Generado por `node generar_discrepancias.mjs` a partir de `datos/discrepancias.json`
(8 semillas por medida, 2026-11-24). Las mismas cifras alimentan la vista
«lo que la teoría no ve» de la simulación.

- **Distancia**: separación media entre el estado (x, y) de los agentes y el de la teoría a
  lo largo de la ejecución (media ± desviación típica entre semillas).
- **Extinción**: porcentaje de ejecuciones en que una población desaparece (x = 0, x = 1 o
  y = 0) aunque la teoría prediga que sobrevive.

La simulación no usa las ecuaciones: los agentes leen, cobran vistas e imitan a un vecino
según lo que ganó en la ronda. Que la teoría acierte es un resultado, no una consecuencia
del código.

## Referencia: donde la teoría acierta (240 productores, 1200 consumidores)

| Escenario | Distancia | Extinción |
|---|---|---|
| frontera | 0.005 ± 0.001 | 0 % |
| colapso | 0.005 ± 0.004 | 0 % |
| coexistencia | 0.074 ± 0.024 | 0 % |

## Factores que agrandan la diferencia

### 1. Información con retraso (memoria de ganancias)
| rondas de memoria | distancia | extinción |
|---|---|---|
| 1 | 0.074 ± 0.024 | 0 % |
| 2 | 0.659 ± 0.155 | 88 % |
| 3 | 0.713 ± 0.037 | 100 % |
| 5 | 0.733 ± 0.002 | 100 % |
| 10 | 0.685 ± 0.114 | 100 % |
| 30 | 0.488 ± 0.127 | 100 % |

Si los agentes deciden por su ganancia media de las últimas rondas, la decisión llega con
retraso. El equilibrio de coexistencia es un foco que gira deprisa y se amortigua despacio
(λ = −0.27 ± 2.85 i), y basta un retraso de **2 rondas** para que el sistema se pase de
rosca y se estrelle contra un borde. Las EDO suponen que cada agente conoce al instante la
ventaja actual. **Es el factor más fuerte en condiciones realistas.**

### 2. Errores al distinguir la calidad
| errores de los activos | distancia | extinción |
|---|---|---|
| 0 % | 0.074 ± 0.024 | 0 % |
| 10 % | 0.154 ± 0.230 | 13 % |
| 20 % | 0.175 ± 0.223 | 13 % |
| 30 % | 0.146 ± 0.005 | 0 % |
| 50 % | 0.761 ± 0.005 | 100 % |

Quien se equivoca una fracción e de las veces obtiene (1 − e) de la ventaja por el mismo
costo: es como si buscar costara c_A/(1 − e). Con e = 0.5, c_A efectivo = 16 > c_A* = 15 y el
sistema colapsa siempre. La teoría lo predice **si se le da el parámetro efectivo**; con el
nominal, no. Con errores del 10–20 % la distancia se duplica, en parte porque 1 de cada 8
ejecuciones se extingue.

### 3. Poblaciones pequeñas
| productores · consumidores | distancia | extinción |
|---|---|---|
| 30 · 150 | 0.567 ± 0.176 | 100 % |
| 60 · 300 | 0.425 ± 0.306 | 50 % |
| 120 · 600 | 0.189 ± 0.223 | 13 % |
| 240 · 1200 | 0.074 ± 0.024 | 0 % |
| 480 · 2400 | 0.056 ± 0.016 | 0 % |

Las EDO son el límite de población infinita. Con pocos agentes, el azar de quién lee qué y
a quién se imita mueve el sistema, y los bordes son trampas: si desaparece el último
consumidor activo, ya no hay a quién imitar. En la teoría, y nunca llega a 0 en tiempo finito.

### 4. Muy pocos consumidores activos (la coexistencia del artículo, y* = 0.037)
| productores · consumidores | distancia | extinción |
|---|---|---|
| 120 · 600 | 0.126 ± 0.206 | 88 % |
| 240 · 1200 | 0.044 ± 0.022 | 38 % |
| 480 · 2400 | 0.030 ± 0.020 | 13 % |

Un 3.7 % de 600 consumidores son 22 personas, y el foco apenas se amortigua
(λ = −0.067 ± 1.89 i). Incluso con 2400 consumidores se extingue en una de cada ocho
ejecuciones. Confirma con números la crítica del informe (sección 6.4).

### 5. Oscilaciones que el azar mantiene vivas (partiendo del equilibrio)
| productores · consumidores | desviación típica de y | distancia |
|---|---|---|
| 60 · 300 | 0.099 | 0.095 ± 0.025 |
| 120 · 600 | 0.065 | 0.060 ± 0.013 |
| 240 · 1200 | 0.043 | 0.042 ± 0.007 |
| 480 · 2400 | 0.021 | 0.022 ± 0.004 |
| 960 · 4800 | 0.012 | 0.011 ± 0.002 |

El azar empuja el equilibrio en cada ronda y, al ser un foco, cada empujón se convierte en
una oscilación. La amplitud cae como 1/√N: cuadruplicar la población la reduce a la mitad.
La **media** coincide con el equilibrio predicho; el punto, nunca.

### 6. Todos deciden a la vez (revisión simultánea por rondas)
| agentes que revisan por ronda | distancia | extinción |
|---|---|---|
| 100 % | 0.082 ± 0.028 | 0 % |
| 50 % | 0.058 ± 0.019 | 0 % |
| 25 % | 0.075 ± 0.044 | 0 % |

En teoría, que todos revisen a la vez equivale a un Euler explícito y resta amortiguamiento.
Con esta escala el efecto medido queda dentro del ruido entre semillas: **no se distingue
del azar**. (Una medición previa con 4 semillas sugería lo contrario; con 8 no se sostiene.)

### 7. Trayectorias que rozan los bordes
| y mínimo de la trayectoria teórica | y mínimo teórico | distancia |
|---|---|---|
| (0.55, 0.25) | 0.124 | 0.062 ± 0.021 |
| (0.6, 0.5) | 0.116 | 0.068 ± 0.015 |
| (0.85, 0.45) | 0.090 | 0.064 ± 0.029 |
| (0.45, 0.6) | 0.040 | 0.089 ± 0.029 |
| (0.9, 0.3) | 0.032 | 0.076 ± 0.033 |

Con 1200 consumidores la relación entre lo bajo que llega la trayectoria teórica y la
distancia es débil y queda dentro del ruido. El efecto fuerte aparece cuando la teoría exige
fracciones menores que un agente: desde (0.8, 0.2) en la coexistencia del artículo, la
teoría hace bajar y hasta 4·10⁻⁴ (media persona de 1200) y los agentes se extinguen siempre.

### 8. Pasión por crear (el factor nuevo)
**colapso (la teoría predice extinción)**

| pasión media (× c_H) | la calidad sobrevive | productores de calidad al final | piso e^(−1/k) | consumidores activos al final |
|---|---|---|---|---|
| 0 | 0 % | 0.000 | 0.000 | 0.000 |
| 0.25 | 0 % | 0.000 | 0.018 | 0.000 |
| 0.5 | 63 % | 0.017 | 0.135 | 0.000 |
| 0.75 | 100 % | 0.171 | 0.264 | 0.000 |
| 1 | 100 % | 0.394 | 0.368 | 0.000 |
| 1.5 | 100 % | 0.635 | 0.513 | 0.000 |

**coexistencia con 3 rondas de memoria**

| pasión media (× c_H) | la calidad sobrevive | productores de calidad al final | piso e^(−1/k) | consumidores activos al final |
|---|---|---|---|---|
| 0 | 0 % | 0.000 | 0.000 | 0.000 |
| 0.25 | 100 % | 0.016 | 0.018 | 0.000 |
| 0.5 | 100 % | 0.126 | 0.135 | 0.000 |
| 0.75 | 100 % | 0.259 | 0.264 | 0.000 |
| 1 | 100 % | 0.343 | 0.368 | 0.000 |
| 1.5 | 100 % | 0.514 | 0.513 | 0.000 |

**coexistencia con 30 · 150 agentes**

| pasión media (× c_H) | la calidad sobrevive | productores de calidad al final | piso e^(−1/k) | consumidores activos al final |
|---|---|---|---|---|
| 0 | 25 % | 0.167 | 0.000 | 0.071 |
| 0.25 | 38 % | 0.092 | 0.018 | 0.000 |
| 0.5 | 88 % | 0.075 | 0.135 | 0.000 |
| 0.75 | 100 % | 0.296 | 0.264 | 0.000 |
| 1 | 100 % | 0.313 | 0.368 | 0.000 |
| 1.5 | 100 % | 0.563 | 0.513 | 0.000 |

Cada productor suma a su ganancia una satisfacción propia por crear con calidad, distribuida
de forma exponencial con media k·c_H (unos mucha, la mayoría poca). Al decidir si imitar a
otro, cada uno suma **su** pasión, no la del otro. Los que disfrutan más de lo que cuesta
esforzarse (una fracción e^(−1/k)) nunca abandonan. Resultado: con k ≥ 0.75 la calidad
sobrevive en todas las ejecuciones de los tres escenarios, y la fracción final de productores
de calidad cae sobre el piso e^(−1/k). La teoría predice extinción en los tres.

**Lo que no salva:** la audiencia. Los consumidores activos terminan en 0 en todos los casos:
una vez que nadie busca calidad, no hay a quién imitar. La pasión rescata a quien crea, no a
quien busca. Haría falta otro mecanismo (por ejemplo, consumidores que prueben a buscar de vez
en cuando) para que la audiencia vuelva.

## Qué pesa más (peor caso medido / distancia de referencia 0.074)

- **×10.3** Errores al distinguir la calidad (extinción 100 %)
- **×10.0** Información con retraso (extinción 100 %)
- **×7.7** Poblaciones pequeñas (extinción 100 %)
- **×1.7** Muy pocos consumidores activos (la coexistencia del artículo) (extinción 88 %)
- **×1.2** Trayectorias que rozan los bordes
- **×1.1** Todos deciden a la vez

## Notas de método
- Escenario base: coexistencia con R = 9.6, M = 60, σ = 0.5, c_A = 8, c_H = 2 (x* = 0.733,
  y* = 0.306), salvo el factor 4, que usa los parámetros del artículo.
- Se corrigió un error del código durante la construcción: un agente que copiaba la
  memoria de un modelo que también acababa de cambiar recibía la memoria equivocada.
  Las cifras de este documento son posteriores a la corrección.
