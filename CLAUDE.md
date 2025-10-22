# CLAUDE.md

Este arquivo fornece orientações para o Claude Code (claude.ai/code) ao trabalhar com código neste repositório.

## Idioma e Comunicação

**IMPORTANTE**: Sempre responda em português brasileiro, escreva comentários no código em português e gere toda documentação em português. Este é um sistema brasileiro para gestão de filas ambulatoriais e toda comunicação deve ser em português.

## Sobre o Projeto

SICFAR-Clinic é um sistema de gerenciamento de senhas para ambientes ambulatoriais, desenvolvido para otimizar o fluxo de atendimento médico. O sistema permite:
- Geração de senhas normais e prioritárias via tablet
- Impressão automática de senhas
- Chamada de pacientes pela triagem e consultórios médicos
- Visualização em TV das chamadas em tempo real
- Dashboard com estatísticas e histórico

## Stack Tecnológico

- **Frontend**: React 18.3.1 + TypeScript + Vite
- **UI**: shadcn/ui (Radix UI) + Tailwind CSS
- **Roteamento**: React Router DOM v6
- **Estado**: Context API (QueueContext) + TanStack React Query
- **Backend**: Supabase (BaaS)
- **Formulários**: React Hook Form + Zod
- **Impressão**: Tickets via iframe/window.print (formato B8)

## Comandos Principais

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento (porta 8080)
npm run check-env        # Verifica variáveis de ambiente

# Build
npm run build            # Build de produção (TypeScript + Vite)
npm run build:dev        # Build em modo desenvolvimento
npm run preview          # Visualiza build de produção

# Qualidade
npm run lint             # ESLint com TypeScript
```

## Arquitetura e Estrutura

### Rotas Principais

O aplicativo possui as seguintes rotas (ver `src/App.tsx:28-37`):

- `/` - Página inicial (Index)
- `/tablet` - Interface para geração de senhas (tablet touchscreen)
- `/triagem` - Interface para triagem chamar pacientes
- `/medico` - Interface para médicos chamarem pacientes nos consultórios
- `/tv` - Tela de TV para exibição das chamadas
- `/prontuario` - Prontuário eletrônico
- `/dashboard` - Dashboard com estatísticas

### Gerenciamento de Estado (QueueContext)

O estado global da fila é gerenciado pelo `QueueContext` (`src/context/QueueContext.tsx`):

**Estado:**
```typescript
{
  patients: Patient[],        // Lista de pacientes
  currentCalls: CallHistory[], // Últimas 6 chamadas (para TV)
  stats: QueueStats           // Estatísticas do dia
}
```

**Actions disponíveis:**
- `ADD_PATIENT` - Adiciona novo paciente à fila
- `CALL_PATIENT` - Chama paciente (triagem ou consultório)
- `COMPLETE_PATIENT` - Marca paciente como atendido

**Hook de acesso:**
```typescript
const { state, dispatch } = useQueue();
```

### Sistema de Senhas

**Formato das senhas:**
- Normal: `N001`, `N002`, etc.
- Prioritária: `P001`, `P002`, etc.

**Tipos de paciente** (`src/types/queue.ts`):
- `type`: `'normal' | 'priority'`
- `status`: `'waiting' | 'called' | 'in_service' | 'completed'`

### Impressão de Senhas

A impressão é feita via `printTicket()` em `src/utils/printTicket.ts`:
- Cria iframe oculto com HTML da senha
- Formato: B8 landscape (88mm × 62mm)
- Inclui número da senha, matrícula do colaborador, data/hora
- Impressão automática para senhas normais (ver `src/pages/Tablet.tsx:48-54`)

## Variáveis de Ambiente

Criar arquivo `.env.local` com:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

O script `scripts/check-env.js` verifica as variáveis antes de iniciar o dev server.

## Convenções de Código

- Usar TypeScript estrito
- Componentes funcionais com hooks
- Props tipadas com interfaces
- Tailwind CSS para estilização (sem CSS modules)
- shadcn/ui para componentes base
- Comentários e mensagens em português brasileiro