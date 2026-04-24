import { useState, useRef, useEffect } from "react";
import {
  Send, Bot, User, Loader2, Trash2, ArrowLeft, Copy, Check,
  ThumbsUp, ThumbsDown, Sparkles, Leaf, Droplets, Flame, Wind,
  MapPin, HelpCircle, Lightbulb, ChevronRight, MessageCircle,
  RotateCcw, Volume2, Star,
} from "lucide-react";
import { Link } from "wouter";
import MainLayout from "@/components/MainLayout";

// ─── Types & Config ──────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  reaction?: "like" | "dislike" | null;
  category?: string;
}

const TOPIC_CATEGORIES = [
  {
    id: "reportar",
    icon: "📝",
    label: "Reportar",
    color: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-800",
    questions: [
      "Como reportar uma ocorrência?",
      "Quais tipos de ocorrências posso reportar?",
      "Preciso adicionar fotos?",
    ],
  },
  {
    id: "mapa",
    icon: "🗺️",
    label: "Mapa",
    color: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
    questions: [
      "Como funciona o mapa?",
      "O que significam as cores no mapa?",
      "Como filtrar ocorrências?",
    ],
  },
  {
    id: "poluicao",
    icon: "💨",
    label: "Poluição",
    color: "from-purple-500 to-violet-500",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-200 dark:border-purple-800",
    questions: [
      "O que é poluição sonora?",
      "Tipos de poluição ambiental",
      "Como medir a qualidade do ar?",
    ],
  },
  {
    id: "dicas",
    icon: "🌿",
    label: "Dicas",
    color: "from-amber-500 to-orange-500",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-800",
    questions: [
      "Dicas para preservar o meio ambiente",
      "Como economizar água?",
      "O que é sustentabilidade?",
    ],
  },
];

const QUICK_REPLIES = [
  { text: "Como reportar uma ocorrência?", emoji: "📝" },
  { text: "O que é poluição sonora?", emoji: "🔊" },
  { text: "Como funciona o mapa?", emoji: "🗺️" },
  { text: "Dicas para preservar o meio ambiente", emoji: "🌱" },
  { text: "O que é o EcoMonitor?", emoji: "🌍" },
  { text: "Ajuda", emoji: "❓" },
];

