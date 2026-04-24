# EcoMonitor — Resumo para o Orientador

**Aluno:** [Seu Nome]  
**Curso:** Sistemas de Informação  
**Orientador:** [Nome do Professor]  

---

## O que é o projeto?

O **EcoMonitor** é um site onde qualquer pessoa pode:

1. **Reportar** problemas ambientais (incêndio, poluição, desmatamento, enchente) com foto e localização no mapa
2. **Ver no mapa** todas as ocorrências reportadas por outros usuários
3. **Usar simuladores** que mostram como incêndios se propagam, como a água é afetada, etc.
4. **Receber alertas** de risco na sua região
5. **Acompanhar em tempo real** novas ocorrências (via WebSocket, sem precisar atualizar a página)

---

## Onde entra a Física?

O projeto usa **6 modelos físicos reais** para calcular o risco de cada ocorrência:

| Tipo | Modelo | O que faz |
|------|--------|-----------|
| Incêndio | Arrhenius + Rothermel | Calcula risco de fogo com temperatura, umidade, vento e vegetação |
| Poluição da água | Penman | Avalia qualidade da água (nível, cor, temperatura) |
| Poluição do ar | Pluma Gaussiana | Calcula dispersão de poluentes pelo vento |
| Seca | Estresse térmico | Combina temperatura, umidade e precipitação |
| Desmatamento | Cobertura vegetal | Relaciona densidade de vegetação e acessibilidade |
| Enchente | Hidrologia | Usa elevação, proximidade a rios e declividade |

Também criamos o **IRAC** (Índice de Risco Ambiental Composto) — um indicador próprio que junta 6 variáveis em um score de 0 a 100.

O projeto tem **3 simuladores interativos** onde o usuário mexe em controles (temperatura, vento, etc.) e vê o resultado dos cálculos na tela.

---

## Onde entra Sistemas de Informação?

| O que | Tecnologia |
|-------|-----------|
| Site (frontend) | React + TypeScript |
| Servidor (backend) | Node.js + Express |
| Banco de dados | MySQL com 9 tabelas |
| Login e segurança | JWT + senha forte + rate limiting |
| Mapa interativo | Leaflet.js |
| Tempo real | WebSocket |
| Dados de satélite | API da NASA (FIRMS) |
| Dados de clima | API da OpenWeatherMap |
| Chatbot | API da OpenAI |
| Previsão de risco | 3 algoritmos de Machine Learning |

---

## Onde entra a IA?

Já implementado:
- **3 modelos de ML** (Regressão Linear, Random Forest, Rede Neural) que preveem risco de incêndio para os próximos 7 dias
- **Chatbot com IA** que responde dúvidas sobre meio ambiente

Planejado:
- IA que analisa fotos enviadas e identifica se é fogo, poluição ou desmatamento
- IA que detecta anomalias nos dados antes de virar desastre

---

## Por que é importante?

- O Brasil teve **68.635 focos de queimada em 2024** (INPE)
- Não existe ferramenta simples para o cidadão reportar problemas ambientais com base científica
- O EcoMonitor une o reporte do cidadão com dados de satélite e modelos de física
- Os simuladores servem como ferramenta educacional de física aplicada

---

## Números do projeto

| Item | Quantidade |
|------|-----------|
| Linhas de código | ~15.000+ |
| Modelos de física | 6 + IRAC |
| Simuladores interativos | 3 |
| Algoritmos de ML | 3 |
| Tabelas no banco | 9 |
| Páginas na interface | 20 |
| APIs externas | 3 (NASA, OpenWeather, OpenAI) |

---

## Resumo em uma frase

> O EcoMonitor é uma plataforma web que permite a qualquer pessoa reportar e monitorar problemas ambientais, usando modelos de física (Arrhenius, Rothermel, Penman) para calcular riscos, dados de satélite da NASA para validar reportes, e inteligência artificial para prever desastres — unindo Sistemas de Informação e Física em um projeto com impacto social real.
