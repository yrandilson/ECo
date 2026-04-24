import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Bell, Lock, Eye, Trash2, LogOut } from "lucide-react";
import { toast } from "sonner";

import MainLayout from "@/components/MainLayout";
export default function UserSettings() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    alerts: true,
    validations: true,
    comments: true,
  });
  const [privacy, setPrivacy] = useState({
    profilePublic: true,
    showRanking: true,
    showActivity: false,
    allowMessages: true,
  });

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    toast.success("Preferência atualizada");
  };

  const handlePrivacyChange = (key: keyof typeof privacy) => {
    setPrivacy((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    toast.success("Configuração de privacidade atualizada");
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Desconectado com sucesso");
  };

  return (
    <MainLayout>
<div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Configurações
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Gerencie suas preferências e privacidade
            </p>
          </div>
  
          {/* User Profile Card */}
          <Card className="shadow-lg border-0 mb-8">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
              <CardTitle>Perfil da Conta</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Nome</p>
                  <p className="font-semibold">{user?.name || "Usuário"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email</p>
                  <p className="font-semibold">{user?.email || "não informado"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Role</p>
                  <Badge className="bg-emerald-100 text-emerald-800">{user?.role || "user"}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Membro desde</p>
                  <p className="font-semibold">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("pt-BR") : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
  
          <Tabs defaultValue="notifications" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notificações
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Privacidade
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Segurança
              </TabsTrigger>
            </TabsList>
  
            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-4">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Preferências de Notificação
                  </CardTitle>
                  <CardDescription>Escolha como você quer ser notificado</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div>
                      <p className="font-semibold">Notificações por Email</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Receba resumos por email</p>
                    </div>
                    <Switch
                      checked={notifications.email}
                      onCheckedChange={() => handleNotificationChange("email")}
                    />
                  </div>
  
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div>
                      <p className="font-semibold">Notificações Push</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Alertas em tempo real</p>
                    </div>
                    <Switch
                      checked={notifications.push}
                      onCheckedChange={() => handleNotificationChange("push")}
                    />
                  </div>
  
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div>
                      <p className="font-semibold">Alertas Geoespaciais</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Ocorrências próximas a você</p>
                    </div>
                    <Switch
                      checked={notifications.alerts}
                      onCheckedChange={() => handleNotificationChange("alerts")}
                    />
                  </div>
  
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div>
                      <p className="font-semibold">Validações</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Quando suas ocorrências são validadas</p>
                    </div>
                    <Switch
                      checked={notifications.validations}
                      onCheckedChange={() => handleNotificationChange("validations")}
                    />
                  </div>
  
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div>
                      <p className="font-semibold">Comentários</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Respostas aos seus comentários</p>
                    </div>
                    <Switch
                      checked={notifications.comments}
                      onCheckedChange={() => handleNotificationChange("comments")}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
  
            {/* Privacy Tab */}
            <TabsContent value="privacy" className="space-y-4">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Controles de Privacidade
                  </CardTitle>
                  <CardDescription>Controle quem pode ver suas informações</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div>
                      <p className="font-semibold">Perfil Público</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Outros usuários podem ver seu perfil</p>
                    </div>
                    <Switch
                      checked={privacy.profilePublic}
                      onCheckedChange={() => handlePrivacyChange("profilePublic")}
                    />
                  </div>
  
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div>
                      <p className="font-semibold">Mostrar no Ranking</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Aparecer nos rankings públicos</p>
                    </div>
                    <Switch
                      checked={privacy.showRanking}
                      onCheckedChange={() => handlePrivacyChange("showRanking")}
                    />
                  </div>
  
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div>
                      <p className="font-semibold">Mostrar Atividades</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Publicar seu histórico de atividades</p>
                    </div>
                    <Switch
                      checked={privacy.showActivity}
                      onCheckedChange={() => handlePrivacyChange("showActivity")}
                    />
                  </div>
  
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div>
                      <p className="font-semibold">Permitir Mensagens</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Outros usuários podem te enviar mensagens</p>
                    </div>
                    <Switch
                      checked={privacy.allowMessages}
                      onCheckedChange={() => handlePrivacyChange("allowMessages")}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
  
            {/* Security Tab */}
            <TabsContent value="security" className="space-y-4">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Segurança da Conta
                  </CardTitle>
                  <CardDescription>Proteja sua conta</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Lock className="w-4 h-4 mr-2" />
                    Alterar Senha
                  </Button>
  
                  <Button variant="outline" className="w-full justify-start">
                    <Lock className="w-4 h-4 mr-2" />
                    Ativar Autenticação de Dois Fatores
                  </Button>
  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-900 dark:text-blue-200 mb-2">
                      <strong>Sessões Ativas:</strong>
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      Você está conectado em 1 dispositivo
                    </p>
                  </div>
  
                  <Button variant="outline" className="w-full justify-start text-red-600 border-red-300">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Desconectar de Todos os Dispositivos
                  </Button>
                </CardContent>
              </Card>
  
              <Card className="shadow-lg border-0 border-l-4 border-red-500">
                <CardHeader>
                  <CardTitle className="text-red-600">Zona de Perigo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="destructive" className="w-full justify-start">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Deletar Conta Permanentemente
                  </Button>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Esta ação é irreversível. Todos os seus dados serão deletados.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
  
          {/* Logout Button */}
          <div className="mt-8 flex justify-center">
            <Button
              onClick={handleLogout}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Desconectar
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
