import fs from 'fs';
import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { IBooking } from '../models/booking.model';
import { User } from '../models/user.model';
import { SERVICE_STATUS } from '../constants';
import { WORKSHOP } from '../config/workshop';
import { rupiah, wibDate, wibDateTime } from '../utils/format';

export interface InvoiceRow {
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  serviceDate: string;
  pickedUpAt: string;
  customerName: string;
  customerPhone: string;
  motorModel: string;
  plateNumber: string;
  cashierName: string;
  mechanicName: string;
  mechanicNotes?: string;
  rows: InvoiceRow[];
  serviceFee: number;
  partsTotal: number;
  grandTotal: number;
}

export async function loadInvoiceData(booking: IBooking): Promise<InvoiceData> {
  const pickup = [...booking.statusHistory].reverse().find((entry) => entry.status === SERVICE_STATUS.DIAMBIL);
  const [cashier, mechanic] = await Promise.all([
    pickup ? User.findById(pickup.changedBy).select('name').lean() : null,
    booking.mechanicId ? User.findById(booking.mechanicId).select('name').lean() : null,
  ]);

  const rows: InvoiceRow[] = [
    {
      description: `Jasa servis${booking.serviceName ? ` - ${booking.serviceName}` : ''}`,
      quantity: 1,
      unitPrice: booking.serviceFee,
      subtotal: booking.serviceFee,
    },
    ...booking.partsUsed.map((part) => ({
      description: `${part.name} (${part.code})`,
      quantity: part.quantity,
      unitPrice: part.price,
      subtotal: part.subtotal,
    })),
  ];

  return {
    invoiceNumber: booking.bookingNumber,
    serviceDate: wibDate(booking.serviceDate),
    pickedUpAt: wibDateTime(booking.pickedUpAt!),
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    motorModel: booking.motorModel,
    plateNumber: booking.plateNumber,
    cashierName: cashier?.name ?? '-',
    mechanicName: mechanic?.name ?? '-',
    mechanicNotes: booking.mechanicNotes || undefined,
    rows,
    serviceFee: booking.serviceFee,
    partsTotal: booking.partsTotalCost,
    grandTotal: booking.serviceFee + booking.partsTotalCost,
  };
}

const LEFT = 50;
const WIDTH = 495;
const COLUMNS = [
  { title: 'No', width: 30, align: 'center' as const },
  { title: 'Deskripsi', width: 215, align: 'left' as const },
  { title: 'Qty', width: 50, align: 'center' as const },
  { title: 'Harga Satuan', width: 100, align: 'right' as const },
  { title: 'Subtotal', width: 100, align: 'right' as const },
];

function drawRow(pdf: PDFKit.PDFDocument, y: number, cells: string[], bold = false): number {
  pdf.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
  const height =
    Math.max(...cells.map((cell, i) => pdf.heightOfString(cell, { width: COLUMNS[i].width - 10 }))) + 10;
  let x = LEFT;
  cells.forEach((cell, i) => {
    pdf.text(cell, x + 5, y + 5, { width: COLUMNS[i].width - 10, align: COLUMNS[i].align });
    x += COLUMNS[i].width;
  });
  pdf.moveTo(LEFT, y + height).lineTo(LEFT + WIDTH, y + height).strokeColor('#cccccc').lineWidth(0.5).stroke();
  return y + height;
}

function drawTableHeader(pdf: PDFKit.PDFDocument, y: number): number {
  pdf.rect(LEFT, y, WIDTH, 20).fill('#f1f1f1').fillColor('black');
  return drawRow(pdf, y, COLUMNS.map((column) => column.title), true);
}

