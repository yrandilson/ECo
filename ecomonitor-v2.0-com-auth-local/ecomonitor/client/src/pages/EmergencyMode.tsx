import { useState, useMemo } from "react";
import {
  AlertTriangle, Phone, MapPin, Shield, Radio, Navigation, ExternalLink,
  Siren, Heart, Droplets, Flame, Wind, ChevronRight, Info, Clock,
  Users, CheckCircle2, XCircle, Volume2, BellRing, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/MainLayout";

// ─── Emergency Contacts ──────────────────────────────────────────────

const EMERGENCY_CONTACTS = [
  { name: "SAMU", number: "192", icon: <Heart className="h-5 w-5" />, color: "bg-red-500", desc: "Emergências médicas" },
  { name: "Bombeiros", number: "193", icon: <Flame className="h-5 w-5" />, color: "bg-orange-500", desc: "Incêndios e resgates" },
  { name: "Defesa Civil", number: "199", icon: <Shield className="h-5 w-5" />, color: "bg-blue-500", desc: "Desastres naturais" },
  { name: "Polícia Militar", number: "190", icon: <Siren className="h-5 w-5" />, color: "bg-slate-700", desc: "Emergências policiais" },
  { name: "IBAMA", number: "0800-618080", icon: <Droplets className="h-5 w-5" />, color: "bg-emerald-600", desc: "Crimes ambientais" },
  { name: "Disque Denúncia", number: "181", icon: <Phone className="h-5 w-5" />, color: "bg-purple-600", desc: "Denúncias anônimas" },
];

// ─── Emergency Types ─────────────────────────────────────────────────

type EmergencyType = "flood" | "fire" | "pollution" | "landslide" | "drought";

const EMERGENCY_TYPES: { key: EmergencyType; icon: string; label: string; color: string; gradient: string }[] = [
  { key: "flood", icon: "🌊", label: "Enchente / Alagamento", color: "text-blue-600", gradient: "from-blue-500 to-cyan-600" },
  { key: "fire", icon: "🔥", label: "Incêndio Florestal", color: "text-red-600", gradient: "from-red-500 to-orange-500" },
  { key: "pollution", icon: "💨", label: "Poluição Crítica", color: "text-purple-600", gradient: "from-purple-500 to-pink-500" },
  { key: "landslide", icon: "⛰️", label: "Deslizamento", color: "text-amber-600", gradient: "from-amber-500 to-yellow-500" },
  { key: "drought", icon: "☀️", label: "Seca Extrema", color: "text-orange-600", gradient: "from-orange-500 to-red-500" },
];

// ─── Safety Guidelines ───────────────────────────────────────────────

const SAFETY_GUIDELINES: Record<EmergencyType, { dos: string[]; donts: string[]; kit: string[] }> = {
  flood: {
    dos: [
      "Desligue a energia elétrica da residência",
      "Vá para locais altos e seguros imediatamente",
      "Leve documentos e medicamentos em saco plástico",
      "Acompanhe alertas da Defesa Civil pelo rádio",
      "Ajude idosos e pessoas com mobilidade reduzida",
    ],
    donts: [
      "NÃO ande em áreas alagadas (risco de leptospirose e choque)",
      "NÃO tente atravessar pontes ou ruas alagadas de carro",
      "NÃO consuma água ou alimentos que tiveram contato com enchente",
      "NÃO volte para casa até autorização da Defesa Civil",
    ],
    kit: ["Água potável (3L/pessoa)", "Documentos em saco plástico", "Lanterna com pilhas", "Rádio a pilha", "Kit primeiros socorros", "Medicamentos pessoais"],
  },
  fire: {
    dos: [
      "Evacue a área IMEDIATAMENTE na direção contrária ao vento",
      "Cubra nariz e boca com pano úmido",
      "Ligue 193 (Bombeiros) informando localização exata",
      "Se possível, crie aceiros ao redor de construções",
      "Mantenha portas e janelas fechadas para evitar entrada de fumaça",
    ],
    donts: [
      "NÃO tente apagar incêndios florestais sozinho",
      "NÃO fuja morro acima (fogo sobe mais rápido que desce)",
      "NÃO jogue água em fogo de óleo/combustível",
      "NÃO subestime a velocidade do fogo (pode chegar a 10 km/h)",
    ],
    kit: ["Máscara N95 ou pano molhado", "Água (para hidratar e molhar pano)", "Lanterna", "Documentos", "Telefone carregado"],
  },
  pollution: {
    dos: [
      "Fique em ambientes fechados com janelas fechadas",
      "Use máscara N95/PFF2 se precisar sair",
      "Hidrate-se bastante",
      "Monitore a qualidade do ar em sites oficiais",
      "Pessoas com doenças respiratórias devem redobrar cuidados",
    ],
    donts: [
      "NÃO faça exercícios ao ar livre",
      "NÃO use ventiladores que puxem ar de fora",
      "NÃO ignore sintomas (tosse, falta de ar, ardência nos olhos)",
    ],
    kit: ["Máscara N95/PFF2", "Colírio lubrificante", "Soro fisiológico", "Medicamentos para asma/rinite"],
  },
  landslide: {
    dos: [
      "Evacue a área imediatamente ao notar rachaduras ou inclinação",
      "Vá para terrenos planos e firmes",
      "Ligue 199 (Defesa Civil) e 193 (Bombeiros)",
      "Em época de chuvas, observe sinais: trincas, árvores inclinadas, água barrenta",
    ],
    donts: [
      "NÃO fique em encostas durante chuvas fortes",
      "NÃO construa em áreas de risco geológico",
      "NÃO desvie cursos d'água naturais",
      "NÃO volte ao local sem liberação técnica",
    ],
    kit: ["Documentos", "Roupas extras", "Água e alimentos não perecíveis", "Lanterna", "Rádio a pilha"],
  },
  drought: {
    dos: [
      "Economize água: banhos curtos, reuse água de máquina",
      "Armazene água potável em recipientes limpos",
      "Hidrate-se frequentemente, especialmente idosos e crianças",
      "Monitore qualidade da água de poços e cisternas",
    ],
    donts: [
      "NÃO desperdice água potável",
      "NÃO consuma água de fontes não verificadas",
      "NÃO faça queimadas (risco extremo de incêndio em seca)",
    ],
    kit: ["Reservatório de água (pelo menos 20L)", "Purificador ou cloro para água", "Protetor solar", "Chapéu/sombrinha"],
  },
};

// ─── Component ───────────────────────────────────────────────────────

export default function EmergencyMode() {
  const [selectedType, setSelectedType] = useState<EmergencyType | null>(null);

  const guidelines = selectedType ? SAFETY_GUIDELINES[selectedType] : null;
  const typeInfo = EMERGENCY_TYPES.find((t) => t.key === selectedType);

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto pb-12">
        {/* Alert Header */}
        <div className="relative mb-6 p-6 rounded-2xl bg-gradient-to-br from-red-600 via-red-500 to-orange-500 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-300/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm animate-pulse">
                <AlertTriangle className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">Modo Emergência</h1>
                <p className="text-red-100 text-sm">Informações de segurança e contatos de emergência</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-xl">
              <p className="text-xs text-white/90 font-medium flex items-center gap-2">
                <BellRing className="h-3.5 w-3.5 shrink-0" />
                Em caso de emergência real, ligue imediatamente para os números abaixo. Este guia é informativo e não substitui orientação profissional.
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Contatos de Emergência
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {EMERGENCY_CONTACTS.map((contact) => (
              <a
                key={contact.number}
                href={`tel:${contact.number}`}
                className="group flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5 hover:shadow-lg transition-all active:scale-[0.98]"
                aria-label={`Ligar para ${contact.name}: ${contact.number}`}
              >
                <div className={`p-2.5 rounded-xl text-white ${contact.color} group-hover:scale-110 transition-transform`}>
                  {contact.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{contact.name}</div>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{contact.number}</div>
                  <div className="text-[10px] text-slate-400 truncate">{contact.desc}</div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Emergency Type Selector */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Tipo de Emergência — Selecione para ver orientações
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {EMERGENCY_TYPES.map((type) => (
              <button
                key={type.key}
                onClick={() => setSelectedType(type.key === selectedType ? null : type.key)}
                className={`group relative p-4 rounded-2xl border text-left overflow-hidden transition-all duration-300 ${
                  selectedType === type.key
                    ? "bg-gradient-to-br text-white border-transparent shadow-xl " + type.gradient
                    : "bg-white dark:bg-slate-900/80 border-slate-200/60 dark:border-white/5 hover:shadow-lg"
                }`}
                aria-pressed={selectedType === type.key}
              >
                <span className="text-2xl block mb-1">{type.icon}</span>
                <span className={`text-sm font-bold block ${
                  selectedType === type.key ? "text-white" : "text-slate-900 dark:text-white"
                }`}>
                  {type.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Guidelines */}
        {guidelines && typeInfo && (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
            {/* Header */}
            <div className={`p-4 rounded-2xl bg-gradient-to-r ${typeInfo.gradient} text-white`}>
              <h3 className="text-lg font-black flex items-center gap-2">
                {typeInfo.icon} Orientações: {typeInfo.label}
              </h3>
              <p className="text-xs text-white/80 mt-1">Siga estas orientações para sua segurança</p>
            </div>

            {/* DO's */}
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
              <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4" /> O que FAZER
              </h4>
              <div className="space-y-2">
                {guidelines.dos.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="mt-0.5 text-emerald-500 shrink-0">✅</span>
                    <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* DON'Ts */}
            <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <h4 className="text-sm font-bold text-red-700 dark:text-red-300 flex items-center gap-2 mb-3">
                <XCircle className="h-4 w-4" /> O que NÃO fazer
              </h4>
              <div className="space-y-2">
                {guidelines.donts.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="mt-0.5 text-red-500 shrink-0">❌</span>
                    <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Kit */}
            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <h4 className="text-sm font-bold text-amber-700 dark:text-amber-300 flex items-center gap-2 mb-3">
                <Shield className="h-4 w-4" /> Kit de Emergência
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {guidelines.kit.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 rounded-xl">
                    <span className="text-amber-500">📦</span>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Useful Links */}
        <div className="mt-6 p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-4">
            <ExternalLink className="h-4 w-4 text-blue-500" />
            Links Úteis
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { label: "Defesa Civil Nacional", url: "https://www.gov.br/mdr/pt-br/assuntos/protecao-e-defesa-civil", icon: "🛡️" },
              { label: "INPE — Queimadas", url: "https://queimadas.dgi.inpe.br/queimadas/portal", icon: "🔥" },
              { label: "INMET — Alertas", url: "https://alertas2.inmet.gov.br/", icon: "⛈️" },
              { label: "ANA — Nível dos Rios", url: "https://www.snirh.gov.br/hidrotelemetria/", icon: "🌊" },
              { label: "CETESB — Qualidade do Ar", url: "https://cetesb.sp.gov.br/ar/qualar/", icon: "💨" },
              { label: "SOS Mata Atlântica", url: "https://www.sosma.org.br/", icon: "🌳" },
            ].map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors group"
                aria-label={`Abrir ${link.label} em nova aba`}
              >
                <span className="text-lg">{link.icon}</span>
                <span className="flex-1 text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {link.label}
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
              </a>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center">
          <p className="text-[10px] text-slate-400 leading-relaxed">
            ⚠️ As orientações acima são de caráter informativo e baseadas em recomendações da Defesa Civil e Corpo de Bombeiros.
            Em situação de emergência real, siga sempre as orientações das autoridades locais.
            O EcoMonitor não se responsabiliza por decisões tomadas com base exclusiva nestas informações.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
