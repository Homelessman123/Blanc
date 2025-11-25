import { Request, Response } from 'express';
import prisma from '../db';

export const listAuditLogs = async (req: Request, res: Response) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 20, 1), 100);

    const [total, logs] = await Promise.all([
      prisma.adminAuditLog.count(),
      prisma.adminAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { id: true, email: true, displayName: true, name: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    res.json({
      success: true,
      logs,
      meta: { total, page, pageSize },
    });
  } catch (error) {
    console.error('List audit logs error', error);
    res.status(500).json({ success: false, message: 'Khong the lay nhat ky he thong' });
  }
};
