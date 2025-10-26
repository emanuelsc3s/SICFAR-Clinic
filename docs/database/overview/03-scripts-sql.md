# Scripts SQL - Criação do Banco de Dados

## Índice

1. [Extensões e Configurações Iniciais](#1-extensões-e-configurações-iniciais)
2. [Criação das Tabelas](#2-criação-das-tabelas)
3. [Criação de Índices](#3-criação-de-índices)
4. [Triggers e Funções](#4-triggers-e-funções)
5. [Dados Iniciais (Seed)](#5-dados-iniciais-seed)
6. [Script Completo de Instalação](#6-script-completo-de-instalação)

---

## 1. Extensões e Configurações Iniciais

Antes de criar as tabelas, habilite as extensões necessárias do PostgreSQL:

```sql
-- Habilitar extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Habilitar extensão para funções de data/hora
CREATE EXTENSION IF NOT EXISTS "btree_gist";
```

---

## 2. Criação das Tabelas

### 2.1. tbamb_pessoas

```sql
CREATE TABLE tbamb_pessoas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_pessoa VARCHAR(20) NOT NULL CHECK (tipo_pessoa IN ('colaborador', 'visitante')),
    matricula_cracha VARCHAR(50),
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14),
    data_nascimento DATE,
    telefone VARCHAR(20),
    email VARCHAR(255),
    endereco TEXT,
    contato_emergencia_nome VARCHAR(255),
    contato_emergencia_telefone VARCHAR(20),
    contato_emergencia_relacao VARCHAR(50),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_tbamb_pessoas_colaborador_matricula
        CHECK (tipo_pessoa != 'colaborador' OR matricula_cracha IS NOT NULL),
    CONSTRAINT chk_tbamb_pessoas_visitante_cpf
        CHECK (tipo_pessoa != 'visitante' OR cpf IS NOT NULL),
    CONSTRAINT unique_tbamb_pessoas_cpf
        UNIQUE (cpf),
    CONSTRAINT unique_tbamb_pessoas_matricula
        UNIQUE (matricula_cracha)
);

COMMENT ON TABLE tbamb_pessoas IS 'Cadastro de pessoas (colaboradores e visitantes) que utilizam o sistema ambulatorial';
COMMENT ON COLUMN tbamb_pessoas.tipo_pessoa IS 'Tipo de pessoa: colaborador (usa matrícula) ou visitante (usa CPF)';
COMMENT ON COLUMN tbamb_pessoas.matricula_cracha IS 'Matrícula ou número do crachá - obrigatório para colaboradores';
COMMENT ON COLUMN tbamb_pessoas.cpf IS 'CPF no formato 000.000.000-00 - obrigatório para visitantes';
```

### 2.2. tbamb_senhas

```sql
CREATE TABLE tbamb_senhas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pessoa_id UUID NOT NULL REFERENCES tbamb_pessoas(id) ON DELETE RESTRICT,
    numero VARCHAR(10) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('normal', 'prioritaria')),
    status VARCHAR(30) NOT NULL DEFAULT 'aguardando'
        CHECK (status IN ('aguardando', 'em_triagem', 'aguardando_medico', 'em_atendimento', 'concluido', 'cancelado')),
    data_hora_geracao TIMESTAMP NOT NULL DEFAULT NOW(),
    data_hora_chamada_triagem TIMESTAMP,
    data_hora_inicio_triagem TIMESTAMP,
    data_hora_fim_triagem TIMESTAMP,
    data_hora_chamada_medico TIMESTAMP,
    data_hora_inicio_atendimento TIMESTAMP,
    data_hora_fim_atendimento TIMESTAMP,
    data_hora_cancelamento TIMESTAMP,
    motivo_cancelamento VARCHAR(255),
    tempo_espera_triagem_min INTEGER,
    tempo_espera_medico_min INTEGER,
    tempo_total_atendimento_min INTEGER,
    tablet_gerador VARCHAR(100),
    impresso BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Constraints de validação de timestamps
    CONSTRAINT chk_tbamb_senhas_timestamp_triagem
        CHECK (data_hora_chamada_triagem IS NULL OR data_hora_chamada_triagem >= data_hora_geracao),
    CONSTRAINT chk_tbamb_senhas_timestamp_inicio_triagem
        CHECK (data_hora_inicio_triagem IS NULL OR data_hora_inicio_triagem >= data_hora_chamada_triagem),
    CONSTRAINT chk_tbamb_senhas_timestamp_fim_triagem
        CHECK (data_hora_fim_triagem IS NULL OR data_hora_fim_triagem >= data_hora_inicio_triagem),
    CONSTRAINT chk_tbamb_senhas_timestamp_chamada_medico
        CHECK (data_hora_chamada_medico IS NULL OR data_hora_chamada_medico >= data_hora_fim_triagem)
);

COMMENT ON TABLE tbamb_senhas IS 'Registro completo de senhas geradas no sistema com histórico de estados e tempos';
COMMENT ON COLUMN tbamb_senhas.numero IS 'Número da senha no formato N001, N002, P001, P002, etc.';
COMMENT ON COLUMN tbamb_senhas.status IS 'Status atual da senha no fluxo de atendimento';
COMMENT ON COLUMN tbamb_senhas.tempo_espera_triagem_min IS 'Tempo de espera entre geração e início da triagem (calculado automaticamente)';
COMMENT ON COLUMN tbamb_senhas.tempo_espera_medico_min IS 'Tempo de espera entre fim da triagem e início do atendimento médico';
COMMENT ON COLUMN tbamb_senhas.tempo_total_atendimento_min IS 'Tempo total desde geração até finalização do atendimento';
```

### 2.3. tbamb_triagem

```sql
CREATE TABLE tbamb_triagem (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    senha_id UUID NOT NULL UNIQUE REFERENCES tbamb_senhas(id) ON DELETE RESTRICT,
    atendente_triagem VARCHAR(255) NOT NULL,
    sala_triagem VARCHAR(50),
    observacoes TEXT,
    pressao_arterial VARCHAR(20),
    frequencia_cardiaca VARCHAR(20),
    temperatura VARCHAR(20),
    frequencia_respiratoria VARCHAR(20),
    saturacao_oxigenio VARCHAR(20),
    peso VARCHAR(20),
    altura VARCHAR(20),
    queixa_principal TEXT,
    prioridade_atribuida VARCHAR(20) CHECK (prioridade_atribuida IN ('baixa', 'media', 'alta', 'urgente')),
    data_hora_inicio TIMESTAMP NOT NULL,
    data_hora_fim TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_tbamb_triagem_timestamp
        CHECK (data_hora_fim IS NULL OR data_hora_fim >= data_hora_inicio)
);

COMMENT ON TABLE tbamb_triagem IS 'Dados coletados durante a triagem inicial do paciente';
COMMENT ON COLUMN tbamb_triagem.senha_id IS 'Referência única à senha (relação 1:1)';
COMMENT ON COLUMN tbamb_triagem.prioridade_atribuida IS 'Prioridade atribuída pela triagem (pode ser diferente do tipo da senha)';
```

### 2.4. tbamb_consultorio

```sql
CREATE TABLE tbamb_consultorio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero VARCHAR(10) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    localizacao VARCHAR(255),
    especialidade VARCHAR(100),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE tbamb_consultorio IS 'Cadastro dos consultórios médicos disponíveis no ambulatório';
COMMENT ON COLUMN tbamb_consultorio.numero IS 'Número do consultório (único)';
COMMENT ON COLUMN tbamb_consultorio.ativo IS 'Se o consultório está ativo para receber atendimentos';
```

### 2.5. tbamb_medicos

```sql
CREATE TABLE tbamb_medicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    crm VARCHAR(20) NOT NULL,
    crm_uf VARCHAR(2) NOT NULL,
    especialidade VARCHAR(100),
    telefone VARCHAR(20),
    email VARCHAR(255),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Constraint única composta
    CONSTRAINT unique_tbamb_medicos_crm UNIQUE (crm, crm_uf)
);

COMMENT ON TABLE tbamb_medicos IS 'Cadastro dos médicos que realizam atendimentos no ambulatório';
COMMENT ON COLUMN tbamb_medicos.crm IS 'Número do CRM do médico';
COMMENT ON COLUMN tbamb_medicos.crm_uf IS 'UF do CRM (SP, RJ, MG, etc.)';
```

### 2.6. tbamb_atendimentos

```sql
CREATE TABLE tbamb_atendimentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    senha_id UUID NOT NULL REFERENCES tbamb_senhas(id) ON DELETE RESTRICT,
    consultorio_id UUID NOT NULL REFERENCES tbamb_consultorio(id) ON DELETE RESTRICT,
    medico_id UUID NOT NULL REFERENCES tbamb_medicos(id) ON DELETE RESTRICT,
    data_hora_chamada TIMESTAMP NOT NULL,
    data_hora_inicio TIMESTAMP,
    data_hora_fim TIMESTAMP,
    duracao_minutos INTEGER,
    observacoes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'aguardando'
        CHECK (status IN ('aguardando', 'em_andamento', 'concluido', 'cancelado')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_tbamb_atendimentos_timestamp_inicio
        CHECK (data_hora_inicio IS NULL OR data_hora_inicio >= data_hora_chamada),
    CONSTRAINT chk_tbamb_atendimentos_timestamp_fim
        CHECK (data_hora_fim IS NULL OR data_hora_fim >= data_hora_inicio)
);

COMMENT ON TABLE tbamb_atendimentos IS 'Registro de atendimentos médicos realizados nos consultórios';
COMMENT ON COLUMN tbamb_atendimentos.duracao_minutos IS 'Duração do atendimento em minutos (calculado automaticamente)';
```

### 2.7. tbamb_chamadas

```sql
CREATE TABLE tbamb_chamadas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    senha_id UUID NOT NULL REFERENCES tbamb_senhas(id) ON DELETE RESTRICT,
    tipo_chamada VARCHAR(20) NOT NULL CHECK (tipo_chamada IN ('triagem', 'consultorio')),
    numero_senha VARCHAR(10) NOT NULL,
    tipo_senha VARCHAR(20) NOT NULL CHECK (tipo_senha IN ('normal', 'prioritaria')),
    local_chamada VARCHAR(100) NOT NULL,
    nome_medico VARCHAR(255),
    data_hora_chamada TIMESTAMP NOT NULL DEFAULT NOW(),
    exibido_tv BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE tbamb_chamadas IS 'Histórico de chamadas para exibição na TV e auditoria (append-only)';
COMMENT ON COLUMN tbamb_chamadas.numero_senha IS 'Número da senha (desnormalizado para performance)';
COMMENT ON COLUMN tbamb_chamadas.tipo_senha IS 'Tipo da senha (desnormalizado para performance)';
COMMENT ON COLUMN tbamb_chamadas.nome_medico IS 'Nome do médico (apenas para tipo_chamada = consultorio)';
COMMENT ON COLUMN tbamb_chamadas.exibido_tv IS 'Marca se a chamada já foi processada pela tela de TV';
```

### 2.8. tbamb_prontuarios

```sql
CREATE TABLE tbamb_prontuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pessoa_id UUID NOT NULL REFERENCES tbamb_pessoas(id) ON DELETE RESTRICT,
    atendimento_id UUID REFERENCES tbamb_atendimentos(id) ON DELETE RESTRICT,
    medico_id UUID NOT NULL REFERENCES tbamb_medicos(id) ON DELETE RESTRICT,
    data_atendimento DATE NOT NULL,
    queixa_principal TEXT,
    historia_doenca_atual TEXT,
    antecedentes_pessoais TEXT,
    antecedentes_familiares TEXT,
    medicacoes_em_uso TEXT,
    alergias TEXT,
    historia_social TEXT,
    exame_fisico TEXT,
    diagnostico TEXT,
    tratamento TEXT,
    acompanhamento TEXT,
    observacoes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE tbamb_prontuarios IS 'Prontuários eletrônicos com dados completos de consultas médicas';
COMMENT ON COLUMN tbamb_prontuarios.atendimento_id IS 'Referência ao atendimento (opcional, pode ser prontuário avulso)';
```

### 2.9. tbamb_prescricoes

```sql
CREATE TABLE tbamb_prescricoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prontuario_id UUID NOT NULL REFERENCES tbamb_prontuarios(id) ON DELETE CASCADE,
    medicamento VARCHAR(255) NOT NULL,
    dosagem VARCHAR(50) NOT NULL,
    frequencia VARCHAR(50) NOT NULL,
    duracao VARCHAR(50) NOT NULL,
    instrucoes TEXT,
    ordem INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE tbamb_prescricoes IS 'Prescrições médicas detalhadas vinculadas a prontuários';
COMMENT ON COLUMN tbamb_prescricoes.ordem IS 'Ordem de exibição na receita médica';
```

---

## 3. Criação de Índices

### 3.1. Índices para tbamb_pessoas

```sql
CREATE INDEX idx_tbamb_pessoas_tipo ON tbamb_pessoas(tipo_pessoa);
CREATE INDEX idx_tbamb_pessoas_ativo ON tbamb_pessoas(ativo);
CREATE INDEX idx_tbamb_pessoas_nome ON tbamb_pessoas(nome);
```

### 3.2. Índices para tbamb_senhas

```sql
CREATE INDEX idx_tbamb_senhas_pessoa ON tbamb_senhas(pessoa_id);
CREATE INDEX idx_tbamb_senhas_status ON tbamb_senhas(status);
CREATE INDEX idx_tbamb_senhas_tipo ON tbamb_senhas(tipo);
CREATE INDEX idx_tbamb_senhas_numero ON tbamb_senhas(numero);
CREATE INDEX idx_tbamb_senhas_data_geracao ON tbamb_senhas(data_hora_geracao);
CREATE INDEX idx_tbamb_senhas_status_tipo ON tbamb_senhas(status, tipo); -- Índice composto para filas
```

### 3.3. Índices para tbamb_triagem

```sql
CREATE INDEX idx_tbamb_triagem_atendente ON tbamb_triagem(atendente_triagem);
CREATE INDEX idx_tbamb_triagem_data ON tbamb_triagem(data_hora_inicio);
CREATE INDEX idx_tbamb_triagem_prioridade ON tbamb_triagem(prioridade_atribuida);
```

### 3.4. Índices para tbamb_consultorio

```sql
CREATE INDEX idx_tbamb_consultorio_ativo ON tbamb_consultorio(ativo);
```

### 3.5. Índices para tbamb_medicos

```sql
CREATE INDEX idx_tbamb_medicos_ativo ON tbamb_medicos(ativo);
CREATE INDEX idx_tbamb_medicos_nome ON tbamb_medicos(nome);
```

### 3.6. Índices para tbamb_atendimentos

```sql
CREATE INDEX idx_tbamb_atendimentos_senha ON tbamb_atendimentos(senha_id);
CREATE INDEX idx_tbamb_atendimentos_consultorio ON tbamb_atendimentos(consultorio_id);
CREATE INDEX idx_tbamb_atendimentos_medico ON tbamb_atendimentos(medico_id);
CREATE INDEX idx_tbamb_atendimentos_status ON tbamb_atendimentos(status);
CREATE INDEX idx_tbamb_atendimentos_data_chamada ON tbamb_atendimentos(data_hora_chamada);
```

### 3.7. Índices para tbamb_chamadas

```sql
CREATE INDEX idx_tbamb_chamadas_senha ON tbamb_chamadas(senha_id);
CREATE INDEX idx_tbamb_chamadas_tipo ON tbamb_chamadas(tipo_chamada);
CREATE INDEX idx_tbamb_chamadas_data ON tbamb_chamadas(data_hora_chamada DESC);
CREATE INDEX idx_tbamb_chamadas_exibido ON tbamb_chamadas(exibido_tv);
```

### 3.8. Índices para tbamb_prontuarios

```sql
CREATE INDEX idx_tbamb_prontuarios_pessoa ON tbamb_prontuarios(pessoa_id);
CREATE INDEX idx_tbamb_prontuarios_medico ON tbamb_prontuarios(medico_id);
CREATE INDEX idx_tbamb_prontuarios_atendimento ON tbamb_prontuarios(atendimento_id);
CREATE INDEX idx_tbamb_prontuarios_data ON tbamb_prontuarios(data_atendimento DESC);
```

### 3.9. Índices para tbamb_prescricoes

```sql
CREATE INDEX idx_tbamb_prescricoes_prontuario ON tbamb_prescricoes(prontuario_id);
CREATE INDEX idx_tbamb_prescricoes_ordem ON tbamb_prescricoes(prontuario_id, ordem);
```

---

## 4. Triggers e Funções

### 4.1. Função para atualizar updated_at automaticamente

```sql
-- Função genérica para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Atualiza automaticamente o campo updated_at ao modificar um registro';
```

### 4.2. Triggers para updated_at

```sql
-- Trigger para tbamb_pessoas
CREATE TRIGGER trigger_tbamb_pessoas_updated_at
    BEFORE UPDATE ON tbamb_pessoas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para tbamb_senhas
CREATE TRIGGER trigger_tbamb_senhas_updated_at
    BEFORE UPDATE ON tbamb_senhas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para tbamb_triagem
CREATE TRIGGER trigger_tbamb_triagem_updated_at
    BEFORE UPDATE ON tbamb_triagem
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para tbamb_consultorio
CREATE TRIGGER trigger_tbamb_consultorio_updated_at
    BEFORE UPDATE ON tbamb_consultorio
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para tbamb_medicos
CREATE TRIGGER trigger_tbamb_medicos_updated_at
    BEFORE UPDATE ON tbamb_medicos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para tbamb_atendimentos
CREATE TRIGGER trigger_tbamb_atendimentos_updated_at
    BEFORE UPDATE ON tbamb_atendimentos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para tbamb_prontuarios
CREATE TRIGGER trigger_tbamb_prontuarios_updated_at
    BEFORE UPDATE ON tbamb_prontuarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 4.3. Função para calcular tempos de espera automaticamente

```sql
-- Função para calcular tempos de espera na tabela tbamb_senhas
CREATE OR REPLACE FUNCTION calcular_tempos_senha()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular tempo de espera para triagem (em minutos)
    IF NEW.data_hora_inicio_triagem IS NOT NULL AND NEW.data_hora_geracao IS NOT NULL THEN
        NEW.tempo_espera_triagem_min := EXTRACT(EPOCH FROM (NEW.data_hora_inicio_triagem - NEW.data_hora_geracao)) / 60;
    END IF;

    -- Calcular tempo de espera para médico (em minutos)
    IF NEW.data_hora_inicio_atendimento IS NOT NULL AND NEW.data_hora_fim_triagem IS NOT NULL THEN
        NEW.tempo_espera_medico_min := EXTRACT(EPOCH FROM (NEW.data_hora_inicio_atendimento - NEW.data_hora_fim_triagem)) / 60;
    END IF;

    -- Calcular tempo total do atendimento (em minutos)
    IF NEW.data_hora_fim_atendimento IS NOT NULL AND NEW.data_hora_geracao IS NOT NULL THEN
        NEW.tempo_total_atendimento_min := EXTRACT(EPOCH FROM (NEW.data_hora_fim_atendimento - NEW.data_hora_geracao)) / 60;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_tempos_senha() IS 'Calcula automaticamente os tempos de espera e atendimento';

-- Trigger para calcular tempos
CREATE TRIGGER trigger_calcular_tempos_senha
    BEFORE INSERT OR UPDATE ON tbamb_senhas
    FOR EACH ROW
    EXECUTE FUNCTION calcular_tempos_senha();
```

### 4.4. Função para calcular duração de atendimento

```sql
-- Função para calcular duração do atendimento em minutos
CREATE OR REPLACE FUNCTION calcular_duracao_atendimento()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular duração em minutos
    IF NEW.data_hora_fim IS NOT NULL AND NEW.data_hora_inicio IS NOT NULL THEN
        NEW.duracao_minutos := EXTRACT(EPOCH FROM (NEW.data_hora_fim - NEW.data_hora_inicio)) / 60;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_duracao_atendimento() IS 'Calcula automaticamente a duração do atendimento em minutos';

-- Trigger para calcular duração
CREATE TRIGGER trigger_calcular_duracao_atendimento
    BEFORE INSERT OR UPDATE ON tbamb_atendimentos
    FOR EACH ROW
    EXECUTE FUNCTION calcular_duracao_atendimento();
```

### 4.5. Função para gerar próximo número de senha

```sql
-- Função para gerar próximo número de senha do dia
CREATE OR REPLACE FUNCTION gerar_proximo_numero_senha(p_tipo VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    v_prefix VARCHAR(1);
    v_count INTEGER;
    v_numero VARCHAR(10);
    v_data_inicio TIMESTAMP;
    v_data_fim TIMESTAMP;
BEGIN
    -- Definir prefixo
    v_prefix := CASE WHEN p_tipo = 'prioritaria' THEN 'P' ELSE 'N' END;

    -- Definir range do dia atual (00:00:00 até 23:59:59)
    v_data_inicio := DATE_TRUNC('day', NOW());
    v_data_fim := v_data_inicio + INTERVAL '1 day';

    -- Contar senhas do tipo hoje
    SELECT COUNT(*) INTO v_count
    FROM tbamb_senhas
    WHERE tipo = p_tipo
      AND data_hora_geracao >= v_data_inicio
      AND data_hora_geracao < v_data_fim;

    -- Gerar número (próximo da contagem)
    v_numero := v_prefix || LPAD((v_count + 1)::TEXT, 3, '0');

    RETURN v_numero;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION gerar_proximo_numero_senha(VARCHAR) IS 'Gera o próximo número de senha do dia (reseta diariamente)';
```

---

## 5. Dados Iniciais (Seed)

### 5.1. Seed de Consultórios

```sql
INSERT INTO tbamb_consultorio (numero, nome, localizacao, especialidade, ativo)
VALUES
    ('1', 'Consultório 1', 'Ala A, Sala 101', 'Clínica Geral', TRUE),
    ('2', 'Consultório 2', 'Ala A, Sala 102', 'Clínica Geral', TRUE),
    ('3', 'Consultório 3', 'Ala B, Sala 201', 'Cardiologia', TRUE),
    ('4', 'Consultório 4', 'Ala B, Sala 202', 'Ortopedia', TRUE),
    ('5', 'Consultório 5', 'Ala C, Sala 301', 'Pediatria', TRUE);
```

### 5.2. Seed de Médicos (Exemplo)

```sql
INSERT INTO tbamb_medicos (nome, crm, crm_uf, especialidade, telefone, email, ativo)
VALUES
    ('Dr. Carlos Alberto Silva', '123456', 'SP', 'Clínica Geral', '(11) 99999-1111', 'carlos.silva@clinic.com', TRUE),
    ('Dra. Marina Costa', '654321', 'SP', 'Cardiologia', '(11) 99999-2222', 'marina.costa@clinic.com', TRUE),
    ('Dr. Roberto Oliveira', '789012', 'SP', 'Ortopedia', '(11) 99999-3333', 'roberto.oliveira@clinic.com', TRUE),
    ('Dra. Paula Mendes', '345678', 'SP', 'Pediatria', '(11) 99999-4444', 'paula.mendes@clinic.com', TRUE);
```

---

## 6. Script Completo de Instalação

```sql
-- ========================================
-- SICFAR-CLINIC - DATABASE SETUP COMPLETO
-- ========================================
-- Este script cria toda a estrutura do banco de dados
-- Executar no Supabase SQL Editor

-- 1. EXTENSÕES
-- ========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 2. TABELAS
-- ========================================

-- 2.1. tbamb_pessoas
CREATE TABLE tbamb_pessoas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_pessoa VARCHAR(20) NOT NULL CHECK (tipo_pessoa IN ('colaborador', 'visitante')),
    matricula_cracha VARCHAR(50),
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14),
    data_nascimento DATE,
    telefone VARCHAR(20),
    email VARCHAR(255),
    endereco TEXT,
    contato_emergencia_nome VARCHAR(255),
    contato_emergencia_telefone VARCHAR(20),
    contato_emergencia_relacao VARCHAR(50),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_tbamb_pessoas_colaborador_matricula CHECK (tipo_pessoa != 'colaborador' OR matricula_cracha IS NOT NULL),
    CONSTRAINT chk_tbamb_pessoas_visitante_cpf CHECK (tipo_pessoa != 'visitante' OR cpf IS NOT NULL),
    CONSTRAINT unique_tbamb_pessoas_cpf UNIQUE (cpf),
    CONSTRAINT unique_tbamb_pessoas_matricula UNIQUE (matricula_cracha)
);

-- 2.2. tbamb_senhas
CREATE TABLE tbamb_senhas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pessoa_id UUID NOT NULL REFERENCES tbamb_pessoas(id) ON DELETE RESTRICT,
    numero VARCHAR(10) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('normal', 'prioritaria')),
    status VARCHAR(30) NOT NULL DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'em_triagem', 'aguardando_medico', 'em_atendimento', 'concluido', 'cancelado')),
    data_hora_geracao TIMESTAMP NOT NULL DEFAULT NOW(),
    data_hora_chamada_triagem TIMESTAMP,
    data_hora_inicio_triagem TIMESTAMP,
    data_hora_fim_triagem TIMESTAMP,
    data_hora_chamada_medico TIMESTAMP,
    data_hora_inicio_atendimento TIMESTAMP,
    data_hora_fim_atendimento TIMESTAMP,
    data_hora_cancelamento TIMESTAMP,
    motivo_cancelamento VARCHAR(255),
    tempo_espera_triagem_min INTEGER,
    tempo_espera_medico_min INTEGER,
    tempo_total_atendimento_min INTEGER,
    tablet_gerador VARCHAR(100),
    impresso BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_tbamb_senhas_timestamp_triagem CHECK (data_hora_chamada_triagem IS NULL OR data_hora_chamada_triagem >= data_hora_geracao),
    CONSTRAINT chk_tbamb_senhas_timestamp_inicio_triagem CHECK (data_hora_inicio_triagem IS NULL OR data_hora_inicio_triagem >= data_hora_chamada_triagem),
    CONSTRAINT chk_tbamb_senhas_timestamp_fim_triagem CHECK (data_hora_fim_triagem IS NULL OR data_hora_fim_triagem >= data_hora_inicio_triagem),
    CONSTRAINT chk_tbamb_senhas_timestamp_chamada_medico CHECK (data_hora_chamada_medico IS NULL OR data_hora_chamada_medico >= data_hora_fim_triagem)
);

-- 2.3. tbamb_triagem
CREATE TABLE tbamb_triagem (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    senha_id UUID NOT NULL UNIQUE REFERENCES tbamb_senhas(id) ON DELETE RESTRICT,
    atendente_triagem VARCHAR(255) NOT NULL,
    sala_triagem VARCHAR(50),
    observacoes TEXT,
    pressao_arterial VARCHAR(20),
    frequencia_cardiaca VARCHAR(20),
    temperatura VARCHAR(20),
    frequencia_respiratoria VARCHAR(20),
    saturacao_oxigenio VARCHAR(20),
    peso VARCHAR(20),
    altura VARCHAR(20),
    queixa_principal TEXT,
    prioridade_atribuida VARCHAR(20) CHECK (prioridade_atribuida IN ('baixa', 'media', 'alta', 'urgente')),
    data_hora_inicio TIMESTAMP NOT NULL,
    data_hora_fim TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_tbamb_triagem_timestamp CHECK (data_hora_fim IS NULL OR data_hora_fim >= data_hora_inicio)
);

-- 2.4. tbamb_consultorio
CREATE TABLE tbamb_consultorio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero VARCHAR(10) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    localizacao VARCHAR(255),
    especialidade VARCHAR(100),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2.5. tbamb_medicos
CREATE TABLE tbamb_medicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    crm VARCHAR(20) NOT NULL,
    crm_uf VARCHAR(2) NOT NULL,
    especialidade VARCHAR(100),
    telefone VARCHAR(20),
    email VARCHAR(255),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tbamb_medicos_crm UNIQUE (crm, crm_uf)
);

