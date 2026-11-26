import { Plataforma, ESCENARIOS } from "./modelo.js";
import { trayectoria, prediccion, campo, ventajas } from "./teoria.js";
import { montarInforme } from "./informe.js";

// ------------------------------------------------------------------ estado
const COL = { H: "#4fc3bd", L: "#c4553f", A: "#e8ad4c", P: "#6c7a86", teo: "#f2ead7", tenue: "#8d918f",
              linea: "#262b2e", fondo: "#0b0d0e", texto: "#e9e5dc" };
const BASE_REALISMO = { memoria: 1, ruidoPercepcion: 0, revision: 0.5, pasion: 0 };
const est = {
  clave: "coexistencia",
  p: null,                  // parámetros de la teoría (R, M, σ, cA, cH)
  pob: { productores: 240, consumidores: 1200 },
  realismo: { ...BASE_REALISMO },
  sim: null, teo: null, pred: null, t0: 0,  // teo: trayectoria desde la ronda t0
  corriendo: true, lento: false, vel: 0.45, acum: 0,
  rayos: [], semilla: 1,
  vistasSuaves: null, flashProd: null, flashCons: null,
};
const $ = (id) => document.getElementById(id);

// ------------------------------------------------------------------ hilo de simulación
// Las rondas se calculan en otro hilo (trabajador.js); aquí solo se dibuja. est.sim es una copia
// local de la plataforma, creada con la misma semilla, que se actualiza con cada estado recibido.
const trabajador = window.FUENTE_TRABAJADOR
  ? new Worker(URL.createObjectURL(new Blob([window.FUENTE_TRABAJADOR], { type: "text/javascript" })))
  : new Worker("js/trabajador.js", { type: "module" });
let idSim = 0;
function ajustarSim(campos) { Object.assign(est.sim, campos); trabajador.postMessage({ tipo: "ajustar", campos }); }
function enviarRitmo() {
  if (!est.sim) return;
  trabajador.postMessage({ tipo: "ritmo", ritmo: rondasPorSegundo(), corriendo: est.corriendo, lento: est.lento });
}
trabajador.onmessage = (e) => {
  const o = e.data, s = est.sim;
  if (!s || o.idSim !== idSim) return;                    // estado de una simulación anterior
  s.ronda = o.ronda; s.x = o.x; s.y = o.y; s.medio = o.medio; s.H = o.H; s.A = o.A; s.vistas = o.vistas;
  if (o.constantes) Object.assign(s, o.constantes);
  for (let q = 0; q < o.hist.length; q += 3) est.hist.push([o.hist[q], o.hist[q + 1], o.hist[q + 2]]);
  for (let i = 0; i < s.m; i++) { est.vistasSuaves[i] += 0.35 * (o.vistas[i] - est.vistasSuaves[i]); if (o.cambiosP[i]) est.flashProd[i] = 1; }
  for (let j = 0; j < s.n; j++) if (o.cambiosC[j]) est.flashCons[j] = 1;
  if (o.rayos) {
    const ahora = performance.now(), r = o.rayos, sep = r.densos ? 350 : 60;
    for (let q = 0; q < r.j.length; q++) est.rayos.push({ j: r.j[q], i: r.i[q], t: ahora + Math.random() * sep, a: r.a[q] === 1 });
    if (est.rayos.length > 2500) est.rayos.splice(0, est.rayos.length - 2500);
  }
};

// ------------------------------------------------------------------ factores que la teoría no ve
// Cada uno se activa o se quita con un clic. «nivel» es el valor que se aplica al activarlo
// (ajustable con los deslizadores del panel de parámetros).
const FACTORES = [
  { id: "poblacion", nombre: "Población pequeña", ayuda: "60 productores y 300 consumidores en lugar de 240 y 1200: el azar pesa más y los bordes atrapan.",
    activo: () => est.pob.productores < 240, texto: () => `${est.pob.productores} · ${est.pob.consumidores}`,
    poner: (on) => { est.pob = on ? { productores: 60, consumidores: 300 } : { productores: 240, consumidores: 1200 }; return true; } },
  { id: "memoria", nombre: "Información con retraso", ayuda: "los agentes deciden por lo ganado en las últimas rondas, no por la ventaja actual.",
    activo: () => est.realismo.memoria > 1, texto: () => `${est.realismo.memoria} rondas`,
    poner: (on) => { est.realismo.memoria = on ? 3 : 1; ajustarSim({ alfa: 1 / est.realismo.memoria }); return false; } },
  { id: "percepcion", nombre: "Errores al distinguir", ayuda: "un consumidor activo a veces no reconoce la calidad y lee al azar.",
    activo: () => est.realismo.ruidoPercepcion > 0, texto: () => `${Math.round(100 * est.realismo.ruidoPercepcion)} %`,
    poner: (on) => { est.realismo.ruidoPercepcion = on ? 0.2 : 0; ajustarSim({ ruido: est.realismo.ruidoPercepcion }); return false; } },
  { id: "revision", nombre: "Todos deciden a la vez", ayuda: "cada ronda revisan todos los agentes a la vez (sin el factor, la mitad): el sistema avanza a saltos.",
    activo: () => est.realismo.revision >= 1, texto: () => "100 %",
    poner: (on) => { est.realismo.revision = on ? 1 : 0.5; return true; } },
  { id: "pasion", nombre: "Pasión por crear", ayuda: "cada productor disfruta crear con calidad aunque nadie lo vea; los más apasionados nunca abandonan.",
    activo: () => est.realismo.pasion > 0, texto: () => `media ${(est.realismo.pasion).toFixed(2)} · c_H`,
    poner: (on) => { est.realismo.pasion = on ? 0.75 : 0; return true; } },
];