const LOCAL_RESPONSES: Record<string, string> = {
  "como reportar uma ocorrência?":
    "Para reportar uma ocorrência ambiental:\n\n1️⃣ Acesse o menu **'Reportar'**\n2️⃣ Escolha a categoria (poluição, desmatamento, etc)\n3️⃣ Marque a localização no mapa interativo\n4️⃣ Descreva o problema e adicione fotos\n5️⃣ Envie o relatório para análise\n\n✅ Sua ocorrência será analisada pela equipe e você ganhará **+10 pontos**!",
  "quais tipos de ocorrências posso reportar?":
    "Você pode reportar diversos tipos de ocorrências:\n\n🔥 **Incêndio** — Queimadas e focos de fogo\n💧 **Poluição Hídrica** — Contaminação de rios e lagos\n💨 **Poluição do Ar** — Emissões tóxicas e fumaça\n🏜️ **Seca** — Áreas em estado de estiagem\n🌳 **Desmatamento** — Destruição de vegetação\n🌊 **Enchente** — Alagamentos e inundações\n⚠️ **Outros** — Qualquer outro problema ambiental",
  "preciso adicionar fotos?":
    "Fotos são **altamente recomendadas** para dar credibilidade ao relatório!\n\n📸 Aceitos: JPG, PNG, WebP (até 5MB)\n📐 Resolução mínima: 800×800px\n📁 Limite: até 5 fotos por relatório\n\n⚠️ Para ocorrências de **severidade crítica**, pelo menos 1 foto é **obrigatória**.",
  "o que é poluição sonora?":
    "**Poluição sonora** é o excesso de ruídos que causa danos à saúde e ao bem-estar. 🔊\n\nExemplos comuns:\n• 🚗 Trânsito intenso\n• 🏗️ Obras de construção\n• 🎵 Eventos com som alto\n• 🏭 Indústrias barulhentas\n\n**Impactos na saúde:**\n• Estresse e ansiedade\n• Perda auditiva\n• Distúrbios do sono\n• Problemas cardiovasculares\n\n📱 Você pode reportar poluição sonora pelo EcoMonitor!",
  "tipos de poluição ambiental":
    "Os principais tipos de poluição ambiental são:\n\n💧 **Hídrica** — Contaminação de rios, lagos e oceanos\n💨 **Atmosférica** — Emissão de gases e partículas no ar\n🔊 **Sonora** — Ruídos excessivos\n🏭 **Do Solo** — Contaminação por resíduos tóxicos\n💡 **Visual** — Excesso de publicidade e edificações\n☢️ **Radioativa** — Resíduos nucleares\n🌡️ **Térmica** — Aquecimento de ecossistemas aquáticos\n\nTodas afetam diretamente a saúde humana e o equilíbrio ecológico.",
  "como medir a qualidade do ar?":
    "A qualidade do ar é medida pelo **Índice de Qualidade do Ar (IQA)**:\n\n🟢 **0-50** — Boa (sem riscos)\n🟡 **51-100** — Moderada (atenção para sensíveis)\n🟠 **101-150** — Ruim (grupos sensíveis afetados)\n🔴 **151-200** — Muito Ruim (toda população afetada)\n🟤 **201-300** — Péssima (alerta de emergência)\n⚫ **300+** — Crítica (risco sério à saúde)\n\n📱 O EcoMonitor monitora esses índices na sua região!",
  "como funciona o mapa?":
    "O mapa do EcoMonitor exibe todas as ocorrências ambientais reportadas:\n\n🟢 **Verde** = Resolvida\n🟡 **Amarelo** = Em andamento\n🔴 **Vermelho** = Pendente\n\n**Recursos do mapa:**\n• 🔍 Filtros por categoria e severidade\n• 🌡️ Mapa de calor (áreas mais afetadas)\n• 📍 GPS para localização atual\n• 🗂️ Diferentes estilos de mapa\n• 📊 Estatísticas por região",
  "o que significam as cores no mapa?":
    "As cores no mapa indicam o **status** de cada ocorrência:\n\n🟢 **Verde** — Ocorrência resolvida\n🟡 **Amarelo** — Em andamento (sendo tratada)\n🔴 **Vermelho** — Pendente (aguardando ação)\n\nOs **marcadores** indicam o tipo:\n🔥 Incêndio | 💧 Poluição | 💨 Ar | 🌳 Desmatamento\n\nO **mapa de calor** mostra as zonas com mais concentração de problemas.",
  "como filtrar ocorrências?":
    "Para filtrar ocorrências no mapa:\n\n1️⃣ Use o painel lateral de **filtros**\n2️⃣ Selecione por **tipo** (incêndio, poluição, etc)\n3️⃣ Filtre por **severidade** (baixa → crítica)\n4️⃣ Defina o **período** de datas\n5️⃣ Ative/desative o **mapa de calor**\n\n🔍 Os filtros se combinam para refinar a busca!",
  "dicas para preservar o meio ambiente":
    "Aqui vão dicas importantes para o dia a dia:\n\n🌿 **Reduza** o consumo de plásticos descartáveis\n💧 **Economize** água — feche a torneira!\n♻️ **Separe** o lixo para reciclagem\n🚶 **Prefira** transporte sustentável\n🌳 **Plante** árvores quando possível\n🔌 **Desligue** aparelhos não utilizados\n🛒 **Compre** de produtores locais\n📱 **Use** o EcoMonitor para reportar problemas!\n\n💚 Cada pequena ação faz diferença!",
  "como economizar água?":
    "Dicas para economizar água no dia a dia:\n\n🚿 **Banho** — Reduza para 5 minutos\n🪥 **Escovando dentes** — Feche a torneira\n🧽 **Louça** — Use bacia para enxaguar\n🚗 **Lavar carro** — Use balde, não mangueira\n🌧️ **Reaproveite** água da chuva\n🚰 **Verifique** vazamentos regularmente\n🌱 **Jardim** — Regue pela manhã ou noite\n\n💧 Cada gota conta! O Brasil tem 12% da água doce do mundo, mas desperdiçamos muito.",
  "o que é sustentabilidade?":
    "**Sustentabilidade** é o uso responsável dos recursos naturais garantindo que as futuras gerações também possam utilizá-los.\n\nPilares da sustentabilidade:\n🌍 **Ambiental** — Preservar ecossistemas\n👥 **Social** — Justiça e qualidade de vida\n💰 **Econômico** — Desenvolvimento responsável\n\n**Na prática:**\n• Energia renovável (solar, eólica)\n• Economia circular (reciclar, reutilizar)\n• Consumo consciente\n• Mobilidade sustentável\n\n📱 O EcoMonitor contribui para a sustentabilidade urbana!",
  "o que é o ecomonitor?":
    "O **EcoMonitor** é uma plataforma de monitoramento ambiental colaborativo! 🌍\n\n**Funcionalidades principais:**\n📝 Reportar ocorrências ambientais\n🗺️ Mapa interativo geoespacial\n📊 Dashboard com análises e estatísticas\n🔔 Alertas geoespaciais em tempo real\n🤖 Chatbot inteligente (eu! 😄)\n🏆 Sistema de gamificação com pontos\n\n**Missão:** Empoderar cidadãos para proteger o meio ambiente através da tecnologia.\n\n💚 Cada relatório faz diferença!",
};

