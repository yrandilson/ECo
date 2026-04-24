# CHANGELOG — EcoMonitor v2.1

## Data: Março 2026

---

## Novas Features Implementadas

### 1. 🔒 LGPD — Política de Privacidade (Lei 13.709/2018)

**Arquivo criado:** `client/src/pages/PrivacyPolicy.tsx`
**Rota:** `/privacy` (pública, sem autenticação)

**O que faz:**
- Página completa de Política de Privacidade em conformidade com a LGPD
- 8 seções expansíveis/recolhíveis (accordion):
  1. Dados que coletamos
  2. Finalidade do uso
  3. Compartilhamento de dados
  4. Segurança e armazenamento
  5. Seus direitos (Art. 18 da LGPD)
  6. Cookies e armazenamento local
  7. Menores de idade
  8. Alterações na política
- Resumo simplificado no topo para leitura rápida
- Botões "Expandir tudo" / "Recolher tudo"
- Design moderno com glassmorphism e gradientes
- Acessível: `aria-expanded`, `aria-controls`

**Base legal referenciada:** Art. 7°, Art. 14, Art. 18, Art. 19 da LGPD

---

### 2. 🍪 Banner de Consentimento LGPD

**Arquivo criado:** `client/src/components/LgpdConsentBanner.tsx`
**Onde aparece:** Todas as páginas (componente global no App.tsx)

**O que faz:**
- Banner fixo na parte inferior da tela
- Aparece automaticamente na primeira visita (cookie não encontrado)
- 3 opções: "Aceitar e continuar", "Apenas essenciais", "Ler política completa"
- Salva consentimento no `localStorage` com data e versão
- Reaparece se a versão da política for atualizada
- Animação suave de entrada (slide-in-from-bottom)
- `role="dialog"` e `aria-label` para acessibilidade

**Dados salvos no localStorage:**
```json
{
  "accepted": true,
  "version": "1.0",
  "date": "2026-03-03T..."
}
```

---

### 3. 🚨 Modo Emergência

**Arquivo criado:** `client/src/pages/EmergencyMode.tsx`
**Rota:** `/emergency` (protegida, requer autenticação)
**Menu:** Aparece na sidebar em "Ações" com badge "SOS" vermelho

**O que faz:**

**Contatos de emergência:**
- SAMU (192), Bombeiros (193), Defesa Civil (199), PM (190), IBAMA (0800-618080), Disque Denúncia (181)
- Links `tel:` clicáveis para ligar direto do celular

**5 tipos de emergência com orientações completas:**
- 🌊 Enchente / Alagamento
- 🔥 Incêndio Florestal
- 💨 Poluição Crítica
- ⛰️ Deslizamento de terra
- ☀️ Seca Extrema

**Para cada tipo:**
- ✅ O que FAZER (5-6 orientações)
- ❌ O que NÃO FAZER (3-4 alertas)
- 📦 Kit de Emergência (itens necessários)

**Links úteis:**
- Defesa Civil Nacional, INPE Queimadas, INMET Alertas, ANA Nível dos Rios, CETESB Qualidade do Ar, SOS Mata Atlântica
- Todos com `target="_blank"` e `rel="noopener noreferrer"`

**Design:** Cabeçalho vermelho pulsante, cards interativos, animações

---

## Arquivos Modificados

### 4. App.tsx — Novas rotas e banner LGPD

**Arquivo:** `client/src/App.tsx`

**Alterações:**
- Import de `LgpdConsentBanner`
- Import lazy de `PrivacyPolicy` e `EmergencyMode`
- Nova rota pública: `/privacy` → PrivacyPolicy
- Nova rota protegida: `/emergency` → EmergencyMode
- `<LgpdConsentBanner />` adicionado como componente global

---

### 5. MainLayout.tsx — Link de Emergência no menu

**Arquivo:** `client/src/components/MainLayout.tsx`

