import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import type { Express, Request, Response } from 'express';
import * as db from './db';
import { getSessionCookieOptions } from './_core/cookies';
import { COOKIE_NAME, SESSION_DURATION_MS } from '@shared/const';
import { sendPasswordResetEmail, sendPasswordChangedEmail } from './email-service';
import crypto from 'crypto';

// Rate limiters para proteção contra brute force
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5, // 5 tentativas por minuto
  message: { error: 'Muitas tentativas de login. Tente novamente em 1 minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3, // 3 registros por minuto
  message: { error: 'Muitas tentativas de registro. Tente novamente em 1 minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 3, // 3 tentativas por 15 min
  message: { error: 'Muitas solicitações de reset. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Validação de senha forte
 * Mínimo 8 caracteres, 1 maiúscula, 1 número, 1 especial
 */
function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Senha deve ter pelo menos 8 caracteres' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Senha deve conter pelo menos 1 letra maiúscula' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Senha deve conter pelo menos 1 número' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: 'Senha deve conter pelo menos 1 caractere especial (!@#$%...)' };
  }
  return { valid: true, message: 'ok' };
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('[Auth] JWT_SECRET é obrigatório. Configure em .env.local');
  return secret;
}
const JWT_SECRET = getJwtSecret();

interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

/**
 * Registra rotas de autenticação local (login/cadastro)
 * Compatível com o sistema existente de OAuth
 */
export function registerLocalAuthRoutes(app: Express) {
  
  // Rota de cadastro (registro) — com rate limiting
  app.post('/api/auth/register', registerLimiter, async (req: Request, res: Response) => {
    try {
      console.log('[Register] Requisição recebida:', { email: req.body.email });
      const { email, password, name } = req.body as RegisterInput;

      // Validações básicas
      if (!email || !password) {
        res.status(400).json({ 
          error: 'Email e senha são obrigatórios' 
        });
        return;
      }

      // Validação de senha forte
      const passwordCheck = validatePassword(password);
      if (!passwordCheck.valid) {
        res.status(400).json({ error: passwordCheck.message });
        return;
      }

      // Verificar se usuário já existe
      const existingUser = await db.getUserByEmail(email);
      if (existingUser) {
        res.status(400).json({ 
          error: 'Email já cadastrado' 
        });
        return;
      }

      // Hash da senha
      const passwordHash = await bcrypt.hash(password, 10);

      // Criar usuário
      const newUser = await db.createLocalUser({
        email,
        passwordHash,
        name: name || email.split('@')[0],
        loginMethod: 'local',
      });

      // Gerar token JWT
      const token = jwt.sign(
        { 
          userId: newUser.id, 
          email: newUser.email,
          openId: `local_${newUser.id}` // Compatibilidade com sistema OAuth
        },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Configurar cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { 
        ...cookieOptions, 
        maxAge: SESSION_DURATION_MS 
      });

      res.status(201).json({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        },
      });
    } catch (error) {
      console.error('[Auth] Erro no registro:', error);
      res.status(500).json({ 
        error: 'Erro ao criar conta' 
      });
    }
  });

  // Rota de login — com rate limiting
  app.post('/api/auth/login', loginLimiter, async (req: Request, res: Response) => {
    try {
      console.log('[Login] Requisição recebida:', { email: req.body.email });
      const { email, password } = req.body as LoginInput;

      // Validações básicas
      if (!email || !password) {
        res.status(400).json({ 
          error: 'Email e senha são obrigatórios' 
        });
        return;
      }

      // Buscar usuário
      const user = await db.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        res.status(401).json({ 
          error: 'Email ou senha inválidos' 
        });
        return;
      }

      // Verificar senha
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        res.status(401).json({ 
          error: 'Email ou senha inválidos' 
        });
        return;
      }

      // Atualizar último login
      await db.updateUserLastSignIn(user.id);

      // Gerar token JWT
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          openId: user.openId || `local_${user.id}`
        },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Configurar cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { 
        ...cookieOptions, 
        maxAge: SESSION_DURATION_MS 
      });

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          points: user.points,
          trustScore: user.trustScore,
        },
      });
    } catch (error) {
      console.error('[Auth] Erro no login:', error);
      res.status(500).json({ 
        error: 'Erro ao fazer login' 
      });
    }
  });

  // Rota de verificação de sessão
  app.get('/api/auth/session', async (req: Request, res: Response) => {
    try {
      const token = req.cookies[COOKIE_NAME];
      
      if (!token) {
        res.json({ authenticated: false });
        return;
      }

      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = await db.getUserById(decoded.userId);

      if (!user) {
        res.json({ authenticated: false });
        return;
      }

      res.json({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          points: user.points,
          trustScore: user.trustScore,
        },
      });
    } catch (error) {
      res.json({ authenticated: false });
    }
  });

  // ============== PASSWORD RESET ENDPOINTS ==============

  // Rota: Solicitar reset de senha
  app.post('/api/auth/forgot-password', resetLimiter, async (req: Request, res: Response) => {
    try {
      console.log('[ForgotPassword] Requisição recebida:', { email: req.body.email });
      const { email } = req.body;

      // Validações básicas
      if (!email) {
        res.status(400).json({ error: 'Email é obrigatório' });
        return;
      }

      // Buscar usuário
      const user = await db.getUserByEmail(email);
      if (!user) {
        // Não revelar se email existe por segurança
        console.log('[ForgotPassword] Email não encontrado:', email);
        res.status(200).json({
          message: 'Se este email está registrado, você receberá um link para resetar sua senha',
        });
        return;
      }

      // Gerar token seguro (32 bytes hex)
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Salvar token no banco com expiry 24h
      await db.savePasswordResetToken(user.id, resetToken, true);

      // Enviar email
      const emailSent = await sendPasswordResetEmail(user.email!, resetToken, user.name || 'Usuário');

      if (!emailSent) {
        console.error('[ForgotPassword] Erro ao enviar email para:', email);
        res.status(500).json({ error: 'Erro ao enviar email. Tente novamente mais tarde.' });
        return;
      }

      console.log('[ForgotPassword] Email enviado com sucesso para:', email);
      res.status(200).json({
        message: 'Se este email está registrado, você receberá um link para resetar sua senha',
      });
    } catch (error) {
      console.error('[ForgotPassword] Erro:', error);
      res.status(500).json({ error: 'Erro ao processar solicitação' });
    }
  });

  // Rota: Resetar senha com token
  app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
    try {
      console.log('[ResetPassword] Requisição recebida');
      const { token, newPassword } = req.body;

      // Validações básicas
      if (!token || !newPassword) {
        res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
        return;
      }

      const passwordCheck = validatePassword(newPassword);
      if (!passwordCheck.valid) {
        res.status(400).json({ error: passwordCheck.message });
        return;
      }

      // Validar token
      const user = await db.validatePasswordResetToken(token);
      if (!user) {
        console.warn('[ResetPassword] Token inválido ou expirado');
        res.status(400).json({ error: 'Link de reset inválido ou expirado' });
        return;
      }

      // Hash da nova senha
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Atualizar senha no banco
      await db.updateUserPassword(user.id, passwordHash);

      // Limpar token de reset
      await db.clearPasswordResetToken(user.id);

      // Enviar email de confirmação
      await sendPasswordChangedEmail(user.email!, user.name || 'Usuário');

      console.log('[ResetPassword] Senha resetada com sucesso para:', user.email);
      res.status(200).json({
        success: true,
        message: 'Senha alterada com sucesso! Você já pode fazer login.',
      });
    } catch (error) {
      console.error('[ResetPassword] Erro:', error);
      res.status(500).json({ error: 'Erro ao resetar senha' });
    }
  });
}

/**
 * Middleware para validar token JWT em requisições protegidas
 */
export function validateLocalAuth(token: string): { userId: number; email: string; openId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      userId: decoded.userId,
      email: decoded.email,
      openId: decoded.openId,
    };
  } catch (error) {
    return null;
  }
}
