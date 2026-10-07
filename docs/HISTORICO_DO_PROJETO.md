# Histórico do Projeto

## Etapa 1 — Estrutura inicial e carga dos dados
Projeto novo e independente; o Dashboard de Colaboradores não foi alterado (apenas lido como referência).

**Feito**
- Estrutura criada: `index.html`, `css/styles.css`, `js/{utils,filters,render,script}.js`, `data/ferias.js`,
  `scripts/xlsx_para_js.py`, `docs/HISTORICO_DO_PROJETO.md`, `README.md` e `.gitignore` (copiado do projeto de colaboradores: ignora planilhas e arquivos temporários).
- `scripts/xlsx_para_js.py` (openpyxl): lê a aba `BASE` e gera `data/ferias.js` (`window.FERIAS_DADOS`) com somente
  COLABORADOR, LOJA, AQUISITIVO 1, AQUISITIVO 2, DT_LIMITE, FUNÇÃO, ADMISSÃO, I_FÉRIAS e F_FÉRIAS. Datas em `AAAA-MM-DD`;
  vazio, `-`, erro de fórmula e data inválida viram `null` (datas inválidas são avisadas no final). Colunas ignoradas: NASC, SEXO, Salário Base, DESEJO.
- Página inicial: cabeçalho "📅 Dashboard de Férias" com o subtítulo pedido; áreas reservadas "Indicadores" e "Filtros" (sem funcionalidade);
  tabela com Colaborador, Loja, Função, Período aquisitivo, Conceder até, Últimas férias e Admissão.
- Visual: mesma paleta sóbria, tema claro/escuro automático e cabeçalho escuro do projeto de colaboradores; tabela com cabeçalho destacado e fixo, linhas alternadas e rolagem horizontal em telas estreitas.
- Exibição: "Período aquisitivo" = AQUISITIVO 1 a AQUISITIVO 2; "Últimas férias" = I_FÉRIAS a F_FÉRIAS; datas vazias aparecem como "—".

**Não implementado (de propósito):** indicadores, filtros, regras de situação/vencimento, gráficos, exportação, modal, calendário.

**Verificação**
- `data/ferias.js` com 509 registros = 509 linhas da planilha; os 9 campos de cada registro conferidos contra a planilha, sem diferenças.
- Nenhuma duplicidade removida. Colaboradores únicos: 337 por nome (o mesmo resultado por nome + loja); 353 combinando nome + admissão, o que indica nomes abreviados repetidos (homônimos) na base.
- 244 registros sem últimas férias (I_FÉRIAS/F_FÉRIAS = `-` na planilha); nenhuma data inválida encontrada.
- Página aberta em navegador: 509 linhas na tabela, sem erros de JavaScript.

## Etapa 2 — Filtros, ordenação e contador
Projeto de colaboradores não alterado. Sem gráficos, indicadores, cards, modal ou exportação.

**Arquivos alterados**
- `index.html`: a área reservada de Filtros virou a barra de filtros; mensagem de "sem resultados" passou a "Nenhum período aquisitivo encontrado." (a área de Indicadores continua reservada).
- `js/filters.js`: implementado (antes só reservado).
- `js/script.js`: ordenação inicial e ligação dos filtros/botão.
- `js/render.js`: contador "Exibindo X de Y períodos aquisitivos".
- `js/utils.js`: `normalizar()` (sem acento/caixa) e período formatado com "→" (ex.: `01/09/2025 → 31/08/2026`).
- `css/styles.css`: estilos dos filtros acrescentados ao final (mesma identidade visual).
- `docs/HISTORICO_DO_PROJETO.md`. Não alterados: `data/ferias.js` e `scripts/xlsx_para_js.py`.

**Funcionalidades**
- Busca por colaborador enquanto digita (ignora maiúsculas e acentos); selects de Loja, Função e Ano do limite com opções geradas dos dados (33 lojas em ordem numérica, 13 funções, anos 2025–2028); select de Situação.
- Todos os filtros e a busca combinam entre si; botão "Limpar filtros" restaura tudo.
- Ordenação inicial por `DT_LIMITE` crescente (empate mantém a ordem da planilha). Nenhum registro removido.

**Situação — estrutura preparada, regra pendente**
- O select lista Vencidas, Até 30 dias, 31 a 60 dias e Mais de 60 dias. `Filters.classificarSituacao()` em `js/filters.js` é o ponto de encaixe e hoje retorna `null`; enquanto isso, escolher uma situação **não restringe** a tabela (comportamento intencional até a próxima etapa).

