import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface SendResetEmailParams {
  to: string;
  code: string;
  userName?: string;
}

export interface SendComplaintStatusEmailParams {
  to: string;
  userName?: string;
  complaintTitle: string;
  category: string;
  previousStatus?: string;
  newStatus: string;
  tripTitle?: string;
  resolutionNotes?: string;
  awardedCompensation?: string;
  complaintId?: string;
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

/**
 * Parse automatique pour charger les variables SMTP depuis l'environnement Vercel :
 * Supporte soit les variables individuelles (SMTP_USER, SMTP_PASS, etc.),
 * soit le bloc complet regroupé dans une variable unique "mail" (comme configuré sur Vercel).
 */
function parseRawEnvString(raw?: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!raw) return result;

  const knownKeys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];

  for (const key of knownKeys) {
    const regex = new RegExp(key + '\\s*=\\s*([^\\r\\n]+)', 'i');
    const match = raw.match(regex);
    if (match) {
      let val = match[1].trim();
      for (const otherKey of knownKeys) {
        if (otherKey !== key) {
          const nextIdx = val.indexOf(otherKey + '=');
          if (nextIdx > 0) {
            val = val.substring(0, nextIdx).trim();
          }
        }
      }
      result[key] = val;
    }
  }

  return result;
}

function getSmtpConfig() {
  const parsedMail = parseRawEnvString(process.env.mail || process.env.MAIL);

  const host = process.env.SMTP_HOST || parsedMail['SMTP_HOST'] || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || parsedMail['SMTP_PORT'] || '465', 10);
  const user = process.env.SMTP_USER || parsedMail['SMTP_USER'] || '';
  const pass = (process.env.SMTP_PASS || parsedMail['SMTP_PASS'] || '').replace(/\s+/g, '');
  const from = process.env.SMTP_FROM || parsedMail['SMTP_FROM'] || (user ? `Travel Tracker PWA <${user}>` : 'Travel Tracker PWA <noreply@traveltracker.app>');

  return { host, port, user, pass, from };
}