-- 2.6. tbamb_atendimentos
CREATE TABLE tbamb_atendimentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    senha_id UUID NOT NULL REFERENCES tbamb_senhas(id) ON DELETE RESTRICT,
    consultorio_id UUID NOT NULL REFERENCES tbamb_consultorio(id) ON DELETE RESTRICT,
    medico_id UUID NOT NULL REFERENCES tbamb_medicos(id) ON DELETE RESTRICT,
    data_hora_chamada TIMESTAMP NOT NULL,
    data_hora_inicio TIMESTAMP,
    data_hora_fim TIMESTAMP,
    duracao_minutos INTEGER,
    observacoes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'em_andamento', 'concluido', 'cancelado')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_tbamb_atendimentos_timestamp_inicio CHECK (data_hora_inicio IS NULL OR data_hora_inicio >= data_hora_chamada),
    CONSTRAINT chk_tbamb_atendimentos_timestamp_fim CHECK (data_hora_fim IS NULL OR data_hora_fim >= data_hora_inicio)
);

-- 2.7. tbamb_chamadas
CREATE TABLE tbamb_chamadas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    senha_id UUID NOT NULL REFERENCES tbamb_senhas(id) ON DELETE RESTRICT,
    tipo_chamada VARCHAR(20) NOT NULL CHECK (tipo_chamada IN ('triagem', 'consultorio')),
    numero_senha VARCHAR(10) NOT NULL,
    tipo_senha VARCHAR(20) NOT NULL CHECK (tipo_senha IN ('normal', 'prioritaria')),
    local_chamada VARCHAR(100) NOT NULL,
    nome_medico VARCHAR(255),
    data_hora_chamada TIMESTAMP NOT NULL DEFAULT NOW(),
    exibido_tv BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2.8. tbamb_prontuarios
