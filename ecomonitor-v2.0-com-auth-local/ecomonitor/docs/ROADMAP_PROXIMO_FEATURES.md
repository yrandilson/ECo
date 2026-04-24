# 🗺️ ROADMAP - Próximas Features (Priorizado)

**Data:** February 2, 2026  
**Status:** 87% Completo - Password Reset ✅ FEITO  
**Próxima Focus:** 2FA com TOTP  

---

## 🎯 PRIORITY MATRIX

```
Impact vs Effort

HIGH IMPACT, LOW EFFORT:
  ✨ Email Verification        (3 hours)  ← QUICK WIN
  ✨ Push Notifications         (5 hours)  ← HIGH VALUE
  
HIGH IMPACT, MEDIUM EFFORT:
  🔴 2FA (TOTP)                (4 hours)  ← DO THIS FIRST
  🔴 Email Alerts              (4 hours)
  
MEDIUM IMPACT, MEDIUM EFFORT:
  🟡 Photo Upload              (6 hours)
  🟡 OAuth Refinement          (TBD)
  
LOW IMPACT, HIGH EFFORT:
  🟢 Testing Suite             (8 hours)
  🟢 Docker & CI/CD            (5 hours)
```

---

## 🔴 PHASE 1: 2FA com TOTP (3-4 hours)

### Por que?
- ✅ Aumenta segurança drasticamente
- ✅ Usuários esperam isso
- ✅ Relativamente rápido de implementar
- ✅ Alto impacto em segurança

### O que implementar

#### Backend
```typescript
// 1. Instalar dependência
npm install speakeasy qrcode

// 2. Database migration
ALTER TABLE users ADD COLUMN totpSecret VARCHAR(255);
ALTER TABLE users ADD COLUMN twoFactorEnabled BOOLEAN DEFAULT false;

// 3. Endpoints
POST /api/auth/2fa/setup           // Gera secret + QR
POST /api/auth/2fa/verify          // Valida TOTP
POST /api/auth/2fa/backup-codes    // Gera códigos backup

// 4. Modificar login
POST /api/auth/login               // Verifica 2FA se ativo
POST /api/auth/verify-2fa          // Completa login
```

#### Frontend
```tsx
// 1. Nova página
client/src/pages/TwoFactorSetup.tsx
  ├── QR Code display
  ├── Manual key backup
  ├── Test code input
  └── Confirmation

// 2. Login modification
client/src/pages/Login.tsx
  ├── Show 2FA prompt if needed
  ├── Code input field
  ├── Backup code option

// 3. Settings
client/src/pages/Settings.tsx
  ├── Enable/Disable 2FA
  ├── View backup codes
  ├── Reset authenticator
```

### Timeline
```
Day 1 - Backend Setup: 1.5 hours
  ├── Instalar speakeasy + qrcode
  ├── DB migration
  ├── Endpoints criados
  └── Testes básicos

Day 1 - Frontend Setup: 1 hora
  ├── TwoFactorSetup page
  ├── Login modification
  └── Settings integration

Day 2 - Integration & Testing: 1 hora
  ├── Fluxo completo testado
  ├── Documentação
  └── Troubleshooting guide

TOTAL: 3-4 horas
```

---

## 🔴 PHASE 2: Email Verification (2-3 hours)

### Por que?
- ✅ Protege contra emails falsos
- ✅ Aumenta user engagement
- ✅ Rápido de implementar
- ✅ Baixo custo operacional

### O que implementar

#### Database
```sql
ALTER TABLE users ADD COLUMN emailVerified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN verificationToken VARCHAR(255);
ALTER TABLE users ADD COLUMN verificationTokenExpires TIMESTAMP;
```

#### Backend
```typescript
// 1. Modificar Register
POST /api/auth/register
  ├── Usuário criado com emailVerified=false
  ├── Token gerado (similar a password reset)
  ├── Email de verificação enviado

// 2. Novo Endpoint
POST /api/auth/verify-email
  ├── Recebe token
  ├── Marca como verified
  ├── Limpa token

// 3. Resend Email
POST /api/auth/resend-verification
  ├── Gera novo token
  ├── Reenvia email
  ├── Rate limiting (1x por hora)

// 4. Checar Status
GET /api/auth/verification-status
  ├── Retorna se está verificado
  ├── Tempo até expiração
```