function pintarFactores() {
  const caja = $("factores"); caja.innerHTML = "";
  const tit = document.createElement("span"); tit.className = "fac-tit"; tit.textContent = "lo que la teoría no ve";
  caja.appendChild(tit);
  for (const f of FACTORES) {
    const b = document.createElement("button");
    const on = f.activo();
    b.className = "fac" + (on ? " on" : "") + (f.id === "pasion" ? " nuevo" : "");
    b.title = f.ayuda;
    b.innerHTML = `<i></i><span>${f.nombre}</span>${on ? `<em>${f.texto()}</em>` : ""}`;
    b.onclick = () => alternarFactor(f);
    caja.appendChild(b);
  }
  const quitar = document.createElement("button"); quitar.className = "fac-quitar"; quitar.textContent = "quitar todos";
  quitar.onclick = () => {
    est.pob = { productores: 240, consumidores: 1200 }; est.realismo = { ...BASE_REALISMO };
    reconstruirConservando(); pintarFactores(); construirControles();
  };
  caja.appendChild(quitar);
  const n = FACTORES.filter((f) => f.activo()).length;
  quitar.style.visibility = n ? "visible" : "hidden";
}

function alternarFactor(f) {
  const reconstruir = f.poner(!f.activo());
  if (reconstruir) reconstruirConservando(); else predecir(true);
  pintarFactores(); construirControles();
}

// ------------------------------------------------------------------ simulación
function nueva(x0, y0, conservarSemilla = false) {
  if (!conservarSemilla) est.semilla = (est.semilla * 16807) % 2147483647 || 7;
  const pasion = est.realismo.pasion * est.p.cH;
  const opciones = { ...est.p, x0, y0, ...est.pob, ...est.realismo, pasion, semilla: est.semilla };
  est.sim = new Plataforma(opciones);                     // copia local: mismo estado inicial que el hilo
  idSim++;
  trabajador.postMessage({ tipo: "nueva", opciones, id: idSim });
  est.vistasSuaves = new Float32Array(est.sim.m);
  est.flashProd = new Float32Array(est.sim.m); est.flashCons = new Float32Array(est.sim.n);
  est.rayos = [];
  predecir();
  colocarConsumidores();
  enviarRitmo();
}

// conservarHistoria: un factor cambiado al vuelo no borra la estela, solo rehace la predicción
function predecir(conservarHistoria = false) {
  const s = est.sim, p = { ...est.p, sigma: s.sigma };
  est.pred = prediccion(p);
  est.t0 = s.ronda;
  est.teo = trayectoria(s.x, s.y, p, 120, 0.004);
  if (!conservarHistoria || !est.hist) est.hist = [[s.tau(), s.x, s.y]];
  est.histInicio = est.hist.length - 1;
  calcularCorrientes();
}

function cargar(clave) {
  est.clave = clave;
  const e = ESCENARIOS[clave];
  est.p = { R: e.R, M: e.M, sigma: e.sigma, cA: e.cA, cH: e.cH };
  nueva(e.x0, e.y0);
  pintarEscenarios(); construirControles(); pintarFactores();
}

function rondasPorSegundo() {
  // velocidad en tiempo de la teoría: de 0.1 a 6 unidades τ por segundo, igual con cualquier escala
  const tauPorSeg = 0.1 * Math.pow(60, est.vel);
  return tauPorSeg * est.sim.escala / est.sim.revision;
}

function unaRonda() { trabajador.postMessage({ tipo: "paso" }); }

// ------------------------------------------------------------------ lienzos
let escala = 1;
function ajustar(c) {
  const W = c.clientWidth, H = c.clientHeight, d = (window.devicePixelRatio || 1) * escala;
  if (c.width !== Math.round(W * d) || c.height !== Math.round(H * d)) {
    c.width = Math.round(W * d); c.height = Math.round(H * d);
  }
  const g = c.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0);
  return [g, W, H, d];
}

// ---- escenario fijo de 1920×1080 escalado a la ventana, y zoom del navegador bloqueado
function encajar() {
  escala = Math.min(innerWidth / 1920, innerHeight / 1080);
  const e = $("escena");
  e.style.transform = `translate(${(innerWidth - 1920 * escala) / 2}px, ${(innerHeight - 1080 * escala) / 2}px) scale(${escala})`;
  cacheFase = null;
}
addEventListener("resize", encajar);
addEventListener("wheel", (e) => { if (e.ctrlKey || e.metaKey) e.preventDefault(); }, { passive: false });
addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && ["+", "-", "=", "0", "_"].includes(e.key)) e.preventDefault(); }, { capture: true });
for (const ev of ["gesturestart", "gesturechange", "gestureend"]) addEventListener(ev, (e) => e.preventDefault(), { passive: false });
addEventListener("touchmove", (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });

// Puntos con brillo precalculados: dibujar una imagen es mucho más barato que shadowBlur.
function sprite(color, radio, brillo) {
  const t = Math.ceil((radio + brillo) * 2 * 2), c = document.createElement("canvas");
  c.width = c.height = t;
  const g = c.getContext("2d"), m = t / 2;
  const gr = g.createRadialGradient(m, m, 0, m, m, m);
  gr.addColorStop(0, color); gr.addColorStop(radio * 2 / m * 0.5, color);
  gr.addColorStop(Math.min(1, radio * 2 / m * 0.62), color + "88"); gr.addColorStop(1, color + "00");
  g.fillStyle = gr; g.fillRect(0, 0, t, t);
  return c;
}
const SPR = { A: sprite("#e8ad4c", 3, 5), yo: sprite("#ffffff", 3, 7), pasion: sprite("#f2ead7", 2, 4) };

// Posiciones fijas de los consumidores: espiral de girasol dentro del anillo.
let posCons = [];
function colocarConsumidores() {
  const n = est.sim.n, oro = Math.PI * (3 - Math.sqrt(5));
  posCons = [];
  for (let j = 0; j < n; j++) {
    const r = Math.sqrt((j + 0.5) / n), a = j * oro;
    posCons.push([r * Math.cos(a), r * Math.sin(a)]);
  }
  for (let j = n - 1; j > 0; j--) { const k = (Math.random() * (j + 1)) | 0; [posCons[j], posCons[k]] = [posCons[k], posCons[j]]; }
}

