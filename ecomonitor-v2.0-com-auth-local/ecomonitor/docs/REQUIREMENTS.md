# EcoMonitor - Requisitos do Sistema

## Visão Geral
Sistema colaborativo de monitoramento ambiental que integra coleta de dados físicos, análise inteligente de riscos e simuladores educativos interativos.

## Stack Tecnológico (Do TCC)
- **Frontend**: React 18 + Leaflet.js (mapas) + Chart.js (gráficos)
- **Backend**: Python Flask → Adaptado para Node.js/Express
- **Física**: NumPy, SciPy (cálculos numéricos)
- **Banco de Dados**: PostgreSQL + PostGIS → MySQL (Manus)
- **Cache**: Redis (performance)
- **Deploy**: Docker

## Módulos Principais

### 1. Cadastro Colaborativo
- Formulário intuitivo com campos dinâmicos por tipo
- 7 tipos de ocorrências: incêndio, água, ar, seca, desmatamento, poluição, outros
- Upload de até 5 fotos
- Geolocalização automática GPS ou seleção no mapa
- Parâmetros físicos por tipo:
  - **Incêndio**: temperatura (15-45°C), umidade (10-90%), vento (0-60 km/h), vegetação
  - **Água**: nível, cor, odor, espuma
  - **Ar**: qualidade percebida, visibilidade, odor

### 2. Análise Física Automatizada
- **Propagação de Incêndio**: Equação de Arrhenius + Modelo de Rothermel
- **Hidrologia**: Equação de Penman (evaporação) + Darcy (infiltração) + Torricelli (vazão)
- **Dispersão de Poluentes**: Modelo Gaussiano de Pluma
- Cálculo de risco em < 200ms

### 3. Simuladores Educativos
- Simulador de Incêndio: sliders de temperatura/umidade/vento → visualização 2D
- Simulador Hidrológico: balanço hídrico anual (365 dias)
- Simulador de Poluição: mapa de concentração 2D

### 4. Validação Híbrida
- Validação comunitária com sistema de pontuação
- Integração NASA FIRMS para validação automática de incêndios
- Taxa de concordância esperada: 85%

### 5. Sistema de Alertas
- Geofencing configurável
- Notificações push em tempo real
- 4 tipos de alerta: crítico, alto, médio, baixo
- Taxa de entrega: 98%

### 6. Dashboard Analítico
- Mapa interativo com 5 camadas filtráveis
- Gráficos temporais (Chart.js)
- Estatísticas agregadas
- Relatórios PDF exportáveis

### 7. Gamificação
- **Pontos**: cadastro (+10), validação (+5), satélite (+15), simulação (+3), primeiro do dia (+2)
- **Badges**: Vigia do Fogo, Guardião da Água, Verificador, Estudante, Estrela, Herói Ambiental
- **Ranking**: mensal e geral

## Métricas de Sucesso (Do TCC)
- 100+ usuários cadastrados
- 500+ ocorrências registradas
- 50+ ocorrências validadas por satélite
- 200+ simulações educativas
- 3+ parcerias (escolas, ONGs, prefeitura)
- SUS score: > 70
- Taxa de retorno: > 30%
- Engajamento: 40% com gamificação vs. 8% sem

## Dados de Teste (Do TCC)
- Total: 1.247 ocorrências
- Validadas: 892 (71%)
- Por satélite: 234 (19%)
- Críticas ativas: 12
- Usuários ativos: 358
- Simulações: 1.089

## Top 5 Áreas Críticas
1. Serra do Estevaio (18 focos)
2. Açude Cedro (15 focos)
3. BR-116 km 42 (12 focos)
4. Distrito Industrial (9 focos)
5. Fazenda Boa Vista (7 focos)