#### Frontend
```tsx
// 1. Página de Verificação
client/src/pages/VerifyEmail.tsx
  ├── "Clique no link do email"
  ├── "Não recebeu? Reenviar"
  ├── Email do usuário mostrado

// 2. Auto-redirect
Após verificação
  ├── Redireciona para /login
  ├── Mostra mensagem de sucesso
  └── Se expirado → "Solicitar novo link"

// 3. Register modificado
- Mostrar página de verificação após cadastro
- Oferecer resend link
- Bloqueio de features até verificado
```

### Timeline
```
Backend: 1.5 horas
Frontend: 1 hora
Testing: 30 minutos
─────────────────
TOTAL: 2.5 horas
```

---

## 🟡 PHASE 3: Push Notifications (4-5 hours)

### Por que?
- ✅ Engaja usuários em tempo real
- ✅ Alertas críticos chegam rápido
- ✅ Diferencial competitivo

### O que implementar

#### Backend Setup
```typescript
// 1. Instalar
npm install web-push firebase-admin

// 2. Configurar Firebase
- Criar projeto Firebase
- Configurar Cloud Messaging
- Gerar chaves públicas/privadas

// 3. Database
ALTER TABLE users ADD COLUMN pushTokens JSON;
ALTER TABLE users ADD COLUMN pushEnabled BOOLEAN DEFAULT false;

// 4. Endpoints
POST /api/notifications/subscribe    // Registra device
POST /api/notifications/send-test    // Envia teste
GET /api/notifications/settings      // Ver preferências
```

#### Frontend Setup
```tsx
// 1. Service Worker
public/sw.js
  ├── Registra push listener
  ├── Mostra notificação
  ├── Handles click actions

// 2. Registration
client/src/_core/pushNotifications.ts
  ├── Request permission
  ├── Registra com backend
  ├── Salva token

// 3. UI
client/src/pages/Settings.tsx
  ├── "Ativar notificações"
  ├── Seleção de tipos
  ├── Teste de notificação

// 4. Notificações automáticas
- Alerta crítico registrado
- Validação solicitada
- Resposta à ocorrência
- Ranking update
```

### Timeline
```
Infrastructure: 1.5 horas
Backend: 1.5 horas
Frontend: 1 hora
Testing: 1 hora
─────────────────
TOTAL: 5 horas
```

---

## 🟡 PHASE 4: Photo Upload (5-6 hours)

### Por que?
- ✅ Essencial para evidência visual
- ✅ Aumenta credibilidade
- ✅ Gamificação de fotos

### O que implementar

#### Backend
```typescript
// 1. Storage Setup (escolha uma)
// Option A: S3 (AWS)
npm install aws-sdk

// Option B: Local Storage
const uploadDir = './uploads/photos'

// Option C: Azure Blob
npm install @azure/storage-blob

// 2. Endpoints
POST /api/upload/photo              // Upload + compress
DELETE /api/upload/photo/:id         // Delete
GET /api/photos/occurrence/:id       // Listar por ocorrência

// 3. Validações
- Tipo MIME (jpg, png, webp)
- Tamanho máximo (5MB)
- Dimensões mínimas (400x300)
- Metadata stripping
- Antivírus scan (opcional)

// 4. Compressão
- Sharp para compressão
- Geração de thumbnails
- WebP conversion
```

#### Frontend
```tsx
// 1. Upload Component
client/src/components/PhotoUpload.tsx
  ├── Drag & drop area
  ├── File input button
  ├── Progress bar
  ├── Error handling
  ├── Sucesso message

// 2. Galeria
client/src/components/PhotoGallery.tsx
  ├── Grid view
  ├── Modal preview
  ├── Delete button
  ├── Drag to reorder

// 3. Integração
ReportOccurrence.tsx
  ├── Múltiplos uploads
  ├── Máximo 5 fotos
  ├── Preview antes de enviar
  ├── Status de upload
```

### Timeline
```
Storage Setup: 1 hora
Backend: 2 horas
Frontend: 1.5 horas
Testing: 1 hora
─────────────────
TOTAL: 5.5 horas
```