const SIN = new Set((new URLSearchParams(location.search).get("sin") || "").split(","));
function dibujarPlataforma() {
  const [g, W, H] = ajustar($("cPlataforma"));
  const s = est.sim, ahora = performance.now();
  g.clearRect(0, 0, W, H);
  const cx = W * 0.57, cy = H * 0.5, R = Math.min(W * 0.36, H * 0.37);
  const rIn = R * 0.8, arco = 2 * Math.PI / s.m;
  const ang = (i) => -Math.PI / 2 + (i + 0.5) * arco;

  // halo de fondo según la salud del ecosistema
  const halo = g.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.35);
  halo.addColorStop(0, `rgba(79,195,189,${0.07 * s.x * (0.4 + s.y)})`);
  halo.addColorStop(1, "rgba(0,0,0,0)");
  if (!SIN.has("halo")) { g.fillStyle = halo; g.fillRect(0, 0, W, H); }

  // rayos de lectura, agrupados por color y opacidad: pocas llamadas a stroke por cuadro
  const vida = est.lento ? 1500 : 420, NB = 6;
  const grupos = [[], []].map(() => Array.from({ length: NB }, () => new Path2D()));
  const vivos = [];
  for (const r of est.rayos) {
    const t = (ahora - r.t) / vida;
    if (t >= 1) continue; vivos.push(r); if (t < 0) continue;
    const [px, py] = posCons[r.j]; const x1 = cx + px * rIn, y1 = cy + py * rIn;
    const a = ang(r.i), x2 = cx + R * Math.cos(a), y2 = cy + R * Math.sin(a);
    const av = Math.min(1, t * 2.2), ini = Math.max(0, av - 0.55);     // el rayo viaja del lector al ítem
    const b = Math.min(NB - 1, Math.floor((1 - t) * NB));
    const p = grupos[r.a ? 0 : 1][b];
    p.moveTo(x1 + (x2 - x1) * ini, y1 + (y2 - y1) * ini); p.lineTo(x1 + (x2 - x1) * av, y1 + (y2 - y1) * av);
  }
  est.rayos = vivos;
  // mezcla normal: la aditiva («lighter») era la parte más cara del cuadro y en fondo oscuro casi no se distingue
  if (!SIN.has("rayos")) for (let b = 0; b < NB; b++) {
    const al = (b + 0.5) / NB;
    g.globalAlpha = al * 0.55; g.strokeStyle = COL.A; g.lineWidth = 1.1; g.stroke(grupos[0][b]);
    g.globalAlpha = al * 0.3; g.strokeStyle = "#96a5b2"; g.lineWidth = 0.7; g.stroke(grupos[1][b]);
  }

  // anillo de productores: cada segmento es el ítem que publicó en la ronda
  const maxV = Math.max(1, s.k * s.n / s.m * 2.2);
  g.lineCap = "butt";
  // brillo de los H: un trazo ancho y tenue debajo del segmento (sustituye a shadowBlur)
  g.strokeStyle = COL.H;
  for (let i = 0; i < s.m; i++) {
    if (!s.H[i] || SIN.has("brillo")) continue;
    const v = Math.min(1, est.vistasSuaves[i] / maxV), grosor = 7 + 26 * v;
    const a0 = -Math.PI / 2 + i * arco + arco * 0.05, a1 = a0 + arco * 0.9;
    g.globalAlpha = 0.06 + 0.12 * v; g.lineWidth = grosor + 14;
    g.beginPath(); g.arc(cx, cy, R + grosor / 2, a0, a1); g.stroke();
  }
  g.globalCompositeOperation = "source-over";
  for (let i = 0; i < s.m; i++) {
    const a0 = -Math.PI / 2 + i * arco + arco * 0.12, a1 = a0 + arco * 0.76;
    const v = Math.min(1, est.vistasSuaves[i] / maxV), h = s.H[i];
    const grosor = 7 + 26 * v;
    g.strokeStyle = h ? COL.H : COL.L;
    g.globalAlpha = h ? 0.6 + 0.4 * v : 0.62 + 0.38 * v;
    g.lineWidth = grosor;
    g.beginPath(); g.arc(cx, cy, R + grosor / 2, a0, a1); g.stroke();
    const f = est.flashProd[i];
    if (f > 0.05) {
      est.flashProd[i] *= 0.9;
      g.globalAlpha = f; g.strokeStyle = "#ffffff"; g.lineWidth = 2;
      g.beginPath(); g.arc(cx, cy, R + grosor + 6 + 10 * (1 - f), a0, a1); g.stroke();
    }
  }
  g.globalAlpha = 1;
  // vocación: productores cuya pasión supera el costo de esforzarse (nunca abandonan la calidad)
  if (s.pasionMedia > 0) {
    for (let i = 0; i < s.m; i++) if (s.afan[i] > s.cH) {
      const a = ang(i), rr = R - 14;
      g.drawImage(SPR.pasion, cx + rr * Math.cos(a) - SPR.pasion.width / 4, cy + rr * Math.sin(a) - SPR.pasion.height / 4, SPR.pasion.width / 2, SPR.pasion.height / 2);
    }
  }
  g.strokeStyle = "rgba(255,255,255,0.06)"; g.lineWidth = 1;
  g.beginPath(); g.arc(cx, cy, R - 24, 0, 2 * Math.PI); g.stroke();

  // consumidores: los pasivos en un solo trazado, los activos como imágenes con brillo
  const rad = Math.max(1.4, Math.min(3.2, rIn / Math.sqrt(s.n) * 0.9));
  g.fillStyle = COL.P; g.globalAlpha = 0.7;
  g.beginPath();
  for (let j = 0; j < s.n; j++) {
    if (s.A[j]) continue;
    const [px, py] = posCons[j]; const x = cx + px * rIn, y = cy + py * rIn, r = rad * (1 + 0.9 * est.flashCons[j]);
    g.moveTo(x + r, y); g.arc(x, y, r, 0, 2 * Math.PI);
  }
  g.fill(); g.globalAlpha = 1;
  const tam = SPR.A.width / 2 * (rad / 3);
  for (let j = 0; j < s.n; j++) {
    const f = est.flashCons[j]; if (f > 0.02) est.flashCons[j] *= 0.9;
    if (!s.A[j] || SIN.has("activos")) continue;
    const [px, py] = posCons[j]; const z = tam * (1 + 0.9 * f);
    g.drawImage(SPR.A, cx + px * rIn - z / 2, cy + py * rIn - z / 2, z, z);
  }
}

