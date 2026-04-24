import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Leaf, Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao solicitar reset de senha');
      }

      setIsSubmitted(true);
      toast.success('Email enviado com sucesso!', {
        description: 'Verifique sua caixa de entrada (e spam) para o link de reset',
      });
    } catch (err: any) {
      console.error('[ForgotPassword] Erro:', err);
      toast.error('Erro ao solicitar reset', {
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
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
            {isSubmitted ? 'Email enviado com sucesso!' : 'Recuperar sua senha'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Digite seu email registrado e enviaremos um link para redefinir sua senha.
              </p>
              
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

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                disabled={isLoading}
              >
                {isLoading ? 'Enviando...' : 'Enviar Email de Reset'}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation('/login')}
                type="button"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Login
              </Button>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-3 w-12 h-12 mx-auto flex items-center justify-center">
                <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Email enviado com sucesso!</p>
                <p className="text-sm text-muted-foreground">
                  Verifique sua caixa de entrada (e também a pasta de spam) para o link de redefinição de senha. O link expira em 24 horas.
                </p>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                onClick={() => setLocation('/login')}
              >
                Voltar para Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
