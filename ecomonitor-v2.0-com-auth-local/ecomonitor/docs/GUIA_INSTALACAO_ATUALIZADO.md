# 🚀 Guia de Instalação - EcoMonitor (Atualizado)

## ✨ Novidades - Autenticação Local

O sistema agora suporta **autenticação local** (email + senha) além do OAuth do Manus. Isso permite testar o sistema localmente sem precisar configurar OAuth!

---

## 📋 Pré-requisitos

1. **Node.js** (v18 ou superior)
2. **MySQL** (v8 ou superior)
3. **pnpm** (gerenciador de pacotes)

---

## 🔧 Instalação Rápida

### 1. Instalar Dependências

```bash
pnpm install
```

### 2. Configurar Banco de Dados

Crie um banco de dados MySQL:

```sql
CREATE DATABASE ecomonitor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

Edite o `.env` e configure as variáveis **mínimas**:

```env
# Database (OBRIGATÓRIO)
DATABASE_URL="mysql://root:sua-senha@localhost:3306/ecomonitor"

# JWT Secret (OBRIGATÓRIO - gere um aleatório)
JWT_SECRET="seu-jwt-secret-super-secreto-aqui"

# APIs Externas (OPCIONAL mas recomendado)
OPENWEATHER_API_KEY="sua-chave-openweather"
NASA_FIRMS_API_KEY="sua-chave-nasa-firms"
```

**Como gerar um JWT_SECRET seguro:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Executar Migrações do Banco

```bash
pnpm db:push
```

Isso irá criar todas as tabelas necessárias, incluindo suporte para autenticação local.

### 5. Iniciar o Servidor

```bash
pnpm dev
```

O servidor estará disponível em `http://localhost:3000`

---

## 🔐 Sistema de Autenticação

O EcoMonitor agora suporta **dois métodos** de autenticação:

### 1. Autenticação Local (Email + Senha)

**Para desenvolvedores e testes locais:**

- **Cadastro:** Acesse `/register` e crie uma conta
- **Login:** Acesse `/login` com suas credenciais
- **Segurança:** Senhas são hashadas com bcrypt
- **Sessões:** Token JWT armazenado em cookie HTTP-only

### 2. OAuth Manus (Produção)

**Para deploy em produção:**

Configure as variáveis OAuth no `.env`:

```env
VITE_APP_ID="seu-app-id"
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://auth.manus.im"
OWNER_OPEN_ID="seu-openid"
```

---

## 🎯 Primeiros Passos

### Criando Primeira Conta

1. Acesse `http://localhost:3000/register`
2. Preencha:
   - Nome
   - Email
   - Senha (mínimo 6 caracteres)
3. Clique em "Criar Conta"
4. Você será automaticamente logado e redirecionado para o Dashboard

### Fazendo Login

1. Acesse `http://localhost:3000/login`
2. Digite email e senha
3. Clique em "Entrar"

---

## 📊 Estrutura do Banco de Dados

A migration `0002_add_local_auth.sql` adiciona:

- Campo `passwordHash` na tabela `users` (para armazenar senha hash)
- Campo `openId` agora é **opcional** (NULL)
- Índice `email_idx` para buscas rápidas

**Compatibilidade:** O sistema é **retrocompatível**. Usuários OAuth continuam funcionando normalmente!

---

## 🔑 APIs Externas (Opcional)

### OpenWeatherMap API

1. Registre-se em: https://openweathermap.org/api
2. Obtenha sua chave API (gratuita: 1,000 chamadas/dia)
3. Adicione no `.env`:

```env
OPENWEATHER_API_KEY="sua-chave-aqui"
```

### NASA FIRMS API

1. Registre-se em: https://firms.modaps.eosdis.nasa.gov/api/
2. Obtenha sua chave API (gratuita e ilimitada)
3. Adicione no `.env`:

```env
NASA_FIRMS_API_KEY="sua-chave-aqui"
```

---

## 🐛 Solução de Problemas

### Erro: "Cannot connect to database"

**Solução:**
1. Verifique se o MySQL está rodando
2. Confirme as credenciais em `DATABASE_URL`
3. Teste a conexão:

```bash
mysql -u root -p -e "USE ecomonitor;"
```

### Erro: "Email já cadastrado"

**Solução:**
- O email já existe no banco
- Tente fazer login em vez de cadastrar
- Ou use outro email

### Erro: "JWT malformed"

**Solução:**
1. Limpe os cookies do navegador
2. Verifique se `JWT_SECRET` está configurado no `.env`
3. Reinicie o servidor

### Migrations não rodaram

**Solução:**

```bash
# Resetar e recriar banco (CUIDADO: apaga dados)
mysql -u root -p -e "DROP DATABASE IF EXISTS ecomonitor; CREATE DATABASE ecomonitor;"

# Rodar migrations novamente
pnpm db:push
```

---

## 📦 Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev                  # Inicia servidor de desenvolvimento

# Build
pnpm build               # Compila para produção
pnpm start               # Inicia servidor de produção

# Banco de Dados
pnpm db:push             # Executa migrations

# Linting
pnpm check               # Verifica tipos TypeScript
pnpm format              # Formata código com Prettier

# Testes
pnpm test                # Executa testes
```

---

## 🌟 Recursos Principais

✅ **Autenticação Local** - Login/Cadastro sem dependências externas
✅ **Dashboard Interativo** - Visualização de ocorrências
✅ **Mapa em Tempo Real** - Leaflet com marcadores
✅ **Simuladores Físicos** - Propagação de fogo, poluição
✅ **Machine Learning** - Previsão de risco de incêndios
✅ **Validação por Satélite** - Integração NASA FIRMS
✅ **Gamificação** - Pontos, rankings, badges
✅ **Sistema de Alertas** - Notificações por geolocalização
✅ **Modo Escuro/Claro** - Interface adaptável

---

## 📱 Próximos Passos

Após instalar e testar localmente:

1. Explore o **Dashboard** (`/dashboard`)
2. Reporte uma **Ocorrência** (`/report`)
3. Visualize no **Mapa** (`/map`)
4. Teste os **Simuladores** (`/simulators`)
5. Veja **Previsões ML** (`/predictive`)

---

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'Adiciona nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

---

## 📄 Licença

MIT License - veja `LICENSE` para detalhes

---

## 🆘 Suporte

- **Issues:** Abra uma issue no GitHub
- **Email:** suporte@ecomonitor.com
- **Docs:** Consulte `MANUAL_TECNICO.md` para detalhes avançados

---

**Desenvolvido com ❤️ para proteger o meio ambiente**
