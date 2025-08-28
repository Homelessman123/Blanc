import { Request, Response } from 'express';
import prisma from '../db';

// @desc    Get wallet information for logged in user
// @route   GET /api/wallet
// @access  Private
export const getWalletInfo = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { balance: true },
    });

    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ balance: user.balance, transactions });
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch wallet information' });
  }
};

// @desc    Request a payout
// @route   POST /api/wallet/payouts
// @access  Private
export const requestPayout = async (req: Request, res: Response) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'A valid amount is required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const payoutRequest = await prisma.payoutRequest.create({
      data: {
        userId: req.user!.id,
        amount,
      },
    });

    // NOTE: We are NOT deducting the balance here. 
    // Balance is only deducted when an admin processes and approves the request.

    res.status(201).json(payoutRequest);
  } catch (error) {
    res.status(500).json({ message: 'Could not create payout request' });
  }
};
