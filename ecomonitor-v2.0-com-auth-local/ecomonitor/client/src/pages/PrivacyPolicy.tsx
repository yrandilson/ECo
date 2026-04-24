import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Shield, Lock, Eye, Trash2, FileText, MapPin, Camera, Bell,
  ChevronDown, ChevronUp, CheckCircle2, ArrowLeft, Scale, Globe,
} from "lucide-react";
import MainLayout from "@/components/MainLayout";

const SECTIONS = [
  {
    id: "coleta",
    icon: <Eye className="h-5 w-5 text-blue-500" />,
    title: "1. Dados que Coletamos",
    content: `O EcoMonitor coleta os seguintes dados pessoais, sempre com seu consentimento:

• **Dados de cadastro:** Nome, e-mail e senha (criptografada com bcrypt).
• **Dados de localização:** Coordenadas GPS quando você reporta uma ocorrência (somente com permissão ativa do navegador).
• **Fotografias:** Imagens enviadas junto a reportes ambientais.
• **Dados de uso:** Páginas visitadas, simulações realizadas, interações com o feed (para melhorar a experiência).
• **Dados do dispositivo:** Tipo de navegador e sistema operacional (para compatibilidade técnica).

**Não coletamos:** Dados bancários, documentos pessoais (CPF/RG), histórico de navegação fora da plataforma, nem compartilhamos dados com terceiros para fins comerciais.`,
  },
  {
    id: "finalidade",
    icon: <FileText className="h-5 w-5 text-emerald-500" />,
    title: "2. Para que Usamos seus Dados",
    content: `Seus dados são utilizados exclusivamente para:

• **Funcionamento da plataforma:** Autenticação, exibição de reportes no mapa, feed colaborativo.
• **Geolocalização de ocorrências:** Posicionar reportes no mapa para que outros usuários validem.
• **Simulações científicas:** Salvar e comparar resultados de simulações educativas.
• **Gamificação:** Calcular pontos, badges e ranking de participação.
• **Notificações:** Alertas de ocorrências próximas à sua região (se habilitado).
• **Melhoria contínua:** Análise anônima de uso para melhorar a interface.

**Base legal (LGPD Art. 7°):** Consentimento do titular (Art. 7°, I) e legítimo interesse para funcionamento da plataforma (Art. 7°, IX).`,
  },
  {
    id: "compartilhamento",
    icon: <Globe className="h-5 w-5 text-purple-500" />,
    title: "3. Compartilhamento de Dados",
    content: `• **Reportes ambientais:** São públicos por natureza — outros usuários veem a localização, descrição e fotos dos reportes. Seu nome de exibição aparece como autor.
• **Dados agregados:** Estatísticas anônimas podem ser compartilhadas com órgãos públicos (IBAMA, Defesa Civil, Secretarias de Meio Ambiente) para fins de monitoramento ambiental.
• **Nunca vendemos dados:** Seus dados pessoais nunca são vendidos ou cedidos para empresas terceiras, anunciantes ou parceiros comerciais.
• **Dados anonimizados:** Podem ser utilizados em pesquisas acadêmicas sobre monitoramento ambiental participativo.`,
  },
  {
    id: "armazenamento",
    icon: <Lock className="h-5 w-5 text-amber-500" />,
    title: "4. Segurança e Armazenamento",
    content: `• **Criptografia:** Senhas são armazenadas com hash bcrypt (nunca em texto puro). Comunicações via HTTPS.
• **Banco de dados:** MySQL com acesso restrito, backups regulares.
• **Sessões:** Tokens JWT com expiração, renovação automática segura.
• **Princípio do mínimo necessário:** Coletamos apenas os dados estritamente necessários para cada funcionalidade.
• **Retenção:** Dados de conta são mantidos enquanto a conta estiver ativa. Dados de reportes são mantidos indefinidamente por interesse público ambiental (Art. 7°, III da LGPD).`,
  },
  {
    id: "direitos",
    icon: <Scale className="h-5 w-5 text-red-500" />,
    title: "5. Seus Direitos (LGPD Art. 18)",
    content: `Você tem o direito de, a qualquer momento:

• **Acessar** seus dados pessoais armazenados (Art. 18, II).
• **Corrigir** dados incompletos, inexatos ou desatualizados (Art. 18, III).
• **Solicitar exclusão** da sua conta e dados pessoais (Art. 18, VI).
• **Revogar consentimento** para coleta de localização ou notificações (Art. 18, IX).
• **Exportar** seus dados em formato legível (Art. 18, V).
• **Solicitar anonimização** dos seus reportes (Art. 18, IV).

Para exercer qualquer direito, acesse **Configurações > Privacidade** ou entre em contato pelo e-mail: privacidade@ecomonitor.com.br

**Prazo de resposta:** Até 15 dias úteis, conforme Art. 19 da LGPD.`,
  },
  {
    id: "cookies",
    icon: <Shield className="h-5 w-5 text-indigo-500" />,
    title: "6. Cookies e Armazenamento Local",
    content: `• **Cookies essenciais:** Token de autenticação (JWT) e preferências de tema (claro/escuro).
• **LocalStorage:** Dados de sessão, preferências do usuário, cache de simulações.
• **Não utilizamos:** Cookies de rastreamento, cookies de terceiros, pixels de tracking, Google Analytics ou ferramentas similares.
• **Controle:** Você pode limpar os dados a qualquer momento nas configurações do navegador.`,
  },
  {
    id: "menores",
    icon: <Shield className="h-5 w-5 text-pink-500" />,
    title: "7. Menores de Idade",
    content: `• O EcoMonitor pode ser utilizado por maiores de 13 anos.
• Menores de 18 anos devem ter consentimento dos pais ou responsáveis legais para criar conta, conforme Art. 14 da LGPD.
• Não coletamos intencionalmente dados de menores de 13 anos. Caso identifiquemos, os dados serão excluídos imediatamente.`,
  },
  {
    id: "alteracoes",
    icon: <FileText className="h-5 w-5 text-slate-500" />,
    title: "8. Alterações nesta Política",
    content: `• Esta política pode ser atualizada periodicamente.
• Alterações significativas serão comunicadas por notificação na plataforma.
• Data da última atualização: **Março de 2026**.
• Versão: 1.0`,
  },
];

