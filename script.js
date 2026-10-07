// Ponto de entrada: liga os dados à renderização.
// Os dados originais (window.FERIAS_DADOS) nunca são modificados;
// a "visão" abaixo é uma cópia só para exibição e filtro. Cada linha é um período aquisitivo
// (um colaborador pode aparecer mais de uma vez) — não há remoção de duplicidades.
(function () {
  const originais = Array.isArray(window.FERIAS_DADOS) ? window.FERIAS_DADOS : [];

  const visao = originais.map(r => ({
    colaborador: Utils.texto(r["COLABORADOR"]),
    loja: Utils.texto(r["LOJA"]),
    funcao: Utils.texto(r["FUNÇÃO"]),
    aquisitivo1: r["AQUISITIVO 1"],
    aquisitivo2: r["AQUISITIVO 2"],
    dtLimite: r["DT_LIMITE"],
    admissao: r["ADMISSÃO"],
    iFerias: r["I_FÉRIAS"],
    fFerias: r["F_FÉRIAS"],
    desejo: Utils.texto(r["DESEJO"]),
    salario: r["Salário Base"],
    previsao: Utils.calcularPrevisao(r["Salário Base"]) // null se salário inválido; calculado aqui, não vem do ferias.js
  }));

  // Ordenação inicial: DT_LIMITE crescente (sem data vai para o fim; empate mantém a ordem da base)
  visao.sort((a, b) => (a.dtLimite || "9999").localeCompare(b.dtLimite || "9999"));

  function atualizar() {
    const estado = Filters.estado();
    const filtrados = Filters.aplicar(visao, estado); // fonte única da visão atual: todos os componentes abaixo usam esta lista
    Render.tabela(filtrados, visao.length);
    Render.indicadores(Filters.resumir(filtrados));
    Render.previsaoTotal(Utils.totalPrevisao(filtrados));
    Render.conflitos(Filters.detectarConflitos(filtrados, false)); // grupos da lista filtrada (não altera a marcação por registro)
    Render.distribuicoes(Filters.agregar(filtrados));
    Render.destacarCard(estado.situacao);
  }

  Filters.montarOpcoes(visao);

  // Cards de situação usam o mesmo filtro do select (só trocam o valor e atualizam)
  document.querySelectorAll(".card[data-situacao]").forEach(card => card.addEventListener("click", () => {
    document.getElementById("f-situacao").value = card.dataset.situacao;
    atualizar();
  }));

  let timer;
  document.getElementById("busca").addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(atualizar, 150); });
  Filters.campos.forEach(({ id }) => document.getElementById(id).addEventListener("change", atualizar));
  document.getElementById("f-conflito").addEventListener("change", atualizar);
  document.getElementById("limpar").addEventListener("click", () => { Filters.limpar(); atualizar(); });

  atualizar();
})();
