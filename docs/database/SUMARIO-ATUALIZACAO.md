# ✅ Sumário da Atualização - Integração com Tabelas Existentes

## 📊 Status da Atualização

| Item | Status | Arquivo |
|------|--------|---------|
| ✅ Documentação de tabelas existentes | **Completo** | `00-tabelas-existentes.md` |
| ✅ Conversão tbvisitante (Firebird → PostgreSQL) | **Completo** | `00-tabelas-existentes.md` |
| ✅ Diagrama ER atualizado | **Completo** | `01-diagrama-er.md` |
| ✅ Scripts SQL principais | **Completo** | `SQL-ATUALIZADO-RESUMO.sql` |
| ✅ Changelog detalhado | **Completo** | `CHANGELOG.md` |
| ⚠️ Documentação de tabelas (02) | **Pendente** | `02-tabelas.md` |
| ⚠️ Scripts SQL completo (03) | **Pendente** | `03-scripts-sql.md` |
| ⚠️ Relacionamentos (04) | **Pendente** | `04-relacionamentos.md` |
| ⚠️ Fluxo de dados (05) | **Pendente** | `05-fluxo-de-dados.md` |
| ⚠️ Políticas RLS (06) | **Pendente** | `06-politicas-rls.md` |
| ⚠️ Índices e otimizações (07) | **Pendente** | `07-indices-e-otimizacoes.md` |
| ⚠️ README principal | **Pendente** | `README.md` |

---

## 🎯 Mudança Principal

### ❌ ANTES (V1.0)

```
Sistema criava tabela tbamb_pessoas para unificar funcionários e visitantes

┌──────────────┐
│tbamb_pessoas │ (NOVA TABELA - duplicação de dados)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│tbamb_senhas  │
└──────────────┘
```

### ✅ AGORA (V2.0)

```
Sistema integra-se com tabelas EXISTENTES (sem duplicação)

┌──────────────┐          ┌──────────────┐
│tbfuncionario │          │ tbvisitante  │
│(Sistema RH)  │          │(Ctrl Acesso) │
└──────┬───────┘          └──────┬───────┘
       │                         │
       │  FK: funcionario_id     │  FK: visitante_id
       │  (NULL se visitante)    │  (NULL se funcionário)
       │                         │
       └──────────┬──────────────┘
                  │
                  ▼
           ┌──────────────┐
           │tbamb_senhas  │
           │(Eixo Central)│
           └──────────────┘
```

---

## 📁 Arquivos Criados/Atualizados

### ✅ Novos Arquivos

1. **`00-tabelas-existentes.md`** (14 KB)
   - Documentação completa de `tbfuncionario`
   - Conversão de `tbvisitante` (Firebird → PostgreSQL)
   - Queries de integração
   - View consolidada opcional

2. **`CHANGELOG.md`** (11 KB)
   - Histórico detalhado de mudanças
   - Comparação V1.0 vs V2.0
   - Checklist de migração
   - Queries antes/depois

3. **`SQL-ATUALIZADO-RESUMO.sql`** (18 KB)
   - Script SQL completo atualizado
   - Criação de `tbvisitante` (PostgreSQL)
   - Tabelas `tbamb_*` com duas FKs
   - Triggers e funções
   - Dados iniciais (seed)

4. **`SUMARIO-ATUALIZACAO.md`** (este arquivo)
   - Resumo executivo
   - Status da atualização
   - Próximos passos

### ✅ Arquivos Atualizados

1. **`01-diagrama-er.md`** (16 KB)
   - Diagrama Mermaid com `tbfuncionario` e `tbvisitante`
   - Removida `tbamb_pessoas`
   - Constraint de exclusividade documentada
   - Queries polimórficas

---

## 🔑 Mudanças Críticas na Estrutura

### 1. tbamb_senhas

**ANTES**:
```sql
CREATE TABLE tbamb_senhas (
  id UUID PRIMARY KEY,
  pessoa_id UUID REFERENCES tbamb_pessoas(id),
  ...
);
```

