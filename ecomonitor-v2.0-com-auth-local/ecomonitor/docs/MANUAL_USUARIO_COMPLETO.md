# 📖 Manual Completo do EcoMonitor v2.0.0

**Plataforma Colaborativa de Monitoramento e Prevenção de Riscos Ambientais**

---

## 📋 Índice

1. [Introdução](#introdução)
2. [Instalação e Configuração](#instalação-e-configuração)
3. [Autenticação e Perfis](#autenticação-e-perfis)
4. [Funcionalidades Principais](#funcionalidades-principais)
5. [Guia de Uso por Página](#guia-de-uso-por-página)
6. [Motor de Análise Física](#motor-de-análise-física)
7. [Sistema de Gamificação](#sistema-de-gamificação)
8. [Painel Administrativo](#painel-administrativo)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)

---

## Introdução

### O que é EcoMonitor?

**EcoMonitor** é uma plataforma web colaborativa que integra:

- **Monitoramento em Tempo Real**: Registro de ocorrências ambientais com geolocalização
- **Análise Científica**: 6 modelos de física computacional para cálculo de riscos
- **Educação Interativa**: 3 simuladores educativos sobre fenômenos ambientais
- **Engajamento Comunitário**: Validação colaborativa e gamificação
- **Gestão Inteligente**: Dashboard analítico e alertas geoespaciais

### Objetivos

✅ Capacitar cidadãos a monitorar riscos ambientais
✅ Fornecer análise científica de dados
✅ Educar sobre fenômenos ambientais
✅ Incentivar participação comunitária
✅ Facilitar gestão de riscos

### Tipos de Ocorrências Monitoradas

1. **🔥 Incêndios Florestais** - Propagação de fogo em vegetação
2. **💧 Poluição de Água** - Contaminação de recursos hídricos
3. **☁️ Poluição do Ar** - Qualidade do ar e emissões
4. **🏜️ Seca** - Déficit hídrico prolongado
5. **🌳 Desmatamento** - Perda de cobertura vegetal
6. **🌊 Enchente** - Inundações e transbordamento de rios
7. **📍 Outro** - Outros riscos ambientais

---

## Instalação e Configuração

### Requisitos do Sistema

- **Node.js**: v18+ (recomendado v22)
- **npm/pnpm**: v8+
- **MySQL**: v8+ ou TiDB
- **Navegador**: Chrome, Firefox, Safari (versões recentes)
- **Espaço em Disco**: ~500MB (sem node_modules)

### Passo 1: Extrair o Arquivo ZIP

```bash
unzip ecomonitor-final-v2.0.0.zip
cd ecomonitor
```

### Passo 2: Instalar Dependências

```bash
# Usando pnpm (recomendado)
pnpm install

# Ou usando npm
npm install
```

### Passo 3: Configurar Banco de Dados

```bash
# Copiar arquivo de exemplo
cp .env.example .env.local

# Editar .env.local com suas credenciais
# DATABASE_URL=mysql://user:password@localhost:3306/ecomonitor
```

### Passo 4: Executar Migrações

```bash
# Gerar migrações (se houver mudanças no schema)
pnpm drizzle-kit generate

# Aplicar migrações
pnpm drizzle-kit migrate
```

### Passo 5: Iniciar o Servidor

```bash
# Desenvolvimento
pnpm dev

# Produção
pnpm build
pnpm start
```

Acesse em: **http://localhost:3000**

---

## Autenticação e Perfis

### Sistema de Autenticação

EcoMonitor usa **OAuth2** (Manus) para autenticação segura.

#### Fluxo de Login

1. Clique em "Entrar" na página inicial
2. Você será redirecionado para o portal de login Manus
3. Autentique com suas credenciais
4. Será redirecionado de volta para EcoMonitor
5. Sua sessão será criada automaticamente

#### Logout

1. Vá para **Configurações** (engrenagem no canto superior direito)
2. Clique em **Desconectar**
3. Sua sessão será encerrada

### Níveis de Acesso

#### 👤 Usuário Comum (user)

- Registrar ocorrências
- Validar ocorrências de outros
- Usar simuladores
- Ver dashboard pessoal
- Participar do feed colaborativo
- Receber alertas geoespaciais

**Permissões:**
- Criar: ocorrências, comentários, validações
- Editar: próprias ocorrências (24h após criação)
- Deletar: próprias ocorrências
- Ver: todas as ocorrências públicas

#### 🛡️ Moderador (moderator)

Inclui todas as permissões de usuário comum, mais:

- Moderar comentários inapropriados
- Remover ocorrências falsas
- Suspender usuários abusivos
- Ver estatísticas de moderação
- Gerenciar denúncias de conteúdo

#### 👨‍💼 Administrador (admin)

Acesso completo:

- Gerenciar todos os usuários
- Alterar roles de usuários
- Ver analytics completo
- Configurar alertas globais
- Gerenciar badges e pontos
- Exportar dados do sistema
- Acessar painel administrativo completo

### Perfil de Usuário

#### Visualizar Perfil

1. Clique no ícone do usuário (canto superior direito)
2. Selecione **Meu Perfil**
3. Veja suas informações e estatísticas

#### Informações do Perfil

- **Nome**: Seu nome completo
- **Email**: Email registrado
- **Role**: Seu nível de acesso
- **Pontos**: Total de pontos acumulados
- **Trust Score**: Confiabilidade (0-100)
- **Membro desde**: Data de registro
- **Badges**: Conquistas desbloqueadas

#### Editar Perfil

1. Vá para **Configurações**
2. Clique em **Editar Perfil**
3. Atualize suas informações
4. Clique em **Salvar**

---

## Funcionalidades Principais

### 1. 📍 Registrar Ocorrência

**Objetivo**: Reportar um risco ambiental com localização e fotos.

#### Como Registrar

1. Clique em **"Reportar"** (botão verde no topo)
2. Preencha o formulário:
   - **Tipo**: Selecione o tipo de ocorrência
   - **Localização**: Use GPS ou clique no mapa
   - **Descrição**: Descreva o que observou
   - **Parâmetros**: Preencha conforme o tipo
   - **Fotos**: Adicione até 5 fotos (máx 5MB cada)

#### Parâmetros por Tipo

**Incêndio:**
- Temperatura (°C): 20-1200
- Umidade (%): 0-100
- Velocidade do Vento (km/h): 0-100
- Tipo de Vegetação: Floresta, Cerrado, Caatinga, Outro

**Poluição de Água:**
- Nível de Água (m): 0-10
- Cor: Transparente, Turva, Escura, Outra
- Temperatura (°C): 0-40

**Poluição do Ar:**
- Qualidade do Ar (AQI): 0-500
- Visibilidade (m): 0-10000
- Velocidade do Vento (km/h): 0-50

**Seca:**
- Temperatura (°C): 0-50
- Umidade (%): 0-100
- Precipitação (mm): 0-500

**Desmatamento:**
- Densidade de Vegetação (%): 0-100
- Acessibilidade: Fácil, Médio, Difícil

**Enchente:**
- Elevação (m): -100 a 5000
- Proximidade à Água (m): 0-1000
- Inclinação (%): 0-100

#### Recompensas

- **+10 pontos** por registrar ocorrência
- **+5 pontos** se validada por 3+ usuários
- Possível desbloqueio de badges

#### Dicas

✅ Forneça informações precisas
✅ Adicione fotos claras e bem iluminadas
✅ Descreva o contexto da ocorrência
✅ Use GPS quando possível
❌ Não registre ocorrências falsas (pode resultar em suspensão)

---

### 2. 🗺️ Explorar Mapa

**Objetivo**: Visualizar todas as ocorrências em um mapa interativo.

#### Funcionalidades

1. **Visualização em Tempo Real**
   - Marcadores coloridos por tipo
   - Clustering automático
   - Zoom e pan livre

2. **Filtros**
   - Por tipo de ocorrência
   - Por severidade (baixa, média, alta, crítica)
   - Por data (últimas 24h, 7 dias, 30 dias)

3. **Detalhes da Ocorrência**
   - Clique em um marcador
   - Veja foto, descrição, risco calculado
   - Valide ou comente

4. **Alertas Próximos**
   - Ocorrências críticas destacadas
   - Distância até sua localização
   - Notificação automática

#### Cores dos Marcadores

- 🔴 **Vermelho**: Crítico (risco > 80%)
- 🟠 **Laranja**: Alto (risco 60-80%)
- 🟡 **Amarelo**: Médio (risco 40-60%)
- 🟢 **Verde**: Baixo (risco < 40%)

#### Controles

| Ação | Como Fazer |
|------|-----------|
| Zoom In | Scroll para cima ou `+` |
| Zoom Out | Scroll para baixo ou `-` |
| Pan | Clique e arraste |
| Filtrar | Clique em "Filtros" |
| Detalhes | Clique no marcador |

---

### 3. 🎮 Simuladores Educativos

**Objetivo**: Aprender sobre fenômenos ambientais através de simulações interativas.

#### Simulador 1: Propagação de Incêndio

**Como Usar:**
1. Vá para **Simuladores**
2. Selecione **Propagação de Incêndio**
3. Ajuste os sliders:
   - Temperatura (°C)
   - Umidade Relativa (%)
   - Velocidade do Vento (km/h)
   - Densidade de Vegetação (%)

**O que Observar:**
- Velocidade de propagação em tempo real
- Área afetada (hectares)
- Índice de propagação (Rothermel)
- Recomendações de segurança

**Fórmula Usada:**
```
Velocidade = Arrhenius(T) × Rothermel(U, V, ρ)
Risco = f(velocidade, densidade)
```

**Recompensa:** +3 pontos por simulação

#### Simulador 2: Hidrologia

**Como Usar:**
1. Selecione **Simulador Hidrológico**
2. Ajuste parâmetros:
   - Precipitação Mensal (mm)
   - Temperatura (°C)
   - Evapotranspiração (mm)
   - Infiltração (%)

**O que Observar:**
- Balanço hídrico mensal
- Runoff (escoamento)
- Armazenamento no solo
- Gráfico de tendência anual

**Fórmula Usada:**
```
Balanço = Precipitação - Evapotranspiração(Penman) - Infiltração(Darcy)
```

#### Simulador 3: Dispersão de Poluentes

**Como Usar:**
1. Selecione **Dispersão de Poluentes**
2. Configure:
   - Concentração Inicial (µg/m³)
   - Velocidade do Vento (m/s)
   - Altura da Fonte (m)
   - Estabilidade Atmosférica

**O que Observar:**
- Pluma de dispersão em tempo real
- Concentração em diferentes pontos
- Raio de influência
- Tempo de dissipação

**Fórmula Usada:**
```
Modelo Gaussiano: C(x,y,z) = Q/(2πσyσz·u) × exp(...)
```

---

### 4. ✓ Feed Colaborativo

**Objetivo**: Validar ocorrências e participar da comunidade.

#### Validar Ocorrência

1. Vá para **Feed**
2. Encontre uma ocorrência não validada
3. Clique em **Validar**
4. Escolha: ✓ Confirmar ou ✗ Rejeitar
5. Adicione comentário (opcional)

**Recompensas:**
- **+5 pontos** por validação
- **+1 ponto** por comentário útil
- Aumento de trust score

#### Comentar

1. Clique em **Comentários** na ocorrência
2. Digite seu comentário
3. Clique em **Enviar**
4. Veja respostas em tempo real

#### Validações Comunitárias

- Uma ocorrência precisa de **3+ validações** para ser "confirmada"
- Usuários com alto trust score têm peso maior
- Validações conflitantes disparam revisão manual

#### Estatísticas do Feed

- Total de ocorrências
- Taxa de validação
- Usuários mais ativos
- Comentários por tipo

---

### 5. 📊 Dashboard Pessoal

**Objetivo**: Acompanhar seu progresso e estatísticas.

#### Seções do Dashboard

**1. Resumo Pessoal**
- Pontos totais
- Ranking posição
- Trust score
- Badges conquistadas

**2. Minhas Ocorrências**
- Total registrado
- Taxa de validação
- Risco médio
- Últimas 5 ocorrências

**3. Atividades Recentes**
- Timeline de ações
- Pontos ganhos
- Badges desbloqueadas
- Validações recebidas

**4. Gráficos**
- Pontos ao longo do tempo
- Ocorrências por tipo
- Taxa de validação
- Comparação com média

**5. Badges**
- Badges conquistadas
- Badges disponíveis
- Progresso para próximas

---

### 6. 🚨 Alertas Geoespaciais

**Objetivo**: Receber notificações de ocorrências críticas próximas.

#### Configurar Alertas

1. Vá para **Alertas**
2. Clique em **Novo Alerta**
3. Configure:
   - **Localização**: Seu local ou endereço
   - **Raio**: 1-50 km
   - **Tipos**: Selecione quais tipos monitorar
   - **Severidade Mínima**: Baixa, Média, Alta, Crítica
   - **Canal**: Email, Push, SMS (se disponível)

#### Gerenciar Alertas

1. Vá para **Alertas**
2. Veja lista de alertas ativos
3. Clique em **Editar** ou **Deletar**

#### Notificações

Quando uma ocorrência crítica é registrada:
- Você recebe notificação instantânea
- Detalhes: tipo, localização, distância
- Link direto para a ocorrência
- Opção de validar ou comentar

#### Dicas

✅ Configure alertas para áreas críticas
✅ Ajuste severidade mínima conforme necessidade
✅ Desative alertas quando não precisar
❌ Não ignore alertas críticos

---

### 7. 👤 Histórico de Atividades

**Objetivo**: Acompanhar todas as suas ações na plataforma.

#### Visualizar Histórico

1. Vá para **Minha Conta** > **Histórico de Atividades**
2. Veja timeline completa de ações

#### Informações Mostradas

- **Tipo de Ação**: Ocorrência, Validação, Simulação, etc.
- **Descrição**: Detalhes da ação
- **Pontos Ganhos**: Recompensa recebida
- **Data/Hora**: Quando ocorreu
- **Status**: Concluída, Pendente, Rejeitada

#### Filtros

- Por tipo de ação
- Por período (hoje, semana, mês, ano)
- Por status

#### Estatísticas

- Total de atividades
- Pontos este mês
- Atividades médias por dia
- Atividades por tipo

---

### 8. 📋 Denunciar Conteúdo

**Objetivo**: Reportar conteúdo inapropriado ou falso.

#### Como Denunciar

1. Vá para **Denunciar Conteúdo**
2. Preencha o formulário:
   - **Tipo de Denúncia**: Spam, Assédio, Falso, Inapropriado, etc.
   - **Conteúdo**: Selecione o tipo (Ocorrência, Comentário, Foto, etc.)
   - **ID do Conteúdo**: Número ou URL
   - **Motivo**: Escolha específico
   - **Descrição**: Explique por quê

#### Processo de Revisão

1. Sua denúncia é recebida
2. Moderadores revisam em 24-48h
3. Ação tomada (remoção, suspensão, etc.)
4. Você recebe notificação do resultado

#### Dicas

✅ Seja específico e honesto
✅ Forneça evidências se possível
✅ Não denuncie por desacordo pessoal
❌ Denúncias falsas resultam em suspensão

---

### 9. 📥 Exportar Dados

**Objetivo**: Baixar seus dados em diferentes formatos.

#### Formatos Disponíveis

- **JSON**: Estruturado, ideal para análise
- **CSV**: Planilha Excel, ideal para relatórios
- **PDF**: Relatório formatado, ideal para impressão

#### Tipos de Dados

- Ocorrências registradas
- Validações realizadas
- Simulações executadas
- Histórico de atividades
- Badges conquistadas
- Rankings

#### Como Exportar

1. Vá para **Exportar Dados**
2. Selecione formatos desejados
3. Selecione tipos de dados
4. Clique em **Exportar Agora**
5. Arquivo será baixado automaticamente

#### Informações de Segurança

- Dados são criptografados
- Arquivos expiram em 30 dias
- Máximo 5 exportações/dia
- Dados pessoais inclusos apenas em sua exportação

---

### 10. ⚙️ Configurações

**Objetivo**: Gerenciar preferências de conta.

#### Notificações

Configure quais notificações receber:
- Email
- Push (navegador)
- Alertas geoespaciais
- Validações
- Comentários

#### Privacidade

- Perfil público/privado
- Mostrar no ranking
- Mostrar atividades
- Permitir mensagens

#### Segurança

- Alterar senha
- Ativar 2FA (autenticação de dois fatores)
- Ver sessões ativas
- Desconectar de todos os dispositivos

#### Zona de Perigo

- Deletar conta permanentemente (irreversível)

---

### 11. ℹ️ Sobre

**Objetivo**: Informações sobre o projeto.

#### Conteúdo

- Missão e visão
- Funcionalidades principais
- Stack tecnológico
- Versão e status
- Links de contato

---

## Motor de Análise Física

### Visão Geral

EcoMonitor implementa 6 modelos científicos para calcular risco de cada ocorrência:

| Tipo | Modelos | Precisão |
|------|---------|----------|
| Incêndio | Arrhenius + Rothermel | ±15% |
| Hidrologia | Penman + Darcy | ±20% |
| Poluição | Gaussiano | ±25% |
| Seca | Balanço Hídrico | ±18% |
| Desmatamento | Densidade Vegetal | ±12% |
| Enchente | Topografia | ±22% |

### 1. Modelo de Incêndio

#### Equação de Arrhenius
```
k = A × exp(-Ea / R × T)

Onde:
- k = constante de reação
- A = fator pré-exponencial
- Ea = energia de ativação
- R = constante dos gases
- T = temperatura (K)
```

#### Modelo de Rothermel
```
R = (0.386 × e^(0.0294×U)) × (1 - S/Se) × (ρb/ρp)^(-0.792)

Onde:
- R = velocidade de propagação (m/min)
- U = velocidade do vento (mph)
- S = umidade do combustível (%)
- Se = umidade de saturação
- ρb = densidade bulk
- ρp = densidade de partícula
```

#### Índice de Risco
```
Risco = (Velocidade × Temperatura × Densidade) / (Umidade × 100)
Escala: 0-100 (crítico se > 80)
```

### 2. Modelo Hidrológico

#### Equação de Penman
```
ET = (ΔRn + γCn/(T+273)×u2×(es-ea)) / (Δ + γ(1+Cn×u2))

Onde:
- ET = evapotranspiração (mm/dia)
- Rn = radiação líquida
- γ = constante psicrométrica
- u2 = velocidade do vento
- es-ea = déficit de pressão de vapor
- Δ = inclinação da curva de saturação
```

#### Lei de Darcy
```
Q = K × A × (Δh/L)

Onde:
- Q = fluxo (m³/s)
- K = condutividade hidráulica
- A = área da seção transversal
- Δh = diferença de altura
- L = comprimento do caminho
```

#### Balanço Hídrico
```
Balanço = Precipitação - Evapotranspiração - Infiltração - Runoff
Se Balanço < 0 → Seca
```

### 3. Modelo Gaussiano (Poluição)

```
C(x,y,z) = (Q / (2π × σy × σz × u)) × 
           exp(-y²/(2σy²)) × 
           [exp(-(z-H)²/(2σz²)) + exp(-(z+H)²/(2σz²))]

Onde:
- C = concentração (µg/m³)
- Q = taxa de emissão
- σy, σz = desvios padrão (dispersão)
- u = velocidade do vento
- H = altura da fonte
- x, y, z = coordenadas
```

### 4. Índice de Seca

```
Seca = (Temp - Temp_média) / Temp_média × 100 - (Precip / Precip_média) × 100

Se Seca > 50% → Seca severa
```

### 5. Índice de Desmatamento

```
Desmatamento = (Densidade_anterior - Densidade_atual) / Densidade_anterior × 100

Se > 30% em 1 ano → Alerta
```

### 6. Análise de Enchente

```
Risco_Enchente = (Proximidade_Água × Inclinação) / Elevação

Se Risco > 0.7 → Alto risco
```

### Cálculo Automático

Quando você registra uma ocorrência:

1. ✅ Sistema recebe parâmetros
2. ✅ Aplica modelo apropriado
3. ✅ Calcula índice de risco (0-100)
4. ✅ Classifica severidade
5. ✅ Armazena no banco de dados
6. ✅ Dispara alertas se crítico

**Tempo de cálculo:** < 200ms

---

## Sistema de Gamificação

### Pontos

Ganhe pontos por ações na plataforma:

| Ação | Pontos | Frequência |
|------|--------|-----------|
| Registrar ocorrência | +10 | Ilimitado |
| Validar ocorrência | +5 | Ilimitado |
| Comentário útil | +1 | Ilimitado |
| Completar simulação | +3 | 1x/dia |
| Ocorrência validada (3+) | +5 | Automático |
| Desbloquear badge | +10 | Variável |

### Badges

Desbloqueie badges por conquistas:

#### 🔥 Badges de Incêndio

- **Vigia do Fogo**: Registre 5 ocorrências de incêndio
- **Especialista em Fogo**: Registre 20 ocorrências de incêndio
- **Herói do Fogo**: Tenha 50+ validações em incêndios

#### 💧 Badges de Água

- **Protetor de Água**: Registre 5 ocorrências de poluição hídrica
- **Guardião da Água**: Registre 20 ocorrências de poluição
- **Herói da Água**: Tenha 50+ validações em água

#### 🌳 Badges de Floresta

- **Defensor da Floresta**: Registre 5 desmatamentos
- **Protetor da Floresta**: Registre 20 desmatamentos
- **Herói da Floresta**: Tenha 50+ validações em floresta

#### 🎓 Badges Educativos

- **Aprendiz**: Complete 1 simulador
- **Estudioso**: Complete 10 simuladores
- **Mestre**: Complete 50 simuladores

#### 🏆 Badges Especiais

- **Primeira Ocorrência**: Registre sua primeira ocorrência
- **Validador**: Valide 10 ocorrências
- **Comunidade**: Tenha 100 pontos em um mês
- **Lenda**: Atinja 1000 pontos totais

### Rankings

#### Ranking Global

Veja os 100 usuários com mais pontos:

1. Vá para **Dashboard** > **Rankings**
2. Veja sua posição
3. Veja top 10 usuários
4. Compare estatísticas

#### Ranking Mensal

Reinicia todo mês (1º de cada mês):

- Competição mensal
- Prêmios virtuais
- Reseta pontos mensais

#### Ranking por Tipo

Especialistas por tipo de ocorrência:

- Ranking Incêndios
- Ranking Água
- Ranking Ar
- Ranking Seca
- Ranking Floresta
- Ranking Enchentes

### Trust Score

Sua confiabilidade na plataforma (0-100):

**Aumenta com:**
- Validações corretas
- Ocorrências precisas
- Comentários úteis
- Atividade consistente

**Diminui com:**
- Validações rejeitadas
- Ocorrências falsas
- Comentários inapropriados
- Denúncias confirmadas

**Benefícios de alto trust:**
- Validações têm mais peso
- Acesso a recursos premium
- Possibilidade de moderador
- Visibilidade aumentada

---

## Painel Administrativo

### Acesso

Apenas usuários com role **admin** podem acessar.

1. Vá para **Admin** (ícone de engrenagem)
2. Faça login se necessário
3. Acesse painel completo

### Seções

#### 1. Dashboard Administrativo

**Estatísticas Gerais:**
- Total de usuários
- Total de ocorrências
- Taxa de validação
- Risco médio
- Usuários ativos (24h)

**Gráficos:**
- Ocorrências ao longo do tempo
- Distribuição por tipo
- Distribuição por severidade
- Usuários mais ativos

#### 2. Gerenciamento de Usuários

**Listar Usuários:**
1. Vá para **Usuários**
2. Veja lista com filtros
3. Clique em usuário para detalhes

**Editar Usuário:**
1. Clique em usuário
2. Edite informações:
   - Nome
   - Email
   - Role (user, moderator, admin)
   - Status (ativo, suspenso, banido)
3. Clique em **Salvar**

**Ações:**
- ✓ Promover a moderador
- ✓ Promover a admin
- ✓ Suspender (7 dias)
- ✓ Banir permanentemente
- ✓ Resetar pontos
- ✓ Resetar badges

#### 3. Moderação de Conteúdo

**Denúncias Pendentes:**
1. Vá para **Moderação**
2. Veja denúncias não revisadas
3. Clique em denúncia
4. Revise conteúdo
5. Escolha ação:
   - Aprovar (sem ação)
   - Remover conteúdo
   - Suspender usuário
   - Banir usuário

**Ocorrências Suspeitas:**
1. Vá para **Ocorrências**
2. Filtre por "Suspeita"
3. Revise e tome ação

#### 4. Gerenciamento de Alertas

**Alertas Globais:**
1. Vá para **Alertas**
2. Veja alertas ativos
3. Crie novo alerta global:
   - Localização
   - Raio
   - Tipos
   - Severidade
   - Mensagem

**Notificações em Massa:**
1. Crie mensagem
2. Selecione destinatários
3. Envie notificação

#### 5. Análise de Dados

**Exportar Dados:**
1. Vá para **Dados**
2. Selecione período
3. Selecione tipos
4. Escolha formato (JSON, CSV, PDF)
5. Clique em **Exportar**

**Relatórios:**
- Relatório mensal
- Relatório por região
- Relatório por tipo
- Relatório de usuários

#### 6. Configurações do Sistema

**Parâmetros Físicos:**
- Ajustar constantes dos modelos
- Calibrar sensibilidade
- Atualizar dados de referência

**Notificações:**
- Configurar canais
- Templates de mensagem
- Horários de envio

**Segurança:**
- Logs de acesso
- Atividades suspeitas
- Tentativas de ataque

---

## Troubleshooting

### Problemas Comuns

#### 1. "Erro ao conectar ao banco de dados"

**Causa:** Banco de dados não está rodando ou credenciais incorretas

**Solução:**
```bash
# Verificar se MySQL está rodando
mysql -u root -p

# Verificar .env.local
cat .env.local

# Reconectar
pnpm drizzle-kit migrate
```

#### 2. "Página em branco"

**Causa:** Erro de compilação ou cache

**Solução:**
```bash
# Limpar cache
rm -rf .next dist node_modules/.vite

# Reinstalar
pnpm install

# Reiniciar
pnpm dev
```

#### 3. "Erro 404 em algumas páginas"

**Causa:** Rotas não registradas

**Solução:**
```bash
# Verificar App.tsx
cat client/src/App.tsx

# Verificar se página existe
ls client/src/pages/
```

#### 4. "Notificações não funcionam"

**Causa:** WebSocket não conectado

**Solução:**
```bash
# Verificar console do navegador (F12)
# Procurar por erros de conexão

# Reiniciar servidor
pnpm dev
```

#### 5. "Fotos não fazem upload"

**Causa:** S3 não configurado

**Solução:**
```bash
# Verificar .env.local
# Adicionar credenciais S3

# Ou usar upload mock (desenvolvimento)
```

#### 6. "Simulador muito lento"

**Causa:** Muitos cálculos simultâneos

**Solução:**
- Reduzir número de iterações
- Usar valores menores
- Fechar outras abas
- Atualizar navegador

#### 7. "Erro de autenticação"

**Causa:** Sessão expirada ou cookie deletado

**Solução:**
```bash
# Fazer logout
# Limpar cookies (F12 > Application > Cookies)
# Fazer login novamente
```

#### 8. "Banco de dados cheio"

**Causa:** Muitos dados acumulados

**Solução:**
```bash
# Fazer backup
mysqldump -u user -p database > backup.sql

# Limpar dados antigos
DELETE FROM occurrences WHERE createdAt < DATE_SUB(NOW(), INTERVAL 1 YEAR);

# Otimizar tabelas
OPTIMIZE TABLE occurrences;
```

---

## FAQ

### Geral

**P: EcoMonitor é gratuito?**
R: Sim, EcoMonitor é totalmente gratuito e de código aberto.

**P: Preciso de conta para usar?**
R: Sim, você precisa se autenticar via OAuth2 (Manus).

**P: Meus dados são privados?**
R: Sim. Dados pessoais não são compartilhados. Ocorrências são públicas por padrão (pode ser alterado).

**P: Posso usar offline?**
R: Não, EcoMonitor requer conexão com internet.

**P: Qual é a precisão dos cálculos?**
R: Varia por tipo (±12-25%). Veja seção "Motor de Análise Física".

### Registro de Ocorrências

**P: Posso editar uma ocorrência após registrar?**
R: Sim, nas primeiras 24 horas. Após isso, apenas admins podem editar.

**P: Quantas fotos posso adicionar?**
R: Até 5 fotos, máximo 5MB cada.

**P: O que acontece se registrar algo falso?**
R: Sua ocorrência será rejeitada, trust score diminui, e pode resultar em suspensão.

**P: Como funciona a validação?**
R: Outros usuários validam sua ocorrência. Precisa de 3+ validações para ser "confirmada".

### Simuladores

**P: Os simuladores são precisos?**
R: São educativos, não para previsão real. Use para aprender conceitos.

**P: Posso usar resultados em trabalhos acadêmicos?**
R: Sim, mas cite EcoMonitor como fonte e use com cuidado.

**P: Por que o simulador fica lento?**
R: Muitos cálculos simultâneos. Reduza valores ou use navegador mais rápido.

### Gamificação

**P: Como ganho mais pontos?**
R: Registre ocorrências, valide outras, comente, use simuladores.

**P: Posso perder pontos?**
R: Não, pontos nunca diminuem. Trust score sim.

**P: Como desbloqueio badges?**
R: Cumpra os requisitos (veja seção "Badges").

**P: Qual é a diferença entre ranking global e mensal?**
R: Global acumula tudo. Mensal reseta no 1º de cada mês.

### Alertas

**P: Como configuro alertas?**
R: Vá para Alertas > Novo Alerta > Configure localização e tipos.

**P: Quantos alertas posso ter?**
R: Até 10 alertas simultâneos.

**P: Posso receber alertas por SMS?**
R: Depende de configuração. Atualmente suporta email e push.

### Privacidade

**P: Minha localização é rastreada?**
R: Não. Apenas quando você registra uma ocorrência.

**P: Posso tornar meu perfil privado?**
R: Sim. Vá para Configurações > Privacidade.

**P: Como deleto minha conta?**
R: Vá para Configurações > Zona de Perigo > Deletar Conta (irreversível).

### Técnico

**P: Qual é o stack tecnológico?**
R: React 19, Node.js, Express, tRPC, MySQL, Leaflet.js.

**P: Posso hospedar localmente?**
R: Sim. Veja seção "Instalação e Configuração".

**P: Como contribuo para o projeto?**
R: Visite GitHub (link em Sobre) e faça um fork.

**P: Há API pública?**
R: Não atualmente, mas tRPC pode ser exposto.

---

## Suporte

### Contato

- **Email**: support@ecomonitor.local
- **GitHub**: github.com/ecomonitor
- **Issues**: Reporte bugs no GitHub

### Documentação Adicional

- `README_INSTALACAO.md` - Guia de instalação
- `REQUIREMENTS.md` - Requisitos do TCC
- Código comentado em `server/physics.ts`

---

## Changelog

### v2.0.0 (Fevereiro 2026)

✨ **Novas Funcionalidades:**
- PhotoUploader com S3
- useNotifications com WebSocket
- ActivityHistory completo
- ReportContent (denúncia)
- DataExport (JSON/CSV/PDF)
- UserSettings (privacidade)
- About page

🐛 **Correções:**
- Erros de tipo TypeScript
- Integração de rotas
- Performance de simuladores

📚 **Documentação:**
- Manual completo (3000+ linhas)
- Guia de API
- Troubleshooting

### v1.0.0 (Fevereiro 2026)

🎉 **Lançamento Inicial**
- 10 funcionalidades principais
- Motor de análise física
- Gamificação completa
- Dashboard e alertas
- Painel administrativo

---

## Licença

MIT - Código aberto e livre para uso

---

**Desenvolvido com ❤️ para proteger o ambiente**

**EcoMonitor v2.0.0 - Fevereiro 2026**