**Alterações:**
- Novo item na seção "Ações" do menu lateral:
  - Path: `/emergency`
  - Icon: AlertCircle
  - Label: "Emergência"
  - Badge: "SOS" (vermelho)

---

## Acessibilidade (a11y) implementada

Todas as novas páginas incluem:
- `aria-label` em botões e links interativos
- `aria-expanded` / `aria-controls` em accordions
- `role="dialog"` no banner de consentimento
- `aria-pressed` nos botões de seleção de emergência
- Links `tel:` com `aria-label` descritivo
- Contraste adequado (WCAG 2.1 AA)
- Textos alternativos em todos os ícones com significado

---

## Resumo de Arquivos

| Arquivo | Status | Linhas |
|---------|--------|--------|
| `client/src/pages/PrivacyPolicy.tsx` | ✅ CRIADO | ~215 |
| `client/src/components/LgpdConsentBanner.tsx` | ✅ CRIADO | ~105 |
| `client/src/pages/EmergencyMode.tsx` | ✅ CRIADO | ~270 |
| `client/src/App.tsx` | ✅ EDITADO | +8 linhas |
| `client/src/components/MainLayout.tsx` | ✅ EDITADO | +1 linha |

**Erros TypeScript:** 0 em todos os arquivos ✅

---

## Feature: Índice EcoMonitor (IEM) — Métrica Original

### 4. 🌍 IEM — Índice EcoMonitor (Métrica Científica Original)

**Arquivo criado:** `client/src/pages/IEMPage.tsx`
**Rota:** `/iem` (protegida)

**Fórmula original:**
```
IEM = 100 − Σ(wi × Di) × Feng
```

**6 dimensões com pesos:**
| Dimensão | Peso | Descrição |
|----------|------|-----------|
| Ocorrências Ativas | 30% | Quantidade e severidade de problemas ambientais |
| Tempo de Resolução | 20% | Rapidez na resolução de ocorrências |
| Qualidade do Ar | 15% | Indicadores de poluição atmosférica |
| Cobertura Vegetal | 15% | Preservação de áreas verdes |
| Recursos Hídricos | 10% | Qualidade e poluição da água |
| Validação Comunitária | 10% | Engajamento cidadão nas validações |

**Fator de Engajamento (Feng):** 0.8 a 1.2, calculado pela taxa de validação comunitária.

**Componentes visuais:**
- **Gauge semicircular** com score 0–100 e classificação (Excelente/Bom/Moderado/Ruim/Crítico)
- **Mini-cards** estatísticos com dados reais (ocorrências, críticas, validadas, regiões)
- **Top bar hero** com gradiente emerald → teal → cyan
- **Ranking de 12 bairros** ordenados por IEM, com trend (↑ / ↓), ocorrências e usuários ativos
- **Detalhamento por bairro** — 6 barras de degradação com contribuição em pontos
- **Recomendação automática** da dimensão mais crítica do bairro
- **Timeline de evolução** — gráfico de barras dos últimos 6 meses
- **Painel de metodologia** expandível com fórmula, variáveis e referências (IDEB, IQA, IDH)
- **Escala de referência** visual (5 faixas coloridas)
- **Widget IEM no Dashboard** — card compacto com cálculo rápido e link para `/iem`

**Dados reais utilizados:** `trpc.occurrences.getRecent` (tipos, severidade, status de validação)

**Inspiração científica:** IDEB (MEC), IQA (CETESB), IDH (PNUD)

**Arquivos modificados:**
| Arquivo | Alteração |
|---------|-----------|
| `client/src/pages/IEMPage.tsx` | ✅ CRIADO (~350 linhas) |
| `client/src/pages/Dashboard.tsx` | ✅ EDITADO — Widget IEM + import Globe |
| `client/src/App.tsx` | ✅ EDITADO — Lazy import + rota `/iem` |
| `client/src/components/MainLayout.tsx` | ✅ EDITADO — Nav link "Índice IEM" na seção Análise |