**Validações (navegador, 1280 px e 390 px)**
- 509 registros carregados e exibidos; contador "Exibindo 509 de 509".
- Busca "ALYSSON" (maiúsculas): 1 resultado, igual ao cálculo independente. Loja 1 + ano 2027: 10 (esperado 10); + BALCONISTA: 3 (esperado 3).
- Combinação sem resultados: "Exibindo 0 de 509", mensagem exibida e botão "Limpar filtros" visível. Limpar restaura 509 e zera os 5 campos.
- Ordenação por DT_LIMITE confirmada (10/04/2025 a 24/10/2028); todas as datas em DD/MM/AAAA; ausentes como "—".
- Sem erros no console; sem estouro horizontal da página no celular (a tabela rola na horizontal).

**Quantidade final:** 509 registros.

## Etapa 3 — Inteligência de prazo e indicadores
Projeto de colaboradores não alterado. Sem gráficos, calendário, exportação, modal, planejamento ou edição de dados.

**Regra de classificação (por `DT_LIMITE`, comparada com a data atual do navegador, sem horário)**
- `DT_LIMITE < hoje` → **Vencidas**
- `hoje ≤ DT_LIMITE ≤ hoje + 30 dias` → **Até 30 dias** (o próprio dia de hoje conta aqui)
- `hoje + 30 < DT_LIMITE ≤ hoje + 60 dias` → **31 a 60 dias**
- `DT_LIMITE > hoje + 60 dias` → **Mais de 60 dias**
- Sem `DT_LIMITE` válido (vazio ou data inexistente) → **Sem prazo** (situação segura; **não** é opção do filtro nem tem card).
- Nenhuma data fixa no código: tudo é recalculado a cada abertura/uso com a data do navegador. Soma de dias feita em UTC (sem erro de fuso ou horário de verão).

**Arquivos alterados**
- `js/utils.js`: `hojeISO()`, `somarDias()` e `dataValida()`.
- `js/filters.js`: `classificarSituacao(registro, ref)` implementada (antes devolvia `null`); `referencia()`, `resumir()` e constante `SEM_PRAZO`; o filtro de Situação agora restringe de fato e continua combinando com Busca, Loja, Função e Ano.
- `js/render.js`: coluna Situação (marcador colorido discreto + texto), `indicadores()` e `destacarCard()`.
- `js/script.js`: cards calculados uma vez sobre a base completa; clique nos cards aplica o mesmo filtro do select.
- `index.html`: área reservada virou os 6 cards + "Atualizado em DD/MM/AAAA"; nova coluna "Situação" (8ª).
- `css/styles.css`: estilos acrescentados ao final (cards, situação, cores com variantes para tema escuro) e `min-width` da tabela de 860 para 980 px; pequeno ajuste de espaçamento lateral das células e quebra de linha só na coluna Função para a tabela caber em ~1280 px sem rolagem lateral.
- `README.md` (linha de estado atual) e este histórico. **Não alterados:** `data/ferias.js` e `scripts/xlsx_para_js.py`.

**Indicadores (sempre da base completa, não mudam com filtros)**
Colaboradores (únicos por `COLABORADOR`; homônimos por admissão ainda não tratados), Períodos aquisitivos, Vencidas, Até 30 dias, 31 a 60 dias, Mais de 60 dias. Os 4 cards de situação são clicáveis e ficam destacados quando o filtro correspondente está ativo. Ordenação segue por `DT_LIMITE` crescente; contador segue `Exibindo X de 509 períodos aquisitivos`.

**Validações (Chromium, 1280 px e 390 px, com data simulada no navegador)**
- 509 períodos; 337 colaboradores únicos; **0 registros sem `DT_LIMITE`** (soma das 4 situações = 509).
- Hoje = 07/10/2026: Vencidas 2, Até 30 dias 3, 31 a 60 dias 4, Mais de 60 dias 500 (igual ao cálculo independente em Python). Filtros devolvem exatamente a quantidade do card.
- Combinações conferidas com cálculo independente: Mais de 60 dias + Loja 1 = 23; + BALCONISTA = 241; + busca "ALYSSON" = 1.
- Limpar filtros volta a 509 e zera destaque dos cards; cards não mudam ao filtrar.
- Limites do exemplo do enunciado (06/10 Vencida, 07/10 e 06/11 Até 30, 07/11 e 06/12 31 a 60, 07/12 Mais de 60) conferidos; também testado com 01/06/2026 (1/0/0/508), 15/03/2027 (26/14/12/457) e 01/01/2029 (509 vencidas), todos iguais ao cálculo independente; virada de ano bissexto conferida.
- Data de referência exibida = data do navegador; sem erros nem avisos no console; sem estouro horizontal da página no celular (tabela rola na horizontal).

## Etapa 4 — Distribuição por Loja e por Ano
Projeto de colaboradores não alterado. Sem exportação, calendário, planejamento, edição, modal, upload, integração com GitHub ou novos filtros.

