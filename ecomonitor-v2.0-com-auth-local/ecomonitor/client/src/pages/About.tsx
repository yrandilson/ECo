import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Github, Mail, Heart, Zap, Users, BookOpen } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
            EcoMonitor
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
            Plataforma Colaborativa de Monitoramento Ambiental
          </p>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Integrando monitoramento em tempo real, análise científica de riscos, educação ambiental e engajamento comunitário para proteger nossos recursos naturais.
          </p>
        </div>

        {/* Mission */}
        <Card className="shadow-lg border-0 mb-8">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Nossa Missão
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Criar uma plataforma colaborativa que capacita cidadãos, pesquisadores e gestores a monitorar, analisar e responder a riscos ambientais com dados científicos e engajamento comunitário.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <Zap className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="font-semibold">Tempo Real</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Monitoramento instantâneo</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="font-semibold">Colaborativo</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Força da comunidade</p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <BookOpen className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="font-semibold">Educativo</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Aprendizado contínuo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="shadow-lg border-0 mb-8">
          <CardHeader>
            <CardTitle>Funcionalidades Principais</CardTitle>
            <CardDescription>10 funcionalidades integradas para proteção ambiental</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: "📍", title: "Monitoramento em Tempo Real", desc: "Registre ocorrências com geolocalização" },
                { icon: "🗺️", title: "Mapa Interativo", desc: "Visualize todas as ocorrências no mapa" },
                { icon: "🔬", title: "Análise Física", desc: "6 modelos científicos de risco" },
                { icon: "🎮", title: "Simuladores Educativos", desc: "Aprenda sobre fenômenos ambientais" },
                { icon: "✓", title: "Validação Comunitária", desc: "Comunidade valida ocorrências" },
                { icon: "🏆", title: "Gamificação", desc: "Pontos, badges e rankings" },
                { icon: "🚨", title: "Alertas Geoespaciais", desc: "Notificações de ocorrências críticas" },
                { icon: "👨‍💼", title: "Painel Administrativo", desc: "Gestão completa da plataforma" },
              ].map((feature, idx) => (
                <div key={idx} className="flex gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  <span className="text-2xl">{feature.icon}</span>
                  <div>
                    <p className="font-semibold">{feature.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Technology Stack */}
        <Card className="shadow-lg border-0 mb-8">
          <CardHeader>
            <CardTitle>Stack Tecnológico</CardTitle>
            <CardDescription>Tecnologias modernas e confiáveis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Frontend</h4>
                <div className="flex flex-wrap gap-2">
                  {["React 19", "Tailwind CSS 4", "Leaflet.js", "Recharts", "shadcn/ui"].map((tech) => (
                    <Badge key={tech} variant="secondary">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Backend</h4>
                <div className="flex flex-wrap gap-2">
                  {["Node.js", "Express", "tRPC", "Drizzle ORM", "MySQL"].map((tech) => (
                    <Badge key={tech} variant="secondary">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team */}
        <Card className="shadow-lg border-0 mb-8">
          <CardHeader>
            <CardTitle>Sobre o Projeto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Versão</h4>
              <p className="text-gray-600 dark:text-gray-400">1.0.0 - Fevereiro 2026</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Status</h4>
              <Badge className="bg-green-100 text-green-800">Pronto para Produção</Badge>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Licença</h4>
              <p className="text-gray-600 dark:text-gray-400">MIT - Código aberto</p>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>Contato e Links</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" className="gap-2">
              <Mail className="w-4 h-4" />
              Email
            </Button>
            <Button variant="outline" className="gap-2">
              <Github className="w-4 h-4" />
              GitHub
            </Button>
            <Button variant="outline" className="gap-2">
              <Globe className="w-4 h-4" />
              Website
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t">
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Desenvolvido com ❤️ para proteger o ambiente
          </p>
          <p className="text-sm text-gray-500">
            © 2026 EcoMonitor. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
