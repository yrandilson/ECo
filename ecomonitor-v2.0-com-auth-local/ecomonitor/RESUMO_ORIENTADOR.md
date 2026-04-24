# RESUMO DO PROJETO PARA O ORIENTADOR

## EcoMonitor — Plataforma de Monitoramento Ambiental com Modelos Físicos

**Aluno:** [Seu Nome]  
**Curso:** Sistemas de Informação  
**Orientador:** [Nome do Professor]  
**Área do Orientador:** Física  

---

## 1. Origem da Proposta

A proposta inicial era desenvolver um **simulador de física** para uso educacional, alinhando a área do orientador (Física) com o curso de Sistemas de Informação. 

A ideia evoluiu para algo mais ambicioso: uma **plataforma web completa de monitoramento ambiental** que aplica **modelos físicos e matemáticos reais** no cálculo de riscos ambientais, combinando três pilares:

| Pilar | Descrição | Conexão |
|-------|-----------|---------|
| **Sistemas de Informação** | Arquitetura web fullstack, banco de dados, API REST, autenticação, dashboard | Curso do aluno |
| **Física Aplicada** | 6 modelos científicos de cálculo de risco + simuladores interativos | Área do orientador |
| **Machine Learning** | 3 algoritmos preditivos (regressão, random forest, rede neural) | Interseção das áreas |

---

## 2. Onde a Física Aparece no Projeto

### 2.1 Motor de Física (`server/physics.ts` — 221 linhas)

O arquivo `physics.ts` implementa **6 modelos físicos científicos** que calculam o risco de cada tipo de ocorrência ambiental:

#### a) Modelo de Propagação de Incêndio (Arrhenius + Rothermel)
- **Equação de Arrhenius** para taxa de combustão:  
  $k = A \cdot e^{-E_a / (R \cdot T)}$  
  Onde $E_a$ = 50.000 J/mol (energia de ativação), $R$ = 8,314 J/(mol·K), $T$ em Kelvin
- **Fator de vento de Rothermel**: $W_f = 1 + 0.1 \cdot v_{vento}$
- **Parâmetros:** temperatura (°C), umidade (%), velocidade do vento (km/h), tipo de vegetação
- **Saída:** score de risco 0-100

#### b) Modelo Hidrológico (Penman + Darcy)
- **Equação de evaporação de Penman** para disponibilidade hídrica
- Correlação entre nível da água, cor (indicador de poluição) e fatores climáticos
- **Detecção de bloom algal** (cor verde = alta contaminação)

#### c) Modelo de Dispersão Atmosférica (Pluma Gaussiana)
- Modelo de **dispersão gaussiana** para poluição do ar
- Fator de dispersão baseado na velocidade do vento
- Combinação qualidade do ar × visibilidade × dispersão

#### d) Modelo de Risco de Seca
- Normalização de estresse térmico acima de 25°C
- Déficit de umidade e fator de precipitação
- Pesos ponderados: temperatura (30%), umidade (40%), precipitação (30%)

#### e) Modelo de Desmatamento
- Correlação entre densidade de vegetação e acessibilidade
- Fator de risco inversamente proporcional à cobertura vegetal

#### f) Modelo de Inundação
- Baseado em **elevação**, **proximidade a corpos d'água** e **declividade do terreno**
- Terrenos planos e baixos próximos a rios = maior risco

### 2.2 Preditor de Machine Learning (`server/ml-predictor.ts` — 551 linhas)

Implementa **3 algoritmos de aprendizado de máquina** para previsão de risco de incêndio:

| Algoritmo | Técnica | Linhas |
|-----------|---------|--------|
| **Regressão Linear** | Gradient descent com taxa de aprendizado 0.01 | ~40 |
| **Random Forest** | Ensemble de 5 árvores de decisão com bootstrap sampling | ~120 |
| **Rede Neural** | 1 camada oculta (8 neurônios), ativação ReLU, backpropagation | ~100 |

- **Entrada:** histórico de temperatura, umidade, vento, precipitação, densidade de vegetação, elevação
- **Saída:** previsão de risco para 1-7 dias à frente com intervalo de confiança
- **Ensemble:** média ponderada dos 3 modelos (pesos: 0.2, 0.35, 0.45)

### 2.3 Simuladores Interativos no Frontend (3 simuladores)

| Simulador | Arquivo | Parâmetros Físicos |
|-----------|---------|-------------------|
| **Incêndio** | `Simulators.tsx` (701 linhas) | Temperatura, umidade, vento. Cenários otimista/realista/pessimista. Visualização animada de propagação do fogo |
| **Qualidade da Água** | `WaterQualitySimulator.tsx` (401 linhas) | DBO (mg/L), pH, turbidez (NTU), metais pesados (mg/L), temperatura. Cálculo do IQA (Índice de Qualidade da Água) |
| **Desmatamento** | `DeforestationSimulator.tsx` (397 linhas) | Taxa de desmatamento (ha/ano), tipo de vegetação (floresta/cerrado/caatinga), pressão antrópica, conectividade de áreas protegidas. Calcula CO₂ equivalente |

