# EcoMonitor — Resumo do TCC

---

## Tema

**Desenvolvimento de uma plataforma web colaborativa para monitoramento ambiental com cálculo de risco baseado em modelos físicos.**

O tema une duas áreas: **Sistemas de Informação** (desenvolvimento web, banco de dados, APIs) e **Física Aplicada** (modelos matemáticos de propagação de incêndio, dispersão de poluentes, hidrologia). A ideia é usar a tecnologia para dar ao cidadão comum uma ferramenta simples de reportar problemas ambientais, enquanto o sistema aplica fórmulas científicas por trás para calcular automaticamente a gravidade de cada situação.

---

## Resumo do Projeto

O **EcoMonitor** é uma plataforma web onde qualquer pessoa pode reportar ocorrências ambientais (queimadas, poluição, enchentes, desmatamento) marcando a localização no mapa e enviando fotos. O sistema usa modelos de física (Arrhenius, Pluma Gaussiana, Penman) para calcular um score de risco de 0 a 100 para cada ocorrência. Todas as ocorrências ficam visíveis em um mapa interativo compartilhado. A plataforma inclui dashboard com estatísticas, alertas geoespaciais, chatbot e atualização em tempo real via WebSocket.

**Tecnologias:** React, TypeScript, Node.js, Express, MySQL, Leaflet, WebSocket.

---

## Resumo em uma frase

> Plataforma web colaborativa de monitoramento ambiental que permite ao cidadão reportar problemas no mapa, com cálculo automático de risco baseado em modelos de física aplicada.
