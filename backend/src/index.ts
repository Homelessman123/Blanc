import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors, { CorsOptions } from 'cors';
import path from 'path';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

const rawOrigins = process.env.CORS_ORIGIN || 'http://localhost:5173';
const allowedOrigins = rawOrigins
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

if (allowedOrigins.length === 0) {
  allowedOrigins.push('*');
}

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

import authRoutes from './auth/auth.routes';

import contestRoutes from './contest/contest.routes';

import productRoutes from './product/productRoutes';

import orderRoutes from './order/order.routes';

import walletRoutes from './wallet/wallet.routes';

import uploadRoutes from './upload/upload.routes';

import chatbotRoutes from './chatbot/chatbot.routes';

import communityRoutes from './community/team.routes';

import syncRoutes from './sync/sync.routes';

import userRoutes from './user/user.routes';
import adminRoutes from './admin/audit.routes';

// Cron jobs
import { startStreakCronJob } from './services/streak.cron';

app.get('/', (req: Request, res: Response) => {
  res.send('ContestHub Backend is running!');
});

app.use('/api/auth', authRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Start cron jobs
startStreakCronJob();

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
