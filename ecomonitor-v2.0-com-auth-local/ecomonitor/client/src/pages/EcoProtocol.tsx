import { useState } from "react";
import {
  Globe, Code2, Key, Shield, Zap, BarChart3, Server, Lock, Unlock,
  Copy, Check, ChevronDown, ChevronUp, ExternalLink, Terminal,
  FileJson, Activity, GitBranch, Layers, Cpu, Database, Wifi,
  ArrowUpRight, Clock, Users, Leaf, TreePine, AudioLines,
  Droplets, ThermometerSun, MapPin, AlertTriangle, TrendingUp,
} from "lucide-react";
import MainLayout from "@/components/MainLayout";

// ─── Types ───────────────────────────────────────────────────────────

interface Endpoint {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  category: string;
  auth: boolean;
  rateLimit: string;
  example: { request?: string; response: string };
}

interface Partner {
  name: string;
  type: string;
  icon: string;
  description: string;
}

// ─── Constants ───────────────────────────────────────────────────────

const ENDPOINTS: Endpoint[] = [
  {
    method: "GET", path: "/api/v1/irac/calculate", description: "Calcula o Índice de Risco Ambiental Composto (IRAC) para um ponto geográfico",
    category: "IRAC", auth: true, rateLimit: "100/min",
    example: { request: `{\n  "lat": -22.91,\n  "lng": -47.06,\n  "temperature": 32,\n  "humidity": 45,\n  "windSpeed": 12\n}`, response: `{\n  "irac": 0.72,\n  "components": {\n    "thermal": 0.68,\n    "hydric": 0.55,\n    "wind": 0.42,\n    "vegetation": 0.81,\n    "density": 0.73,\n    "seasonal": 0.89\n  },\n  "riskLevel": "high",\n  "models": ["arrhenius", "penman", "rothermel"]\n}` },
  },
  {
    method: "POST", path: "/api/v1/irac/batch", description: "Calcula IRAC em lote para até 50 pontos simultâneos",
    category: "IRAC", auth: true, rateLimit: "10/min",
    example: { response: `{\n  "results": [{ "lat": -22.91, "lng": -47.06, "irac": 0.72 }, ...],\n  "processingTime": "142ms"\n}` },
  },
  {
    method: "GET", path: "/api/v1/occurrences", description: "Lista ocorrências ambientais com filtros por tipo, severidade, período e localização",
    category: "Ocorrências", auth: true, rateLimit: "200/min",
    example: { response: `{\n  "data": [{\n    "id": 1,\n    "type": "fire",\n    "severity": "high",\n    "lat": -22.91,\n    "lng": -47.06,\n    "description": "...",\n    "createdAt": "2026-03-01T10:00:00Z"\n  }],\n  "total": 847,\n  "page": 1\n}` },
  },
  {
    method: "GET", path: "/api/v1/carbon/sequestration", description: "Retorna dados de sequestro de CO₂ por bioma com equações alométricas Chave et al.",
    category: "Carbono", auth: true, rateLimit: "50/min",
    example: { response: `{\n  "biomes": [{\n    "name": "Mata Atlântica",\n    "co2Stock": 1280000,\n    "annualSequestration": 32760,\n    "netBalance": 28400\n  }],\n  "totalCO2Stock": 4250000,\n  "unit": "tCO2"\n}` },
  },
  {
    method: "GET", path: "/api/v1/biodiversity/aci", description: "Índice de Complexidade Acústica (ACI) por ponto de escuta",
    category: "Bioacústica", auth: true, rateLimit: "50/min",
    example: { response: `{\n  "points": [{\n    "name": "Mata Ciliar",\n    "aci": 0.87,\n    "speciesCount": 12,\n    "healthRating": "excellent"\n  }],\n  "globalACI": 0.64\n}` },
  },
  {
    method: "GET", path: "/api/v1/biodiversity/bvi", description: "Biodiversity Verified Index (BVI) — score proprietário de biodiversidade validado por IA",
    category: "Biodiversidade", auth: true, rateLimit: "30/min",
    example: { response: `{\n  "bvi": 72.4,\n  "components": {\n    "acoustic": 0.81,\n    "satellite": 0.68,\n    "species": 0.74,\n    "genetic": 0.66\n  },\n  "certification": "Gold",\n  "confidence": 0.89\n}` },
  },
  {
    method: "POST", path: "/api/v1/climate/decision", description: "Motor de decisão climática — recomendações para pequenos produtores",
    category: "Clima", auth: true, rateLimit: "20/min",
    example: { request: `{\n  "lat": -13.38,\n  "lng": -39.07,\n  "soilType": "latossolo",\n  "areaHa": 5\n}`, response: `{\n  "recommendations": {\n    "crop": "feijão-caupi",\n    "plantWindow": "2026-04-15 a 2026-05-10",\n    "irrigationMm": 4.2,\n    "riskLevel": "moderate"\n  }\n}` },
  },
  {
    method: "GET", path: "/api/v1/municipal/resilience", description: "Score de resiliência municipal com risco hídrico, desertificação e vulnerabilidade",
    category: "Municipal", auth: true, rateLimit: "50/min",
    example: { response: `{\n  "municipality": "Irauçuba-CE",\n  "resilience": 32,\n  "risks": {\n    "hydric": 89,\n    "desertification": 76,\n    "socialVulnerability": 82\n  }\n}` },
  },
  {
    method: "POST", path: "/api/v1/simulate/territorial", description: "Simulação de cenários climáticos futuros (+1.5°C, +2°C) com IA generativa",
    category: "Simulação", auth: true, rateLimit: "5/min",
    example: { request: `{\n  "scenario": "+2.0C",\n  "reforestation": true,\n  "region": "nordeste"\n}`, response: `{\n  "projections": {\n    "waterRisk": 0.82,\n    "cropLoss": 34.5,\n    "economicImpact": -2800000,\n    "temperatureDelta": 2.1\n  },\n  "visualizationUrl": "/sim/abc123"\n}` },
  },
];

