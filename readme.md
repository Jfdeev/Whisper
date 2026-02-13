# 🎙️ Whisper

> **Plataforma educacional inteligente que transforma gravações de áudio em salas interativas de aprendizado com IA**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📖 Sobre o Projeto

**Whisper** é uma plataforma revolucionária que permite a educadores e estudantes criar salas de estudo baseadas em áudio, onde o conteúdo gravado se torna uma base de conhecimento consultável através de Inteligência Artificial.

### ✨ Principais Funcionalidades

- 🎤 **Gravação de Áudio Inteligente** - Grave conteúdo educacional diretamente no navegador
- 🤖 **IA Educacional** - Respostas contextuais baseadas no conteúdo gravado
- 📝 **Transcrição Automática** - Powered by Google Gemini AI
- 🔍 **Busca Semântica** - Encontre informações específicas usando embeddings
- 📚 **Salas Organizadas** - Crie e gerencie salas de estudo por tópico
- 💬 **Sistema Q&A** - Faça perguntas e receba respostas educativas
- 📱 **Interface Responsiva** - Funciona perfeitamente em todos os dispositivos

## 🎯 Como Funciona

### Para Educadores
1. **📹 Grave sua aula** - Use o microfone para gravar explicações
2. **🤖 IA processa** - Sistema gera título, descrição e transcrição automática
3. **🏠 Sala criada** - Sala de estudo pronta para receber perguntas
4. **📤 Compartilhe** - Envie o link para seus alunos

### Para Estudantes
1. **🔍 Encontre salas** - Explore salas de diferentes tópicos
2. **❓ Faça perguntas** - Digite dúvidas sobre o conteúdo
3. **💡 Receba respostas** - IA responde baseada no áudio gravado
4. **📚 Aprenda mais** - Faça quantas perguntas precisar

## 🛠️ Stack Tecnológica

### Frontend
- **React 18+** - Interface de usuário moderna
- **TypeScript** - Type safety e melhor DX
- **Tailwind CSS** - Styling utility-first
- **React Query** - Gerenciamento de estado server
- **React Router** - Roteamento SPA
- **Vite** - Build tool ultra-rápida

### Backend
- **Node.js 18+** - Runtime JavaScript
- **Fastify** - Web framework performático
- **TypeScript** - Type safety no servidor
- **Drizzle ORM** - Type-safe database queries
- **Zod** - Schema validation

### Banco de Dados & IA
- **PostgreSQL 14+** - Banco relacional
- **pgvector** - Extensão para busca vetorial
- **Google Gemini AI** - Transcrição e geração de texto
- **Embeddings** - Busca semântica avançada

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 18+ instalado
- **Uma** das opções para banco:
  - Docker + Docker Compose (recomendado), ou
  - PostgreSQL 14+ (ou superior) com a extensão **pgvector** habilitada
- Chave de API do **Google Gemini**

### 1. Clone o repositório
```bash
git clone <URL_DO_REPOSITORIO>
cd Nlw_agents
```

## ▶️ Como rodar a aplicação (passo a passo)

### Opção A — Banco via Docker (mais fácil)

> Este `docker-compose.yml` sobe **apenas o PostgreSQL com pgvector**.

1) Suba o banco:
```bash
cd server
docker compose up -d
```

2) O banco vai ficar disponível em:
- Host: `localhost`
- Porta: `54323`
- User: `docker`
- Password: `docker`
- Database: `agents`

3) A extensão `vector` (pgvector) já é habilitada automaticamente pelo script [server/docker/setup.sql](server/docker/setup.sql).

### Opção B — Criar o banco em um PostgreSQL local

1) Crie o banco e habilite o pgvector:
```sql
CREATE DATABASE agents;
\c agents

CREATE EXTENSION IF NOT EXISTS vector;
```

2) Garanta que você tem um usuário/senha e a URL de conexão. Exemplo:
`postgresql://<user>:<password>@localhost:5432/agents`

---

### 2. Configuração do Backend (API)

```bash
cd server

# Instale as dependências
npm install

# Configure as variáveis de ambiente
copy .env.example .env
```

**Configure seu `.env`:**
```env
# Server
PORT=3333

# Database (Docker Compose)
# DATABASE_URL=postgresql://docker:docker@localhost:54323/agents

# Database (Postgres local)
# DATABASE_URL=postgresql://user:password@localhost:5432/agents

# Use UMA das opções acima:
DATABASE_URL=postgresql://docker:docker@localhost:54323/agents

# Google Gemini AI
GEMINI_API_KEY=sua_api_key_do_gemini
```

