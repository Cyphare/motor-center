import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { IBooking } from '../models/booking.model';
import { WORKSHOP } from '../config/workshop';
import { escapeHtml, rupiah, wibDate } from '../utils/format';

type Transport = ReturnType<typeof nodemailer.createTransport>;

interface OutgoingMail {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}

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

const BRAND_COLOR = '#E8731A';

function emailLayout(heading: string, content: string): string {
  return (
    `<div style="margin:0;padding:24px;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:#222">` +
    `<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden">` +
    `<div style="background:${BRAND_COLOR};color:#ffffff;padding:16px 24px;font-size:20px;font-weight:bold">${escapeHtml(WORKSHOP.name)}</div>` +
    `<div style="padding:24px"><h2 style="margin:0 0 16px;font-size:18px">${escapeHtml(heading)}</h2>${content}</div>` +
    `<div style="padding:16px 24px;background:#fafafa;color:#666;font-size:12px;line-height:1.6">` +
    `${escapeHtml(WORKSHOP.address)}<br>Telp. ${escapeHtml(WORKSHOP.phone)}<br>Jam operasional: ${escapeHtml(WORKSHOP.hours)}` +
    `</div></div></div>`
  );
}

function detailTable(rows: Array<[string, string]>): string {
  const cells = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 0;color:#666;width:150px;vertical-align:top">${escapeHtml(label)}</td>` +
        `<td style="padding:6px 0;font-weight:bold">${escapeHtml(value)}</td></tr>`
    )
    .join('');
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${cells}</table>`;
}

function costTable(booking: IBooking): string {
  const cell = 'padding:8px;border-bottom:1px solid #eeeeee';
  const lines = [
    { name: `Jasa servis${booking.serviceName ? ` - ${booking.serviceName}` : ''}`, quantity: 1, subtotal: booking.serviceFee },
    ...booking.partsUsed.map((part) => ({ name: part.name, quantity: part.quantity, subtotal: part.subtotal })),
  ];
  const body = lines
    .map(
      (line) =>
        `<tr><td style="${cell}">${escapeHtml(line.name)}</td>` +
        `<td style="${cell};text-align:center">${line.quantity}</td>` +
        `<td style="${cell};text-align:right">${rupiah(line.subtotal)}</td></tr>`
    )
    .join('');
  return (
    `<table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">` +
    `<thead><tr style="background:#f1f1f1"><th style="padding:8px;text-align:left">Item</th>` +
    `<th style="padding:8px">Qty</th><th style="padding:8px;text-align:right">Subtotal</th></tr></thead>` +
    `<tbody>${body}</tbody>` +
    `<tfoot><tr><td colspan="2" style="padding:8px;text-align:right;font-weight:bold">Total</td>` +
    `<td style="padding:8px;text-align:right;font-weight:bold;font-size:16px">${rupiah(booking.grandTotal)}</td></tr></tfoot>` +
    `</table>`
  );
}

function bookingCreatedMail(booking: IBooking): Omit<OutgoingMail, 'to'> {
  const details: Array<[string, string]> = [
    ['No. Tiket', booking.bookingNumber],
    ['Kendaraan', `${booking.motorModel} (${booking.plateNumber})`],
    ['Layanan', booking.serviceName ?? 'Belum dipilih'],
    ['Keluhan', booking.complaint],
    ['Jadwal Servis', wibDate(booking.serviceDate)],
    ['Status', booking.status],
    ['Estimasi Biaya Jasa', rupiah(booking.serviceFee)],
  ];
  return {
    subject: `Konfirmasi booking ${booking.bookingNumber} - ${WORKSHOP.name}`,
    text:
      `Halo ${booking.customerName},\n\nBooking servis Anda berhasil dibuat.\n\n` +
      details.map(([label, value]) => `${label}: ${value}`).join('\n') +
      `\n\nPantau progres servis kapan saja melalui portal pelanggan ${WORKSHOP.name}.` +
      `\n\n${WORKSHOP.name}\n${WORKSHOP.address}\nJam operasional: ${WORKSHOP.hours}`,
    html: emailLayout(
      'Booking servis berhasil dibuat',
      `<p style="font-size:14px">Halo <b>${escapeHtml(booking.customerName)}</b>, booking servis Anda sudah kami terima.</p>` +
        detailTable(details) +
        `<p style="font-size:14px;margin-top:16px">Pantau progres servis kapan saja melalui portal pelanggan. ` +
        `Biaya akhir dapat berubah sesuai suku cadang yang dibutuhkan.</p>`
    ),
  };
}

