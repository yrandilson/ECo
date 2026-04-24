import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  AlertCircle,
  Map,
  TrendingUp,
  Users,
  Zap,
  Sun,
  Moon,
  Leaf,
  Shield,
  BarChart3,
  Satellite,
  Brain,
  ArrowRight,
  ChevronRight,
  Globe2,
  Flame,
  Droplets,
  Wind,
  MessageCircle,
  Trophy,
  Sparkles,
} from "lucide-react";
import { Link } from "wouter";
import { useEffect, useRef, useState } from "react";

// Animated counter hook
function useCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, end, duration]);

  return { count, ref };
}

const features = [
  {
    icon: AlertCircle,
    title: "Reporte Inteligente",
    desc: "Registre problemas ambientais com foto, GPS e pesquisa por Estado/Município/Bairro via IBGE",
    gradient: "from-red-500 to-orange-500",
    glow: "group-hover:shadow-red-500/25",
  },
  {
    icon: Map,
    title: "Mapa Interativo",
    desc: "Visualize todas as ocorrências no mapa em tempo real com filtros e clusters",
    gradient: "from-blue-500 to-cyan-500",
    glow: "group-hover:shadow-blue-500/25",
  },
  {
    icon: Flame,
    title: "Motor de Física",
    desc: "6 modelos científicos (Arrhenius, Rothermel, Penman, Gauss) calculam riscos reais",
    gradient: "from-orange-500 to-amber-500",
    glow: "group-hover:shadow-orange-500/25",
  },
  {
    icon: Zap,
    title: "Simuladores",
    desc: "3 simuladores interativos de incêndio, qualidade da água e desmatamento",
    gradient: "from-violet-500 to-purple-500",
    glow: "group-hover:shadow-violet-500/25",
  },
  {
    icon: Brain,
    title: "Machine Learning",
    desc: "3 algoritmos de IA prevêem risco de incêndio para os próximos 7 dias",
    gradient: "from-emerald-500 to-teal-500",
    glow: "group-hover:shadow-emerald-500/25",
  },
  {
    icon: Satellite,
    title: "Validação NASA",
    desc: "Dados do satélite NASA FIRMS validam automaticamente reportes de incêndio",
    gradient: "from-indigo-500 to-blue-500",
    glow: "group-hover:shadow-indigo-500/25",
  },
  {
    icon: MessageCircle,
    title: "Chatbot IA",
    desc: "Assistente baseado em GPT responde dúvidas sobre meio ambiente e emergências",
    gradient: "from-pink-500 to-rose-500",
    glow: "group-hover:shadow-pink-500/25",
  },
  {
    icon: Trophy,
    title: "Gamificação",
    desc: "Ganhe pontos, badges e suba no ranking contribuindo com reportes",
    gradient: "from-amber-500 to-yellow-500",
    glow: "group-hover:shadow-amber-500/25",
  },
];

