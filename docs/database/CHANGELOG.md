# Changelog - Atualização da Modelagem do Banco de Dados

## 📋 Versão 2.0 - Janeiro 2025

### 🔄 Mudanças Principais

#### **Removida Tabela `tbamb_pessoas`**

❌ **Antes**: Sistema criava nova tabela `tbamb_pessoas` para consolidar funcionários e visitantes

✅ **Agora**: Sistema integra-se com tabelas **existentes**:
- `tbfuncionario` (Sistema RH - Fortes AC/EPG)
- `tbvisitante` (Sistema de Controle de Acesso)

---

### 🆕 Nova Estratégia de Foreign Keys

#### Tabela: `tbamb_senhas`

**Antes** (V1.0):
```sql
CREATE TABLE tbamb_senhas (
  id UUID PRIMARY KEY,
  pessoa_id UUID REFERENCES tbamb_pessoas(id),  -- Uma FK única
  ...
);
```

**Agora** (V2.0):
```sql
CREATE TABLE tbamb_senhas (
  id UUID PRIMARY KEY,

  -- Duas FKs opcionais (uma será NULL)
  funcionario_id  BIGINT REFERENCES tbfuncionario(id),
  visitante_id    BIGINT REFERENCES tbvisitante(visitante_id),

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

#### Tabela: `tbamb_prontuarios`

**Mesma estratégia** aplicada:
```sql
CREATE TABLE tbamb_prontuarios (
  id UUID PRIMARY KEY,

  -- Duas FKs opcionais
  funcionario_id  BIGINT REFERENCES tbfuncionario(id),
  visitante_id    BIGINT REFERENCES tbvisitante(visitante_id),
  tipo_pessoa VARCHAR(20),

  -- Constraint de exclusividade
  CONSTRAINT chk_prontuario_pessoa_exclusiva
    CHECK (...),
  ...
);
```

---

### ✨ Vantagens da Nova Abordagem

| Aspecto | Benefício |
|---------|-----------|
| **Duplicação de Dados** | ❌ Eliminada (usa tabelas existentes) |
| **Integridade Referencial** | ✅ Preservada via FKs e constraints |
| **Sincronização** | ✅ Automática (dados vêm do RH e Controle de Acesso) |
| **Manutenção** | ✅ Simplificada (sem necessidade de sincronizar `tbamb_pessoas`) |
| **Queries** | ✅ Polimórficas via `COALESCE` e `LEFT JOIN` |

---

### 📝 Mudanças Detalhadas por Arquivo

#### 1. **00-tabelas-existentes.md** (NOVO)
- ✅ Criado arquivo documentando `tbfuncionario` e `tbvisitante`
- ✅ Conversão de `tbvisitante` (Firebird → PostgreSQL)
- ✅ Queries de integração com sistema ambulatorial
- ✅ View consolidada opcional (`vw_pessoas_ambulatorio`)

#### 2. **01-diagrama-er.md** (ATUALIZADO)
- 🔄 Removida `tbamb_pessoas` do diagrama Mermaid
- ✅ Adicionadas `tbfuncionario` e `tbvisitante`
- ✅ Relacionamentos 1:N de ambas para `tbamb_senhas`
- ✅ Relacionamentos 1:N de ambas para `tbamb_prontuarios`
- ✅ Constraint de exclusividade documentada
- ✅ Diagrama simplificado de módulos atualizado

#### 3. **02-tabelas.md** (REQUER ATUALIZAÇÃO)
- 🔜 Remover seção de `tbamb_pessoas`
- 🔜 Atualizar `tbamb_senhas` com duas FKs
- 🔜 Atualizar `tbamb_prontuarios` com duas FKs
- 🔜 Adicionar exemplos de queries polimórficas

#### 4. **03-scripts-sql.md** (REQUER ATUALIZAÇÃO)
- 🔜 Remover CREATE TABLE `tbamb_pessoas`
- 🔜 Atualizar CREATE TABLE `tbamb_senhas`
- 🔜 Atualizar CREATE TABLE `tbamb_prontuarios`
- 🔜 Adicionar script de criação de `tbvisitante` (PostgreSQL)
- 🔜 Atualizar índices (FKs `funcionario_id` e `visitante_id`)
- 🔜 Atualizar script completo de instalação

#### 5. **04-relacionamentos.md** (REQUER ATUALIZAÇÃO)
- 🔜 Remover relacionamento `tbamb_pessoas → tbamb_senhas`
- 🔜 Adicionar `tbfuncionario → tbamb_senhas` (1:N)
- 🔜 Adicionar `tbvisitante → tbamb_senhas` (1:N)
- 🔜 Remover `tbamb_pessoas → tbamb_prontuarios`
- 🔜 Adicionar `tbfuncionario → tbamb_prontuarios` (1:N)
- 🔜 Adicionar `tbvisitante → tbamb_prontuarios` (1:N)
- 🔜 Atualizar queries de exemplo

#### 6. **05-fluxo-de-dados.md** (REQUER ATUALIZAÇÃO)
- 🔜 Etapa 1 (Geração de Senha): Atualizar queries para buscar em `tbfuncionario` ou `tbvisitante`
- 🔜 Atualizar INSERT em `tbamb_senhas` com duas FKs
- 🔜 Atualizar queries polimórficas com `COALESCE`
- 🔜 Exemplos de JOIN duplo (LEFT JOIN em ambas tabelas)

#### 7. **06-politicas-rls.md** (REQUER ATUALIZAÇÃO)
- 🔜 Remover políticas para `tbamb_pessoas`
- 🔜 Considerar políticas para `tbfuncionario` e `tbvisitante` (se aplicável)
- 🔜 Atualizar funções auxiliares (se necessário)
- 🔜 Políticas RLS podem referenciar ambas tabelas

#### 8. **07-indices-e-otimizacoes.md** (REQUER ATUALIZAÇÃO)
- 🔜 Remover índices de `tbamb_pessoas`
- 🔜 Adicionar índices em `tbamb_senhas.funcionario_id`
- 🔜 Adicionar índices em `tbamb_senhas.visitante_id`
- 🔜 Adicionar índices em `tbamb_prontuarios.funcionario_id`
- 🔜 Adicionar índices em `tbamb_prontuarios.visitante_id`
- 🔜 Atualizar benchmarks (queries polimórficas)

#### 9. **README.md** (REQUER ATUALIZAÇÃO)
- 🔜 Atualizar contagem de tabelas (8 em vez de 9)
- 🔜 Mencionar integração com tabelas existentes
- 🔜 Atualizar instruções de implementação

---

### 🔍 Queries de Migração

#### Buscar Funcionário (Tablet)

```sql
-- V1.0 (tbamb_pessoas)
SELECT * FROM tbamb_pessoas
WHERE matricula_cracha = :matricula AND tipo_pessoa = 'colaborador';