### 2.4 Visualização Animada de Fenômenos (`AnimatedVisualization.tsx`)
- Simulação visual da **propagação de fogo** com partículas
- Controle de velocidade de propagação (0.1x a 3x)
- Representação visual de fenômenos físicos em tempo real

### 2.5 Validação Satelital (NASA FIRMS)
- Integração com dados de satélite da NASA para **validar incêndios** reportados
- Compara coordenadas do reporte com detecções de calor por satélite
- Correlação entre dados de campo e dados orbitais

---

## 3. Arquitetura Técnica (Sistemas de Informação)

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│  React 19 + TypeScript + Tailwind + Leaflet.js  │
│  Simuladores · Dashboard · Mapa · Chatbot IA    │
├─────────────────────────────────────────────────┤
│                   BACKEND                        │
│  Express + tRPC + JWT + Rate Limiting           │
│  Motor de Física · ML Predictor · Logger        │
├─────────────────────────────────────────────────┤
│                BANCO DE DADOS                    │
│  MySQL 8 + Drizzle ORM                          │
│  9 tabelas com foreign keys                     │
├─────────────────────────────────────────────────┤
│              SERVIÇOS EXTERNOS                   │
│  NASA FIRMS · OpenWeatherMap · OpenAI           │
└─────────────────────────────────────────────────┘
```

**Stack completa:**
- Frontend: React 19, TypeScript 5.9, Vite 7, Tailwind CSS, Recharts, Leaflet.js
- Backend: Node.js, Express, tRPC 11, Zod 4
- Banco: MySQL 8 com Drizzle ORM (9 tabelas, chaves estrangeiras)
- Segurança: JWT, bcrypt, rate limiting, validação de senha forte
- Integrações: NASA FIRMS (satélite), OpenWeatherMap (clima), OpenAI (chatbot)

---

## 4. O Que Mais Pode Ser Incluído (Física)

Estas são expansões possíveis para fortalecer ainda mais a componente de física:

### 4.1 Novos Simuladores
| Simulador | Modelo Físico | Complexidade |
|-----------|--------------|-------------|
| **Dispersão de poluentes em rios** | Equação de advecção-difusão: $\frac{\partial C}{\partial t} = D\frac{\partial^2 C}{\partial x^2} - v\frac{\partial C}{\partial x}$ | Média |
| **Efeito estufa** | Balanço radiativo de Stefan-Boltzmann: $P = \sigma T^4$ | Média |
| **Erosão do solo** | Equação Universal de Perda de Solo (USLE): $A = R \cdot K \cdot LS \cdot C \cdot P$ | Média |
| **Propagação de ondas sonoras** | Atenuação sonora por distância: $I = \frac{P}{4\pi r^2}$ | Baixa |

### 4.2 Melhorias nos Modelos Existentes
- **Rothermel completo**: implementar o modelo completo de propagação de incêndio com topografia
- **Navier-Stokes simplificado**: para simulação de dispersão de fumaça
- **Modelo de evapotranspiração de Penman-Monteith**: versão completa para recursos hídricos
- **Radiação térmica**: cálculo da distância segura em incêndios usando $q'' = \epsilon \sigma T^4$

### 4.3 Visualizações Físicas
- **Mapas de calor** com gradients de temperatura
- **Vetores de vento** sobre o mapa com setas direcionais
- **Isóbaras e isotermas** sobre a visualização geográfica
- **Animação 2D de propagação de fogo** em grid celular (autômato celular)

### 4.4 Integração de Dados Reais
- **Estações meteorológicas do INMET** — dados reais de temperatura, vento e umidade
- **Dados de queimadas do INPE** — complementar NASA FIRMS com dados brasileiros
- **Índice UV** — modelo de radiação solar para alertas de saúde

---

## 5. Impacto Social e Ambiental

### 5.1 Problema que o Projeto Resolve

O Brasil registrou **68.635 focos de queimada em 2024** (INPE) e milhares de ocorrências de poluição hídrica, desmatamento ilegal e inundações que afetam comunidades inteiras. Hoje, a população **não tem uma ferramenta acessível** para:

- Reportar ocorrências ambientais de forma geolocalizada
- Receber alertas de risco na sua região baseados em dados científicos
- Entender os fenômenos físicos por trás dos desastres que presencia
- Validar suas observações com dados de satélite

O EcoMonitor resolve esses problemas criando um **canal direto entre cidadão e ciência**.

### 5.2 Impacto Direto

| Área de Impacto | Como o EcoMonitor Contribui |
|-----------------|---------------------------|
| **Prevenção de desastres** | Alertas baseados em modelos físicos avisam a população antes que o risco se torne crítico |
| **Educação ambiental** | Simuladores interativos ensinam conceitos de física (termodinâmica, hidrologia, dispersão) de forma visual e prática |
| **Ciência cidadã** | Qualquer pessoa pode reportar ocorrências, criando um banco de dados ambiental colaborativo |
| **Tomada de decisão** | Dashboard com dados cruzados (satélite + clima + reportes) auxilia órgãos ambientais e defesa civil |
| **Democratização da informação** | Dados que antes ficavam restritos a satélites e estações meteorológicas ficam acessíveis pelo celular |

### 5.3 Público-Alvo

1. **Cidadãos comuns** — reportam e recebem alertas sobre riscos na sua região
2. **Educadores e estudantes** — usam os simuladores como ferramenta pedagógica de física
3. **Órgãos ambientais (IBAMA, secretarias)** — consultam ocorrências validadas por satélite
4. **Defesa civil** — recebem alertas em tempo real de zonas críticas
5. **Pesquisadores** — exportam dados para análises acadêmicas

---

## 6. Diferenciais do Projeto

### 6.1 Comparação com Soluções Existentes

| Funcionalidade | EcoMonitor | Google Maps | INPE TerraBrasilis | iNaturalist |
|---------------|------------|-------------|--------------------|--------------------|
| Reporte de ocorrências ambientais | ✅ | ❌ | ❌ | ✅ (só fauna/flora) |
| Modelos físicos de cálculo de risco | ✅ 6 modelos | ❌ | ❌ | ❌ |
| Simuladores educativos interativos | ✅ 3 simuladores | ❌ | ❌ | ❌ |
| ML para previsão de risco | ✅ 3 algoritmos | ❌ | ❌ | ❌ |
| Validação por satélite (NASA) | ✅ | ❌ | ✅ (apenas consulta) | ❌ |
| Gamificação para engajamento | ✅ | ❌ | ❌ | ✅ |
| Chatbot IA educativo | ✅ | ❌ | ❌ | ❌ |
| Open source e gratuito | ✅ | ❌ | ✅ | ✅ |

### 6.2 O Que Torna Único

1. **Ciência acessível**: transforma equações de Arrhenius, Rothermel e Penman em sliders que qualquer pessoa entende
2. **Validação cruzada**: reporte do cidadão é confrontado com dados NASA FIRMS + OpenWeatherMap automaticamente
3. **Predição com ML**: não apenas mostra o presente, mas prevê riscos para os próximos 7 dias
4. **Gamificação educativa**: o sistema de pontos e badges transforma aprendizado de física em jogo
5. **Interdisciplinar de verdade**: une Sistemas de Informação (arquitetura, banco, segurança) com Física (modelos, simulações, equações)

---

## 7. Integrações Futuras com IA

O projeto já possui uma base de IA (chatbot + ML preditivo). As evoluções planejadas ampliam significativamente esse pilar:

### 7.1 Curto Prazo (próximos meses)

| Integração | Descrição | Tecnologia |
|-----------|-----------|------------|
| **Classificação de imagens por IA** | Fotos enviadas pelo usuário são analisadas automaticamente para detectar fogo, poluição ou desmatamento | TensorFlow.js / Modelo YOLO via API |
| **Chatbot contextual avançado** | EcoBot responde com dados reais da região do usuário (temperatura atual, alertas ativos, ocorrências próximas) | OpenAI GPT + function calling |
| **Resumo de ocorrências por IA** | IA gera relatórios textuais automáticos sobre a situação ambiental de uma região | GPT-4 com context injection |

### 7.2 Médio Prazo (6-12 meses)

| Integração | Descrição | Tecnologia |
|-----------|-----------|------------|
| **Detecção automática de anomalias** | IA analisa padrões de dados meteorológicos e de ocorrências para detectar eventos anormais antes que virem reportes | Isolation Forest / Autoencoders |
| **Predição de série temporal com LSTM** | Substituir modelo Random Forest por rede LSTM para previsão temporal de risco de incêndio | TensorFlow / PyTorch via API Python |
| **NLP para triagem de reportes** | IA classifica automaticamente a severidade e tipo de ocorrência baseado na descrição textual do usuário | Transformers (BERT/RoBERTa) |
| **Assistente de campo** | IA guia o usuário no local, sugerindo fotos, parâmetros e ações baseado no tipo de ocorrência detectada | GPT-4 Vision + geolocalização |

### 7.3 Longo Prazo (futuro)

| Integração | Descrição | Tecnologia |
|-----------|-----------|------------|
| **Análise de imagens de satélite com IA** | Processar automaticamente imagens Sentinel-2/Landsat para detectar desmatamento e queimadas | CNN / U-Net segmentação |
| **Digital twin ambiental** | Modelo IA que simula o ecossistema completo de uma região com base em dados históricos | Physics-Informed Neural Networks (PINN) |
| **Agente autônomo de monitoramento** | IA que cruza dados de múltiplas fontes (satélite, clima, reportes) para gerar alertas proativos 24/7 | LangChain / AutoGPT agents |

### 7.4 Como a IA Fortalece a Ponte Física ↔ Sistemas de Informação

```
                    IA COMO ELO
                        │
       ┌────────────────┼────────────────┐
       │                │                │
   FÍSICA           IA/ML          SISTEMAS
   Modelos      Aprende dos         Coleta,
   Científicos  dados e melhora     armazena e
   (Arrhenius,  os modelos          distribui
   Rothermel,   automaticamente     dados
   Penman...)                    
       │                │                │
       └────────>  PREDIÇÃO  <───────────┘
                 Mais Precisa