---

## 🟡 PHASE 5: Email Alerts (3-4 hours)

### Por que?
- ✅ Keep users informed
- ✅ Aumenta reengagement
- ✅ Simples de implementar

### O que implementar

#### Backend
```typescript
// 1. Email Templates
templates/
  ├── critical-occurrence.html
  ├── validation-requested.html
  ├── ranking-update.html
  ├── weekly-summary.html
  └── alert-nearby.html

// 2. Trigger Points
- Ocorrência crítica registrada
- Validação solicitada para sua foto
- Seu ranking atualizou
- Resumo semanal
- Alerta geo-proximal (< 5km)

// 3. Settings per user
ALTER TABLE users ADD COLUMN emailPreferences JSON;
  {
    "criticalOccurrences": true,
    "validationRequests": true,
    "rankingUpdates": false,
    "weeklySummary": true,
    "geoAlerts": true,
    "emailFrequency": "immediate|daily|weekly"
  }

// 4. Queue System (Background)
npm install bull bull-board

// Queue para:
- Envio de emails
- Retry automático
- Rate limiting
- Analytics
```

#### Frontend
```tsx
// Settings adicionar:
client/src/pages/Settings.tsx
  ├── Email Preferences
  │   ├── Ocorrências críticas
  │   ├── Validação solicitada
  │   ├── Ranking updates
  │   ├── Resumo semanal
  │   └── Alertas geográficos
  ├── Frequência (imediato/diário/semanal)
  └── Unsubscribe option
```

### Timeline
```
Email Templates: 1 hora
Backend Triggers: 1 hora
Queue Setup: 45 minutos
Frontend UI: 45 minutos
─────────────────
TOTAL: 3.5 horas
```

---

## 🟢 PHASE 6: Testing Suite (6-8 hours)

### Por que?
- ✅ Previne regressions
- ✅ Aumenta confiança
- ✅ CI/CD necessário

### O que implementar

#### Backend Tests (3 horas)
```bash
npm install vitest @vitest/ui

// Unit Tests
- Auth functions (/auth-local.test.ts)
- Email service (/email-service.test.ts)
- Database functions (/db.test.ts)
- Physics calculations (/physics.test.ts)

// Integration Tests
- Full auth flow
- Endpoints testing
- Database transactions
- Email delivery

// Coverage Target: 80%+
```

#### Frontend Tests (2 horas)
```bash
npm install @testing-library/react @testing-library/user-event

// Component Tests
- Login.test.tsx
- Register.test.tsx
- ForgotPassword.test.tsx
- ResetPassword.test.tsx

// E2E Tests (1 hora)
npm install playwright

// Full user flows
- Register → Login → Reset → Login
- Occurrence → Validation → Ranking
```

#### CI/CD (2 horas)
```yaml
# .github/workflows/test.yml
- Run on: push, pull_request
- Tests: Unit + E2E
- Coverage: Report
- Status badge: README
```

---

## 🟢 PHASE 7: Docker & Deployment (4-5 hours)

### Por que?
- ✅ Consistência dev/prod
- ✅ Fácil deployment
- ✅ Escalabilidade

### O que implementar

#### Docker Setup (2 horas)
```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN pnpm install
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]

# docker-compose.yml
services:
  app:
    build: .
    ports: ["3000:3000"]
    env_file: .env.production
  
  mysql:
    image: mysql:8.0
    volumes: ["db:/var/lib/mysql"]
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
```

#### CI/CD (2-3 horas)
```yaml
# .github/workflows/deploy.yml
- Build Docker image
- Push to registry
- Deploy to production
- Run migrations
- Smoke tests
```

---

## 📊 CONSOLIDATED TIMELINE

```
Week 1 (THIS WEEK):
  Mon-Tue: 2FA with TOTP (4 hours)
  Wed: Email Verification (2.5 hours)
  Thu: Push Notifications (5 hours)
  Fri: Photo Upload basics (3 hours)
  ─────────────────────────────
  Total: 14.5 hours (2 days of work)

Week 2:
  Mon-Tue: Email Alerts (3.5 hours)
  Wed-Thu: Testing Suite (6 hours)
  Fri: Docker & CI/CD (4 hours)
  ─────────────────────────────
  Total: 13.5 hours (2 days of work)

Week 3:
  Polish, optimization, documentation

Week 4:
  Production deployment & monitoring
```