// ---- plano de fases (el fondo se guarda en caché: solo se redibuja si cambian parámetros o tamaño)
let corrientes = [], cacheFase = null;
function calcularCorrientes() {
  const p = { ...est.p, sigma: est.sim.sigma };
  corrientes = [];
  const N = 15;
  for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) {
    let x = (a + 0.5) / N, y = (b + 0.5) / N; const linea = [[x, y]];
    for (let k = 0; k < 40; k++) {
      const [u, v] = campo(x, y, p); const n = Math.hypot(u, v) || 1;
      x += 0.012 * u / n; y += 0.012 * v / n;
      if (x <= 0 || x >= 1 || y <= 0 || y >= 1) break;
      linea.push([x, y]);
    }
    corrientes.push(linea);
  }
  cacheFase = null;
}

let marcoFase = null;
function fondoFase(W, H, d, X, Y, lado) {
  const c = document.createElement("canvas"); c.width = Math.round(W * d); c.height = Math.round(H * d);
  const g = c.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0);
  const sig = est.sim.sigma;
  g.fillStyle = "rgba(255,255,255,0.018)"; g.fillRect(X(0), Y(1), X(sig) - X(0), lado);
  g.strokeStyle = COL.linea; g.lineWidth = 1; g.strokeRect(X(0), Y(1), lado, lado);
  g.setLineDash([2, 4]); g.strokeStyle = "rgba(242,234,215,0.35)";
  g.beginPath(); g.moveTo(X(sig), Y(0)); g.lineTo(X(sig), Y(1)); g.stroke(); g.setLineDash([]);
  g.fillStyle = COL.tenue; g.font = "11px Sans"; g.textAlign = "left";
  g.fillText("x = σ", X(sig) + 5, Y(1) + 13);
  g.strokeStyle = "rgba(242,234,215,0.10)"; g.lineWidth = 0.8;
  const p = new Path2D();
  for (const l of corrientes) {
    p.moveTo(X(l[0][0]), Y(l[0][1]));
    for (const [x, y] of l) p.lineTo(X(x), Y(y));
    if (l.length > 3) { const [xa, ya] = l[l.length - 2], [xb, yb] = l[l.length - 1];
      const an = Math.atan2(Y(yb) - Y(ya), X(xb) - X(xa));
      p.moveTo(X(xb), Y(yb)); p.lineTo(X(xb) - 4 * Math.cos(an - 0.5), Y(yb) - 4 * Math.sin(an - 0.5));
      p.moveTo(X(xb), Y(yb)); p.lineTo(X(xb) - 4 * Math.cos(an + 0.5), Y(yb) - 4 * Math.sin(an + 0.5)); }
  }
  g.stroke(p);
  g.fillStyle = COL.tenue; g.font = "11px Sans"; g.textAlign = "center";
  for (const v of [0, 0.5, 1]) g.fillText(v.toFixed(1), X(v), Y(0) + 15);
  g.textAlign = "right"; for (const v of [0, 0.5, 1]) g.fillText(v.toFixed(1), X(0) - 7, Y(v) + 4);
  g.textAlign = "left"; g.fillStyle = COL.texto; g.font = "italic 13px Serif";
  g.fillText("x", X(1) + 8, Y(0) + 4); g.fillText("y", X(0) - 4, Y(1) - 2);
  // leyenda de la predicción
  g.font = "11.5px Sans"; let ly = Y(1) + 14; const lx = X(1) + 22;
  if (lx + 90 < W) {
    g.fillStyle = COL.tenue; g.fillText("la teoría predice", lx, ly); ly += 18;
    g.fillStyle = est.pred.regimen === "colapso" ? COL.L : est.pred.regimen === "frontera" ? COL.A : COL.H;
    g.font = "600 13px Sans"; g.fillText(est.pred.regimen, lx, ly); ly += 18; g.font = "11.5px Sans";
    if (est.pred.xc !== undefined) { g.fillStyle = COL.tenue;
      g.fillText(`x* = ${est.pred.xc.toFixed(3)}`, lx, ly); ly += 15; g.fillText(`y* = ${est.pred.yc.toFixed(3)}`, lx, ly); ly += 15; }
    g.fillStyle = COL.tenue; ly += 10;
    g.fillText("● atractor", lx, ly); ly += 15; g.fillText("○ silla / inestable", lx, ly);
  }
  return c;
}

