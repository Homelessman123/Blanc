import { Request, Response } from 'express';
import prisma from '../db';

// @desc    Create a contest
// @route   POST /api/contests
// @access  Private/Admin
export const createContest = async (req: Request, res: Response) => {
  const { title, description, startDate, endDate, organizer, website, imageUrl } = req.body;
  try {
    const contest = await prisma.contest.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        organizer,
        website,
        imageUrl,
        authorId: req.user!.id,
      },
    });
    res.status(201).json(contest);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create contest', error });
  }
};

// @desc    Get all contests
// @route   GET /api/contests
// @access  Public
export const getAllContests = async (req: Request, res: Response) => {
  try {
    const contests = await prisma.contest.findMany({ orderBy: { startDate: 'desc' } });
    res.json(contests);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch contests' });
  }
};

// @desc    Get contest by ID
// @route   GET /api/contests/:id
// @access  Public
export const getContestById = async (req: Request, res: Response) => {
  try {
    const contest = await prisma.contest.findUnique({ where: { id: req.params.id } });
    if (contest) {
      res.json(contest);
    } else {
      res.status(404).json({ message: 'Contest not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch contest' });
  }
};