-- V2.0 (tbfuncionario)
SELECT id, nome, emp_codigo || '-' || epg_codigo as matricula
FROM tbfuncionario
WHERE emp_codigo = :emp_codigo AND epg_codigo = :epg_codigo;
```

#### Buscar Visitante (Tablet)

```sql
-- V1.0 (tbamb_pessoas)
SELECT * FROM tbamb_pessoas
WHERE cpf = :cpf AND tipo_pessoa = 'visitante';

-- V2.0 (tbvisitante)
SELECT visitante_id as id, nome, doc_numero
FROM tbvisitante
WHERE doc_numero = :doc_numero AND deletado = 'N';
```

#### Criar Senha (Funcionário)

```sql
-- V1.0
INSERT INTO tbamb_senhas (pessoa_id, numero, tipo, ...)
VALUES (:pessoa_id, :numero, :tipo, ...);

-- V2.0
INSERT INTO tbamb_senhas (funcionario_id, visitante_id, tipo_pessoa, numero, tipo, ...)
VALUES (:funcionario_id, NULL, 'funcionario', :numero, :tipo, ...);
```

#### Criar Senha (Visitante)

```sql
-- V2.0
INSERT INTO tbamb_senhas (funcionario_id, visitante_id, tipo_pessoa, numero, tipo, ...)
VALUES (NULL, :visitante_id, 'visitante', :numero, :tipo, ...);
```

#### Buscar Dados da Pessoa (Polimórfico)

```sql
-- V1.0
SELECT s.*, p.nome
FROM tbamb_senhas s
INNER JOIN tbamb_pessoas p ON p.id = s.pessoa_id;

-- V2.0
SELECT
  s.*,
  COALESCE(f.nome, v.nome) as nome,
  COALESCE(f.emp_codigo || '-' || f.epg_codigo, v.doc_numero) as identificacao,
  s.tipo_pessoa
FROM tbamb_senhas s
LEFT JOIN tbfuncionario f ON f.id = s.funcionario_id
LEFT JOIN tbvisitante v ON v.visitante_id = s.visitante_id;
```

---

### 📊 Comparação de Estrutura

| Aspecto | V1.0 (tbamb_pessoas) | V2.0 (tbfuncionario + tbvisitante) |
|---------|----------------------|-------------------------------------|
| **Tabelas** | 9 tabelas | 8 tabelas ambulatoriais + 2 existentes |
| **Duplicação** | Sim (dados replicados) | Não (referência direta) |
| **Sincronização** | Manual | Automática |
| **FKs em senhas** | 1 FK (`pessoa_id`) | 2 FKs opcionais (`funcionario_id`, `visitante_id`) |
| **Constraint** | Nenhuma | `CHECK` exclusividade |
| **Tipo PK** | UUID (todas) | BIGINT (existentes) + UUID (novas) |
| **Soft Delete** | Campo `ativo` | `deletado` em visitante, sem em funcionário |

---

### 🎯 Impacto no Frontend

#### Mudanças Necessárias no TypeScript

**Antes (V1.0)**:
```typescript
interface Patient {
  id: string;
  employeeBadge: string;  // matrícula
  // ...
}