function dibujarFase() {
  const [g, W, H, d] = ajustar($("cFase"));
  g.clearRect(0, 0, W, H);
  const lado = Math.min(W - 70, H - 36), ox = 46, oy = 8;
  const X = (x) => ox + x * lado, Y = (y) => oy + (1 - y) * lado;
  marcoFase = { ox, oy, lado };
  const s = est.sim;
  if (!cacheFase || cacheFase.width !== Math.round(W * d) || cacheFase.height !== Math.round(H * d)) cacheFase = fondoFase(W, H, d, X, Y, lado);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(cacheFase, 0, 0); g.restore();

  // predicción: hasta donde han llegado los agentes, más un tramo por delante
  const tauAhora = s.tau() - s.tau(est.t0);
  g.setLineDash([5, 4]); g.lineWidth = 1.4; g.strokeStyle = "rgba(242,234,215,0.85)";
  g.beginPath();
  for (let k = 0; k < est.teo.length; k += 3) { const [t, x, y] = est.teo[k]; if (t > tauAhora + 8) break;
    if (k === 0) g.moveTo(X(x), Y(y)); else g.lineTo(X(x), Y(y)); }
  g.stroke(); g.setLineDash([]);
  const q = est.teo[Math.min(est.teo.length - 1, Math.round(tauAhora / 0.004))];
  g.strokeStyle = COL.teo; g.lineWidth = 1.3;
  g.beginPath(); g.arc(X(q[1]), Y(q[2]), 6, 0, 2 * Math.PI); g.stroke();

  // estela de los agentes: 8 grupos de opacidad, un trazado por grupo
  const h = est.hist, n = h.length, paso = Math.max(1, Math.floor(n / 1500)), NB = 8;
  const tramos = Array.from({ length: NB }, () => new Path2D());
  for (let k = paso; k < n; k += paso) {
    const b = Math.min(NB - 1, Math.floor((k / n) ** 2 * NB));
    tramos[b].moveTo(X(h[k - paso][1]), Y(h[k - paso][2])); tramos[b].lineTo(X(h[k][1]), Y(h[k][2]));
  }
  g.lineWidth = 2.2; g.lineCap = "round"; g.strokeStyle = COL.A;
  for (let b = 0; b < NB; b++) { g.globalAlpha = 0.12 + 0.88 * (b + 1) / NB; g.stroke(tramos[b]); }
  g.globalAlpha = 1;
  for (const e of est.pred.eq) {
    const col = e.nombre === "colapso" ? COL.L : e.nombre === "coexistencia" ? COL.H : e.nombre === "frontera" ? COL.A : COL.teo;
    g.lineWidth = 1.5; g.strokeStyle = col; g.fillStyle = e.tipo === "atractor" ? col : COL.fondo;
    g.beginPath(); g.arc(X(e.x), Y(e.y), 5, 0, 2 * Math.PI); g.fill(); g.stroke();
  }
  const z = SPR.yo.width / 2;
  g.drawImage(SPR.yo, X(s.x) - z / 2, Y(s.y) - z / 2, z, z);
}

function clicFase(ev) {
  if (!marcoFase) return;
  const r = $("cFase").getBoundingClientRect();
  const px = (ev.clientX - r.left) / escala, py = (ev.clientY - r.top) / escala;
  const x = (px - marcoFase.ox) / marcoFase.lado, y = 1 - (py - marcoFase.oy) / marcoFase.lado;
  if (x < 0 || x > 1 || y < 0 || y > 1) return;
  nueva(Math.min(Math.max(x, 0.01), 0.99), Math.min(Math.max(y, 0.01), 0.99));
}

// ---- series temporales
function dibujarSerie() {
  const [g, W, H] = ajustar($("cSerie"));
  g.clearRect(0, 0, W, H);
  const ox = 46, oy = 6, w = W - ox - 14, h = H - oy - 22;
  const s = est.sim, t0 = s.tau(est.t0), tAhora = s.tau() - t0;
  const ventana = Math.max(12, tAhora * 1.05);
  const X = (t) => ox + (t / ventana) * w, Y = (v) => oy + (1 - v) * h;
  g.strokeStyle = COL.linea; g.lineWidth = 1; g.strokeRect(ox, oy, w, h);
  g.fillStyle = COL.tenue; g.font = "11px Sans"; g.textAlign = "right";
  for (const v of [0, 0.5, 1]) g.fillText(v.toFixed(1), ox - 7, Y(v) + 4);
  g.textAlign = "center";
  const pasoT = ventana > 60 ? 20 : ventana > 24 ? 10 : 5;
  for (let t = 0; t <= ventana; t += pasoT) g.fillText(String(t), X(t), oy + h + 17);
  g.textAlign = "left"; g.font = "italic 12px Serif"; g.fillText("τ", ox + w - 10, oy + h + 17);
  for (const [idx, col] of [[1, COL.H], [2, COL.A]]) {
    g.strokeStyle = col; g.globalAlpha = 0.85; g.lineWidth = 1; g.setLineDash([4, 3]);
    g.beginPath();
    const pasoK = Math.max(3, Math.floor(ventana / 0.004 / 1500));
    for (let k = 0; k < est.teo.length; k += pasoK) { const q = est.teo[k]; if (q[0] > ventana) break;
      if (k === 0) g.moveTo(X(q[0]), Y(q[idx])); else g.lineTo(X(q[0]), Y(q[idx])); }
    g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
  }
  const hh = est.hist, ini = est.histInicio, paso = Math.max(1, Math.floor((hh.length - ini) / 1200));
  for (const [idx, col] of [[1, COL.H], [2, COL.A]]) {
    g.strokeStyle = col; g.lineWidth = 2.2; g.beginPath();
    for (let k = ini; k < hh.length; k += paso) { const q = hh[k]; const t = q[0] - t0;
      if (k === ini) g.moveTo(X(t), Y(q[idx])); else g.lineTo(X(t), Y(q[idx])); }
    g.stroke();
  }
  g.font = "italic 13px Serif"; g.textAlign = "left";
  const ult = hh[hh.length - 1];
  g.fillStyle = COL.H; g.fillText("x", X(ult[0] - t0) + 6, Y(ult[1]) + 4);
  g.fillStyle = COL.A; g.fillText("y", X(ult[0] - t0) + 6, Y(ult[2]) + 4);
}