CREATE TABLE tbamb_prontuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pessoa_id UUID NOT NULL REFERENCES tbamb_pessoas(id) ON DELETE RESTRICT,
    atendimento_id UUID REFERENCES tbamb_atendimentos(id) ON DELETE RESTRICT,
    medico_id UUID NOT NULL REFERENCES tbamb_medicos(id) ON DELETE RESTRICT,
    data_atendimento DATE NOT NULL,
    queixa_principal TEXT,
    historia_doenca_atual TEXT,
    antecedentes_pessoais TEXT,
    antecedentes_familiares TEXT,
    medicacoes_em_uso TEXT,
    alergias TEXT,
    historia_social TEXT,
    exame_fisico TEXT,
    diagnostico TEXT,
    tratamento TEXT,
    acompanhamento TEXT,
    observacoes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2.9. tbamb_prescricoes
CREATE TABLE tbamb_prescricoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prontuario_id UUID NOT NULL REFERENCES tbamb_prontuarios(id) ON DELETE CASCADE,
    medicamento VARCHAR(255) NOT NULL,
    dosagem VARCHAR(50) NOT NULL,
    frequencia VARCHAR(50) NOT NULL,
    duracao VARCHAR(50) NOT NULL,
    instrucoes TEXT,
    ordem INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. ÍNDICES
