import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

import authRoutes from './auth/auth.routes';

import contestRoutes from './contest/contest.routes';

import productRoutes from './product/product.routes';

import cartRoutes from './cart/cart.routes';

import orderRoutes from './order/order.routes';

import walletRoutes from './wallet/wallet.routes';

app.get('/', (req: Request, res: Response) => {
  res.send('ContestHub Backend is running!');
});

app.use('/api/auth', authRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wallet', walletRoutes);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
