# Tabelas Existentes no Sistema

## Índice

1. [tbfuncionario](#1-tbfuncionario)
2. [tbvisitante](#2-tbvisitante)
3. [Integração com Sistema Ambulatorial](#3-integração-com-sistema-ambulatorial)

---

## 1. tbfuncionario

**Propósito**: Cadastro de funcionários/colaboradores da empresa, integrado com o sistema Fortes AC (EPG).

**Origem**: Sistema de RH existente

### Estrutura Completa

```sql
CREATE TABLE IF NOT EXISTS public.tbfuncionario (
  id                BIGSERIAL PRIMARY KEY,

  -- Chave natural do Fortes AC (EPG)
  emp_codigo        VARCHAR(4)  NOT NULL,
  epg_codigo        VARCHAR(6)  NOT NULL,

  -- Identificação
  nome              VARCHAR(70) NOT NULL,
  nome_social       VARCHAR(70),
  cpf               VARCHAR(11),
  pis               VARCHAR(11),
  dt_nascimento     DATE,
  sexo              CHAR(1),
  estado_civil      VARCHAR(2),
  mae_nome          VARCHAR(70),
  pai_nome          VARCHAR(70),

  -- Contato
  email             VARCHAR(255),
  ddd               VARCHAR(4),
  fone              VARCHAR(9),
  ddd_alternativo   VARCHAR(4),
  celular           VARCHAR(9),

  -- Endereço
  end_logradouro    VARCHAR(100),
  end_numero        VARCHAR(10),
  end_complemento   VARCHAR(30),
  bairro            VARCHAR(90),
  cep               VARCHAR(8),
  mun_uf_sigla      CHAR(2),
  mun_codigo        VARCHAR(5),

  -- Documentos
  ctps_numero       VARCHAR(11),
  ctps_serie        VARCHAR(6),
  ctps_dv           CHAR(1),
  ctps_uf           CHAR(2),
  ctps_dt_expedicao DATE,
  identidade_numero VARCHAR(15),
  identidade_orgao  VARCHAR(20),
  identidade_dt_exp DATE,
  titulo_eleitor    VARCHAR(13),
  titulo_zona       VARCHAR(3),
  titulo_secao      VARCHAR(4),

  -- Vínculo
  admissao_data     DATE,
  admissao_tipo     VARCHAR(2),
  admissao_vinculo  VARCHAR(2),
  demissao_data     DATE,

  -- PCD / eSocial
  tem_deficiencia               INTEGER,
  preenche_cota_deficiencia     INTEGER,
  deficiencia_fisica            INTEGER,
  deficiencia_visual            INTEGER,
  deficiencia_auditiva          INTEGER,
  deficiencia_mental            INTEGER,
  deficiencia_intelectual       INTEGER,

  -- Mídia
  foto               BYTEA,

  -- Metadados
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE UNIQUE INDEX IF NOT EXISTS tbfuncionario_emp_epg_uk
  ON public.tbfuncionario (emp_codigo, epg_codigo);

CREATE UNIQUE INDEX IF NOT EXISTS tbfuncionario_emp_cpf_uk
  ON public.tbfuncionario (emp_codigo, cpf)
  WHERE cpf IS NOT NULL;

CREATE INDEX IF NOT EXISTS tbfuncionario_nome_idx
  ON public.tbfuncionario (LOWER(nome));

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.tbfuncionario_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS tbfuncionario_set_updated_at_trg ON public.tbfuncionario;
CREATE TRIGGER tbfuncionario_set_updated_at_trg
BEFORE UPDATE ON public.tbfuncionario
FOR EACH ROW EXECUTE FUNCTION public.tbfuncionario_set_updated_at();
```

### Campos Principais para Sistema Ambulatorial

| Campo | Tipo | Uso no Ambulatório |
|-------|------|-------------------|
| `id` | BIGINT | FK em `tbamb_senhas.funcionario_id` |
| `emp_codigo` + `epg_codigo` | VARCHAR | Chave natural (matrícula) |
| `nome` | VARCHAR(70) | Exibição no tablet e TV |
| `cpf` | VARCHAR(11) | Identificação alternativa |
| `dt_nascimento` | DATE | Prontuário médico |
| `foto` | BYTEA | Exibição no sistema |

---

## 2. tbvisitante

**Propósito**: Cadastro de visitantes externos que acessam o ambulatório.

**Origem**: Sistema de controle de acesso

### Estrutura Convertida para PostgreSQL/Supabase

```sql
-- Schema: public
-- Conversão de Firebird para PostgreSQL

CREATE TABLE IF NOT EXISTS public.tbvisitante (
  -- PK (convertido de GENERATOR para BIGSERIAL)
  visitante_id      BIGSERIAL PRIMARY KEY,

  -- Identificação
  nome              VARCHAR(80),
  doc_tipo          VARCHAR(10),    -- 'CPF', 'RG', 'CNH', etc.
  doc_numero        VARCHAR(20),

  -- Contato
  celular           VARCHAR(15),
  fixo              VARCHAR(15),
  whatsapp          VARCHAR(15),

  -- Vínculo
  empresa           VARCHAR(80),    -- Empresa do visitante
  contato_interno   VARCHAR(80),    -- Funcionário que autorizou

  -- Tempo de permanência
  tempo_tipo        VARCHAR(10),    -- 'horas', 'dias', etc.
  tempo_qtde        INTEGER,

  -- Mídia
  foto              BYTEA,          -- BLOB convertido para BYTEA

  -- Auditoria (inclusão)
  data_inc          TIMESTAMPTZ,
  usuario_i         INTEGER,
  usuarionome_i     VARCHAR(30),

  -- Auditoria (alteração)
  data_alt          TIMESTAMPTZ,
  usuario_a         INTEGER,
  usuarionome_a     VARCHAR(30),

  -- Auditoria (exclusão/soft delete)
  data_del          TIMESTAMPTZ,
  usuario_d         INTEGER,
  usuarionome_d     VARCHAR(30),
  deletado          CHAR(1) DEFAULT 'N',

  -- Metadados adicionais (padrão Supabase)
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS tbvisitante_nome_idx
  ON public.tbvisitante (LOWER(nome));

CREATE INDEX IF NOT EXISTS tbvisitante_doc_numero_idx
  ON public.tbvisitante (doc_numero)
  WHERE doc_numero IS NOT NULL;

CREATE INDEX IF NOT EXISTS tbvisitante_deletado_idx
  ON public.tbvisitante (deletado);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.tbvisitante_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS tbvisitante_set_updated_at_trg ON public.tbvisitante;
CREATE TRIGGER tbvisitante_set_updated_at_trg
BEFORE UPDATE ON public.tbvisitante
FOR EACH ROW EXECUTE FUNCTION public.tbvisitante_set_updated_at();

-- Comentários
COMMENT ON TABLE public.tbvisitante IS 'Cadastro de visitantes externos';
COMMENT ON COLUMN public.tbvisitante.deletado IS 'Soft delete: N=ativo, S=deletado';
COMMENT ON COLUMN public.tbvisitante.doc_tipo IS 'Tipo de documento: CPF, RG, CNH, Passaporte, etc.';
COMMENT ON COLUMN public.tbvisitante.tempo_tipo IS 'Unidade de tempo: horas, dias, etc.';
```

### Conversões Realizadas (Firebird → PostgreSQL)

| Firebird | PostgreSQL | Observação |
|----------|------------|------------|
| `GENERATOR GEN_TBVISITANTE_ID` | `BIGSERIAL` | Auto-incremento nativo |
| `INTEGER` (PK) | `BIGSERIAL` | Evita overflow |
| `BLOB SUB_TYPE 0` | `BYTEA` | Armazenamento binário |
| `DATA_LOG (TIMESTAMP)` | `TIMESTAMPTZ` | Timestamp com timezone |
| `USUARIO (VARCHAR(30))` | `VARCHAR(30)` | Mantido |
| `DELETADO (CHAR(1) DEFAULT 'N')` | `CHAR(1) DEFAULT 'N'` | Soft delete |
| Trigger `TBVISITANTE_BI` | Removido | BIGSERIAL já auto-incrementa |

### Campos Principais para Sistema Ambulatorial

| Campo | Tipo | Uso no Ambulatório |
|-------|------|-------------------|
| `visitante_id` | BIGINT | FK em `tbamb_senhas.visitante_id` |
| `nome` | VARCHAR(80) | Exibição no tablet e TV |
| `doc_tipo` + `doc_numero` | VARCHAR | Identificação |
| `celular` | VARCHAR(15) | Contato |
| `empresa` | VARCHAR(80) | Informação adicional |
| `deletado` | CHAR(1) | Filtrar apenas ativos (deletado='N') |

---

## 3. Integração com Sistema Ambulatorial

### Estratégia Escolhida: Duas Foreign Keys

A tabela `tbamb_senhas` terá **duas FKs opcionais** (uma será NULL):

```sql
CREATE TABLE tbamb_senhas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- FKs para tabelas existentes (uma será NULL)
  funcionario_id    BIGINT REFERENCES tbfuncionario(id),
  visitante_id      BIGINT REFERENCES tbvisitante(visitante_id),

  -- Campo discriminador
  tipo_pessoa       VARCHAR(20) NOT NULL CHECK (tipo_pessoa IN ('funcionario', 'visitante')),

  -- Resto dos campos...
  numero            VARCHAR(10) NOT NULL,
  tipo              VARCHAR(20) NOT NULL CHECK (tipo IN ('normal', 'prioritaria')),
  status            VARCHAR(30) NOT NULL DEFAULT 'aguardando',

  -- Constraint: apenas UMA FK deve estar preenchida
  CONSTRAINT chk_pessoa_exclusiva
    CHECK (
      (funcionario_id IS NOT NULL AND visitante_id IS NULL) OR
      (funcionario_id IS NULL AND visitante_id IS NOT NULL)
    )
);
```

### Queries de Integração

#### Buscar Dados da Pessoa (Funcionário)

```sql
SELECT
  f.id,
  f.nome,
  f.emp_codigo || '-' || f.epg_codigo as matricula,
  f.cpf,
  f.dt_nascimento,
  'funcionario' as tipo_pessoa
FROM tbfuncionario f
WHERE f.emp_codigo = :emp_codigo
  AND f.epg_codigo = :epg_codigo;
```

#### Buscar Dados da Pessoa (Visitante)

```sql
SELECT
  v.visitante_id as id,
  v.nome,
  v.doc_numero as documento,
  v.doc_tipo,
  v.celular,
  'visitante' as tipo_pessoa
FROM tbvisitante v
WHERE v.doc_numero = :doc_numero
  AND v.deletado = 'N';  -- Apenas ativos
```

#### Criar Senha (Funcionário)

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
  :funcionario_id,  -- ID do funcionário
  NULL,              -- visitante_id é NULL
  'funcionario',
  :numero,
  :tipo,
  'aguardando',
  NOW()
);
```

#### Criar Senha (Visitante)

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
  NULL,              -- funcionario_id é NULL
  :visitante_id,     -- ID do visitante
  'visitante',
  :numero,
  :tipo,
  'aguardando',
  NOW()
);
```

#### Buscar Senha com Dados da Pessoa (JOIN Polimórfico)

```sql
SELECT
  s.*,
  COALESCE(f.nome, v.nome) as pessoa_nome,
  COALESCE(
    f.emp_codigo || '-' || f.epg_codigo,
    v.doc_numero
  ) as pessoa_identificacao,
  s.tipo_pessoa
FROM tbamb_senhas s
LEFT JOIN tbfuncionario f ON f.id = s.funcionario_id
LEFT JOIN tbvisitante v ON v.visitante_id = s.visitante_id
WHERE s.numero = :numero
  AND DATE(s.data_hora_geracao) = CURRENT_DATE;
```

#### Buscar Histórico de Atendimentos (Funcionário)

```sql
SELECT
  s.numero,
  s.tipo,
  s.status,
  s.data_hora_geracao,
  f.nome,
  f.emp_codigo || '-' || f.epg_codigo as matricula
FROM tbamb_senhas s
INNER JOIN tbfuncionario f ON f.id = s.funcionario_id
WHERE s.funcionario_id = :funcionario_id
ORDER BY s.data_hora_geracao DESC
LIMIT 20;
```

#### Buscar Histórico de Atendimentos (Visitante)

```sql
SELECT
  s.numero,
  s.tipo,
  s.status,
  s.data_hora_geracao,
  v.nome,
  v.doc_numero,
  v.empresa
FROM tbamb_senhas s
INNER JOIN tbvisitante v ON v.visitante_id = s.visitante_id
WHERE s.visitante_id = :visitante_id
  AND v.deletado = 'N'
ORDER BY s.data_hora_geracao DESC
LIMIT 20;
```

### View Consolidada (Opcional)

Para simplificar queries, pode-se criar uma view que unifica funcionários e visitantes:

```sql
CREATE OR REPLACE VIEW vw_pessoas_ambulatorio AS
SELECT
  id as pessoa_id,
  'funcionario' as tipo_pessoa,
  nome,
  emp_codigo || '-' || epg_codigo as identificacao,
  cpf as documento,
  dt_nascimento,
  celular,
  email,
  foto,
  TRUE as ativo  -- tbfuncionario não tem soft delete
FROM tbfuncionario

UNION ALL

SELECT
  visitante_id as pessoa_id,
  'visitante' as tipo_pessoa,
  nome,
  doc_numero as identificacao,
  doc_numero as documento,
  NULL as dt_nascimento,  -- tbvisitante não tem
  celular,
  NULL as email,          -- tbvisitante não tem
  foto,
  CASE WHEN deletado = 'N' THEN TRUE ELSE FALSE END as ativo
FROM tbvisitante;
```

Uso da view:

```sql
-- Buscar qualquer pessoa (funcionário ou visitante)
SELECT * FROM vw_pessoas_ambulatorio
WHERE identificacao = :identificacao
  AND ativo = TRUE;
```

---

## Observações Importantes

### Diferenças entre Funcionário e Visitante

| Característica | tbfuncionario | tbvisitante |
|----------------|---------------|-------------|
| **PK** | `id` (BIGSERIAL) | `visitante_id` (BIGSERIAL) |
| **Identificação** | `emp_codigo` + `epg_codigo` | `doc_numero` |
| **Soft Delete** | ❌ Não possui | ✅ Campo `deletado` |
| **Auditoria** | `created_at`, `updated_at` | Completa (inc/alt/del) |
| **Origem** | Sistema RH (Fortes AC) | Sistema de Acesso |
| **Campos extras** | Vínculo, PCD, Documentos | Empresa, Contato Interno |

### Recomendações

1. **Sempre filtrar visitantes ativos**: `WHERE v.deletado = 'N'`
2. **Usar COALESCE em JOINs polimórficos**: Para unificar campos de funcionários e visitantes
3. **Criar índices nas FKs**: `tbamb_senhas.funcionario_id` e `tbamb_senhas.visitante_id`
4. **Considerar View Materializada**: Se queries de união forem frequentes
5. **Validar constraint exclusiva**: Garantir que apenas uma FK esteja preenchida

---

## Migração de Dados (Se Aplicável)

Se houver dados antigos em `tbamb_pessoas`, migrar para as tabelas corretas:

```sql
-- Migrar colaboradores
INSERT INTO tbfuncionario (emp_codigo, epg_codigo, nome, cpf, ...)
SELECT
  SUBSTRING(matricula_cracha, 1, 4),
  SUBSTRING(matricula_cracha, 5, 6),
  nome,
  cpf,
  ...
FROM tbamb_pessoas
WHERE tipo_pessoa = 'colaborador';

-- Migrar visitantes
INSERT INTO tbvisitante (nome, doc_tipo, doc_numero, celular, deletado)
SELECT
  nome,
  'CPF',
  cpf,
  telefone,
  CASE WHEN ativo THEN 'N' ELSE 'S' END
FROM tbamb_pessoas
WHERE tipo_pessoa = 'visitante';

-- Atualizar FKs em tbamb_senhas
UPDATE tbamb_senhas s
SET funcionario_id = f.id
FROM tbamb_pessoas p
INNER JOIN tbfuncionario f ON f.cpf = p.cpf
WHERE s.pessoa_id = p.id
  AND p.tipo_pessoa = 'colaborador';

UPDATE tbamb_senhas s
SET visitante_id = v.visitante_id
FROM tbamb_pessoas p
INNER JOIN tbvisitante v ON v.doc_numero = p.cpf
WHERE s.pessoa_id = p.id
  AND p.tipo_pessoa = 'visitante';

-- Remover coluna pessoa_id antiga (após validação)
-- ALTER TABLE tbamb_senhas DROP COLUMN pessoa_id;
```

---

**Documentação atualizada com base nas tabelas existentes do sistema**
📅 Janeiro 2025 | 🔄 Integração com tbfuncionario e tbvisitante
