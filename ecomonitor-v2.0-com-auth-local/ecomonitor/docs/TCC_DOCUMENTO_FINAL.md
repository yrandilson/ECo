# Projeto ECoMonitor — Documento Final de TCC

Autores: [Seu Nome]
Orientador: [Nome do Orientador]
Curso: [Nome do Curso]
Universidade: [Nome da Universidade]
Data: Fevereiro de 2026

---

Resumo

Este Trabalho de Conclusão de Curso apresenta o desenvolvimento do ECoMonitor, uma plataforma web para monitoração e denúncia de ocorrências ambientais que integra coleta de dados, visualização geoespacial, modelagem preditiva e mecanismos de participação comunitária. O sistema combina frontend em React + Vite, backend em Node.js (Express + tRPC), banco de dados MySQL com Drizzle ORM e componentes de Machine Learning para predição de risco de incêndio. O documento descreve objetivos, revisão bibliográfica, arquitetura, implementação, validação funcional, resultados e roadmap de melhorias.

Palavras-chave: monitoramento ambiental, detecção de incêndios, tRPC, Drizzle ORM, React, Vite, ML, participacao comunitaria

---

## Sumário

- Introdução
- Objetivos
- Revisão Bibliográfica
- Metodologia
- Arquitetura do Sistema
  - Visão Geral
  - Banco de Dados (Drizzle)
  - Backend (Express + tRPC)
  - Frontend (React + Vite)
  - Integrações externas
  - Componentes ML
- Implementação
  - Módulos principais
  - Páginas e componentes (ReportOccurrence, ReportContent, Simulators, etc.)
  - Segurança e autenticação
- Testes e Verificação Funcional
  - Procedimentos de teste
  - Resultados (resumo; ver apêndice para relatório detalhado)
- Discussão
- Conclusão
- Trabalhos Futuros
- Referências
- Apêndices
  - A. VERIFICACAO_FUNCIONAL_E_ROADMAP.md (importado)
  - B. MELHORIAS_FUNCIONALIDADE_REPORTAR.md (importado)
  - C. Scripts de banco e migrations (drizzle/migrations)
  - D. Lista de arquivos modificados relevantes

---

## 1. Introdução

Contextualize o problema: degradação ambiental, necessidade de sistemas de monitoramento participativos, desafios de detecção precoce de incêndios e poluição, e papel das plataformas digitais para coleta de dados e engajamento comunitário.

Explique brevemente o produto: o ECoMonitor facilita a denúncia de ocorrências, agrega dados ambientais, oferece simulações preditivas e dashboards analíticos para gestores e público.

## 2. Objetivos

- Objetivo Geral: Desenvolver e validar uma plataforma integrada para monitoramento e denúncia de ocorrências ambientais.
- Objetivos Específicos:
  - Implementar interface amigável para usuários reportarem ocorrências e conteúdo.
  - Persistir denúncias e permitir fluxo de moderação.
  - Integrar fontes externas (OpenWeather, NASA FIRMS) para enriquecimento de dados.
  - Implementar modelo preditivo de risco de incêndio.
  - Fornecer visualizações interativas (mapas, gráficos, comparadores).

## 3. Revisão Bibliográfica

(Adicionar revisão sobre sensores remotos, sistemas de informação geográfica, participação cidadã em ciência, modelos de previsão de incêndios florestais — incluir referências relevantes: artigos sobre FWI, NASA FIRMS, papers sobre crowdsourcing para monitoramento ambiental.)

## 4. Metodologia

Descrever metodologia de desenvolvimento (metodologia ágil / incremental), ferramentas e tecnologias utilizadas, critérios de avaliação e conjuntos de testes funcionais.

## 5. Arquitetura do Sistema

### 5.1 Visão Geral
Arquitetura em camadas: Cliente (React), API (Express + tRPC), Banco (MySQL + Drizzle), Serviços externos, componentes ML.

### 5.2 Banco de Dados
- Modelo relacional: tabelas `users`, `occurrences`, `photos`, `validations`, `contentReports`, `simulations`, `alerts`, `badges`, `rankings`.
- Use `drizzle/schema.ts` como referência. Incluir diagrama ER (incluir como apêndice ou figura).

### 5.3 Backend
- Implementação em Node.js com Express e tRPC para rotas tipadas.
- Autenticação via cookie/JWT (ver `server/_core`), serviços e camadas de negócio em `server/db.ts` e `server/routers.ts`.

### 5.4 Frontend
- Aplicação em React + TypeScript com roteamento Wouter, UI baseada em shadcn/ui e Tailwind.
- Componentes principais: `ReportOccurrence`, `ReportContent`, `Simulators`, `ScenarioComparator`, `SimulationHistory`, `AnimatedVisualization`.

### 5.5 Integrações Externas
- OpenWeather para meteorologia, NASA FIRMS para detecções de incêndio, serviços de email e armazenamento de imagens.

### 5.6 Machine Learning
- `lstm-predictor.ts`/`ml-predictor.ts`: arquitetura, entrada/saída, treinamento (se aplicável) e avaliação.

## 6. Implementação

Descrever implementação passo a passo, destacando decisões técnicas, trechos essenciais de código e justificativas. Incluir também:
- Como denúncias de conteúdo e ocorrências são persistidas (tabelas e endpoints tRPC).
- Fluxo de moderação e votos da comunidade.
- Validações de imagens (planejado): limites de tamanho e formato.

## 7. Testes e Verificação Funcional

Resumir os testes realizados (manuais e automatizados se houver), cobertura, e problemas críticos resolvidos (ex.: tela em branco, erros TypeScript, import lucide-react Cube→Box). Incluir métricas e prints (capturas) como apêndice.

## 8. Resultados

Apresentar resultados qualitativos e quantitativos: funcionalidades implementadas, casos de uso testados, desempenho do ML (se disponível), número de testes e resultados relevantes.

## 9. Discussão

Análise crítica das escolhas arquiteturais, limitações do trabalho, lições aprendidas, questões éticas (privacidade de denunciantes), e possíveis melhorias.

## 10. Conclusão

Resumo das contribuições e conclusão do TCC.

## 11. Trabalhos Futuros

Listar roadmap (prioridades: salvar denúncias em BD, mapa interativo, validação de fotos, dashboard moderador, IA para triagem, integrações externas adicionais).

## 12. Referências

(Incluir referências formatadas — ABNT/APA conforme orientado pelo curso.)

## Apêndices

- Apêndice A: `VERIFICACAO_FUNCIONAL_E_ROADMAP.md` (incluir link relativo ou conteúdo)
- Apêndice B: `MELHORIAS_FUNCIONALIDADE_REPORTAR.md`
- Apêndice C: Trechos de código e comandos (migrations, scripts)
- Apêndice D: Lista de arquivos modificados e histórico de commits relevantes

---

### Próximos passos que já iniciei:
- Criei esta estrutura inicial do documento `TCC_DOCUMENTO_FINAL.md` no repositório.
- Adicionei um todo list de tarefas para organizar a produção e iterações.

### O que você deseja agora?
- Posso começar a preencher automaticamente cada seção com conteúdo extraído dos arquivos existentes (`README.md`, `MANUAL_TECNICO.md`, `VERIFICACAO_FUNCIONAL_E_ROADMAP.md`, `MELHORIAS_FUNCIONALIDADE_REPORTAR.md`) e incluir trechos de código e figuras.
- Ou prefere que eu preencha seção por seção com seu feedback entre cada capítulo (recomendado para controle acadêmico).

Diga qual abordagem prefere e eu continuo a próxima etapa automaticamente.