**AGORA**:
```sql
CREATE TABLE tbamb_senhas (
  id UUID PRIMARY KEY,

  -- Duas FKs opcionais (UMA será NULL)
  funcionario_id BIGINT REFERENCES tbfuncionario(id),
  visitante_id BIGINT REFERENCES tbvisitante(visitante_id),

  -- Campo discriminador
  tipo_pessoa VARCHAR(20) CHECK (tipo_pessoa IN ('funcionario', 'visitante')),

  -- Constraint de exclusividade
  CONSTRAINT chk_senha_pessoa_exclusiva
    CHECK (
      (funcionario_id IS NOT NULL AND visitante_id IS NULL) OR
      (funcionario_id IS NULL AND visitante_id IS NOT NULL)
    ),
  ...
);
```

### 2. tbamb_prontuarios

**Mesma mudança**: duas FKs opcionais + constraint.

---

## 📋 Checklist de Implementação

### ✅ Fase 1: Modelagem (Completa)
- [x] Documentar tabelas existentes
- [x] Converter `tbvisitante` (Firebird → PostgreSQL)
- [x] Atualizar diagrama ER
- [x] Criar scripts SQL atualizados
- [x] Documentar mudanças (CHANGELOG)

### 🔜 Fase 2: Documentação Detalhada (Pendente)
- [ ] Atualizar `02-tabelas.md` (remover tbamb_pessoas)
- [ ] Atualizar `03-scripts-sql.md` (script completo)
- [ ] Atualizar `04-relacionamentos.md` (novos relacionamentos)
- [ ] Atualizar `05-fluxo-de-dados.md` (queries polimórficas)
- [ ] Atualizar `06-politicas-rls.md` (se aplicável)
- [ ] Atualizar `07-indices-e-otimizacoes.md` (novos índices)
- [ ] Atualizar `README.md` (visão geral)

### 🔜 Fase 3: Implementação no Supabase
- [ ] Criar/validar `tbvisitante` no Supabase
- [ ] Executar script `SQL-ATUALIZADO-RESUMO.sql`
- [ ] Testar constraints de exclusividade
- [ ] Testar queries polimórficas
- [ ] Validar índices

### 🔜 Fase 4: Integração Frontend
- [ ] Atualizar queries do React (buscar em tbfuncionario/tbvisitante)
- [ ] Implementar lógica de duas FKs
- [ ] Testar fluxo completo (tablet → triagem → médico)
- [ ] Validar TV (chamadas em tempo real)

---

## 💡 Queries Principais para Usar

### Buscar Funcionário (Tablet)

```sql
SELECT
  id,
  nome,
  emp_codigo || '-' || epg_codigo as matricula,
  cpf,
  dt_nascimento
FROM tbfuncionario
WHERE emp_codigo = :emp_codigo
  AND epg_codigo = :epg_codigo
LIMIT 1;
```

### Buscar Visitante (Tablet)

```sql
SELECT
  visitante_id as id,
  nome,
  doc_tipo,
  doc_numero,
  celular
FROM tbvisitante
WHERE doc_numero = :doc_numero
  AND deletado = 'N'  -- Apenas ativos
LIMIT 1;
```

### Criar Senha (Funcionário)

```sql
INSERT INTO tbamb_senhas (
  funcionario_id,
  visitante_id,
  tipo_pessoa,
  numero,
  tipo,
  status,
  data_hora_geracao
)
VALUES (
  :funcionario_id,    -- ID do funcionário
  NULL,                -- visitante_id é NULL
  'funcionario',
  :numero,             -- Gerado pela função gerar_proximo_numero_senha()
  :tipo,               -- 'normal' ou 'prioritaria'
  'aguardando',
  NOW()
);
```

### Criar Senha (Visitante)

