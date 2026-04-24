# EcoMonitor — Roadmap de Melhorias para Prêmio Científico

> Salvo em: 03/03/2026 | Status: Pendente para implementação futura

---

## O que Estudar (Preparação para Defesa)

### Prioridade Alta
- [ ] **Modelo de Arrhenius** — equação de taxa de reação aplicada a propagação de incêndio
- [ ] **Pluma Gaussiana** — dispersão atmosférica de poluentes (fórmula + variáveis)
- [ ] **Equação de Penman** — evapotranspiração e risco hídrico
- [ ] **Conceitos de API REST e WebSocket** — saber explicar a arquitetura
- [ ] **React + TypeScript** — entender o fluxo de dados dos componentes

### Prioridade Média
- [ ] Machine Learning básico — regressão, classificação, o que é um modelo preditivo
- [ ] Geolocalização e sistemas de coordenadas (latitude/longitude)

---

## Melhorias para Implementar

### 1. Validação com Usuários Reais (Esforço: Baixo | Impacto: Altíssimo)
- Fazer 10-20 pessoas usarem a plataforma
- Aplicar questionário SUS (System Usability Scale)
- Apresentar resultados com gráficos
- **Por que:** Bancas e prêmios valorizam muito validação com usuários reais

### 2. Integração API do INPE — Queimadas Reais (Esforço: Médio | Impacto: Altíssimo)
- API: https://queimadas.dgi.inpe.br/queimadas/dados-abertos/
- Mostrar focos de incêndio reais no mapa junto com reportes dos usuários
- Integrar com OpenWeatherMap para dados meteorológicos em tempo real
- **Por que:** Transforma o projeto de "demo" em "ferramenta real"

### 3. Relatório PDF Automático (Esforço: Médio | Impacto: Alto)
- Botão "Gerar Relatório PDF" com dados de uma região
- Pode ser enviado para órgãos ambientais (IBAMA, Secretaria de Meio Ambiente)
- Biblioteca sugerida: jsPDF ou react-pdf
- **Por que:** Funcionalidade com impacto social direto — prêmios valorizam muito

### 4. Gamificação — Ranking e Badges (Esforço: Médio | Impacto: Alto)
- Ranking de usuários que mais reportam
- Badges/conquistas ("Guardião da Floresta", "Sentinela das Águas", "Eco Vigilante")
- Pontuação por qualidade do reporte (com foto = +pontos, com descrição detalhada = +pontos)
- **Por que:** Mostra preocupação com engajamento comunitário

### 5. PWA + Modo Offline (Esforço: Médio | Impacto: Alto)
- Tornar a plataforma instalável no celular (Progressive Web App)
- Service Worker para cache de assets
- Permitir reporte offline que sincroniza quando voltar a ter internet
- **Por que:** Argumento forte — "funciona em áreas rurais sem internet estável"

### 6. Machine Learning Preditivo (Esforço: Alto | Impacto: Altíssimo)
- Treinar modelo simples com Python + scikit-learn
- Prever risco com base nos dados coletados (regressão linear ou árvore de decisão)
- Gerar gráficos de predição no dashboard
- Alternativa mais simples: usar TensorFlow.js direto no frontend
- **Por que:** IA no tema do TCC precisa ter alguma implementação real

### 7. Comparação com Soluções Existentes (Esforço: Baixo | Impacto: Alto)
- Pesquisar e comparar com:
  - Google Fires (fires.google.com)
  - INPE BDQueimadas
  - EPA AirNow (EUA)
  - Plataforma Queimadas (INPE)
- Criar tabela comparativa mostrando diferenciais do EcoMonitor
- **Por que:** Mostra pesquisa bibliográfica e posicionamento do projeto

---

## Ordem Recomendada de Implementação

| # | Melhoria | Esforço | Impacto | Status |
|---|----------|---------|---------|--------|
| 1 | Validação com usuários (questionário SUS) | Baixo | Altíssimo | Pendente |
| 2 | Integração API do INPE (queimadas reais) | Médio | Altíssimo | Pendente |
| 3 | Relatório PDF automático | Médio | Alto | Pendente |
| 4 | Gamificação (ranking + badges) | Médio | Alto | Pendente |
| 5 | PWA (instalável no celular) | Médio | Alto | Pendente |
| 6 | ML preditivo simples | Alto | Altíssimo | Pendente |
| 7 | Comparação com soluções existentes (doc) | Baixo | Alto | Pendente |

---

## Ideias para o Futuro (Pós-TCC) — NÃO implementar agora

> Guardado para caso o projeto continue depois da defesa.

### Transformar em Rede Social Ambiental
- Perfil social (foto, bio, seguidores, reputação)
- Curtir, comentar e compartilhar reportes
- Seguir/ser seguido
- Comunidades por região ("Guardiões do Pantanal")
- Hashtags ambientais (#queimadaSP)
- Verificação comunitária (outros confirmam um reporte)
- Mensagens diretas
- Trending topics ambientais

**Nota:** O EcoMonitor já tem ~70% da base (login, feed, mapa, alertas). Faltaria a camada de interação social. Ideia boa para evoluir o projeto depois, mas para o TCC o foco deve ser nos modelos de física + funcionalidades atuais.

---

## Dica de Ouro

Prêmios científicos avaliam 3 pilares:
1. **Inovação** — ✅ Já tem (modelos de física + web colaborativa)
2. **Impacto Social** — Precisa de: dados reais (INPE) + validação com usuários
3. **Metodologia** — Precisa de: questionário SUS + comparação com existentes

Com itens 1, 2 e 7 implementados, o projeto já compete em qualquer feira/prêmio.