-- ========================================

-- tbamb_pessoas
CREATE INDEX idx_tbamb_pessoas_tipo ON tbamb_pessoas(tipo_pessoa);
CREATE INDEX idx_tbamb_pessoas_ativo ON tbamb_pessoas(ativo);
CREATE INDEX idx_tbamb_pessoas_nome ON tbamb_pessoas(nome);

-- tbamb_senhas
CREATE INDEX idx_tbamb_senhas_pessoa ON tbamb_senhas(pessoa_id);
CREATE INDEX idx_tbamb_senhas_status ON tbamb_senhas(status);
CREATE INDEX idx_tbamb_senhas_tipo ON tbamb_senhas(tipo);
CREATE INDEX idx_tbamb_senhas_numero ON tbamb_senhas(numero);
CREATE INDEX idx_tbamb_senhas_data_geracao ON tbamb_senhas(data_hora_geracao);
CREATE INDEX idx_tbamb_senhas_status_tipo ON tbamb_senhas(status, tipo);

-- tbamb_triagem
CREATE INDEX idx_tbamb_triagem_atendente ON tbamb_triagem(atendente_triagem);
CREATE INDEX idx_tbamb_triagem_data ON tbamb_triagem(data_hora_inicio);
CREATE INDEX idx_tbamb_triagem_prioridade ON tbamb_triagem(prioridade_atribuida);

