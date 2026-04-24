import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Leaf, Mail, Lock, Sun, Moon } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useTheme } from '@/contexts/ThemeContext';

export default function Login() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme, switchable } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const utils = trpc.useUtils();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Importante para cookies
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer login');
      }

      if (!data.user) {
        console.error('[Login] Usuário não retornou na resposta', data);
        throw new Error('Dados de usuário não recebidos do servidor');
      }

      toast.success('Login realizado com sucesso!', {
        description: `Bem-vindo(a), ${data.user.name}`,
      });

      await utils.auth.me.invalidate();
      await new Promise(resolve => setTimeout(resolve, 500));
      window.location.href = '/dashboard';
      
    } catch (error: any) {
      setIsLoading(false);
      toast.error('Erro no login', {
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 relative">
      {switchable && toggleTheme && (
        <Button variant="ghost" size="icon" className="absolute top-4 right-4 rounded-full" onClick={toggleTheme} aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"}>
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      )}
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
              <Leaf className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">EcoMonitor</CardTitle>
          <CardDescription>
            Entre na sua conta para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
              <div className="text-right">
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm text-muted-foreground hover:text-green-600"
                  onClick={() => setLocation('/forgot-password')}
                  type="button"
                >
                  Esqueceu a senha?
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                Não tem uma conta?{' '}
              </span>
              <Button
                variant="link"
                className="p-0 h-auto text-green-600 hover:text-green-700"
                onClick={() => setLocation('/register')}
                type="button"
              >
                Cadastre-se
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}