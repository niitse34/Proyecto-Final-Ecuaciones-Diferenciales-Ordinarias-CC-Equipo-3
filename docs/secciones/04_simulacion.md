> **Responsables:** @usuario6 (integración) y @usuario7 (barridos) · **Revisa:** @usuario5 · **Estado:** pendiente
> **Extensión objetivo:** 1,8 páginas · **Cuestiones:** C4.1 – C4.7

# 4. Simulación numérica

## 4.1 Método

<!-- RK45 (Dormand–Prince) con paso adaptativo frente a Euler y RK4. Tolerancias, tiempo final,
     criterio de convergencia. Comando reproducible:

       python tools/figs.py

     Cuestión C4.1: tabla de error y orden observado. -->

## 4.2 Los tres regímenes

<!-- Fig. fig2_regimenes.png. Una frase por panel. Comparar con la figura 2 del artículo. (C4.2) -->

| Régimen | Parámetros | Atractor | Lectura |
|---------|-----------|----------|---------|
| Colapso | m=20, n=100, σ=0.5, r=1, Δ=1, c_A=10, c_H=2 | (0, 0) | todo se apaga |
| Frontera | m=1, n=10, σ=0.5, r=0.12, Δ=10, c_A=1, c_H=1 | (0.6, 1) | todos activos, esfuerzo medio |
| Coexistencia | m=20, n=100, σ=0.5, r=1, Δ=3, c_A=2, c_H=2 | (0.933, 0.037) | oscila y se asienta |

## 4.3 Efecto de la no-suavidad

<!-- C4.3: ¿se conserva el orden 5 al cruzar x = σ muchas veces? Comparar con una versión suavizada
     (sigmoide de ancho ε). -->

## 4.4 Cuencas

<!-- C4.4: malla 110×110 (o 200×200), integración vectorizada, criterio de clasificación explícito.
     Fig. fig3_cuencas.png. -->

## 4.5 Umbrales numéricos vs. teóricos

| σ | c_A crítico (numérico) | c_A crítico (teórico) | Error relativo |
|---|------------------------|-----------------------|----------------|
| … | … | … | … |

<!-- C4.5. Los errores deben quedar por debajo del 1 %. -->

## 4.6 Transitorios cerca del pliegue

<!-- C4.6: T95(c_A) crece al acercarse al umbral. Interpretación: las políticas «tardan en verse». -->

---

### Checklist

- [ ] Un solo comando regenera todas las figuras.
- [ ] `pytest` pasa y verifica los números del anexo A.
- [ ] El criterio de clasificación de cuencas está escrito (tiempo, tolerancia, distancia).
- [ ] Cada figura tiene una frase de lectura en el texto.
