import nodemailer from 'nodemailer';

export interface SendResetEmailParams {
  to: string;
  code: string;
  userName?: string;
}

/**
 * Mailer service for Travel Tracker PWA
 * Sends real OTP email if SMTP is configured, or falls back to simulated transport.
 */
export async function sendPasswordResetEmail({ to, code, userName }: SendResetEmailParams): Promise<{ sent: boolean; message: string }> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || '"Travel Tracker PWA" <support@traveltracker.app>';

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #0f172a; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b; color: #f8fafc;">
      <div style="background: linear-gradient(135deg, #0284c7, #f59e0b); padding: 32px 24px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Travel Tracker PWA</h1>
        <p style="margin: 6px 0 0; color: rgba(255,255,255,0.9); font-size: 13px;">Réinitialisation de votre mot de passe</p>
      </div>
      
      <div style="padding: 32px 24px;">
        <p style="font-size: 15px; color: #e2e8f0; margin-top: 0;">Bonjour ${userName || 'Voyageur'},</p>
        <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
          Vous avez demandé la réinitialisation du mot de passe de votre compte Travel Tracker. Veuillez saisir le code de vérification ci-dessous pour sécuriser votre accès :
        </p>

        <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0;">
          <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #38bdf8; letter-spacing: 1.5px; display: block; margin-bottom: 8px;">Votre Code OTP Unique</span>
          <span style="font-size: 32px; font-family: monospace; font-weight: 800; color: #ffffff; letter-spacing: 6px;">${code}</span>
          <span style="font-size: 11px; color: #64748b; display: block; margin-top: 8px;">Ce code expire dans 15 minutes.</span>
        </div>

        <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
          Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité. Votre mot de passe actuel reste inchangé.
        </p>
      </div>

      <div style="background-color: #090d16; padding: 16px 24px; border-top: 1px solid #1e293b; text-align: center; font-size: 11px; color: #475569;">
        Travel Tracker PWA • Plateforme de Gestion de Voyages Intelligente
      </div>
    </div>
  `;

  // Check if real SMTP credentials exist
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const cleanedPass = smtpPass.replace(/\s+/g, '');
      const isGmail = smtpHost.toLowerCase().includes('gmail');

      const transporter = isGmail
        ? nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: smtpUser,
              pass: cleanedPass,
            },
          })
        : nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
              user: smtpUser,
              pass: cleanedPass,
            },
          });

      await transporter.sendMail({
        from: smtpFrom,
        to,
        subject: `[Travel Tracker] Votre code de réinitialisation : ${code}`,
        text: `Bonjour, votre code de réinitialisation de mot de passe est : ${code} (valide 15 minutes).`,
        html: htmlContent,
      });

      console.log(`[SMTP] E-mail réel envoyé avec succès à ${to}`);
      return { sent: true, message: `E-mail envoyé avec succès à ${to}` };
    } catch (err) {
      console.error('[SMTP Error] Échec de l\'envoi réel via SMTP:', (err as Error).message);
      return { sent: false, message: `Erreur d'envoi SMTP : ${(err as Error).message}` };
    }
  }

  // Fallback: SMTP non configuré dans .env
  console.log(`\n============================================================`);
  console.log(`[EMAIL DISPATCH - LOCAL / TEST SIMULATION]`);
  console.log(`Destinataire : ${to}`);
  console.log(`Code OTP     : ${code}`);
  console.log(`Expiration   : 15 minutes`);
  console.log(`============================================================\n`);

  return { 
    sent: false, 
    message: `SMTP non configuré dans le serveur. Le code de vérification est ${code}` 
  };
}
