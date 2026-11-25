// Empaqueta la simulación en un único HTML autónomo (dist/simulacion.html):
// sin servidor, sin internet, con las fuentes incrustadas. Se abre con doble clic.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const leer = (f) => readFileSync(new URL(f, import.meta.url), "utf8");
const sinModulos = (src) => src.replace(/^import .*$/gm, "").replace(/^export /gm, "");
const js = ["js/modelo.js", "js/teoria.js", "js/informe.js", "js/app.js"].map((f) => `// ---- ${f}\n${sinModulos(leer(f))}`).join("\n");
let css = leer("css/estilo.css").replace(/url\('\.\.\/fuentes\/([^']+)'\)/g, (_, f) =>
  `url(data:font/ttf;base64,${readFileSync(new URL("fuentes/" + f, import.meta.url)).toString("base64")})`);
let html = leer("index.html")
  .replace('<link rel="stylesheet" href="css/estilo.css">', `<style>\n${css}\n</style>`)
  .replace('<script type="module" src="js/app.js"></script>', `<script>\n(() => {\n${js}\n})();\n</script>`);
const trabajador = sinModulos(leer("js/modelo.js")) + "\n" + sinModulos(leer("js/trabajador.js"));
let datos = "null";
try { datos = readFileSync(new URL("datos/discrepancias.json", import.meta.url), "utf8"); } catch { console.warn("aviso: sin datos/discrepancias.json"); }
html = html.replace("<script>\n(() => {", `<script>window.DATOS_DISCREPANCIAS = ${datos};\nwindow.FUENTE_TRABAJADOR = ${JSON.stringify(trabajador).replace(/<\/script/g, "<\\/script")};</script>\n<script>\n(() => {`);
mkdirSync(new URL("dist/", import.meta.url), { recursive: true });
writeFileSync(new URL("dist/simulacion.html", import.meta.url), html);
console.log("dist/simulacion.html", (html.length / 1024).toFixed(0), "KB");
