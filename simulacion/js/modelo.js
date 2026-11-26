// Modelo de agentes de la economía de la atención.
//
// NO integra las ecuaciones del informe. Cada ronda ocurre esto, agente por agente:
//   1. Cada productor publica un ítem: de calidad b_H si se esfuerza (H, paga c_H) o b_L si no (L).
//   2. Cada consumidor tiene k = round(σ·m) lecturas por ronda.
//      - Pasivo (P): elige k ítems al azar entre los m publicados.
//      - Activo (A): paga c_A, distingue la calidad y lee primero los ítems H
//        (si hay más de k, elige k de ellos al azar; si hay menos, rellena con L al azar).
//   3. Cada vista paga r al productor. Cada lectura da al consumidor la calidad del ítem.
//   4. Imitación: cada agente mira a otro agente al azar de su misma población y, si
//      este ganó más en ESTA ronda, copia su estrategia con probabilidad proporcional
//      a la diferencia de ganancias (regla de imitación proporcional de Schlag, 1998).
//
// Los pagos son los realmente obtenidos en la ronda (con su azar), no los esperados.
// Las poblaciones son finitas y el ruido es real: un agente que desaparece no vuelve.

export const ESCENARIOS = {
  // R = r·n y M = m·Δ son lo único que importa en la teoría; las poblaciones simuladas
  // pueden ser de cualquier tamaño reescalando r y Δ para conservar R y M.
  colapso:      { nombre: "Colapso",      R: 100, M: 20, sigma: 0.5, cA: 10, cH: 2, x0: 0.6, y0: 0.4 },
  frontera:     { nombre: "Frontera",     R: 1.2, M: 10, sigma: 0.5, cA: 1,  cH: 1, x0: 0.8, y0: 0.9 },
  coexistencia: { nombre: "Coexistencia", R: 9.6, M: 60, sigma: 0.5, cA: 8,  cH: 2, x0: 0.45, y0: 0.6 },
  articulo:     { nombre: "Coexistencia del artículo", R: 100, M: 60, sigma: 0.5, cA: 2, cH: 2, x0: 0.9, y0: 0.05 },
};

