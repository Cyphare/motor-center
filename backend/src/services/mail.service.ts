import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { IBooking } from '../models/booking.model';

type Transport = ReturnType<typeof nodemailer.createTransport>;

interface OutgoingMail {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}

/**
 * In NODE_ENV=test, messages are kept here instead of being sent, even when SMTP is configured
 * in .env, so integration tests never email real addresses and can assert on what was sent.
 */
export const testOutbox: OutgoingMail[] = [];

let previewTransport: Transport | undefined;
let previewFrom: string | undefined;

async function sendMail(mail: OutgoingMail, label: string): Promise<void> {
  if (env.NODE_ENV === 'test') {
    testOutbox.push(mail);
    return;
  }

  const fields = [env.SMTP_HOST, env.SMTP_USER, env.SMTP_PASS, env.SMTP_FROM];
  const configured = fields.some((value) => !!value?.trim());
  if (configured && !fields.every((value) => !!value?.trim())) {
    throw new Error('Konfigurasi SMTP tidak lengkap: SMTP_HOST, SMTP_USER, SMTP_PASS, dan SMTP_FROM wajib diisi bersama');
  }

  let transport: Transport;
  let from: string;
  if (configured) {
    transport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER!, pass: env.SMTP_PASS! },
    });
    from = env.SMTP_FROM!;
  } else {
    if (!previewTransport) {
      const account = await nodemailer.createTestAccount();
      previewFrom = account.user;
      previewTransport = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass },
      });
    }
    transport = previewTransport;
    from = previewFrom!;
  }

  const info = await transport.sendMail({ from, ...mail });
  if (!configured) console.info(`[Email] Pratinjau ${label}: ${nodemailer.getTestMessageUrl(info)}`);
}

export async function sendBookingEmail(to: string, booking: IBooking, event: 'created' | 'completed'): Promise<void> {
  const created = event === 'created';
  await sendMail(
    {
      to,
      subject: created ? `Konfirmasi booking ${booking.bookingNumber} - MotorCenter` : `Motor siap diambil: ${booking.bookingNumber} - MotorCenter`,
      text: created
        ? `Booking ${booking.bookingNumber} untuk ${booking.plateNumber} berhasil dibuat. Status: ${booking.status}.`
        : `Motor ${booking.plateNumber} siap diambil. Estimasi biaya jasa: Rp${booking.serviceFee}; suku cadang: Rp${booking.partsTotalCost}; total: Rp${booking.grandTotal}.`,
    },
    booking.bookingNumber
  );
}

export interface LowStockItem {
  code: string;
  name: string;
  stock: number;
  minStock: number;
  unit: string;
}

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

export async function sendLowStockEmail(to: string[], items: LowStockItem[]): Promise<void> {
  const lines = items.map(
    (item) => `- ${item.code} ${item.name}: stok ${item.stock} ${item.unit} (batas minimum ${item.minStock})`
  );
  const rows = items
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.code)}</td><td>${escapeHtml(item.name)}</td>` +
        `<td style="text-align:right">${item.stock} ${escapeHtml(item.unit)}</td>` +
        `<td style="text-align:right">${item.minStock}</td></tr>`
    )
    .join('');

  await sendMail(
    {
      to,
      subject: `Peringatan stok menipis: ${items.length} suku cadang - MotorCenter`,
      text:
        `Stok suku cadang berikut sudah mencapai atau di bawah batas minimum dan perlu segera di-restock:\n\n` +
        `${lines.join('\n')}\n\nMotorCenter`,
      html:
        `<p>Stok suku cadang berikut sudah mencapai atau di bawah batas minimum dan perlu segera di-restock:</p>` +
        `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse">` +
        `<thead><tr><th>Kode</th><th>Nama</th><th>Stok</th><th>Minimum</th></tr></thead>` +
        `<tbody>${rows}</tbody></table><p>MotorCenter</p>`,
    },
    'stok menipis'
  );
}
