import { ESCENARIOS } from "./modelo.js";
// Vista «Lo que la teoría no ve»: los factores que separan la simulación de las EDO,
// construida solo con los datos medidos en datos/discrepancias.json.

const C = { H: "#4fc3bd", L: "#c4553f", A: "#e8ad4c", P: "#6c7a86", teo: "#f2ead7", tenue: "#8d918f", linea: "#262b2e" };
const CA = ESCENARIOS.coexistencia.cA, CAS = ESCENARIOS.coexistencia.M * 0.25;
const f2 = (v) => v.toFixed(2), f3 = (v) => v.toFixed(3);
const pct = (v) => `${Math.round(100 * v)} %`;

// Texto de cada factor. Los números salen siempre de los datos.
const TEXTOS = {
  poblacion: {
    supone: "infinitos agentes: cada fracción x, y cambia de forma continua y nunca vale exactamente cero.",
    realidad: "hay un número finito de personas. El azar de quién lee qué y a quién se imita mueve el sistema, y si el último consumidor activo deja de buscar, ya no queda nadie a quien imitar: la población no vuelve.",
    medido: (p) => { const a = p[0], z = p[p.length - 1];
      return `Con ${a.etiqueta} agentes la distancia media a la predicción es ${f3(a.error)} y la población se extingue en el ${pct(a.absorcion)} de las ejecuciones; con ${z.etiqueta}, ${f3(z.error)} y ${pct(z.absorcion)}.`; },
    peor: (p) => p[0],
  },
  memoria: {
    supone: "que cada agente conoce al instante la ventaja actual de cada estrategia.",
    realidad: "las personas juzgan por lo que han ganado las últimas semanas. Esa media llega con retraso, y el equilibrio de coexistencia gira deprisa y se amortigua despacio: un retraso pequeño basta para que el sistema se pase de rosca y se estrelle contra un borde.",
    medido: (p) => { const a = p[0], b = p.find((q) => q.absorcion >= 0.5) || p[p.length - 1];
      return `Decidiendo por la última ronda, error ${f3(a.error)} y extinción en el ${pct(a.absorcion)} de las ejecuciones. Con solo ${b.etiqueta} rondas de memoria, error ${f3(b.error)} y extinción en el ${pct(b.absorcion)}.`; },
    peor: (p) => p.reduce((a, b) => (b.error > a.error ? b : a)),
  },
  articulo: {
    supone: "que una coexistencia con y* = 0.037 es tan estable como cualquier otra.",
    realidad: "un 3.7 % de consumidores activos son, con 600 consumidores, 22 personas. Unas pocas rachas malas los extinguen, y el foco del artículo apenas se amortigua (λ = −0.067 ± 1.89 i). Es la crítica de la sección 6.4 del informe, ahora con números.",
    medido: (p) => p.map((q) => `${q.etiqueta}: extinción en el ${pct(q.absorcion)}`).join(" · ") + ".",
    peor: (p) => p[0],
  },
  revision: {
    supone: "un tiempo continuo: los agentes cambian de estrategia de forma gradual.",
    realidad: "si todos reconsideran a la vez en cada ronda, el sistema avanza a saltos, como un método de Euler explícito. En un foco eso resta amortiguamiento: las oscilaciones duran más que en las EDO. Con la escala de este escenario el efecto es pequeño.",
    medido: (p) => `${p.map((q) => `revisando el ${q.etiqueta}: ${f3(q.error)}`).join(" · ")}. Las diferencias son del orden del ruido entre semillas (≈ ${f3(Math.max(...p.map((q) => q.errorSd)))}): con 240 productores y 1200 consumidores, este factor no se distingue del azar.`,
    peor: (p) => p[0],
  },
  percepcion: {
    supone: "que un consumidor activo siempre reconoce la calidad.",
    realidad: "a veces no la reconoce y lee al azar. Quien se equivoca una fracción e de las veces obtiene solo (1 − e) de la ventaja por el mismo costo: es como si buscar costara c_A/(1 − e). Con pocos errores el equilibrio se desplaza; con muchos, ese costo efectivo cruza el umbral c_A* y el sistema colapsa. La teoría lo predice si se le da el parámetro efectivo, pero con el nominal no lo ve.",
    medido: (p) => { const a = p[0], b = p.find((q) => q.valor >= 0.1), z = p[p.length - 1];
      return `Sin errores, distancia ${f3(a.error)}; con un ${b.etiqueta} de errores ya se duplica (${f3(b.error)}; ${Math.round(b.absorcion * datosSemillas)} de ${datosSemillas} ejecuciones se extinguieron). Con un ${z.etiqueta}, c_A efectivo = ${CA}/(1 − ${z.valor}) = ${(CA / (1 - z.valor)).toFixed(0)} supera c_A* = ${CAS}: distancia ${f3(z.error)} y extinción en el ${pct(z.absorcion)} de las ejecuciones.`; },
    peor: (p) => p.reduce((a, b) => (b.error > a.error ? b : a)),
  },
  oscilacion: {
    supone: "que el equilibrio, una vez alcanzado, se queda quieto.",
    realidad: "el azar de cada ronda lo empuja una y otra vez, y como es un foco, cada empujón se convierte en una oscilación que tarda en apagarse. La media sí está donde dice la teoría; el punto, nunca.",
    medido: (p) => { const a = p[0], z = p[p.length - 1];
      return `Partiendo del equilibrio, y oscila con una desviación típica de ${f3(a.ruidoY ?? 0)} con ${a.etiqueta} agentes y de ${f3(z.ruidoY ?? 0)} con ${z.etiqueta}: cae aproximadamente como 1/√N.`; },
    peor: (p) => p[0],
  },
  borde: {
    supone: "que una fracción puede bajar a 0.0004 y volver a crecer.",
    realidad: "0.0004 de 1200 consumidores es media persona. Cuando la trayectoria teórica se acerca a un borde, los agentes llegan al fondo con menos gente de la que haría falta y tardan más en remontar: recorren la misma curva con retraso, o se extinguen.",
    medido: (p) => { const lo = p.reduce((a, b) => (b.error < a.error ? b : a)), hi = p.reduce((a, b) => (b.error > a.error ? b : a));
      return `Con 1200 consumidores las distancias van de ${f3(lo.error)} a ${f3(hi.error)} según el punto de partida, sin una relación clara con lo bajo que llega y: el efecto es real cerca del borde (ver la coexistencia del artículo), pero aquí queda dentro del ruido.`; },
    peor: (p) => p[p.length - 1],
  },
};

