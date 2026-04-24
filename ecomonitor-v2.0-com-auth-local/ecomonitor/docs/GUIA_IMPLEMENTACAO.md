# 🚀 Guia Rápido de Implementação - EcoMonitor

## ⚡ Quick Start - Implementar Melhorias Críticas

Este guia detalha como implementar rapidamente as melhorias mais importantes do projeto.

---

## 1️⃣ CONFIGURAR APIs EXTERNAS (30 minutos)

### Passo 1: Obter API Keys

#### OpenWeatherMap
1. Acesse: https://openweathermap.org/api
2. Crie uma conta gratuita
3. Copie sua API key do dashboard
4. **Free tier:** 1,000 chamadas/dia

#### NASA FIRMS
1. Acesse: https://firms.modaps.eosdis.nasa.gov/api/
2. Registre-se para obter MAP_KEY
3. Copie o token fornecido
4. **Gratuito e ilimitado**

### Passo 2: Adicionar ao .env.local

```bash
# Adicionar ao arquivo .env.local
OPENWEATHER_API_KEY="sua_chave_aqui"
NASA_FIRMS_API_KEY="sua_chave_aqui"
```

### Passo 3: Integrar aos Routers

Adicione ao `server/routers.ts`:

```typescript
import { getCurrentWeather, getWeatherForecast, calculateFireWeatherIndex } from './integrations/openweather';
import { validateFireOccurrence, getFireStatistics } from './integrations/nasa-firms';

// Adicionar novo router para weather
weather: router({
  getCurrent: publicProcedure
    .input(z.object({ latitude: z.number(), longitude: z.number() }))
    .query(async ({ input }) => {
      return await getCurrentWeather(input.latitude, input.longitude);
    }),
  
  getForecast: publicProcedure
    .input(z.object({ 
      latitude: z.number(), 
      longitude: z.number(),
      days: z.number().min(1).max(7).default(7)
    }))
    .query(async ({ input }) => {
      return await getWeatherForecast(input.latitude, input.longitude, input.days);
    }),
  
  getFireIndex: publicProcedure
    .input(z.object({ latitude: z.number(), longitude: z.number() }))
    .query(async ({ input }) => {
      return await calculateFireWeatherIndex(input.latitude, input.longitude);
    }),
}),

// Adicionar ao router de validações
validateWithSatellite: protectedProcedure
  .input(z.object({ occurrenceId: z.number() }))
  .mutation(async ({ input }) => {
    const occurrence = await getOccurrenceById(input.occurrenceId);
    if (!occurrence) throw new Error('Occurrence not found');
    
    const result = await validateFireOccurrence(
      Number(occurrence.latitude),
      Number(occurrence.longitude),
      new Date(occurrence.createdAt)
    );
    
    if (result.isValidated) {
      await updateOccurrenceRiskScore(input.occurrenceId, result.confidence);
    }
    
    return result;
  }),
```

### Passo 4: Testar as Integrações

```bash
# Terminal 1: Iniciar servidor
pnpm dev

# Terminal 2: Testar API
curl "http://localhost:3000/api/weather/getCurrent?latitude=-3.72&longitude=-38.52"
```

---

## 2️⃣ ATIVAR VALIDAÇÃO AUTOMÁTICA (20 minutos)

### Passo 1: Configurar Worker

Adicione ao `package.json`:

```json
{
  "scripts": {
    "worker:validation": "NODE_ENV=production tsx server/workers/satellite-validation.ts"
  }
}
```

### Passo 2: Configurar Cron Job

**Opção A: Linux/Mac (crontab)**

```bash
crontab -e

# Adicionar linha (executar a cada 3 horas):
0 */3 * * * cd /caminho/do/projeto && pnpm worker:validation >> /var/log/ecomonitor-worker.log 2>&1
```

**Opção B: PM2 (recomendado para produção)**

```bash
# Instalar PM2
npm install -g pm2

# Criar arquivo ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'ecomonitor-app',
      script: 'dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'ecomonitor-worker',
      script: 'tsx',
      args: 'server/workers/satellite-validation.ts',
      cron_restart: '0 */3 * * *', // A cada 3 horas
      autorestart: false,
    },
  ],
};
EOF

# Iniciar com PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Passo 3: Testar Manualmente

```bash
pnpm worker:validation
```

Você deve ver:
```
[Satellite Validation] Iniciando job de validação...
[Satellite Validation] X ocorrências para validar
[NASA FIRMS] Encontradas Y detecções em raio de 5km
...
```

---

## 3️⃣ MELHORAR UPLOAD DE FOTOS (15 minutos)

### Passo 1: Substituir Componente

Em `client/src/pages/ReportOccurrence.tsx`, substitua:

```typescript
// Antes:
import { PhotoUploader } from '../components/PhotoUploader';