-- tbamb_consultorio
CREATE INDEX idx_tbamb_consultorio_ativo ON tbamb_consultorio(ativo);

-- tbamb_medicos
CREATE INDEX idx_tbamb_medicos_ativo ON tbamb_medicos(ativo);
CREATE INDEX idx_tbamb_medicos_nome ON tbamb_medicos(nome);

-- tbamb_atendimentos
CREATE INDEX idx_tbamb_atendimentos_senha ON tbamb_atendimentos(senha_id);
CREATE INDEX idx_tbamb_atendimentos_consultorio ON tbamb_atendimentos(consultorio_id);
CREATE INDEX idx_tbamb_atendimentos_medico ON tbamb_atendimentos(medico_id);
CREATE INDEX idx_tbamb_atendimentos_status ON tbamb_atendimentos(status);
CREATE INDEX idx_tbamb_atendimentos_data_chamada ON tbamb_atendimentos(data_hora_chamada);

-- tbamb_chamadas
CREATE INDEX idx_tbamb_chamadas_senha ON tbamb_chamadas(senha_id);
CREATE INDEX idx_tbamb_chamadas_tipo ON tbamb_chamadas(tipo_chamada);
CREATE INDEX idx_tbamb_chamadas_data ON tbamb_chamadas(data_hora_chamada DESC);
CREATE INDEX idx_tbamb_chamadas_exibido ON tbamb_chamadas(exibido_tv);

