import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Map,
  AlertCircle,
  FileText,
  Settings,
  TrendingUp,
  Users,
  Zap,
  Activity,
  Download,
  LogOut,
  Menu,
  X,
  Home,
  Leaf,
  Sun,
  Moon,
  ChevronLeft,
  Bell,
  Sparkles,
  MessageCircle,
  Shield,
  Globe,
  Scale,
  Heart,
  DollarSign,
  Award,
  Wheat,
  FileBarChart,
  TreePine,
  AudioLines,
  Landmark,
  Sprout,
  Code2,
  Microscope,
  Cpu,
  Building2,
  Compass,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

interface MainLayoutProps {
  children: ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  path: string;
  icon: any;
  label: string;
  badge?: string;
  badgeColor?: string;
  adminOnly?: boolean;
}

const navSections: NavSection[] = [
  {
    title: "Principal",
    items: [
      { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { path: "/map", icon: Map, label: "Mapa" },
      { path: "/feed", icon: Activity, label: "Feed", badge: "Novo", badgeColor: "bg-blue-500" },
    ],
  },
  {
    title: "Ações",
    items: [
      { path: "/report", icon: FileText, label: "Reportar" },
      { path: "/complaint", icon: Scale, label: "Denúncia Formal", badge: "Lei", badgeColor: "bg-indigo-500" },
      { path: "/alerts", icon: AlertCircle, label: "Alertas" },
      { path: "/emergency", icon: AlertCircle, label: "Emergência", badge: "SOS", badgeColor: "bg-red-500" },
      { path: "/chatbot", icon: MessageCircle, label: "Chatbot IA", badge: "IA", badgeColor: "bg-purple-500" },
    ],
  },
  {
    title: "Análise",
    items: [
      { path: "/iem", icon: Globe, label: "Índice IEM", badge: "Novo", badgeColor: "bg-emerald-500" },
      { path: "/simulators", icon: Zap, label: "Simuladores" },
      { path: "/predictive", icon: TrendingUp, label: "Previsões ML", badge: "ML", badgeColor: "bg-amber-500" },
      { path: "/activity", icon: Activity, label: "Histórico" },
      { path: "/export", icon: Download, label: "Exportar" },
      { path: "/report-pdf", icon: FileBarChart, label: "Relatório PDF", badge: "PDF", badgeColor: "bg-rose-500" },
    ],
  },
  {
    title: "Saúde & Impacto",
    items: [
      { path: "/health", icon: Heart, label: "Saúde Ambiental", badge: "Novo", badgeColor: "bg-red-500" },
      { path: "/losses", icon: DollarSign, label: "Perdas e Danos", badge: "R$", badgeColor: "bg-orange-500" },
      { path: "/green-seal", icon: Award, label: "Selo Verde ESG", badge: "ESG", badgeColor: "bg-emerald-500" },
      { path: "/crop-forecast", icon: Wheat, label: "Previsão Safra", badge: "Agro", badgeColor: "bg-lime-600" },
      { path: "/carbon", icon: TreePine, label: "Sequestro CO₂", badge: "CO₂", badgeColor: "bg-teal-600" },
      { path: "/bioacoustics", icon: AudioLines, label: "Bioacústica", badge: "Bio", badgeColor: "bg-violet-500" },
    ],
  },
  {
    title: "Inovação",
    items: [
      { path: "/nature-dao", icon: Landmark, label: "NatureDAO", badge: "DAO", badgeColor: "bg-emerald-600" },
      { path: "/climate-justice", icon: Scale, label: "Justiça Climática", badge: "ReFi", badgeColor: "bg-indigo-500" },
      { path: "/internet-of-seeds", icon: Sprout, label: "Internet das Sementes", badge: "IoT", badgeColor: "bg-lime-600" },
      { path: "/eco-protocol", icon: Code2, label: "EcoProtocol API", badge: "Dev", badgeColor: "bg-slate-600" },
      { path: "/biodiversity-index", icon: Microscope, label: "Índice BVI", badge: "BVI", badgeColor: "bg-teal-600" },
      { path: "/climate-decision", icon: Cpu, label: "Motor Decisão", badge: "Agro", badgeColor: "bg-orange-500" },
      { path: "/municipal-resilience", icon: Building2, label: "Resiliência Municipal", badge: "B2G", badgeColor: "bg-blue-600" },
      { path: "/territorial-simulator", icon: Compass, label: "Simulador Territorial", badge: "IA", badgeColor: "bg-cyan-600" },
    ],
  },
  {
    title: "Sistema",
    items: [
      { path: "/settings", icon: Settings, label: "Configurações" },
      { path: "/admin", icon: Shield, label: "Admin", adminOnly: true },
    ],
  },
];

export default function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme, switchable } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logout realizado com sucesso!");
      window.location.href = "/";
    } catch (error) {
      toast.error("Erro ao fazer logout");
    }
  };

  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const filteredSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.adminOnly || user?.role === "admin"
      ),
    }))
    .filter((section) => section.items.length > 0);

  const sidebarWidth = collapsed ? "w-[72px]" : "w-[260px]";
  const mainPadding = collapsed ? "lg:pl-[72px]" : "lg:pl-[260px]";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20">
      {/* Top Navigation */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-white/5 fixed w-full z-30 top-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Menu Button */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
              
              <Link href="/">
                <div className="flex items-center gap-2.5 cursor-pointer group">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-400/20 dark:bg-emerald-500/20 rounded-xl blur-md group-hover:blur-lg transition-all" />
                    <div className="relative rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-2 shadow-lg shadow-emerald-500/20">
                      <Leaf className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="hidden sm:flex flex-col">
                    <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent leading-tight">
                      EcoMonitor
                    </span>
                    <span className="text-[10px] font-medium text-emerald-600/60 dark:text-emerald-400/60 tracking-wider uppercase">
                      Monitoramento
                    </span>
                  </div>
                </div>
              </Link>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {switchable && toggleTheme && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 h-9 w-9"
                  aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4 text-amber-400" />
                  ) : (
                    <Moon className="h-4 w-4 text-slate-500" />
                  )}
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 h-9 w-9 relative"
              >
                <Bell className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
              </Button>

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <Avatar className="h-8 w-8 border-2 border-emerald-200 dark:border-emerald-800">
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-bold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                        {user?.name}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-amber-500" />
                        {user?.points || 0} pts
                      </span>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-60 p-2 rounded-xl" align="end" sideOffset={8}>
                  <div className="px-2 py-3 mb-1">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-emerald-200 dark:border-emerald-800">
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{user?.name}</span>
                        <span className="text-xs text-muted-foreground">{user?.email}</span>
                        <Badge className="mt-1 text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 w-fit">
                          {user?.role === "admin" ? "Administrador" : "Membro"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Configurações
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link href="/">
                      <Home className="mr-2 h-4 w-4" />
                      Página Inicial
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="rounded-lg cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] ${sidebarWidth} bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-r border-slate-200/60 dark:border-white/5 transition-all duration-300 ease-in-out z-20 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 flex flex-col`}
      >
        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-6 h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all z-30"
        >
          <ChevronLeft className={`h-3 w-3 text-slate-500 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
        </button>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
          {filteredSections.map((section, sIdx) => (
            <div key={section.title} className={sIdx > 0 ? "mt-6" : ""}>
              {!collapsed && (
                <div className="px-3 mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {section.title}
                  </span>
                </div>
              )}
              {collapsed && sIdx > 0 && (
                <div className="mx-3 mb-3 border-t border-slate-200/60 dark:border-white/5" />
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.path;

                  return (
                    <Link key={item.path} href={item.path}>
                      <button
                        className={`group relative flex items-center w-full rounded-xl transition-all duration-200 ${
                          collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5 gap-3"
                        } ${
                          isActive
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 dark:shadow-emerald-500/15"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200"
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        {/* Active indicator glow */}
                        {isActive && (
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 opacity-20 blur-md" />
                        )}

                        <Icon className={`relative h-[18px] w-[18px] flex-shrink-0 ${
                          isActive ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                        } transition-colors`} />
                        
                        {!collapsed && (
                          <>
                            <span className={`relative text-[13px] font-medium flex-1 text-left ${
                              isActive ? "text-white" : ""
                            }`}>
                              {item.label}
                            </span>
                            {item.badge && (
                              <span className={`relative text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white ${item.badgeColor || "bg-slate-500"}`}>
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}

                        {/* Tooltip when collapsed */}
                        {collapsed && (
                          <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-lg z-50">
                            {item.label}
                            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-700" />
                          </div>
                        )}
                      </button>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer - User */}
        <div className={`border-t border-slate-200/60 dark:border-white/5 p-3 ${collapsed ? "px-2" : ""}`}>
          <div className={`flex items-center rounded-xl p-2 ${collapsed ? "justify-center" : "gap-3"} hover:bg-slate-100/80 dark:hover:bg-white/5 transition-colors`}>
            <Avatar className="h-8 w-8 border-2 border-emerald-200/50 dark:border-emerald-800/50 flex-shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-bold">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {user?.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-500 flex-shrink-0" />
                  {user?.points || 0} pontos
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-10 lg:hidden animate-in fade-in duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={`pt-16 ${mainPadding} min-h-screen transition-all duration-300`}>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