// Generador pseudoaleatorio con semilla (mulberry32): la misma semilla repite la función.
export function rng(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Plataforma {
  constructor({ R, M, sigma, cA, cH, x0, y0, productores = 120, consumidores = 600, semilla = 1,
                ruidoPercepcion = 0, exploracion = 0, memoria = 1, revision = 1, pasion = 0 }) {
    this.m = productores; this.n = consumidores;
    this.R = R; this.Mq = M; this.cA = cA; this.cH = cH;
    this.k = Math.max(1, Math.min(this.m, Math.round(sigma * this.m)));
    this.sigma = this.k / this.m;                // σ efectivo (lecturas enteras)
    this.r = R / this.n;                          // ingreso por vista, reescalado
    this.delta = M / this.m;                      // brecha de calidad, reescalada
    this.bL = 0; this.bH = this.delta;            // solo importa la diferencia
    this.ruido = ruidoPercepcion; this.explora = exploracion;
    // Memoria: cada agente juzga por su ganancia media de las últimas ~'memoria' rondas.
    this.alfa = 1 / Math.max(1, memoria);
    // Fracción de agentes que se plantea cambiar de estrategia en cada ronda.
    this.revision = revision;
    // Pasión por crear: cada productor disfruta crear con calidad, con independencia de las vistas.
    // Es un rasgo personal (exponencial de media 'pasion'): unos tienen mucha, la mayoría poca.
    this.pasionMedia = pasion;
    this.afan = new Float64Array(this.m);
    this.azar = rng(semilla);
    this.afanSemilla = rng(semilla * 7 + 3);   // generador propio: no altera el resto del azar
    if (pasion > 0) for (let i = 0; i < this.m; i++) this.afan[i] = -pasion * Math.log(1 - this.afanSemilla());
    // Normalizador de la imitación: cota de cualquier diferencia de pagos posible en una ronda.
    this.escala = Math.max(this.R + this.cH, this.k * this.delta + this.cA);
    this.H = new Uint8Array(this.m);              // 1 = alto esfuerzo
    this.A = new Uint8Array(this.n);              // 1 = búsqueda activa
    this.sembrar(x0, y0);
    this.vistas = new Float64Array(this.m);
    this.pagoProd = new Float64Array(this.m);
    this.pagoCons = new Float64Array(this.n);
    this.memProd = null; this.memCons = null;
    this.idx = new Int32Array(this.m);
    this.todos = new Int32Array(this.m); for (let i = 0; i < this.m; i++) this.todos[i] = i;
    this.lecturas = new Int32Array(this.n * this.k);  // qué leyó cada consumidor en la última ronda
    this.cambiosProd = new Int8Array(this.m);     // +1 pasó a H, −1 pasó a L (última ronda)
    this.cambiosCons = new Int8Array(this.n);
    this.ronda = 0;
    this.historia = [];
    this.medio = { H: NaN, L: NaN, A: NaN, P: NaN };
    this.medir();
  }

  sembrar(x0, y0) {
    const fijar = (arr, frac) => {
      const N = arr.length, h = Math.round(frac * N);
      arr.fill(0);
      const p = this.permutacion(N);
      for (let i = 0; i < h; i++) arr[p[i]] = 1;
    };
    fijar(this.H, x0); fijar(this.A, y0);
  }

  permutacion(N) {
    const p = new Int32Array(N);
    for (let i = 0; i < N; i++) p[i] = i;
    for (let i = N - 1; i > 0; i--) { const j = (this.azar() * (i + 1)) | 0; const t = p[i]; p[i] = p[j]; p[j] = t; }
    return p;
  }

  // Muestreo sin reemplazo: deja en arr[ini, ini+c) c elementos elegidos al azar de arr[ini, fin).
  // Es un Fisher–Yates parcial; no rompe la partición de arr fuera de [ini, fin).
  elegir(arr, ini, fin, c) {
    for (let i = 0; i < c; i++) {
      const j = ini + i + ((this.azar() * (fin - ini - i)) | 0);
      const t = arr[ini + i]; arr[ini + i] = arr[j]; arr[j] = t;
    }
  }

  paso() {
    const { m, n, k, azar } = this;
    const orden = this.idx, todos = this.todos;
    this.vistas.fill(0);
    // Lo que ve un consumidor activo: los ítems de calidad primero.
    let h = 0;
    for (let i = 0; i < m; i++) if (this.H[i]) orden[h++] = i;
    for (let i = 0, t = h; i < m; i++) if (!this.H[i]) orden[t++] = i;

    for (let j = 0; j < n; j++) {
      let lista, calidad = 0;
      const distingue = this.A[j] && !(this.ruido > 0 && azar() < this.ruido);
      if (distingue) {
        if (h >= k) this.elegir(orden, 0, h, k);         // sobra calidad: k ítems H al azar
        else this.elegir(orden, h, m, k - h);            // falta: todos los H y el resto L al azar
        lista = orden;
      } else {
        this.elegir(todos, 0, m, k);                     // lectura al azar
        lista = todos;
      }
      const base = j * k;
      for (let s = 0; s < k; s++) {
        const it = lista[s];
        this.lecturas[base + s] = it;
        this.vistas[it] += 1;
        calidad += this.H[it] ? this.bH : this.bL;
      }
      this.pagoCons[j] = calidad - (this.A[j] ? this.cA : 0);
    }
    for (let i = 0; i < m; i++) this.pagoProd[i] = this.r * this.vistas[i] - (this.H[i] ? this.cH : 0);

    this.medirPagos();
    // Memoria de ganancias (media móvil exponencial). En la primera ronda se inicializa.
    if (!this.memProd) { this.memProd = Float64Array.from(this.pagoProd); this.memCons = Float64Array.from(this.pagoCons); }
    else {
      const a = this.alfa;
      for (let i = 0; i < m; i++) this.memProd[i] += a * (this.pagoProd[i] - this.memProd[i]);
      for (let j = 0; j < n; j++) this.memCons[j] += a * (this.pagoCons[j] - this.memCons[j]);
    }
    // Imitación simultánea según lo ganado recientemente.
    this.imitar(this.H, this.memProd, this.cambiosProd, this.pasionMedia > 0 ? this.afan : null);
    this.imitar(this.A, this.memCons, this.cambiosCons);
    this.ronda++;
    this.medir();
  }

  // 'propio' (opcional): satisfacción personal de usar la estrategia 1. Al compararse con otro,
  // cada agente suma SU propia satisfacción, no la del otro: copia la estrategia, no el gusto.
  imitar(estr, pago, cambios, propio = null) {
    const N = estr.length, azar = this.azar, esc = this.escala;
    const nueva = new Uint8Array(estr);
    const copia = new Int32Array(N).fill(-1);
    cambios.fill(0);
    for (let i = 0; i < N; i++) {
      if (this.revision < 1 && azar() >= this.revision) continue;
      let j = (azar() * (N - 1)) | 0; if (j >= i) j++;
      let d = pago[j] - pago[i];
      if (propio) d += propio[i] * (estr[j] - estr[i]);
      if (estr[j] !== estr[i] && d > 0 && azar() < Math.min(1, d / esc)) { nueva[i] = estr[j]; copia[i] = j; }
      if (this.explora > 0 && azar() < this.explora) nueva[i] = 1 - nueva[i];
      if (nueva[i] !== estr[i]) cambios[i] = nueva[i] ? 1 : -1;
    }
    // Quien cambia de estrategia adopta también la expectativa de ganancia de su modelo.
    const antes = Float64Array.from(pago);
    for (let i = 0; i < N; i++) if (copia[i] >= 0) pago[i] = antes[copia[i]];
    estr.set(nueva);
  }

  // Ganancia media por estrategia en la ronda, medida antes de que nadie cambie.
  medirPagos() {
    let h = 0, a = 0, pH = 0, pL = 0, pA = 0, pP = 0;
    let pas = 0;
    for (let i = 0; i < this.m; i++) if (this.H[i]) { h++; pH += this.pagoProd[i]; pas += this.afan[i]; } else pL += this.pagoProd[i];
    for (let j = 0; j < this.n; j++) if (this.A[j]) { a++; pA += this.pagoCons[j]; } else pP += this.pagoCons[j];
    this.medio = {
      H: h ? pH / h : NaN, L: this.m - h ? pL / (this.m - h) : NaN, pasionH: h ? pas / h : 0,
      A: a ? pA / a : NaN, P: this.n - a ? pP / (this.n - a) : NaN,
    };
  }

  medir() {
    let h = 0, a = 0;
    for (let i = 0; i < this.m; i++) h += this.H[i];
    for (let j = 0; j < this.n; j++) a += this.A[j];
    this.x = h / this.m; this.y = a / this.n;
    this.historia.push([this.ronda, this.x, this.y]);
  }

  // Tiempo de la teoría equivalente a 'rondas': cada ronda avanza 1/escala unidades de τ.
  tau(rondas = this.ronda) { return rondas * this.revision / this.escala; }
}