```

A IA age como **camada de inteligência** entre os modelos físicos (que são determinísticos) e os dados do sistema (que são empíricos). Quanto mais dados o EcoMonitor coleta, mais a IA aprende, e melhores ficam as previsões — criando um **ciclo virtuoso** de melhoria contínua.

---

## 8. Justificativa Interdisciplinar

| Aspecto | Sistemas de Informação | Física | IA (futuro) |
|---------|----------------------|--------|-------------|
| **Banco de dados** | 9 tabelas MySQL com ORM | Armazena parâmetros e resultados físicos | Dados de treino dos modelos |
| **API REST** | tRPC com tipagem end-to-end | Expõe cálculos de risco como endpoints | Endpoints de classificação e predição |
| **Frontend** | React com componentes reutilizáveis | Simuladores interativos com sliders | Visualização de predições |
| **Segurança** | JWT + rate limiting + bcrypt | — | Rate limiting para APIs de IA |
| **Modelos** | Código TypeScript otimizado | Arrhenius, Rothermel, Penman, Gauss, Darcy | Substituição gradual por ML/DL |
| **ML/IA** | Regressão, Random Forest, Rede Neural | Previsão de fenômenos físicos | LSTM, CNN, NLP, Vision |
| **Dados** | Integração com APIs externas | Satélite (NASA), clima (OpenWeather) | Treino de modelos com dados reais |
| **Gamificação** | Sistema de pontos e badges | Incentiva aprendizado de física ambiental | Recomendações personalizadas |
| **Chatbot** | Integração OpenAI | Educação sobre fenômenos físicos | Function calling + RAG contextual |

---

## 9. Métricas do Projeto

| Métrica | Valor |
|---------|-------|
| Linhas de código (total) | ~15.000+ |
| Modelos físicos implementados | 6 |
| Simuladores interativos | 3 (incêndio, água, desmatamento) + visualização animada |
| Algoritmos de ML | 3 (regressão linear, random forest, rede neural) |
| Tabelas no banco | 9 (users, occurrences, photos, validations, simulations, alerts, badges, rankings, content_reports) |
| Endpoints de API | 25+ |
| Integrações externas | 3 (NASA FIRMS, OpenWeatherMap, OpenAI) |
| Integrações de IA planejadas | 9 (classificação de imagem, LSTM, NLP, anomalia, assistente, vision, PINN, agentes) |
| Páginas do frontend | 20 |

---

## 10. Conclusão

O EcoMonitor não é apenas um simulador de física — é uma **plataforma completa de Sistemas de Informação** que usa a **física como fundamento científico** para cálculo de riscos ambientais, e a **Inteligência Artificial como camada de evolução** para melhorar continuamente a precisão das previsões.

O projeto demonstra que as três áreas se potencializam:
- A **Física** fornece os modelos matemáticos validados pela ciência
- **Sistemas de Informação** fornece a infraestrutura para torná-los acessíveis e escaláveis
- A **IA** aprende com os dados coletados e melhora os modelos ao longo do tempo

A proposta original de "simulador de física para o professor" foi expandida para algo com **impacto social real**: uma ferramenta que qualquer cidadão pode usar para reportar, monitorar e entender riscos ambientais na sua região. Com as integrações futuras de IA, o EcoMonitor se tornará uma plataforma de **monitoramento ambiental inteligente e autônomo**, capaz de prever desastres antes que aconteçam.

**O diferencial para o TCC:** é um projeto que resolve um problema real (monitoramento ambiental no Brasil), usa fundamentos científicos (modelos físicos), aplica tecnologia de ponta (full-stack + ML + IA), e tem um roadmap claro de evolução — indo muito além de um trabalho acadêmico comum.
