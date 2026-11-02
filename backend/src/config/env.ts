import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const nodeEnvSchema = z.enum(['development', 'production', 'test']);
const portSchema = z.coerce.number().int().min(1).max(65535);
const nonEmptyString = (message: string) => z.string().trim().min(1, message);
const jwtSecretSchema = z
  .string()
  .trim()
  .min(8, 'JWT_SECRET wajib diisi minimal 8 karakter');

export const envSchema = z.object({
  NODE_ENV: nodeEnvSchema.default('development'),
  PORT: portSchema.default(8000),
  APP_NAME: z.string().trim().min(1).default('MotorCenter'),
  MONGODB_URI: nonEmptyString('MONGODB_URI wajib diisi'),
  JWT_SECRET: jwtSecretSchema,
  JWT_EXPIRES_IN: z.string().trim().min(1).default('1d'),
  CORS_ORIGIN: z.string().trim().min(1).default('*'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: portSchema.default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

function pickValid<T>(schema: z.ZodType<T>, value: unknown, fallback: T): T {
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
}

export const parseEnv = (
  rawEnv: NodeJS.ProcessEnv = process.env,
  onFatal: (code: number) => never = (code) => process.exit(code)
): EnvConfig => {
  const result = envSchema.safeParse(rawEnv);

  if (result.success) {
    return result.data;
  }

  console.error('Konfigurasi Environment tidak valid:');
  result.error.issues.forEach((issue) => {
    console.error(`   - ${issue.path.map(String).join('.')}: ${issue.message}`);
  });

  if (rawEnv.NODE_ENV === 'production') {
    return onFatal(1);
  }

  const parsedSecret = jwtSecretSchema.safeParse(rawEnv.JWT_SECRET);
  let jwtSecret: string;
  if (parsedSecret.success) {
    jwtSecret = parsedSecret.data;
  } else {
    jwtSecret = crypto.randomBytes(32).toString('hex');
    console.warn(
      '[env] JWT_SECRET kosong atau kurang dari 8 karakter; menggunakan ephemeral random secret untuk sesi non-production ini.'
    );
  }

  return {
    NODE_ENV: pickValid(nodeEnvSchema, rawEnv.NODE_ENV, 'development'),
    PORT: pickValid(portSchema, rawEnv.PORT, 8000),
    APP_NAME: pickValid(nonEmptyString('APP_NAME'), rawEnv.APP_NAME, 'MotorCenter'),
    MONGODB_URI: pickValid(
      nonEmptyString('MONGODB_URI'),
      rawEnv.MONGODB_URI,
      'mongodb://localhost:27017/motorcenter'
    ),
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: pickValid(nonEmptyString('JWT_EXPIRES_IN'), rawEnv.JWT_EXPIRES_IN, '1d'),
    CORS_ORIGIN: pickValid(nonEmptyString('CORS_ORIGIN'), rawEnv.CORS_ORIGIN, '*'),
    SMTP_HOST: typeof rawEnv.SMTP_HOST === 'string' ? rawEnv.SMTP_HOST : undefined,
    SMTP_PORT: pickValid(portSchema, rawEnv.SMTP_PORT, 587),
    SMTP_USER: typeof rawEnv.SMTP_USER === 'string' ? rawEnv.SMTP_USER : undefined,
    SMTP_PASS: typeof rawEnv.SMTP_PASS === 'string' ? rawEnv.SMTP_PASS : undefined,
    SMTP_FROM: typeof rawEnv.SMTP_FROM === 'string' ? rawEnv.SMTP_FROM : undefined,
  };
};

export const env = parseEnv();