// ---- balance (texto: se refresca 8 veces por segundo, no en cada cuadro)
function balance() {
  const s = est.sim, m = s.medio, p = { ...est.p, sigma: s.sigma };
  const [eH, eA] = ventajas(s.x, s.y, p);
  const f = (v) => Number.isFinite(v) ? v.toFixed(2) : "—";
  const conPasion = s.pasionMedia > 0;
  const hTotal = m.H + (conPasion ? m.pasionH : 0);
  const escala = Math.max(1e-9, ...[hTotal, m.L, m.A, m.P].filter(Number.isFinite).map(Math.abs));
  const fila = (nom, v, col, extra = "") => `<div class="fila"><span class="nom">${nom}</span>
    <span class="barra"><i style="width:${Number.isFinite(v) ? Math.max(0, 100 * v / escala) : 0}%;background:${col}"></i>${extra}</span><span class="val">${f(v)}</span></div>`;
  const ventaja = (dm, de, sube, baja) => {
    if (!Number.isFinite(dm)) return `<div class="ventaja"><small>una de las dos estrategias ya no existe: no hay a quién imitar</small></div>`;
    const flecha = dm > 0 ? "↑" : "↓";
    return `<div class="ventaja">ventaja ${dm >= 0 ? "+" : ""}${f(dm)} ${flecha} <small>${dm > 0 ? sube : baja} · teoría ${de >= 0 ? "+" : ""}${f(de)}</small></div>`;
  };
  const extraPasion = conPasion && Number.isFinite(m.H)
    ? `<b style="left:${Math.max(0, 100 * m.H / escala)}%;width:${100 * m.pasionH / escala}%"></b>` : "";
  $("balance").innerHTML =
    `<div class="bloque">${fila("se esfuerza (H)" + (conPasion ? " <span class='pas'>+ pasión</span>" : ""), conPasion ? hTotal : m.H, COL.H, extraPasion)}${fila("no se esfuerza (L)", m.L, COL.L)}
      ${ventaja(m.H - m.L, eH, "más productores se esfuerzan", "menos productores se esfuerzan")}${conPasion ? `<small class="nota-pas">ventaja sin contar la pasión, que cada productor suma a su manera</small>` : ""}</div>
     <div class="bloque">${fila("busca calidad (A)", m.A, COL.A)}${fila("lee al azar (P)", m.P, COL.P)}
      ${ventaja(m.A - m.P, eA, "más consumidores buscan", "menos consumidores buscan")}</div>`;
}

// ---- relato
function relato() {
  const s = est.sim, pr = est.pred;
  const col = { colapso: COL.L, coexistencia: COL.H, frontera: COL.A }[pr.regimen];
  const tauAhora = s.tau() - s.tau(est.t0);
  const q = est.teo[Math.min(est.teo.length - 1, Math.round(tauAhora / 0.004))];
  const dist = Math.hypot(s.x - q[1], s.y - q[2]);
  let dCurva = Infinity, tCurva = 0;
  for (let k = 0; k < est.teo.length; k += 5) { const e = est.teo[k]; if (e[0] > tauAhora + 6) break;
    const d = Math.hypot(s.x - e[1], s.y - e[2]); if (d < dCurva) { dCurva = d; tCurva = e[0]; } }
  let v, t;
  const vocacion = s.pasionMedia > 0 ? Array.prototype.filter.call(s.afan, (a) => a > s.cH).length : 0;
  if (s.y === 0 && s.x > 0 && s.x < 1 && vocacion > 0) { v = "solo quedan vocaciones"; t = `Nadie busca calidad, pero ${Math.round(100 * s.x)} % de los productores sigue creándola por pasión: la teoría predice que desaparecerían todos.`; }
  else if (s.y === 0 && s.x > 0 && s.x < 1) { v = "sin búsqueda"; t = "Ya no queda ningún consumidor activo: esforzarse no tiene premio y la calidad se apaga sin remedio."; }
  else if (s.x === 0 && s.y === 0) { v = "colapso"; t = pr.regimen === "colapso" ? "Colapso, como predijo la teoría: nadie produce calidad y nadie la busca. No hay a quién imitar para salir." : "Colapso, aunque la teoría predecía supervivencia: el azar de una población finita la llevó a una trampa de la que no se sale."; }
  else if (s.x === 1 && s.y === 0) { v = "trampa"; t = "Todos se esfuerzan y nadie busca: queda atascado, porque ya no existe ningún productor de bajo esfuerzo al que imitar. La teoría no tiene esta trampa."; }
  else if (s.x === 0) { v = "sin calidad"; t = "Ya no queda ningún productor de calidad: buscarla no sirve de nada."; }
  else if (est.pred.xc !== undefined && Math.hypot(q[1] - est.pred.xc, q[2] - est.pred.yc) < 0.02) {
    const h = est.hist, desde = s.tau() - 3; let sx = 0, sy = 0, c = 0, amp = 0;
    for (let k = h.length - 1; k >= 0 && h[k][0] >= desde; k--) { sx += h[k][1]; sy += h[k][2]; c++; }
    const mx = sx / c, my = sy / c;
    for (let k = h.length - 1; k >= 0 && h[k][0] >= desde; k--) amp = Math.max(amp, Math.abs(h[k][2] - my));
    const d = Math.hypot(mx - est.pred.xc, my - est.pred.yc);
    v = d < 0.04 ? "la teoría acierta en promedio" : "se desvían";
    t = `La teoría dice que ya deberían estar quietos en (${est.pred.xc.toFixed(2)}, ${est.pred.yc.toFixed(2)}). Los agentes oscilan alrededor (±${amp.toFixed(2)} en y) con media (${mx.toFixed(2)}, ${my.toFixed(2)}).`;
  }
  else if (dist < 0.05) { v = "la teoría acierta"; t = `Los agentes están donde predicen las ecuaciones: a ${dist.toFixed(3)} del punto que marca la teoría.`; }
  else if (dCurva < 0.04) { const r = tauAhora - tCurva; v = "mismo camino, otro ritmo";
    t = `Siguen la curva predicha (a ${dCurva.toFixed(3)} de ella) pero van ${Math.abs(r).toFixed(1)} unidades de tiempo ${r > 0 ? "por detrás" : "por delante"}.`; }
  else { v = "se desvían"; t = `Los agentes se apartan de la curva predicha (a ${dCurva.toFixed(2)} de ella).`; }
  $("veredicto").textContent = v; $("veredicto").style.color = col;
  $("texto").textContent = t;
  $("cx").textContent = (100 * s.x).toFixed(0) + " %";
  $("cy").textContent = (100 * s.y).toFixed(1) + " %";
  $("pobl").textContent = `${s.m} productores en el anillo y ${s.n} consumidores en el centro; cada consumidor lee ${s.k} de los ${s.m} ítems (σ = ${s.sigma.toFixed(2)})` +
    (vocacion ? `. Puntos claros junto al anillo: ${vocacion} productores con más pasión que costo` : "");
  $("leyPasion").hidden = !(s.pasionMedia > 0);
  $("cronda").textContent = s.ronda.toLocaleString("es");
  $("ctau").textContent = tauAhora.toFixed(1);
}

