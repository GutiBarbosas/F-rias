// Montagem das linhas da tabela e dos indicadores
const Render = {
  // Classe de cor discreta por situação (o texto continua sendo a informação principal)
  CLASSES: { "Vencidas": "vencida", "Até 30 dias": "ate30", "31 a 60 dias": "d31a60", "Mais de 60 dias": "mais60" },
  ROTULOS: { "Vencidas": "Vencida" },

  situacao(sit) {
    const classe = this.CLASSES[sit] || "sem";
    return `<span class="sit sit--${classe}"><span class="sit__ponto" aria-hidden="true"></span>${Utils.escapar(this.ROTULOS[sit] || sit)}</span>`;
  },

  linha(r, ref) {
    const e = Utils.escapar;
    return `
      <tr${r.conflito ? ' class="linha--conflito"' : ""}>
        <td>${e(r.colaborador)}</td>
        <td>${e(r.loja)}</td>
        <td>${e(r.funcao)}</td>
        <td>${e(Utils.formatarPeriodo(r.aquisitivo1, r.aquisitivo2))}</td>
        <td>${e(Utils.formatarData(r.dtLimite))}</td>
        <td>${e(Utils.formatarPeriodo(r.iFerias, r.fFerias))}</td>
        <td>${e(Utils.formatarData(r.admissao))}</td>
        <td>${this.situacao(Filters.classificarSituacao(r, ref))}</td>
        <td>${e(r.desejo)}</td>
        <td>${r.conflito ? '<span class="conflito" title="Mais de um colaborador da mesma loja e função deseja o mesmo mês">⚠ Conflito</span>' : "—"}</td>
        <td class="num">${e(Utils.formatarMoeda(r.salario))}</td>
        <td class="num">${e(Utils.formatarMoeda(r.previsao ? r.previsao.terco : null))}</td>
        <td class="num">${e(Utils.formatarMoeda(r.previsao ? r.previsao.bruto : null))}</td>
      </tr>`;
  },

  tabela(registros, total) {
    const ref = Filters.referencia();
    document.getElementById("tabela-corpo").innerHTML = registros.map(r => this.linha(r, ref)).join("");
    document.getElementById("vazio").hidden = registros.length > 0;
    document.getElementById("contagem").textContent = `Exibindo ${registros.length} de ${total} períodos aquisitivos`;
  },

  // Cards do topo: calculados sobre a lista filtrada (sem filtro ativo, equivale à base completa)
  indicadores(resumo) {
    document.getElementById("ind-colaboradores").textContent = resumo.colaboradores;
    document.getElementById("ind-periodos").textContent = resumo.periodos;
    document.querySelectorAll(".card[data-situacao]").forEach(card => {
      card.querySelector(".card__valor").textContent = resumo.porSituacao[card.dataset.situacao];
    });
    document.getElementById("data-ref").textContent = `Atualizado em ${Utils.formatarData(Filters.referencia().hoje)}`;
  },

  // Card "Previsão bruta total" (lista filtrada; só registros com salário válido)
  previsaoTotal(res) {
    document.getElementById("ind-previsao").textContent = Utils.formatarMoeda(res.total);
    document.getElementById("ind-previsao-nota").textContent =
      `Salário + 1/3 de ${res.validos} registro(s) com salário válido` + (res.invalidos ? ` · ${res.invalidos} sem salário válido não entram` : "");
  },

  // Card e seção "Conflitos de programação" (lista filtrada; o card conta GRUPOS, não colaboradores)
  conflitos(grupos) {
    const e = Utils.escapar;
    document.getElementById("ind-conflitos").textContent = grupos.length;
    document.getElementById("conflitos-vazio").hidden = grupos.length > 0;
    document.getElementById("conflitos-rolagem").hidden = grupos.length === 0;
    document.getElementById("conflitos-corpo").innerHTML = grupos.map(g => `
      <tr><th scope="row">${e(g.loja)}</th><td>${e(g.funcao)}</td><td>${e(g.desejo)}</td>
        <td class="conflitos__nomes">${e(g.colaboradores.join(", "))}</td><td>${g.quantidade}</td></tr>`).join("");
  },

  // Distribuição por Loja e por Ano (lista filtrada): tabelas e gráficos usam os mesmos agregados
  distribuicoes(agg) {
    const e = Utils.escapar, SIT = Filters.SITUACOES;
    const linhas = (grupos, prefixo) => grupos.map(g => `
      <tr><th scope="row">${e(prefixo + g.chave)}</th><td>${g.total}</td>${SIT.map(s => `<td>${g.porSituacao[s]}</td>`).join("")}</tr>`).join("");
    document.getElementById("resumo-loja-corpo").innerHTML = linhas(agg.porLoja, "");
    document.getElementById("resumo-ano-corpo").innerHTML = linhas(agg.porAno, "");

    const nota = document.getElementById("resumo-nota");
    nota.hidden = agg.semPrazo === 0;
    nota.textContent = `${agg.semPrazo} período(s) sem prazo válido contam no Total, mas não entram nas colunas de situação.`;

    document.getElementById("grafico-loja-legenda").innerHTML = SIT.map(s =>
      `<span class="legenda__item"><span class="seg seg--${this.CLASSES[s]}" aria-hidden="true"></span>${e(s)}</span>`).join("");

    const maxLoja = Math.max(1, ...agg.porLoja.map(g => g.total));
    document.getElementById("grafico-loja").innerHTML = agg.porLoja.map(g => {
      const segs = SIT.filter(s => g.porSituacao[s] > 0).map(s =>
        `<span class="seg seg--${this.CLASSES[s]}" style="flex-grow:${g.porSituacao[s]}" title="${e(s)}: ${g.porSituacao[s]}"></span>`).join("");
      const resumo = SIT.map(s => `${s}: ${g.porSituacao[s]}`).join(" · ");
      return `<div class="graf__linha" title="Loja ${e(g.chave)} — Total ${g.total} · ${e(resumo)}">
        <span class="graf__rotulo">Loja ${e(g.chave)}</span>
        <div class="graf__trilho"><div class="graf__barra" style="width:${(g.total / maxLoja * 100).toFixed(2)}%">${segs}</div></div>
        <span class="graf__valor">${g.total}</span></div>`;
    }).join("");

    const maxAno = Math.max(1, ...agg.porAno.map(g => g.total));
    document.getElementById("grafico-ano").innerHTML = agg.porAno.map(g => {
      const resumo = SIT.map(s => `${s}: ${g.porSituacao[s]}`).join(" · ");
      return `<div class="graf__linha" title="${e(g.chave)} — Total ${g.total} · ${e(resumo)}">
        <span class="graf__rotulo">${e(g.chave)}</span>
        <div class="graf__trilho"><div class="graf__barra" style="width:${(g.total / maxAno * 100).toFixed(2)}%"><span class="seg seg--total" style="flex-grow:1"></span></div></div>
        <span class="graf__valor">${g.total}</span></div>`;
    }).join("");
  },

  // Marca o card que corresponde ao filtro de Situação selecionado
  destacarCard(situacao) {
    document.querySelectorAll(".card[data-situacao]").forEach(card => {
      card.setAttribute("aria-pressed", String(card.dataset.situacao === situacao));
    });
  }
};