**Arquivos alterados**
- `js/filters.js`: novo `Filters.agregar(lista)` — uma única passagem pelos registros, classificando cada um com a **mesma** `classificarSituacao()` da Etapa 3 (nenhuma regra nova) e gerando os agregados por Loja e por Ano.
- `js/render.js`: novo `Render.distribuicoes(agg)` — monta as 2 tabelas e os 2 gráficos **somente** a partir dos agregados (sem cálculo independente nos gráficos).
- `js/script.js`: uma linha chamando `Render.distribuicoes(Filters.agregar(visao))` logo após os indicadores (calculado uma vez; não é refeito ao filtrar).
- `index.html`: duas novas seções **abaixo** da tabela principal (a tabela e os filtros não mudaram de lugar nem de comportamento).
- `css/styles.css`: bloco acrescentado ao final (tabelas-resumo, gráficos, legenda); reaproveita as variáveis de cor e os temas claro/escuro existentes.
- `README.md` (linha de estado atual) e este histórico. **Não alterados:** `data/ferias.js` e `scripts/xlsx_para_js.py` (hash MD5 idêntico ao do início da etapa).

**Novas tabelas**
- *Distribuição por loja*: Loja, Total, Vencidas, Até 30 dias, 31 a 60 dias, Mais de 60 dias; uma linha por loja existente na base (32), ordem crescente numérica por loja (comparação `numeric`).
- *Distribuição por ano*: mesmas colunas, por ano de `DT_LIMITE`; anos descobertos automaticamente (hoje 2025–2028), ordem crescente.
- Ambas rolam na horizontal (e a de lojas também na vertical, cabeçalho fixo) em telas estreitas. Sem linha de totais (não pedida).

**Novos gráficos** (CSS puro, sem biblioteca — o projeto não tinha nenhuma)
- Por loja: barras empilhadas horizontais (Vencidas, Até 30, 31 a 60, Mais de 60) com as cores dos cards; largura da barra proporcional ao Total da loja; cada segmento proporcional à sua quantidade (mínimo visual de 3 px para segmentos > 0, para que 1 período não suma). Legenda e *tooltip* com os números.
- Por ano: barras horizontais com o Total de períodos por ano.
- Adaptam-se à largura disponível; desktop em 2 colunas (tabela + gráfico), celular empilhado.

**Regras**
- Situação: exatamente a da Etapa 3 (por `DT_LIMITE` x data do navegador).
- Ano: `DT_LIMITE.slice(0, 4)`, igual ao filtro "Ano do limite".
- Tabelas e gráficos representam sempre a **base completa**; só a tabela principal responde aos filtros. Ordenação da tabela principal continua por `DT_LIMITE`.
- Registro sem `DT_LIMITE` válido (hoje 0): entra no Total da loja e em uma linha "Sem prazo" no ano (última), com aviso sob a tabela de ano; não entra nas colunas de situação.

**Validações (Chromium 1280 px e 390 px, claro e escuro, data simulada 07/10/2026)**
- Base: 509 períodos (= planilha `BASE_FÉRIAS_ATT.xlsx`), 337 colaboradores únicos, 32 lojas, anos 2025, 2026, 2027 e 2028.
- Loja: soma do Total = 509; soma das situações = 509. Ano: soma do Total = 509; soma das situações = 509.
- Cada linha (loja e ano) comparada com cálculo independente em Python: todas iguais. Ordem das lojas conferida.
- Soma das colunas de situação (loja e ano) = cards: Vencidas 2, Até 30 dias 3, 31 a 60 dias 4, Mais de 60 dias 500.
- Gráficos: rótulos, totais e soma dos segmentos conferem com as tabelas (32 lojas, 4 anos).
- Filtros (Função = BALCONISTA + Loja 1 + busca): tabela principal "Exibindo 5 de 509"; cards, tabelas e gráficos idênticos (HTML igual antes/depois). Clique em card + Limpar filtros volta a 509.
- Sem estouro horizontal da página nos 4 cenários; console sem erros nem avisos.

**Observação:** os números de situação dependem da data do navegador (como na Etapa 3); os valores acima valem para 07/10/2026.

## Etapa 5 — Novos dados: Salário Base e DESEJO
Projeto de colaboradores não alterado. A Etapa 4 (distribuição por loja e ano) já estava implementada e foi preservada. **Não** foram implementados conflitos, valor/1/3 de férias, previsão mensal, alertas, gráficos financeiros nem agrupamento por mês desejado — apenas os dados foram disponibilizados.

