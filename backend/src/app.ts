import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import apiRoutes from './routes';
import { ensureDatabaseConnection } from './config/db';
import { notFoundMiddleware } from './middlewares/notFound.middleware';
import { errorMiddleware } from './middlewares/error.middleware';
import { apiRateLimiter } from './middlewares/rateLimit.middleware';
import { sendError } from './utils/response';

const app: Application = express();

// Trust first reverse proxy (e.g. Vercel / load balancer) for accurate client IP in rate limiting
app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
    credentials: env.CORS_ORIGIN !== '*',
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

app.use('/api', apiRateLimiter);

app.use(async (req, res, next) => {
  try {
    const connection = await ensureDatabaseConnection();
    if (!connection && req.path !== '/api/health') {
      sendError(res, 'Database tidak tersedia', 503);
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
});

app.use('/api', apiRoutes);

app.get('/', (_req, res) => {
  res.redirect('/api');
});

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
