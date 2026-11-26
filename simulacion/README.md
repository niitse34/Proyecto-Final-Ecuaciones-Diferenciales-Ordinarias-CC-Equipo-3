# Calidad y atención · simulación de agentes

Acompaña la defensa del proyecto de EDO (Equipo 3). Simula una plataforma **agente por
agente**, sin usar las ecuaciones del informe, y dibuja al lado lo que predicen las EDO.

**Abrir:** doble clic en `dist/simulacion.html` (funciona sin internet y sin servidor).

| Tecla | Acción |
|---|---|
| espacio | pausar / reproducir |
| → | avanzar una ronda |
| L | cámara lenta (una ronda por segundo, con todos los rayos) |
| R | reiniciar el escenario |
| P | panel de parámetros |
| 1–4 | colapso, frontera, coexistencia, coexistencia del artículo |
| 5–9 | activar o quitar cada factor de la barra «lo que la teoría no ve» |
| 0 | quitar todos los factores |
| clic en el plano de fases | soltar la población en ese punto |

## Qué simula (y qué no)
Cada ronda: los productores publican un ítem (con o sin esfuerzo), cada consumidor lee
k = σ·m ítems (al azar o buscando calidad), cada vista paga r, y cada agente mira a otro
al azar y copia su estrategia con probabilidad proporcional a cuánto más ganó. Las EDO
solo aparecen en los paneles de la derecha, como predicción.

Lo que hace que la simulación y la teoría se separen está medido en `DISCREPANCIAS.md`.

## Desarrollo
- `js/modelo.js` agentes · `js/trabajador.js` hilo que los simula · `js/teoria.js` EDO · `js/app.js` interfaz · `js/informe.js` vista de factores
- `node medir_todo.mjs 8 <factor>` mide un factor; `node unir_datos.mjs` une; `node generar_discrepancias.mjs` regenera el documento
- `node construir.mjs` regenera `dist/simulacion.html`
