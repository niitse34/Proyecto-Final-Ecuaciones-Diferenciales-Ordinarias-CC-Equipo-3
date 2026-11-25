// Mide todos los factores que separan la simulación de la teoría y guarda datos/discrepancias.json.
// La página «Lo que la teoría no ve» se construye solo con estos datos.
// Uso: node medir_todo.mjs [semillas]
import { writeFileSync, mkdirSync } from "node:fs";
import { Plataforma, ESCENARIOS } from "./js/modelo.js";
import { trayectoria, prediccion } from "./js/teoria.js";

const SEM = +(process.argv[2] || 8);
const SOLO = process.argv[3] || null;   // medir solo un factor (para lanzarlos en paralelo)
const toca = (id) => !SOLO || SOLO === id;

// error: distancia media agentes–teoría en τ ∈ [0, T]; absorción: alguna población se extingue
// sin que la teoría lo prediga; ruido: desviación típica de y en el tramo final.
function medir(esc, op = {}, T = 30) {
  const base = { ...ESCENARIOS[esc], ...op };
  const errores = [], ruidos = []; let absorb = 0;
  for (let s = 1; s <= SEM; s++) {
    const sim = new Plataforma({ ...base, semilla: 1000 + s });
    const dt = 0.01, teo = trayectoria(base.x0, base.y0, { ...base, sigma: sim.sigma }, T + 1, dt);
    let suma = 0, cnt = 0, muerto = false, ys = [];
    while (sim.tau() < T) {
      sim.paso();
      if (sim.ronda % 5 === 0) {
        const q = teo[Math.min(teo.length - 1, Math.round(sim.tau() / dt))];
        suma += Math.hypot(sim.x - q[1], sim.y - q[2]); cnt++;
        if (sim.tau() > T * 0.6) ys.push(sim.y);
      }
      if (!muerto && esc !== "colapso" && (sim.x === 0 || sim.y === 0 || sim.x === 1)) muerto = true;
    }
    errores.push(suma / cnt); absorb += muerto;
    if (!muerto && ys.length) { const m = ys.reduce((a, b) => a + b) / ys.length; ruidos.push(Math.sqrt(ys.reduce((a, b) => a + (b - m) ** 2, 0) / ys.length)); }
  }
  const media = (v) => v.length ? v.reduce((a, b) => a + b) / v.length : null;
  const sd = (v) => { const m = media(v); return v.length > 1 ? Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / (v.length - 1)) : 0; };
  return { error: media(errores), errorSd: sd(errores), absorcion: absorb / SEM, ruidoY: media(ruidos) };
}

const t0 = Date.now();
const log = (...a) => console.error(`[${((Date.now() - t0) / 1000).toFixed(0)} s]`, ...a);
const pob = (m) => ({ productores: m, consumidores: 5 * m });
const BASE = pob(240);
const datos = { semillas: SEM, fecha: new Date().toISOString().slice(0, 10), factores: [] };

const serie = (id, titulo, esc, nivelNombre, niveles, op, T) => {
  if (!toca(id)) return;
  const puntos = niveles.map((n) => { const r = medir(esc, op(n), T); log(id, n.etiqueta, r.error.toFixed(3), r.absorcion); return { ...n, ...r }; });
  datos.factores.push({ id, titulo, escenario: esc, nivel: nivelNombre, T, puntos });
};

serie("poblacion", "Poblaciones pequeñas", "coexistencia", "productores · consumidores",
  [30, 60, 120, 240, 480].map((m) => ({ etiqueta: `${m} · ${5 * m}`, valor: m, ajustes: pob(m) })), (n) => n.ajustes, 30);
serie("memoria", "Información con retraso", "coexistencia", "rondas de memoria",
  [1, 2, 3, 5, 10, 30].map((v) => ({ etiqueta: String(v), valor: v, ajustes: { ...BASE, memoria: v } })), (n) => n.ajustes, 30);
serie("articulo", "Muy pocos consumidores activos (la coexistencia del artículo)", "articulo", "productores · consumidores",
  [120, 240, 480].map((m) => ({ etiqueta: `${m} · ${5 * m}`, valor: m, ajustes: pob(m) })), (n) => n.ajustes, 15);
serie("revision", "Todos deciden a la vez", "coexistencia", "agentes que revisan por ronda",
  [1, 0.5, 0.25].map((v) => ({ etiqueta: `${Math.round(100 * v)} %`, valor: v, ajustes: { ...BASE, revision: v } })), (n) => n.ajustes, 20);