---

## 🎯 SUCCESS CRITERIA

```
2FA:
  ✅ QR code generates correctly
  ✅ TOTP codes validate
  ✅ Backup codes work
  ✅ Tested with Google Authenticator

Email Verification:
  ✅ Email sent on signup
  ✅ Link works and verifies
  ✅ Resend link functional
  ✅ Expiry working (24h)

Push Notifications:
  ✅ Permission prompt shows
  ✅ Token registered
  ✅ Test notification works
  ✅ Different alert types

Photo Upload:
  ✅ Drag & drop works
  ✅ File validation
  ✅ Compression working
  ✅ Gallery displays correctly

Testing:
  ✅ 80% code coverage
  ✅ All tests passing
  ✅ CI/CD working
  ✅ Zero test flakiness
```

---

## 🚨 RISK MITIGATION

```
Risk: Database migration failure
  → Test migrations in staging first
  → Keep rollback scripts ready
  → Backup database before migration

Risk: Email deliverability issues
  → Setup SPF/DKIM/DMARC records
  → Monitor bounce rates
  → Have fallback SMTP provider

Risk: Performance degradation
  → Load test with production volume
  → Monitor query performance
  → Implement caching where needed

Risk: 2FA bypass
  → Security audit before deployment
  → Rate limiting on verification
  → Backup code protection
```

---

## 💰 EFFORT ESTIMATION SUMMARY

```
Feature              Effort    Priority   Dependencies
─────────────────────────────────────────────────────
✅ Password Reset     1 hour    DONE       None
🔴 2FA (TOTP)        3-4 hrs   HIGH       speakeasy
🔴 Email Verify      2-3 hrs   HIGH       None
🟡 Push Notif        4-5 hrs   MEDIUM     Firebase
🟡 Photo Upload      5-6 hrs   MEDIUM     Sharp/S3
🟡 Email Alerts      3-4 hrs   MEDIUM     Bull queue
🟢 Testing           6-8 hrs   LOW        Vitest/Playwright
🟢 Docker/CI/CD      4-5 hrs   LOW        GitHub Actions

TOTAL: ~29-36 hours (1-1.5 weeks of work)
```

---

## 📈 IMPACT AFTER EACH PHASE

```
Current (87% complete)
  ├── Auth: Login, Register, Password Reset
  ├── Features: 7 occurrence types, gamification
  ├── Physics: 8 equations, weather API
  └── Score: A- (missing 2FA, verification)

After 2FA (90% complete)
  ├── Add: Second-factor authentication
  ├── Impact: User security x10
  └── Score: A (industry standard)

After Email Verify (92% complete)
  ├── Add: Email confirmation
  ├── Impact: Reduces spam, increases trust
  └── Score: A

After Push Notif (95% complete)
  ├── Add: Real-time alerts
  ├── Impact: 50%+ increase in engagement
  └── Score: A+

After Photo Upload (97% complete)
  ├── Add: Visual evidence
  ├── Impact: Better user-generated content
  └── Score: A+

After Email Alerts (98% complete)
  ├── Add: Email notifications
  ├── Impact: User retention +30%
  └── Score: A++

After Testing (99% complete)
  ├── Add: CI/CD, automated tests
  ├── Impact: Reliability +95%
  └── Score: A++

After Docker (100% complete)
  ├── Add: Production deployment
  ├── Impact: Ready for scale
  └── Score: A++ (PRODUCTION READY)
```

---

## 🎊 FINAL GOAL

```
By end of Week 2:

Project Status: 100% PRODUCTION READY ✅
  ├── All features implemented
  ├── 80% test coverage
  ├── CI/CD automated
  ├── Docker containerized
  ├── Security A+ rated
  └── Ready to deploy to production
```

---

**Created:** February 2, 2026  
**Duration:** ~40 hours estimated  
**Start Date:** Today (as soon as you want)  
**Delivery:** 1.5-2 weeks  
**Status:** Detailed roadmap ready to execute  

**🚀 Ready to implement Phase 1 (2FA)? Let's go!**