// ---------------------------------------------------------------- gráficos SVG
function svg(w, h, cuerpo) { return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${cuerpo}</svg>`; }
const t = (x, y, s, o = "") => `<text x="${x}" y="${y}" ${o}>${s}</text>`;

// barras de error (izquierda) con puntos de extinción (eje derecho)
function graficoSerie(fac, refError) {
  const W = 560, H = 250, ox = 50, oy = 18, w = W - ox - 56, h = H - oy - 46, P = fac.puntos;
  const maxE = Math.max(refError * 1.5, ...P.map((p) => p.error)) * 1.12;
  const bw = w / P.length;
  const Y = (v) => oy + h - (v / maxE) * h, Ya = (a) => oy + h - a * h;
  let s = "";
  for (const v of [0, maxE / 2, maxE]) s += `<line x1="${ox}" x2="${ox + w}" y1="${Y(v)}" y2="${Y(v)}" class="rej"/>` + t(ox - 8, Y(v) + 4, f2(v), 'class="eje" text-anchor="end"');
  s += t(ox - 38, oy + h / 2, "distancia a la teoría", `class="eje" transform="rotate(-90 ${ox - 38} ${oy + h / 2})" text-anchor="middle"`);
  s += t(ox + w + 44, oy + h / 2, "se extingue", `class="eje" fill="${C.L}" transform="rotate(90 ${ox + w + 44} ${oy + h / 2})" text-anchor="middle"`);
  for (const a of [0, 0.5, 1]) s += t(ox + w + 8, Ya(a) + 4, pct(a), `class="eje" fill="${C.L}"`);
  // referencia: el mejor caso medido de la simulación
  s += `<line x1="${ox}" x2="${ox + w}" y1="${Y(refError)}" y2="${Y(refError)}" stroke="${C.teo}" stroke-dasharray="3 4" stroke-width="1"/>`;
  s += t(ox + 4, Y(refError) - 6, "referencia", 'class="eje"');
  let linea = "";
  P.forEach((p, i) => {
    const x = ox + i * bw + bw * 0.22, bwi = bw * 0.56;
    const malo = p.error > refError * 2;
    s += `<rect x="${x}" y="${Y(p.error)}" width="${bwi}" height="${oy + h - Y(p.error)}" fill="${malo ? C.A : C.H}" opacity="${malo ? 0.95 : 0.75}"/>`;
    s += t(x + bwi / 2, Y(p.error) - 6, f3(p.error), 'class="val" text-anchor="middle"');
    s += t(x + bwi / 2, oy + h + 18, p.etiqueta, 'class="eje" text-anchor="middle"');
    const cx = x + bwi / 2, cy = Ya(p.absorcion);
    linea += `${i ? "L" : "M"}${cx},${cy}`;
  });
  s += `<path d="${linea}" fill="none" stroke="${C.L}" stroke-width="1.6"/>`;
  P.forEach((p, i) => { const cx = ox + i * bw + bw / 2; s += `<circle cx="${cx}" cy="${Ya(p.absorcion)}" r="4.5" fill="${C.L}" stroke="#0b0d0e" stroke-width="1.5"/>`; });
  s += t(ox + w / 2, H - 4, fac.nivel, 'class="eje" text-anchor="middle"');
  return svg(W, H, s);
}

// oscilación: desviación típica de y frente a N, con la curva 1/√N de referencia
function graficoOscilacion(fac) {
  const W = 560, H = 250, ox = 56, oy = 18, w = W - ox - 26, h = H - oy - 46;
  const P = fac.puntos.filter((p) => p.ruidoY != null);
  const N = P.map((p) => 6 * p.valor), maxR = Math.max(...P.map((p) => p.ruidoY)) * 1.2;
  const lx = (n) => Math.log10(n), x0 = lx(Math.min(...N)) - 0.1, x1 = lx(Math.max(...N)) + 0.1;
  const X = (n) => ox + (lx(n) - x0) / (x1 - x0) * w, Y = (v) => oy + h - v / maxR * h;
  let s = "";
  for (const v of [0, maxR / 2, maxR]) s += `<line x1="${ox}" x2="${ox + w}" y1="${Y(v)}" y2="${Y(v)}" class="rej"/>` + t(ox - 8, Y(v) + 4, f3(v), 'class="eje" text-anchor="end"');
  s += t(ox - 44, oy + h / 2, "oscilación de y", `class="eje" transform="rotate(-90 ${ox - 44} ${oy + h / 2})" text-anchor="middle"`);
  // 1/√N ajustada al punto central
  const mid = P[Math.floor(P.length / 2)], k = mid.ruidoY * Math.sqrt(6 * mid.valor);
  let d = ""; for (let i = 0; i <= 40; i++) { const n = Math.pow(10, x0 + (x1 - x0) * i / 40); d += `${i ? "L" : "M"}${X(n)},${Y(Math.min(maxR, k / Math.sqrt(n)))}`; }
  s += `<path d="${d}" fill="none" stroke="${C.teo}" stroke-dasharray="3 4"/>` + t(ox + w - 4, Y(k / Math.sqrt(Math.pow(10, x1))) - 8, "∝ 1/√N", 'class="eje" text-anchor="end"');
  s += `<line x1="${ox}" x2="${ox + w}" y1="${Y(0)}" y2="${Y(0)}" stroke="${C.H}" stroke-width="1.2"/>` + t(ox + 6, Y(0) - 6, "la teoría: 0 (quieto en el equilibrio)", `class="eje" fill="${C.H}"`);
  P.forEach((p) => { s += `<circle cx="${X(6 * p.valor)}" cy="${Y(p.ruidoY)}" r="5" fill="${C.A}"/>` + t(X(6 * p.valor), Y(p.ruidoY) - 10, f3(p.ruidoY), 'class="val" text-anchor="middle"') + t(X(6 * p.valor), oy + h + 18, String(6 * p.valor), 'class="eje" text-anchor="middle"'); });
  s += t(ox + w / 2, H - 4, "agentes en total (escala logarítmica)", 'class="eje" text-anchor="middle"');
  return svg(W, H, s);
}

// borde: error frente a lo bajo que llega y en la trayectoria teórica
function graficoBorde(fac) {
  const W = 560, H = 250, ox = 50, oy = 18, w = W - ox - 26, h = H - oy - 46, P = fac.puntos;
  const maxE = Math.max(...P.map((p) => p.error)) * 1.25, maxY = Math.max(...P.map((p) => p.valor)) * 1.15;
  const X = (v) => ox + w - v / maxY * w, Y = (v) => oy + h - v / maxE * h;
  let s = "";
  for (const v of [0, maxE / 2, maxE]) s += `<line x1="${ox}" x2="${ox + w}" y1="${Y(v)}" y2="${Y(v)}" class="rej"/>` + t(ox - 8, Y(v) + 4, f2(v), 'class="eje" text-anchor="end"');
  s += t(ox - 38, oy + h / 2, "distancia a la teoría", `class="eje" transform="rotate(-90 ${ox - 38} ${oy + h / 2})" text-anchor="middle"`);
  for (const v of [0, maxY / 2, maxY]) s += t(X(v), oy + h + 18, f2(v), 'class="eje" text-anchor="middle"');
  P.forEach((p) => { s += `<circle cx="${X(p.valor)}" cy="${Y(p.error)}" r="5.5" fill="${p.error > 0.09 ? C.A : C.H}"/>` + t(X(p.valor) + 9, Y(p.error) + 4, p.etiqueta, 'class="eje"'); });
  s += t(ox + w / 2, H - 4, "← más cerca del borde · y mínimo de la trayectoria teórica", 'class="eje" text-anchor="middle"');
  return svg(W, H, s);
}

// ranking: cuánto multiplica cada factor el error de la simulación de referencia
function graficoRanking(filas) {
  const W = 1700, fila = 44, H = filas.length * fila + 20, ox = 560, w = W - ox - 300;
  const max = Math.max(...filas.map((f) => f.mult));
  let s = "";
  filas.forEach((f, i) => {
    const y = 10 + i * fila, ancho = Math.max(2, (f.mult / max) * w);
    s += t(ox - 16, y + 22, f.titulo, 'class="rk" text-anchor="end"');
    s += `<rect x="${ox}" y="${y + 9}" width="${ancho}" height="18" fill="${f.mult >= 3 ? C.A : f.mult >= 1.5 ? C.H : C.P}"/>`;
    s += t(ox + ancho + 10, y + 23, `×${f.mult.toFixed(1)}`, 'class="rkv"');
    if (f.absorcion > 0) s += t(ox + ancho + 70, y + 23, `se extingue el ${pct(f.absorcion)}`, `class="eje" fill="${C.L}"`);
  });
  return svg(W, H, s);
}

// pasión: fracción final de productores de calidad frente a la pasión media, con el piso e^(−1/k)
function graficoPasion(fac) {
  const W = 560, H = 350, ox = 50, oy = 18, w = W - ox - 26, h = H - oy - 112;
  const xs = fac.series[0].puntos.map((p) => p.valor), maxX = Math.max(...xs);
  const X = (v) => ox + v / maxX * w, Y = (v) => oy + h - v * h;
  const colores = [C.L, C.A, C.P];
  let s = "";
  for (const v of [0, 0.5, 1]) s += `<line x1="${ox}" x2="${ox + w}" y1="${Y(v)}" y2="${Y(v)}" class="rej"/>` + t(ox - 8, Y(v) + 4, f2(v), 'class="eje" text-anchor="end"');
  s += t(ox - 38, oy + h / 2, "productores de calidad al final", `class="eje" transform="rotate(-90 ${ox - 38} ${oy + h / 2})" text-anchor="middle"`);
  for (const v of xs) s += t(X(v), oy + h + 18, String(v), 'class="eje" text-anchor="middle"');
  let d = ""; for (let i = 1; i <= 60; i++) { const k = maxX * i / 60; d += `${i > 1 ? "L" : "M"}${X(k)},${Y(Math.exp(-1 / k))}`; }
  s += `<path d="${d}" fill="none" stroke="${C.teo}" stroke-dasharray="3 4"/>`;
  s += t(X(maxX) - 4, Y(Math.exp(-1 / maxX)) - 10, "vocaciones: e^(−1/pasión)", `class="eje" text-anchor="end" fill="${C.teo}"`);
  s += t(ox, oy + h + 57 + 18 * 3 + 4, "la teoría predice 0 (extinción de la calidad) en los tres casos", `class="eje" fill="${C.L}"`);
  fac.series.forEach((se, k) => {
    let l = ""; se.puntos.forEach((p, i) => { l += `${i ? "L" : "M"}${X(p.valor)},${Y(p.x)}`; });
    s += `<path d="${l}" fill="none" stroke="${colores[k]}" stroke-width="1.6"/>`;
    se.puntos.forEach((p) => { s += `<circle cx="${X(p.valor)}" cy="${Y(p.x)}" r="${p.viva === 1 ? 4.5 : 3}" fill="${p.viva === 1 ? colores[k] : "#0b0d0e"}" stroke="${colores[k]}" stroke-width="1.5"/>`; });
    s += `<rect x="${ox}" y="${oy + h + 52 + 18 * k}" width="14" height="3" fill="${colores[k]}"/>` + t(ox + 22, oy + h + 57 + 18 * k, se.nombre, 'class="eje"');
  });
  s += t(ox + w / 2, oy + h + 34, "pasión media (en unidades de c_H) · punto lleno: sobrevive en las 8 ejecuciones", 'class="eje" text-anchor="middle"');
  return svg(W, H, s);
}