export function writeInvoice(data: InvoiceData, res: Response): void {
  const pdf = new PDFDocument({ size: 'A4', margin: 50 });
  pdf.on('error', (error) => {
    console.error(`[PDF] Faktur ${data.invoiceNumber} gagal:`, error);
    res.destroy(error);
  });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${data.invoiceNumber}.pdf"`);
  pdf.pipe(res);

  const hasLogo = fs.existsSync(WORKSHOP.logoPath);
  if (hasLogo) pdf.image(WORKSHOP.logoPath, LEFT, 45, { height: 60 });
  const identityX = hasLogo ? LEFT + 65 : LEFT;
  pdf.font('Helvetica-Bold').fontSize(18).fillColor('black').text(WORKSHOP.name, identityX, 50);
  pdf.font('Helvetica').fontSize(9).fillColor('#444444')
    .text(WORKSHOP.address, identityX, 72, { width: 260 })
    .text(`Telp. ${WORKSHOP.phone}`, identityX)
    .text(WORKSHOP.hours, identityX);
  pdf.font('Helvetica-Bold').fontSize(16).fillColor('black').text('FAKTUR SERVIS', 330, 50, { width: 215, align: 'right' });
  pdf.font('Helvetica').fontSize(9)
    .text(`No. Faktur: ${data.invoiceNumber}`, 330, 72, { width: 215, align: 'right' })
    .text(`Tanggal Ambil: ${data.pickedUpAt}`, 330, undefined, { width: 215, align: 'right' });
  pdf.moveTo(LEFT, 118).lineTo(LEFT + WIDTH, 118).strokeColor('black').lineWidth(1).stroke();

  const infoBlocks: Array<[string, string[]]> = [
    ['Pelanggan', [data.customerName, data.customerPhone]],
    ['Kendaraan', [data.motorModel, data.plateNumber, `Masuk: ${data.serviceDate}`]],
    ['Petugas', [`Kasir: ${data.cashierName}`, `Mekanik: ${data.mechanicName}`]],
  ];
  infoBlocks.forEach(([title, lines], i) => {
    const x = LEFT + i * 165;
    pdf.font('Helvetica-Bold').fontSize(9).fillColor('#444444').text(title.toUpperCase(), x, 132, { width: 160 });
    pdf.font('Helvetica').fontSize(10).fillColor('black');
    lines.forEach((line) => pdf.text(line, x, undefined, { width: 160 }));
  });

  let y = drawTableHeader(pdf, 200);
  data.rows.forEach((row, i) => {
    if (y > pdf.page.height - 160) {
      pdf.addPage();
      y = drawTableHeader(pdf, 50);
    }
    y = drawRow(pdf, y, [
      String(i + 1),
      row.description,
      String(row.quantity),
      rupiah(row.unitPrice),
      rupiah(row.subtotal),
    ]);
  });

  if (y > pdf.page.height - 160) {
    pdf.addPage();
    y = 50;
  }
  const totals: Array<[string, string, boolean]> = [
    ['Biaya Jasa', rupiah(data.serviceFee), false],
    ['Total Suku Cadang', rupiah(data.partsTotal), false],
    ['TOTAL', rupiah(data.grandTotal), true],
  ];
  y += 10;
  totals.forEach(([label, value, bold]) => {
    pdf.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 12 : 10).fillColor('black');
    pdf.text(label, 300, y, { width: 140, align: 'right' });
    pdf.text(value, 445, y, { width: 100, align: 'right' });
    y += bold ? 20 : 16;
  });

  if (data.mechanicNotes) {
    const notesHeight = pdf.font('Helvetica').fontSize(9).heightOfString(data.mechanicNotes, { width: WIDTH }) + 25;
    if (y + notesHeight > pdf.page.height - 110) {
      pdf.addPage();
      y = 40;
    }
    pdf.font('Helvetica-Bold').fontSize(9).text('Catatan Mekanik', LEFT, y + 10);
    pdf.font('Helvetica').fontSize(9).text(data.mechanicNotes, LEFT, undefined, { width: WIDTH });
  }

  pdf.font('Helvetica').fontSize(8).fillColor('#666666').text(
    `Terima kasih telah mempercayakan perawatan kendaraan Anda kepada ${WORKSHOP.name}. ` +
      'Faktur ini sah tanpa tanda tangan karena dibuat secara elektronik.',
    LEFT,
    pdf.page.height - 90,
    { width: WIDTH, align: 'center' }
  );

  pdf.end();
}