// Depois:
import PhotoUploaderEnhanced from '../components/PhotoUploaderEnhanced';

// No JSX:
<PhotoUploaderEnhanced
  maxPhotos={5}
  maxSizeMB={10}
  onPhotosChange={(photos) => {
    setFormData({
      ...formData,
      photos: photos.filter(p => p.uploaded).map(p => p.url!),
    });
  }}
/>
```

### Passo 2: Configurar Storage Real (AWS S3)

**Opção A: AWS S3**

```bash
# Adicionar ao .env.local
AWS_ACCESS_KEY_ID="sua_access_key"
AWS_SECRET_ACCESS_KEY="sua_secret_key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="ecomonitor-photos"
```

**Opção B: Cloudflare R2 (mais barato)**

```bash
# Adicionar ao .env.local
R2_ACCOUNT_ID="seu_account_id"
R2_ACCESS_KEY_ID="sua_access_key"
R2_SECRET_ACCESS_KEY="sua_secret_key"
R2_BUCKET="ecomonitor-photos"
```

Modificar `server/storage.ts`:

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadPhoto(file: Buffer, filename: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: `photos/${Date.now()}-${filename}`,
    Body: file,
    ContentType: 'image/jpeg',
  });

  await s3Client.send(command);
  
  return `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/photos/${filename}`;
}
```

---

## 4️⃣ ADICIONAR TESTES BÁSICOS (30 minutos)

### Passo 1: Criar Testes Unitários

```bash
# Criar arquivo de teste
cat > server/__tests__/physics.test.ts << 'EOF'
import { describe, it, expect } from 'vitest';
import { calculateOccurrenceRisk } from '../physics';

describe('Physics Engine', () => {
  it('deve calcular risco de incêndio corretamente', () => {
    const params = {
      temperature: 35,
      humidity: 20,
      windSpeed: 30,
      vegetationType: 'grassland',
    };

    const risk = calculateOccurrenceRisk('fire', params);
    
    expect(risk).toBeGreaterThan(60); // Alto risco
    expect(risk).toBeLessThanOrEqual(100);
  });

  it('deve retornar risco baixo com condições favoráveis', () => {
    const params = {
      temperature: 20,
      humidity: 80,
      windSpeed: 5,
      vegetationType: 'grassland',
    };

    const risk = calculateOccurrenceRisk('fire', params);
    
    expect(risk).toBeLessThan(30); // Baixo risco
  });
});
EOF
```

### Passo 2: Executar Testes

```bash
pnpm test
```

---

## 5️⃣ MELHORIAS DE PERFORMANCE (20 minutos)

### Passo 1: Adicionar Índices no Banco de Dados

```sql
-- Executar no MySQL
USE ecomonitor;

-- Índice composto para queries de mapa
CREATE INDEX idx_occurrences_type_status_created 
ON occurrences(type, status, createdAt DESC);

-- Índice espacial para queries de proximidade
CREATE SPATIAL INDEX idx_occurrences_location 
ON occurrences(latitude, longitude);

-- Índice para rankings
CREATE INDEX idx_rankings_total_points 
ON rankings(totalPoints DESC);

CREATE INDEX idx_rankings_monthly_points 
ON rankings(monthlyPoints DESC);
```

### Passo 2: Adicionar Cache em Memória

Criar `server/cache.ts`:

```typescript
const cache = new Map<string, { data: any; expiry: number }>();

export function setCache(key: string, data: any, ttlSeconds: number = 3600): void {
  cache.set(key, {
    data,
    expiry: Date.now() + ttlSeconds * 1000,
  });
}

export function getCache<T>(key: string): T | null {
  const cached = cache.get(key);
  
  if (!cached) return null;
  
  if (Date.now() > cached.expiry) {
    cache.delete(key);
    return null;
  }
  
  return cached.data as T;
}

export function clearCache(pattern?: string): void {
  if (!pattern) {
    cache.clear();
    return;
  }
  
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}
```

Usar no `server/routers.ts`:

