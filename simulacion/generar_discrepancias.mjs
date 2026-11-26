// Escribe DISCREPANCIAS.md a partir de datos/discrepancias.json: el documento y la página
// «Lo que la teoría no ve» salen de los mismos números.
import { readFileSync, writeFileSync } from "node:fs";
const d = JSON.parse(readFileSync(new URL("datos/discrepancias.json", import.meta.url), "utf8"));
const f3 = (v) => v == null ? "—" : v.toFixed(3), pct = (v) => `${Math.round(100 * v)} %`;
const F = (id) => d.factores.find((f) => f.id === id);
const tabla = (f, cols) => [
  `| ${f.nivel} | ${cols.map((c) => c[0]).join(" | ")} |`, `|---|${cols.map(() => "---").join("|")}|`,
  ...f.puntos.map((p) => `| ${p.etiqueta} | ${cols.map((c) => c[1](p)).join(" | ")} |`)].join("\n");
const err = ["distancia", (p) => `${f3(p.error)} ± ${f3(p.errorSd)}`], abs = ["extinción", (p) => pct(p.absorcion)];
const ref = d.referencias.find((r) => r.escenario === "coexistencia").error;

const md = `# Qué separa la simulación de agentes de la predicción de las EDO

Generado por \`node generar_discrepancias.mjs\` a partir de \`datos/discrepancias.json\`
(${d.semillas} semillas por medida, ${d.fecha}). Las mismas cifras alimentan la vista
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
${d.referencias.map((r) => `| ${r.escenario} | ${f3(r.error)} ± ${f3(r.errorSd)} | ${pct(r.absorcion)} |`).join("\n")}

## Factores que agrandan la diferencia

### 1. Información con retraso (memoria de ganancias)
${tabla(F("memoria"), [err, abs])}

Si los agentes deciden por su ganancia media de las últimas rondas, la decisión llega con
retraso. El equilibrio de coexistencia es un foco que gira deprisa y se amortigua despacio
(λ = −0.27 ± 2.85 i), y basta un retraso de **2 rondas** para que el sistema se pase de
rosca y se estrelle contra un borde. Las EDO suponen que cada agente conoce al instante la
ventaja actual. **Es el factor más fuerte en condiciones realistas.**

### 2. Errores al distinguir la calidad
${tabla(F("percepcion"), [err, abs])}

Quien se equivoca una fracción e de las veces obtiene (1 − e) de la ventaja por el mismo
costo: es como si buscar costara c_A/(1 − e). Con e = 0.5, c_A efectivo = 16 > c_A* = 15 y el
sistema colapsa siempre. La teoría lo predice **si se le da el parámetro efectivo**; con el
nominal, no. Con errores del 10–20 % la distancia se duplica, en parte porque 1 de cada 8
ejecuciones se extingue.

### 3. Poblaciones pequeñas
${tabla(F("poblacion"), [err, abs])}

Las EDO son el límite de población infinita. Con pocos agentes, el azar de quién lee qué y
a quién se imita mueve el sistema, y los bordes son trampas: si desaparece el último
consumidor activo, ya no hay a quién imitar. En la teoría, y nunca llega a 0 en tiempo finito.

### 4. Muy pocos consumidores activos (la coexistencia del artículo, y* = 0.037)
${tabla(F("articulo"), [err, abs])}

Un 3.7 % de 600 consumidores son 22 personas, y el foco apenas se amortigua
(λ = −0.067 ± 1.89 i). Incluso con 2400 consumidores se extingue en una de cada ocho
ejecuciones. Confirma con números la crítica del informe (sección 6.4).

### 5. Oscilaciones que el azar mantiene vivas (partiendo del equilibrio)
${tabla(F("oscilacion"), [["desviación típica de y", (p) => f3(p.ruidoY)], err])}

El azar empuja el equilibrio en cada ronda y, al ser un foco, cada empujón se convierte en
una oscilación. La amplitud cae como 1/√N: cuadruplicar la población la reduce a la mitad.
La **media** coincide con el equilibrio predicho; el punto, nunca.

### 6. Todos deciden a la vez (revisión simultánea por rondas)
${tabla(F("revision"), [err, abs])}

En teoría, que todos revisen a la vez equivale a un Euler explícito y resta amortiguamiento.
Con esta escala el efecto medido queda dentro del ruido entre semillas: **no se distingue
del azar**. (Una medición previa con 4 semillas sugería lo contrario; con 8 no se sostiene.)

### 7. Trayectorias que rozan los bordes
${tabla(F("borde"), [["y mínimo teórico", (p) => f3(p.valor)], err])}

Con 1200 consumidores la relación entre lo bajo que llega la trayectoria teórica y la
distancia es débil y queda dentro del ruido. El efecto fuerte aparece cuando la teoría exige
fracciones menores que un agente: desde (0.8, 0.2) en la coexistencia del artículo, la
teoría hace bajar y hasta 4·10⁻⁴ (media persona de 1200) y los agentes se extinguen siempre.

### 8. Pasión por crear (el factor nuevo)
${(() => { const f = F("pasion"); if (!f) return "Sin datos."; return f.series.map((se) => `**${se.nombre}**\n\n| pasión media (× c_H) | la calidad sobrevive | productores de calidad al final | piso e^(−1/k) | consumidores activos al final |\n|---|---|---|---|---|\n` +
  se.puntos.map((p) => `| ${p.valor} | ${pct(p.viva)} | ${f3(p.x)} | ${f3(p.piso)} | ${f3(p.y)} |`).join("\n")).join("\n\n"); })()}

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

## Qué pesa más (peor caso medido / distancia de referencia ${f3(ref)})

${(() => { const peor = { memoria: (p) => p.reduce((a, b) => b.error > a.error ? b : a), percepcion: (p) => p[p.length - 1],
  poblacion: (p) => p[0], articulo: (p) => p[0], revision: (p) => p[0], borde: (p) => p.reduce((a, b) => b.error > a.error ? b : a) };
  return Object.entries(peor).map(([id, fn]) => { const p = fn(F(id).puntos); return [F(id).titulo, p.error / ref, p.absorcion]; })
    .sort((a, b) => b[1] - a[1]).map(([t, m, a]) => `- **×${m.toFixed(1)}** ${t}${a ? ` (extinción ${pct(a)})` : ""}`).join("\n"); })()}

## Notas de método
- Escenario base: coexistencia con R = 9.6, M = 60, σ = 0.5, c_A = 8, c_H = 2 (x* = 0.733,
  y* = 0.306), salvo el factor 4, que usa los parámetros del artículo.
- Se corrigió un error del código durante la construcción: un agente que copiaba la
  memoria de un modelo que también acababa de cambiar recibía la memoria equivocada.
  Las cifras de este documento son posteriores a la corrección.
`;
writeFileSync(new URL("DISCREPANCIAS.md", import.meta.url), md);
console.log("DISCREPANCIAS.md regenerado");
