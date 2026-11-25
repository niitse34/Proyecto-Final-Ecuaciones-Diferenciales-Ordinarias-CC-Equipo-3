// Predicción de la teoría: el sistema replicador del informe, ecuaciones (1)–(2).
// Se integra en coordenadas logit (u = ln x/(1−x), v = ln y/(1−y)) con RK4.

export function ventajas(x, y, p) {
  const { R, M, sigma: s, cA, cH } = p;
  if (x >= s) return [-cH + R * s * y / Math.max(x, 1e-12), -cA + M * s * (1 - x)];
  return [-cH + R * (1 - s) * y / (1 - x), -cA + M * (1 - s) * x];
}

export function campo(x, y, p) {
  const [dH, dA] = ventajas(x, y, p);
  return [x * (1 - x) * dH, y * (1 - y) * dA];
}

const sig = (u) => 1 / (1 + Math.exp(-u));
const logit = (q) => Math.log(q / (1 - q));

// Trayectoria desde (x0, y0) hasta τ = T con paso dt; devuelve [[τ, x, y], …].
export function trayectoria(x0, y0, p, T, dt = 0.01) {
  const lim = (q) => Math.min(Math.max(q, 1e-9), 1 - 1e-9);
  let u = logit(lim(x0)), v = logit(lim(y0));
  const f = (u, v) => ventajas(sig(u), sig(v), p);
  const out = [[0, sig(u), sig(v)]];
  const N = Math.ceil(T / dt);
  for (let i = 1; i <= N; i++) {
    const [a1, b1] = f(u, v);
    const [a2, b2] = f(u + dt / 2 * a1, v + dt / 2 * b1);
    const [a3, b3] = f(u + dt / 2 * a2, v + dt / 2 * b2);
    const [a4, b4] = f(u + dt * a3, v + dt * b3);
    u += dt / 6 * (a1 + 2 * a2 + 2 * a3 + a4);
    v += dt / 6 * (b1 + 2 * b2 + 2 * b3 + b4);
    u = Math.max(Math.min(u, 60), -60); v = Math.max(Math.min(v, 60), -60);
    out.push([i * dt, sig(u), sig(v)]);
  }
  return out;
}

// Qué régimen predice la teoría, dónde están sus equilibrios y de qué tipo son.
export function prediccion(p) {
  const { R, M, sigma: s, cA, cH } = p;
  const cAstar = M * s * (1 - s);
  const A = cA / (M * s), B = R * s / cH;
  const A2 = cA / (M * (1 - s)), B2 = R * (1 - s) / cH;
  const eq = [{ x: 0, y: 0, tipo: "atractor", nombre: "colapso" }];
  let regimen;
  if (cA >= cAstar) regimen = "colapso";
  else if (A + B > 1) regimen = "coexistencia";
  else regimen = "frontera";
  if (regimen === "coexistencia") eq.push({ x: 1 - A, y: (1 - A) / B, tipo: "atractor", nombre: "coexistencia" });
  if (B > s && B < 1) eq.push({ x: B, y: 1, tipo: A + B < 1 ? "atractor" : "silla", nombre: "frontera" });
  if (A2 > 0 && A2 < s && (1 - A2) / B2 < 1 && (1 - A2) / B2 > 0) eq.push({ x: A2, y: (1 - A2) / B2, tipo: "silla", nombre: "separatriz" });
  if (B2 > 1 - s && B2 < 1) eq.push({ x: 1 - B2, y: 1, tipo: "silla", nombre: "masa crítica" });
  const res = { regimen, cAstar, A, B, eq };
  const atr = eq.find((e) => e.nombre === regimen);
  if (atr) { res.xc = atr.x; res.yc = atr.y; }
  return res;
}
