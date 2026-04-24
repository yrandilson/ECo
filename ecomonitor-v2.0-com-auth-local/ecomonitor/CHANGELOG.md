# Changelog — EcoMonitor v2.1

Todas as mudanças notáveis deste projeto estão documentadas abaixo.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

## [2.1.0] — 2025-07-15

### Documentação
- **Consolidação**: Unificou ~50 arquivos `.md` dispersos em um único `docs/DOCUMENTACAO_COMPLETA.md` com 19 seções cobrindo visão, requisitos, arquitetura, banco de dados, API, frontend, ML, física, instalação, manual do usuário, referência de API, roadmap e métricas.
- **Limpeza**: Removeu 33 arquivos duplicados/obsoletos (MDs redundantes, phantomjs/, hsperfdata_root/, .manus-logs/, node-compile-cache/, dist/, vite.config.ts.bak, package-lock.json).
- Moveu 13 MDs de referência para pasta `docs/`.

### Segurança
- **JWT_SECRET obrigatório**: Removeu fallback inseguro — aplicação agora exige `JWT_SECRET` no `.env`, lançando erro fatal no boot se ausente.
- **Rate Limiting**: Instalou `express-rate-limit` e aplicou limitadores em rotas de autenticação:
  - Login: 5 tentativas/minuto
  - Registro: 3 tentativas/minuto
  - Reset de senha: 3 tentativas/15 minutos
- **Validação de senha forte**: Mínimo 8 caracteres, maiúscula, número e caractere especial (era 6 sem critérios).
- **Sanitização do .env.example**: Removeu hash JWT real e credenciais do DATABASE_URL.

### Arquitetura
- **Divisão do `server/db.ts`** (583 linhas → 5 módulos):
  - `server/db/connection.ts` — Conexão lazy com MySQL
  - `server/db/users.ts` — Queries de usuários (CRUD, auth, reset)
  - `server/db/occurrences.ts` — Queries de ocorrências/fotos/validações
  - `server/db/gamification.ts` — Simulações, alertas, badges, rankings
  - `server/db/reports.ts` — Denúncias de conteúdo
  - `server/db/index.ts` — Re-exporta todos os módulos (backward-compatible)
- **Divisão do `server/routers.ts`** (377 linhas → 9 sub-routers):
  - `routers/occurrences.ts`, `routers/validations.ts`, `routers/simulations.ts`, `routers/alerts.ts`, `routers/gamification.ts`, `routers/weather.ts`, `routers/satellite.ts`, `routers/predictions.ts`
  - `routers.ts` agora é um arquivo de ~65 linhas que compõe todos os sub-routers

### Performance
- **Lazy Loading de rotas**: Todas as 20 páginas agora usam `React.lazy()` + `Suspense`, reduzindo o bundle inicial.
- **Agregação SQL otimizada**: `getOccurrenceStats()` agora usa `COUNT(*)` + `GROUP BY` no MySQL em vez de carregar todas as linhas na memória.

### Correções
- **getUserAlerts**: Router de alertas agora chama `getUserAlerts()` do módulo DB em vez de retornar array vazio.
- **updateUserRanking**: Corrigido para usar userId diretamente, eliminando query circular redundante.

### Infraestrutura
- **Logging estruturado**: Novo módulo `server/logger.ts` com níveis (debug/info/warn/error), saída JSON em produção e formatada em dev. Variável `LOG_LEVEL` configurável.
- **Health Check**: Novo endpoint `GET /api/health` que verifica conexão com banco e retorna status (`ok`/`degraded`), uptime e timestamp.
- **Admin Middleware**: `adminProcedure` em `_core/trpc.ts` verifica `role === 'admin'` antes de executar procedures administrativas (já existia, documentado).
- **Foreign Keys no schema**: Adicionou `.references(() => users.id)` em todas as tabelas que possuem `userId` (occurrences, validations, simulations, alerts, badges, rankings, contentReports) e `.references(() => occurrences.id)` em photos e alerts.

### Removido
- `server/db.ts` (substituído por `server/db/`)
- 33 arquivos de documentação redundantes
- Diretórios de cache/temporários (phantomjs, hsperfdata_root, node-compile-cache, dist)

---

## [2.0.0] — Versão anterior

- Autenticação local com JWT + cookies
- Dashboard com gráficos Recharts
- Mapa interativo com Leaflet
- Simuladores educacionais (fogo, água, poluição)
- Sistema de gamificação (badges, ranking)
- Validação comunitária de ocorrências
- Integração NASA FIRMS (satélite)
- Integração OpenWeatherMap
- Motor de física e predição ML
- Chatbot IA integrado
- Admin panel com moderação
- Tema claro/escuro
