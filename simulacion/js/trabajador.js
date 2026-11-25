// Hilo de simulación: calcula las rondas aparte para que el dibujo nunca espere.
// Recibe órdenes del hilo principal y le envía el estado unas 60 veces por segundo.
import { Plataforma } from "./modelo.js";

let sim = null, ritmo = 20, corriendo = true, lento = false, acum = 0, ultimo = 0, ultimoLento = 0;
let ultimoRayo = 0, idSim = 0, hist = [], cambiosP = null, cambiosC = null, rayos = null, hechas = 0;

function muestraRayos(densos) {
  const nCons = densos ? 260 : 80, porCons = densos ? 6 : 3, N = nCons * porCons;
  const j = new Int32Array(N), i = new Int32Array(N), a = new Uint8Array(N);
  for (let c = 0, q = 0; c < nCons; c++) {
    const jj = (Math.random() * sim.n) | 0;
    for (let k = 0; k < porCons; k++, q++) { j[q] = jj; i[q] = sim.lecturas[jj * sim.k + ((Math.random() * sim.k) | 0)]; a[q] = sim.A[jj]; }
  }
  return { j, i, a, densos };
}

function unaRonda(conRayos, densos = false) {
  sim.paso(); hechas++;
  hist.push(sim.tau(), sim.x, sim.y);
  for (let q = 0; q < sim.m; q++) if (sim.cambiosProd[q]) cambiosP[q] = 1;
  for (let q = 0; q < sim.n; q++) if (sim.cambiosCons[q]) cambiosC[q] = 1;
  if (conRayos) rayos = muestraRayos(densos);
}

function constantes() {
  return { m: sim.m, n: sim.n, k: sim.k, sigma: sim.sigma, escala: sim.escala, revision: sim.revision,
           cH: sim.cH, pasionMedia: sim.pasionMedia, afan: Float64Array.from(sim.afan) };
}

function enviar(extra = {}) {
  const msg = { tipo: "estado", idSim, ronda: sim.ronda, x: sim.x, y: sim.y, medio: sim.medio,
    H: Uint8Array.from(sim.H), A: Uint8Array.from(sim.A), vistas: Float32Array.from(sim.vistas),
    cambiosP, cambiosC, hist: Float64Array.from(hist), rayos, ...extra };
  postMessage(msg);
  hist = []; rayos = null; hechas = 0;
  cambiosP = new Uint8Array(sim.m); cambiosC = new Uint8Array(sim.n);
}

function bucle() {
  const ahora = performance.now(), dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;
  if (sim && corriendo) {
    if (lento) {
      if (ahora - ultimoLento > 1100) { unaRonda(true, true); ultimoLento = ahora; }
    } else {
      acum += dt * ritmo;
      const t0 = performance.now(); let primera = ahora - ultimoRayo > 50;   // rayos: 20 tandas por segundo bastan
      if (primera) ultimoRayo = ahora;
      while (acum >= 1 && performance.now() - t0 < 14) { unaRonda(primera); primera = false; acum -= 1; }
      if (acum > 2) acum = 2;                       // si no da abasto, va más lento en vez de acumular
    }
    if (hechas) enviar();
  }
  setTimeout(bucle, 8);
}

onmessage = (e) => {
  const o = e.data;
  if (o.tipo === "nueva") {
    sim = new Plataforma(o.opciones); acum = 0; idSim = o.id;
    hist = [sim.tau(), sim.x, sim.y]; cambiosP = new Uint8Array(sim.m); cambiosC = new Uint8Array(sim.n);
    enviar({ constantes: constantes() });
  } else if (!sim) return;
  else if (o.tipo === "ritmo") { ritmo = o.ritmo; corriendo = o.corriendo; lento = o.lento; }
  else if (o.tipo === "ajustar") { Object.assign(sim, o.campos); enviar({ constantes: constantes() }); }
  else if (o.tipo === "paso") { unaRonda(true, lento); enviar(); }
  else if (o.tipo === "avanzar") { for (let q = 0; q < o.n; q++) unaRonda(q === o.n - 1); enviar(); }
};
ultimo = performance.now();
bucle();