// ------------------------------------------------------------------ interfaz
function pintarEscenarios() {
  const nav = $("escenarios"); nav.innerHTML = "";
  for (const [clave, e] of Object.entries(ESCENARIOS)) {
    const b = document.createElement("button"); b.textContent = e.nombre;
    b.className = clave === est.clave ? "on" : ""; b.onclick = () => cargar(clave); nav.appendChild(b);
  }
}

function construirControles() {
  const c = $("controles"); c.innerHTML = "";
  const grupo = (t) => { const h = document.createElement("h4"); h.textContent = t; c.appendChild(h); };
  const ctrl = (nom, min, max, paso, valor, fmt, alCambiar, ayuda) => {
    const d = document.createElement("div"); d.className = "ctrl";
    d.innerHTML = `<span class="nom">${nom}</span><span class="v"></span><input type="range" min="${min}" max="${max}" step="${paso}" value="${valor}">${ayuda ? `<span class="ayuda">${ayuda}</span>` : ""}`;
    const inp = d.querySelector("input"), v = d.querySelector(".v");
    v.textContent = fmt(+inp.value);
    inp.oninput = () => { v.textContent = fmt(+inp.value); alCambiar(+inp.value); };
    inp.onchange = () => pintarFactores();
    c.appendChild(d);
  };
  const cambiarP = (k) => (v) => { est.p[k] = v; ajustarSim(mapear(est.sim)); predecir(true); enviarRitmo(); };
  grupo("Lo que mide la teoría");
  ctrl("Atención <em>σ</em>", 0.05, 0.95, 0.05, est.p.sigma, (v) => v.toFixed(2), (v) => { est.p.sigma = v; reconstruirConservando(); }, "fracción de ítems que puede leer cada consumidor");
  ctrl("Costo de buscar <em>c<sub>A</sub></em>", 0, 20, 0.25, est.p.cA, (v) => v.toFixed(2), cambiarP("cA"), "lo que paga un consumidor por distinguir la calidad");
  ctrl("Costo de esforzarse <em>c<sub>H</sub></em>", 0.25, 10, 0.25, est.p.cH, (v) => v.toFixed(2), cambiarP("cH"));
  ctrl("Ingreso total por vistas <em>R = rn</em>", 0.5, 120, 0.1, est.p.R, (v) => v.toFixed(1), cambiarP("R"));
  ctrl("Brecha de calidad <em>M = mΔ</em>", 2, 100, 1, est.p.M, (v) => v.toFixed(0), cambiarP("M"));
  grupo("Intensidad de cada factor");
  const POB = [30, 60, 120, 240, 480, 960];
  ctrl("Población", 0, 5, 1, POB.indexOf(est.pob.productores), (v) => `${POB[v]} · ${5 * POB[v]}`,
    (v) => { est.pob = { productores: POB[v], consumidores: 5 * POB[v] }; reconstruirConservando(); },
    "productores · consumidores. Con pocos agentes el azar decide más; la teoría supone infinitos.");
  ctrl("Memoria de ganancias", 1, 30, 1, est.realismo.memoria, (v) => v === 1 ? "solo la última ronda" : `${v} rondas`, (v) => { est.realismo.memoria = v; ajustarSim({ alfa: 1 / v }); },
    "los agentes juzgan por lo ganado en las últimas rondas: la información llega con retraso");
  ctrl("Errores al distinguir", 0, 0.5, 0.05, est.realismo.ruidoPercepcion, (v) => `${Math.round(100 * v)} %`, (v) => { est.realismo.ruidoPercepcion = v; ajustarSim({ ruido: v }); },
    "probabilidad de que un consumidor activo no reconozca la calidad y lea al azar");
  ctrl("Agentes que revisan por ronda", 0.1, 1, 0.05, est.realismo.revision, (v) => `${Math.round(100 * v)} %`, (v) => { est.realismo.revision = v; reconstruirConservando(); },
    "si todos deciden a la vez, el sistema da saltos discretos y las oscilaciones se amortiguan más despacio que en las EDO");
  ctrl("Pasión por crear", 0, 2, 0.05, est.realismo.pasion, (v) => v === 0 ? "ninguna" : `media ${v.toFixed(2)} · c<sub>H</sub>`.replace(/<[^>]+>/g, ""), (v) => { est.realismo.pasion = v; reconstruirConservando(); },
    "satisfacción de crear con calidad aunque nadie lo vea. Quien la tiene mayor que c_H nunca abandona: son una fracción e^(−1/media) de los productores.");
}