```typescript
import { getCache, setCache } from './cache';

// Exemplo em getRecentOccurrences
getRecent: publicProcedure
  .input(z.object({ limit: z.number().optional() }))
  .query(async ({ input }) => {
    const cacheKey = `occurrences:recent:${input.limit || 20}`;
    
    // Tentar cache primeiro
    const cached = getCache<any[]>(cacheKey);
    if (cached) return cached;
    
    // Buscar do banco
    const data = await getRecentOccurrences(input.limit || 20);
    
    // Cachear por 5 minutos
    setCache(cacheKey, data, 300);
    
    return data;
  }),
```

---

## 6️⃣ ADICIONAR NOTIFICAÇÕES EM TEMPO REAL (40 minutos)

### Passo 1: Instalar Socket.IO

```bash
pnpm add socket.io socket.io-client
```

### Passo 2: Configurar no Servidor

Em `server/_core/index.ts`:

```typescript
import { Server as SocketIOServer } from 'socket.io';

// Após criar o server HTTP
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? 'https://seu-dominio.com' 
      : 'http://localhost:3000',
    credentials: true,
  },
});

// Middleware de autenticação
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // Validar token JWT
  next();
});

// Eventos
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Cliente conectado: ${socket.id}`);
  
  socket.on('join-region', ({ latitude, longitude, radius }) => {
    const room = `region:${latitude}:${longitude}:${radius}`;
    socket.join(room);
  });
  
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Cliente desconectado: ${socket.id}`);
  });
});

// Exportar io para usar em outros módulos
export { io };
```

### Passo 3: Emitir Eventos no Worker

Em `server/workers/satellite-validation.ts`:

```typescript
import { io } from '../_core/index';

// Após validar ocorrência
if (validation.isValidated) {
  // ... código existente ...
  
  // Emitir evento WebSocket
  io.to(`region:${occurrence.latitude}:${occurrence.longitude}:10`).emit('occurrence-validated', {
    occurrenceId: occurrence.id,
    validation,
  });
}
```

### Passo 4: Conectar no Frontend

Criar `client/src/hooks/useSocket.ts`:

```typescript
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(token: string | null) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    socketRef.current = io('http://localhost:3000', {
      auth: { token },
    });

    socketRef.current.on('connect', () => {
      console.log('[Socket] Conectado');
    });

    socketRef.current.on('occurrence-validated', (data) => {
      console.log('[Socket] Ocorrência validada:', data);
      // Atualizar UI
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token]);

  return socketRef.current;
}
```

---

## 7️⃣ DEPLOY EM PRODUÇÃO (variável)

### Opção A: Vercel + PlanetScale

```bash
# 1. Build do projeto
pnpm build

# 2. Configurar Vercel
vercel

# 3. Adicionar variáveis de ambiente no dashboard Vercel
# - DATABASE_URL (PlanetScale)
# - OPENWEATHER_API_KEY
# - NASA_FIRMS_API_KEY
# - etc.

# 4. Deploy
vercel --prod
```

### Opção B: VPS (Ubuntu)

```bash
# 1. SSH no servidor
ssh user@seu-servidor.com

# 2. Instalar dependências
sudo apt update
sudo apt install nodejs npm nginx mysql-server

# 3. Clonar repositório
git clone https://github.com/seu-usuario/ecomonitor.git
cd ecomonitor

# 4. Instalar pnpm e dependências
npm install -g pnpm
pnpm install

# 5. Build
pnpm build

# 6. Configurar PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 7. Configurar Nginx
sudo nano /etc/nginx/sites-available/ecomonitor
```

Nginx config:
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## ✅ Checklist de Implementação

- [ ] APIs externas configuradas (OpenWeather + NASA FIRMS)
- [ ] Worker de validação automática rodando
- [ ] Upload de fotos funcionando
- [ ] Testes básicos adicionados
- [ ] Performance otimizada (índices + cache)
- [ ] Notificações em tempo real (Socket.IO)
- [ ] Deploy em produção realizado
- [ ] Monitoramento configurado
- [ ] Backup automatizado
- [ ] SSL/HTTPS ativado

---

## 📊 Próximos Passos

1. Implementar modelo LSTM melhorado
2. Adicionar exportação de relatórios em PDF
3. Implementar i18n (inglês/espanhol)
4. Adicionar testes E2E com Cypress
5. Melhorar acessibilidade (ARIA)
6. Otimizar bundle size
7. Adicionar analytics
8. Criar documentação de API

---

## 🆘 Suporte

Se encontrar problemas:

1. Verificar logs: `pm2 logs ecomonitor-app`
2. Verificar banco de dados: `mysql -u root -p`
3. Testar APIs manualmente: `curl http://localhost:3000/api/...`
4. Abrir issue no GitHub

---

**Desenvolvido com ❤️ para proteger o ambiente**
