// Funções utilitárias (sem regra de negócio)
const Utils = {
  // "2024-04-02" -> "02/04/2024" (sem usar Date, evita erro de fuso horário); vazio/inválido -> "—"
  formatarData(iso) {
    if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return "—";
    const [a, m, d] = iso.slice(0, 10).split("-");
    return `${d}/${m}/${a}`;
  },
  // minúsculas e sem acentos — usado só para comparar textos na busca
  normalizar(texto) {
    return String(texto ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  },
  // Dois ISO -> "dd/mm/aaaa → dd/mm/aaaa"
  formatarPeriodo(inicio, fim) {
    const i = this.formatarData(inicio), f = this.formatarData(fim);
    return i === "—" && f === "—" ? "—" : `${i} → ${f}`;
  },
  // Data de hoje do navegador (fuso local), sem horário, em AAAA-MM-DD
  hojeISO() {
    const d = new Date(), p = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  },
  // Soma dias a uma data AAAA-MM-DD usando UTC (sem erro de fuso/horário de verão)
  somarDias(iso, dias) {
    const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
    return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
  },
  // true somente para AAAA-MM-DD existente no calendário
  dataValida(iso) {
    if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return false;
    const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
    return new Date(Date.UTC(a, m - 1, d)).toISOString().slice(0, 10) === iso.slice(0, 10);
  },
  // 1800 -> "R$ 1.800,00" (só exibição; o número original não é alterado). Vazio/inválido -> "—"
  formatarMoeda(v) {
    return typeof v === "number" && isFinite(v) ? this._moeda.format(v) : "—";
  },
  _moeda: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
  // Previsão bruta de férias = salário base + 1/3 constitucional (sem INSS, IRRF, médias ou adicionais).
  // Calculada em tempo de execução; nada é gravado em data/ferias.js. Usa centavos inteiros:
  // terço = round(salário / 3) e bruto = salário + terço (idêntico a round(salário × 4/3)).
  // Salário null/undefined/vazio/texto/NaN/Infinity/zero/negativo -> null (a interface mostra "—").
  calcularPrevisao(salario) {
    if (typeof salario !== "number" || !isFinite(salario) || salario <= 0) return null;
    const base = Math.round(salario * 100);
    if (!isFinite(base) || base <= 0) return null;
    const terco = Math.round(base / 3);
    return { salario: base / 100, terco: terco / 100, bruto: (base + terco) / 100, centavos: base + terco };
  },
  // Soma a previsão bruta dos registros com salário válido (registros inválidos não entram).
  totalPrevisao(registros) {
    let centavos = 0, validos = 0;
    for (const r of registros) {
      const p = r && r.previsao;
      if (p) { centavos += p.centavos; validos++; }
    }
    return { total: centavos / 100, validos, invalidos: registros.length - validos };
  },
  texto(valor) {
    const t = String(valor ?? "").trim();
    return t === "" || t === "-" ? "—" : t;
  },
  escapar(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
};