-- tbamb_prontuarios
CREATE INDEX idx_tbamb_prontuarios_pessoa ON tbamb_prontuarios(pessoa_id);
CREATE INDEX idx_tbamb_prontuarios_medico ON tbamb_prontuarios(medico_id);
CREATE INDEX idx_tbamb_prontuarios_atendimento ON tbamb_prontuarios(atendimento_id);
CREATE INDEX idx_tbamb_prontuarios_data ON tbamb_prontuarios(data_atendimento DESC);

-- tbamb_prescricoes
CREATE INDEX idx_tbamb_prescricoes_prontuario ON tbamb_prescricoes(prontuario_id);
CREATE INDEX idx_tbamb_prescricoes_ordem ON tbamb_prescricoes(prontuario_id, ordem);

-- 4. FUNÇÕES E TRIGGERS
-- ========================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER trigger_tbamb_pessoas_updated_at BEFORE UPDATE ON tbamb_pessoas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_tbamb_senhas_updated_at BEFORE UPDATE ON tbamb_senhas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_tbamb_triagem_updated_at BEFORE UPDATE ON tbamb_triagem FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_tbamb_consultorio_updated_at BEFORE UPDATE ON tbamb_consultorio FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_tbamb_medicos_updated_at BEFORE UPDATE ON tbamb_medicos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_tbamb_atendimentos_updated_at BEFORE UPDATE ON tbamb_atendimentos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_tbamb_prontuarios_updated_at BEFORE UPDATE ON tbamb_prontuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular tempos de senha
CREATE OR REPLACE FUNCTION calcular_tempos_senha()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.data_hora_inicio_triagem IS NOT NULL AND NEW.data_hora_geracao IS NOT NULL THEN
        NEW.tempo_espera_triagem_min := EXTRACT(EPOCH FROM (NEW.data_hora_inicio_triagem - NEW.data_hora_geracao)) / 60;
    END IF;
    IF NEW.data_hora_inicio_atendimento IS NOT NULL AND NEW.data_hora_fim_triagem IS NOT NULL THEN
        NEW.tempo_espera_medico_min := EXTRACT(EPOCH FROM (NEW.data_hora_inicio_atendimento - NEW.data_hora_fim_triagem)) / 60;
    END IF;
    IF NEW.data_hora_fim_atendimento IS NOT NULL AND NEW.data_hora_geracao IS NOT NULL THEN
        NEW.tempo_total_atendimento_min := EXTRACT(EPOCH FROM (NEW.data_hora_fim_atendimento - NEW.data_hora_geracao)) / 60;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcular_tempos_senha BEFORE INSERT OR UPDATE ON tbamb_senhas FOR EACH ROW EXECUTE FUNCTION calcular_tempos_senha();

