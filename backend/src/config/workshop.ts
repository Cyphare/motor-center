import path from 'path';
import { env } from './env';

export const WORKSHOP = {
  name: env.APP_NAME,
  address: env.WORKSHOP_ADDRESS,
  phone: env.WORKSHOP_PHONE,
  hours: env.WORKSHOP_HOURS,
  logoPath: path.resolve(__dirname, '../../assets/logo.png'),
};
