import dotenv from 'dotenv';
dotenv.config();

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface SendResetEmailParams {
  to: string;
  code: string;
  userName?: string;
}

export interface SendActivityAlertEmailParams {
  to: string;
  userName?: string;
  activityTitle: string;
  startTime: string;
  locationName?: string;
  locationAddress?: string;
  tripTitle?: string;
  minutesRemaining?: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Sends an email using Resend (HTTP-based, works on Vercel serverless).
 * Falls back to Nodemailer if RESEND_API_KEY is not set but SMTP_HOST is.
 */
async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ sent: boolean; message: string }> {
  const resendKey = process.env.RESEND_API_KEY;
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const smtpFrom = process.env.SMTP_FROM || '"Travel Tracker" <onboarding@resend.dev>';

  // ── Option 1 : Resend (HTTP API — works on Vercel) ────────────────────────
  if (resendKey) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(resendKey);

      const fromAddress = smtpFrom || 'Travel Tracker <onboarding@resend.dev>';

      const result = await resend.emails.send({
        from: fromAddress,
        to,
        subject,
        html,
        text,
      });

      if (result.error) {
        console.error('[Resend Error]', result.error);
        return { sent: false, message: `Resend error: ${result.error.message}` };
      }

      console.log(`[Resend] Email envoyé avec succès à ${to} (id: ${result.data?.id})`);
      return { sent: true, message: `Email envoyé avec succès à ${to}` };
    } catch (err) {
      console.error('[Resend Exception]', (err as Error).message);
      return { sent: false, message: `Erreur Resend: ${(err as Error).message}` };
    }
  }

  // ── Option 2 : Nodemailer SMTP (local/dev seulement, bloqué sur Vercel) ──
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const nodemailer = await import('nodemailer');
      const cleanedPass = smtpPass.replace(/\s+/g, '');
      const isGmail = smtpHost.toLowerCase().includes('gmail');

      const transporter = isGmail
        ? nodemailer.default.createTransport({
            service: 'gmail',
            auth: { user: smtpUser, pass: cleanedPass },
          })
        : nodemailer.default.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: { user: smtpUser, pass: cleanedPass },
          });

      await transporter.sendMail({ from: smtpFrom, to, subject, html, text });
      console.log(`[SMTP] Email envoyé à ${to}`);
      return { sent: true, message: `Email envoyé avec succès à ${to}` };
    } catch (err) {
      console.error('[SMTP Error]', (err as Error).message);
      return { sent: false, message: `Erreur SMTP: ${(err as Error).message}` };
    }
  }

  // ── Option 3 : Simulation (aucune config) ────────────────────────────────
  console.log(`\n[EMAIL SIMULATION] À: ${to} | Sujet: ${subject}\n`);
  return {
    sent: false,
    message: 'RESEND_API_KEY non configurée. Configurez-la dans les variables Vercel pour activer l\'envoi réel.',
  };
}

// ─── Password Reset Email ───────────────────────────────────────────────────────

export async function sendPasswordResetEmail({
  to,
  code,
  userName,
}: SendResetEmailParams): Promise<{ sent: boolean; message: string }> {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #0f172a; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b; color: #f8fafc;">
      <div style="background: linear-gradient(135deg, #0284c7, #f59e0b); padding: 32px 24px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Travel Tracker PWA</h1>
        <p style="margin: 6px 0 0; color: rgba(255,255,255,0.9); font-size: 13px;">Reinitialisation de votre mot de passe</p>
      </div>
      
      <div style="padding: 32px 24px;">
        <p style="font-size: 15px; color: #e2e8f0; margin-top: 0;">Bonjour ${userName || 'Voyageur'},</p>
        <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
          Vous avez demande la reinitialisation du mot de passe de votre compte Travel Tracker. Saisissez le code de verification ci-dessous :
        </p>

        <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0;">
          <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #38bdf8; letter-spacing: 1.5px; display: block; margin-bottom: 8px;">Votre Code OTP Unique</span>
          <span style="font-size: 36px; font-family: monospace; font-weight: 800; color: #ffffff; letter-spacing: 8px;">${code}</span>
          <span style="font-size: 11px; color: #64748b; display: block; margin-top: 8px;">Ce code expire dans 15 minutes.</span>
        </div>

        <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
          Si vous n'etes pas a l'origine de cette demande, ignorez cet e-mail. Votre mot de passe actuel reste inchange.
        </p>
      </div>

      <div style="background-color: #090d16; padding: 16px 24px; border-top: 1px solid #1e293b; text-align: center; font-size: 11px; color: #475569;">
        Travel Tracker PWA &bull; Plateforme de Gestion de Voyages Intelligente
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `[Travel Tracker] Votre code de reinitialisation : ${code}`,
    html,
    text: `Bonjour, votre code de reinitialisation de mot de passe est : ${code} (valide 15 minutes).`,
  });
}

// ─── Activity Alert Email ───────────────────────────────────────────────────────

export async function sendActivityAlertEmail({
  to,
  userName,
  activityTitle,
  startTime,
  locationName,
  locationAddress,
  tripTitle,
  minutesRemaining = 15,
}: SendActivityAlertEmailParams): Promise<{ sent: boolean; message: string }> {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #0f172a; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b; color: #f8fafc;">
      <div style="background: linear-gradient(135deg, #0d9488, #0284c7); padding: 32px 24px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800;">Rappel d'Activite Imminente</h1>
        <p style="margin: 6px 0 0; color: rgba(255,255,255,0.9); font-size: 13px;">${tripTitle || 'Votre Voyage Travel Tracker'}</p>
      </div>
      
      <div style="padding: 32px 24px;">
        <p style="font-size: 15px; color: #e2e8f0; margin-top: 0;">Bonjour ${userName || 'Voyageur'},</p>
        <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
          Votre prochaine etape commence dans <strong style="color: #f59e0b;">moins de ${minutesRemaining} minutes</strong> ! Preparez-vous pour le depart :
        </p>

        <div style="background-color: #1e293b; border-left: 4px solid #0d9488; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <h2 style="font-size: 18px; font-weight: 800; color: #ffffff; margin: 0 0 12px 0;">${activityTitle}</h2>
          <div style="font-size: 15px; color: #38bdf8; font-weight: bold; margin-bottom: 10px;">
            Heure prevue : ${startTime}
          </div>
          ${locationName ? `<div style="font-size: 13px; color: #cbd5e1; margin-bottom: 6px;"><strong>Lieu :</strong> ${locationName}</div>` : ''}
          ${locationAddress ? `<div style="font-size: 12px; color: #94a3b8;"><strong>Adresse :</strong> ${locationAddress}</div>` : ''}
        </div>

        <div style="background-color: #422006; border: 1px solid #92400e; border-radius: 10px; padding: 12px 16px; font-size: 13px; color: #fbbf24;">
          Depart dans <strong>${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''}</strong> — Ne soyez pas en retard !
        </div>
      </div>

      <div style="background-color: #090d16; padding: 16px 24px; border-top: 1px solid #1e293b; text-align: center; font-size: 11px; color: #475569;">
        Travel Tracker PWA &bull; Votre compagnon de voyage intelligent
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `[Rappel] "${activityTitle}" commence dans ${minutesRemaining} min (${startTime}) !`,
    html,
    text: `Bonjour, votre activite "${activityTitle}" commence a ${startTime} dans moins de ${minutesRemaining} minutes !`,
  });
}