**Novos campos em `data/ferias.js` (agora 11, na ordem pedida)**
COLABORADOR, LOJA, AQUISITIVO 1, AQUISITIVO 2, DT_LIMITE, FUNÇÃO, ADMISSÃO, I_FÉRIAS, F_FÉRIAS, **Salário Base** (coluna J) e **DESEJO** (coluna K). Nenhum campo existente foi removido; NASC e SEXO continuam fora.

**Alterações**
- `scripts/xlsx_para_js.py`: `CAMPOS` com os 2 novos; `CAMPOS_NUMERO` + `converter_numero()`. `Salário Base` fica **número** (ex.: `3000`, `5879.99`), sem formatação. Vazio, `-`, erro de fórmula, texto não numérico, booleano ou negativo → `null` (os casos inválidos são listados no final como "ATENÇÃO"). Texto numérico simples (`"1800"`, `"1800,50"`) é aceito; formato com milhar (`"1.800,00"`) é recusado (→ `null` + aviso) para não gerar valor errado. `DESEJO` fica como texto exatamente como na planilha (apenas `strip()`); vazio ou `-` → `null`; nenhum mês é cadastrado no código. Docstring atualizada (inclui aviso de dado sensível).
- `data/ferias.js`: regenerado pelo script (509 registros, nenhuma duplicidade removida).
- `js/script.js`: a visão passa a ter `desejo` e `salario`. `js/utils.js`: `formatarMoeda()` (Intl pt-BR/BRL; só exibição). `js/render.js`: 2 novas células. `index.html`: 2 novas colunas. `css/styles.css`: coluna de salário alinhada à direita e `min-width` da tabela 980 → 1180 px.
- `README.md`: estado atual, lista de 11 campos e **seção Privacidade corrigida** (antes dizia que o salário não chegava ao `ferias.js`; agora chega, e o projeto deve ficar em repositório GitHub PRIVADO).

**Tabela**
- Novas colunas **Mês desejado** (valor de `DESEJO`, `—` se vazio) e **Salário base** (`R$ 1.800,00`; `—` se vazio), posicionadas **depois de Situação** para que ela continue visível em ~1280 px; a rolagem horizontal da própria tabela (já existente) leva às duas colunas novas. Sem coluna de conflito. Filtros e ordenação por `DT_LIMITE` não mudaram.

**Segurança dos dados**
- Nenhum arquivo novo com salários. O salário existe apenas em `data/ferias.js` (fonte do dashboard) e na visão em memória do navegador (mesmo padrão dos demais campos). `.gitignore` continua bloqueando `*.xlsx` e `*.csv`.

**Validações (planilha `BASE_FÉRIAS_ATT.xlsx`, Chromium 1280 px claro/escuro e 390 px, data simulada 07/10/2026)**
- 509 registros; 337 colaboradores únicos por nome; 11 campos em todos os registros.
- Os 9 campos antigos idênticos ao `ferias.js` anterior (509/509).
- `Salário Base` idêntico à planilha em valor e tipo nas 509 linhas (403 inteiros, 106 com centavos; mín. R$ 960,00, máx. R$ 6.467,98); nenhum texto, nenhum "R$" no arquivo.
- `DESEJO` conferido com a planilha nas 509 linhas.
- **Valores vazios:** `Salário Base` — 0 vazios; `DESEJO` — **509 de 509 vazios** (`-` na planilha → `null`), portanto "Mês desejado" aparece como `—` em todas as linhas por enquanto.
- Tratamento de vazios/inválidos testado com planilha sintética (vazio, `-`, `#N/A`, texto, negativo, booleano, `"1800,50"`, `"1.800,00"`): saídas e avisos conforme a regra acima.
- Tabela no navegador: ordem por `DT_LIMITE`, Mês desejado e salário formatado conferem com os dados nas 509 linhas.
- Busca, Loja, Função, Ano, Situação, cards, Limpar filtros e ordenação funcionando (ex.: Loja 1 + BALCONISTA + 2027 = 3; Mais de 60 dias = 500; Vencidas = 2); distribuição por loja/ano (Etapa 4) intacta.
- Sem estouro horizontal da página; sem erros ou avisos no console.

## Etapa 6 — Conflitos de programação (Loja + Função + DESEJO)
Projeto de colaboradores não alterado. Sem cálculo de férias, 1/3, previsão financeira/mensal, exportação, PDF, calendário, edição de dados ou integração com folha. `data/ferias.js` e `scripts/xlsx_para_js.py` **não foram alterados** (MD5 de `ferias.js` idêntico ao do início: `48823add9e035e99d4d5001775f71585`).

