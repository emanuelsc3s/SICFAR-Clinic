# Políticas RLS (Row Level Security)

## Índice

1. [Introdução ao RLS](#1-introdução-ao-rls)
2. [Estratégia de Segurança](#2-estratégia-de-segurança)
3. [Perfis de Usuário](#3-perfis-de-usuário)
4. [Políticas por Tabela](#4-políticas-por-tabela)
5. [Scripts de Implementação](#5-scripts-de-implementação)
6. [Testes de Segurança](#6-testes-de-segurança)
7. [Considerações Especiais](#7-considerações-especiais)

---

## 1. Introdução ao RLS

### O que é RLS?

**Row Level Security (RLS)** é um recurso do PostgreSQL/Supabase que permite controlar o acesso a linhas específicas de uma tabela com base no usuário que está executando a query.

### Por que usar RLS no SICFAR-Clinic?

- **Proteção de dados sensíveis**: Prontuários médicos são dados protegidos por lei (LGPD, CFM)
- **Controle de acesso granular**: Médicos só veem seus próprios atendimentos
- **Auditoria**: Rastreamento de quem acessa o quê
- **Conformidade**: Atende requisitos legais de sistemas de saúde

### Conceitos Básicos

```sql
-- Habilitar RLS em uma tabela
ALTER TABLE nome_tabela ENABLE ROW LEVEL SECURITY;

-- Criar política
CREATE POLICY nome_politica ON nome_tabela
  FOR SELECT | INSERT | UPDATE | DELETE  -- Operação
  TO public | authenticated | role_name  -- Quem pode
  USING (condicao_booleana);             -- Quando pode (SELECT/DELETE)
  WITH CHECK (condicao_booleana);        -- Validação (INSERT/UPDATE)
```

---

## 2. Estratégia de Segurança

### Níveis de Acesso

| Nível | Descrição | Acesso |
|-------|-----------|--------|
| **Público** | Acesso sem autenticação | Apenas leitura de consultórios e médicos ativos |
| **Operador** | Operador de tablet, recepção | Criar senhas, visualizar filas |
| **Triagem** | Enfermeiros, técnicos | Chamar e atender triagem |
| **Médico** | Médicos | Chamar, atender, criar prontuários (apenas seus) |
| **Admin** | Administradores | Acesso total |

### Tabelas por Sensibilidade

#### 🟢 Baixa Sensibilidade (Acesso Público)
- `tbamb_consultorio` (apenas ativos)
- `tbamb_medicos` (apenas ativos, sem dados pessoais sensíveis)

#### 🟡 Média Sensibilidade (Acesso Autenticado)
- `tbamb_senhas` (sem dados médicos)
- `tbamb_chamadas` (para TV)
- `tbamb_pessoas` (dados básicos)

#### 🔴 Alta Sensibilidade (Acesso Restrito)
- `tbamb_triagem` (dados vitais)
- `tbamb_atendimentos` (dados de consulta)
- `tbamb_prontuarios` (prontuários completos)
- `tbamb_prescricoes` (prescrições médicas)

---

## 3. Perfis de Usuário

### Estrutura de Perfis (Supabase Auth)

```sql
-- Tabela de perfis de usuário (criar no schema auth ou public)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'medico', 'triagem', 'operador')),
  nome VARCHAR(255) NOT NULL,
  medico_id UUID REFERENCES tbamb_medicos(id),  -- NULL para não-médicos
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_medico ON user_profiles(medico_id);

COMMENT ON TABLE user_profiles IS 'Perfis de usuários do sistema com suas permissões';
```

### Funções Auxiliares

```sql
-- Função para obter role do usuário atual
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS VARCHAR AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Função para verificar se usuário é médico
CREATE OR REPLACE FUNCTION is_medico()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'medico'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Função para obter medico_id do usuário atual
CREATE OR REPLACE FUNCTION get_current_medico_id()
RETURNS UUID AS $$
  SELECT medico_id FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;
```

---

## 4. Políticas por Tabela

### 4.1. tbamb_pessoas

**Sensibilidade**: Média (dados pessoais protegidos por LGPD)

```sql
-- Habilitar RLS
ALTER TABLE tbamb_pessoas ENABLE ROW LEVEL SECURITY;

-- Política: Todos usuários autenticados podem ler
CREATE POLICY "Usuários autenticados podem ler pessoas"
  ON tbamb_pessoas FOR SELECT
  TO authenticated
  USING (true);

-- Política: Apenas operadores e admins podem criar
CREATE POLICY "Operadores podem criar pessoas"
  ON tbamb_pessoas FOR INSERT
  TO authenticated
  WITH CHECK (
    get_current_user_role() IN ('admin', 'operador', 'triagem', 'medico')
  );

-- Política: Apenas admins podem atualizar
CREATE POLICY "Admins podem atualizar pessoas"
  ON tbamb_pessoas FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Política: Ninguém pode deletar (apenas soft delete via UPDATE)
-- (Sem política de DELETE = DELETE bloqueado)
```

---

### 4.2. tbamb_senhas

**Sensibilidade**: Média (dados de fila, sem informações médicas)

```sql
ALTER TABLE tbamb_senhas ENABLE ROW LEVEL SECURITY;

-- Política: Todos usuários autenticados podem ler
CREATE POLICY "Usuários autenticados podem ler senhas"
  ON tbamb_senhas FOR SELECT
  TO authenticated
  USING (true);

-- Política: Operadores, triagem e médicos podem criar
CREATE POLICY "Operadores podem criar senhas"
  ON tbamb_senhas FOR INSERT
  TO authenticated
  WITH CHECK (
    get_current_user_role() IN ('admin', 'operador', 'triagem', 'medico')
  );

-- Política: Triagem e médicos podem atualizar
CREATE POLICY "Triagem e médicos podem atualizar senhas"
  ON tbamb_senhas FOR UPDATE
  TO authenticated
  USING (
    get_current_user_role() IN ('admin', 'triagem', 'medico')
  )
  WITH CHECK (
    get_current_user_role() IN ('admin', 'triagem', 'medico')
  );
```

---

### 4.3. tbamb_triagem

**Sensibilidade**: Alta (dados vitais e médicos)

```sql
ALTER TABLE tbamb_triagem ENABLE ROW LEVEL SECURITY;

-- Política: Triagem, médicos e admins podem ler
CREATE POLICY "Profissionais de saúde podem ler triagem"
  ON tbamb_triagem FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() IN ('admin', 'triagem', 'medico')
  );

-- Política: Apenas triagem pode criar
CREATE POLICY "Triagem pode criar registros"
  ON tbamb_triagem FOR INSERT
  TO authenticated
  WITH CHECK (
    get_current_user_role() IN ('admin', 'triagem')
  );

-- Política: Triagem pode atualizar seus próprios registros
CREATE POLICY "Triagem pode atualizar"
  ON tbamb_triagem FOR UPDATE
  TO authenticated
  USING (
    get_current_user_role() IN ('admin', 'triagem')
  )
  WITH CHECK (
    get_current_user_role() IN ('admin', 'triagem')
  );
```

---

### 4.4. tbamb_consultorio

**Sensibilidade**: Baixa (dados de configuração)

```sql
ALTER TABLE tbamb_consultorio ENABLE ROW LEVEL SECURITY;

-- Política: Todos (mesmo não autenticados) podem ler consultórios ativos
CREATE POLICY "Público pode ler consultórios ativos"
  ON tbamb_consultorio FOR SELECT
  TO public
  USING (ativo = true);

-- Política: Admins podem ler todos (inclusive inativos)
CREATE POLICY "Admins podem ler todos consultórios"
  ON tbamb_consultorio FOR SELECT
  TO authenticated
  USING (is_admin());

-- Política: Apenas admins podem criar/atualizar
CREATE POLICY "Admins podem modificar consultórios"
  ON tbamb_consultorio FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
```

---

### 4.5. tbamb_medicos

**Sensibilidade**: Baixa (dados públicos de médicos)

```sql
ALTER TABLE tbamb_medicos ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler médicos ativos
CREATE POLICY "Público pode ler médicos ativos"
  ON tbamb_medicos FOR SELECT
  TO public
  USING (ativo = true);

-- Política: Admins podem ler todos
CREATE POLICY "Admins podem ler todos médicos"
  ON tbamb_medicos FOR SELECT
  TO authenticated
  USING (is_admin());

-- Política: Apenas admins podem criar/atualizar
CREATE POLICY "Admins podem modificar médicos"
  ON tbamb_medicos FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
```

---

### 4.6. tbamb_atendimentos

**Sensibilidade**: Alta (dados de consulta médica)

```sql
ALTER TABLE tbamb_atendimentos ENABLE ROW LEVEL SECURITY;

-- Política: Médicos veem apenas seus próprios atendimentos
CREATE POLICY "Médicos veem seus atendimentos"
  ON tbamb_atendimentos FOR SELECT
  TO authenticated
  USING (
    is_admin() OR
    (is_medico() AND medico_id = get_current_medico_id())
  );

-- Política: Médicos podem criar atendimentos
CREATE POLICY "Médicos podem criar atendimentos"
  ON tbamb_atendimentos FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin() OR
    (is_medico() AND medico_id = get_current_medico_id())
  );

-- Política: Médicos podem atualizar apenas seus atendimentos
CREATE POLICY "Médicos podem atualizar seus atendimentos"
  ON tbamb_atendimentos FOR UPDATE
  TO authenticated
  USING (
    is_admin() OR
    (is_medico() AND medico_id = get_current_medico_id())
  )
  WITH CHECK (
    is_admin() OR
    (is_medico() AND medico_id = get_current_medico_id())
  );
```

---

### 4.7. tbamb_chamadas

**Sensibilidade**: Baixa (dados de exibição pública)

```sql
ALTER TABLE tbamb_chamadas ENABLE ROW LEVEL SECURITY;

-- Política: Todos (mesmo não autenticados) podem ler chamadas
CREATE POLICY "Público pode ler chamadas"
  ON tbamb_chamadas FOR SELECT
  TO public
  USING (true);

-- Política: Usuários autenticados podem inserir
CREATE POLICY "Usuários autenticados podem criar chamadas"
  ON tbamb_chamadas FOR INSERT
  TO authenticated
  WITH CHECK (
    get_current_user_role() IN ('admin', 'triagem', 'medico')
  );

-- Política: Ninguém pode atualizar ou deletar (tabela append-only)
```

---

### 4.8. tbamb_prontuarios

**Sensibilidade**: Muito Alta (prontuários médicos - CFM)

```sql
ALTER TABLE tbamb_prontuarios ENABLE ROW LEVEL SECURITY;

-- Política: Médicos veem apenas prontuários que criaram
CREATE POLICY "Médicos veem seus prontuários"
  ON tbamb_prontuarios FOR SELECT
  TO authenticated
  USING (
    is_admin() OR
    (is_medico() AND medico_id = get_current_medico_id())
  );

-- Política: Médicos podem criar prontuários
CREATE POLICY "Médicos podem criar prontuários"
  ON tbamb_prontuarios FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin() OR
    (is_medico() AND medico_id = get_current_medico_id())
  );

-- Política: Médicos podem atualizar apenas seus prontuários
-- (apenas dentro de 24h da criação, para fins de auditoria)
CREATE POLICY "Médicos podem atualizar prontuários recentes"
  ON tbamb_prontuarios FOR UPDATE
  TO authenticated
  USING (
    is_admin() OR
    (is_medico() AND
     medico_id = get_current_medico_id() AND
     created_at > NOW() - INTERVAL '24 hours')
  )
  WITH CHECK (
    is_admin() OR
    (is_medico() AND medico_id = get_current_medico_id())
  );

-- Política: Ninguém pode deletar prontuários (auditoria)
```

---

### 4.9. tbamb_prescricoes

**Sensibilidade**: Muito Alta (prescrições médicas)

```sql
ALTER TABLE tbamb_prescricoes ENABLE ROW LEVEL SECURITY;

-- Política: Médicos veem prescrições de seus prontuários
CREATE POLICY "Médicos veem suas prescrições"
  ON tbamb_prescricoes FOR SELECT
  TO authenticated
  USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM tbamb_prontuarios pr
      WHERE pr.id = prontuario_id
        AND pr.medico_id = get_current_medico_id()
    )
  );

-- Política: Médicos podem criar prescrições em seus prontuários
CREATE POLICY "Médicos podem criar prescrições"
  ON tbamb_prescricoes FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM tbamb_prontuarios pr
      WHERE pr.id = prontuario_id
        AND pr.medico_id = get_current_medico_id()
    )
  );

-- Política: Prescrições seguem regra de prontuários (24h)
CREATE POLICY "Médicos podem atualizar prescrições recentes"
  ON tbamb_prescricoes FOR UPDATE
  TO authenticated
  USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM tbamb_prontuarios pr
      WHERE pr.id = prontuario_id
        AND pr.medico_id = get_current_medico_id()
        AND pr.created_at > NOW() - INTERVAL '24 hours'
    )
  );

-- DELETE segue CASCADE de prontuários (apenas admins podem deletar prontuários)
```

---

## 5. Scripts de Implementação

### 5.1. Script Completo de RLS

```sql
-- ========================================
-- SICFAR-CLINIC - ROW LEVEL SECURITY SETUP
-- ========================================

-- 1. CRIAR TABELA DE PERFIS
-- ========================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'medico', 'triagem', 'operador')),
  nome VARCHAR(255) NOT NULL,
  medico_id UUID REFERENCES tbamb_medicos(id),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_medico ON user_profiles(medico_id);

-- 2. FUNÇÕES AUXILIARES
-- ========================================
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS VARCHAR AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_medico()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'medico');
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_current_medico_id()
RETURNS UUID AS $$
  SELECT medico_id FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- 3. HABILITAR RLS EM TODAS AS TABELAS
-- ========================================
ALTER TABLE tbamb_pessoas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbamb_senhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbamb_triagem ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbamb_consultorio ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbamb_medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbamb_atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbamb_chamadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbamb_prontuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbamb_prescricoes ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS - tbamb_pessoas
-- ========================================
CREATE POLICY "Usuários autenticados podem ler pessoas"
  ON tbamb_pessoas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Operadores podem criar pessoas"
  ON tbamb_pessoas FOR INSERT TO authenticated
  WITH CHECK (get_current_user_role() IN ('admin', 'operador', 'triagem', 'medico'));

CREATE POLICY "Admins podem atualizar pessoas"
  ON tbamb_pessoas FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- 5. POLÍTICAS - tbamb_senhas
-- ========================================
CREATE POLICY "Usuários autenticados podem ler senhas"
  ON tbamb_senhas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Operadores podem criar senhas"
  ON tbamb_senhas FOR INSERT TO authenticated
  WITH CHECK (get_current_user_role() IN ('admin', 'operador', 'triagem', 'medico'));

CREATE POLICY "Triagem e médicos podem atualizar senhas"
  ON tbamb_senhas FOR UPDATE TO authenticated
  USING (get_current_user_role() IN ('admin', 'triagem', 'medico'))
  WITH CHECK (get_current_user_role() IN ('admin', 'triagem', 'medico'));

-- 6. POLÍTICAS - tbamb_triagem
-- ========================================
CREATE POLICY "Profissionais de saúde podem ler triagem"
  ON tbamb_triagem FOR SELECT TO authenticated
  USING (get_current_user_role() IN ('admin', 'triagem', 'medico'));

CREATE POLICY "Triagem pode criar registros"
  ON tbamb_triagem FOR INSERT TO authenticated
  WITH CHECK (get_current_user_role() IN ('admin', 'triagem'));

CREATE POLICY "Triagem pode atualizar"
  ON tbamb_triagem FOR UPDATE TO authenticated
  USING (get_current_user_role() IN ('admin', 'triagem'))
  WITH CHECK (get_current_user_role() IN ('admin', 'triagem'));

-- 7. POLÍTICAS - tbamb_consultorio
-- ========================================
CREATE POLICY "Público pode ler consultórios ativos"
  ON tbamb_consultorio FOR SELECT TO public USING (ativo = true);

CREATE POLICY "Admins podem ler todos consultórios"
  ON tbamb_consultorio FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "Admins podem modificar consultórios"
  ON tbamb_consultorio FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- 8. POLÍTICAS - tbamb_medicos
-- ========================================
CREATE POLICY "Público pode ler médicos ativos"
  ON tbamb_medicos FOR SELECT TO public USING (ativo = true);

CREATE POLICY "Admins podem ler todos médicos"
  ON tbamb_medicos FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "Admins podem modificar médicos"
  ON tbamb_medicos FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- 9. POLÍTICAS - tbamb_atendimentos
-- ========================================
CREATE POLICY "Médicos veem seus atendimentos"
  ON tbamb_atendimentos FOR SELECT TO authenticated
  USING (is_admin() OR (is_medico() AND medico_id = get_current_medico_id()));

CREATE POLICY "Médicos podem criar atendimentos"
  ON tbamb_atendimentos FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR (is_medico() AND medico_id = get_current_medico_id()));

CREATE POLICY "Médicos podem atualizar seus atendimentos"
  ON tbamb_atendimentos FOR UPDATE TO authenticated
  USING (is_admin() OR (is_medico() AND medico_id = get_current_medico_id()))
  WITH CHECK (is_admin() OR (is_medico() AND medico_id = get_current_medico_id()));

-- 10. POLÍTICAS - tbamb_chamadas
-- ========================================
CREATE POLICY "Público pode ler chamadas"
  ON tbamb_chamadas FOR SELECT TO public USING (true);

CREATE POLICY "Usuários autenticados podem criar chamadas"
  ON tbamb_chamadas FOR INSERT TO authenticated
  WITH CHECK (get_current_user_role() IN ('admin', 'triagem', 'medico'));

-- 11. POLÍTICAS - tbamb_prontuarios
-- ========================================
CREATE POLICY "Médicos veem seus prontuários"
  ON tbamb_prontuarios FOR SELECT TO authenticated
  USING (is_admin() OR (is_medico() AND medico_id = get_current_medico_id()));

CREATE POLICY "Médicos podem criar prontuários"
  ON tbamb_prontuarios FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR (is_medico() AND medico_id = get_current_medico_id()));

CREATE POLICY "Médicos podem atualizar prontuários recentes"
  ON tbamb_prontuarios FOR UPDATE TO authenticated
  USING (is_admin() OR (is_medico() AND medico_id = get_current_medico_id() AND created_at > NOW() - INTERVAL '24 hours'))
  WITH CHECK (is_admin() OR (is_medico() AND medico_id = get_current_medico_id()));

-- 12. POLÍTICAS - tbamb_prescricoes
-- ========================================
CREATE POLICY "Médicos veem suas prescrições"
  ON tbamb_prescricoes FOR SELECT TO authenticated
  USING (is_admin() OR EXISTS (SELECT 1 FROM tbamb_prontuarios pr WHERE pr.id = prontuario_id AND pr.medico_id = get_current_medico_id()));

CREATE POLICY "Médicos podem criar prescrições"
  ON tbamb_prescricoes FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR EXISTS (SELECT 1 FROM tbamb_prontuarios pr WHERE pr.id = prontuario_id AND pr.medico_id = get_current_medico_id()));

CREATE POLICY "Médicos podem atualizar prescrições recentes"
  ON tbamb_prescricoes FOR UPDATE TO authenticated
  USING (is_admin() OR EXISTS (SELECT 1 FROM tbamb_prontuarios pr WHERE pr.id = prontuario_id AND pr.medico_id = get_current_medico_id() AND pr.created_at > NOW() - INTERVAL '24 hours'));

-- ========================================
-- FIM DO SCRIPT RLS
-- ========================================
```

### 5.2. Criar Usuário Admin Inicial

```sql
-- Após criar usuário no Supabase Auth, adicionar perfil admin
INSERT INTO public.user_profiles (id, role, nome, ativo)
VALUES (
  'uuid-do-usuario-auth',  -- ID do auth.users
  'admin',
  'Administrador Sistema',
  TRUE
);
```

### 5.3. Criar Perfil de Médico

```sql
-- Vincular usuário autenticado a um médico
INSERT INTO public.user_profiles (id, role, nome, medico_id, ativo)
VALUES (
  'uuid-do-usuario-auth',
  'medico',
  'Dr. Carlos Silva',
  'uuid-do-medico',  -- ID em tbamb_medicos
  TRUE
);
```

---

## 6. Testes de Segurança

### 6.1. Testar Acesso Público (TV)

```sql
-- Conectar como usuário não autenticado
SET LOCAL role TO anon;  -- Supabase anon role

-- Deve funcionar: ler consultórios ativos
SELECT * FROM tbamb_consultorio WHERE ativo = true;  -- ✅

-- Deve funcionar: ler chamadas
SELECT * FROM tbamb_chamadas ORDER BY data_hora_chamada DESC LIMIT 6;  -- ✅

-- Deve FALHAR: ler pessoas
SELECT * FROM tbamb_pessoas;  -- ❌ Sem permissão
```

### 6.2. Testar Acesso de Médico

```sql
-- Conectar como médico específico
SET LOCAL "request.jwt.claims" TO '{"sub": "uuid-medico-auth"}';

-- Deve funcionar: ver seus próprios atendimentos
SELECT * FROM tbamb_atendimentos;  -- ✅ Apenas os dele

-- Deve FALHAR: ver atendimentos de outro médico
SELECT * FROM tbamb_atendimentos WHERE medico_id != get_current_medico_id();  -- ❌ Vazio

-- Deve funcionar: criar prontuário
INSERT INTO tbamb_prontuarios (pessoa_id, medico_id, data_atendimento, diagnostico)
VALUES ('uuid-pessoa', get_current_medico_id(), CURRENT_DATE, 'Teste');  -- ✅

-- Deve FALHAR: criar prontuário para outro médico
INSERT INTO tbamb_prontuarios (pessoa_id, medico_id, data_atendimento, diagnostico)
VALUES ('uuid-pessoa', 'outro-medico-uuid', CURRENT_DATE, 'Teste');  -- ❌ Violação RLS
```

### 6.3. Testar Janela de 24h para Edição

```sql
-- Criar prontuário
INSERT INTO tbamb_prontuarios (...) VALUES (...);

-- Atualizar dentro de 24h
UPDATE tbamb_prontuarios SET diagnostico = 'Atualizado' WHERE id = '...';  -- ✅

-- Simular passagem de 24h (apenas para teste)
UPDATE tbamb_prontuarios SET created_at = NOW() - INTERVAL '25 hours' WHERE id = '...';

-- Tentar atualizar após 24h
UPDATE tbamb_prontuarios SET diagnostico = 'Atualizado' WHERE id = '...';  -- ❌ Falha
```

---

## 7. Considerações Especiais

### 7.1. Service Role (Bypass RLS)

Para operações administrativas do backend, use o **Service Role Key** do Supabase que **bypassa RLS**.

```typescript
// Client-side (com RLS)
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(SUPABASE_URL, ANON_KEY)  // Respeita RLS

// Server-side (sem RLS)
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)  // Bypass RLS
```

### 7.2. Auditoria de Acessos

Criar tabela de logs de acesso a prontuários:

```sql
CREATE TABLE audit_prontuario_acessos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prontuario_id UUID NOT NULL REFERENCES tbamb_prontuarios(id),
  usuario_id UUID NOT NULL,
  acao VARCHAR(20) NOT NULL,  -- 'leitura', 'criacao', 'atualizacao'
  data_hora TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Trigger para registrar acessos
CREATE OR REPLACE FUNCTION log_prontuario_acesso()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_prontuario_acessos (prontuario_id, usuario_id, acao)
  VALUES (NEW.id, auth.uid(), TG_OP);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_prontuario
AFTER INSERT OR UPDATE ON tbamb_prontuarios
FOR EACH ROW EXECUTE FUNCTION log_prontuario_acesso();
```

### 7.3. Tratamento de Erros no Frontend

```typescript
// React/TypeScript - Tratamento de erro RLS
const { data, error } = await supabase
  .from('tbamb_prontuarios')
  .select('*')

if (error) {
  if (error.code === 'PGRST301') {  // Forbidden
    console.error('Acesso negado: você não tem permissão para ver este prontuário')
  }
}
```

### 7.4. Performance

- Funções RLS são executadas a **cada query**
- Usar `SECURITY DEFINER` com cautela (pode abrir brechas)
- Índices em campos usados em políticas (`medico_id`, `role`)
- Evitar subconsultas complexas em políticas

### 7.5. LGPD e Conformidade

- **Direito ao esquecimento**: Implementar soft delete, não hard delete
- **Anonimização**: Após período, anonimizar dados de pessoas
- **Logs de acesso**: Manter por 5 anos (CFM)
- **Criptografia**: Supabase já criptografa dados em rest e transit

---

## Resumo de Segurança

| Tabela | Público | Operador | Triagem | Médico | Admin |
|--------|---------|----------|---------|--------|-------|
| `tbamb_consultorio` | ✅ Ler (ativos) | ✅ Ler | ✅ Ler | ✅ Ler | ✅ Tudo |
| `tbamb_medicos` | ✅ Ler (ativos) | ✅ Ler | ✅ Ler | ✅ Ler | ✅ Tudo |
| `tbamb_chamadas` | ✅ Ler | ✅ Ler | ✅ Criar | ✅ Criar | ✅ Tudo |
| `tbamb_pessoas` | ❌ | ✅ Criar/Ler | ✅ Criar/Ler | ✅ Criar/Ler | ✅ Tudo |
| `tbamb_senhas` | ❌ | ✅ Criar/Ler | ✅ Tudo | ✅ Tudo | ✅ Tudo |
| `tbamb_triagem` | ❌ | ❌ | ✅ Tudo | ✅ Ler | ✅ Tudo |
| `tbamb_atendimentos` | ❌ | ❌ | ❌ | ✅ Seus (C/R/U) | ✅ Tudo |
| `tbamb_prontuarios` | ❌ | ❌ | ❌ | ✅ Seus (C/R/U 24h) | ✅ Tudo |
| `tbamb_prescricoes` | ❌ | ❌ | ❌ | ✅ Seus (C/R/U 24h) | ✅ Tudo |

**Legenda**: C = Create, R = Read, U = Update, D = Delete (ninguém pode deletar, apenas soft delete)