function getLocalResponse(input: string): string {
  const normalized = input.toLowerCase().trim();

  if (LOCAL_RESPONSES[normalized]) return LOCAL_RESPONSES[normalized];

  if (normalized.includes("reportar") || normalized.includes("ocorrência") || normalized.includes("denunci"))
    return LOCAL_RESPONSES["como reportar uma ocorrência?"];
  if (normalized.includes("tipo") && (normalized.includes("ocorrência") || normalized.includes("report")))
    return LOCAL_RESPONSES["quais tipos de ocorrências posso reportar?"];
  if (normalized.includes("foto"))
    return LOCAL_RESPONSES["preciso adicionar fotos?"];
  if (normalized.includes("poluição sonora") || normalized.includes("barulho") || normalized.includes("ruído"))
    return LOCAL_RESPONSES["o que é poluição sonora?"];
  if (normalized.includes("tipo") && normalized.includes("poluição"))
    return LOCAL_RESPONSES["tipos de poluição ambiental"];
  if (normalized.includes("qualidade do ar") || normalized.includes("iqa"))
    return LOCAL_RESPONSES["como medir a qualidade do ar?"];
  if (normalized.includes("mapa") && (normalized.includes("funciona") || normalized.includes("como")))
    return LOCAL_RESPONSES["como funciona o mapa?"];
  if (normalized.includes("cor") && normalized.includes("mapa"))
    return LOCAL_RESPONSES["o que significam as cores no mapa?"];
  if (normalized.includes("filtr"))
    return LOCAL_RESPONSES["como filtrar ocorrências?"];
  if (normalized.includes("dica") || normalized.includes("preserv"))
    return LOCAL_RESPONSES["dicas para preservar o meio ambiente"];
  if (normalized.includes("economizar") && normalized.includes("água"))
    return LOCAL_RESPONSES["como economizar água?"];
  if (normalized.includes("sustentab"))
    return LOCAL_RESPONSES["o que é sustentabilidade?"];
  if (normalized.includes("ecomonitor") || normalized.includes("plataforma"))
    return LOCAL_RESPONSES["o que é o ecomonitor?"];
  if (normalized.includes("mapa"))
    return LOCAL_RESPONSES["como funciona o mapa?"];
  if (normalized.includes("poluição"))
    return LOCAL_RESPONSES["tipos de poluição ambiental"];
  if (normalized.includes("meio ambiente"))
    return LOCAL_RESPONSES["dicas para preservar o meio ambiente"];
  if (normalized.includes("olá") || normalized.includes("oi") || normalized.includes("hey") || normalized.includes("bom dia") || normalized.includes("boa tarde") || normalized.includes("boa noite"))
    return "Olá! 👋 Que bom te ver por aqui!\n\nSou o **EcoBot**, seu assistente ambiental virtual. Posso ajudar com:\n\n📝 Como reportar ocorrências\n🗺️ Usar o mapa interativo\n💨 Informações sobre poluição\n🌿 Dicas de sustentabilidade\n\nSobre o que gostaria de saber?";
  if (normalized.includes("obrigad"))
    return "De nada! 😊💚\n\nFico feliz em ajudar! Se tiver mais dúvidas sobre o meio ambiente ou a plataforma, é só perguntar.\n\n🌍 Juntos fazemos a diferença!";
  if (normalized.includes("ajuda") || normalized.includes("help"))
    return "Posso te ajudar com diversos assuntos! 🤝\n\n📝 **Reportar** — Como registrar ocorrências\n🗺️ **Mapa** — Navegação e filtros\n💨 **Poluição** — Tipos e impactos\n🌿 **Sustentabilidade** — Dicas práticas\n🌡️ **Qualidade do ar** — Índices e medição\n💧 **Água** — Economia e preservação\n\nEscolha um tema ou faça sua pergunta!";

  return "Entendi sua pergunta! 🤔 Ainda estou expandindo meu conhecimento sobre esse assunto.\n\nEnquanto isso, posso te ajudar com:\n• 📝 Como reportar ocorrências\n• 🗺️ Usar o mapa de ocorrências\n• 💨 Tipos de poluição\n• 🌿 Dicas ambientais\n• 🌍 Sobre o EcoMonitor\n\nOu fale com nossa equipe: **suporte@ecomonitor.com** 📧";
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// ─── Message Bubble ──────────────────────────────────────────────────

function MessageBubble({
  msg,
  onReact,
  onCopy,
}: {
  msg: Message;
  onReact: (id: string, reaction: "like" | "dislike") => void;
  onCopy: (content: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === "user";

  const handleCopy = () => {
    onCopy(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple markdown-like rendering for bold text
  const renderContent = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-extrabold">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} group`}>
      {/* Bot avatar */}
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="relative h-9 w-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Bot className="h-4.5 w-4.5 text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900" />
          </div>
        </div>
      )}

      <div className={`max-w-[80%] sm:max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        {/* Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
            isUser
              ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-br-md shadow-lg shadow-emerald-500/20"
              : "bg-white dark:bg-slate-800/90 text-gray-700 dark:text-gray-200 border border-gray-200/60 dark:border-gray-700/60 rounded-bl-md shadow-md"
          }`}
        >
          {isUser ? msg.content : renderContent(msg.content)}
        </div>

        {/* Meta row */}
        <div className={`flex items-center gap-2 mt-1 ${isUser ? "flex-row-reverse" : ""}`}>
          <span className="text-[10px] text-gray-400 font-semibold">{formatTime(msg.timestamp)}</span>

          {/* Actions for bot messages */}
          {!isUser && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="h-6 w-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Copiar"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              </button>
              <button
                onClick={() => onReact(msg.id, "like")}
                className={`h-6 w-6 rounded-lg flex items-center justify-center transition-colors ${
                  msg.reaction === "like"
                    ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                    : "text-gray-400 hover:text-emerald-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                title="Útil"
              >
                <ThumbsUp className="h-3 w-3" />
              </button>
              <button
                onClick={() => onReact(msg.id, "dislike")}
                className={`h-6 w-6 rounded-lg flex items-center justify-center transition-colors ${
                  msg.reaction === "dislike"
                    ? "text-red-500 bg-red-50 dark:bg-red-900/20"
                    : "text-gray-400 hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                title="Não útil"
              >
                <ThumbsDown className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <User className="h-4.5 w-4.5 text-white" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Typing Indicator ────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="flex-shrink-0 mt-1">
        <div className="relative h-9 w-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Bot className="h-4.5 w-4.5 text-white" />
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800/90 border border-gray-200/60 dark:border-gray-700/60 rounded-2xl rounded-bl-md px-5 py-3.5 shadow-md">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="h-2 w-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="h-2 w-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="h-2 w-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <span className="text-[11px] text-gray-400 font-semibold ml-1">EcoBot digitando...</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Olá! 🌿 Sou o **EcoBot**, assistente virtual do EcoMonitor.\n\nPosso ajudar com dúvidas sobre meio ambiente, como usar a plataforma e informações sobre ocorrências ambientais.\n\nEscolha um tema abaixo ou digite sua pergunta!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setActiveCategory(null);
    setLoading(true);

    const delay = Math.min(600 + text.length * 15, 2500);
    await new Promise((resolve) => setTimeout(resolve, delay));

    const response = getLocalResponse(text);

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, botMessage]);
    setLoading(false);
    inputRef.current?.focus();
  };

  const handleSend = () => sendMessage(input);

  const handleReact = (messageId: string, reaction: "like" | "dislike") => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, reaction: msg.reaction === reaction ? null : reaction }
          : msg
      )
    );
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content.replace(/\*\*/g, ""));
  };

  const handleClear = () => {
    setMessages([
      {
        id: "restart",
        role: "assistant",
        content: "Conversa reiniciada! 🔄\n\nComo posso te ajudar agora?",
        timestamp: new Date(),
      },
    ]);
    setActiveCategory(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const messageCount = messages.filter((m) => m.role === "user").length;

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50/30 via-white to-teal-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 -m-6 flex flex-col" style={{ height: "calc(100vh - 0px)" }}>

        {/* ──── Header ──── */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-5 shadow-xl shadow-emerald-900/20 flex-shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-8 -translate-x-8" />

          <div className="relative max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-emerald-600 animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold text-white flex items-center gap-2">
                  EcoBot
                  <span className="text-[10px] font-bold bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">IA</span>
                </h1>
                <p className="text-emerald-100 text-xs flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  Assistente ambiental • Online
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {messageCount > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-white/70 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-xl">
                  <MessageCircle className="h-3.5 w-3.5" /> {messageCount} msg
                </span>
              )}
              <button
                onClick={handleClear}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
                title="Reiniciar conversa"
              >
                <RotateCcw className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* ──── Messages Area ──── */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                onReact={handleReact}
                onCopy={handleCopy}
              />
            ))}

            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ──── Topic Categories (shown when few messages) ──── */}
        {messages.length <= 3 && !loading && (
          <div className="px-4 pb-2 flex-shrink-0">
            <div className="max-w-3xl mx-auto">
              {/* Category buttons */}
              {!activeCategory && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                    Explore por tema
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {TOPIC_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${cat.bg} ${cat.border}`}
                      >
                        <span className="text-xl">{cat.icon}</span>
                        <div className="text-left">
                          <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{cat.label}</p>
                          <p className="text-[10px] text-gray-500">{cat.questions.length} perguntas</p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-gray-400 ml-auto" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Questions for active category */}
              {activeCategory && (
                <div>
                  <button
                    onClick={() => setActiveCategory(null)}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline mb-2 flex items-center gap-1"
                  >
                    ← Voltar aos temas
                  </button>
                  <div className="flex flex-col gap-2">
                    {TOPIC_CATEGORIES.find((c) => c.id === activeCategory)?.questions.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="text-left px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-300"
                      >
                        <span className="mr-2">💬</span> {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ──── Quick Replies (always show if not in category mode) ──── */}
        {!activeCategory && !loading && (
          <div className="px-4 pb-2 flex-shrink-0">
            <div className="max-w-3xl mx-auto">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {QUICK_REPLIES.map((reply) => (
                  <button
                    key={reply.text}
                    onClick={() => sendMessage(reply.text)}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-2xl border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-900/15 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:border-emerald-300 transition-all hover:-translate-y-0.5"
                  >
                    <span>{reply.emoji}</span>
                    {reply.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ──── Input Area ──── */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-t border-gray-200/60 dark:border-gray-800/60 px-4 py-3 flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua mensagem para o EcoBot..."
                  disabled={loading}
                  maxLength={500}
                  className="w-full rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 px-4 py-3 pr-12 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60 transition-all"
                />
                {input.length > 0 && (
                  <span className="absolute right-14 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-300">
                    {input.length}/500
                  </span>
                )}
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="h-12 w-12 flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2 font-semibold">
              EcoBot • Assistente ambiental com respostas locais — sem uso de dados externos
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default ChatbotPage;