**Erros TypeScript:** 0 ✅
---

## Feature: Denúncia Formal Ambiental

### 5. ⚖️ Denúncia Formal — Lei 9.605/98 (Crimes Ambientais)

**Arquivo criado:** `client/src/pages/FormalComplaint.tsx`
**Rota:** `/complaint` (protegida)

**Diferente de "Reportar Ocorrência":**
| Reportar (existente) | Denúncia Formal (novo) |
|----------------------|----------------------|
| Informal/comunitário | Jurídico/oficial |
| Destino: comunidade | Destino: IBAMA, MP, SEMACE |
| Foto + descrição | Wizard 5 etapas + protocolo |

**Wizard em 5 etapas:**
1. **Tipo de Infração** — 5 categorias baseadas na Lei 9.605/98:
   - Crimes contra Fauna (Art. 29-37)
   - Crimes contra Flora (Art. 38-53)
   - Poluição (Art. 54-61)
   - Ordenamento Urbano (Art. 62-65)
   - Recursos Hídricos (Lei 9.433/97)
   - 25+ subcategorias específicas
2. **Localização** — endereço, bairro, cidade/UF, GPS automático
3. **Evidências** — upload fotos/vídeos/áudios, data/hora, recorrência
4. **Testemunhas** — lista dinâmica + opção de denúncia anônima (Art. 5° CF)
5. **Revisão** — nível de urgência, órgão destino, declaração legal

**Funcionalidades:**
- **Geração de protocolo** único (formato: ECO-YYMMDD-XXXXXX)
- **6 órgãos alvo** com telefone direto: IBAMA, ICMBio, SEMACE, SEUMA, MP, Polícia Ambiental
- **Denúncia anônima** garantida pela Constituição (Art. 5°, IV)
- **Stepper visual** com estados (ativo/concluído/pendente)
- **Validação por etapa** (campo obrigatório mín. 30 chars na descrição)
- **Tela de sucesso** com protocolo copiável + timeline de acompanhamento
- **Barra de contatos** rápidos (IBAMA, Polícia Ambiental, Disque Denúncia, MP-CE)
- **Declaração legal** sobre denúncia falsa (Art. 339 CP)
- Design glassmorphism com gradiente indigo → purple → violet

**Base legal referenciada:**
- Lei 9.605/98 (Crimes Ambientais)
- Lei 9.433/97 (Recursos Hídricos)
- Art. 225 CF (Direito ao meio ambiente)
- Art. 5°, IV CF (Anonimato)
- Art. 339 CP (Denúncia falsa)

**Arquivos modificados:**
| Arquivo | Alteração |
|---------|-----------|
| `client/src/pages/FormalComplaint.tsx` | ✅ CRIADO (~580 linhas) |
| `client/src/App.tsx` | ✅ EDITADO — Lazy import + rota `/complaint` |
| `client/src/components/MainLayout.tsx` | ✅ EDITADO — Nav link + import Scale icon |

**Erros TypeScript:** 0 ✅

---

### 6. 🏥 Painel de Saúde Ambiental

**Arquivo criado:** `client/src/pages/HealthPanel.tsx`
**Rota:** `/health` (protegida)
**Menu:** Sidebar em "Saúde & Impacto" com badge "Novo"

**O que faz:**
- **IRS (Índice de Risco à Saúde)** — gauge 0-100 com faixas de risco
- **Índice UV** com 5 níveis (Baixo → Extremo) conforme OMS
- **IQA (Índice de Qualidade do Ar)** com 6 faixas EPA
- **Heatmap** de 12 zonas urbanas por risco sanitário
- **Correlações epidemiológicas:** 5 doenças respiratórias (poluição do ar) + 5 arboviroses (poluição hídrica)
- **Grupos vulneráveis** identificados: crianças, idosos, gestantes, cardiopatas
- **Referências:** OMS, EPA, DATASUS, INPE, CETESB

