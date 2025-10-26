-- ========================================
-- SICFAR-CLINIC - SCRIPT SQL ATUALIZADO
-- Versão 2.0 - Integração com tbfuncionario e tbvisitante
-- ========================================

-- ATENÇÃO: Este script substitui tbamb_pessoas por integração
-- com as tabelas existentes tbfuncionario e tbvisitante

-- ========================================
-- 1. EXTENSÕES
-- ========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ========================================
-- 2. TABELA VISITANTE (Firebird → PostgreSQL)
-- ========================================
-- Esta tabela já existe? Executar apenas se não existir

CREATE TABLE IF NOT EXISTS public.tbvisitante (
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
  empresa           VARCHAR(80),
  contato_interno   VARCHAR(80),

  -- Tempo de permanência
  tempo_tipo        VARCHAR(10),
  tempo_qtde        INTEGER,

  -- Mídia
  foto              BYTEA,

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

  -- Metadados
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tbvisitante_nome_idx ON public.tbvisitante (LOWER(nome));
CREATE INDEX IF NOT EXISTS tbvisitante_doc_numero_idx ON public.tbvisitante (doc_numero) WHERE doc_numero IS NOT NULL;
CREATE INDEX IF NOT EXISTS tbvisitante_deletado_idx ON public.tbvisitante (deletado);

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

-- ========================================
-- 3. TABELAS AMBULATORIAIS (tbamb_*)
-- ========================================

-- 3.1. tbamb_senhas (COM DUAS FKs)
-- ========================================
CREATE TABLE tbamb_senhas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- FKs para tabelas existentes (apenas UMA será preenchida)
  funcionario_id    BIGINT REFERENCES tbfuncionario(id),
  visitante_id      BIGINT REFERENCES tbvisitante(visitante_id),

  -- Campo discriminador
  tipo_pessoa       VARCHAR(20) NOT NULL CHECK (tipo_pessoa IN ('funcionario', 'visitante')),

  -- Dados da senha
  numero            VARCHAR(10) NOT NULL,
  tipo              VARCHAR(20) NOT NULL CHECK (tipo IN ('normal', 'prioritaria')),
  status            VARCHAR(30) NOT NULL DEFAULT 'aguardando'
                    CHECK (status IN ('aguardando', 'em_triagem', 'aguardando_medico', 'em_atendimento', 'concluido', 'cancelado')),

  -- Timestamps do fluxo
  data_hora_geracao             TIMESTAMP NOT NULL DEFAULT NOW(),
  data_hora_chamada_triagem     TIMESTAMP,
  data_hora_inicio_triagem      TIMESTAMP,
  data_hora_fim_triagem         TIMESTAMP,
  data_hora_chamada_medico      TIMESTAMP,
  data_hora_inicio_atendimento  TIMESTAMP,
  data_hora_fim_atendimento     TIMESTAMP,
  data_hora_cancelamento        TIMESTAMP,
  motivo_cancelamento           VARCHAR(255),

  -- Tempos calculados (via trigger)
  tempo_espera_triagem_min      INTEGER,
  tempo_espera_medico_min       INTEGER,
  tempo_total_atendimento_min   INTEGER,

  -- Metadata
  tablet_gerador                VARCHAR(100),
  impresso                      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints de validação
  CONSTRAINT chk_senha_pessoa_exclusiva
    CHECK (
      (funcionario_id IS NOT NULL AND visitante_id IS NULL) OR
      (funcionario_id IS NULL AND visitante_id IS NOT NULL)
    ),

  CONSTRAINT chk_senha_timestamp_triagem
    CHECK (data_hora_chamada_triagem IS NULL OR data_hora_chamada_triagem >= data_hora_geracao),

  CONSTRAINT chk_senha_timestamp_inicio_triagem
    CHECK (data_hora_inicio_triagem IS NULL OR data_hora_inicio_triagem >= data_hora_chamada_triagem),

  CONSTRAINT chk_senha_timestamp_fim_triagem
    CHECK (data_hora_fim_triagem IS NULL OR data_hora_fim_triagem >= data_hora_inicio_triagem),

  CONSTRAINT chk_senha_timestamp_chamada_medico
    CHECK (data_hora_chamada_medico IS NULL OR data_hora_chamada_medico >= data_hora_fim_triagem)
);

