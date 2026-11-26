# Calidad y atención

Proyecto final de Ecuaciones Diferenciales Ordinarias · Equipo 3 · Grupo 212 · Facultad de Matemática y Computación, Universidad de La Habana.

Estudio y extensión del modelo de Chujyo, Okada, Yamamoto, Lim y Toriumi, *An attention economy model of co-evolution between content quality and audience selectivity* ([arXiv:2602.06437](https://arxiv.org/abs/2602.06437)).

## Contenido

| Carpeta | Qué hay |
|---|---|
| [`informe/`](informe/) | `Informe_Final_EDO_Equipo3.pdf` y, en `codigo/`, los programas que generan sus figuras y tablas |
| [`simulacion/`](simulacion/) | simulación de agentes que acompaña la exposición; se abre con doble clic en `dist/simulacion.html` |

## Reproducir los resultados del informe

```bash
cd informe/codigo
python -m pip install -r requirements.txt
python cuencas.py 200     # cuencas de atracción (figura 5), unos 25 min
python umbrales.py        # umbrales numéricos frente a teóricos (tabla 4)
python figuras.py         # todas las figuras en figuras/
```

## Equipo

Andro Aguilera Cazanave · Gabriel Alvarez Amaro · Marco Antonio Camacho Ramos · Maykol Alejandro Carreras Martín · Leonardo Córdova Rosas · Leonardo Albert López · José Rafael Pérez Rivero · Briell Quintana Hernández