function bookingCompletedMail(booking: IBooking): Omit<OutgoingMail, 'to'> {
  const parts = booking.partsUsed.map((part) => `- ${part.name} x${part.quantity}: ${rupiah(part.subtotal)}`);
  return {
    subject: `Motor siap diambil: ${booking.bookingNumber} - ${WORKSHOP.name}`,
    text:
      `Halo ${booking.customerName},\n\nMotor ${booking.motorModel} (${booking.plateNumber}) dengan tiket ${booking.bookingNumber} ` +
      `sudah selesai diservis dan siap diambil.\n\n` +
      `Biaya jasa: ${rupiah(booking.serviceFee)}\n` +
      (parts.length ? `Suku cadang:\n${parts.join('\n')}\n` : '') +
      `Total suku cadang: ${rupiah(booking.partsTotalCost)}\nTotal: ${rupiah(booking.grandTotal)}\n` +
      (booking.mechanicNotes ? `\nCatatan mekanik: ${booking.mechanicNotes}\n` : '') +
      `\nSilakan ambil motor Anda pada jam operasional (${WORKSHOP.hours}). Pembayaran dilakukan di kasir.` +
      `\n\n${WORKSHOP.name}\n${WORKSHOP.address}\nTelp. ${WORKSHOP.phone}`,
    html: emailLayout(
      'Motor Anda siap diambil',
      `<p style="font-size:14px">Halo <b>${escapeHtml(booking.customerName)}</b>, motor ` +
        `<b>${escapeHtml(booking.motorModel)} (${escapeHtml(booking.plateNumber)})</b> dengan tiket ` +
        `<b>${escapeHtml(booking.bookingNumber)}</b> sudah selesai diservis dan siap diambil.</p>` +
        costTable(booking) +
        (booking.mechanicNotes
          ? `<p style="font-size:14px;background:#fff7ed;padding:12px;border-radius:6px"><b>Catatan mekanik:</b><br>${escapeHtml(booking.mechanicNotes)}</p>`
          : '') +
        `<p style="font-size:14px">Silakan ambil motor Anda pada jam operasional <b>${escapeHtml(WORKSHOP.hours)}</b>. ` +
        `Pembayaran dilakukan di kasir, dan faktur PDF dapat diunduh dari portal pelanggan setelah motor diambil.</p>`
    ),
  };
}

export async function sendBookingEmail(to: string, booking: IBooking, event: 'created' | 'completed'): Promise<void> {
  const mail = event === 'created' ? bookingCreatedMail(booking) : bookingCompletedMail(booking);
  await sendMail({ to, ...mail }, booking.bookingNumber);
}

export interface LowStockItem {
  code: string;
  name: string;
  stock: number;
  minStock: number;
  unit: string;
}

export async function sendLowStockEmail(to: string[], items: LowStockItem[]): Promise<void> {
  const lines = items.map(
    (item) => `- ${item.code} ${item.name}: stok ${item.stock} ${item.unit} (batas minimum ${item.minStock})`
  );
  const cell = 'padding:8px;border-bottom:1px solid #eeeeee';
  const rows = items
    .map(
      (item) =>
        `<tr><td style="${cell}">${escapeHtml(item.code)}</td><td style="${cell}">${escapeHtml(item.name)}</td>` +
        `<td style="${cell};text-align:right;color:#b91c1c;font-weight:bold">${item.stock} ${escapeHtml(item.unit)}</td>` +
        `<td style="${cell};text-align:right">${item.minStock}</td></tr>`
    )
    .join('');

  await sendMail(
    {
      to,
      subject: `Peringatan stok menipis: ${items.length} suku cadang - ${WORKSHOP.name}`,
      text:
        `Stok suku cadang berikut sudah mencapai atau di bawah batas minimum dan perlu segera di-restock:\n\n` +
        `${lines.join('\n')}\n\n${WORKSHOP.name}`,
      html: emailLayout(
        'Peringatan stok menipis',
        `<p style="font-size:14px">Stok suku cadang berikut sudah mencapai atau di bawah batas minimum dan perlu segera di-restock:</p>` +
          `<table style="width:100%;border-collapse:collapse;font-size:14px">` +
          `<thead><tr style="background:#f1f1f1"><th style="padding:8px;text-align:left">Kode</th>` +
          `<th style="padding:8px;text-align:left">Nama</th><th style="padding:8px;text-align:right">Stok</th>` +
          `<th style="padding:8px;text-align:right">Minimum</th></tr></thead>` +
          `<tbody>${rows}</tbody></table>`
      ),
    },
    'stok menipis'
  );
}
