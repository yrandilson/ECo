# 🌍 ECO Monitor - Roadmap de Implementação Completo

**Versão:** 2.0 (Com Autenticação Local)  
**Data:** Fevereiro 2026  
**Status:** Em Desenvolvimento

---

## 📋 Índice

1. [Arquitetura Atual](#arquitetura-atual)
2. [Stack Técnico](#stack-técnico)
3. [Estrutura de Pastas](#estrutura-de-pastas)
4. [Como Funciona Autenticação](#como-funciona-autenticação)
5. [Fase 1: Segurança](#fase-1---segurança-semanas-1-2)
6. [Fase 2: Core Features](#fase-2---core-features-semanas-3-5)
7. [Fase 3: UX & Engajamento](#fase-3---ux--engajamento-semanas-6-7)
8. [Fase 4: Infraestrutura](#fase-4---infraestrutura-semanas-8-9)
9. [Fase 5: Avançado](#fase-5---avançado-semanas-10)
10. [Como Desenvolver](#como-desenvolver)
11. [Checklist de Deploy](#checklist-de-deploy)

---

## 🏗️ Arquitetura Atual

```
ECO Monitor v2.0 = Sistema de Monitoramento Ambiental Colaborativo
├── Frontend: React 19 + TypeScript + Vite + Tailwind
├── Backend: Express.js + tRPC + MySQL + Drizzle ORM
├── Autenticação: Dual (OAuth Original + JWT Local)
├── Banco: MySQL com Drizzle migrations
├── Tempo Real: Socket.io (planejado)
└── ML: LSTM Predictor para previsões
```

### Fluxo de Autenticação (Atual)

```
┌─────────────────────────────────────────────────────────┐
│ Login/Register                                          │
└──────────────┬──────────────────────────────────────────┘
               │
    ┌──────────▼──────────┐
    │ POST /api/auth/     │
    │ login (ou register) │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────────────────────────────────────┐
    │ Validar credenciais & gerar JWT                    │
    │ (bcrypt compare password, jwt.sign)                 │
    └──────────┬──────────────────────────────────────────┘
               │
    ┌──────────▼──────────────────────────────────────────┐
    │ Setar HTTP-only cookie com JWT                      │
    │ res.cookie(COOKIE_NAME, token, cookieOptions)      │
    └──────────┬──────────────────────────────────────────┘
               │
    ┌──────────▼──────────────────────────────────────────┐
    │ Browser armazena cookie                             │
    └──────────┬──────────────────────────────────────────┘
               │
    ┌──────────▼──────────────────────────────────────────┐
    │ tRPC queries env cookie automaticamente             │
    │ (credentials: 'include')                            │
    └──────────┬──────────────────────────────────────────┘
               │
    ┌──────────▼──────────────────────────────────────────┐
    │ Context lê cookie e valida JWT                      │
    │ (cookieParser() → opts.req.cookies[COOKIE_NAME])   │
    └──────────┬──────────────────────────────────────────┘
               │
    ┌──────────▼──────────────────────────────────────────┐
    │ Carregar user do banco via getUserById()            │
    └──────────┬──────────────────────────────────────────┘
               │
    ┌──────────▼──────────────────────────────────────────┐
    │ Retornar ctx.user para protectedProcedures         │
    └─────────────────────────────────────────────────────┘
```

### 🔑 Problema Resolvido (Fevereiro 2026)

**Antes:** Login funcionava mas dashboard retornava para login  
**Motivo:** Faltava `cookieParser()` middleware  
**Solução:** Adicionar `import cookieParser` e `app.use(cookieParser())`  
**Status:** ✅ RESOLVIDO

---

## 💻 Stack Técnico

### Frontend
```json
{
  "framework": "React 19.2.1",
  "buildTool": "Vite 7.1.9",
  "language": "TypeScript",
  "styling": "Tailwind CSS + shadcn/ui",
  "routing": "Wouter 3.3.5",
  "api": "tRPC 11.6.0",
  "dataFetching": "React Query 5.56.2",
  "formHandling": "React Hook Form",
  "validation": "Zod",
  "icons": "Lucide React",
  "notifications": "Sonner (toast)"
}
```

### Backend
```json
{
  "server": "Express.js 4.21.2",
  "api": "tRPC (Procedure-based)",
  "authentication": "JWT + bcryptjs + cookie-parser",
  "database": "MySQL 3.15.0",
  "orm": "Drizzle ORM 0.44.5",
  "emailService": "Nodemailer (será implementado)",
  "fileUpload": "Multer (será implementado)",
  "validation": "Zod schemas",
  "environment": "dotenv"
}
```

### DevOps & Ferramentas
```json
{
  "packageManager": "pnpm 10.4.1",
  "testing": "Vitest (planejado: E2E Playwright)",
  "monitoring": "Winston/Pino (planejado)",
  "cache": "Redis (planejado)",
  "realTime": "Socket.io (planejado)",
  "ml": "LSTM Predictor (existente)",
  "docker": "Planejado para produção"
}
```

---

## 📁 Estrutura de Pastas

```
ecomonitor/
├── client/                          # Frontend React
│   ├── src/
│   │   ├── App.tsx                 # Main router
│   │   ├── main.tsx                # Vite entry
│   │   ├── const.ts                # Constantes
│   │   ├── _core/
│   │   │   ├── hooks/              # Custom hooks (useAuth, etc)
│   │   │   ├── context/            # Auth context
│   │   │   └── trpc.ts             # tRPC client setup
│   │   ├── components/
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── [novos]             # Serão adicionados
│   │   ├── pages/
│   │   │   ├── Login.tsx           # ✅ Implementado
│   │   │   ├── Register.tsx        # ✅ Implementado
│   │   │   ├── Dashboard.tsx       # ✅ Implementado
│   │   │   └── [novos]             # Serão adicionados
│   │   └── lib/                    # Utilities
│   └── public/
│       └── manifest.json           # PWA (será implementado)
│
├── server/                          # Backend Express
│   ├── auth-local.ts               # ✅ Login/Register endpoints
│   ├── routers.ts                  # tRPC routers
│   ├── db.ts                       # Database functions
│   ├── physics.ts                  # Physics engine
│   ├── ml-predictor.ts             # LSTM predictor
│   ├── lstm-predictor.ts
│   ├── nasa-firms-service.ts       # Satellite integration
│   ├── weather-service.ts          # OpenWeather integration
│   ├── cache.ts                    # Cache logic
│   ├── storage.ts                  # File storage
│   ├── _core/
│   │   ├── index.ts                # Server bootstrap ✅ cookieParser adicionado
│   │   ├── context.ts              # tRPC context
│   │   ├── cookies.ts              # Cookie options
│   │   ├── trpc.ts                 # tRPC instance
│   │   ├── sdk.ts                  # OAuth SDK
│   │   ├── logger.ts               # Logger (será expandido)
│   │   ├── oauth.ts                # OAuth routes
│   │   ├── systemRouter.ts
│   │   └── vite.ts                 # Vite HMR setup
│   ├── integrations/
│   │   ├── openweather.ts          # Weather API
│   │   ├── nasa-firms.ts           # NASA satellite
│   │   └── [novos]                 # Será adicionado
│   └── workers/                    # Background workers
│
├── shared/                          # Código compartilhado
│   ├── const.ts                    # Constantes globais
│   ├── types.ts                    # TypeScript types
│   └── _core/
│
├── drizzle/                         # Database
│   ├── schema.ts                   # Tabelas DB
│   ├── relations.ts                # Relações
│   ├── migrations/                 # Migration files
│   └── meta/
│
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── vite.config.ts                  # Vite build config
├── vitest.config.ts                # Test config
├── drizzle.config.ts               # Drizzle config
└── README.md
```

---

## 🔐 Como Funciona Autenticação

### Modelos de Dados

```sql
-- users table (existente)
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  passwordHash VARCHAR(255),           -- LOCAL AUTH
  loginMethod ENUM('local', 'oauth'),  -- LOCAL AUTH
  openId VARCHAR(255),                 -- OAUTH
  role VARCHAR(50),
  points INTEGER DEFAULT 0,
  lastSignedIn TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  
  -- SERÁ ADICIONADO (Fase 1):
  resetToken VARCHAR(255),             -- Reset password
  resetTokenExpires TIMESTAMP,         -- Reset expiry
  twoFaEnabled BOOLEAN DEFAULT false,  -- 2FA
  twoFaSecret VARCHAR(255),            -- 2FA secret
);

-- SERÁ CRIADA (Fase 1):
CREATE TABLE login_attempts (
  id INTEGER PRIMARY KEY,
  userId INTEGER,
  ip VARCHAR(45),
  userAgent TEXT,
  success BOOLEAN,
  timestamp TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY(userId) REFERENCES users(id)
);
```

### Endpoints de Autenticação

#### ✅ Atuais (Implementados)

```
POST /api/auth/register
  Body: { email, password, name }
  Response: { success, user }
  Cookie: sessionToken (JWT, 365 dias)

POST /api/auth/login
  Body: { email, password }
  Response: { success, user }
  Cookie: sessionToken (JWT, 365 dias)

GET /api/trpc/auth.me
  Response: user object ou null
  Auth: Cookie (automático)

POST /api/trpc/auth.logout
  Response: { success }
  Action: Limpa cookie
```

#### 🔄 Será Implementado (Fase 1)

```
POST /api/auth/forgot-password
  Body: { email }
  Response: { message: "Email enviado" }
  Action: Gera reset token, envia por email

POST /api/auth/reset-password
  Body: { token, newPassword }
  Response: { success }
  Validação: Token válido e não expirado (24h)

POST /api/auth/2fa/setup
  Response: { qrCode, secret }
  Action: Gera TOTP secret para Google Authenticator

POST /api/auth/2fa/verify
  Body: { code }
  Response: { success }
  Validação: Verifica código TOTP
```

---

## 🚀 Fase 1 - Segurança (Semanas 1-2)

### #1 Recuperação de Senha

**Objetivo:** Permitir usuários resetarem senha via email

**Arquivos a Criar/Modificar:**
- `server/auth-local.ts` - Adicionar rotas de forgot/reset
- `server/_core/email-service.ts` - NOVO: Configurar Nodemailer
- `client/src/pages/ForgotPassword.tsx` - NOVO: Formulário
- `client/src/pages/ResetPassword.tsx` - NOVO: Formulário
- `drizzle/schema.ts` - Adicionar campos `resetToken`, `resetTokenExpires`

**Fluxo:**
```
1. Usuário clica "Esqueci minha senha" na login
2. POST /api/auth/forgot-password { email }
3. Backend valida email, gera token seguro
4. Salva token com expiry 24h no banco
5. Envia email com link: https://app.com/reset-password?token=XXX
6. Usuário clica link, vê formulário
7. POST /api/auth/reset-password { token, newPassword }
8. Backend valida token, atualiza password, limpa token
9. Usuário redireciona para login
```

**Dependencies:**
- `nodemailer` - Envio de emails
- `crypto` - Gerar tokens seguros

**Segurança:**
- Token: 32 bytes hex aleatório
- Expiry: 24 horas
- Hash de senha: bcrypt 10 rounds
- Rate limit: 3 tentativas por email por hora

---

### #2 2FA (Two-Factor Authentication)

**Objetivo:** Autenticação com TOTP (Google Authenticator)

**Arquivos a Criar/Modificar:**
- `server/auth-local.ts` - Adicionar rotas 2FA
- `client/src/pages/Setup2FA.tsx` - NOVO: QR Code
- `client/src/pages/Verify2FA.tsx` - NOVO: Verifica código

**Fluxo:**
```
1. Usuário acessa Settings → Segurança
2. Clica "Ativar 2FA"
3. POST /api/auth/2fa/setup
4. Backend gera TOTP secret (base32)
5. Retorna QR code (via qrcode library)
6. Usuário escaneia com Google Authenticator
7. Insere código de 6 dígitos
8. POST /api/auth/2fa/verify { code }
9. Backend valida contra secret
10. Ativa 2FA no banco
```

**Dependencies:**
- `speakeasy` - TOTP generation
- `qrcode` - QR code generation

**Segurança:**
- TOTP baseado em tempo (30s window)
- Aceita código atual e anterior (30s tolerance)
- Backup codes gerados (8 códigos para recovery)

---

### #3 Auditoria de Login

**Objetivo:** Rastrear tentativas de login, detectar anomalias

**Arquivos a Criar/Modificar:**
- `server/auth-local.ts` - Log all attempts
- `drizzle/schema.ts` - Nova tabela `login_attempts`
- `server/_core/ip-blocker.ts` - NOVO: Rate limiting

**Fluxo:**
```
1. POST /api/auth/login { email, password }
2. Backend extrai IP e User-Agent do request
3. Valida credenciais
4. Se falhou:
   - Registra tentativa com IP
   - Conta tentativas do IP nos últimos 30min
   - Se >= 5 tentativas: bloqueia por 30min
5. Se sucesso:
   - Registra tentativa bem-sucedida
   - Limpa contador
   - Notifica usuário via email
```

**Dados Rastreados:**
```sql
INSERT INTO login_attempts (userId, ip, userAgent, success)
VALUES (1, '192.168.1.1', 'Mozilla...', true)
```

**Segurança:**
- Bloqueia IP após 5 tentativas falhadas em 30min
- Email de alerta para login bem-sucedido em IP novo
- Dashboard de atividades recentes para usuário

---

## 🎯 Fase 2 - Core Features (Semanas 3-5)

### #4 Mapa Interativo

**Objetivo:** Visualizar ocorrências em mapa com clusters

**Arquivos a Criar/Modificar:**
- `client/src/components/InteractiveMap.tsx` - NOVO
- `server/routers.ts` - Adicionar query `occurrences.getForMap`
- `drizzle/schema.ts` - Adicionar índices geoespaciais

**Features:**
- Integração Leaflet.js
- Clusters automáticos
- Popup ao clicar com detalhes
- Filtros: tipo, data, severidade
- Heatmap opcional
- Export para GeoJSON

**Dependencies:**
- `leaflet` - Map library
- `react-leaflet` - React wrapper
- `leaflet.markercluster` - Clustering

---

### #5 Histórico & Filtros Avançados

**Objetivo:** Dashboard com filtros, busca, exportação

**Arquivos a Criar/Modificar:**
- `client/src/pages/OccurrenceHistory.tsx` - NOVO
- `server/routers.ts` - Expandir queries com filtros
- `client/src/components/FilterPanel.tsx` - NOVO

**Filtros:**
- Tipo (fire, water_pollution, etc)
- Data range (from/to)
- Severidade (low, medium, high, critical)
- Status (reported, validated, resolved)
- Localização (raio em km)
- Criado por (usuário)

**Exportação:**
- PDF com relatório completo
- CSV para análise em Excel
- GeoJSON para GIS

**Dependencies:**
- `jsPDF` - PDF generation
- `papaparse` - CSV export
- `date-fns` - Date formatting

---

### #6 Notificações em Tempo Real

**Objetivo:** Socket.io para alerts instantâneos

**Arquivos a Criar/Modificar:**
- `server/_core/socket-handler.ts` - NOVO
- `server/_core/index.ts` - Integrar Socket.io
- `client/src/_core/socket-client.ts` - NOVO
- `drizzle/schema.ts` - Tabela `notifications`

**Eventos:**
```
occurrence.created → Notificar área afetada
occurrence.validated → Notificar criador
comment.added → Notificar participantes
validation.received → Notificar validador
user.mentioned → Notificar mencionado
```

**Dependencies:**
- `socket.io` - Real-time communication
- `socket.io-client` - Frontend client

---

## 💡 Fase 3 - UX & Engajamento (Semanas 6-7)

### #7 Comentários em Ocorrências

**Objetivo:** Discussão colaborativa sobre cada ocorrência

**Arquivos a Criar/Modificar:**
- `drizzle/schema.ts` - Tabela `occurrence_comments`
- `server/routers.ts` - Routers para comments
- `client/src/components/CommentSection.tsx` - NOVO

**Features:**
- Texto com suporte a @mentions
- Anexar imagens/arquivos
- Thread de respostas
- Like/reações
- Moderação (delete/edit)

---

### #8 Badges & Gamification

**Objetivo:** Sistema de conquistas

**Badges:**
```
🥉 Bronze: 10 validações
🥈 Prata: 50 validações
🥇 Ouro: 100 validações

🔥 Streak: 7 dias seguidos reportando
🎯 Expert: 5 validações perfeitas
🌟 First: Primeira ocorrência
```

**Perfil:**
- Exibir badges conquistadas
- Progresso para próximo badge
- Histórico de conquistas

---

### #9 Paginação & Lazy Loading

**Objetivo:** Performance em listas grandes

**Implementação:**
- Infinite scroll com React Query
- Cursor-based pagination
- Virtual scroll (react-window)
- Skeleton loaders

---

## ⚙️ Fase 4 - Infraestrutura (Semanas 8-9)

### #10 Cache com Redis

**Objetivo:** Reduzir carga do banco

**O que cachear:**
```
- top_rankings (TTL 1h)
- recent_occurrences (TTL 15min)
- weather_data (TTL 30min)
- user_profile (TTL 5min)
- occurrence_count (TTL 1h)
```

**Setup:**
- Docker Redis container
- Invalidação manual após mutações
- Fallback para DB se Redis down

---

### #11 Logging Centralizado

**Objetivo:** Rastrear erros em produção

**Implementação:**
```typescript
// server/_core/logger.ts
const logger = Winston.createLogger({
  transports: [
    new Winston.transports.File({ filename: 'error.log', level: 'error' }),
    new Winston.transports.File({ filename: 'combined.log' }),
    new Winston.transports.Console({ format: Winston.format.simple() })
  ]
});

// Uso
logger.error('Erro crítico', { userId, requestId, stack });
logger.warn('Aviso importante');
logger.info('Evento importante');
```

**Integração Sentry:**
- Capturar exceções
- Performance monitoring
- Release tracking

---

### #12 Testes Automatizados

**Objetivo:** 70% code coverage

**Tipos:**
```
Unit Tests (Vitest)
- Database functions
- Validation logic
- Utilities

Integration Tests
- API endpoints
- Auth flow
- Database queries

E2E Tests (Playwright)
- Login flow completo
- Criar ocorrência
- Validar ocorrência
- Comentar
```

---

## 🔮 Fase 5 - Avançado (Semanas 10+)

### #13 PWA & Offline Support

**Manifest:**
```json
{
  "name": "ECO Monitor",
  "short_name": "ECOmon",
  "icons": [...],
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#22c55e"
}
```

**Service Worker:**
- Cache de assets estáticos
- Offline mode com IndexedDB
- Sync queue para ações offline
- Background sync quando online

---

### #14 API Pública com Swagger

**Documentação OpenAPI:**
```yaml
/api/occurrences:
  get:
    description: Lista ocorrências públicas
    parameters:
      - name: type
        schema: string
      - name: limit
        schema: integer
    responses:
      200:
        schema: Occurrence[]
```

**Rate Limiting:**
- 100 req/min por API key
- 1000 req/min por user autenticado

---

### #15 Monitoramento & Health Checks

**Endpoint /health:**
```json
{
  "status": "healthy",
  "uptime": 86400,
  "database": "connected",
  "redis": "connected",
  "responseTime": 45,
  "timestamp": "2026-02-02T12:00:00Z"
}
```

---

### #16-20 Restantes

**#16 Sistema de Alertas para Autoridades**
- Integração SMS/Email para bombeiros
- Webhook para sistemas externos
- Geolocalização automática

**#17 Previsão & ML Avançado**
- Treinar LSTM com dados históricos
- Prever áreas de risco futuro
- Dashboard de risco predictivo

**#18 Otimização de Imagens**
- Sharp para compressão
- WebP com fallback
- Lazy load automático

**#19 Design Responsivo Mobile**
- Touch-friendly UX
- Bottom navigation
- Drawer menu
- Otimizar para 3G

**#20 DevOps & Deployment**
- Docker container
- GitHub Actions CI/CD
- Auto-deploy staging/prod
- Database migrations automáticas

---

## 🛠️ Como Desenvolver

### Setup Local

```bash
# 1. Clone e instale
git clone <repo>
cd ecomonitor
pnpm install

# 2. Configure .env.local
cat > .env.local << EOF
DATABASE_URL=mysql://root:password@localhost:3306/ecomonitor
JWT_SECRET=your-secret-key-change-in-prod
NODE_ENV=development

# Será adicionado:
SMTP_HOST=smtp.gmail.com
SMTP_USER=seu-email@gmail.com
SMTP_PASS=app-password
REDIS_URL=redis://localhost:6379
EOF

# 3. Rode migrations
pnpm db:push

# 4. Inicie servidor + cliente
pnpm dev
```

### Estrutura de uma Nova Feature

```
1. Banco de dados (drizzle/schema.ts)
   ↓
2. Servidor (server/routers.ts + functions)
   ↓
3. Frontend (client/src/pages ou components)
   ↓
4. Testes (server/__tests__, client/__tests__)
   ↓
5. Documentação (comentários + README da feature)
```

### Exemplo: Implementar Nova Métrica

**1. Adicionar ao schema:**
```typescript
// drizzle/schema.ts
export const userMetrics = mysqlTable('user_metrics', {
  id: int().primaryKey().autoincrement(),
  userId: int().references(() => users.id),
  validationsCount: int().default(0),
  occurrencesCount: int().default(0),
  updatedAt: timestamp().defaultNow().onUpdateNow(),
});
```

**2. Criar função no DB:**
```typescript
// server/db.ts
export async function getUserMetrics(userId: number) {
  return db.select().from(userMetrics).where(eq(userMetrics.userId, userId));
}
```

**3. Expor via tRPC:**
```typescript
// server/routers.ts
user: router({
  getMetrics: protectedProcedure
    .query(({ ctx }) => db.getUserMetrics(ctx.user.id)),
}),
```

**4. Usar no Frontend:**
```typescript
// client/src/pages/Profile.tsx
const { data: metrics } = trpc.user.getMetrics.useQuery();
return <div>{metrics.validationsCount} validações</div>;
```

---

## ✅ Checklist de Deploy

Antes de colocar em produção:

### Segurança
- [ ] JWT_SECRET único e forte
- [ ] Variáveis secretas em .env.prod
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativo
- [ ] SQL injection prevention (Drizzle ORM)
- [ ] XSS prevention (React escapa por padrão)
- [ ] HTTPS obrigatório
- [ ] Headers de segurança (Helmet.js)

### Performance
- [ ] Redis cache configurado
- [ ] Database indexes em place
- [ ] Minificação de assets
- [ ] Gzip compression
- [ ] CDN para assets estáticos
- [ ] Database connection pooling

### Dados
- [ ] Backup automático do DB
- [ ] Logs centralizados
- [ ] Monitoramento 24/7
- [ ] Alertas de erros críticos
- [ ] Disaster recovery plan

### Frontend
- [ ] Build production testado
- [ ] PWA manifesto válido
- [ ] Mobile responsivo testado
- [ ] Performance Lighthouse > 80

### Backend
- [ ] Tests rodando
- [ ] Migrations aplicadas
- [ ] Seeds executados
- [ ] Health check respondendo
- [ ] Logs estruturados

---

## 📞 Contato & Contribuindo

Este documento é o guia de desenvolvimento completo.  
Todas as features seguem este roadmap em ordem.

**Próxima feature:** Recuperação de Senha (#1)

---

**Atualizado em:** Fevereiro 2, 2026  
**Versão:** 1.0 do Roadmap