**Regra de conflito**
- Conflito = **2 ou mais registros** com a mesma combinação **LOJA + FUNÇÃO + DESEJO** (mesmo mês desejado na mesma loja e função). É um **alerta de planejamento**, não um erro. `DT_LIMITE`, `AQUISITIVO`, `ADMISSÃO` e salário **não** entram na regra.
- `DESEJO` vazio (`—`/`-`, vazio, `null`, `undefined`) **não participa** da análise (nunca gera alerta falso).
- **Normalização só para comparar** (`Filters.normalizarChave()`): sem maiúsculas/minúsculas, sem acentos e sem espaços extras (inclusive repetidos no meio), para Loja, Função e Desejo. Os valores exibidos na tabela e no resumo não são alterados (`Janeiro`, ` JANEIRO `, `janeiro` e `Março`/`marco` são o mesmo mês).

**Arquivos alterados**
- `js/filters.js`: `chaveConflito()`, `normalizarChave()`, `detectarConflitos(lista)` (marca `r.conflito` apenas na visão em memória e devolve só os grupos com 2+ registros, ordenados por loja numérica, função e mês), filtro `conflito` em `estado()`/`aplicar()`/`limpar()`.
- `js/render.js`: coluna Conflito (linha com classe `linha--conflito`) e `Render.conflitos()` (card + seção).
- `js/script.js`: calcula os conflitos uma vez sobre a base completa e liga o novo filtro.
- `index.html`: card, seção "⚠️ Conflitos de programação", select **Conflito** e coluna **Conflito** (depois de Mês desejado).
- `css/styles.css`: bloco acrescentado ao final; `min-width` da tabela 1180 → 1280 px; cards em 7 colunas a partir de 1000 px.
- `README.md` (estado atual) e este histórico.

**Funcionalidades**
- **Coluna Conflito:** `—` quando não há conflito; `⚠ Conflito` (texto âmbar discreto) quando há. Linhas em conflito têm fundo sutil e uma faixa lateral âmbar, com variante para o tema escuro.
- **Card "Conflitos de programação":** quantidade de **grupos** conflitantes (não de colaboradores). Ex.: 2 pessoas na Loja 1 + 3 na Loja 5 = **2**.
- **Seção de resumo:** Loja, Função, Mês desejado, Colaboradores, Quantidade; só grupos com 2+; sem conflitos mostra "Nenhum conflito de programação encontrado.".
- **Filtro Conflito:** Todos / Com conflito / Sem conflito, combinado com Busca, Loja, Função, Ano e Situação; "Limpar filtros" volta para Todos.
- Card e resumo representam a **base completa** e não mudam com os filtros (só a tabela principal é filtrada).

**Resultado inicial com a base real**
- 509 registros intactos; `DESEJO` = `null` nos 509 → **0 conflitos**, card = 0, resumo com a mensagem de "nenhum conflito", coluna Conflito toda `—`, "Com conflito" = 0 linhas e "Sem conflito" = 509. Isso é o esperado, não indica falha.

**Testes (Chromium 1280 px, 390 px, claro e escuro)**
- **Teste controlado em memória** (`Filters.detectarConflitos` com 4 registros: Loja 1/BALCONISTA/Janeiro ×2, Loja 1/CAIXA/Janeiro, Loja 2/BALCONISTA/Janeiro): registros 1 e 2 em conflito, 3 e 4 sem; **1 grupo**, 2 colaboradores. Vazios (`—`, `null`, `undefined`, `""`, `-`) ignorados mesmo repetidos.
- **Teste de interface com DESEJO simulado:** o `ferias.js` foi interceptado no navegador (o arquivo do projeto não foi tocado) com Loja 1/BALCONISTA ×3 (`Janeiro`, ` JANEIRO `, `janeiro`), Loja 1/OPERADOR DE CAIXA e Loja 2/BALCONISTA em Janeiro (sem conflito), Loja 5/BALCONISTA ×2 (`Março`, `marco`) e um Julho isolado. Resultado: card = 2, resumo com 2 grupos (3 e 2), 5 linhas `⚠ Conflito`, "Com conflito" = 5, "Sem conflito" = 504.
- Combinações conferidas com cálculo independente em Python: Com conflito + Loja 1 = 3; + Função = 3; + Loja 5 = 2; + Busca = 2; + Situação (Vencidas/Até 30/31 a 60 = 0; Mais de 60 dias = 5); Sem conflito + Loja 1 = 20; "Limpar filtros" restaura 509 e Conflito = Todos. O resumo continuou com os 2 grupos ao filtrar por Loja.
- Cards de situação e distribuição por Loja/Ano (32 lojas, soma 509) inalterados. Sem estouro horizontal da página no celular e console sem erros ou avisos em todos os cenários.

