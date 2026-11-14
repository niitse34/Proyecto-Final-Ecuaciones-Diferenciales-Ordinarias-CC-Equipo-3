# Proyecto final de EDO — Economía de la atención

Modelo de coevolución entre la calidad del contenido y la selectividad de la audiencia
(Chujyo, Okada, Yamamoto, Lim y Toriumi, [arXiv:2602.06437](https://arxiv.org/abs/2602.06437)),
adaptado al formato del curso: derivación, solución analítica, análisis cualitativo,
simulación numérica e interpretación.

Repositorio del equipo 3 · Ciencias de la Computación · Ecuaciones Diferenciales Ordinarias.

## Estructura

```text
.
├── replicador_atencion.py      # modelo + tabla de equilibrios por consola
├── tools/
│   ├── plot.py                 # mini librería de gráficos (Pillow)
│   └── figs.py                 # genera las 5 figuras del informe
├── figuras/                    # PNG finales (se versionan: son entregables)
├── docs/
│   ├── Guia_Proyecto_*.pdf     # guía de trabajo del equipo (qué hacer y en qué orden)
│   ├── enunciado/              # orientación del curso
│   ├── secciones/              # el informe, una sección por archivo
│   └── referencias/            # bibliografia.bib
├── presentacion/               # PPTX + PDF de la exposición
├── entregables/                # informe final (DOCX/PDF)
├── equipo/                     # reparto, actas y bitácoras
├── tests/                      # verificación numérica de la teoría
└── .github/                    # CODEOWNERS, plantillas de PR/issue y CI
```

## Puesta en marcha

```bash
python -m pip install -r requirements.txt
python replicador_atencion.py        # equilibrios, eigenvalores y régimen
python tools/figs.py                 # regenera figuras/*.png
python -m pytest -q                  # verifica los resultados del Anexo A
```

## Reparto

| # | Rol | GitHub | Archivos principales |
|---|-----|--------|----------------------|
| 1 | Coordinación e integración | `@niitse34` | `README.md`, `docs/secciones/00_resumen.md`, `entregables/` |
| 2 | Modelado A — oferta | `@usuario2` | `docs/secciones/02_modelo.md` (pagos H/L), `replicador_atencion.py` |
| 3 | Modelado B — demanda | `@usuario3` | `docs/secciones/02_modelo.md` (pagos A/P), `replicador_atencion.py` |
| 4 | Análisis A — equilibrios | `@usuario4` | `docs/secciones/03_analisis_cualitativo.md` (equilibrios) |
| 5 | Análisis B — bifurcaciones | `@usuario5` | `docs/secciones/03_analisis_cualitativo.md` (bifurcaciones, cuencas) |
| 6 | Numérico A — integración | `@usuario6` | `tools/figs.py`, `docs/secciones/04_simulacion.md` |
| 7 | Numérico B — barridos | `@usuario7` | `tools/`, `tests/`, demo en vivo |
| 8 | Edición y exposición | `@usuario8` | `presentacion/`, `docs/secciones/05_discusion.md`, estilo |

Detalle de responsabilidades en [`equipo/reparto.md`](equipo/reparto.md).

## Estado

| Hito | Fecha | Estado |
|------|-------|--------|
| H1 · Derivación cerrada | _dd/mm_ | ⬜ |
| H2 · Tabla de equilibrios + figuras base | _dd/mm_ | ⬜ |
| H3 · Borrador del informe (≤ 10 págs.) | _dd/mm_ | ⬜ |
| H4 · Informe entregado + exposición ensayada | _dd/mm_ | ⬜ |

## Uso académico

Trabajo de curso. El artículo es de sus autores; este repositorio contiene solo el desarrollo
propio del equipo (modelo, código, figuras y textos).
