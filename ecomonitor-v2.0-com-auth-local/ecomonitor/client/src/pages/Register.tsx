import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Leaf, Mail, Lock, User, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function Register() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme, switchable } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (formData.password !== formData.confirmPassword) {
      toast.error('Erro', {
        description: 'As senhas não coincidem',
      });
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Erro', {
        description: 'A senha deve ter pelo menos 8 caracteres',
      });
      return;
    }
    if (!/[A-Z]/.test(formData.password)) {
      toast.error('Erro', {
        description: 'A senha deve conter pelo menos 1 letra maiúscula',
      });
      return;
    }
    if (!/[0-9]/.test(formData.password)) {
      toast.error('Erro', {
        description: 'A senha deve conter pelo menos 1 número',
      });
      return;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
      toast.error('Erro', {
        description: 'A senha deve conter pelo menos 1 caractere especial (!@#$%...)',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        }),
        credentials: 'include', // Importante para cookies
      });

      let data: { error?: string; success?: boolean };
      try {
        data = await response.json();
      } catch {
        throw new Error(
          response.ok
            ? 'Erro ao processar resposta do servidor.'
            : 'Servidor indisponível. Verifique se o backend está rodando (porta 3000).'
        );
      }

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar conta');
      }

      toast.success('Conta criada com sucesso!', {
        description: 'Você já está logado. Bem-vindo ao EcoMonitor!',
      });

      console.log('[Register] Cadastro bem-sucedido, aguardando 1s antes de redirecionar...');
      // Aguarda um tempo maior para garantir que o cookie foi setado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('[Register] Redirecionando para /dashboard com location.href');
      window.location.href = '/dashboard';
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível conectar ao servidor. Execute "pnpm dev" e tente novamente.';
      toast.error('Erro no cadastro', {
        description: message.includes('Failed to fetch')
          ? 'Servidor indisponível. Certifique-se de que o backend está rodando (pnpm dev).'
          : message,
      });
    } finally {
      setIsLoading(false);
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
            <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-4 shadow-lg">
              <Leaf className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Criar Conta</CardTitle>
          <CardDescription>
            Junte-se ao EcoMonitor e ajude a proteger o meio ambiente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={handleChange}
                  className="pl-10"
                  required
                  disabled={isLoading}
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
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
                  placeholder="Min. 8 chars, maiúscula, número, especial"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10"
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Mínimo 8 caracteres, 1 maiúscula, 1 número e 1 especial (!@#$...)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Digite a senha novamente"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10"
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? 'Criando conta...' : 'Criar Conta'}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                Já tem uma conta?{' '}
              </span>
              <Button
                variant="link"
                className="p-0 h-auto text-green-600 hover:text-green-700"
                onClick={() => setLocation('/login')}
                type="button"
              >
                Entrar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
