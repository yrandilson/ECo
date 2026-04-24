# EcoMonitor — Documentação Completa do Projeto (TCC)

> **Versão:** 2.0.0  
> **Data:** Março 2026  
> **Status:** Produção  
> **Licença:** MIT

---

## Sumário

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Requisitos do Sistema](#2-requisitos-do-sistema)
3. [Arquitetura Técnica](#3-arquitetura-técnica)
4. [Banco de Dados](#4-banco-de-dados)
5. [Backend — API e Serviços](#5-backend--api-e-serviços)
6. [Frontend — Interface do Usuário](#6-frontend--interface-do-usuário)
7. [Integrações Externas](#7-integrações-externas)
8. [Machine Learning](#8-machine-learning)
9. [Motor de Análise Física](#9-motor-de-análise-física)
10. [Simuladores Educativos](#10-simuladores-educativos)
11. [Sistema de Gamificação](#11-sistema-de-gamificação)
12. [Segurança e Autenticação](#12-segurança-e-autenticação)
13. [Guia de Instalação](#13-guia-de-instalação)
14. [Manual do Usuário](#14-manual-do-usuário)
15. [Referência da API (tRPC)](#15-referência-da-api-trpc)
16. [Roadmap de Melhorias Futuras](#16-roadmap-de-melhorias-futuras)
17. [Métricas e Dados de Teste](#17-métricas-e-dados-de-teste)
18. [Estrutura de Pastas do Projeto](#18-estrutura-de-pastas-do-projeto)
19. [Changelog de Melhorias (v2.0)](#19-changelog-de-melhorias-v20)

---

## 1. Visão Geral do Projeto

O **EcoMonitor** é uma plataforma web colaborativa de monitoramento ambiental que integra:

- **Monitoramento ambiental em tempo real** — Coleta distribuída de dados
- **Validação por satélite (NASA FIRMS)** — Confirmação automática de focos de calor
- **Dados meteorológicos (OpenWeatherMap)** — Condições climáticas reais
- **Machine Learning** — Previsão de risco de incêndio (1-7 dias)
- **Gamificação** — Sistema de pontos, badges e rankings para engajamento
- **Mapas interativos** — Geolocalização com clustering via Leaflet.js
- **Análise científica** — Modelos físicos (Arrhenius, Rothermel, Penman, Darcy, Gaussiano)
- **Simuladores educativos** — Ferramentas interativas para aprendizado ambiental

### Stack Tecnológico

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4, shadcn/ui, Recharts, Leaflet.js |
| Backend | Node.js 22, Express 4, tRPC 11, Zod 4 |
| Banco de Dados | MySQL 8, Drizzle ORM 0.44 |
| ML/IA | Regressão Linear, Random Forest, Neural Network (TypeScript nativo) |
| Integrações | NASA FIRMS API, OpenWeatherMap API, Nodemailer (SMTP) |
| DevOps | pnpm, Vitest, ESBuild, Prettier |

---

## 2. Requisitos do Sistema

### 2.1 Módulos Principais

| # | Módulo | Descrição |
|---|--------|-----------|
| 1 | **Cadastro Colaborativo** | Formulário com campos dinâmicos por tipo, 7 tipos de ocorrências, upload de até 5 fotos, geolocalização GPS |
| 2 | **Análise Física** | Propagação de incêndio (Arrhenius + Rothermel), hidrologia (Penman + Darcy), poluição (Gaussiano) |
| 3 | **Simuladores Educativos** | Incêndio, hidrológico, poluição, desmatamento, qualidade da água |
| 4 | **Validação Híbrida** | Comunitária (votos) + automática (NASA FIRMS, confiança > 60%) |
| 5 | **Alertas Geoespaciais** | Raio 1-50 km, 4 níveis de severidade, notificações |
| 6 | **Dashboard Analítico** | Mapa interativo, gráficos temporais, estatísticas agregadas, exportação PDF |
| 7 | **Gamificação** | Pontos, 6 badges, ranking mensal/global, trust score |

### 2.2 Tipos de Ocorrências

- 🔥 Incêndio (`fire`) — Parâmetros: temperatura, umidade, vento, vegetação
- 💧 Poluição da Água (`water_pollution`) — Parâmetros: nível, cor, odor, espuma
- 🌫️ Poluição do Ar (`air_pollution`) — Parâmetros: qualidade, visibilidade, odor
- ☀️ Seca (`drought`)
- 🌳 Desmatamento (`deforestation`)
- 🌊 Enchente (`flooding`)
- 📋 Outros (`other`)

### 2.3 Pré-requisitos de Infraestrutura

- Node.js 18+ (recomendado 22.x)
- MySQL 8.0+
- pnpm 10+
- Chaves de API: NASA FIRMS (opcional), OpenWeatherMap (opcional)
- Servidor SMTP para emails (opcional)

---

## 3. Arquitetura Técnica

### 3.1 Visão Geral

```
┌──────────────────┐     ┌──────────────────────┐     ┌─────────────┐
│  Cliente React    │────▶│  Express + tRPC API   │────▶│  MySQL 8    │
│  (Vite/SPA)      │◀────│  (Node.js)            │◀────│  (Drizzle)  │
└──────────────────┘     └──────────┬───────────┘     └─────────────┘
                                    │
                         ┌──────────┼───────────┐
                         │          │           │
                    ┌────▼────┐ ┌───▼───┐ ┌────▼────┐
                    │ NASA    │ │OpenWx │ │ Email   │
                    │ FIRMS   │ │ Map   │ │ (SMTP)  │
                    └─────────┘ └───────┘ └─────────┘
```

### 3.2 Fluxo de Dados

1. **Usuário** reporta ocorrência via formulário React
2. **Frontend** valida dados com Zod e envia via tRPC
3. **Backend** persiste no MySQL, calcula risco físico, concede pontos
4. **Worker** (background) valida incêndios via NASA FIRMS a cada 3h
5. **Dashboard** agrega e exibe dados em tempo real

### 3.3 Autenticação

- **Método:** JWT com cookie HttpOnly
- **Registro:** Email + Senha (bcrypt hash, salt 10)
- **Login:** Valida credenciais, gera JWT
- **Sessão:** Cookie seguro com expiração configurável
- **Reset de senha:** Token crypto de 32 bytes, válido por 24h, enviado por email
- **Roles:** `user`, `moderator`, `admin`

---

## 4. Banco de Dados

### 4.1 Modelo Relacional (Drizzle ORM)

**9 tabelas principais:**

#### `users`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INT AUTO_INCREMENT PK | Identificador |
| openId | VARCHAR(64) UNIQUE | ID OAuth (compatibilidade) |
| passwordHash | VARCHAR(255) | Hash bcrypt |
| name | TEXT | Nome do usuário |
| email | VARCHAR(320) UNIQUE | Email |
| role | ENUM('user','moderator','admin') | Papel |
| points | INT DEFAULT 0 | Pontos gamificação |
| trustScore | DECIMAL(3,2) DEFAULT 0.50 | Score de confiança |
| resetToken | VARCHAR(255) | Token de reset de senha |
| resetTokenExpires | TIMESTAMP | Expiração do token |
| createdAt/updatedAt/lastSignedIn | TIMESTAMP | Datas |

#### `occurrences`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INT AUTO_INCREMENT PK | Identificador |
| userId | INT NOT NULL | FK → users.id |
| type | ENUM(7 tipos) | Tipo de ocorrência |
| latitude/longitude | DECIMAL(10/11, 8) | Coordenadas GPS |
| description | TEXT | Descrição |
| severity | ENUM('low','medium','high','critical') | Severidade |
| status | ENUM('pending','validated','rejected','archived') | Status |
| validatedBySatellite | BOOLEAN | Validação NASA |
| communityValidations/communityRejections | INT | Votos |
| physicalParameters | JSON | Parâmetros físicos dinâmicos |
| riskScore | DECIMAL(5,2) | Score de risco calculado |

#### `photos`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INT PK | Identificador |
| occurrenceId | INT NOT NULL | FK → occurrences.id |
| photoUrl | VARCHAR(512) | URL da foto |

#### `validations`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INT PK | Identificador |
| occurrenceId | INT NOT NULL | FK → occurrences.id |
| userId | INT NOT NULL | FK → users.id |
| isValid | BOOLEAN | Voto válido/inválido |
| comment | TEXT | Comentário |

#### `simulations`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INT PK | Identificador |
| userId | INT NOT NULL | FK → users.id |
| type | ENUM('fire','water','pollution','deforestation','water-quality') | Tipo |
| parameters | JSON | Parâmetros de entrada |
| results | JSON | Resultados calculados |

#### `alerts`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INT PK | Identificador |
| userId | INT NOT NULL | FK → users.id |
| occurrenceId | INT | FK → occurrences.id |
| type | ENUM('geofence','severity','validation','news') | Tipo |
| severity | ENUM severidade | Nível |
| message | TEXT | Mensagem |
| isRead | BOOLEAN | Lido/não lido |

#### `badges`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INT PK | Identificador |
| userId | INT NOT NULL | FK → users.id |
| badgeType | ENUM(6 tipos) | Tipo do badge |

#### `rankings`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INT PK | Identificador |
| userId | INT UNIQUE | FK → users.id |
| monthlyPoints/totalPoints | INT | Pontos |
| monthlyRank/overallRank | INT | Ranking |

#### `content_reports`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INT PK | Identificador |
| reporterId | INT NOT NULL | FK → users.id |
| contentType | ENUM('post','comment','user','image','other') | Tipo de conteúdo |
| reportType | ENUM('spam','harassment','false_info','inappropriate','copyright','other') | Tipo de denúncia |
| reason/description | TEXT | Motivo |
| status | ENUM('pending','reviewing','resolved','dismissed') | Status |
| moderatorId | INT | FK → users.id (moderador) |
| communityVotes | INT | Votos da comunidade |

### 4.2 Índices

- `users`: role_idx, email_idx
- `occurrences`: user_idx, type_idx, status_idx, geo_idx (latitude, longitude)
- `validations`: validation_occurrence_idx, validation_user_idx
- `simulations`: sim_user_idx
- `alerts`: alert_user_idx
- `badges`: badge_user_idx

---

## 5. Backend — API e Serviços

### 5.1 Estrutura do Servidor

```
server/
├── _core/           # Framework: Express setup, tRPC config, middleware
│   ├── index.ts     # Entry point (porta, middleware, rotas)
│   ├── trpc.ts      # Configuração tRPC (publicProcedure, protectedProcedure)
│   ├── cookies.ts   # Utilitários de cookie
│   └── env.ts       # Variáveis de ambiente tipadas
├── db/              # Camada de dados (módulos separados)
│   ├── users.ts     # Queries de usuários
│   ├── occurrences.ts # Queries de ocorrências
│   ├── validations.ts # Queries de validações
│   ├── reports.ts   # Queries de denúncias
│   └── index.ts     # Re-exporta tudo
├── routers/         # Routers tRPC (um por domínio)
│   ├── occurrences.ts
│   ├── validations.ts
│   ├── simulations.ts
│   ├── alerts.ts
│   ├── gamification.ts
│   ├── weather.ts
│   ├── satellite.ts
│   ├── predictions.ts
│   ├── chatbot.ts
│   └── reports.ts
├── integrations/    # APIs externas
│   ├── openweather.ts
│   └── nasa-firms.ts (via nasa-firms-service.ts)
├── auth-local.ts    # Autenticação local (login/registro/reset)
├── cache.ts         # Cache in-memory com TTL
├── email-service.ts # Envio de emails (SMTP/Nodemailer)
├── ml-predictor.ts  # Modelos ML de predição
├── physics.ts       # Motor de cálculos físicos
├── storage.ts       # Upload de arquivos
└── workers/         # Background jobs
    └── satellite-validation.ts # Worker NASA FIRMS (3h)
```

### 5.2 Routers tRPC

| Router | Endpoints Principais | Acesso |
|--------|---------------------|--------|
| `auth` | me, uploadPhoto, logout | Público/Protegido |
| `occurrences` | create, getRecent, getById, getByType, getCritical, getByStatus, getStats | Protegido/Público |
| `validations` | create, getByOccurrence | Protegido/Público |
| `simulations` | create, getUserSimulations | Protegido |
| `alerts` | getUserAlerts, markAsRead | Protegido |
| `gamification` | getTopRankings, getMonthlyRankings, getUserBadges | Público |
| `predictions` | predictFireRisk | Público |
| `weather` | getCurrent, getForecast, getFireIndex | Público |
| `satellite` | validateOccurrence, getFireDetections, getStatistics | Protegido/Público |
| `reports` | create, list, updateStatus | Protegido |

### 5.3 Endpoints REST (Autenticação Local)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Cadastro novo usuário |
| POST | `/api/auth/login` | Login com email/senha |
| GET | `/api/auth/session` | Verificar sessão atual |
| POST | `/api/auth/forgot-password` | Solicitar reset de senha |
| POST | `/api/auth/reset-password` | Resetar senha com token |

---

## 6. Frontend — Interface do Usuário

### 6.1 Páginas da Aplicação

| Página | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| Home | `/` | Público | Landing page com features |
| Login | `/login` | Público | Login email/senha |
| Registro | `/register` | Público | Cadastro |
| Esqueci Senha | `/forgot-password` | Público | Solicitar reset |
| Reset Senha | `/reset-password` | Público | Nova senha via token |
| Sobre | `/about` | Público | Sobre o projeto |
| Dashboard | `/dashboard` | Protegido | Estatísticas e gráficos |
| Reportar Ocorrência | `/report` | Protegido | Formulário de denúncia |
| Mapa | `/map` | Protegido | Mapa interativo Leaflet |
| Simuladores | `/simulators` | Protegido | Simulações educativas |
| Feed | `/feed` | Protegido | Feed de ocorrências |
| Alertas | `/alerts` | Protegido | Alertas geoespaciais |
| Atividade | `/activity` | Protegido | Histórico de atividades |
| Denunciar Conteúdo | `/report-content` | Protegido | Reportar conteúdo |
| Exportar Dados | `/export` | Protegido | Download PDF/CSV |
| Configurações | `/settings` | Protegido | Preferências |
| Chatbot | `/chatbot` | Protegido | Assistente IA |
| Predições ML | `/predictive` | Protegido | Dashboard preditivo |
| Admin | `/admin` | Protegido (admin) | Painel administrativo |

### 6.2 Componentes Reutilizáveis

- `MainLayout` — Layout principal com sidebar e navegação
- `DashboardLayout` — Layout com skeleton loading
- `Map` — Componente Leaflet com clustering
- `PhotoUploader` / `PhotoUploaderEnhanced` — Upload de fotos com preview
- `ScenarioComparator` — Comparação lado-a-lado de simulações
- `SimulationHistory` — Histórico de simulações do usuário
- `AIChatBox` — Interface do chatbot
- `ErrorBoundary` — Captura de erros React
- `ui/` — Componentes shadcn/ui (30+ componentes)

---

## 7. Integrações Externas

### 7.1 NASA FIRMS (Fire Information for Resource Management System)

- **API:** `https://firms.modaps.eosdis.nasa.gov/api/area/csv`
- **Dados:** Detecções de focos de calor via satélites MODIS, VIIRS (NOAA-20)
- **Uso:** Validação automática de ocorrências de incêndio
- **Worker:** Roda a cada 3 horas
- **Critério:** Confiança > 60% dentro de 5km = validação automática
- **Cache:** 1 hora (in-memory)
- **Fallback:** Dados simulados quando API key não configurada

### 7.2 OpenWeatherMap

- **API:** `https://api.openweathermap.org`
- **Dados:** Temperatura, umidade, vento, pressão, UV, previsão 7 dias
- **Uso:** Enriquecimento de dados, Fire Weather Index (FWI), alimentação ML
- **Cache:** 30 minutos (in-memory)
- **Fallback:** Dados simulados quando API key não configurada

### 7.3 Serviço de Email (SMTP)

- **Provider:** Configurável (Gmail, Outlook, etc.)
- **Uso:** Reset de senha, confirmações
- **Templates:** HTML responsivo com branding EcoMonitor

---

## 8. Machine Learning

### 8.1 Modelos Implementados

O sistema usa um **ensemble** de 3 modelos para previsão de risco de incêndio:

| Modelo | Peso | Algoritmo |
|--------|------|-----------|
| Regressão Linear | 30% | Gradient Descent (10 iterações) |
| Random Forest | 40% | 5 árvores de decisão, profundidade 5 |
| Rede Neural | 30% | 2 camadas ocultas (8, 4 neurônios), ReLU + Sigmoid |

### 8.2 Features de Entrada

- Temperatura histórica (30 dias)
- Umidade histórica (30 dias)
- Velocidade do vento (30 dias)
- Precipitação (30 dias)
- Densidade de vegetação (0-100%)
- Elevação (metros)

### 8.3 Saída

Para cada dia (1-7 dias à frente):
- `predictedRiskScore` (0-100)
- `confidence` (0-1)
- `severity` ('low' | 'medium' | 'high' | 'critical')
- `recommendation` (texto em português)
- `factors` (contribuição de cada variável)

### 8.4 Interpretação do Risco

| Score | Severidade | Recomendação |
|-------|-----------|--------------|
| 0-25 | Baixo | Condições normais, manter monitoramento |
| 25-50 | Médio | Atenção, evitar queimadas |
| 50-75 | Alto | Alerta, acionar equipes de prevenção |
| 75-100 | Crítico | Emergência, evacuar áreas de risco |

---

## 9. Motor de Análise Física

### 9.1 Incêndio — Equação de Arrhenius + Rothermel

**Arrhenius (taxa de combustão):**
$$k = A \cdot e^{-E_a / (R \cdot T)}$$

Onde: $E_a = 50.000$ J/mol, $R = 8,314$ J/(mol·K), $T$ em Kelvin

**Rothermel (fator de vento):**
$$W_f = 1 + 0,1 \cdot v_{vento}$$

**Score combinado:**
$$Risco = (T_{norm} \cdot 0,3 + H_{norm} \cdot 0,3 + V_{norm} \cdot 0,2 + Arr \cdot 0,2) \times V_{veg} \times W_f \times 100$$

### 9.2 Hidrologia — Penman + Darcy

- **Penman:** Fator de evaporação baseado em temperatura e umidade
- **Darcy:** Infiltração baseada no nível da água
- **Índice de cor:** clear=0.1, cloudy=0.4, brown=0.7, green(algas)=0.9

### 9.3 Poluição do Ar — Modelo Gaussiano de Pluma

- **Fatores:** Qualidade do ar (good/moderate/poor) e visibilidade (clear/hazy/poor)
- **Vento:** Aumenta dispersão = reduz risco local

### 9.4 Seca — Balanço Hídrico

- **Fatores:** Nível de chuva, umidade do solo, temperatura
- **Duração:** Amplifica o risco (semanas de seca)

### 9.5 Desmatamento — Densidade de Vegetação

- **Cobertura original vs. atual**
- **Fatores:** Proximidade de estradas, inclinação, tipo de uso

### 9.6 Enchente — Análise Topográfica

- **Precipitação:** Intensidade e acumulado
- **Topografia:** Elevação, proximidade de rios
- **Solo:** Capacidade de absorção vs. saturação

---

## 10. Simuladores Educativos

### 10.1 Simulador de Incêndio

Sliders interativos: temperatura (15-45°C), umidade (10-90%), velocidade do vento (0-60 km/h), tipo de vegetação.
Resultado: score de risco, velocidade de propagação, área afetada estimada, visualização gráfica.

### 10.2 Simulador de Qualidade da Água

Parâmetros: pH, turbidez, OD, temperatura, nível de nutrientes.
Resultado: índice de qualidade, classificação, recomendações.

### 10.3 Simulador de Desmatamento

Parâmetros: área, taxa de desmatamento, proximidade de áreas protegidas.
Resultado: impacto na biodiversidade, emissões de CO2, tempo de recuperação.

### 10.4 Recursos Comuns

- Comparador de cenários (lado a lado)
- Histórico de simulações do usuário
- Exportação de resultados em PDF
- Gráficos Recharts interativos
- Badges gamificadas por uso

---

## 11. Sistema de Gamificação

### 11.1 Pontuação

| Ação | Pontos |
|------|--------|
| Criar ocorrência | +10 pts |
| Validar ocorrência | +5 pts |
| Realizar simulação | +3 pts |
| Primeiro do dia | +2 pts |
| Validação por satélite | +15 pts |

### 11.2 Badges

| Badge | Nome | Critério |
|-------|------|----------|
| 🔥 | Vigia do Fogo | 5+ ocorrências de incêndio |
| 💧 | Guardião da Água | 5+ ocorrências hídricas |
| ✓ | Verificador | 10+ validações |
| 📚 | Estudante | 10+ simulações |
| ⭐ | Estrela | 100+ pontos |
| 🦸 | Herói Ambiental | Badge especial (todas as anteriores) |

### 11.3 Rankings

- **Global:** Ordenado por `totalPoints`
- **Mensal:** Ordenado por `monthlyPoints`, reset mensalmente
- **Trust Score:** 0.00 a 1.00, calculado com base em validações corretas

---

## 12. Segurança e Autenticação

### 12.1 Fluxo de Autenticação

```
[Registro] → Hash bcrypt(10) → DB → JWT → Cookie HttpOnly
[Login]    → Busca email → Compara bcrypt → JWT → Cookie HttpOnly
[Reset]    → Token crypto(32) → DB → Email → Valida → Novo hash
```

### 12.2 Medidas de Segurança (v2.0)

- JWT_SECRET obrigatório via variável de ambiente (sem fallback)
- Rate limiting: 5 req/min em login, 3 req/min em registro, 3 req/15min em reset
- Senha mínima: 8 caracteres, 1 maiúscula, 1 número, 1 especial
- bcrypt com salt round 10
- Cookies HttpOnly, Secure (produção), SameSite
- Validação Zod em todas as entradas da API
- Middleware `adminProcedure` para rotas administrativas
- Reset token expira em 24h
- Respostas genéricas em forgot-password (não revela se email existe)

### 12.3 Roles e Permissões

| Role | Permissões |
|------|-----------|
| `user` | Reportar, validar, simular, ver alertas |
| `moderator` | + Moderar denúncias, aprovar/rejeitar conteúdo |
| `admin` | + Painel completo, gerenciar usuários, estatísticas |

---

## 13. Guia de Instalação

### 13.1 Instalação Rápida

```bash
# 1. Clonar o repositório
git clone <repo-url>
cd ecomonitor

# 2. Instalar dependências
pnpm install

# 3. Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas configurações

# 4. Configurar banco de dados
# Crie o banco MySQL: CREATE DATABASE ecomonitor;
# Ajuste DATABASE_URL no .env.local

# 5. Rodar migrations
pnpm db:push

# 6. Iniciar em desenvolvimento
pnpm dev
```

### 13.2 Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|----------|------------|-----------|
| `DATABASE_URL` | Sim | URL de conexão MySQL |
| `JWT_SECRET` | Sim | Chave secreta para tokens JWT (mín. 32 chars) |
| `SMTP_USER` | Não | Email do remetente SMTP |
| `SMTP_PASS` | Não | Senha do app SMTP |
| `NASA_FIRMS_KEY` | Não | API key NASA FIRMS |
| `OPENWEATHER_KEY` | Não | API key OpenWeatherMap |

### 13.3 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `pnpm dev` | Inicia backend + frontend em modo desenvolvimento |
| `pnpm build` | Build de produção |
| `pnpm start` | Inicia servidor de produção |
| `pnpm check` | Verifica tipos TypeScript |
| `pnpm test` | Roda testes com Vitest |
| `pnpm db:push` | Gera e aplica migrations |
| `pnpm format` | Formata código com Prettier |

---

## 14. Manual do Usuário

### 14.1 Primeiros Passos

1. Acesse a aplicação no navegador
2. Clique em **"Criar Conta"** na página inicial
3. Preencha email, senha e nome
4. Após login, você será redirecionado ao Dashboard

### 14.2 Reportar Ocorrência

1. Navegue até **"Reportar"** no menu
2. Selecione o tipo de ocorrência (incêndio, poluição, etc.)
3. Permita geolocalização ou selecione no mapa
4. Preencha os parâmetros físicos específicos
5. Adicione fotos (opcional, até 5)
6. Envie — você ganha **+10 pontos**!

### 14.3 Validar Ocorrências

1. No **Feed** ou **Mapa**, clique em uma ocorrência
2. Analise os dados e fotos
3. Vote: ✅ Válida ou ❌ Inválida
4. Adicione comentário (opcional)
5. Você ganha **+5 pontos**!

### 14.4 Usar Simuladores

1. Acesse **"Simuladores"** no menu
2. Escolha o tipo de simulação
3. Ajuste os parâmetros com os sliders
4. Observe os resultados em tempo real
5. Use o **Comparador de Cenários** para análise lado-a-lado
6. Exporte em PDF se necessário

### 14.5 Dashboard Preditivo (ML)

1. Acesse **"Predições ML"** no menu
2. Selecione a localização no mapa ou insira coordenadas
3. Escolha o período (1-7 dias)
4. Analise o gráfico de risco previsto e as recomendações

### 14.6 Painel Admin

Acessível apenas para role `admin`:
- Estatísticas gerais (total de ocorrências, usuários, validações)
- Lista de ocorrências críticas
- Gerenciamento de denúncias de conteúdo
- Moderação de usuários

### 14.7 Troubleshooting

| Problema | Solução |
|----------|---------|
| Tela em branco | Limpar cache do navegador, verificar console |
| Login não funciona | Verificar se BD está rodando, verificar .env.local |
| Mapa não carrega | Verificar conexão internet (Leaflet CDN) |
| Fotos não enviam | Verificar configuração de storage |
| Email não chega | Verificar SMTP_USER e SMTP_PASS no .env.local |

---

## 15. Referência da API (tRPC)

### 15.1 Ocorrências

**Criar ocorrência:**
```typescript
// Input
{
  type: "fire" | "water_pollution" | "air_pollution" | "drought" | "deforestation" | "flooding" | "other",
  latitude: number,
  longitude: number,
  description?: string,
  severity?: "low" | "medium" | "high" | "critical",
  physicalParameters?: Record<string, any>
}

// Chamada
const result = await trpc.occurrences.create.mutate(input);
```

**Listar recentes:**
```typescript
const occurrences = await trpc.occurrences.getRecent.query({ limit: 20 });
```

**Buscar por tipo:**
```typescript
const fires = await trpc.occurrences.getByType.query({ type: "fire", limit: 50 });
```

### 15.2 Validações

```typescript
// Criar validação
await trpc.validations.create.mutate({
  occurrenceId: 1,
  isValid: true,
  comment: "Confirmado visualmente"
});

// Listar por ocorrência
const validations = await trpc.validations.getByOccurrence.query({ occurrenceId: 1 });
```

### 15.3 Previsão ML

```typescript
const prediction = await trpc.predictions.predictFireRisk.query({
  latitude: -6.3902,
  longitude: -39.0431,
  daysAhead: 7
});
// Retorna: { success, predictions: FirePredictionOutput[] }
```

### 15.4 Clima

```typescript
const weather = await trpc.weather.getCurrent.query({ latitude: -6.39, longitude: -39.04 });
const forecast = await trpc.weather.getForecast.query({ latitude: -6.39, longitude: -39.04, days: 7 });
const fwi = await trpc.weather.getFireIndex.query({ latitude: -6.39, longitude: -39.04 });
```

### 15.5 Satélite (NASA FIRMS)

```typescript
// Validar ocorrência com satélite
const result = await trpc.satellite.validateOccurrence.mutate({ occurrenceId: 1 });
// { isValidated, confidence, nearestDetection, detectionCount }

// Buscar detecções de fogo
const fires = await trpc.satellite.getFireDetections.query({
  latitude: -6.39, longitude: -39.04, radius: 10, days: 1
});
```

### 15.6 Gamificação

```typescript
const top10 = await trpc.gamification.getTopRankings.query({ limit: 10 });
const monthly = await trpc.gamification.getMonthlyRankings.query({ limit: 10 });
const badges = await trpc.gamification.getUserBadges.query({ userId: 1 });
```

---

## 16. Roadmap de Melhorias Futuras

### Fase 1 — Segurança (Prioridade Alta)
- [ ] Implementar refresh tokens (reduzir JWT para 7 dias)
- [ ] Adicionar 2FA (autenticação dois fatores)
- [ ] Verificação de email no registro
- [ ] Auditoria de acessos (logs de login/logout)

### Fase 2 — Core (Prioridade Alta)
- [ ] WebSocket/SSE para atualizações em tempo real
- [ ] Migrar cache para Redis (produção multi-instância)
- [ ] Paginação cursor-based em todas as queries
- [ ] Fila de jobs (BullMQ) para tarefas background

### Fase 3 — UX (Prioridade Média)
- [ ] Notificações push (Service Worker)
- [ ] Mode offline (PWA)
- [ ] Upload de fotos com compressão client-side
- [ ] Internacionalização (i18n)

### Fase 4 — Dados (Prioridade Média)
- [ ] Integrar ML com dados meteorológicos reais (não mock)
- [ ] Dashboard de moderação para admins
- [ ] Exportação em múltiplos formatos (CSV, GeoJSON, KML)
- [ ] API pública documentada com Swagger

### Fase 5 — Simuladores Avançados
- [ ] Simulador de mudanças climáticas
- [ ] Modo colaborativo em tempo real
- [ ] Integração com dados reais de estações meteorológicas
- [ ] Modo desafio com ranking de simulações

---

## 17. Métricas e Dados de Teste

### 17.1 Métricas de Sucesso (Objetivos TCC)

| Métrica | Alvo |
|---------|------|
| Usuários cadastrados | 100+ |
| Ocorrências registradas | 500+ |
| Validadas por satélite | 50+ |
| Simulações educativas | 200+ |
| Parcerias | 3+ (escolas, ONGs, prefeitura) |
| SUS Score | > 70 |
| Taxa de retorno | > 30% |
| Engajamento com gamificação | 40% vs 8% sem |

### 17.2 Dados de Teste

| Dado | Valor |
|------|-------|
| Total de ocorrências | 1.247 |
| Validadas | 892 (71%) |
| Por satélite | 234 (19%) |
| Críticas ativas | 12 |
| Usuários ativos | 358 |
| Simulações realizadas | 1.089 |

### 17.3 Top 5 Áreas Críticas (Dados de Teste)

1. Serra do Estevaio — 18 focos
2. Açude Cedro — 15 focos
3. BR-116 km 42 — 12 focos
4. Distrito Industrial — 9 focos
5. Fazenda Boa Vista — 7 focos

---

## 18. Estrutura de Pastas do Projeto

```
ecomonitor/
├── client/                  # Frontend React
│   ├── index.html           # Entry point HTML
│   ├── public/              # Assets estáticos
│   └── src/
│       ├── App.tsx           # Roteador principal
│       ├── main.tsx          # Bootstrap React + tRPC
│       ├── index.css         # Estilos globais (Tailwind)
│       ├── const.ts          # Constantes do cliente
│       ├── _core/            # Framework (hooks de auth, etc.)
│       ├── components/       # Componentes reutilizáveis
│       │   ├── ui/           # shadcn/ui (30+ componentes)
│       │   ├── MainLayout.tsx
│       │   ├── Map.tsx
│       │   ├── PhotoUploader.tsx
│       │   ├── ScenarioComparator.tsx
│       │   └── ...
│       ├── contexts/         # Contextos React (Theme)
│       ├── hooks/            # Hooks customizados
│       ├── lib/              # Utilitários (trpc client)
│       └── pages/            # 25 páginas da aplicação
│           ├── Home.tsx
│           ├── Dashboard.tsx
│           ├── ReportOccurrence.tsx
│           ├── MapView.tsx
│           ├── Simulators.tsx
│           ├── AdminPanel.tsx
│           └── ...
├── server/                  # Backend Node.js
│   ├── _core/               # Framework Express/tRPC
│   ├── db/                  # Módulos de banco de dados
│   ├── routers/             # Routers tRPC modulares
│   ├── integrations/        # APIs externas
│   ├── workers/             # Background jobs
│   ├── auth-local.ts        # Autenticação
│   ├── cache.ts             # Cache in-memory
│   ├── email-service.ts     # Serviço de email
│   ├── ml-predictor.ts      # Machine Learning
│   ├── physics.ts           # Motor de física
│   └── storage.ts           # Upload de arquivos
├── shared/                  # Código compartilhado (types, constantes)
├── drizzle/                 # Schema e migrations do BD
│   ├── schema.ts            # Definição das tabelas
│   ├── relations.ts         # Relações entre tabelas
│   └── migrations/          # Arquivos de migração SQL
├── docs/                    # Documentação consolidada
│   └── DOCUMENTACAO_COMPLETA.md  # Este documento
├── .env.example             # Template de variáveis de ambiente
├── package.json             # Dependências e scripts
├── pnpm-lock.yaml           # Lock file (pnpm)
├── tsconfig.json            # Configuração TypeScript
├── vite.config.ts           # Configuração Vite
├── vitest.config.ts         # Configuração de testes
├── drizzle.config.ts        # Configuração Drizzle Kit
└── README.md                # README principal do projeto
```

---

## 19. Changelog de Melhorias (v2.0)

### Segurança
- **JWT_SECRET obrigatório** — Aplicação falha no boot se não configurado
- **Rate limiting** — express-rate-limit em rotas de autenticação
- **Senha forte** — Mínimo 8 chars, maiúscula, número, especial
- **Admin middleware** — `adminProcedure` server-side no tRPC
- **Sanitização .env.example** — Removidos secrets reais

### Arquitetura
- **db.ts modularizado** — Separado em `db/users.ts`, `db/occurrences.ts`, `db/validations.ts`, `db/reports.ts`
- **routers.ts modularizado** — Cada domínio em seu próprio arquivo em `server/routers/`
- **Stats otimizado** — `getOccurrenceStats()` usa SQL COUNT/GROUP BY
- **getUserAlerts implementado** — Router usando a função real do DB
- **Foreign keys** — Adicionadas referências no schema Drizzle

### Performance
- **Lazy loading** — React.lazy() + Suspense para code splitting
- **Logger estruturado** — Módulo de logging com níveis e contexto

### Infraestrutura
- **Health check** — Endpoint `GET /api/health` com status do BD
- **Documentação consolidada** — 50 MDs → 1 documento completo
- **Limpeza de projeto** — Removidos 33 arquivos obsoletos, phantomjs, lock duplicado

---

*Documento gerado em Março/2026 — EcoMonitor v2.0*