// ─── Shared transporter factory ─────────────────────────────────────────────────
function createTransporter() {
  const { host, port, user, pass } = getSmtpConfig();
  const isGmail = host.toLowerCase().includes('gmail');

  if (isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

function hasSmtpConfig(): boolean {
  const { host, user, pass } = getSmtpConfig();
  return !!(host && user && pass);
}

function getSmtpFrom(): string {
  const { from } = getSmtpConfig();
  return from;
}

// ─── Password Reset Email ───────────────────────────────────────────────────────
export async function sendPasswordResetEmail({
  to,
  code,
  userName,
}: SendResetEmailParams): Promise<{ sent: boolean; message: string }> {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                max-width: 560px; margin: 0 auto; background-color: #0f172a;
                border-radius: 16px; overflow: hidden; border: 1px solid #1e293b; color: #f8fafc;">
      <div style="background: linear-gradient(135deg, #0284c7, #f59e0b); padding: 32px 24px; text-align: center;">
        <h1 style="margin: 0; color: #fff; font-size: 24px; font-weight: 800;">&#9992; Travel Tracker PWA</h1>
        <p style="margin: 6px 0 0; color: rgba(255,255,255,0.9); font-size: 13px;">
          R&eacute;initialisation de votre mot de passe
        </p>
      </div>

      <div style="padding: 32px 24px;">
        <p style="font-size: 15px; color: #e2e8f0; margin-top: 0;">
          Bonjour ${userName || 'Voyageur'},
        </p>
        <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
          Vous avez demand&eacute; la r&eacute;initialisation du mot de passe de votre compte Travel Tracker.
          Saisissez le code de v&eacute;rification ci-dessous pour s&eacute;curiser votre acc&egrave;s&nbsp;:
        </p>

        <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 12px;
                    padding: 20px; text-align: center; margin: 28px 0;">
          <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #38bdf8;
                       letter-spacing: 1.5px; display: block; margin-bottom: 8px;">
            Votre Code OTP Unique
          </span>
          <span style="font-size: 36px; font-family: monospace; font-weight: 800;
                       color: #ffffff; letter-spacing: 8px;">
            ${code}
          </span>
          <span style="font-size: 11px; color: #64748b; display: block; margin-top: 8px;">
            Ce code expire dans 15 minutes.
          </span>
        </div>

        <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
          Si vous n&rsquo;&ecirc;tes pas &agrave; l&rsquo;origine de cette demande, ignorez cet e-mail.
          Votre mot de passe actuel reste inchang&eacute;.
        </p>
      </div>

      <div style="background-color: #090d16; padding: 16px 24px; border-top: 1px solid #1e293b;
                  text-align: center; font-size: 11px; color: #475569;">
        Travel Tracker PWA &bull; Plateforme de Gestion de Voyages Intelligente
      </div>
    </div>
  `;

  if (!hasSmtpConfig()) {
    return {
      sent: false,
      message: 'SMTP non configuré dans les variables Vercel (SMTP_USER et SMTP_PASS requis).',
    };
  }

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: getSmtpFrom(),
      to,
      subject: `[Travel Tracker] Votre code de reinitialisation : ${code}`,
      text: `Bonjour, votre code de reinitialisation de mot de passe est : ${code} (valide 15 minutes).`,
      html,
    });
    console.log(`[SMTP] Email OTP envoyé à ${to}`);
    return { sent: true, message: `Email envoyé avec succès à ${to}` };
  } catch (err) {
    const msg = (err as Error).message;
    console.error('[SMTP Error]', msg);
    return { sent: false, message: `Erreur SMTP : ${msg}` };
  }
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
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                max-width: 560px; margin: 0 auto; background-color: #0f172a;
                border-radius: 16px; overflow: hidden; border: 1px solid #1e293b; color: #f8fafc;">
      <div style="background: linear-gradient(135deg, #0d9488, #0284c7); padding: 32px 24px; text-align: center;">
        <h1 style="margin: 0; color: #fff; font-size: 22px; font-weight: 800;">
          &#128276; Rappel d&rsquo;Activit&eacute; Imminente
        </h1>
        <p style="margin: 6px 0 0; color: rgba(255,255,255,0.9); font-size: 13px;">
          ${tripTitle || 'Votre Voyage Travel Tracker'}
        </p>
      </div>

      <div style="padding: 32px 24px;">
        <p style="font-size: 15px; color: #e2e8f0; margin-top: 0;">
          Bonjour ${userName || 'Voyageur'},
        </p>
        <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
          Votre prochaine &eacute;tape commence dans
          <strong style="color: #f59e0b;">moins de ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''}</strong>&nbsp;!
          Pr&eacute;parez-vous pour le d&eacute;part&nbsp;:
        </p>

        <div style="background-color: #1e293b; border-left: 4px solid #0d9488;
                    border-radius: 12px; padding: 20px; margin: 24px 0;">
          <h2 style="font-size: 18px; font-weight: 800; color: #fff; margin: 0 0 12px 0;">
            ${activityTitle}
          </h2>
          <div style="font-size: 15px; color: #38bdf8; font-weight: bold; margin-bottom: 10px;">
            &#128336; Heure pr&eacute;vue&nbsp;: ${startTime}
          </div>
          ${locationName
            ? `<div style="font-size: 13px; color: #cbd5e1; margin-bottom: 6px;">
                 &#127960; <strong>Lieu&nbsp;:</strong> ${locationName}
               </div>`
            : ''}
          ${locationAddress
            ? `<div style="font-size: 12px; color: #94a3b8;">
                 &#128205; <strong>Adresse&nbsp;:</strong> ${locationAddress}
               </div>`
            : ''}
        </div>

        <div style="background-color: #422006; border: 1px solid #92400e; border-radius: 10px;
                    padding: 12px 16px; font-size: 13px; color: #fbbf24;">
          D&eacute;part dans <strong>${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''}</strong>
          &mdash; Ne soyez pas en retard&nbsp;!
        </div>
      </div>

      <div style="background-color: #090d16; padding: 16px 24px; border-top: 1px solid #1e293b;
                  text-align: center; font-size: 11px; color: #475569;">
        Travel Tracker PWA &bull; Votre compagnon de voyage intelligent
      </div>
    </div>
  `;

  if (!hasSmtpConfig()) {
    return { 
      sent: false, 
      message: 'SMTP non configuré dans les variables Vercel (SMTP_USER et SMTP_PASS requis).' 
    };
  }

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: getSmtpFrom(),
      to,
      subject: `[Rappel] "${activityTitle}" commence dans ${minutesRemaining} min (${startTime}) !`,
      text: `Votre activite "${activityTitle}" commence a ${startTime} dans moins de ${minutesRemaining} minutes !`,
      html,
    });
    console.log(`[SMTP] Alerte email envoyée à ${to}`);
    return { sent: true, message: `Alerte email envoyée avec succès à ${to}` };
  } catch (err) {
    const msg = (err as Error).message;
    console.error('[SMTP Alert Error]', msg);
    return { sent: false, message: `Erreur SMTP : ${msg}` };
  }
}


