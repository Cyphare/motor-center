import { escapeRegex } from './jakartaDate';

export const normalizePlate = (value: string): string =>
  value.trim().replace(/\s+/g, ' ').toUpperCase();


export const plateSearchPattern = (plate: string): RegExp => {
  const characters = normalizePlate(plate).replace(/ /g, '').split('');
  return new RegExp(`^${characters.map(escapeRegex).join('\\s*')}$`);
};