const PARTNERS: Partner[] = [
  { name: "INPE", type: "Governo", icon: "🛰️", description: "Dados DETER/PRODES de desmatamento" },
  { name: "MapBiomas", type: "ONG", icon: "🗺️", description: "Cobertura e uso do solo" },
  { name: "SEEG Brasil", type: "Pesquisa", icon: "🏭", description: "Emissões de gases de efeito estufa" },
  { name: "Global Forest Watch", type: "Internacional", icon: "🌍", description: "Monitoramento florestal global" },
  { name: "NASA FIRMS", type: "Espacial", icon: "🔥", description: "Detecção de focos de calor" },
  { name: "CPTEC/INPE", type: "Governo", icon: "⛅", description: "Dados meteorológicos" },
  { name: "ANA", type: "Governo", icon: "💧", description: "Agência Nacional de Águas" },
  { name: "ICMBio", type: "Governo", icon: "🦜", description: "Biodiversidade e UCs" },
];

const METHOD_COLORS = {
  GET: "bg-emerald-500",
  POST: "bg-blue-500",
  PUT: "bg-amber-500",
  DELETE: "bg-red-500",
};

const USAGE_STATS = [
  { label: "Requests/dia", value: "12.4k", trend: "+18%" },
  { label: "Latência P50", value: "42ms", trend: "-5ms" },
  { label: "Projetos conectados", value: "23", trend: "+4" },
  { label: "Uptime", value: "99.97%", trend: "30d" },
];

// ─── Main Component ──────────────────────────────────────────────────