// ---------------------------------------------------------------- montaje
let datosSemillas = 8;
export function montarInforme(raiz, datos, verEnSimulacion) {
  if (datos) datosSemillas = datos.semillas;
  if (!datos) { raiz.innerHTML = `<div class="inf-vacio">Faltan los datos: ejecuta <code>node medir_todo.mjs</code> y vuelve a construir.</div>`; return; }
  const ref = datos.referencias.find((r) => r.escenario === "coexistencia");
  const refE = ref.error;
  const ranking = datos.factores.filter((f) => f.id !== "oscilacion" && f.id !== "pasion").map((f) => {
    const p = TEXTOS[f.id].peor(f.puntos);
    return { id: f.id, titulo: f.titulo, mult: p.error / refE, absorcion: p.absorcion };
  }).sort((a, b) => b.mult - a.mult);

  let html = `<header class="inf-cab">
    <p class="inf-ante">Lo que la teoría no ve</p>
    <h1>Las EDO aciertan. Hasta que la realidad añade algo que no está en ellas.</h1>
    <p class="inf-intro">Cada factor se midió en la simulación de agentes con ${datos.semillas} semillas distintas.
    La <em>distancia a la teoría</em> es la separación media entre el estado de los agentes y el que predicen las ecuaciones;
    la <em>extinción</em> es el porcentaje de ejecuciones en que una población desaparece aunque la teoría prediga que sobrevive.</p>
    <div class="inf-refs">${datos.referencias.map((r) => `<div><b>${f3(r.error)}</b><span>${{ frontera: "frontera", colapso: "colapso", coexistencia: "coexistencia" }[r.escenario]}, 240 productores y 1200 consumidores</span></div>`).join("")}
      <p>Con poblaciones grandes y agentes bien informados la teoría acierta: estas son las distancias de referencia.</p></div>
  </header>
  <section class="inf-rank"><h2>Qué pesa más</h2><p class="inf-sub">Cuántas veces multiplica cada factor, en su peor caso medido, la distancia de la coexistencia de referencia (${f3(refE)}).</p>${graficoRanking(ranking)}</section>`;

  const pas = datos.factores.find((q) => q.id === "pasion");
  if (pas) {
    const co = pas.series[0].puntos, uno = co.find((p) => p.valor === 1), medio = co.find((p) => p.valor === 0.5);
    const yFin = Math.max(...pas.series.flatMap((se) => se.puntos.filter((p) => p.valor > 0).map((p) => p.y)));
    html += `<section class="inf-fac inf-pasion">
      <div class="inf-num">+</div>
      <div class="inf-txt">
        <h3>Pasión por crear <span class="inf-nuevo">el factor que más acerca la simulación a la realidad</span></h3>
        <p><span class="et">La teoría supone</span> que un productor solo se esfuerza si las vistas lo pagan.</p>
        <p><span class="et">En la realidad</span> mucha gente crea porque le gusta. Cada productor suma a su ganancia una satisfacción propia
        (unos mucha, la mayoría poca). Quien disfruta más de lo que le cuesta esforzarse no abandona nunca, aunque nadie lo vea:
        con una pasión media k (en unidades de c_H) son una fracción e^(−1/k) de los productores.</p>
        <p class="med"><span class="et">Medido</span> En el colapso, donde la teoría predice que la calidad desaparece,
        con k = ${medio.valor} sobrevive en ${Math.round(medio.viva * datos.semillas)} de ${datos.semillas} ejecuciones y con k = 1 en ${Math.round(uno.viva * datos.semillas)} de ${datos.semillas},
        con un ${Math.round(100 * uno.x)} % de productores de calidad (el piso predicho es ${Math.round(100 * Math.exp(-1))} %).
        Pero la audiencia no se salva: el máximo de consumidores activos al final es ${f3(yFin)}. La pasión rescata a quien crea, no a quien busca.</p>
        <button class="inf-ver" data-pasion="1">verlo en la simulación →</button>
      </div>
      <div class="inf-graf">${graficoPasion(pas)}</div>
    </section>`;
  }
  const orden = [...ranking.map((r) => r.id), "oscilacion"].filter((id) => datos.factores.some((q) => q.id === id));
  orden.forEach((id, i) => {
    const f = datos.factores.find((q) => q.id === id), tx = TEXTOS[id];
    const g = id === "oscilacion" ? graficoOscilacion(f) : id === "borde" ? graficoBorde(f) : graficoSerie(f, refE);
    html += `<section class="inf-fac">
      <div class="inf-num">${String(i + 1).padStart(2, "0")}</div>
      <div class="inf-txt">
        <h3>${f.titulo}</h3>
        <p><span class="et">La teoría supone</span> ${tx.supone}</p>
        <p><span class="et">En la realidad</span> ${tx.realidad}</p>
        <p class="med"><span class="et">Medido</span> ${tx.medido(f.puntos)}</p>
        <button class="inf-ver" data-id="${id}">verlo en la simulación →</button>
      </div>
      <div class="inf-graf">${g}</div>
    </section>`;
  });
  html += `<footer class="inf-pie">Datos: <code>datos/discrepancias.json</code> · ${datos.semillas} semillas por medida · regenerables con <code>node medir_todo.mjs</code> (${datos.fecha}).</footer>`;
  raiz.innerHTML = html;

  const bp = raiz.querySelector(".inf-ver[data-pasion]");
  if (bp) bp.onclick = () => verEnSimulacion("colapso", { pasion: 1 });
  raiz.querySelectorAll(".inf-ver:not([data-pasion])").forEach((b) => b.onclick = () => {
    const f = datos.factores.find((q) => q.id === b.dataset.id);
    const p = TEXTOS[f.id].peor(f.puntos);
    verEnSimulacion(f.escenario, p.ajustes, p.x0 ?? f.inicio?.[0], p.y0 ?? f.inicio?.[1]);
  });
}
