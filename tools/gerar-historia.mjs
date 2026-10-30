// Converte HISTORIA.md em historia-dados.js (lido pela página da história).
// Uso: node tools/gerar-historia.mjs
// Regras: "## Seção" abre uma seção; "### Frame N" abre um frame; linhas com ">" são
// indicações de palco (foto, tutorial, jogo); as demais linhas são o texto do frame.
// A seção "Título" do arquivo é só o exemplo de formato e é ignorada.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const linhas = readFileSync(join(raiz, "HISTORIA.md"), "utf8").split(/\r?\n/);

const slug = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const secoes = [];
let secao = null, frame = null;

for (const bruta of linhas) {
  const linha = bruta.trim();
  if (linha.startsWith("## ")) {
    const titulo = linha.slice(3).trim();
    secao = slug(titulo) === "titulo" ? null : { id: slug(titulo), titulo, frames: [] };
    if (secao) secoes.push(secao);
    frame = null;
  } else if (secao && /^### Frame\s+\d+/i.test(linha)) {
    frame = { num: Number(linha.match(/\d+/)[0]), texto: "", notas: [] };
    secao.frames.push(frame);
  } else if (frame && linha.startsWith(">")) {
    frame.notas.push(linha.replace(/^>\s*/, ""));
  } else if (frame && linha && linha !== "---") {
    frame.texto += (frame.texto ? " " : "") + linha;
  }
}

writeFileSync(
  join(raiz, "historia-dados.js"),
  "// GERADO por tools/gerar-historia.mjs a partir de HISTORIA.md. Não edite à mão.\nwindow.HISTORIA_SECOES = " + JSON.stringify(secoes, null, 1) + ";\n",
);
console.log(secoes.map((s) => `${s.titulo}: ${s.frames.length} frames`).join("\n"));
