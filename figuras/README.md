# Figuras

Todas las figuras se **generan** con `python tools/figs.py`; aquí solo se guardan los PNG finales.
No se editan a mano: si una figura está mal, se corrige el script y se regenera.

| Archivo | Qué muestra | Sección del informe | Función |
|---------|-------------|---------------------|---------|
| `fig1_esquema.png` | Diagrama de las dos poblaciones y la realimentación | §2.1 | `fig_esquema` |
| `fig2_regimenes.png` | Los tres regímenes: retratos de fase y series de tiempo | §4.2 | `fig_regimenes` |
| `fig3_cuencas.png` | Cuencas de atracción en el plano (x₀, y₀) | §3.5 | `fig_cuencas` |
| `fig4_bifurcacion.png` | Pliegue no suave y transcrítica | §3.4 | `fig_bifurcacion` |
| `fig5_mapa.png` | Mapa de regímenes en (σ, c_A) | §3.4 | `fig_mapa` |

## Convenciones

- **Nombre:** `fig<N>_<tema>.png`, en minúsculas y sin acentos.
- **Resolución:** ≥ 1500 px de ancho (las del script ya cumplen).
- **Tamaño en el informe:** 16 cm de ancho como máximo.
- **Pie de figura:** numerado y con una frase de lectura, no una descripción plana.
- Si una figura cambia, el PR debe incluir el PNG nuevo **y** el cambio en el script que lo produce.
