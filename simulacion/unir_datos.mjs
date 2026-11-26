// Une los datos/parcial-*.json (mediciones en paralelo) en datos/discrepancias.json.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
const orden = ["poblacion", "memoria", "articulo", "revision", "percepcion", "oscilacion", "borde", "pasion"];
const out = { factores: [] };
for (const f of readdirSync(new URL("datos/", import.meta.url)).filter((f) => f.startsWith("parcial-"))) {
  const d = JSON.parse(readFileSync(new URL("datos/" + f, import.meta.url), "utf8"));
  out.semillas = d.semillas; out.fecha = d.fecha;
  out.factores.push(...d.factores); if (d.referencias) out.referencias = d.referencias;
}
out.factores.sort((a, b) => orden.indexOf(a.id) - orden.indexOf(b.id));
writeFileSync(new URL("datos/discrepancias.json", import.meta.url), JSON.stringify(out, null, 1));
console.log("factores:", out.factores.map((f) => f.id).join(", "), "· referencias:", !!out.referencias);