// Query
const { data } = await supabase
  .from('tbamb_pessoas')
  .select('*')
  .eq('matricula_cracha', employeeBadge);
```

**Agora (V2.0)**:
```typescript
// Buscar funcionário
const { data: funcionario } = await supabase
  .from('tbfuncionario')
  .select('id, nome, emp_codigo, epg_codigo')
  .eq('emp_codigo', empCodigo)
  .eq('epg_codigo', epgCodigo)
  .single();

// Ou buscar visitante
const { data: visitante } = await supabase
  .from('tbvisitante')
  .select('visitante_id, nome, doc_numero')
  .eq('doc_numero', docNumero)
  .eq('deletado', 'N')
  .single();

// Criar senha (funcionário)
await supabase.from('tbamb_senhas').insert({
  funcionario_id: funcionario.id,
  visitante_id: null,
  tipo_pessoa: 'funcionario',
  numero: 'N001',
  tipo: 'normal',
  // ...
});
```

---

### ✅ Checklist de Migração

- [x] **Converter `tbvisitante` Firebird → PostgreSQL**
- [x] **Atualizar diagrama ER**
- [x] **Documentar tabelas existentes**
- [ ] Atualizar scripts SQL principais
- [ ] Atualizar relacionamentos
- [ ] Atualizar fluxo de dados
- [ ] Atualizar políticas RLS
- [ ] Atualizar índices e otimizações
- [ ] Atualizar README principal
- [ ] Testar queries polimórficas
- [ ] Validar constraints de exclusividade

---

### 🚀 Próximos Passos Recomendados

1. **Revisar** o arquivo `00-tabelas-existentes.md`
2. **Executar** script de criação de `tbvisitante` no Supabase
3. **Testar** queries polimórficas
4. **Atualizar** frontend para usar tabelas corretas
5. **Validar** constraints de exclusividade
6. **Implementar** RLS (se necessário em tbfuncionario/tbvisitante)

---

## 📌 Observações Importantes

### Constraint de Exclusividade

⚠️ **CRÍTICO**: As constraints garantem que **apenas UMA FK esteja preenchida**:

```sql
CHECK (
  (funcionario_id IS NOT NULL AND visitante_id IS NULL) OR
  (funcionario_id IS NULL AND visitante_id IS NOT NULL)
)
```

❌ **Inválido**:
```sql
-- Ambas FKs preenchidas
INSERT INTO tbamb_senhas (funcionario_id, visitante_id, ...)
VALUES (123, 456, ...);  -- ERRO: Violação de constraint

-- Nenhuma FK preenchida
INSERT INTO tbamb_senhas (funcionario_id, visitante_id, ...)
VALUES (NULL, NULL, ...);  -- ERRO: Violação de constraint
```

✅ **Válido**:
```sql
-- Apenas funcionario_id
INSERT INTO tbamb_senhas (funcionario_id, visitante_id, tipo_pessoa, ...)
VALUES (123, NULL, 'funcionario', ...);

-- Apenas visitante_id
INSERT INTO tbamb_senhas (funcionario_id, visitante_id, tipo_pessoa, ...)
VALUES (NULL, 456, 'visitante', ...);
```

### Queries Polimórficas

Use **`COALESCE`** para unificar campos:

```sql
SELECT
  COALESCE(f.nome, v.nome) as nome,
  COALESCE(f.cpf, v.doc_numero) as documento,
  COALESCE(f.celular, v.celular) as celular,
  COALESCE(f.foto, v.foto) as foto
FROM tbamb_senhas s
LEFT JOIN tbfuncionario f ON f.id = s.funcionario_id
LEFT JOIN tbvisitante v ON v.visitante_id = s.visitante_id;
```

### Filtro de Visitantes Ativos

⚠️ **SEMPRE** filtrar visitantes deletados:

```sql
SELECT * FROM tbvisitante
WHERE deletado = 'N';  -- Apenas ativos
```

Funcionários não possuem soft delete (gerenciado pelo RH).

---

**Changelog atualizado em 23/01/2025**
🔄 Versão 2.0 - Integração com Tabelas Existentes