```sql
INSERT INTO tbamb_senhas (
  funcionario_id,
  visitante_id,
  tipo_pessoa,
  numero,
  tipo,
  status,
  data_hora_geracao
)
VALUES (
  NULL,                -- funcionario_id é NULL
  :visitante_id,       -- ID do visitante
  'visitante',
  :numero,
  :tipo,
  'aguardando',
  NOW()
);
```

### Buscar Senha com Dados da Pessoa (Polimórfico)

```sql
SELECT
  s.*,
  COALESCE(f.nome, v.nome) as pessoa_nome,
  COALESCE(f.emp_codigo || '-' || f.epg_codigo, v.doc_numero) as identificacao,
  COALESCE(f.cpf, v.doc_numero) as documento,
  s.tipo_pessoa
FROM tbamb_senhas s
LEFT JOIN tbfuncionario f ON f.id = s.funcionario_id
LEFT JOIN tbvisitante v ON v.visitante_id = s.visitante_id
WHERE s.numero = :numero
  AND DATE(s.data_hora_geracao) = CURRENT_DATE;
```

### Fila de Espera (Triagem)

```sql
SELECT
  s.id,
  s.numero,
  s.tipo,
  s.status,
  COALESCE(f.nome, v.nome) as pessoa_nome,
  COALESCE(f.emp_codigo || '-' || f.epg_codigo, v.doc_numero) as identificacao,
  s.data_hora_geracao,
  EXTRACT(EPOCH FROM (NOW() - s.data_hora_geracao)) / 60 as minutos_aguardando
FROM tbamb_senhas s
LEFT JOIN tbfuncionario f ON f.id = s.funcionario_id
LEFT JOIN tbvisitante v ON v.visitante_id = s.visitante_id
WHERE s.status = 'aguardando'
ORDER BY
  CASE WHEN s.tipo = 'prioritaria' THEN 0 ELSE 1 END,  -- Prioridade primeiro
  s.data_hora_geracao
LIMIT 10;
```

---

## ⚠️ Pontos de Atenção

### 1. Constraint de Exclusividade

A constraint garante que **APENAS UMA FK** esteja preenchida:

```sql
CHECK (
  (funcionario_id IS NOT NULL AND visitante_id IS NULL) OR
  (funcionario_id IS NULL AND visitante_id IS NOT NULL)
)
```

❌ **Inválido**:
- Ambas FKs preenchidas
- Nenhuma FK preenchida

✅ **Válido**:
- `funcionario_id` preenchido e `visitante_id` NULL
- `funcionario_id` NULL e `visitante_id` preenchido

### 2. Filtrar Visitantes Ativos

**SEMPRE** incluir filtro:
```sql
WHERE deletado = 'N'
```

Funcionários não possuem soft delete (gerido pelo RH).

### 3. Tipo de PK Diferente

| Tabela | PK Tipo |
|--------|---------|
| `tbfuncionario` | **BIGINT** (BIGSERIAL) |
| `tbvisitante` | **BIGINT** (BIGSERIAL) |
| `tbamb_*` | **UUID** (uuid_generate_v4()) |

Usar `BIGINT` nas FKs que referenciam tabelas existentes.

### 4. Queries Polimórficas

Usar `COALESCE` para unificar campos:

```sql
COALESCE(f.nome, v.nome) as nome,
COALESCE(f.cpf, v.doc_numero) as documento
```

Sempre fazer `LEFT JOIN` em **ambas** tabelas:

```sql
LEFT JOIN tbfuncionario f ON f.id = s.funcionario_id
LEFT JOIN tbvisitante v ON v.visitante_id = s.visitante_id
```

---

## 📞 Próximos Passos Recomendados

### Imediatos

1. **Revisar** arquivos criados:
   - `00-tabelas-existentes.md`
   - `CHANGELOG.md`
   - `SQL-ATUALIZADO-RESUMO.sql`

2. **Executar** no Supabase:
   ```sql
   -- Copiar e colar SQL-ATUALIZADO-RESUMO.sql
   ```

