import nodemailer from 'nodemailer';

/**
 * Email Service para enviar emails de reset de senha, 2FA, etc
 * Configure suas credenciais SMTP em .env.local
 */

// Configurar transporter
const transporter = nodemailer.createTransport({
  service: process.env.SMTP_SERVICE || 'gmail',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

// Verificar se as credenciais estão configuradas
if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.warn('[EmailService] SMTP credentials not configured. Emails will not be sent.');
  console.warn('[EmailService] Configure SMTP_USER and SMTP_PASS in .env.local');
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Enviar email genérico
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('[EmailService] Email credentials not configured. Skipping send.');
      console.log('[EmailService] Would send to:', options.to);
      console.log('[EmailService] Subject:', options.subject);
      return true; // Retornar true para não quebrar em dev
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@ecomonitor.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log('[EmailService] Email enviado com sucesso para:', options.to);
    return true;
  } catch (error) {
    console.error('[EmailService] Erro ao enviar email:', error);
    return false;
  }
}

/**
 * Enviar email de reset de senha
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  userName: string
): Promise<boolean> {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #22c55e; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
          .footer { font-size: 12px; color: #666; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌍 ECO Monitor</h1>
            <p>Redefinição de Senha</p>
          </div>
          <div class="content">
            <p>Olá <strong>${userName}</strong>,</p>
            
            <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
            
            <p>Clique no link abaixo para criar uma nova senha (válido por 24 horas):</p>
            
            <a href="${resetUrl}" class="button">Redefinir Senha</a>
            
            <p style="color: #666; font-size: 14px;">
              Ou copie e cole este link no seu navegador:<br>
              <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 3px;">${resetUrl}</code>
            </p>
            
            <p><strong>Não solicitou uma redefinição de senha?</strong></p>
            <p>Se você não fez essa solicitação, ignore este email. Sua conta está segura.</p>
            
            <div class="footer">
              <p>© 2026 ECO Monitor. Todos os direitos reservados.</p>
              <p>Este é um email automático. Não responda a este endereço.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '🔐 Redefinição de Senha - ECO Monitor',
    html,
    text: `
Olá ${userName},

Recebemos uma solicitação para redefinir a senha da sua conta.

Clique no link abaixo (válido por 24 horas):
${resetUrl}

Não solicitou uma redefinição? Ignore este email.

© 2026 ECO Monitor
    `.trim(),
  });
}

/**
 * Enviar email de confirmação de mudança de senha
 */
export async function sendPasswordChangedEmail(email: string, userName: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .alert { background: #dcfce7; border-left: 4px solid #22c55e; padding: 12px; margin: 15px 0; }
          .footer { font-size: 12px; color: #666; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌍 ECO Monitor</h1>
            <p>Senha Alterada com Sucesso</p>
          </div>
          <div class="content">
            <p>Olá <strong>${userName}</strong>,</p>
            
            <div class="alert">
              ✅ Sua senha foi alterada com sucesso!
            </div>
            
            <p>Você já pode fazer login com sua nova senha.</p>
            
            <p><strong>Não foi você?</strong></p>
            <p>Se você não fez essa alteração, sua conta pode ter sido comprometida. 
            Entre em contato conosco imediatamente.</p>
            
            <div class="footer">
              <p>© 2026 ECO Monitor. Todos os direitos reservados.</p>
              <p>Este é um email automático. Não responda a este endereço.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '✅ Senha Alterada - ECO Monitor',
    html,
    text: `
Olá ${userName},

Sua senha foi alterada com sucesso!

Você já pode fazer login com sua nova senha.

Se não foi você, entre em contato conosco imediatamente.

© 2026 ECO Monitor
    `.trim(),
  });
}
