# Documentação Detalhada das Tabelas

## Índice

1. [tbamb_pessoas](#1-tbamb_pessoas)
2. [tbamb_senhas](#2-tbamb_senhas)
3. [tbamb_triagem](#3-tbamb_triagem)
4. [tbamb_consultorio](#4-tbamb_consultorio)
5. [tbamb_medicos](#5-tbamb_medicos)
6. [tbamb_atendimentos](#6-tbamb_atendimentos)
7. [tbamb_chamadas](#7-tbamb_chamadas)
8. [tbamb_prontuarios](#8-tbamb_prontuarios)
9. [tbamb_prescricoes](#9-tbamb_prescricoes)

---

## 1. tbamb_pessoas

**Propósito**: Cadastro de pessoas que utilizam o sistema ambulatorial (colaboradores da empresa e visitantes).

**Descrição**: Esta tabela centraliza todos os dados de identificação e contato das pessoas que geram senhas no sistema. Diferencia colaboradores (que usam matrícula/crachá) de visitantes (que devem fornecer CPF).

### Campos

| Campo | Tipo | Restrições | Descrição |
|-------|------|-----------|-----------|
| `id` | UUID | PRIMARY KEY, NOT NULL, DEFAULT uuid_generate_v4() | Identificador único da pessoa |
| `tipo_pessoa` | VARCHAR(20) | NOT NULL, CHECK IN ('colaborador', 'visitante') | Tipo de pessoa atendida |
| `matricula_cracha` | VARCHAR(50) | UNIQUE, NULLABLE | Matrícula ou número do crachá (obrigatório para colaboradores) |
| `nome` | VARCHAR(255) | NOT NULL | Nome completo da pessoa |
| `cpf` | VARCHAR(14) | UNIQUE, NULLABLE | CPF no formato 000.000.000-00 (obrigatório para visitantes) |
| `data_nascimento` | DATE | NULLABLE | Data de nascimento |
| `telefone` | VARCHAR(20) | NULLABLE | Telefone de contato com DDD |
| `email` | VARCHAR(255) | NULLABLE | Email de contato |
| `endereco` | TEXT | NULLABLE | Endereço completo |
| `contato_emergencia_nome` | VARCHAR(255) | NULLABLE | Nome do contato de emergência |
| `contato_emergencia_telefone` | VARCHAR(20) | NULLABLE | Telefone do contato de emergência |
| `contato_emergencia_relacao` | VARCHAR(50) | NULLABLE | Relação (pai, mãe, cônjuge, filho, etc.) |
| `ativo` | BOOLEAN | NOT NULL, DEFAULT TRUE | Se o registro está ativo |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data/hora de criação do registro |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data/hora da última atualização |

### Regras de Negócio

- **Colaborador**: Deve ter `matricula_cracha` preenchida. CPF é opcional.
- **Visitante**: Deve ter `cpf` preenchido. `matricula_cracha` deve ser NULL.
- `matricula_cracha` e `cpf` são únicos no sistema (não podem ter duplicatas).
- Ao atualizar um registro, `updated_at` deve ser atualizado automaticamente via trigger.

### Índices Recomendados

```sql
CREATE INDEX idx_tbamb_pessoas_tipo ON tbamb_pessoas(tipo_pessoa);
CREATE INDEX idx_tbamb_pessoas_ativo ON tbamb_pessoas(ativo);
CREATE UNIQUE INDEX idx_tbamb_pessoas_cpf ON tbamb_pessoas(cpf) WHERE cpf IS NOT NULL;
CREATE UNIQUE INDEX idx_tbamb_pessoas_matricula ON tbamb_pessoas(matricula_cracha) WHERE matricula_cracha IS NOT NULL;
```

### Exemplo de Dados

```sql
-- Colaborador
INSERT INTO tbamb_pessoas (tipo_pessoa, matricula_cracha, nome, telefone, ativo)
VALUES ('colaborador', 'EMP001', 'João da Silva', '(11) 98765-4321', TRUE);

-- Visitante
INSERT INTO tbamb_pessoas (tipo_pessoa, cpf, nome, telefone, ativo)
VALUES ('visitante', '123.456.789-00', 'Maria Santos', '(11) 91234-5678', TRUE);
```

---

## 2. tbamb_senhas

**Propósito**: Registro completo de todas as senhas geradas no sistema, incluindo todo o histórico de estados e tempos de cada etapa do atendimento.

**Descrição**: Esta é a tabela central do sistema, funcionando como eixo de rastreamento do fluxo completo desde a geração da senha até a finalização do atendimento. Registra todos os timestamps de transição entre estados.

### Campos

| Campo | Tipo | Restrições | Descrição |
|-------|------|-----------|-----------|
| `id` | UUID | PRIMARY KEY, NOT NULL, DEFAULT uuid_generate_v4() | Identificador único da senha |
| `pessoa_id` | UUID | FOREIGN KEY → tbamb_pessoas(id), NOT NULL | Referência à pessoa que gerou a senha |
| `numero` | VARCHAR(10) | NOT NULL | Número da senha (N001, N002, P001, P002, etc.) |
| `tipo` | VARCHAR(20) | NOT NULL, CHECK IN ('normal', 'prioritaria') | Tipo da senha |
| `status` | VARCHAR(30) | NOT NULL, DEFAULT 'aguardando' | Status atual da senha |
| `data_hora_geracao` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data/hora de geração da senha |
| `data_hora_chamada_triagem` | TIMESTAMP | NULLABLE | Data/hora em que foi chamada para triagem |
| `data_hora_inicio_triagem` | TIMESTAMP | NULLABLE | Data/hora em que iniciou a triagem |
| `data_hora_fim_triagem` | TIMESTAMP | NULLABLE | Data/hora em que finalizou a triagem |
| `data_hora_chamada_medico` | TIMESTAMP | NULLABLE | Data/hora em que foi chamada para o médico |
| `data_hora_inicio_atendimento` | TIMESTAMP | NULLABLE | Data/hora em que iniciou atendimento médico |
| `data_hora_fim_atendimento` | TIMESTAMP | NULLABLE | Data/hora em que finalizou atendimento médico |
| `data_hora_cancelamento` | TIMESTAMP | NULLABLE | Data/hora do cancelamento (se aplicável) |
| `motivo_cancelamento` | VARCHAR(255) | NULLABLE | Motivo do cancelamento |
| `tempo_espera_triagem_min` | INTEGER | NULLABLE | Tempo de espera até triagem (minutos) |
| `tempo_espera_medico_min` | INTEGER | NULLABLE | Tempo de espera até médico (minutos) |
| `tempo_total_atendimento_min` | INTEGER | NULLABLE | Tempo total do fluxo (minutos) |
| `tablet_gerador` | VARCHAR(100) | NULLABLE | Identificador do tablet que gerou a senha |
| `impresso` | BOOLEAN | NOT NULL, DEFAULT FALSE | Se a senha foi impressa na impressora térmica |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data/hora de criação do registro |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data/hora da última atualização |

### Possíveis Valores de Status

| Status | Descrição |
|--------|-----------|
| `aguardando` | Senha gerada, aguardando chamada para triagem |
| `em_triagem` | Paciente foi chamado e está em atendimento na triagem |
| `aguardando_medico` | Triagem concluída, aguardando chamada para consultório médico |
| `em_atendimento` | Paciente foi chamado e está em atendimento com médico |
| `concluido` | Atendimento médico finalizado |
| `cancelado` | Senha cancelada (paciente desistiu, não compareceu, etc.) |

### Fluxo de Estados

```
aguardando → em_triagem → aguardando_medico → em_atendimento → concluido
    ↓
cancelado (pode acontecer a qualquer momento)
```

### Regras de Negócio

- **Numeração**: Senhas normais começam com "N" (N001, N002...), prioritárias com "P" (P001, P002...).
- **Contadores diários**: A numeração deve resetar a cada dia (implementar lógica na aplicação ou via função PostgreSQL).
- **Timestamps sequenciais**: Os timestamps devem seguir ordem lógica:
  - `data_hora_geracao` < `data_hora_chamada_triagem` < `data_hora_inicio_triagem` < `data_hora_fim_triagem`
  - `data_hora_fim_triagem` < `data_hora_chamada_medico` < `data_hora_inicio_atendimento` < `data_hora_fim_atendimento`
- **Cálculo de tempos**: Os campos de tempo devem ser calculados automaticamente via trigger ao mudar de status.

### Índices Recomendados

```sql
CREATE INDEX idx_tbamb_senhas_pessoa ON tbamb_senhas(pessoa_id);
CREATE INDEX idx_tbamb_senhas_status ON tbamb_senhas(status);
CREATE INDEX idx_tbamb_senhas_tipo ON tbamb_senhas(tipo);
CREATE INDEX idx_tbamb_senhas_data_geracao ON tbamb_senhas(data_hora_geracao);
CREATE INDEX idx_tbamb_senhas_numero ON tbamb_senhas(numero);
```

### Exemplo de Dados

```sql
INSERT INTO tbamb_senhas (
  pessoa_id, numero, tipo, status,
  data_hora_geracao, tablet_gerador, impresso
)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000', -- UUID da pessoa
  'N001',
  'normal',
  'aguardando',
  NOW(),
  'TABLET-001',
  TRUE
);
```

---

## 3. tbamb_triagem

**Propósito**: Registro dos dados coletados durante a triagem inicial do paciente.

**Descrição**: Armazena informações vitais, queixa principal e observações da triagem. Cada senha tem no máximo um registro de triagem.

### Campos

| Campo | Tipo | Restrições | Descrição |
|-------|------|-----------|-----------|
| `id` | UUID | PRIMARY KEY, NOT NULL, DEFAULT uuid_generate_v4() | Identificador único do registro de triagem |
| `senha_id` | UUID | FOREIGN KEY → tbamb_senhas(id), UNIQUE, NOT NULL | Referência à senha (1:1) |
| `atendente_triagem` | VARCHAR(255) | NOT NULL | Nome do profissional que realizou a triagem |
| `sala_triagem` | VARCHAR(50) | NULLABLE | Sala onde a triagem foi realizada |
| `observacoes` | TEXT | NULLABLE | Observações gerais da triagem |
| `pressao_arterial` | VARCHAR(20) | NULLABLE | PA (ex: "120/80 mmHg") |
| `frequencia_cardiaca` | VARCHAR(20) | NULLABLE | FC (ex: "72 bpm") |
| `temperatura` | VARCHAR(20) | NULLABLE | Temperatura (ex: "36.5°C") |
| `frequencia_respiratoria` | VARCHAR(20) | NULLABLE | FR (ex: "16 irpm") |
| `saturacao_oxigenio` | VARCHAR(20) | NULLABLE | SpO2 (ex: "98%") |
| `peso` | VARCHAR(20) | NULLABLE | Peso (ex: "70 kg") |
| `altura` | VARCHAR(20) | NULLABLE | Altura (ex: "170 cm") |
| `queixa_principal` | TEXT | NULLABLE | Queixa principal relatada pelo paciente |
| `prioridade_atribuida` | VARCHAR(20) | NULLABLE, CHECK IN ('baixa', 'media', 'alta', 'urgente') | Prioridade atribuída pela triagem |
| `data_hora_inicio` | TIMESTAMP | NOT NULL | Data/hora de início da triagem |
| `data_hora_fim` | TIMESTAMP | NULLABLE | Data/hora de término da triagem |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data/hora de criação do registro |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data/hora da última atualização |

### Regras de Negócio

- Cada senha pode ter apenas **um registro de triagem** (relação 1:1).
- A triagem é **opcional** no fluxo (senhas podem ir direto para consultório em casos especiais).
- `data_hora_inicio` deve coincidir com `tbamb_senhas.data_hora_inicio_triagem`.
- `data_hora_fim` deve coincidir com `tbamb_senhas.data_hora_fim_triagem`.
- A `prioridade_atribuida` pode ser diferente do tipo da senha (ex: senha normal pode receber prioridade alta na triagem).

### Índices Recomendados

```sql
CREATE UNIQUE INDEX idx_tbamb_triagem_senha ON tbamb_triagem(senha_id);
CREATE INDEX idx_tbamb_triagem_atendente ON tbamb_triagem(atendente_triagem);
CREATE INDEX idx_tbamb_triagem_data ON tbamb_triagem(data_hora_inicio);
CREATE INDEX idx_tbamb_triagem_prioridade ON tbamb_triagem(prioridade_atribuida);
```

### Exemplo de Dados

```sql
INSERT INTO tbamb_triagem (
  senha_id, atendente_triagem, sala_triagem,
  pressao_arterial, frequencia_cardiaca, temperatura,
  saturacao_oxigenio, peso, altura,
  queixa_principal, prioridade_atribuida,
  data_hora_inicio
)
VALUES (
  '123e4567-e89b-12d3-a456-426614174001',
  'Enfermeira Ana Paula',
  'Triagem 1',
  '120/80 mmHg',
  '72 bpm',
  '36.5°C',
  '98%',
  '70 kg',
  '170 cm',
  'Dor de cabeça há 2 dias',
  'media',
  NOW()
);
```

---

## 4. tbamb_consultorio

**Propósito**: Cadastro dos consultórios médicos disponíveis no ambulatório.

**Descrição**: Tabela de configuração que define os consultórios físicos onde os atendimentos médicos acontecem.

### Campos

| Campo | Tipo | Restrições | Descrição |
|-------|------|-----------|-----------|
| `id` | UUID | PRIMARY KEY, NOT NULL, DEFAULT uuid_generate_v4() | Identificador único do consultório |
| `numero` | VARCHAR(10) | NOT NULL, UNIQUE | Número do consultório (1, 2, 3, etc.) |
| `nome` | VARCHAR(100) | NOT NULL | Nome do consultório (ex: "Consultório 1") |
| `localizacao` | VARCHAR(255) | NULLABLE | Localização física (ex: "Ala A, Sala 101") |
| `especialidade` | VARCHAR(100) | NULLABLE | Especialidade médica (ex: "Clínica Geral", "Cardiologia") |
| `ativo` | BOOLEAN | NOT NULL, DEFAULT TRUE | Se o consultório está ativo |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data/hora de criação do registro |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data/hora da última atualização |

### Regras de Negócio

- Cada consultório deve ter um **número único**.
- Consultórios podem ser temporariamente desativados (`ativo = FALSE`) sem excluir o registro.
- A `especialidade` é informativa e não restringe quais médicos podem atuar no consultório.

### Índices Recomendados

```sql
CREATE UNIQUE INDEX idx_tbamb_consultorio_numero ON tbamb_consultorio(numero);
CREATE INDEX idx_tbamb_consultorio_ativo ON tbamb_consultorio(ativo);
```

### Exemplo de Dados

```sql
INSERT INTO tbamb_consultorio (numero, nome, localizacao, especialidade, ativo)
VALUES
  ('1', 'Consultório 1', 'Ala A, Sala 101', 'Clínica Geral', TRUE),
  ('2', 'Consultório 2', 'Ala A, Sala 102', 'Clínica Geral', TRUE),
  ('3', 'Consultório 3', 'Ala B, Sala 201', 'Cardiologia', TRUE),
  ('4', 'Consultório 4', 'Ala B, Sala 202', 'Ortopedia', TRUE),
  ('5', 'Consultório 5', 'Ala C, Sala 301', 'Pediatria', TRUE);
```

---

## 5. tbamb_medicos

**Propósito**: Cadastro dos médicos que realizam atendimentos no ambulatório.

**Descrição**: Tabela de profissionais médicos com informações de identificação, registro profissional e contato.

### Campos

| Campo | Tipo | Restrições | Descrição |
|-------|------|-----------|-----------|
| `id` | UUID | PRIMARY KEY, NOT NULL, DEFAULT uuid_generate_v4() | Identificador único do médico |
| `nome` | VARCHAR(255) | NOT NULL | Nome completo do médico |
| `crm` | VARCHAR(20) | NOT NULL | Número do CRM |
| `crm_uf` | VARCHAR(2) | NOT NULL | UF do CRM (SP, RJ, MG, etc.) |
| `especialidade` | VARCHAR(100) | NULLABLE | Especialidade médica principal |
| `telefone` | VARCHAR(20) | NULLABLE | Telefone de contato |
| `email` | VARCHAR(255) | NULLABLE | Email profissional |
| `ativo` | BOOLEAN | NOT NULL, DEFAULT TRUE | Se o médico está ativo |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data/hora de criação do registro |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data/hora da última atualização |

### Regras de Negócio

- Combinação de `crm` + `crm_uf` deve ser **única** (constraint composta).
- Médicos podem ser temporariamente desativados sem excluir o registro.
- A `especialidade` é informativa e não restringe em quais consultórios o médico pode atuar.

### Índices Recomendados

```sql
CREATE UNIQUE INDEX idx_tbamb_medicos_crm ON tbamb_medicos(crm, crm_uf);
CREATE INDEX idx_tbamb_medicos_ativo ON tbamb_medicos(ativo);
CREATE INDEX idx_tbamb_medicos_nome ON tbamb_medicos(nome);
```

### Exemplo de Dados

```sql
INSERT INTO tbamb_medicos (nome, crm, crm_uf, especialidade, telefone, email, ativo)
VALUES
  ('Dr. Carlos Alberto Silva', '123456', 'SP', 'Clínica Geral', '(11) 99999-1111', 'carlos.silva@clinic.com', TRUE),
  ('Dra. Marina Costa', '654321', 'SP', 'Cardiologia', '(11) 99999-2222', 'marina.costa@clinic.com', TRUE),
  ('Dr. Roberto Oliveira', '789012', 'SP', 'Ortopedia', '(11) 99999-3333', 'roberto.oliveira@clinic.com', TRUE);
```

---

## 6. tbamb_atendimentos

**Propósito**: Registro de atendimentos médicos realizados nos consultórios.

**Descrição**: Cada registro representa uma consulta médica, vinculando senha, consultório e médico, com controle de horários e status.

### Campos

| Campo | Tipo | Restrições | Descrição |
|-------|------|-----------|-----------|
| `id` | UUID | PRIMARY KEY, NOT NULL, DEFAULT uuid_generate_v4() | Identificador único do atendimento |
| `senha_id` | UUID | FOREIGN KEY → tbamb_senhas(id), NOT NULL | Referência à senha |
| `consultorio_id` | UUID | FOREIGN KEY → tbamb_consultorio(id), NOT NULL | Referência ao consultório |
| `medico_id` | UUID | FOREIGN KEY → tbamb_medicos(id), NOT NULL | Referência ao médico |
| `data_hora_chamada` | TIMESTAMP | NOT NULL | Data/hora da chamada para o consultório |
| `data_hora_inicio` | TIMESTAMP | NULLABLE | Data/hora de início do atendimento |
| `data_hora_fim` | TIMESTAMP | NULLABLE | Data/hora de término do atendimento |
| `duracao_minutos` | INTEGER | NULLABLE | Duração do atendimento em minutos |
| `observacoes` | TEXT | NULLABLE | Observações sobre o atendimento |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'aguardando' | Status do atendimento |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data/hora de criação do registro |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data/hora da última atualização |

### Possíveis Valores de Status

| Status | Descrição |
|--------|-----------|
| `aguardando` | Paciente foi chamado mas ainda não entrou no consultório |
| `em_andamento` | Atendimento em andamento |
| `concluido` | Atendimento finalizado |
| `cancelado` | Atendimento cancelado |

### Regras de Negócio

- Uma senha pode ter **múltiplos atendimentos** (caso seja encaminhada para múltiplas especialidades).
- `data_hora_chamada` deve coincidir com `tbamb_senhas.data_hora_chamada_medico`.
- `data_hora_inicio` deve coincidir com `tbamb_senhas.data_hora_inicio_atendimento`.
- `data_hora_fim` deve coincidir com `tbamb_senhas.data_hora_fim_atendimento`.
- `duracao_minutos` deve ser calculada automaticamente: `data_hora_fim - data_hora_inicio`.

### Índices Recomendados

```sql
CREATE INDEX idx_tbamb_atendimentos_senha ON tbamb_atendimentos(senha_id);
CREATE INDEX idx_tbamb_atendimentos_consultorio ON tbamb_atendimentos(consultorio_id);
CREATE INDEX idx_tbamb_atendimentos_medico ON tbamb_atendimentos(medico_id);
CREATE INDEX idx_tbamb_atendimentos_status ON tbamb_atendimentos(status);
CREATE INDEX idx_tbamb_atendimentos_data_chamada ON tbamb_atendimentos(data_hora_chamada);
```

### Exemplo de Dados

```sql
INSERT INTO tbamb_atendimentos (
  senha_id, consultorio_id, medico_id,
  data_hora_chamada, data_hora_inicio, status
)
VALUES (
  '123e4567-e89b-12d3-a456-426614174001',
  '456e7890-e89b-12d3-a456-426614174010',
  '789e0123-e89b-12d3-a456-426614174020',
  NOW(),
  NOW() + INTERVAL '2 minutes',
  'em_andamento'
);
```

---

## 7. tbamb_chamadas

**Propósito**: Histórico de todas as chamadas realizadas no sistema, tanto para triagem quanto para consultórios.

**Descrição**: Esta tabela mantém um log independente de todas as chamadas para exibição na TV e auditoria. Diferente de outras tabelas, não é editada, apenas recebe novos registros.

### Campos

| Campo | Tipo | Restrições | Descrição |
|-------|------|-----------|-----------|
| `id` | UUID | PRIMARY KEY, NOT NULL, DEFAULT uuid_generate_v4() | Identificador único da chamada |
| `senha_id` | UUID | FOREIGN KEY → tbamb_senhas(id), NOT NULL | Referência à senha chamada |
| `tipo_chamada` | VARCHAR(20) | NOT NULL, CHECK IN ('triagem', 'consultorio') | Tipo de chamada |
| `numero_senha` | VARCHAR(10) | NOT NULL | Número da senha (desnormalizado para performance) |
| `tipo_senha` | VARCHAR(20) | NOT NULL | Tipo da senha (normal ou prioritaria) |
| `local_chamada` | VARCHAR(100) | NOT NULL | Local da chamada (ex: "Triagem 1", "Consultório 3") |
| `nome_medico` | VARCHAR(255) | NULLABLE | Nome do médico (apenas para tipo_chamada = 'consultorio') |
| `data_hora_chamada` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data/hora da chamada |
| `exibido_tv` | BOOLEAN | NOT NULL, DEFAULT FALSE | Se a chamada já foi exibida na TV |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data/hora de criação do registro |

### Regras de Negócio

- Esta é uma tabela **append-only** (somente inserção, sem updates).
- Campos desnormalizados (`numero_senha`, `tipo_senha`) facilitam queries de exibição na TV.
- `nome_medico` deve ser preenchido apenas quando `tipo_chamada = 'consultorio'`.
- `exibido_tv` pode ser usado para marcar chamadas já processadas pela tela de TV.
- Manter histórico de **no máximo 100 chamadas** por dia (implementar limpeza periódica).

### Índices Recomendados

```sql
CREATE INDEX idx_tbamb_chamadas_senha ON tbamb_chamadas(senha_id);
CREATE INDEX idx_tbamb_chamadas_tipo ON tbamb_chamadas(tipo_chamada);
CREATE INDEX idx_tbamb_chamadas_data ON tbamb_chamadas(data_hora_chamada DESC);
CREATE INDEX idx_tbamb_chamadas_exibido ON tbamb_chamadas(exibido_tv);
```

### Exemplo de Dados

```sql
-- Chamada para triagem
INSERT INTO tbamb_chamadas (
  senha_id, tipo_chamada, numero_senha, tipo_senha,
  local_chamada, data_hora_chamada
)
VALUES (
  '123e4567-e89b-12d3-a456-426614174001',
  'triagem',
  'N001',
  'normal',
  'Triagem 1',
  NOW()
);

-- Chamada para consultório
INSERT INTO tbamb_chamadas (
  senha_id, tipo_chamada, numero_senha, tipo_senha,
  local_chamada, nome_medico, data_hora_chamada
)
VALUES (
  '123e4567-e89b-12d3-a456-426614174001',
  'consultorio',
  'N001',
  'normal',
  'Consultório 3',
  'Dr. Carlos Alberto Silva',
  NOW()
);
```

---

## 8. tbamb_prontuarios

**Propósito**: Prontuários eletrônicos com dados completos de consultas médicas.

**Descrição**: Armazena anamnese, exame físico, diagnóstico e plano terapêutico de cada consulta médica realizada.

### Campos

| Campo | Tipo | Restrições | Descrição |
|-------|------|-----------|-----------|
| `id` | UUID | PRIMARY KEY, NOT NULL, DEFAULT uuid_generate_v4() | Identificador único do prontuário |
| `pessoa_id` | UUID | FOREIGN KEY → tbamb_pessoas(id), NOT NULL | Referência à pessoa atendida |
| `atendimento_id` | UUID | FOREIGN KEY → tbamb_atendimentos(id), NULLABLE | Referência ao atendimento (se vinculado) |
| `medico_id` | UUID | FOREIGN KEY → tbamb_medicos(id), NOT NULL | Referência ao médico responsável |
| `data_atendimento` | DATE | NOT NULL | Data do atendimento |
| `queixa_principal` | TEXT | NULLABLE | Queixa principal |
| `historia_doenca_atual` | TEXT | NULLABLE | História da doença atual (HDA) |
| `antecedentes_pessoais` | TEXT | NULLABLE | Antecedentes pessoais |
| `antecedentes_familiares` | TEXT | NULLABLE | Antecedentes familiares |
| `medicacoes_em_uso` | TEXT | NULLABLE | Medicações em uso |
| `alergias` | TEXT | NULLABLE | Alergias conhecidas |
| `historia_social` | TEXT | NULLABLE | História social (tabagismo, etilismo, etc.) |
| `exame_fisico` | TEXT | NULLABLE | Exame físico detalhado |
| `diagnostico` | TEXT | NULLABLE | Diagnóstico médico |
| `tratamento` | TEXT | NULLABLE | Plano terapêutico |
| `acompanhamento` | TEXT | NULLABLE | Orientações de acompanhamento |
| `observacoes` | TEXT | NULLABLE | Observações gerais |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data/hora de criação do registro |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data/hora da última atualização |

### Regras de Negócio

- Cada atendimento pode gerar **um prontuário**.
- Uma pessoa pode ter **múltiplos prontuários** (histórico de consultas).
- `atendimento_id` pode ser NULL para prontuários criados manualmente (fora do fluxo de senhas).
- Prontuários devem seguir normativas de prontuário eletrônico do CFM.
- Dados sensíveis devem ter RLS (Row Level Security) restrito por médico/profissional autorizado.

### Índices Recomendados

```sql
CREATE INDEX idx_tbamb_prontuarios_pessoa ON tbamb_prontuarios(pessoa_id);
CREATE INDEX idx_tbamb_prontuarios_medico ON tbamb_prontuarios(medico_id);
CREATE INDEX idx_tbamb_prontuarios_atendimento ON tbamb_prontuarios(atendimento_id);
CREATE INDEX idx_tbamb_prontuarios_data ON tbamb_prontuarios(data_atendimento DESC);
```

### Exemplo de Dados

```sql
INSERT INTO tbamb_prontuarios (
  pessoa_id, atendimento_id, medico_id, data_atendimento,
  queixa_principal, historia_doenca_atual,
  exame_fisico, diagnostico, tratamento
)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  '456e7890-e89b-12d3-a456-426614174030',
  '789e0123-e89b-12d3-a456-426614174020',
  CURRENT_DATE,
  'Dor de cabeça há 2 dias',
  'Paciente relata cefaleia frontal bilateral, de intensidade moderada, sem irradiação.',
  'Paciente lúcido, orientado, normocorado. PA: 120/80 mmHg. FC: 72 bpm.',
  'Cefaleia tensional',
  'Dipirona 1g, 6/6h por 3 dias. Orientado repouso.'
);
```

---

## 9. tbamb_prescricoes

**Propósito**: Prescrições médicas detalhadas vinculadas a prontuários.

**Descrição**: Cada linha representa um medicamento prescrito, com dosagem, frequência e instruções de uso.

### Campos

| Campo | Tipo | Restrições | Descrição |
|-------|------|-----------|-----------|
| `id` | UUID | PRIMARY KEY, NOT NULL, DEFAULT uuid_generate_v4() | Identificador único da prescrição |
| `prontuario_id` | UUID | FOREIGN KEY → tbamb_prontuarios(id), NOT NULL | Referência ao prontuário |
| `medicamento` | VARCHAR(255) | NOT NULL | Nome do medicamento |
| `dosagem` | VARCHAR(50) | NOT NULL | Dosagem (ex: "500mg", "10ml") |
| `frequencia` | VARCHAR(50) | NOT NULL | Frequência (ex: "8/8h", "2x/dia") |
| `duracao` | VARCHAR(50) | NOT NULL | Duração do tratamento (ex: "7 dias", "uso contínuo") |
| `instrucoes` | TEXT | NULLABLE | Instruções de uso (ex: "tomar em jejum") |
| `ordem` | INTEGER | NOT NULL, DEFAULT 1 | Ordem da prescrição na receita |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data/hora de criação do registro |

### Regras de Negócio

- Cada prontuário pode ter **múltiplas prescrições** (relação 1:N).
- O campo `ordem` define a sequência de exibição na receita médica.
- Prescrições não devem ser editadas após criação (auditoria médica).
- Para modificações, criar novo prontuário ou usar sistema de versionamento.

### Índices Recomendados

```sql
CREATE INDEX idx_tbamb_prescricoes_prontuario ON tbamb_prescricoes(prontuario_id);
CREATE INDEX idx_tbamb_prescricoes_ordem ON tbamb_prescricoes(prontuario_id, ordem);
```

### Exemplo de Dados

```sql
INSERT INTO tbamb_prescricoes (
  prontuario_id, medicamento, dosagem, frequencia, duracao, instrucoes, ordem
)
VALUES
  (
    '123e4567-e89b-12d3-a456-426614174040',
    'Dipirona',
    '500mg',
    '6/6h',
    '3 dias',
    'Tomar com água, preferencialmente após as refeições',
    1
  ),
  (
    '123e4567-e89b-12d3-a456-426614174040',
    'Omeprazol',
    '20mg',
    '1x/dia',
    '7 dias',
    'Tomar em jejum, 30 minutos antes do café da manhã',
    2
  );
```

---

## Resumo de Relacionamentos

| Tabela Origem | Tabela Destino | Cardinalidade | Descrição |
|--------------|----------------|---------------|-----------|
| `tbamb_pessoas` | `tbamb_senhas` | 1:N | Uma pessoa pode gerar várias senhas |
| `tbamb_senhas` | `tbamb_triagem` | 1:0..1 | Uma senha pode ter zero ou uma triagem |
| `tbamb_senhas` | `tbamb_atendimentos` | 1:N | Uma senha pode ter vários atendimentos |
| `tbamb_senhas` | `tbamb_chamadas` | 1:N | Uma senha pode ter várias chamadas registradas |
| `tbamb_consultorio` | `tbamb_atendimentos` | 1:N | Um consultório recebe vários atendimentos |
| `tbamb_medicos` | `tbamb_atendimentos` | 1:N | Um médico realiza vários atendimentos |
| `tbamb_pessoas` | `tbamb_prontuarios` | 1:N | Uma pessoa pode ter vários prontuários |
| `tbamb_atendimentos` | `tbamb_prontuarios` | 1:0..1 | Um atendimento pode gerar zero ou um prontuário |
| `tbamb_medicos` | `tbamb_prontuarios` | 1:N | Um médico pode criar vários prontuários |
| `tbamb_prontuarios` | `tbamb_prescricoes` | 1:N | Um prontuário pode ter várias prescrições |

---

## Observações Finais

### Desnormalização Estratégica

Alguns campos estão desnormalizados propositalmente para otimizar performance em queries frequentes:
- `tbamb_chamadas`: copia `numero_senha` e `tipo_senha` para evitar joins
- `tbamb_chamadas`: copia `nome_medico` para exibição rápida na TV

### Campos de Auditoria

Todas as tabelas possuem:
- `created_at`: Timestamp de criação (imutável)
- `updated_at`: Timestamp de última atualização (atualizado via trigger)

### Soft Delete

Tabelas de configuração (`tbamb_pessoas`, `tbamb_consultorio`, `tbamb_medicos`) usam campo `ativo` para soft delete, preservando integridade referencial e histórico.