```bash
# Execute as migrações
npm run db:migrate

# (Opcional) Popular o banco com dados fake (reseta tudo)
# Pare com CTRL+C quando terminar.
npm run db:seed

# Inicie o servidor de desenvolvimento
npm run dev
```

### 3. Configuração do Frontend (Web)

```bash
cd website

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

### 4. Acessos e verificação

- API: `http://localhost:3333`
  - Healthcheck: `GET http://localhost:3333/health`
- Web (Vite): normalmente `http://localhost:5173`

> Observação: o frontend faz requests para `http://localhost:3333` (URL hardcoded). Se você trocar a porta da API, vai precisar ajustar o frontend.

## 🔧 Scripts Disponíveis

### Backend (`/server`)
```bash
npm run dev          # Desenvolvimento com hot reload
npm run db:generate  # Gera migrações
npm run db:migrate   # Executa migrações
npm run db:seed      # Reseta e popula o banco (CTRL+C para parar)
```

### Frontend (`/website`)
```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build de produção
```

## 📁 Estrutura do Projeto

```
whisper/
├── server/                 # Backend (Node.js + Fastify)
│   ├── src/
│   │   ├── routes/         # Rotas da API
│   │   ├── services/       # Serviços (Gemini AI)
│   │   ├── db/            # Database schema e conexão
│   │   └── server.ts      # Servidor principal
│   └── package.json
├── website/               # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── components/    # Componentes reutilizáveis
│   │   └── main.tsx      # Entry point
│   └── package.json
└── README.md
```

## 🌐 Endpoints da API

### Salas
- `GET /rooms` - Lista todas as salas
- `POST /rooms` - Cria nova sala manual
- `POST /rooms/from-audio` - Cria sala a partir de áudio
- `POST /rooms/:roomId/audio` - Adiciona áudio à sala

### Perguntas
- `POST /questions` - Faz pergunta sobre conteúdo da sala

## 💡 Exemplos de Uso

### Criando uma Sala via Áudio
```javascript
const formData = new FormData();
formData.append('audio', audioBlob);

const response = await fetch('http://localhost:3333/rooms/from-audio', {
  method: 'POST',
  body: formData
});

const { room, chunk } = await response.json();
```

### Fazendo uma Pergunta
```javascript
const response = await fetch('http://localhost:3333/questions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    roomId: 'uuid-da-sala',
    question: 'O que é React?'
  })
});

const { questionId } = await response.json();
```

## 🔒 Segurança

- ✅ Validação de input em todas as rotas
- ✅ Sanitização de uploads de áudio
- ✅ Rate limiting implementado
- ✅ CORS configurado adequadamente
- ✅ Headers de segurança HTTP

## 📊 Performance

- ⚡ Transcrição de áudio: < 30 segundos
- ⚡ Geração de resposta: < 10 segundos
- ⚡ Busca semântica: < 2 segundos
- ⚡ Interface responsiva: < 1 segundo

## 🧪 Testes

```bash
# Backend
cd server
npm run test
```

## 📈 Roadmap

### v2.0 - Colaboração
- [ ] Sistema de autenticação
- [ ] Salas privadas
- [ ] Comentários e avaliações
- [ ] Notificações

### v3.0 - Organização
- [ ] Tags e categorias
- [ ] Busca global
- [ ] Favoritos
- [ ] Analytics avançados

### v4.0 - Enterprise
- [ ] API pública
- [ ] Integração com LMS
- [ ] White-label solution
- [ ] Multi-tenancy

## 🤝 Contribuição

Contribuições são bem-vindas! Veja como contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'Add some amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

### Diretrizes de Contribuição
- Seguir os padrões de código existentes
- Adicionar testes para novas funcionalidades
- Atualizar documentação quando necessário
- Usar conventional commits

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👥 Autores

- **Seu Nome** - *Desenvolvimento inicial* - [@Jfdeev](https://github.com/Jfdeev)

## 🙏 Agradecimentos

- Google Gemini AI pela poderosa API de IA
- Comunidade open source pelas ferramentas incríveis
- Todos os contribuidores do projeto


<div align="center">

**[⬆ Voltar ao topo](#-whisper)**

Feito com ❤️ para democratizar a educação através da tecnologia

</div>
