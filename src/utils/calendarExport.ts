import { Trip, Activity, Place, Expense } from '../types';

/**
 * Format a Date string (YYYY-MM-DD) and Time string (HH:mm) into an iCalendar date string: YYYYMMDDTHHMMSS
 */
function toIcsDateTime(dateStr: string, timeStr: string = '09:00'): string {
  const cleanDate = dateStr.replace(/[^0-9]/g, '').slice(0, 8);
  const [h = '09', m = '00'] = timeStr.split(':');
  const cleanH = h.padStart(2, '0');
  const cleanM = m.padStart(2, '0');
  return `${cleanDate}T${cleanH}${cleanM}00`;
}

/**
 * Format a date for all-day Google Calendar (YYYYMMDD)
 */
function toGoogleCalendarDate(dateStr: string): string {
  return dateStr.replace(/[^0-9]/g, '').slice(0, 8);
}

/**
 * Add days to YYYY-MM-DD
 */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Build the direct URL for Google Calendar pre-filled event without any download
 */
export function buildGoogleCalendarUrl(trip: Trip, activities: Activity[] = []): string {
  const startDate = trip.startDate || new Date().toISOString().split('T')[0];
  const endDate = trip.endDate || startDate;
  
  // For all-day events in Google Calendar:
  // Format is YYYYMMDD/YYYYMMDD where end date is exclusive (+1 day)
  const startDayFormatted = toGoogleCalendarDate(startDate);
  const nextAfterEndFormatted = toGoogleCalendarDate(addDays(endDate, 1));
  
  let description = `🌍 Voyage organisé avec Travel Tracker PWA\n\n`;
  description += `📍 Destination : ${trip.destination}, ${trip.country}\n`;
  if (trip.participants && trip.participants.length > 0) {
    description += `👥 Participants : ${trip.participants.join(', ')}\n`;
  }
  if (trip.budgetTotal) {
    description += `💰 Budget prévisionnel : ${trip.budgetTotal} ${trip.currency}\n`;
  }
  if (trip.itinerarySummary) {
    description += `\n📋 Résumé : ${trip.itinerarySummary}\n`;
  }
  
  if (activities.length > 0) {
    description += `\n📅 Programme (${activities.length} étapes) :\n`;
    activities.forEach((act) => {
      const timeStr = act.startTime ? ` [${act.startTime}]` : '';
      description += `• J${act.dayNumber}${timeStr} : ${act.title}\n`;
    });
  }
  
  if (trip.notes) {
    description += `\n💡 Astuces & Conseils :\n${trip.notes.substring(0, 500)}`;
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `✈️ ${trip.title}`,
    dates: `${startDayFormatted}/${nextAfterEndFormatted}`,
    details: description,
    location: `${trip.destination}, ${trip.country}`,
    trp: 'false'
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Open Google Calendar in a new tab with a pre-filled event for the trip
 * Creates a pre-filled event directly in calendar.google.com without downloading a file.
 */
export function openInGoogleCalendar(trip: Trip, activities: Activity[] = []) {
  const url = buildGoogleCalendarUrl(trip, activities);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Generate and download an RFC-5545 iCalendar (.ics) file containing all trip activities
 * Compatible with Google Calendar, Apple Calendar, Outlook, and Android.
 */
export function exportTripToIcs(trip: Trip, activities: Activity[]) {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const slug = trip.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Travel Tracker PWA//Trip Itinerary Export//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${trip.title}`,
    `X-WR-TIMEZONE:UTC`
  ];

  activities.forEach((act, idx) => {
    const actDate = act.date || trip.startDate;
    const startIso = toIcsDateTime(actDate, act.startTime || '09:00');
    const endIso = toIcsDateTime(actDate, act.endTime || '11:00');
    const uid = `act-${trip.id}-${act.id || idx}-${Date.now()}@traveltracker.pwa`;
    const cleanDesc = (act.description || `Activité du Jour ${act.dayNumber} pour le voyage ${trip.title}`).replace(/\n/g, '\\n');

    icsContent.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${startIso}`,
      `DTEND:${endIso}`,
      `SUMMARY:${act.title}`,
      `DESCRIPTION:${cleanDesc}`,
      `LOCATION:${trip.destination}, ${trip.country}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });

  icsContent.push('END:VCALENDAR');

  const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${slug}-agenda.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Open a sleek, high-fidelity printable / PDF Roadbook in a popup window
 */
export function printTripRoadbook(
  trip: Trip,
  places: Place[],
  activities: Activity[],
  expenses: Expense[],
  userCurrency: string = 'EUR'
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Veuillez autoriser les fenêtres contextuelles (popups) pour imprimer votre carnet de voyage.");
    return;
  }

  const sortedActivities = [...activities].sort((a, b) => {
    if (a.dayNumber !== b.dayNumber) return a.dayNumber - b.dayNumber;
    return (a.startTime || '').localeCompare(b.startTime || '');
  });

  // Group activities by day
  const daysMap: Record<number, Activity[]> = {};
  sortedActivities.forEach(a => {
    const d = a.dayNumber || 1;
    if (!daysMap[d]) daysMap[d] = [];
    daysMap[d].push(a);
  });

  const emergency = trip.destinationMeta?.emergencyNumbers || { police: '112 / 17', ambulance: '112 / 15' };

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Carnet de Route - ${trip.title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #1e293b;
          margin: 0;
          padding: 24px;
          background: #ffffff;
          line-height: 1.5;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 2px solid #0284c7;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .header h1 {
          margin: 0 0 4px 0;
          font-size: 24px;
          color: #0f172a;
        }
        .header p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 14px;
          margin-bottom: 24px;
          font-size: 13px;
        }
        .meta-item strong {
          display: block;
          color: #475569;
          font-size: 11px;
          text-transform: uppercase;
        }
        .day-card {
          margin-bottom: 20px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
          page-break-inside: avoid;
        }
        .day-header {
          background: #f1f5f9;
          padding: 8px 14px;
          font-weight: bold;
          font-size: 14px;
          color: #0369a1;
          border-bottom: 1px solid #e2e8f0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        th, td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid #f1f5f9;
        }
        th {
          background: #fafafa;
          color: #64748b;
          font-size: 11px;
          text-transform: uppercase;
        }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: bold;
          background: #e0f2fe;
          color: #0369a1;
        }
        .tips-box {
          background: #fffbeb;
          border: 1px solid #fef3c7;
          border-radius: 8px;
          padding: 12px;
          margin-top: 24px;
          font-size: 12px;
          color: #92400e;
        }
        .footer {
          margin-top: 30px;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
          font-size: 11px;
          color: #94a3b8;
          text-align: center;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 16px; text-align: right;">
        <button onclick="window.print()" style="padding: 8px 16px; background: #0284c7; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
          🖨️ Imprimer / Enregistrer en PDF
        </button>
      </div>

      <div class="header">
        <div>
          <h1>${trip.title}</h1>
          <p>🌍 ${trip.destination} • ${trip.country} | Du ${trip.startDate} au ${trip.endDate}</p>
        </div>
        <div style="text-align: right;">
          <span class="badge" style="font-size: 12px; padding: 4px 10px;">${trip.status}</span>
          ${trip.shareCode ? `<p style="margin: 4px 0 0; font-size: 11px; color: #64748b;">Code : <strong>${trip.shareCode}</strong></p>` : ''}
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta-item">
          <strong>Budget Prévisionnel</strong>
          <span>${trip.budgetTotal} ${trip.currency}</span>
        </div>
        <div class="meta-item">
          <strong>Participants</strong>
          <span>${trip.participants.join(', ')}</span>
        </div>
        <div class="meta-item">
          <strong>Urgences Destination</strong>
          <span>Police: ${emergency.police} | Médical: ${emergency.ambulance}</span>
        </div>
        <div class="meta-item">
          <strong>Nombre d'activités</strong>
          <span>${activities.length} étapes (${places.length} lieux sur carte)</span>
        </div>
      </div>

      <h2 style="font-size: 16px; margin: 0 0 12px 0; color: #0f172a;">📅 Déroulement Journalier & Planning</h2>

      ${Object.keys(daysMap).map(dayStr => {
        const d = Number(dayStr);
        const dayActs = daysMap[d];
        const dayDate = dayActs[0]?.date || `Jour ${d}`;
        return `
          <div class="day-card">
            <div class="day-header">Jour ${d} (${dayDate})</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 100px;">Horaire</th>
                  <th>Activité & Détails</th>
                  <th style="width: 80px;">Coût</th>
                  <th style="width: 100px;">Statut</th>
                </tr>
              </thead>
              <tbody>
                ${dayActs.map(a => `
                  <tr>
                    <td><strong>${a.startTime} - ${a.endTime}</strong></td>
                    <td>
                      <strong>${a.title}</strong>
                      ${a.description ? `<br><span style="color: #64748b;">${a.description}</span>` : ''}
                    </td>
                    <td>${a.cost > 0 ? `${a.cost} ${trip.currency}` : 'Gratuit'}</td>
                    <td><span class="badge">${a.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }).join('')}

      ${trip.notes ? `
        <div class="tips-box">
          <strong style="display: block; margin-bottom: 4px;">💡 Conseils Pratiques & Bons Plans IA :</strong>
          <div style="white-space: pre-line;">${trip.notes}</div>
        </div>
      ` : ''}

      <div class="footer">
        Document généré automatiquement depuis Travel Tracker PWA • Voyage géré par ${trip.participants[0] || 'Organisateur'} • Tous droits réservés.
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
