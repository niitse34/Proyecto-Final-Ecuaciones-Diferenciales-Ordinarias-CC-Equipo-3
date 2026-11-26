// Mide la distancia entre la simulación de agentes y la predicción de la teoría.
// error = media temporal de la distancia euclídea entre (x,y) agentes y (x,y) teoría,
// hasta τ = T. Se repite con varias semillas.
import { Plataforma, ESCENARIOS } from "./js/modelo.js";
import { trayectoria } from "./js/teoria.js";

export function medir(esc, opciones = {}, semillas = 5, T = 30) {
  const base = { ...ESCENARIOS[esc], ...opciones };
  let errores = [], absorb = 0;
  for (let s = 1; s <= semillas; s++) {
    const sim = new Plataforma({ ...base, semilla: s });
    const dt = 0.01, teo = trayectoria(base.x0, base.y0, { ...base, sigma: sim.sigma }, T + 1, dt);
    const R = Math.round(T * sim.escala); let suma = 0, cnt = 0, muerto = false;
    for (let r = 1; r <= R; r++) {
      sim.paso();
      if (r % 10 === 0) { const q = teo[Math.min(teo.length - 1, Math.round(sim.tau(r) / dt))];
        suma += Math.hypot(sim.x - q[1], sim.y - q[2]); cnt++; }
      if (!muerto && esc !== "colapso" && (sim.x === 0 || sim.y === 0 || sim.x === 1)) muerto = true;
    }
    errores.push(suma / cnt); absorb += muerto;
  }
  const med = errores.reduce((a, b) => a + b) / errores.length;
  return { error: med, absorcion: absorb / semillas };
}

if ((process.argv[1]||"").endsWith("experimentos.mjs")) {
  const fila = (etiq, r) => console.log(etiq.padEnd(44), "error", r.error.toFixed(3), " absorción", (100 * r.absorcion).toFixed(0) + "%");
  console.log("## 1. Tamaño de la población (coexistencia bien amortiguada)");
  for (const [m, n] of [[30, 150], [60, 300], [120, 600], [240, 1200], [480, 2400]])
    fila(`m=${m} n=${n}`, medir("coexistencia", { productores: m, consumidores: n }));
  console.log("## 2. Coexistencia del artículo (y*=0.037, foco casi sin amortiguar)");
  for (const [m, n] of [[120, 600], [240, 1200], [480, 2400]])
    fila(`m=${m} n=${n}`, medir("articulo", { productores: m, consumidores: n }, 4, 15));
  console.log("## 3. Memoria de ganancias (retraso en la decisión)");
  for (const mem of [1, 3, 10, 30])
    fila(`memoria=${mem} rondas`, medir("coexistencia", { productores: 120, consumidores: 600, memoria: mem }));
  console.log("## 4. Discriminación imperfecta de los activos");
  for (const ru of [0, 0.1, 0.3])
    fila(`ruido de percepción=${ru}`, medir("coexistencia", { productores: 120, consumidores: 600, ruidoPercepcion: ru }));
  console.log("## 5. Regímenes con atractor en el borde");
  fila("frontera m=120 n=600", medir("frontera", { productores: 120, consumidores: 600 }));
  fila("colapso m=120 n=600", medir("colapso", { productores: 120, consumidores: 600 }));
}