const techStack = [
  { name: "React 19", color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300" },
  { name: "TypeScript", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  { name: "Node.js", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  { name: "MySQL", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  { name: "WebSocket", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  { name: "NASA FIRMS", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  { name: "OpenAI", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  { name: "Leaflet.js", color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300" },
];

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { theme, toggleTheme, switchable } = useTheme();

  const stat1 = useCounter(15000, 2500);
  const stat2 = useCounter(6);
  const stat3 = useCounter(3);
  const stat4 = useCounter(20);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-400/30 rounded-xl blur-md" />
              <div className="relative rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-2 shadow-lg shadow-emerald-500/20">
                <Leaf className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent leading-tight">
                EcoMonitor
              </span>
              <span className="text-[10px] font-medium text-emerald-600/50 dark:text-emerald-400/40 tracking-wider uppercase hidden sm:block">
                Monitoramento Ambiental
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {switchable && toggleTheme && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-xl h-9 w-9"
                aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"}
              >
                {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
              </Button>
            )}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link href="/dashboard">
                  <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/report">
                  <Button variant="outline" className="rounded-xl border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Reportar
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" className="rounded-xl">
                    Entrar
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all">
                    Criar Conta
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 px-4">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 -left-32 w-96 h-96 bg-emerald-200/30 dark:bg-emerald-500/10 rounded-full blur-3xl animate-eco-float" />
          <div className="absolute top-40 -right-32 w-80 h-80 bg-teal-200/30 dark:bg-teal-500/10 rounded-full blur-3xl animate-eco-float-delay" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-t from-emerald-100/50 to-transparent dark:from-emerald-500/5 rounded-full blur-3xl" />

          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        </div>

        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-900/30 border border-emerald-200/50 dark:border-emerald-800/50 mb-6 animate-eco-fade-up">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 tracking-wide">
              Monitoramento Ambiental com IA + Física Computacional
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 animate-eco-fade-up"
            style={{ animationDelay: "100ms" }}>
            <span className="text-slate-900 dark:text-white">Proteja o</span>
            <br />
            <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              Meio Ambiente
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-eco-fade-up"
            style={{ animationDelay: "200ms" }}>
            Plataforma colaborativa que integra <strong className="text-slate-800 dark:text-slate-200">modelos de física</strong>,{" "}
            <strong className="text-slate-800 dark:text-slate-200">machine learning</strong> e{" "}
            <strong className="text-slate-800 dark:text-slate-200">dados de satélite da NASA</strong>{" "}
            para monitorar riscos ambientais em tempo real.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16 animate-eco-fade-up" style={{ animationDelay: "300ms" }}>
            {isAuthenticated ? (
              <>
                <Link href="/report">
                  <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl px-8 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all text-base h-12">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Reportar Ocorrência
                  </Button>
                </Link>
                <Link href="/map">
                  <Button size="lg" variant="outline" className="rounded-xl px-8 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-base h-12">
                    <Map className="w-5 h-5 mr-2" />
                    Explorar Mapa
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/register">
                  <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl px-8 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all text-base h-12">
                    Começar Agora
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button size="lg" variant="outline" className="rounded-xl px-8 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-base h-12">
                    Saiba Mais
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          {loading && <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500" />}

          {/* Tech stack pills */}
          <div className="flex flex-wrap gap-2 justify-center animate-eco-fade-up" style={{ animationDelay: "400ms" }}>
            {techStack.map((tech) => (
              <span key={tech.name} className={`text-xs font-medium px-3 py-1 rounded-full ${tech.color}`}>
                {tech.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 border-y border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div ref={stat1.ref} className="text-center">
              <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {stat1.count.toLocaleString()}+
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Linhas de Código</p>
            </div>
            <div ref={stat2.ref} className="text-center">
              <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-br from-orange-500 to-amber-500 bg-clip-text text-transparent">
                {stat2.count}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Modelos de Física</p>
            </div>
            <div ref={stat3.ref} className="text-center">
              <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-br from-violet-500 to-purple-500 bg-clip-text text-transparent">
                {stat3.count}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Algoritmos de ML</p>
            </div>
            <div ref={stat4.ref} className="text-center">
              <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-br from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                {stat4.count}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Páginas na Interface</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-28 px-4 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 -right-40 w-80 h-80 bg-emerald-100/40 dark:bg-emerald-500/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-100/80 text-emerald-700 border-emerald-200/50 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50">
              Funcionalidades
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Tudo o que você precisa para{" "}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                monitorar
              </span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
              Da reportagem até a previsão com inteligência artificial
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className={`group relative p-5 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm hover:shadow-xl ${f.glow} transition-all duration-300 hover:-translate-y-1`}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${f.gradient} mb-4 shadow-lg`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1.5 text-[15px]">
                    {f.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-slate-50/50 dark:bg-slate-900/30 border-y border-slate-200/50 dark:border-white/5">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100/80 text-blue-700 border-blue-200/50 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50">
              Como Funciona
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Simples como{" "}
              <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                1, 2, 3
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: AlertCircle,
                title: "Reporte",
                desc: "Encontrou um problema ambiental? Tire foto, marque no mapa e envie. O sistema calcula o risco automaticamente.",
                color: "from-rose-500 to-orange-500",
              },
              {
                step: "02",
                icon: Shield,
                title: "Validação",
                desc: "A plataforma cruza seu reporte com dados NASA FIRMS e OpenWeatherMap para validação científica.",
                color: "from-blue-500 to-indigo-500",
              },
              {
                step: "03",
                icon: BarChart3,
                title: "Análise",
                desc: "O IRAC (Índice de Risco Ambiental) e modelos de ML geram alertas e previsões para a comunidade.",
                color: "from-emerald-500 to-teal-500",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="relative text-center group">
                  <div className="inline-flex items-center justify-center mb-6">
                    <div className="relative">
                      <div className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity`} />
                      <div className={`relative h-16 w-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-slate-400 dark:text-slate-600 mb-2 tracking-widest">
                    PASSO {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Environmental types */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Monitoramos todos os{" "}
              <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                riscos ambientais
              </span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Flame, label: "Incêndios", desc: "Arrhenius + Rothermel", color: "from-red-500/10 to-orange-500/10 dark:from-red-500/5 dark:to-orange-500/5", iconColor: "text-red-500", border: "border-red-200/50 dark:border-red-900/30" },
              { icon: Droplets, label: "Poluição Hídrica", desc: "Penman + DBO/pH", color: "from-blue-500/10 to-cyan-500/10 dark:from-blue-500/5 dark:to-cyan-500/5", iconColor: "text-blue-500", border: "border-blue-200/50 dark:border-blue-900/30" },
              { icon: Wind, label: "Poluição do Ar", desc: "Pluma Gaussiana", color: "from-slate-500/10 to-gray-500/10 dark:from-slate-500/5 dark:to-gray-500/5", iconColor: "text-slate-500", border: "border-slate-200/50 dark:border-slate-700/30" },
              { icon: Globe2, label: "Desmatamento", desc: "Cobertura Vegetal", color: "from-emerald-500/10 to-green-500/10 dark:from-emerald-500/5 dark:to-green-500/5", iconColor: "text-emerald-500", border: "border-emerald-200/50 dark:border-emerald-900/30" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={`p-6 rounded-2xl bg-gradient-to-br ${item.color} border ${item.border} text-center hover:scale-[1.02] transition-transform`}
                >
                  <Icon className={`h-10 w-10 mx-auto mb-3 ${item.iconColor}`} />
                  <h3 className="font-bold text-slate-900 dark:text-white mb-1">{item.label}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:3rem_3rem]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-300/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="container mx-auto max-w-3xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm mb-6">
            <Globe2 className="h-3.5 w-3.5 text-emerald-200" />
            <span className="text-xs font-medium text-emerald-100">Faça parte da mudança</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Pronto para proteger o meio ambiente?
          </h2>
          <p className="text-lg text-emerald-100/80 mb-8 max-w-xl mx-auto">
            Junte-se à plataforma que une ciência, tecnologia e cidadania para
            monitorar e preservar nossos recursos naturais.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!isAuthenticated ? (
              <>
                <Link href="/register">
                  <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl px-8 shadow-xl shadow-black/10 font-semibold h-12 text-base">
                    Criar Conta Gratuita
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button size="lg" variant="outline" className="rounded-xl px-8 border-white/30 text-white hover:bg-white/10 h-12 text-base">
                    Saiba Mais
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/dashboard">
                <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl px-8 shadow-xl shadow-black/10 font-semibold h-12 text-base">
                  Ir para o Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-slate-400 py-12 px-4 border-t border-slate-800 dark:border-white/5">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-2">
                <Leaf className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold text-white">EcoMonitor</span>
              <span className="text-xs text-slate-600">v2.1</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/about">
                <span className="hover:text-white transition-colors cursor-pointer">Sobre</span>
              </Link>
              <Link href="/login">
                <span className="hover:text-white transition-colors cursor-pointer">Entrar</span>
              </Link>
              <Link href="/register">
                <span className="hover:text-white transition-colors cursor-pointer">Cadastro</span>
              </Link>
            </div>
            <p className="text-xs text-slate-600">
              &copy; 2026 EcoMonitor · TCC Sistemas de Informação
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
