# PyScheduler — Orquestrador de Jobs Python

Sistema para agendamento e orquestração de scripts Python, construído com FastAPI, APScheduler, React e Supabase (PostgreSQL).

![Dashboard](https://img.shields.io/badge/status-MVP-6366f1?style=flat-square)
![Python](https://img.shields.io/badge/python-3.11-3b82f6?style=flat-square)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-10b981?style=flat-square)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square)

---

## Funcionalidades

- **Gerenciamento de Jobs** — Crie, edite, duplique, pause, retome e delete jobs agendados
- **Múltiplos Tipos de Agendamento** — Expressões cron, intervalos, diário, semanal, mensal, execução única
- **Executor Python** — Roda scripts em subprocessos isolados com timeout, captura de stdout/stderr e lógica de retry
- **Logs em Tempo Real** — Streaming via WebSocket com visualizador estilo terminal
- **Histórico de Execuções** — Trilha completa com status, duração, código de saída e logs completos
- **Dashboard** — Métricas, taxa de sucesso, timeline e saúde do sistema
- **Sistema de Retry** — Máximo de tentativas e delay configuráveis
- **Autenticação JWT** — Login/logout seguro com tokens de acesso e refresh
- **Interface Dark Mode** — Tema escuro profissional inspirado no Linear, Vercel e Railway

---

## Início Rápido (Docker)

```bash
# Clone e inicie
git clone <repo>
cd python-scheduler

# Copie o arquivo de ambiente
cp .env.example .env
# Edite o .env com suas credenciais do Supabase

# Suba tudo
docker-compose up --build
```

O sistema irá:
1. Iniciar o backend (cria tabelas no Supabase + popula dados de exemplo)
2. Iniciar o frontend

**Acesso:**
- Frontend: http://localhost:3000
- API do Backend: http://localhost:8000
- Documentação da API: http://localhost:8000/docs

**Credenciais padrão:**
```
Email:    admin@scheduler.local
Senha:    admin123
```

---

## Desenvolvimento Local

### Backend

```bash
cd backend

# Crie o virtualenv
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instale as dependências
pip install -r requirements.txt

# Configure o .env com as URLs do Supabase
cp ../.env.example ../.env

# Popule os dados iniciais
python seed.py

# Inicie o servidor
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

npm install
npm run dev
# → http://localhost:5173
```

---

## Arquitetura

```
python-scheduler/
├── backend/
│   ├── app/
│   │   ├── main.py              # App FastAPI + hooks de ciclo de vida
│   │   ├── api/routes/          # Endpoints REST + WebSocket
│   │   ├── core/                # Config, banco de dados, segurança JWT
│   │   ├── models/              # Modelos ORM SQLAlchemy
│   │   ├── schemas/             # DTOs Pydantic
│   │   ├── repositories/        # Camada de acesso a dados
│   │   ├── services/            # Regras de negócio
│   │   ├── scheduler/           # Configuração do APScheduler + sincronização
│   │   └── executor/            # Executor de subprocessos Python + gerenciador WS
│   ├── scripts/                 # Scripts Python de exemplo
│   └── seed.py                  # Dados iniciais
└── frontend/
    └── src/
        ├── pages/               # Login, Dashboard, Jobs, Execuções, Logs, Monitoramento, Configurações
        ├── components/          # Componentes de UI reutilizáveis
        ├── hooks/               # Hooks do React Query
        ├── stores/              # Store de autenticação (Zustand)
        └── lib/                 # Cliente API, utilitários
```

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite 5 + TypeScript |
| Estilização | TailwindCSS + shadcn/ui |
| Estado | TanStack Query v5 + Zustand v4 |
| Backend | FastAPI 0.109 + Python 3.11 |
| Banco de Dados | Supabase (PostgreSQL 16) + SQLAlchemy 2 async |
| Scheduler | APScheduler 3.10 (MemoryJobStore) |
| Autenticação | JWT (python-jose + passlib/bcrypt) |
| Tempo Real | WebSocket (nativo FastAPI) |
| Container | Docker + Docker Compose |

---

## Visão Geral da API

```
POST   /api/auth/login
POST   /api/auth/refresh
GET    /api/auth/me

GET    /api/jobs                   Listar + filtrar + buscar
POST   /api/jobs                   Criar job
GET    /api/jobs/{id}
PUT    /api/jobs/{id}
DELETE /api/jobs/{id}
POST   /api/jobs/{id}/run          Trigger manual
POST   /api/jobs/{id}/pause
POST   /api/jobs/{id}/resume
POST   /api/jobs/{id}/duplicate

GET    /api/executions             Listar execuções
GET    /api/executions/{id}
POST   /api/executions/{id}/cancel
GET    /api/executions/{id}/logs

GET    /api/scripts                Listar scripts disponíveis
POST   /api/scripts/upload         Upload de script .py

GET    /api/dashboard/metrics
GET    /api/dashboard/timeline

GET    /api/logs/export?execution_id=...

WS     /ws/executions/{id}         Stream de logs em tempo real

GET    /api/health
```

Documentação interativa completa disponível em `http://localhost:8000/docs`.

---

## Adicionando Scripts Python

Coloque arquivos `.py` em `backend/scripts/` ou faça upload diretamente pela interface ao criar um job. O executor procura os scripts relativos ao `SCRIPTS_DIR` (padrão: `./scripts`).

Exemplo:
```python
# backend/scripts/meu_job.py
import sys
print("Iniciando meu job...")
# ... sua lógica aqui
sys.exit(0)  # saída 0 = sucesso, qualquer outro código = falha
```

Depois crie um job na interface com o caminho do script `meu_job.py`.

---

## Variáveis de Ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `DATABASE_URL` | postgresql+asyncpg://… | URL do banco (async, via PgBouncer session mode) |
| `DATABASE_SYNC_URL` | postgresql://… | URL do banco (sync, para Alembic) |
| `SECRET_KEY` | — | Chave de assinatura JWT (troque em produção!) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 30 | Tempo de vida do token de acesso |
| `REFRESH_TOKEN_EXPIRE_DAYS` | 7 | Tempo de vida do refresh token |
| `SCRIPTS_DIR` | ./scripts | Diretório dos scripts Python |
| `MAX_CONCURRENT_EXECUTIONS` | 5 | Limite de execuções simultâneas |
| `CORS_ORIGINS` | http://localhost:5173 | Origens permitidas pelo CORS |

---

## Checklist para Produção

- [ ] Troque o `SECRET_KEY` por um valor aleatório forte
- [ ] Use senha forte no banco de dados
- [ ] Habilite HTTPS (proxy reverso: nginx/Caddy)
- [ ] Defina `CORS_ORIGINS` com o domínio real do frontend
- [ ] Monte volume persistente para `backend/scripts`
- [ ] Configure backups do banco de dados
- [ ] Configure política de retenção de logs

---

## Roadmap

- [ ] Notificações por e-mail / Slack em caso de falha
- [ ] Suporte multi-tenant
- [ ] Gerenciamento de variáveis de ambiente pela interface
- [ ] Monitoramento de recursos de execução (CPU/memória)
- [ ] Workers distribuídos
- [ ] Execução baseada em containers (Docker)
- [ ] Exportação de métricas (Prometheus)