**Observações**
- Como a regra é por registro, um mesmo colaborador com **dois períodos aquisitivos** e o mesmo `DESEJO` conta duas vezes (aparece repetido no resumo, ex.: `EDILENE L.` no teste) e gera conflito sozinho. Seguiu-se a regra pedida (2+ registros); se não for o comportamento desejado, tratar numa etapa futura.
- O resumo exibe o `DESEJO` como escrito no primeiro registro do grupo (variações de escrita são agrupadas).
- A tabela principal agora rola na horizontal em ~1280 px (mais uma coluna), como já ocorria com as colunas da Etapa 5.

## Etapa 6 — Correção: conflito só entre colaboradores distintos
Ajuste único na regra de conflito; nenhuma funcionalidade nova. `data/ferias.js` e `scripts/xlsx_para_js.py` não foram alterados (MD5 idêntico).

**Problema:** o mesmo colaborador com dois períodos aquisitivos e o mesmo `DESEJO` contava como dois registros e gerava conflito consigo mesmo.

**Nova regra:** conflito só existe com **2 ou mais colaboradores distintos** (identificados por `COLABORADOR`, comparado sem maiúsculas, acentos e espaços extras) na mesma combinação **LOJA + FUNÇÃO + DESEJO**.
- Alteração somente em `Filters.detectarConflitos()` (`js/filters.js`). Cada grupo passa a guardar uma entrada por pessoa.
- Resumo: cada colaborador aparece **uma vez**; `Quantidade` = colaboradores distintos. Grupo com um só colaborador (mesmo com 2 períodos) não aparece.
- Quando o grupo é conflitante, todos os registros dele (inclusive os 2 períodos de quem tem dois) continuam marcados na tabela. O card continua contando **grupos**.
- Filtros, demais cards, distribuições por Loja/Ano e demais colunas não foram tocados.

**Testes (em memória; nenhum dado de teste ficou no projeto)**
- João/Loja 1/Balconista/Janeiro ×2 sozinho → 0 grupos, sem marcação.
- João ×2 + Maria (Balconista) + Pedro (Caixa) → 1 grupo, Quantidade 2 (`João, Maria`), Pedro fora do conflito.
- Interface com `DESEJO` simulado (arquivo interceptado no navegador): o grupo Loja 1/BALCONISTA/Janeiro, antes `LEILA F., EDILENE L., EDILENE L.` (3), passou a `LEILA F., EDILENE L.` (2); card = 2 grupos; filtros Com/Sem conflito e combinações continuam corretos.
- Base real: 509 registros, `DESEJO` intacto (todos vazios), 0 conflitos, card 0, mensagem de "nenhum conflito", console sem erros ou avisos.

**Observação:** como a identificação é por `COLABORADOR` (nomes abreviados, ex.: `ALYSSON C.`), dois homônimos de mesma loja e função seriam tratados como a mesma pessoa; a base já tem esse caso (337 nomes únicos vs. 353 por nome + admissão).

## Etapa 6.2 — Previsão bruta individual das férias
Somente previsão **individual** + total geral. Sem consolidado por mês, gráfico financeiro, previsão por `DESEJO`, exportação, PDF, INSS, IRRF, valor líquido, médias ou adicionais. `data/ferias.js` e `scripts/xlsx_para_js.py` **não foram alterados** (MD5 de `ferias.js` idêntico: `48823add9e035e99d4d5001775f71585`). Filtros, conflitos, cards anteriores e distribuição por Loja/Ano não foram tocados.

**Regra**
- Previsão bruta = **Salário Base + 1/3 constitucional** (1/3 = Salário Base ÷ 3). Não é valor líquido, nem valor exato da folha, nem valor final das férias.
- Calculada em **tempo de execução** (nada é gravado em `ferias.js`); cada registro recebe a sua própria previsão. **Sem deduplicação** e sem regra extra para períodos aquisitivos (quem tem 2 períodos continua em 2 linhas, cada uma com seu cálculo e somando 2x no total).
- Cálculo em **centavos inteiros**: `terço = arredondar(centavos ÷ 3)` e `bruto = centavos + terço` (idêntico a arredondar salário × 4/3, sem acumular erro de ponto flutuante). Internamente continuam números; a formatação é só na exibição, com o `Utils.formatarMoeda()` já existente (2 casas).
- **Salário inválido** (`null`, `undefined`, vazio, texto, `NaN`, infinito, zero ou negativo) → sem previsão; as colunas calculadas mostram `—` (nunca `NaN`/`R$ NaN`). O `Salário base` original não é alterado e não entra no total.