serie("percepcion", "Errores al distinguir la calidad", "coexistencia", "errores de los activos",
  [0, 0.1, 0.2, 0.3, 0.5].map((v) => ({ etiqueta: `${Math.round(100 * v)} %`, valor: v, ajustes: { ...BASE, ruidoPercepcion: v } })), (n) => n.ajustes, 30);

// Oscilaciones sostenidas por el ruido: se parte del equilibrio y se mide la desviación de y.
if (toca("oscilacion")) {
  const e = ESCENARIOS.coexistencia, pr = prediccion({ ...e });
  const puntos = [60, 120, 240, 480, 960].map((m) => {
    const r = medir("coexistencia", { ...pob(m), x0: pr.xc, y0: pr.yc }, 40);
    log("oscilacion", m, r.ruidoY, r.absorcion);
    return { etiqueta: `${m} · ${5 * m}`, valor: m, ajustes: { ...pob(m) }, ...r };
  });
  datos.factores.push({ id: "oscilacion", titulo: "Oscilaciones que el azar mantiene vivas", escenario: "coexistencia", nivel: "productores · consumidores", T: 40, inicio: [pr.xc, pr.yc], puntos });
}

// Cercanía a los bordes: lo bajo que llega y en la trayectoria teórica frente al error.
if (toca("borde")) {
  const e = ESCENARIOS.coexistencia;
  const puntos = [[0.55, 0.25], [0.6, 0.5], [0.85, 0.45], [0.45, 0.6], [0.9, 0.3]].map(([x0, y0]) => {
    const t = trayectoria(x0, y0, e, 20, 0.004); let ymin = 1; for (const q of t) ymin = Math.min(ymin, q[2]);
    const r = medir("coexistencia", { ...BASE, x0, y0 }, 15);
    log("borde", x0, y0, ymin.toFixed(3), r.error.toFixed(3));
    return { etiqueta: `(${x0}, ${y0})`, valor: ymin, x0, y0, ajustes: { ...BASE }, ...r };
  }).sort((a, b) => b.valor - a.valor);
  datos.factores.push({ id: "borde", titulo: "Trayectorias que rozan los bordes", escenario: "coexistencia", nivel: "y mínimo de la trayectoria teórica", T: 15, puntos });
}

// Pasión por crear: no se mide la distancia a la teoría sino si sobrevive la calidad.
if (toca("pasion")) {
  const casos = [["colapso", "colapso (la teoría predice extinción)", {}], ["coexistencia", "coexistencia con 3 rondas de memoria", { memoria: 3 }], ["coexistencia", "coexistencia con 30 · 150 agentes", { productores: 30, consumidores: 150 }]];
  const niveles = [0, 0.25, 0.5, 0.75, 1, 1.5];
  const series = casos.map(([esc, nombre, extra]) => ({ escenario: esc, nombre, extra, puntos: niveles.map((k) => {
    let viva = 0, xs = 0, ys = 0;
    for (let s = 1; s <= SEM; s++) {
      const e = ESCENARIOS[esc];
      const sim = new Plataforma({ ...e, ...BASE, ...extra, pasion: k * e.cH, semilla: 2000 + s });
      while (sim.tau() < 30) sim.paso();
      viva += sim.x > 0; xs += sim.x; ys += sim.y;
    }
    log("pasion", nombre, k, viva / SEM, (xs / SEM).toFixed(3));
    return { etiqueta: `${k}`, valor: k, viva: viva / SEM, x: xs / SEM, y: ys / SEM, piso: k > 0 ? Math.exp(-1 / k) : 0,
             ajustes: { ...BASE, ...extra, pasion: k } };
  }) }));
  datos.factores.push({ id: "pasion", titulo: "Pasión por crear", nivel: "pasión media (en unidades de c_H)", T: 30, series });
}

// Referencias donde la teoría acierta.
if (toca("referencias")) datos.referencias = ["frontera", "colapso", "coexistencia"].map((esc) => ({ escenario: esc, ...medir(esc, BASE, 30) }));
if (datos.referencias) log("referencias", datos.referencias.map((r) => r.error.toFixed(3)).join(" "));

mkdirSync(new URL("datos/", import.meta.url), { recursive: true });
writeFileSync(new URL(SOLO ? `datos/parcial-${SOLO}.json` : "datos/discrepancias.json", import.meta.url), JSON.stringify(datos, null, 1));
log("listo: datos/discrepancias.json");
