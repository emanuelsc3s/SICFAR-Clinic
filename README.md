# SICFAR-Clinic

Sistema de Senhas Ambulatoriais - Gestão de Filas Médicas

## Sobre o Projeto

SICFAR-Clinic é um sistema de gerenciamento de senhas para ambientes ambulatoriais, desenvolvido para otimizar o fluxo de atendimento médico e melhorar a experiência de pacientes e profissionais de saúde.

## Tecnologias Utilizadas

Este projeto foi desenvolvido com as seguintes tecnologias:

- **Vite** - Build tool e dev server
- **React 18.3.1** - Framework UI
- **TypeScript** - Tipagem estática
- **React Router DOM** - Roteamento
- **Supabase** - Backend as a Service
- **TanStack React Query** - Gerenciamento de estado
- **shadcn/ui** - Componentes UI baseados em Radix UI
- **Tailwind CSS** - Estilização
- **React Hook Form + Zod** - Formulários e validação
- **Lucide React** - Ícones
- **Recharts** - Gráficos
- **Sonner** - Notificações toast

## Pré-requisitos

- Node.js (recomendado: usar [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- npm ou yarn

## Instalação

```bash
# Clone o repositório
git clone <YOUR_GIT_URL>

# Navegue até o diretório do projeto
cd SICFAR-Clinic

# Instale as dependências
npm install

# Configure as variáveis de ambiente
# Crie um arquivo .env.local baseado no .env.example
cp .env.example .env.local

# Inicie o servidor de desenvolvimento
npm run dev
```

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento na porta 8080
- `npm run build` - Compila o projeto para produção
- `npm run build:dev` - Compila o projeto em modo desenvolvimento
- `npm run lint` - Executa o linter
- `npm run preview` - Visualiza o build de produção

## Estrutura do Projeto

```
SICFAR-Clinic/
├── src/
│   ├── components/     # Componentes React
│   ├── pages/          # Páginas da aplicação
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilitários e configurações
│   ├── utils/          # Funções utilitárias
│   └── main.tsx        # Ponto de entrada
├── public/             # Arquivos estáticos
└── index.html          # HTML template
```

## Configuração do Ambiente

O projeto requer variáveis de ambiente para conectar ao Supabase. Configure-as no arquivo `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Licença

Este projeto é privado e proprietário.
