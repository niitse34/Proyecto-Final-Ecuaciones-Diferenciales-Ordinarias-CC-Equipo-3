# Reparto del equipo

Ocho personas, cinco bloques. Cada rol tiene **un producto propio, verificable y con fecha**, y un
**suplente** designado para que nadie bloquee al equipo si falta.

| # | Rol | GitHub | Producto principal | Suplente |
|---|-----|--------|--------------------|----------|
| 1 | Coordinación e integración | `@usuario1` | Documento integrado, actas, entregables | 8 |
| 2 | Modelado A — oferta | `@usuario2` | Pagos H/L y tabla de parámetros (§2) | 3 |
| 3 | Modelado B — demanda | `@usuario3` | Pagos A/P y sistema replicador (§2) | 2 |
| 4 | Análisis A — equilibrios | `@usuario4` | Tabla de equilibrios y jacobianos (§3) | 5 |
| 5 | Análisis B — bifurcaciones | `@usuario5` | Umbrales, bifurcaciones y cuencas (§3) | 4 |
| 6 | Numérico A — integración | `@usuario6` | Integradores, errores, figuras de regímenes (§4) | 7 |
| 7 | Numérico B — barridos | `@usuario7` | Cuencas, barridos, tests y demo (§4) | 6 |
| 8 | Edición y exposición | `@usuario8` | Estilo, diapositivas, ensayos, discusión (§5) | 1 |

## Matriz de responsabilidades

R = lo hace · A = lo aprueba · C = se le consulta · I = se le informa.

| Rol | B1 Modelo | B2 Analítico | B3 Bifurcaciones | B4 Numérico | B5 Discusión | Integración |
|-----|-----------|--------------|------------------|-------------|--------------|-------------|
| 1 | C | I | I | I | A | R/A |
| 2 | R | C | I | C | I | C |
| 3 | R | C | I | C | I | C |
| 4 | C | R | C | C | I | I |
| 5 | I | C | R | C | C | I |
| 6 | C | C | C | R | I | I |
| 7 | I | I | C | R | I | C |
| 8 | C | C | C | C | R | A |

## Reglas que evitan el «documento Frankenstein»

- **Un solo dueño del archivo final**: el rol 1 integra; los demás trabajan en su archivo de sección.
- **Glosario único** desde el día uno: símbolos y nombres iguales en texto, código y figuras.
- **Revisión cruzada obligatoria**: nadie revisa su propia sección.
- **Reunión semanal de 45 minutos con acta** (plantilla en `actas/`), que se sube al repositorio.
- **Figuras congeladas** 48 h antes de la entrega: después solo se corrige texto.
- **Regla del 80 %**: si una sección está casi lista y el plazo aprieta, se entrega y se mejora tras el hito.

## Cómo usa el repositorio cada rol

1. `git switch -c feat/<mi-rol>-<tema>` desde `main` actualizado.
2. Edita **solo** su archivo de `docs/secciones/` y, si aplica, `tools/` o `tests/`.
3. Regenera figuras (`python tools/figs.py`) y corre `pytest` antes de subir.
4. Abre PR con la plantilla; revisa alguien de otro bloque (ver `CODEOWNERS`).
