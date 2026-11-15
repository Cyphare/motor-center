export const rupiah = (amount: number): string => `Rp ${new Intl.NumberFormat('id-ID').format(amount)}`;

export const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

export const wibDate = (date: Date): string =>
  new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'long' }).format(date);

export const wibDateTime = (date: Date): string =>
  `${new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'long', timeStyle: 'short' }).format(date)} WIB`;
