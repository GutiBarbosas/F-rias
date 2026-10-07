// Busca e filtros combinados (todos valem ao mesmo tempo).
const Filters = {
  campos: [
    { id: "f-loja", chave: "loja", todos: "Todas as lojas" },
    { id: "f-funcao", chave: "funcao", todos: "Todas as funções" },
    { id: "f-ano", chave: "ano", todos: "Todos os anos" },
    { id: "f-situacao", chave: "situacao", todos: "Todas as situações" },
    { id: "f-mes", chave: "mes", todos: "Todos os meses" }
  ],

  SITUACOES: ["Vencidas", "Até 30 dias", "31 a 60 dias", "Mais de 60 dias"],
  SEM_PRAZO: "Sem prazo", // registro sem DT_LIMITE válido (não é opção de filtro)

  // Datas de referência calculadas a partir de HOJE (data do navegador, sem horário).
  referencia() {
    const hoje = Utils.hojeISO();
    return { hoje, ate30: Utils.somarDias(hoje, 30), ate60: Utils.somarDias(hoje, 60) };
  },

  // Classifica o período pelo DT_LIMITE em relação a hoje. Datas AAAA-MM-DD comparam corretamente como texto.
  classificarSituacao(registro, ref = this.referencia()) {
    if (!Utils.dataValida(registro.dtLimite)) return this.SEM_PRAZO;
    const limite = registro.dtLimite.slice(0, 10);
    if (limite < ref.hoje) return "Vencidas";
    if (limite <= ref.ate30) return "Até 30 dias";
    if (limite <= ref.ate60) return "31 a 60 dias";
    return "Mais de 60 dias";
  },

  // Resumo da lista recebida (usado nos indicadores, com a lista filtrada)
  resumir(lista) {
    const ref = this.referencia();
    const porSituacao = { [this.SEM_PRAZO]: 0 };
    this.SITUACOES.forEach(s => { porSituacao[s] = 0; });
    lista.forEach(r => { porSituacao[this.classificarSituacao(r, ref)]++; });
    return {
      periodos: lista.length,
      colaboradores: new Set(lista.map(r => r.colaborador)).size,
      porSituacao
    };
  },

  // Agregados por Loja e por Ano do limite (lista recebida). Uma única passagem pelos registros,
  // usando a MESMA classificarSituacao() dos cards. Tabelas e gráficos leem somente este resultado.
  agregar(lista) {
    const ref = this.referencia();
    const vazio = chave => ({ chave, total: 0, porSituacao: { [this.SEM_PRAZO]: 0, ...Object.fromEntries(this.SITUACOES.map(s => [s, 0])) } });
    const lojas = new Map(), anos = new Map();
    const somar = (mapa, chave, sit) => {
      if (!mapa.has(chave)) mapa.set(chave, vazio(chave));
      const g = mapa.get(chave);
      g.total++; g.porSituacao[sit]++;
    };
    lista.forEach(r => {
      const sit = this.classificarSituacao(r, ref);
      somar(lojas, r.loja, sit);
      somar(anos, Utils.dataValida(r.dtLimite) ? r.dtLimite.slice(0, 4) : this.SEM_PRAZO, sit);
    });
    const porLoja = [...lojas.values()].sort((a, b) => a.chave.localeCompare(b.chave, "pt-BR", { numeric: true }));
    // anos em ordem crescente; "Sem prazo" (se existir) fica por último
    const porAno = [...anos.values()].sort((a, b) =>
      (a.chave === this.SEM_PRAZO) - (b.chave === this.SEM_PRAZO) || a.chave.localeCompare(b.chave));
    const semPrazo = lista.reduce((n, r) => n + (Utils.dataValida(r.dtLimite) ? 0 : 1), 0);
    return { porLoja, porAno, semPrazo };
  },

  // ---- Conflitos de programação (Etapa 6) ----
  // Conflito = 2+ colaboradores distintos (COLABORADOR) com a mesma LOJA + FUNÇÃO + ANO + MÊS do DESEJO. É um alerta de planejamento, não um erro.
  // A normalização vale só para comparar; os valores exibidos na tabela não são alterados.
  DESEJO_VAZIO: ["", "-", "—", "null", "undefined"],
  MESES: ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"],
  MESES_ROTULO: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"], // opções do filtro Mês (comparado com DESEJO via normalizarChave)

  // minúsculas, sem acentos, sem espaços extras (inclusive repetidos no meio)
  normalizarChave(valor) {
    return Utils.normalizar(valor).replace(/\s+/g, " ");
  },

  // DESEJO (AAAA-MM-DD) -> { ano: "2026", mes: 10 } ; vazio/inválido -> null
  desejoAnoMes(r) {
    const m = /^(\d{4})-(\d{2})-\d{2}/.exec(String(r.desejo ?? ""));
    return m && Number(m[2]) >= 1 && Number(m[2]) <= 12 ? { ano: m[1], mes: Number(m[2]) } : null;
  },

  // Chave "loja|função|ano|mês" normalizada; null quando o DESEJO está vazio/inválido (não participa da análise)
  chaveConflito(r) {
    const d = this.desejoAnoMes(r);
    if (!d) return null;
    return [this.normalizarChave(r.loja), this.normalizarChave(r.funcao), d.ano, d.mes].join("|");
  },

  // Marca r.conflito (true/false) em cada registro da visão e devolve só os grupos com 2+ registros.
  // Não altera os dados originais (window.FERIAS_DADOS); r.conflito existe apenas na visão em memória.
  // marcar = false: só devolve os grupos da lista recebida (ex.: lista filtrada), sem alterar r.conflito.
  detectarConflitos(lista, marcar = true) {
    const grupos = new Map();
    lista.forEach(r => {
      if (marcar) r.conflito = false;
      const chave = this.chaveConflito(r);
      if (chave === null) return;
      if (!grupos.has(chave)) grupos.set(chave, { loja: r.loja, funcao: r.funcao, ano: this.desejoAnoMes(r).ano, mes: this.desejoAnoMes(r).mes, registros: [] });
      grupos.get(chave).registros.push(r);
    });
    // Conflito exige 2+ COLABORADORES DISTINTOS (o mesmo colaborador com 2 períodos e o mesmo DESEJO não conflita consigo mesmo).
    // Cada grupo guarda um nome por pessoa (primeira grafia); todos os registros do grupo conflitante são marcados.
    grupos.forEach(g => {
      g.pessoas = new Map();
      g.registros.forEach(r => { const k = this.normalizarChave(r.colaborador); if (!g.pessoas.has(k)) g.pessoas.set(k, r.colaborador); });
    });
    const conflitantes = [...grupos.values()].filter(g => g.pessoas.size >= 2);
    if (marcar) conflitantes.forEach(g => g.registros.forEach(r => { r.conflito = true; }));
    return conflitantes.map(g => ({
      loja: g.loja, funcao: g.funcao, ano: g.ano, mes: g.mes, desejo: `${String(g.mes).padStart(2, "0")}/${g.ano}`,
      colaboradores: [...g.pessoas.values()],
      quantidade: g.pessoas.size
    })).sort((a, b) =>
      a.loja.localeCompare(b.loja, "pt-BR", { numeric: true }) ||
      a.funcao.localeCompare(b.funcao, "pt-BR") ||
      a.ano.localeCompare(b.ano) || a.mes - b.mes);
  },

  // Valores distintos de uma chave, na ordem certa (números como números, textos A-Z)
  valoresUnicos(lista, chave) {
    const v = [...new Set(lista.map(r => r[chave]).filter(x => x !== "" && x !== "—"))];
    return v.every(x => /^\d+$/.test(x)) ? v.sort((a, b) => a - b) : v.sort((a, b) => a.localeCompare(b, "pt-BR"));
  },

  montarOpcoes(lista) {
    const opcoes = {
      loja: this.valoresUnicos(lista, "loja"),
      funcao: this.valoresUnicos(lista, "funcao"),
      ano: this.valoresUnicos(lista.map(r => ({ ano: r.dtLimite ? r.dtLimite.slice(0, 4) : "" })), "ano"),
      situacao: this.SITUACOES,
      mes: this.MESES_ROTULO
    };
    this.campos.forEach(({ id, chave, todos }) => {
      document.getElementById(id).innerHTML =
        `<option value="">${todos}</option>` +
        opcoes[chave].map(v => `<option value="${Utils.escapar(v)}">${Utils.escapar(v)}</option>`).join("");
    });
  },

  estado() {
    const e = { busca: Utils.normalizar(document.getElementById("busca").value) };
    this.campos.forEach(({ id, chave }) => { e[chave] = document.getElementById(id).value; });
    e.conflito = document.getElementById("f-conflito").value; // "", "com" ou "sem"
    return e;
  },

  aplicar(lista, e) {
    const ref = this.referencia();
    const visiveis = lista.filter(r =>
      (!e.busca || Utils.normalizar(r.colaborador).includes(e.busca)) &&
      (!e.loja || r.loja === e.loja) &&
      (!e.funcao || r.funcao === e.funcao) &&
      (!e.ano || (r.dtLimite || "").slice(0, 4) === e.ano) &&
      (!e.situacao || this.classificarSituacao(r, ref) === e.situacao) &&
      (!e.mes || (this.desejoAnoMes(r) || {}).mes === this.MESES_ROTULO.indexOf(e.mes) + 1)
    );
    // Conflito (⚠ e filtro Conflito) calculado só entre os registros visíveis pelos demais filtros; sem filtros = base completa.
    this.detectarConflitos(visiveis);
    return visiveis.filter(r => !e.conflito || (e.conflito === "com") === Boolean(r.conflito));
  },

  limpar() {
    document.getElementById("busca").value = "";
    this.campos.forEach(({ id }) => { document.getElementById(id).value = ""; });
    document.getElementById("f-conflito").value = "";
  }
};
