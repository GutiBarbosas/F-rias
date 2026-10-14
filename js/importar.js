// Importação local de planilha Excel (.xlsx) direto no navegador (SheetJS); nada é enviado a servidor.
// Aplica as mesmas regras de scripts/xlsx_para_js.py e devolve registros no formato de window.FERIAS_DADOS.
const Importar = {
  ABA: "BASE",
  CAMPOS: ["COLABORADOR", "LOJA", "AQUISITIVO 1", "AQUISITIVO 2", "DT_LIMITE", "FUNÇÃO", "ADMISSÃO", "I_FÉRIAS", "F_FÉRIAS", "Salário Base", "DESEJO"],
  CAMPOS_DATA: ["AQUISITIVO 1", "AQUISITIVO 2", "DT_LIMITE", "ADMISSÃO", "I_FÉRIAS", "F_FÉRIAS", "DESEJO"],
  ALIAS: { "COLABORADOR2": "COLABORADOR" },
  ERROS: ["#N/A", "#REF!", "#VALUE!", "#DIV/0!", "#NAME?", "#NULL!", "#NUM!"],
  VAZIOS: ["", "-", "—"],

  vazio(v) {
    if (v === null || v === undefined) return true;
    if (typeof v !== "string") return false;
    const t = v.trim();
    return this.VAZIOS.includes(t) || this.ERROS.includes(t);
  },

  p2(n) { return String(n).padStart(2, "0"); },

  // Data -> AAAA-MM-DD ou null. Date (cellDates), número serial do Excel, "dd/mm/aaaa" ou ISO.
  data(v) {
    if (v instanceof Date) {
      if (isNaN(v)) return null;
      // SheetJS devolve a data à meia-noite em hora local ao usar cellDates; usa getters locais
      return `${v.getFullYear()}-${this.p2(v.getMonth() + 1)}-${this.p2(v.getDate())}`;
    }
    if (typeof v === "number" && isFinite(v)) {
      const d = new Date(Date.UTC(1899, 11, 30 + Math.trunc(v)));
      return isNaN(d) ? null : d.toISOString().slice(0, 10);
    }
    if (typeof v === "string") {
      const t = v.trim();
      let a, m, d;
      let x = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
      if (x) { d = +x[1]; m = +x[2]; a = +x[3]; }
      else if ((x = /^(\d{4})-(\d{2})-(\d{2})/.exec(t))) { a = +x[1]; m = +x[2]; d = +x[3]; }
      else return null;
      const dt = new Date(Date.UTC(a, m - 1, d));
      return dt.getUTCFullYear() === a && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
        ? `${a}-${this.p2(m)}-${this.p2(d)}` : null;
    }
    return null;
  },

  numero(v) {
    if (typeof v === "number") return isFinite(v) && v >= 0 ? v : null;
    if (typeof v === "string" && /^\d+([.,]\d+)?$/.test(v.trim())) return parseFloat(v.trim().replace(",", "."));
    return null;
  },

  campo(c, v) {
    if (this.vazio(v)) return null;
    if (c === "Salário Base") return this.numero(v);
    if (this.CAMPOS_DATA.includes(c)) return this.data(v);
    return typeof v === "string" ? v.trim() : v;
  },

  // Lê o arquivo (File) e devolve a lista de registros; lança Error com mensagem em português se inválido.
  async ler(arquivo) {
    if (typeof XLSX === "undefined") throw new Error("Biblioteca de leitura de Excel não carregada (verifique a conexão com a internet).");
    const wb = XLSX.read(await arquivo.arrayBuffer(), { type: "array", cellDates: true });
    if (!wb.SheetNames.includes(this.ABA)) throw new Error(`Aba '${this.ABA}' não encontrada. Abas existentes: ${wb.SheetNames.join(", ")}`);
    const linhas = XLSX.utils.sheet_to_json(wb.Sheets[this.ABA], { header: 1, raw: true, defval: null, blankrows: false });
    if (!linhas.length) throw new Error("A aba BASE está vazia.");
    const nCab = Math.max(0, linhas.findIndex(l => l.some(c => c !== null && String(c).trim() === "LOJA")));
    const cab = linhas[nCab].map(c => c === null ? "" : (this.ALIAS[String(c).trim()] || String(c).trim()));
    const faltando = this.CAMPOS.filter(c => !cab.includes(c));
    if (faltando.length) throw new Error(`Colunas ausentes na planilha: ${faltando.join(", ")}`);
    const idx = Object.fromEntries(this.CAMPOS.map(c => [c, cab.indexOf(c)]));
    return linhas.slice(nCab + 1)
      .filter(l => l.some(v => v !== null))
      .map(l => Object.fromEntries(this.CAMPOS.map(c => [c, this.campo(c, l[idx[c]])])));
  }
};
