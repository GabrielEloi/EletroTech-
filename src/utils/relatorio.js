function escaparHtml(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, (caractere) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[caractere]);
}

export function abrirJanelaRelatorio() {
  const janela = window.open("", "_blank");
  if (!janela) {
    window.alert("Permita janelas pop-up para abrir o relatório.");
  }
  return janela;
}

export function mostrarRelatorio(janela, titulo, dados) {
  const registros = Array.isArray(dados) ? dados : [dados];
  const linhas = registros.flatMap((registro) =>
    Object.entries(registro || {}).map(([chave, valor]) =>
      `<tr><th>${escaparHtml(chave)}</th><td>${escaparHtml(
        typeof valor === "object" ? JSON.stringify(valor) : valor
      )}</td></tr>`
    )
  );
  janela.document.open();
  janela.document.write(
    `<!doctype html><html lang="pt-br"><head><meta charset="utf-8"><title>${escaparHtml(titulo)}</title>` +
      `<style>body{font:14px Arial,sans-serif;margin:32px;color:#222}h1{font-size:22px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #bbb;padding:8px;text-align:left}th{width:30%;background:#f2f2f2}button{margin:0 0 16px;padding:8px 14px}@media print{button{display:none}}</style>` +
      `</head><body><h1>${escaparHtml(titulo)}</h1><button onclick="window.print()">Imprimir / Salvar PDF</button><table>${linhas}</table></body></html>`
  );
  janela.document.close();
}