export default function EcoProtocol() {
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>("/api/v1/irac/calculate");
  const [copiedKey, setCopiedKey] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = ["all", ...Array.from(new Set(ENDPOINTS.map(e => e.category)))];
  const filteredEndpoints = selectedCategory === "all" ? ENDPOINTS : ENDPOINTS.filter(e => e.category === selectedCategory);

  const handleCopyKey = () => {
    navigator.clipboard.writeText("eco_live_sk_7f3a8b2c9d1e4f5a6b7c8d9e0f1a2b3c");
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto pb-12 space-y-6">
        {/* Hero */}
        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-cyan-700 via-blue-700 to-indigo-700 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
              <Globe className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">EcoProtocol</h1>
              <p className="text-cyan-100 text-sm">Protocolo Aberto de Dados Ambientais — O Sistema Operacional do Planeta</p>
            </div>
          </div>
          <div className="relative grid grid-cols-4 gap-3 mt-5">
            {USAGE_STATS.map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <div className="text-lg font-black text-white">{s.value}</div>
                <div className="text-[10px] text-cyan-100 font-medium">{s.label}</div>
                <div className="text-[8px] text-cyan-200 font-bold">{s.trend}</div>
              </div>
            ))}
          </div>
        </div>

        {/* API Key + Quick Start */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <Key className="h-4 w-4 text-amber-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">API Key</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 font-mono text-xs text-slate-600 dark:text-slate-300 truncate">
                eco_live_sk_7f3a••••••••••••••••••3c
              </div>
              <button
                onClick={handleCopyKey}
                className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {copiedKey ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-slate-400" />}
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px]">
                <Shield className="h-3 w-3 text-emerald-500" />
                <span className="text-slate-500">OAuth2 + Bearer Token</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <Lock className="h-3 w-3 text-blue-500" />
                <span className="text-slate-500">TLS 1.3 — end-to-end encryption</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <Activity className="h-3 w-3 text-amber-500" />
                <span className="text-slate-500">Rate limiting por tier (Free: 100/min, Pro: 10k/min)</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700 text-green-400">
            <div className="flex items-center gap-2 mb-3">
              <Terminal className="h-4 w-4 text-green-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Start</span>
            </div>
            <pre className="text-[10px] font-mono leading-relaxed overflow-x-auto">
{`# Calcular IRAC para um ponto
curl -X GET \\
  "https://api.ecomonitor.io/v1/irac/calculate\\
    ?lat=-22.91&lng=-47.06\\
    &temperature=32&humidity=45" \\
  -H "Authorization: Bearer eco_live_sk_..."

# Python SDK
from ecomonitor import EcoClient
client = EcoClient(api_key="eco_live_sk_...")
irac = client.irac.calculate(
  lat=-22.91, lng=-47.06, temp=32
)
print(f"IRAC: {irac.score}")`}
            </pre>
          </div>
        </div>

        {/* SDK Examples */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">SDKs Disponíveis</div>
          <div className="grid grid-cols-5 gap-2">
            {[
              { lang: "Python", icon: "🐍", install: "pip install ecomonitor" },
              { lang: "JavaScript", icon: "⚡", install: "npm i @ecomonitor/sdk" },
              { lang: "R", icon: "📊", install: 'install.packages("ecomonitor")' },
              { lang: "Go", icon: "🔵", install: "go get ecomonitor.io/sdk" },
              { lang: "REST", icon: "🌐", install: "curl api.ecomonitor.io" },
            ].map(sdk => (
              <div key={sdk.lang} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="text-xl mb-1">{sdk.icon}</div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{sdk.lang}</div>
                <div className="text-[8px] text-slate-400 font-mono mt-1">{sdk.install}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Endpoints */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Code2 className="h-4 w-4 text-cyan-500" />
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Endpoints da API</h2>
            <div className="flex-1" />
            <span className="text-[9px] text-slate-400 font-bold">{ENDPOINTS.length} endpoints • v1.0</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  selectedCategory === c ? "bg-cyan-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {c === "all" ? "Todos" : c}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {filteredEndpoints.map(ep => {
              const isExpanded = expandedEndpoint === ep.path;
              return (
                <div key={ep.path} className="rounded-xl border border-slate-200/60 dark:border-white/5 overflow-hidden">
                  <button
                    onClick={() => setExpandedEndpoint(isExpanded ? null : ep.path)}
                    className="w-full text-left p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <span className={`text-[9px] font-black text-white px-2 py-0.5 rounded ${METHOD_COLORS[ep.method]}`}>{ep.method}</span>
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">{ep.path}</span>
                    <span className="text-[10px] text-slate-400 flex-1 truncate">{ep.description}</span>
                    {ep.auth && <Lock className="h-3 w-3 text-amber-500" />}
                    {isExpanded ? <ChevronUp className="h-3 w-3 text-slate-400" /> : <ChevronDown className="h-3 w-3 text-slate-400" />}
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-3 animate-in slide-in-from-top-1 duration-200">
                      <div className="flex gap-3 text-[9px] text-slate-400 mb-2">
                        <span>⏱️ Rate: {ep.rateLimit}</span>
                        <span>🔐 Auth: {ep.auth ? "Obrigatório" : "Público"}</span>
                        <span>📁 Categoria: {ep.category}</span>
                      </div>
                      {ep.example.request && (
                        <div className="mb-2">
                          <div className="text-[8px] font-bold text-slate-400 mb-1">REQUEST</div>
                          <pre className="p-2.5 rounded-lg bg-slate-900 text-[10px] text-green-400 font-mono overflow-x-auto">{ep.example.request}</pre>
                        </div>
                      )}
                      <div>
                        <div className="text-[8px] font-bold text-slate-400 mb-1">RESPONSE</div>
                        <pre className="p-2.5 rounded-lg bg-slate-900 text-[10px] text-cyan-400 font-mono overflow-x-auto">{ep.example.response}</pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Architecture */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-4 w-4 text-indigo-500" />
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Arquitetura do Protocolo</h2>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { layer: "Ingestão", icon: Wifi, items: ["Sensores IoT", "Satélite (INPE)", "APIs parceiros", "Bioacústica", "Edge AI"], color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
              { layer: "Processamento", icon: Cpu, items: ["IRAC Engine", "Chave et al.", "ACI/NDSI", "BVI Score", "ML Pipeline"], color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20" },
              { layer: "Armazenamento", icon: Database, items: ["MySQL 8", "Time-series", "Geoespacial", "Cache Redis", "Backups S3"], color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/20" },
              { layer: "Distribuição", icon: Globe, items: ["REST API v1", "WebSocket", "Webhooks", "SDK (5 langs)", "GraphQL (futuro)"], color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-950/20" },
            ].map(l => (
              <div key={l.layer} className={`p-4 rounded-xl ${l.bg}`}>
                <l.icon className={`h-5 w-5 ${l.color} mb-2`} />
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">{l.layer}</div>
                <div className="space-y-1">
                  {l.items.map(item => (
                    <div key={item} className="text-[9px] text-slate-500 flex items-center gap-1">
                      <span className={`w-1 h-1 rounded-full ${l.color.replace("text-", "bg-")}`} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Partners */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <GitBranch className="h-4 w-4 text-cyan-500" />
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Fontes de Dados & Parceiros</h2>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {PARTNERS.map(p => (
              <div key={p.name} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-center">
                <div className="text-2xl mb-1">{p.icon}</div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{p.name}</div>
                <div className="text-[8px] text-slate-400 mt-0.5">{p.type}</div>
                <div className="text-[9px] text-slate-500 mt-1">{p.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Standards */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3">Padrões e Conformidade</h3>
          <div className="flex flex-wrap gap-1.5">
            {["OGC SensorThings", "ISO 19115 (Metadados Geo)", "W3C PROV-O (Proveniência)", "INSPIRE Directive (EU)", "GeoJSON RFC 7946", "OpenAPI 3.1", "OAuth 2.0", "LGPD (Brasil)", "GDPR (EU)"].map(ref => (
              <span key={ref} className="text-[8px] font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-500 border border-slate-200 dark:border-slate-700">{ref}</span>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
