# Dashboard de Férias

Acompanhamento dos períodos aquisitivos e prazos para concessão de férias. Projeto independente do
Dashboard de Colaboradores (reaproveita apenas a arquitetura, a organização de arquivos e a identidade visual).

**Estado atual (etapa 7):** tabela com busca por colaborador e filtros combinados (Loja, Função, Ano do limite, Situação, Mês, Conflito), ordenada por `DT_LIMITE`; alerta de conflitos de programação (mesma loja + função + mês desejado). Previsão bruta individual (salário base + 1/3 constitucional) por período aquisitivo e card "Previsão bruta total" (acompanha os filtros; sem filtro, considera a base completa).
A Situação (Vencidas, Até 30 dias, 31 a 60 dias, Mais de 60 dias) é calculada por `DT_LIMITE` com a data atual do navegador e alimenta a coluna
Situação, o filtro e os cards de indicadores do topo (que acompanham os filtros).
A tabela também mostra "Mês desejado" (`DESEJO`) e "Salário base" (formatado em R$ só na tela).
Abaixo da tabela há a distribuição por Loja e por Ano do limite (tabelas e gráficos de barras), também acompanhando os filtros.
Todos os blocos (tabela, cards, previsão bruta total, conflitos de programação e distribuições) usam a mesma lista filtrada; o filtro Mês compara o texto de `DESEJO` (sem acentos e sem diferenciar maiúsculas).

## Como usar
Abra o `index.html` no navegador (não precisa instalar nada).

## Atualizar os dados
Requer Python 3 e `openpyxl` (`pip install openpyxl`). A partir da pasta do projeto:
```
python scripts/xlsx_para_js.py caminho/da/planilha.xlsx
```
O script lê a aba `BASE` e regrava `data/ferias.js` com somente 11 campos: COLABORADOR, LOJA, AQUISITIVO 1,
AQUISITIVO 2, DT_LIMITE, FUNÇÃO, ADMISSÃO, I_FÉRIAS, F_FÉRIAS, Salário Base e DESEJO. As demais colunas são ignoradas.
Datas viram `AAAA-MM-DD`; vazio, `-` ou data inválida viram `null`. `Salário Base` fica como número (ou `null`);
`DESEJO` fica como texto da planilha (ou `null`).

**Cada linha é um período aquisitivo.** Um colaborador pode aparecer em mais de uma linha; nenhuma linha é
removida por duplicidade de nome.

## Estrutura
```
├── index.html
├── css/styles.css
├── js/
│   ├── utils.js      # formatação de datas/textos
│   ├── filters.js    # busca e filtros
│   ├── render.js     # montagem da tabela
│   └── script.js     # ponto de entrada
├── data/ferias.js    # dados gerados (11 campos, inclui salário)
├── scripts/xlsx_para_js.py
└── docs/HISTORICO_DO_PROJETO.md
```

## Privacidade
`.gitignore` impede o envio de planilhas (`*.xlsx`, `*.csv`) ao repositório. **`data/ferias.js` agora contém o
`Salário Base` (dado sensível de RH): este projeto deve ficar somente em repositório GitHub PRIVADO.** As colunas de
nascimento e sexo continuam fora de `data/ferias.js`.
