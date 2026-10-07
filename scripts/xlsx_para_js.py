"""Converte a planilha de férias (aba BASE) em data/ferias.js.

Uso (a partir da pasta do projeto):
    python scripts/xlsx_para_js.py caminho/BASE_FERIAS.xlsx

Gera SOMENTE os campos listados em CAMPOS. Qualquer outra coluna da planilha
(NASC, SEXO etc.) é ignorada e nunca chega ao arquivo de dados.
ATENÇÃO: "Salário Base" é dado sensível de RH e chega a data/ferias.js; use apenas em repositório PRIVADO.
Cada linha da planilha é um período aquisitivo e vira um registro; nenhuma linha é
removida por duplicidade de nome.

Conversões técnicas:
- datas viram texto ISO (AAAA-MM-DD); datas gravadas como número serial do Excel também;
- células vazias, "-" e erros de fórmula do Excel (#N/A, #REF! etc.) viram vazio (null);
- texto que não seja uma data válida, nos campos de data, vira vazio (null);
- "Salário Base" permanece NÚMERO (ex.: 1800 ou 1800.5), sem formatação; vazio ou valor que não seja
  número (ou seja negativo) vira null e é listado no final;
- "DESEJO" permanece como texto exatamente como está na planilha (vazio ou "-" vira null).
Cada caso de data inválida é listado no final para que a planilha possa ser corrigida.
"""
import datetime
import json
import re
import sys

import openpyxl

ABA = "BASE"
CAMPOS = ["COLABORADOR", "LOJA", "AQUISITIVO 1", "AQUISITIVO 2", "DT_LIMITE",
          "FUNÇÃO", "ADMISSÃO", "I_FÉRIAS", "F_FÉRIAS", "Salário Base", "DESEJO"]
CAMPOS_NUMERO = ("Salário Base",)
CAMPOS_DATA = ("AQUISITIVO 1", "AQUISITIVO 2", "DT_LIMITE", "ADMISSÃO", "I_FÉRIAS", "F_FÉRIAS")
ERROS_EXCEL = {"#N/A", "#REF!", "#VALUE!", "#DIV/0!", "#NAME?", "#NULL!", "#NUM!"}
VAZIOS = {"", "-", "—"}

origem = sys.argv[1] if len(sys.argv) > 1 else "BASE_FERIAS.xlsx"
destino = "data/ferias.js"

wb = openpyxl.load_workbook(origem, data_only=True)
if ABA not in wb.sheetnames:
    sys.exit(f"Aba '{ABA}' não encontrada. Abas existentes: {', '.join(wb.sheetnames)}")
linhas = list(wb[ABA].iter_rows(values_only=True))
if not linhas:
    sys.exit("A aba BASE está vazia.")
cabecalho = [str(c).strip() if c is not None else "" for c in linhas[0]]

faltando = [c for c in CAMPOS if c not in cabecalho]
if faltando:
    sys.exit(f"Colunas ausentes na planilha: {', '.join(faltando)}")
indices = {c: cabecalho.index(c) for c in CAMPOS}

avisos = []


def vazio(v):
    return v is None or (isinstance(v, str) and (v.strip() in VAZIOS or v.strip() in ERROS_EXCEL))


def converter_data(v):
    """Devolve 'AAAA-MM-DD' ou None se não for uma data válida."""
    if isinstance(v, (datetime.datetime, datetime.date)):
        return v.strftime("%Y-%m-%d")
    if isinstance(v, (int, float)) and not isinstance(v, bool):  # número serial do Excel
        try:
            return (datetime.date(1899, 12, 30) + datetime.timedelta(days=int(v))).strftime("%Y-%m-%d")
        except (OverflowError, ValueError):
            return None
    if isinstance(v, str):
        try:
            return datetime.date.fromisoformat(v.strip()[:10]).strftime("%Y-%m-%d")
        except ValueError:
            return None
    return None


def converter_numero(v):
    """Devolve o número como está na planilha (int/float) ou None se não for um número válido."""
    if isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        return v if v == v and v >= 0 else None  # descarta NaN e negativos
    if isinstance(v, str):
        t = v.strip()
        if re.fullmatch(r"\d+([.,]\d+)?", t):  # "1800", "1800.5" ou "1800,50" (sem separador de milhar)
            return float(t.replace(",", "."))
    return None


def campo(c, v, n):
    if vazio(v):
        return None
    if c in CAMPOS_NUMERO:
        x = converter_numero(v)
        if x is None:
            avisos.append(f"linha {n}: {c} = {v!r} (não é número válido) -> vazio")
        return x
    if c in CAMPOS_DATA:
        d = converter_data(v)
        if d is None:
            avisos.append(f"linha {n}: {c} = {v!r} (não é data válida) -> vazio")
        return d
    if isinstance(v, str):
        return v.strip()
    return v


registros = [
    {c: campo(c, l[i], n) for c, i in indices.items()}
    for n, l in enumerate(linhas[1:], start=2) if any(v is not None for v in l)
]

with open(destino, "w", encoding="utf-8") as f:
    f.write("// Gerado por scripts/xlsx_para_js.py — somente os campos: " + ", ".join(CAMPOS) + ".\n")
    f.write("window.FERIAS_DADOS = ")
    json.dump(registros, f, ensure_ascii=False, indent=1)
    f.write(";\n")

ignoradas = [c for c in cabecalho if c and c not in CAMPOS]
print(f"{len(registros)} registros gravados em {destino}")
if ignoradas:
    print("Colunas ignoradas:", ", ".join(ignoradas))
for a in avisos:
    print("ATENÇÃO —", a)