-- Índices para tbamb_senhas
CREATE INDEX idx_tbamb_senhas_funcionario ON tbamb_senhas(funcionario_id);
CREATE INDEX idx_tbamb_senhas_visitante ON tbamb_senhas(visitante_id);
CREATE INDEX idx_tbamb_senhas_tipo_pessoa ON tbamb_senhas(tipo_pessoa);
CREATE INDEX idx_tbamb_senhas_status ON tbamb_senhas(status);
CREATE INDEX idx_tbamb_senhas_tipo ON tbamb_senhas(tipo);
CREATE INDEX idx_tbamb_senhas_numero ON tbamb_senhas(numero);
CREATE INDEX idx_tbamb_senhas_data_geracao ON tbamb_senhas(data_hora_geracao);
CREATE INDEX idx_tbamb_senhas_fila ON tbamb_senhas(status, tipo, data_hora_geracao)
  WHERE status IN ('aguardando', 'aguardando_medico');

-- 3.2. tbamb_triagem
-- ========================================
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
  CONSTRAINT chk_triagem_timestamp CHECK (data_hora_fim IS NULL OR data_hora_fim >= data_hora_inicio)
);

CREATE INDEX idx_tbamb_triagem_atendente ON tbamb_triagem(atendente_triagem);
CREATE INDEX idx_tbamb_triagem_data ON tbamb_triagem(data_hora_inicio);
CREATE INDEX idx_tbamb_triagem_prioridade ON tbamb_triagem(prioridade_atribuida);

-- 3.3. tbamb_consultorio
-- ========================================
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

CREATE INDEX idx_tbamb_consultorio_ativo ON tbamb_consultorio(ativo);

-- 3.4. tbamb_medicos
-- ========================================
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

CREATE INDEX idx_tbamb_medicos_ativo ON tbamb_medicos(ativo);
CREATE INDEX idx_tbamb_medicos_nome ON tbamb_medicos(nome);

-- 3.5. tbamb_atendimentos
-- ========================================
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
  CONSTRAINT chk_atendimento_timestamp_inicio CHECK (data_hora_inicio IS NULL OR data_hora_inicio >= data_hora_chamada),
  CONSTRAINT chk_atendimento_timestamp_fim CHECK (data_hora_fim IS NULL OR data_hora_fim >= data_hora_inicio)
);

CREATE INDEX idx_tbamb_atendimentos_senha ON tbamb_atendimentos(senha_id);
CREATE INDEX idx_tbamb_atendimentos_consultorio ON tbamb_atendimentos(consultorio_id);
CREATE INDEX idx_tbamb_atendimentos_medico ON tbamb_atendimentos(medico_id);
CREATE INDEX idx_tbamb_atendimentos_status ON tbamb_atendimentos(status);
CREATE INDEX idx_tbamb_atendimentos_data_chamada ON tbamb_atendimentos(data_hora_chamada);

-- 3.6. tbamb_chamadas
-- ========================================
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

CREATE INDEX idx_tbamb_chamadas_senha ON tbamb_chamadas(senha_id);
CREATE INDEX idx_tbamb_chamadas_tipo ON tbamb_chamadas(tipo_chamada);
CREATE INDEX idx_tbamb_chamadas_data ON tbamb_chamadas(data_hora_chamada DESC);
CREATE INDEX idx_tbamb_chamadas_exibido ON tbamb_chamadas(exibido_tv);