**Arquivos alterados**
- `js/utils.js`: `Utils.calcularPrevisao(salario)` (devolve `{salario, terco, bruto, centavos}` ou `null`) e `Utils.totalPrevisao(registros)`.
- `js/script.js`: cada registro da visão ganha `previsao`; `Render.previsaoTotal(Utils.totalPrevisao(visao))` calculado uma vez sobre a base completa.
- `js/render.js`: duas células novas na linha e `Render.previsaoTotal()`.
- `index.html`: colunas **1/3 férias** e **Previsão bruta** (depois de Salário base, com `title` explicativo), nota "Previsão bruta — salário + 1/3" sob o contador da tabela e card **Previsão bruta total** abaixo dos cards de indicadores.
- `css/styles.css` (bloco ao final): estilo do card e `min-width` da tabela 1280 → 1480 px. A rolagem horizontal existente foi mantida; nenhuma coluna foi removida.
- `README.md` (estado atual) e este histórico.

**Card "Previsão bruta total"**
- Soma da previsão bruta dos registros com salário válido, sempre sobre a **base completa** (não muda com busca, filtros ou clique nos cards). Mostra quantos registros entraram e quantos foram ignorados por salário inválido, e o aviso de que é estimativa bruta.

**Testes**
- *Em memória* (`Utils.calcularPrevisao`): 1.760,00 → 1/3 = 586,67 e previsão = 2.346,67; 1.800,00 → 600,00 e 2.400,00; com centavos: 1.234,56 → 411,52 / 1.646,08; 1.000,01 → 333,34 / 1.333,35; 5.879,99 → 1.960,00 / 7.839,99; 0,01 → 0,00 / 0,01. Inválidos (`null`, `undefined`, `""`, `"abc"`, `"1800"`, `NaN`, `±Infinity`, `0`, `-100`, objeto, lista, booleano) → `null` e `—` na exibição. Total misto (válidos 1.760 e 1.800 + 3 inválidos) = 4.746,67, com 2 válidos e 3 ignorados.
- *Base real* (Chromium 1280 px e 390 px): 509 registros e 509 linhas; as 509 linhas (Salário base, 1/3, Previsão) conferem com cálculo independente em Python (`Decimal`, arredondamento meio para cima); **Previsão bruta total = R$ 1.585.940,91** (509 salários válidos, 0 ignorados), igual ao cálculo independente. `Salário Base` e `DESEJO` intactos (arquivo `ferias.js` com MD5 idêntico).
- *Interface com salários inválidos* (`ferias.js` interceptado no navegador, arquivo do projeto não tocado; `null`, `"abc"` e campo ausente): as 3 linhas mostram `—` em 1/3 e Previsão, sem `NaN` na página, e o total continua R$ 1.585.940,91 (nota: "3 sem salário válido não entram").
- *Regressão:* filtro de Loja reduz a tabela (13 linhas) e o card de previsão não muda; busca "ALYSSON" e Limpar filtros (volta a 509); cards anteriores 337 / 509 / 2 / 3 / 4 / 500 / 0 conferidos; clique no card Vencidas filtra 2 linhas; distribuição por Loja (32) e Ano (4) intacta; console sem erros ou avisos.
- *Responsividade:* sem estouro horizontal da página em desktop e celular; a tabela principal segue com rolagem horizontal própria; card de previsão legível nos dois tamanhos.

**Observação:** como a regra é por registro (sem deduplicar), o total soma 2x o colaborador que tem dois períodos aquisitivos, conforme pedido para esta etapa. Salário igual a zero é tratado como inválido (não existe no arquivo atual).

## Etapa 7 — Filtros valem para todo o dashboard + filtro Mês
Somente duas mudanças; sem alteração de layout, cores, estilos, nomes de seções ou regras de cálculo. `data/ferias.js`, `css/styles.css` e `js/utils.js` **não foram alterados** (MD5 de `ferias.js` idêntico: `48823add9e035e99d4d5001775f71585`).

**1. Visão filtrada como fonte única**
- `js/script.js`: `atualizar()` calcula `Filters.aplicar(visao, estado)` **uma vez** e passa essa mesma lista para tabela, cards (`Filters.resumir`), previsão bruta total (`Utils.totalPrevisao`), conflitos de programação e distribuições por Loja/Ano (`Filters.agregar`). Sem filtro ativo a lista é a base completa; "Limpar filtros" volta a ela.
- Nenhuma regra paralela: as funções existentes (`resumir`, `agregar`, `totalPrevisao`, `detectarConflitos`) apenas recebem a lista filtrada em vez de `visao`.
- Conflitos: a marcação por registro (coluna Conflito e filtro Conflito) continua calculada uma vez sobre a base completa. O card e o resumo de conflitos agora listam os grupos (Loja + Função + DESEJO, 2+ colaboradores distintos) **dentro da lista filtrada**, via `Filters.detectarConflitos(lista, false)` (novo parâmetro `marcar`, padrão `true`; com `false` não altera `r.conflito`).
- Textos de apoio "base completa, não muda com os filtros" trocados por "acompanha os filtros" (index.html), pois deixaram de ser verdadeiros.