-- Função para calcular duração de atendimento
CREATE OR REPLACE FUNCTION calcular_duracao_atendimento()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.data_hora_fim IS NOT NULL AND NEW.data_hora_inicio IS NOT NULL THEN
        NEW.duracao_minutos := EXTRACT(EPOCH FROM (NEW.data_hora_fim - NEW.data_hora_inicio)) / 60;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcular_duracao_atendimento BEFORE INSERT OR UPDATE ON tbamb_atendimentos FOR EACH ROW EXECUTE FUNCTION calcular_duracao_atendimento();

-- Função para gerar próximo número de senha
CREATE OR REPLACE FUNCTION gerar_proximo_numero_senha(p_tipo VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    v_prefix VARCHAR(1);
    v_count INTEGER;
    v_numero VARCHAR(10);
    v_data_inicio TIMESTAMP;
    v_data_fim TIMESTAMP;
BEGIN
    v_prefix := CASE WHEN p_tipo = 'prioritaria' THEN 'P' ELSE 'N' END;
    v_data_inicio := DATE_TRUNC('day', NOW());
    v_data_fim := v_data_inicio + INTERVAL '1 day';
    SELECT COUNT(*) INTO v_count FROM tbamb_senhas WHERE tipo = p_tipo AND data_hora_geracao >= v_data_inicio AND data_hora_geracao < v_data_fim;
    v_numero := v_prefix || LPAD((v_count + 1)::TEXT, 3, '0');
    RETURN v_numero;
END;
$$ LANGUAGE plpgsql;

-- 5. DADOS INICIAIS (SEED)
-- ========================================

-- Consultórios
INSERT INTO tbamb_consultorio (numero, nome, localizacao, especialidade, ativo) VALUES
    ('1', 'Consultório 1', 'Ala A, Sala 101', 'Clínica Geral', TRUE),
    ('2', 'Consultório 2', 'Ala A, Sala 102', 'Clínica Geral', TRUE),
    ('3', 'Consultório 3', 'Ala B, Sala 201', 'Cardiologia', TRUE),
    ('4', 'Consultório 4', 'Ala B, Sala 202', 'Ortopedia', TRUE),
    ('5', 'Consultório 5', 'Ala C, Sala 301', 'Pediatria', TRUE);

-- Médicos
INSERT INTO tbamb_medicos (nome, crm, crm_uf, especialidade, telefone, email, ativo) VALUES
    ('Dr. Carlos Alberto Silva', '123456', 'SP', 'Clínica Geral', '(11) 99999-1111', 'carlos.silva@clinic.com', TRUE),
    ('Dra. Marina Costa', '654321', 'SP', 'Cardiologia', '(11) 99999-2222', 'marina.costa@clinic.com', TRUE),
    ('Dr. Roberto Oliveira', '789012', 'SP', 'Ortopedia', '(11) 99999-3333', 'roberto.oliveira@clinic.com', TRUE),
    ('Dra. Paula Mendes', '345678', 'SP', 'Pediatria', '(11) 99999-4444', 'paula.mendes@clinic.com', TRUE);

-- ========================================
-- FIM DO SCRIPT DE INSTALAÇÃO
-- ========================================
```

---

## Notas de Instalação

### Executar no Supabase

1. Acesse o **Supabase Dashboard**
2. Vá para **SQL Editor**
3. Copie e cole o **Script Completo de Instalação** (seção 6)
4. Execute o script
5. Verifique a criação das tabelas em **Table Editor**

### Ordem de Execução

Se preferir executar em partes:
1. Extensões
2. Tabelas (na ordem listada, respeitando dependências)
3. Índices
4. Funções
5. Triggers
6. Dados iniciais

### Validação

Após executar, valide com:

```sql
-- Verificar tabelas criadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'tbamb_%'
ORDER BY table_name;

-- Verificar triggers
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Verificar funções
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

### Rollback

Para remover tudo:

```sql
DROP TABLE IF EXISTS tbamb_prescricoes CASCADE;
DROP TABLE IF EXISTS tbamb_prontuarios CASCADE;
DROP TABLE IF EXISTS tbamb_chamadas CASCADE;
DROP TABLE IF EXISTS tbamb_atendimentos CASCADE;
DROP TABLE IF EXISTS tbamb_medicos CASCADE;
DROP TABLE IF EXISTS tbamb_consultorio CASCADE;
DROP TABLE IF EXISTS tbamb_triagem CASCADE;
DROP TABLE IF EXISTS tbamb_senhas CASCADE;
DROP TABLE IF EXISTS tbamb_pessoas CASCADE;

DROP FUNCTION IF EXISTS gerar_proximo_numero_senha(VARCHAR);
DROP FUNCTION IF EXISTS calcular_duracao_atendimento();
DROP FUNCTION IF EXISTS calcular_tempos_senha();
DROP FUNCTION IF EXISTS update_updated_at_column();
```