-- 3.7. tbamb_prontuarios (COM DUAS FKs)
-- ========================================
CREATE TABLE tbamb_prontuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- FKs para tabelas existentes (apenas UMA será preenchida)
  funcionario_id    BIGINT REFERENCES tbfuncionario(id),
  visitante_id      BIGINT REFERENCES tbvisitante(visitante_id),

  -- Campo discriminador
  tipo_pessoa       VARCHAR(20) NOT NULL CHECK (tipo_pessoa IN ('funcionario', 'visitante')),

  -- Outras FKs
  atendimento_id    UUID REFERENCES tbamb_atendimentos(id) ON DELETE RESTRICT,
  medico_id         UUID NOT NULL REFERENCES tbamb_medicos(id) ON DELETE RESTRICT,

  -- Dados do prontuário
  data_atendimento          DATE NOT NULL,
  queixa_principal          TEXT,
  historia_doenca_atual     TEXT,
  antecedentes_pessoais     TEXT,
  antecedentes_familiares   TEXT,
  medicacoes_em_uso         TEXT,
  alergias                  TEXT,
  historia_social           TEXT,
  exame_fisico              TEXT,
  diagnostico               TEXT,
  tratamento                TEXT,
  acompanhamento            TEXT,
  observacoes               TEXT,
  created_at                TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraint de exclusividade
  CONSTRAINT chk_prontuario_pessoa_exclusiva
    CHECK (
      (funcionario_id IS NOT NULL AND visitante_id IS NULL) OR
      (funcionario_id IS NULL AND visitante_id IS NOT NULL)
    )
);

CREATE INDEX idx_tbamb_prontuarios_funcionario ON tbamb_prontuarios(funcionario_id);
CREATE INDEX idx_tbamb_prontuarios_visitante ON tbamb_prontuarios(visitante_id);
CREATE INDEX idx_tbamb_prontuarios_tipo_pessoa ON tbamb_prontuarios(tipo_pessoa);
CREATE INDEX idx_tbamb_prontuarios_medico ON tbamb_prontuarios(medico_id);
CREATE INDEX idx_tbamb_prontuarios_atendimento ON tbamb_prontuarios(atendimento_id);
CREATE INDEX idx_tbamb_prontuarios_data ON tbamb_prontuarios(data_atendimento DESC);

-- 3.8. tbamb_prescricoes
-- ========================================
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

CREATE INDEX idx_tbamb_prescricoes_prontuario ON tbamb_prescricoes(prontuario_id);
CREATE INDEX idx_tbamb_prescricoes_ordem ON tbamb_prescricoes(prontuario_id, ordem);

-- ========================================
-- 4. TRIGGERS E FUNÇÕES
-- ========================================

-- 4.1. Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER trigger_tbamb_senhas_updated_at BEFORE UPDATE ON tbamb_senhas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_tbamb_triagem_updated_at BEFORE UPDATE ON tbamb_triagem FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_tbamb_consultorio_updated_at BEFORE UPDATE ON tbamb_consultorio FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_tbamb_medicos_updated_at BEFORE UPDATE ON tbamb_medicos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_tbamb_atendimentos_updated_at BEFORE UPDATE ON tbamb_atendimentos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_tbamb_prontuarios_updated_at BEFORE UPDATE ON tbamb_prontuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4.2. Função para calcular tempos de senha
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

-- 4.3. Função para calcular duração de atendimento
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

-- 4.4. Função para gerar próximo número de senha
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

-- ========================================
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
-- FIM DO SCRIPT
-- ========================================

-- QUERIES DE TESTE POLIMÓRFICAS
-- ========================================

-- Buscar senhas com dados de pessoa (funcionário ou visitante)
/*
SELECT
  s.numero,
  s.tipo,
  s.status,
  COALESCE(f.nome, v.nome) as pessoa_nome,
  COALESCE(f.emp_codigo || '-' || f.epg_codigo, v.doc_numero) as identificacao,
  s.tipo_pessoa,
  s.data_hora_geracao
FROM tbamb_senhas s
LEFT JOIN tbfuncionario f ON f.id = s.funcionario_id
LEFT JOIN tbvisitante v ON v.visitante_id = s.visitante_id
WHERE DATE(s.data_hora_geracao) = CURRENT_DATE
ORDER BY s.data_hora_geracao DESC;
*/