export default function PrivacyPolicy() {
  const [expanded, setExpanded] = useState<string[]>(["coleta"]);

  const toggle = (id: string) => {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const expandAll = () => setExpanded(SECTIONS.map((s) => s.id));
  const collapseAll = () => setExpanded([]);

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto pb-12">
        {/* Header */}
        <div className="relative mb-8 p-6 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">Política de Privacidade</h1>
                <p className="text-blue-100 text-sm">Em conformidade com a LGPD (Lei nº 13.709/2018)</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { icon: <Lock className="h-4 w-4" />, text: "Dados protegidos" },
                { icon: <Eye className="h-4 w-4" />, text: "Transparência total" },
                { icon: <Trash2 className="h-4 w-4" />, text: "Direito de exclusão" },
              ].map((item, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 flex items-center gap-2 text-white text-xs font-medium">
                  {item.icon} {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 mb-6">
          <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4" /> Resumo Simples
          </h3>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed">
            <li>✅ Coletamos apenas o necessário para a plataforma funcionar</li>
            <li>✅ Nunca vendemos seus dados</li>
            <li>✅ Você pode excluir sua conta e dados a qualquer momento</li>
            <li>✅ Senhas são criptografadas, comunicações via HTTPS</li>
            <li>✅ Localização só é coletada com sua permissão explícita</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/about">
            <button className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar
            </button>
          </Link>
          <div className="flex gap-2">
            <button onClick={expandAll} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors">
              Expandir tudo
            </button>
            <button onClick={collapseAll} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors">
              Recolher tudo
            </button>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {SECTIONS.map((section) => {
            const isOpen = expanded.includes(section.id);
            return (
              <div
                key={section.id}
                className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5 overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggle(section.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  aria-expanded={isOpen}
                  aria-controls={`section-${section.id}`}
                >
                  {section.icon}
                  <span className="flex-1 text-sm font-bold text-slate-800 dark:text-white">{section.title}</span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </button>
                {isOpen && (
                  <div
                    id={`section-${section.id}`}
                    className="px-4 pb-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line border-t border-slate-100 dark:border-slate-800 pt-3"
                    dangerouslySetInnerHTML={{
                      __html: section.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-800 dark:text-white">$1</strong>'),
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Última atualização: Março de 2026 • Versão 1.0
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Dúvidas? Entre em contato: privacidade@ecomonitor.com.br
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