**2. Filtro Mês**
- Novo select `f-mes` (rótulo "Mês") ao lado de Situação, com "Todos os meses" + Janeiro…Dezembro (`Filters.MESES_ROTULO`), registrado em `Filters.campos` (opções, evento de mudança e "Limpar filtros" seguem o mesmo caminho dos demais).
- Regra: `normalizarChave(r.desejo) === normalizarChave(mês)` (sem acentos, maiúsculas e espaços extras), usando só o valor existente em `DESEJO`; nenhuma regra de negócio nova.

**Previsão bruta:** mesma regra (salário + 1/3, centavos inteiros); só muda o conjunto de registros somado.

**Testes (Chromium 1280 px; conferidos contra cálculo independente em Python sobre o mesmo conjunto filtrado)**
- Sem filtros: estado inicial idêntico ao do código anterior (509 períodos, R$ 1.585.940,91), na base real e com DESEJO simulado.
- Loja 1: 23 linhas / R$ 90.278,66; Função BALCONISTA: 245 linhas / R$ 578.570,75; Loja 1 + BALCONISTA: 7 linhas / R$ 16.426,69 — tabela, cards, previsão, conflitos e distribuições (tabelas e gráficos) conferem.
- Mês e combinações Loja + Função + Mês: testados com `DESEJO` **simulado** (arquivo interceptado no navegador; projeto não tocado), incluindo variações de escrita (`FEVEREIRO`, `março`).
- Limpar filtros restaura exatamente o estado inicial. Console sem erros ou avisos.

**Observações**
- Na base atual `DESEJO` é `null` nos 509 registros: qualquer mês selecionado resulta em 0 linhas e 0 conflitos (esperado).
- A marcação ⚠ por linha e o filtro Conflito seguem a regra sobre a base completa; o card/resumo de conflitos considera apenas a lista filtrada. Os dois coincidem ao filtrar por Loja, Função, Mês ou Conflito; podem divergir em filtros como Colaborador, Ano ou Situação, quando só parte de um grupo fica visível.
- Os cards de situação continuam clicáveis (definem o filtro Situação); com o filtro ativo, os demais cards de situação passam a mostrar 0, pois acompanham a lista filtrada.

## Etapa 8 — Conflitos calculados somente na lista filtrada
Ajuste único de consistência; substitui a observação da Etapa 7 sobre a divergência entre ⚠ e o card de conflitos. Layout, estilos, gráficos, cards, previsão, filtro Mês, tabela, regras de situação e `data/ferias.js` não foram alterados.

**Regra:** a marcação ⚠ por linha e o filtro **Conflito** passam a considerar só os registros visíveis. Um registro que conflitaria com outro excluído pelos filtros **não** é marcado naquela visão. Sem filtros, o comportamento é o mesmo de antes (base completa).
- `js/filters.js` — `Filters.aplicar()`: primeiro aplica os demais filtros (busca, Loja, Função, Ano, Situação, Mês); depois chama `detectarConflitos()` (mesma regra: Loja + Função + DESEJO, 2+ colaboradores distintos) sobre esses registros; por fim aplica o filtro Conflito (Com/Sem) usando essa marcação.
- `js/script.js` — removida a marcação única inicial sobre a base completa (agora feita a cada atualização, em `aplicar`). O card e o resumo de conflitos seguem usando a lista filtrada, como na Etapa 7.

**Testes (Chromium; `DESEJO` simulado via interceptação, projeto não tocado)**
- Sem filtros: idêntico ao código anterior (509 linhas, 49 ⚠, 24 grupos); "Limpar filtros" restaura o mesmo estado.
- Loja, Função, Mês e combinações: resultados idênticos ao anterior. Situação, Ano e Busca: só as marcações ⚠ mudaram (ex.: Ano 2027: 19 → 6 ⚠; Situação "Mais de 60 dias": 48 → 47), conferidas com cálculo independente sobre as linhas visíveis (⚠, coluna Conflito, card e resumo concordam).
- Com Conflito = Com: todas as linhas visíveis têm ⚠; Sem: nenhuma. Cards, previsão, distribuições e gráficos continuam iguais ao anterior em todos os cenários sem filtro Conflito. Console sem erros ou avisos.
- Base real: `DESEJO` vazio nos 509 registros → 0 conflitos, como antes.

**Observação:** com filtro Conflito ativo, o conjunto exibido pode diferir do da Etapa 7 (ex.: Situação "Mais de 60 dias" + Com conflito: 48 → 47 linhas), porque o conflito agora é avaliado dentro da visão filtrada.

