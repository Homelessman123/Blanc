import { Request, Response } from 'express';
import prisma from '../db';
import { recordAdminAction } from '../services/auditLog.service';

const parseJsonField = (value: any) => {
  if (!value) return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
};

const mapProductForResponse = (product: any) => {
  if (!product) return product;
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    type: product.type,
    imageUrl: product.imageUrl,
    downloadUrl: product.downloadUrl,
    categories: parseJsonField(product.categories),
    duration: product.duration,
    level: product.level,
    language: product.language,
    rating: product.rating,
    reviewCount: product.reviewCount,
    sellerName: product.seller?.name || null,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
};

const buildContestUpdatePayload = (data: any) => {
  const payload: any = {};

  if (data.title !== undefined) payload.title = data.title;
  if (data.description !== undefined) payload.description = data.description;
  if (data.startDate !== undefined) payload.startDate = new Date(data.startDate);
  if (data.endDate !== undefined) payload.endDate = new Date(data.endDate);
  if (data.registrationDeadline !== undefined) {
    payload.registrationDeadline = data.registrationDeadline ? new Date(data.registrationDeadline) : null;
  }
  if (data.organizer !== undefined) payload.organizer = data.organizer;
  if (data.website !== undefined) payload.website = data.website;
  if (data.imageUrl !== undefined) payload.imageUrl = data.imageUrl;
  if (data.category !== undefined) payload.category = data.category;
  if (data.tags !== undefined) {
    payload.tags = Array.isArray(data.tags) ? JSON.stringify(data.tags) : data.tags;
  }
  if (data.fee !== undefined) payload.fee = data.fee;
  if (data.format !== undefined) payload.format = data.format;
  if (data.targetGrade !== undefined) payload.targetGrade = data.targetGrade;
  if (data.registrationUrl !== undefined) payload.registrationUrl = data.registrationUrl;
  if (data.prize !== undefined) payload.prize = data.prize;
  if (data.requirements !== undefined) payload.requirements = data.requirements;
  if (data.isActive !== undefined) payload.isActive = data.isActive;
  if (data.benefits !== undefined) payload.benefits = data.benefits;
  if (data.eligibility !== undefined) payload.eligibility = data.eligibility;
  if (data.schedule !== undefined) payload.schedule = data.schedule;
  if (data.judges !== undefined) payload.judges = data.judges;
  if (data.partners !== undefined) payload.partners = data.partners;
  if (data.contactInfo !== undefined) payload.contactInfo = data.contactInfo;

  return payload;
};

// @desc    Create a contest
// @route   POST /api/contests
// @access  Private/Admin
export const createContest = async (req: Request, res: Response) => {
  const { title, description, startDate, endDate, organizer, website, imageUrl, ...optionalFields } = req.body;
  try {
    const optionalData = buildContestUpdatePayload(optionalFields);
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
        ...optionalData,
      },
    });
    await recordAdminAction({
      actorId: req.user?.id,
      action: 'CREATE_CONTEST',
      targetType: 'CONTEST',
      targetId: contest.id,
    });
    res.status(201).json(contest);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create contest', error });
  }
};

export const updateContest = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const contest = await prisma.contest.update({
      where: { id },
      data: buildContestUpdatePayload(req.body),
    });

    await recordAdminAction({
      actorId: req.user?.id,
      action: 'UPDATE_CONTEST',
      targetType: 'CONTEST',
      targetId: id,
    });

    res.json({ success: true, contest });
  } catch (error) {
    console.error('Update contest error:', error);
    res.status(400).json({ success: false, message: 'Failed to update contest' });
  }
};

export const deleteContest = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.contest.delete({ where: { id } });
    await recordAdminAction({
      actorId: req.user?.id,
      action: 'DELETE_CONTEST',
      targetType: 'CONTEST',
      targetId: id,
    });
    res.json({ success: true, message: 'Contest removed' });
  } catch (error) {
    console.error('Delete contest error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete contest' });
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
    const contest = await prisma.contest.findUnique({
      where: { id: req.params.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        suggestedProducts: {
          include: {
            seller: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (contest) {
      // Format the response with all detailed fields
      const formattedContest = {
        id: contest.id,
        title: contest.title,
        organization: contest.organizer,
        description: contest.description,
        imageUrl: contest.imageUrl,
        deadline: contest.registrationDeadline || contest.startDate,
        startDate: contest.startDate,
        tags: contest.tags ? JSON.parse(contest.tags) : [],
        category: contest.category,
        fee: contest.fee || 0,
        format: contest.format,
        targetGrade: contest.targetGrade,
        registrationUrl: contest.registrationUrl,
        website: contest.website,
        prize: contest.prize,

        // Detailed information fields (using any to bypass TypeScript until client regenerates)
        benefits: (contest as any).benefits || [],
        eligibility: (contest as any).eligibility || [],
        schedule: (contest as any).schedule || [],
        judges: (contest as any).judges || [],
        partners: (contest as any).partners || [],
        contactInfo: (contest as any).contactInfo || null,

        author: contest.author,
        suggestedProducts: contest.suggestedProducts?.map(mapProductForResponse) || [],
        createdAt: contest.createdAt,
        updatedAt: contest.updatedAt,
      };

      res.json({ success: true, contest: formattedContest });
    } else {
      res.status(404).json({ success: false, message: 'Contest not found' });
    }
  } catch (error) {
    console.error('Get contest by ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch contest' });
  }
};
