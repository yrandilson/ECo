# 📡 Referência de API - EcoMonitor v2.0.0

**Documentação completa da API tRPC**

---

## 📋 Índice

1. [Introdução](#introdução)
2. [Autenticação](#autenticação)
3. [Endpoints](#endpoints)
4. [Exemplos de Uso](#exemplos-de-uso)
5. [Tratamento de Erros](#tratamento-de-erros)
6. [Rate Limiting](#rate-limiting)
7. [Webhooks](#webhooks)

---

## Introdução

### Base URL

```
http://localhost:3000/api/trpc
```

### Protocolo

- **tRPC** (RPC type-safe)
- **HTTP POST**
- **JSON** (request/response)
- **SuperJSON** (serialização)

### Autenticação

Todas as requisições incluem cookie de sessão automaticamente.

```
Cookie: session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Autenticação

### Login

```
GET /api/oauth/callback?code=AUTH_CODE
```

**Resposta:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "openId": "user_123",
    "name": "João Silva",
    "email": "joao@example.com",
    "role": "user"
  }
}
```

### Logout

```
POST /api/trpc/auth.logout
```

**Resposta:**
```json
{
  "success": true
}
```

### Verificar Autenticação

```
POST /api/trpc/auth.me
```

**Resposta (autenticado):**
```json
{
  "id": 1,
  "openId": "user_123",
  "name": "João Silva",
  "email": "joao@example.com",
  "role": "user",
  "trustScore": 75,
  "points": 250
}
```

**Resposta (não autenticado):**
```json
null
```

---

## Endpoints

### Ocorrências

#### Criar Ocorrência

```
POST /api/trpc/occurrences.create
```

**Input:**
```json
{
  "type": "fire",
  "latitude": -23.5505,
  "longitude": -46.6333,
  "description": "Incêndio em mata próxima ao bairro",
  "parameters": {
    "temperature": 35,
    "humidity": 25,
    "windSpeed": 20,
    "vegetationDensity": 85
  },
  "photoUrls": [
    "https://s3.example.com/photo1.jpg",
    "https://s3.example.com/photo2.jpg"
  ]
}
```

**Output:**
```json
{
  "id": 42,
  "userId": 1,
  "type": "fire",
  "latitude": -23.5505,
  "longitude": -46.6333,
  "riskScore": 78.5,
  "severity": "high",
  "validationCount": 0,
  "isConfirmed": false,
  "createdAt": "2026-02-01T15:30:00Z"
}
```

**Erros:**
```json
{
  "code": "UNAUTHORIZED",
  "message": "Você precisa estar autenticado"
}
```

#### Listar Ocorrências Recentes

```
POST /api/trpc/occurrences.getRecent
```

**Input:**
```json
{
  "limit": 20,
  "offset": 0,
  "type": "fire",
  "minSeverity": "medium"
}
```

**Output:**
```json
{
  "total": 156,
  "occurrences": [
    {
      "id": 42,
      "type": "fire",
      "latitude": -23.5505,
      "longitude": -46.6333,
      "riskScore": 78.5,
      "severity": "high",
      "validationCount": 5,
      "isConfirmed": true,
      "createdAt": "2026-02-01T15:30:00Z"
    },
    // ... mais ocorrências
  ]
}
```

#### Obter Ocorrência por ID

```
POST /api/trpc/occurrences.getById
```

**Input:**
```json
{
  "id": 42
}
```

**Output:**
```json
{
  "id": 42,
  "userId": 1,
  "type": "fire",
  "latitude": -23.5505,
  "longitude": -46.6333,
  "description": "Incêndio em mata próxima ao bairro",
  "parameters": {
    "temperature": 35,
    "humidity": 25,
    "windSpeed": 20,
    "vegetationDensity": 85
  },
  "riskScore": 78.5,
  "severity": "high",
  "validationCount": 5,
  "isConfirmed": true,
  "status": "active",
  "photos": [
    {
      "id": 1,
      "url": "https://s3.example.com/photo1.jpg",
      "uploadedAt": "2026-02-01T15:30:00Z"
    }
  ],
  "validations": [
    {
      "userId": 2,
      "isValid": true,
      "comment": "Confirmado, vi o fogo"
    }
  ],
  "createdAt": "2026-02-01T15:30:00Z",
  "updatedAt": "2026-02-01T16:00:00Z"
}
```

#### Filtrar por Tipo

```
POST /api/trpc/occurrences.getByType
```

**Input:**
```json
{
  "type": "fire",
  "limit": 50
}
```

**Output:**
```json
{
  "occurrences": [
    // ... ocorrências de incêndio
  ]
}
```

---

### Validações

#### Criar Validação

```
POST /api/trpc/validations.create
```

**Input:**
```json
{
  "occurrenceId": 42,
  "isValid": true,
  "comment": "Confirmado, vi o fogo com meus olhos"
}
```

**Output:**
```json
{
  "id": 123,
  "occurrenceId": 42,
  "userId": 2,
  "isValid": true,
  "comment": "Confirmado, vi o fogo com meus olhos",
  "createdAt": "2026-02-01T16:00:00Z"
}
```

#### Listar Validações de Ocorrência

```
POST /api/trpc/validations.getByOccurrence
```

**Input:**
```json
{
  "occurrenceId": 42
}
```

**Output:**
```json
{
  "validations": [
    {
      "id": 123,
      "userId": 2,
      "isValid": true,
      "comment": "Confirmado",
      "createdAt": "2026-02-01T16:00:00Z"
    },
    {
      "id": 124,
      "userId": 3,
      "isValid": true,
      "comment": "Também vi",
      "createdAt": "2026-02-01T16:05:00Z"
    }
  ]
}
```

---

### Simuladores

#### Executar Simulação de Incêndio

```
POST /api/trpc/simulations.runFireSimulation
```

**Input:**
```json
{
  "temperature": 35,
  "humidity": 25,
  "windSpeed": 20,
  "vegetationDensity": 85
}
```

**Output:**
```json
{
  "id": 456,
  "type": "fire",
  "parameters": {
    "temperature": 35,
    "humidity": 25,
    "windSpeed": 20,
    "vegetationDensity": 85
  },
  "results": {
    "propagationSpeed": 12.5,
    "affectedArea": 45.3,
    "rothermelIndex": 0.89,
    "arrhenius": 0.42
  },
  "riskScore": 78.5,
  "completedAt": "2026-02-01T16:10:00Z"
}
```

#### Executar Simulação Hidrológica

```
POST /api/trpc/simulations.runHydrologySimulation
```

**Input:**
```json
{
  "monthlyPrecipitation": 150,
  "temperature": 25,
  "evapotranspiration": 100,
  "infiltration": 40
}
```

**Output:**
```json
{
  "id": 457,
  "type": "hydrology",
  "results": {
    "waterBalance": 10,
    "runoff": 50,
    "soilStorage": 60,
    "penmanET": 95
  },
  "riskScore": 25,
  "completedAt": "2026-02-01T16:15:00Z"
}
```

#### Executar Simulação de Poluição

```
POST /api/trpc/simulations.runPollutionSimulation
```

**Input:**
```json
{
  "initialConcentration": 500,
  "windSpeed": 5,
  "sourceHeight": 10,
  "atmosphericStability": "neutral"
}
```

**Output:**
```json
{
  "id": 458,
  "type": "pollution",
  "results": {
    "plume": {
      "width": 200,
      "length": 1500,
      "height": 50
    },
    "concentrationAtDistance": {
      "100m": 450,
      "500m": 150,
      "1000m": 50
    },
    "dissipationTime": 120
  },
  "riskScore": 65,
  "completedAt": "2026-02-01T16:20:00Z"
}
```

---

### Gamificação

#### Obter Rankings Globais

```
POST /api/trpc/gamification.getTopRankings
```

**Input:**
```json
{
  "limit": 10
}
```

**Output:**
```json
{
  "rankings": [
    {
      "position": 1,
      "userId": 5,
      "userName": "Maria Silva",
      "points": 1250,
      "badges": 8,
      "trustScore": 95
    },
    {
      "position": 2,
      "userId": 3,
      "userName": "João Santos",
      "points": 980,
      "badges": 6,
      "trustScore": 88
    },
    // ... mais rankings
  ]
}
```

#### Obter Rankings Mensais

```
POST /api/trpc/gamification.getMonthlyRankings
```

**Input:**
```json
{
  "month": "2026-02",
  "limit": 10
}
```

**Output:**
```json
{
  "month": "2026-02",
  "rankings": [
    {
      "position": 1,
      "userId": 2,
      "userName": "Carlos Oliveira",
      "monthlyPoints": 350,
      "badges": 2
    },
    // ... mais rankings
  ]
}
```

#### Obter Badges do Usuário

```
POST /api/trpc/gamification.getUserBadges
```

**Input:**
```json
{}
```

**Output:**
```json
{
  "badges": [
    {
      "type": "fire_watcher",
      "name": "Vigia do Fogo",
      "description": "Registre 5 ocorrências de incêndio",
      "icon": "🔥",
      "unlockedAt": "2026-01-15T10:00:00Z"
    },
    {
      "type": "community_helper",
      "name": "Ajudante da Comunidade",
      "description": "Valide 10 ocorrências",
      "icon": "🤝",
      "unlockedAt": "2026-01-20T14:30:00Z"
    }
  ]
}
```

---

### Alertas

#### Criar Alerta

```
POST /api/trpc/alerts.create
```

**Input:**
```json
{
  "latitude": -23.5505,
  "longitude": -46.6333,
  "radius": 5,
  "types": ["fire", "water_pollution"],
  "minSeverity": "high",
  "channel": "push"
}
```

**Output:**
```json
{
  "id": 789,
  "userId": 1,
  "latitude": -23.5505,
  "longitude": -46.6333,
  "radius": 5,
  "types": ["fire", "water_pollution"],
  "minSeverity": "high",
  "channel": "push",
  "isActive": true,
  "createdAt": "2026-02-01T16:25:00Z"
}
```

#### Listar Alertas do Usuário

```
POST /api/trpc/alerts.getUserAlerts
```

**Input:**
```json
{}
```

**Output:**
```json
{
  "alerts": [
    {
      "id": 789,
      "latitude": -23.5505,
      "longitude": -46.6333,
      "radius": 5,
      "types": ["fire", "water_pollution"],
      "minSeverity": "high",
      "isActive": true,
      "createdAt": "2026-02-01T16:25:00Z"
    }
  ]
}
```

#### Deletar Alerta

```
POST /api/trpc/alerts.delete
```

**Input:**
```json
{
  "alertId": 789
}
```

**Output:**
```json
{
  "success": true
}
```

---

### Usuários

#### Obter Perfil Atual

```
POST /api/trpc/users.getProfile
```

**Input:**
```json
{}
```

**Output:**
```json
{
  "id": 1,
  "name": "João Silva",
  "email": "joao@example.com",
  "role": "user",
  "points": 250,
  "trustScore": 75,
  "badges": 5,
  "occurrencesCount": 12,
  "validationsCount": 28,
  "createdAt": "2025-12-01T10:00:00Z"
}
```

#### Obter Perfil de Outro Usuário

```
POST /api/trpc/users.getPublicProfile
```

**Input:**
```json
{
  "userId": 5
}
```

**Output:**
```json
{
  "id": 5,
  "name": "Maria Silva",
  "role": "user",
  "points": 1250,
  "trustScore": 95,
  "badges": 8,
  "occurrencesCount": 45,
  "validationsCount": 120
}
```

#### Atualizar Perfil

```
POST /api/trpc/users.updateProfile
```

**Input:**
```json
{
  "name": "João Silva Santos",
  "email": "joao.silva@example.com"
}
```

**Output:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "João Silva Santos",
    "email": "joao.silva@example.com"
  }
}
```

---

## Exemplos de Uso

### JavaScript/Node.js

```javascript
// Usando tRPC client
import { trpc } from './lib/trpc';

// Criar ocorrência
const occurrence = await trpc.occurrences.create.mutate({
  type: 'fire',
  latitude: -23.5505,
  longitude: -46.6333,
  description: 'Incêndio detectado',
  parameters: {
    temperature: 35,
    humidity: 25,
    windSpeed: 20,
    vegetationDensity: 85
  },
  photoUrls: []
});

console.log('Ocorrência criada:', occurrence.id);
```

### Python

```python
import requests
import json

# Configurar
BASE_URL = "http://localhost:3000/api/trpc"
HEADERS = {"Content-Type": "application/json"}

# Criar ocorrência
data = {
  "type": "fire",
  "latitude": -23.5505,
  "longitude": -46.6333,
  "description": "Incêndio detectado",
  "parameters": {
    "temperature": 35,
    "humidity": 25,
    "windSpeed": 20,
    "vegetationDensity": 85
  },
  "photoUrls": []
}

response = requests.post(
  f"{BASE_URL}/occurrences.create",
  headers=HEADERS,
  json=data,
  cookies={"session": "seu_session_cookie"}
)

print(response.json())
```

### cURL

```bash
# Criar ocorrência
curl -X POST http://localhost:3000/api/trpc/occurrences.create \
  -H "Content-Type: application/json" \
  -b "session=seu_session_cookie" \
  -d '{
    "type": "fire",
    "latitude": -23.5505,
    "longitude": -46.6333,
    "description": "Incêndio detectado",
    "parameters": {
      "temperature": 35,
      "humidity": 25,
      "windSpeed": 20,
      "vegetationDensity": 85
    },
    "photoUrls": []
  }'
```

---

## Tratamento de Erros

### Formato de Erro

```json
{
  "code": "BAD_REQUEST",
  "message": "Descrição do erro",
  "details": {
    "field": "temperature",
    "issue": "Deve estar entre 0 e 50"
  }
}
```

### Códigos de Erro

| Código | HTTP | Descrição |
|--------|------|-----------|
| UNAUTHORIZED | 401 | Não autenticado |
| FORBIDDEN | 403 | Sem permissão |
| NOT_FOUND | 404 | Recurso não encontrado |
| BAD_REQUEST | 400 | Entrada inválida |
| CONFLICT | 409 | Conflito (ex: duplicado) |
| INTERNAL_SERVER_ERROR | 500 | Erro do servidor |

### Exemplo de Tratamento

```javascript
try {
  const result = await trpc.occurrences.create.mutate(data);
} catch (error) {
  if (error.code === 'UNAUTHORIZED') {
    // Redirecionar para login
  } else if (error.code === 'BAD_REQUEST') {
    // Mostrar erro de validação
    console.error(error.details);
  } else {
    // Erro genérico
    console.error(error.message);
  }
}
```

---

## Rate Limiting

### Limites

- **Requisições por minuto**: 60 (por IP)
- **Requisições por hora**: 1000 (por IP)
- **Uploads por dia**: 50 (por usuário)

### Headers de Resposta

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1643723400
```

### Tratamento

```javascript
if (response.status === 429) {
  const resetTime = response.headers['X-RateLimit-Reset'];
  console.log('Rate limit atingido. Tente novamente em:', new Date(resetTime * 1000));
}
```

---

## Webhooks

### Eventos Disponíveis

- `occurrence.created` - Nova ocorrência registrada
- `occurrence.validated` - Ocorrência validada
- `occurrence.confirmed` - Ocorrência confirmada (3+ validações)
- `alert.triggered` - Alerta disparado
- `user.badge_unlocked` - Badge desbloqueado

### Registrar Webhook

```
POST /api/webhooks/register
```

**Input:**
```json
{
  "url": "https://seu-servidor.com/webhook",
  "events": ["occurrence.created", "occurrence.validated"],
  "secret": "seu_secret_key"
}
```

### Payload de Webhook

```json
{
  "event": "occurrence.created",
  "timestamp": "2026-02-01T16:30:00Z",
  "data": {
    "id": 42,
    "type": "fire",
    "latitude": -23.5505,
    "longitude": -46.6333,
    "riskScore": 78.5,
    "severity": "high"
  },
  "signature": "sha256=abcd1234..."
}
```

### Verificar Assinatura

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return `sha256=${hash}` === signature;
}
```

---

## Paginação

### Parâmetros

```json
{
  "limit": 20,
  "offset": 0,
  "sort": "createdAt",
  "order": "desc"
}
```

### Resposta

```json
{
  "total": 156,
  "limit": 20,
  "offset": 0,
  "data": [...]
}
```

---

## Filtros

### Operadores

```json
{
  "filters": {
    "type": "fire",
    "severity": {"$in": ["high", "critical"]},
    "riskScore": {"$gte": 70},
    "createdAt": {"$gte": "2026-02-01T00:00:00Z"}
  }
}
```

---

**Desenvolvido com ❤️ para proteger o ambiente**

**EcoMonitor v2.0.0 - Fevereiro 2026**