3. **Testar** constraints:
   ```sql
   -- Teste 1: FK única funcionário
   INSERT INTO tbamb_senhas (funcionario_id, visitante_id, tipo_pessoa, ...)
   VALUES (123, NULL, 'funcionario', ...);  -- ✅ OK

   -- Teste 2: FK única visitante
   INSERT INTO tbamb_senhas (funcionario_id, visitante_id, tipo_pessoa, ...)
   VALUES (NULL, 456, 'visitante', ...);    -- ✅ OK

   -- Teste 3: Ambas FKs (deve falhar)
   INSERT INTO tbamb_senhas (funcionario_id, visitante_id, tipo_pessoa, ...)
   VALUES (123, 456, 'funcionario', ...);   -- ❌ ERRO
   ```

### Curto Prazo

1. **Decidir se precisa atualizar** os arquivos `02-07`:
   - Se você precisa apenas do script SQL e diagrama ER: **Concluído!**
   - Se você quer documentação completa e detalhada: **Atualizar restantes**

2. **Implementar** no frontend React:
   - Buscar em `tbfuncionario` ou `tbvisitante`
   - Inserir em `tbamb_senhas` com duas FKs
   - Usar queries polimórficas

3. **Validar** fluxo completo:
   - Tablet → Geração de senha
   - Triagem → Chamada e atendimento
   - Médico → Consulta
   - TV → Exibição em tempo real

---

## 📄 Resumo dos Arquivos

| Arquivo | Tamanho | Status | Descrição |
|---------|---------|--------|-----------|
| `00-tabelas-existentes.md` | 14 KB | ✅ Completo | Documentação de tbfuncionario e tbvisitante |
| `01-diagrama-er.md` | 16 KB | ✅ Completo | Diagrama ER atualizado |
| `CHANGELOG.md` | 11 KB | ✅ Completo | Histórico de mudanças V1→V2 |
| `SQL-ATUALIZADO-RESUMO.sql` | 18 KB | ✅ Completo | Script SQL pronto para executar |
| `SUMARIO-ATUALIZACAO.md` | este | ✅ Completo | Este sumário executivo |
| `README.md` | 12 KB | ⚠️ Pendente | Atualizar visão geral |
| `02-tabelas.md` | 28 KB | ⚠️ Pendente | Atualizar descrição de tabelas |
| `03-scripts-sql.md` | 37 KB | ⚠️ Pendente | Atualizar scripts detalhados |
| `04-relacionamentos.md` | 23 KB | ⚠️ Pendente | Atualizar relacionamentos |
| `05-fluxo-de-dados.md` | 26 KB | ⚠️ Pendente | Atualizar queries de fluxo |
| `06-politicas-rls.md` | 26 KB | ⚠️ Pendente | Atualizar RLS (se aplicável) |
| `07-indices-e-otimizacoes.md` | 19 KB | ⚠️ Pendente | Atualizar índices |

---

## ✅ Conclusão

A **modelagem principal está completa e pronta para uso**!

Você tem:
- ✅ **Diagrama ER atualizado** com integração às tabelas existentes
- ✅ **Script SQL completo** pronto para executar no Supabase
- ✅ **Documentação das tabelas existentes** (tbfuncionario e tbvisitante)
- ✅ **Changelog detalhado** com todas as mudanças

Os arquivos `02-07` contêm informações detalhadas sobre cada aspecto (tabelas, relacionamentos, fluxo, RLS, índices), mas ainda **referenc iam a estrutura antiga** (`tbamb_pessoas`). Eles podem ser atualizados posteriormente se você precisar da documentação completa atualizada.

**Para implementar agora**, use:
1. `SQL-ATUALIZADO-RESUMO.sql` - Execute no Supabase
2. `00-tabelas-existentes.md` - Referência de integração
3. `CHANGELOG.md` - Queries de exemplo

🎉 **Pronto para integrar com o frontend!**

---

**Sumário gerado em 23/01/2025**
📅 Versão 2.0 - Integração com Tabelas Existentes
