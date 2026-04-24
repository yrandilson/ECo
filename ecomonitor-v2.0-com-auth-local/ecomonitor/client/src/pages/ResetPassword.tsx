import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Leaf, Lock, Check } from 'lucide-react';

function useQuery() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split('?')[1] || '');
  return params;
}

export default function ResetPassword() {
  const params = useQuery();
  const token = params.get('token') || '';
  const [, setLocation] = useLocation();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      toast.error('Token inválido', {
        description: 'Link de reset não fornecido ou inválido',
      });
    } else {
      setTokenValid(true);
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!token) {
      toast.error('Erro', {
        description: 'Token não fornecido',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Senhas não coincidem', {
        description: 'As senhas digitadas são diferentes',
      });
      return;
    }

    if (password.length < 6) {
      toast.error('Senha fraca', {
        description: 'A senha deve ter no mínimo 6 caracteres',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao resetar senha');
      }

      setIsSuccess(true);
      toast.success('Senha alterada com sucesso!', {
        description: 'Você será redirecionado para o login em alguns segundos',
      });

      setTimeout(() => {
        setLocation('/login');
      }, 3000);
    } catch (err: any) {
      console.error('[ResetPassword] Erro:', err);
      toast.error('Erro ao resetar senha', {
        description: err.message || 'Tente novamente ou solicite um novo link',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-red-100 dark:bg-red-900 p-3">
                <Leaf className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Link Inválido</CardTitle>
            <CardDescription>
              O link de reset de senha não é válido
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-6">
              O link pode ter expirado ou é inválido. Por favor, solicite um novo link de reset.
            </p>
            <Button
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              onClick={() => window.location.href = '/forgot-password'}
            >
              Solicitar Novo Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
              <Leaf className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">EcoMonitor</CardTitle>
          <CardDescription>
            {isSuccess ? 'Senha alterada com sucesso!' : 'Definir nova senha'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
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
                    minLength={6}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Mínimo de 6 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                    minLength={6}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                disabled={isLoading}
              >
                {isLoading ? 'Alterando senha...' : 'Alterar Senha'}
              </Button>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-3 w-12 h-12 mx-auto flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Tudo pronto!</p>
                <p className="text-sm text-muted-foreground">
                  Sua senha foi alterada com sucesso. Você será redirecionado para o login.
                </p>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                onClick={() => setLocation('/login')}
              >
                Ir para Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