// ─── Complaint Status Update Email ──────────────────────────────────────────────
export async function sendComplaintStatusEmail({
  to,
  userName,
  complaintTitle,
  category,
  previousStatus,
  newStatus,
  tripTitle,
  resolutionNotes,
  awardedCompensation,
  complaintId,
}: SendComplaintStatusEmailParams): Promise<{ sent: boolean; message: string }> {
  // Theme colors and badge depending on status
  let headerGradient = 'linear-gradient(135deg, #0284c7, #0d9488)';
  let statusBadgeColor = '#0284c7';
  let statusBadgeBg = '#0369a120';
  let statusIcon = '&#128196;';
  let statusTitle = 'Mise à jour de votre réclamation';

  if (newStatus === 'Résolu') {
    headerGradient = 'linear-gradient(135deg, #059669, #0d9488)';
    statusBadgeColor = '#10b981';
    statusBadgeBg = '#065f4625';
    statusIcon = '&#9989;';
    statusTitle = 'Réclamation Résolue – Prise en charge validée';
  } else if (newStatus === "En cours d'analyse") {
    headerGradient = 'linear-gradient(135deg, #d97706, #b45309)';
    statusBadgeColor = '#f59e0b';
    statusBadgeBg = '#78350f25';
    statusIcon = '&#9203;';
    statusTitle = "Dossier Pris en Charge – En cours d'analyse";
  } else if (newStatus === 'Rejeté') {
    headerGradient = 'linear-gradient(135deg, #e11d48, #9f1239)';
    statusBadgeColor = '#f43f5e';
    statusBadgeBg = '#88133725';
    statusIcon = '&#10060;';
    statusTitle = 'Dossier Traité – Non retenu';
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                max-width: 580px; margin: 0 auto; background-color: #0f172a;
                border-radius: 16px; overflow: hidden; border: 1px solid #1e293b; color: #f8fafc;">
      <div style="background: ${headerGradient}; padding: 32px 24px; text-align: center;">
        <h1 style="margin: 0; color: #fff; font-size: 22px; font-weight: 800;">
          ${statusIcon} ${statusTitle}
        </h1>
        <p style="margin: 6px 0 0; color: rgba(255,255,255,0.9); font-size: 13px;">
          Travel Tracker Support &bull; Service Litiges &amp; Assistance
        </p>
      </div>

      <div style="padding: 32px 24px;">
        <p style="font-size: 15px; color: #e2e8f0; margin-top: 0;">
          Bonjour ${userName || 'Voyageur'},
        </p>
        <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
          Nous vous informons qu'une évolution a été enregistrée sur votre réclamation déposée sur Travel Tracker.
        </p>

        <!-- Ticket Card -->
        <div style="background-color: #1e293b; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #334155;">
          <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: bold; letter-spacing: 0.05em; margin-bottom: 6px;">
            Dossier de réclamation
          </div>
          <h2 style="font-size: 17px; font-weight: 800; color: #fff; margin: 0 0 10px 0;">
            ${complaintTitle}
          </h2>

          <div style="display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; color: ${statusBadgeColor}; background-color: ${statusBadgeBg}; border: 1px solid ${statusBadgeColor}40; margin-bottom: 14px;">
            Nouveau statut : ${newStatus}
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #cbd5e1; margin-top: 8px;">
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; width: 40%;">Catégorie :</td>
              <td style="padding: 6px 0; font-weight: 600; color: #f1f5f9;">${category}</td>
            </tr>
            ${previousStatus ? `
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Statut antérieur :</td>
              <td style="padding: 6px 0; color: #94a3b8;">${previousStatus}</td>
            </tr>` : ''}
            ${tripTitle ? `
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Voyage concerné :</td>
              <td style="padding: 6px 0; font-weight: 600; color: #38bdf8;">&#9992; ${tripTitle}</td>
            </tr>` : ''}
            ${complaintId ? `
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Réf dossier :</td>
              <td style="padding: 6px 0; font-family: monospace; font-size: 11px; color: #94a3b8;">${complaintId}</td>
            </tr>` : ''}
          </table>
        </div>

        ${awardedCompensation ? `
        <div style="background-color: #064e3b30; border: 1px solid #059669; border-radius: 12px; padding: 16px 20px; margin: 20px 0;">
          <div style="font-size: 12px; font-weight: bold; color: #34d399; margin-bottom: 4px;">
            &#128176; Dédommagement ou compensation accordée :
          </div>
          <div style="font-size: 18px; font-weight: 800; color: #a7f3d0;">
            ${awardedCompensation}
          </div>
        </div>` : ''}

        ${resolutionNotes ? `
        <div style="background-color: #1e293b; border-left: 4px solid #38bdf8; border-radius: 0 10px 10px 0; padding: 14px 18px; margin: 20px 0;">
          <div style="font-size: 11px; color: #38bdf8; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">
            Note de l'organisateur / arbitrage :
          </div>
          <p style="font-size: 13px; color: #e2e8f0; margin: 0; line-height: 1.5;">
            ${resolutionNotes}
          </p>
        </div>` : ''}

        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin-top: 24px;">
          Vous pouvez consulter les détails complets et suivre le traitement de votre dossier depuis votre espace réclamations sur Travel Tracker.
        </p>
      </div>

      <div style="background-color: #090d16; padding: 16px 24px; border-top: 1px solid #1e293b;
                  text-align: center; font-size: 11px; color: #475569;">
        Travel Tracker PWA &bull; Système de résolution &amp; support voyage
      </div>
    </div>
  `;

  if (!hasSmtpConfig()) {
    console.warn('[SMTP Complaints] SMTP non configuré, email non envoyé.');
    return {
      sent: false,
      message: "SMTP non configuré dans les variables d'environnement."
    };
  }

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: getSmtpFrom(),
      to,
      subject: `[Support Travel Tracker] Mise à jour : "${complaintTitle}" (${newStatus})`,
      text: `Votre réclamation "${complaintTitle}" est passée au statut : ${newStatus}.` + (resolutionNotes ? ` Note : ${resolutionNotes}` : ''),
      html,
    });
    console.log(`[SMTP Complaints] Email de statut envoyé à ${to} (Nouveau statut : ${newStatus})`);
    return { sent: true, message: `Email de notification envoyé avec succès à ${to}` };
  } catch (err) {
    const msg = (err as Error).message;
    console.error('[SMTP Complaints Error]', msg);
    return { sent: false, message: `Erreur SMTP : ${msg}` };
  }
}