**Erros TypeScript:** 0 ✅

---

### 7. 💰 Calculadora de Perdas e Danos Ambientais

**Arquivo criado:** `client/src/pages/LossCalculator.tsx`
**Rota:** `/losses` (protegida)
**Menu:** Sidebar em "Saúde & Impacto" com badge "R$"

**O que faz:**
- **8 serviços ecossistêmicos** com valores em R$/ha/ano
- **Cálculo total** de perdas para a cidade
- **Ranking** de 10 regiões por perda monetária
- **Fórmula:** L_total = Σi(Adeg × Vsvc,i × Di)
- **Referências:** TEEB, IPCC AR6, FAO, EMBRAPA, ANA

**Erros TypeScript:** 0 ✅

---

### 8. 📄 Gerador de Relatório One-Click (PDF)

**Arquivo criado:** `client/src/pages/ReportGenerator.tsx`
**Rota:** `/report-pdf` (protegida)
**Menu:** Sidebar em "Análise" com badge "PDF"

**O que faz:**
- **Configuração** de título, período (7d/30d/90d/1 ano) e formato (completo/resumido/técnico)
- **7 seções opcionais** ativáveis/desativáveis
- **Preview** com protocolo único, data/hora, autor
- **Botões** Imprimir / Exportar PDF
- **Autenticação digital** com hash SHA-256 no rodapé

**Erros TypeScript:** 0 ✅

---

### 9. 🌱 Certificação Selo Verde (ESG)

**Arquivo criado:** `client/src/pages/GreenSeal.tsx`
**Rota:** `/green-seal` (protegida)
**Menu:** Sidebar em "Saúde & Impacto" com badge "ESG"

**O que faz:**
- **Score ESG** consolidado (0-100) com ring chart animado
- **10 critérios** em 3 categorias (Environmental, Social, Governance)
- **4 níveis de certificação:** Platina (💎 ≥90), Ouro (🥇 ≥75), Prata (🥈 ≥60), Bronze (🥉 ≥40)
- **Emissão de certificado digital** com selo visual e autenticação
- **Exportar/Imprimir** certificado

**Erros TypeScript:** 0 ✅

---

### 10. 🌾 Previsão de Safra e Risco Agrícola

**Arquivo criado:** `client/src/pages/CropForecast.tsx`
**Rota:** `/crop-forecast` (protegida)
**Menu:** Sidebar em "Saúde & Impacto" com badge "Agro"

**O que faz:**
- **6 culturas monitoradas:** Soja, Milho, Café, Cana, Feijão, Algodão
- **Cards expansíveis** com saúde, rendimento, fatores de risco
- **Previsão climática** 7 dias
- **Alertas de risco agrícola** com probabilidade
- **Recomendações** técnicas (irrigação, MIP, cobertura verde, NDVI)
- **Metodologia:** Thornthwaite-Mather, EMBRAPA, FAO AquaCrop, INPE/CPTEC

**Erros TypeScript:** 0 ✅

---

## Resumo de Arquivos Alterados (Features 6-10)

| Arquivo | Alteração |
|---------|-----------|
| `client/src/pages/HealthPanel.tsx` | ✅ CRIADO (~350 linhas) |
| `client/src/pages/LossCalculator.tsx` | ✅ CRIADO (~300 linhas) |
| `client/src/pages/ReportGenerator.tsx` | ✅ CRIADO (~350 linhas) |
| `client/src/pages/GreenSeal.tsx` | ✅ CRIADO (~430 linhas) |
| `client/src/pages/CropForecast.tsx` | ✅ CRIADO (~320 linhas) |
| `client/src/App.tsx` | ✅ EDITADO — 5 lazy imports + 5 rotas protegidas |
| `client/src/components/MainLayout.tsx` | ✅ EDITADO — Nova seção "Saúde & Impacto" + 5 nav links |