// Reescala r y Δ del modelo de agentes para que coincidan con R y M actuales.
function mapear(sim) {
  const { R, M, cA, cH } = est.p;
  const r = R / sim.n, delta = M / sim.m;
  return { R, Mq: M, cA, cH, r, delta, bH: delta, bL: 0,
           escala: Math.max(R + cH, sim.k * delta + cA) };
}

function reconstruirConservando() {
  const s = est.sim, h = est.hist; nueva(s.x, s.y, true);
}

function teclado(e) {
  if (e.target.tagName === "INPUT") return;
  if (e.code === "Space") { e.preventDefault(); alternar(); }
  else if (e.key === "r" || e.key === "R") { const e2 = ESCENARIOS[est.clave]; nueva(e2.x0, e2.y0); }
  else if (e.key === "l" || e.key === "L") lento();
  else if (e.key === "p" || e.key === "P") $("ajustes").hidden = !$("ajustes").hidden;
  else if (e.key === "ArrowRight") unaRonda();
  else if (e.key === "0") $("factores").querySelector(".fac-quitar").click();
  else { const i = "1234".indexOf(e.key); if (i >= 0) cargar(Object.keys(ESCENARIOS)[i]);
    const k = "56789".indexOf(e.key); if (k >= 0) alternarFactor(FACTORES[k]); }
}
function alternar() { est.corriendo = !est.corriendo; $("bPlay").textContent = est.corriendo ? "pausar" : "reproducir"; enviarRitmo(); }
function lento() { est.lento = !est.lento; $("bLento").classList.toggle("on", est.lento); enviarRitmo(); }

// ------------------------------------------------------------------ arranque
$("bPlay").onclick = alternar;
$("bPaso").onclick = () => unaRonda();
$("bLento").onclick = lento;
$("bReset").onclick = () => { const e = ESCENARIOS[est.clave]; nueva(e.x0, e.y0); };
$("bAjustes").onclick = () => { $("ajustes").hidden = !$("ajustes").hidden; };
$("bCerrar").onclick = () => { $("ajustes").hidden = true; };
$("vel").oninput = (e) => { est.vel = e.target.value / 100; enviarRitmo(); };
$("cFase").addEventListener("click", clicFase);
addEventListener("keydown", teclado);

// ---- vistas
let enInforme = false;
function mostrarVista(informe) {
  enInforme = informe;
  $("informe").hidden = !informe; $("lienzo").hidden = informe; $("factores").hidden = informe;
  $("vSim").classList.toggle("on", !informe); $("vInf").classList.toggle("on", informe);
  document.body.classList.toggle("ver-informe", informe);
  $("relato").style.visibility = informe ? "hidden" : "visible";
}
$("vSim").onclick = () => mostrarVista(false);
$("vInf").onclick = () => mostrarVista(true);
function verEnSimulacion(clave, ajustes, x0, y0) {
  est.clave = clave;
  const e = ESCENARIOS[clave];
  est.p = { R: e.R, M: e.M, sigma: e.sigma, cA: e.cA, cH: e.cH };
  est.pob = { productores: ajustes.productores ?? 240, consumidores: ajustes.consumidores ?? 1200 };
  est.realismo = { memoria: ajustes.memoria ?? 1, ruidoPercepcion: ajustes.ruidoPercepcion ?? 0,
                   revision: ajustes.revision ?? BASE_REALISMO.revision, pasion: ajustes.pasion ?? 0 };
  nueva(x0 ?? e.x0, y0 ?? e.y0);
  pintarEscenarios(); construirControles(); pintarFactores();
  if (!est.corriendo) alternar();
  mostrarVista(false);
}
montarInforme($("informe"), window.DATOS_DISCREPANCIAS, verEnSimulacion);
encajar();

const params = new URLSearchParams(location.search);
if (params.has("informe")) { mostrarVista(true); if (params.has("bajar")) $("informe").scrollTop = +params.get("bajar"); }
cargar(params.get("escenario") || "coexistencia");
for (const id of (params.get("factores") || "").split(",").filter(Boolean)) { const f = FACTORES.find((q) => q.id === id); if (f && !f.activo()) alternarFactor(f); }
if (params.has("rondas")) trabajador.postMessage({ tipo: "avanzar", n: +params.get("rondas") });
if (params.has("lento")) lento();
if (params.has("pausa")) alternar();
if (params.has("ajustes")) $("ajustes").hidden = false;

// ---- bucle de dibujo, con medidor de cuadros por segundo (?fps)
let antes = performance.now(), ultimoTexto = 0, cuadros = 0, tFps = antes;
const verFps = params.has("fps"), perfil = { plat: 0, fase: 0, serie: 0 };
function cuadro(ahora) {
  const dt = Math.min(0.1, (ahora - antes) / 1000); antes = ahora;
  const T1 = performance.now();
  if (!enInforme) {
    const forzar = (id) => { if (verFps) $(id).getContext("2d").getImageData(0, 0, 1, 1); };
    dibujarPlataforma(); forzar("cPlataforma"); const T2 = performance.now(); dibujarFase(); forzar("cFase"); const T3 = performance.now(); dibujarSerie(); forzar("cSerie");
    if (verFps) { perfil.plat += T2 - T1; perfil.fase += T3 - T2; perfil.serie += performance.now() - T3; }
    if (ahora - ultimoTexto > 120) { balance(); relato(); ultimoTexto = ahora; }
  }
  cuadros++;
  if (ahora - tFps > 1000) { window.__fps = cuadros * 1000 / (ahora - tFps);
    if (verFps) { console.log("fps", window.__fps.toFixed(1), Object.entries(perfil).map(([k, v]) => `${k} ${(v / cuadros).toFixed(1)}ms`).join(" ")); for (const k in perfil) perfil[k] = 0; }
    cuadros = 0; tFps = ahora; }
  window.__listo = true;
  requestAnimationFrame(cuadro);
}
document.fonts.ready.then(() => requestAnimationFrame(cuadro));
