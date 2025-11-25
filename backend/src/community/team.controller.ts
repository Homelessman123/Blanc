import { Prisma, TeamMemberStatus, TeamRecruitmentStatus } from '@prisma/client';
import { Request, Response } from 'express';
import prisma from '../db';
import { recordAdminAction } from '../services/auditLog.service';

const teamListInclude = {
  owner: {
    select: {
      id: true,
      displayName: true,
      name: true,
      avatar: true,
      profileColor: true,
    },
  },
  tags: {
    include: {
      tag: true,
    },
  },
  members: {
    where: { status: TeamMemberStatus.ACTIVE },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          name: true,
          avatar: true,
          profileColor: true,
        },
      },
    },
  },
} satisfies Prisma.TeamRecruitmentInclude;

const detailInclude = {
  owner: {
    select: {
      id: true,
      displayName: true,
      name: true,
      avatar: true,
      profileColor: true,
      email: true,
    },
  },
  tags: {
    include: {
      tag: true,
    },
  },
  members: {
    where: { status: TeamMemberStatus.ACTIVE },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          name: true,
          avatar: true,
          profileColor: true,
          email: true,
          phoneNumber: true,
        },
      },
    },
  },
} satisfies Prisma.TeamRecruitmentInclude;

type TeamListEntity = Prisma.TeamRecruitmentGetPayload<{ include: typeof teamListInclude }>;
type TeamDetailEntity = Prisma.TeamRecruitmentGetPayload<{ include: typeof detailInclude }>;

const mapTeamListItem = (team: TeamListEntity, userId?: string | null) => {
  const activeMembers = team.members ?? [];
  const isMember = !!activeMembers.find((member) => member.userId === userId);

  return {
    id: team.id,
    title: team.title,
    teamName: team.teamName,
    summary: team.summary,
    lookingFor: team.lookingFor,
    status: team.status,
    maxMembers: team.maxMembers,
    activeMemberCount: activeMembers.length,
    tags: team.tags.map((tag) => tag.tag.name),
    owner: team.owner,
    membersPreview: activeMembers.slice(0, 4).map((member) => member.user),
    channelId: null,
    isMember,
  };
};

const mapTeamDetail = (team: TeamDetailEntity, userId?: string | null) => {
  const isMember = !!team.members.find((member) => member.userId === userId);

  return {
    ...team,
    tags: team.tags.map((tag) => tag.tag.name),
    members: team.members.map((member) => ({
      ...member,
      user: {
        ...member.user,
        displayName: member.user.displayName ?? member.user.name ?? '',
      },
    })),
    isMember,
  };
};

const normalizeTags = (tags: unknown): string[] => {
  const rawTags =
    Array.isArray(tags) ? tags :
      typeof tags === 'string' ? tags.split(',') : [];

  return Array.from(
    new Set(
      rawTags
        .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
        .filter((tag) => tag.length > 0)
    )
  ).slice(0, 8);
};

type IncomingMember = { userId: string; role?: string | null } | null | undefined;

const normalizeMembers = (members: unknown, ownerId: string): { userId: string; role?: string | null }[] => {
  if (!Array.isArray(members)) {
    return [];
  }

  const unique = new Map<string, { userId: string; role?: string | null }>();

  members.forEach((member) => {
    const item = member as IncomingMember;
    if (item && typeof item.userId === 'string') {
      const trimmedId = item.userId.trim();
      if (trimmedId && trimmedId !== ownerId) {
        unique.set(trimmedId, {
          userId: trimmedId,
          role: item.role?.trim() || 'Thành viên',
        });
      }
    }
  });

  return Array.from(unique.values()).slice(0, 20);
};

export const teamController = {
  async create(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const {
        title,
        teamName,
        summary,
        description,
        lookingFor,
        requirements,
        location,
        maxMembers,
        tags,
        members,
      } = req.body as Record<string, any>;

      if (!title?.trim() || !summary?.trim() || !description?.trim()) {
        return res.status(400).json({ success: false, message: 'Vui long dien day du tieu de, tom tat va mo ta.' });
      }

      const sanitizedTags = normalizeTags(tags);
      const desiredMaxMembers = Number(maxMembers);
      const safeMaxMembers = Number.isFinite(desiredMaxMembers) ? Math.max(1, desiredMaxMembers) : 4;

      const incomingMembers = normalizeMembers(members, userId);
      const memberIds = incomingMembers.map((member) => member.userId);

      if (memberIds.length > 0) {
        const foundUsers = await prisma.user.findMany({
          where: { id: { in: memberIds } },
          select: { id: true },
        });

        if (foundUsers.length !== memberIds.length) {
          return res.status(400).json({ success: false, message: 'Một hoặc nhiều thành viên không tồn tại.' });
        }
      }

      const team = await prisma.teamRecruitment.create({
        data: {
          title: title.trim(),
          teamName: teamName?.trim() || null,
          summary: summary.trim(),
          description: description.trim(),
          lookingFor: lookingFor?.trim() || null,
          requirements: requirements?.trim() || null,
          location: location?.trim() || null,
          maxMembers: safeMaxMembers,
          status: TeamRecruitmentStatus.OPEN,
          ownerId: userId,
          tags: {
            create: sanitizedTags.map((tagName) => ({
              tag: {
                connectOrCreate: {
                  where: { name: tagName },
                  create: { name: tagName },
                },
              },
            })),
          },
          members: {
            create: [
              {
                userId,
                role: 'Lead',
                status: TeamMemberStatus.ACTIVE,
              },
              ...incomingMembers.map((member) => ({
                userId: member.userId,
                role: member.role ?? 'Thành viên',
                status: TeamMemberStatus.ACTIVE,
              })),
            ],
          },
        },
        include: detailInclude,
      });

      res.status(201).json({
        success: true,
        team: mapTeamDetail(team, userId),
      });
    } catch (error) {
      console.error('Create team recruitment error:', error);
      res.status(500).json({ success: false, message: 'Khong the tao bai dang moi' });
    }
  },

  async list(req: Request, res: Response) {
    try {
      const userId = req.user?.id ?? null;
      const search = (req.query.search as string | undefined)?.trim();
      const tag = (req.query.tag as string | undefined)?.trim();
      const statusFilter = (req.query.status as string | undefined)?.trim().toUpperCase();
      const isAdmin = req.user?.role === 'ADMIN';
      const page = Math.max(Number(req.query.page) || 1, 1);
      const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 20, 1), 50);

      const where: Prisma.TeamRecruitmentWhereInput = {};
      const requestedStatus = statusFilter && Object.values(TeamRecruitmentStatus).includes(statusFilter as TeamRecruitmentStatus)
        ? (statusFilter as TeamRecruitmentStatus)
        : null;

      if (!isAdmin) {
        where.status = TeamRecruitmentStatus.OPEN;
      } else if (requestedStatus) {
        where.status = requestedStatus;
      }

      const andConditions: Prisma.TeamRecruitmentWhereInput[] = [];

      if (search) {
        andConditions.push({
          OR: [
            { title: { contains: search } },
            { teamName: { contains: search } },
            { summary: { contains: search } },
            { description: { contains: search } },
            { lookingFor: { contains: search } },
          ],
        });
      }

      if (tag) {
        andConditions.push({
          tags: {
            some: {
              tag: {
                name: { equals: tag },
              },
            },
          },
        });
      }

      const whereClause = andConditions.length > 0 ? { ...where, AND: andConditions } : where;

      const [total, teams] = await Promise.all([
        prisma.teamRecruitment.count({ where: whereClause }),
        prisma.teamRecruitment.findMany({
          where: whereClause,
          include: teamListInclude,
          orderBy: [
            { updatedAt: 'desc' },
            { createdAt: 'desc' },
          ],
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      res.json({
        success: true,
        teams: teams.map((team) => mapTeamListItem(team, userId)),
        meta: { total, page, pageSize },
      });
    } catch (error) {
      console.error('List team recruitment posts error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const isAdmin = req.user?.role === 'ADMIN';
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const existingTeam = await prisma.teamRecruitment.findUnique({
        where: { id },
        include: detailInclude,
      });

      if (!existingTeam) {
        return res.status(404).json({ success: false, message: 'Team recruitment not found' });
      }

      if (!isAdmin && existingTeam.ownerId !== userId) {
        return res.status(403).json({ success: false, message: 'Ban khong co quyen sua bai dang nay' });
      }

      const {
        title,
        teamName,
        summary,
        description,
        lookingFor,
        requirements,
        location,
        maxMembers,
        tags,
        status,
        members,
      } = req.body as Record<string, any>;

      if (!title?.trim() || !summary?.trim() || !description?.trim()) {
        return res.status(400).json({ success: false, message: 'Tieu de, tom tat va mo ta la bat buoc' });
      }

      const incomingMembers = normalizeMembers(members, existingTeam.ownerId);
      const activeMemberCount = incomingMembers.length + 1;
      const parsedMaxMembers = Number(maxMembers);
      const safeMaxMembers = Number.isFinite(parsedMaxMembers)
        ? Math.max(activeMemberCount || 1, parsedMaxMembers)
        : existingTeam.maxMembers;

      const requestedStatus = status && Object.values(TeamRecruitmentStatus).includes(status)
        ? status
        : null;

      let finalStatus = requestedStatus ?? existingTeam.status;
      if (finalStatus !== TeamRecruitmentStatus.CLOSED) {
        finalStatus = activeMemberCount >= safeMaxMembers
          ? TeamRecruitmentStatus.FULL
          : TeamRecruitmentStatus.OPEN;
      }

      const sanitizedTags = normalizeTags(tags ?? existingTeam.tags.map((tag) => tag.tag.name));
      const memberIds = incomingMembers.map((member) => member.userId);

      if (memberIds.length > 0) {
        const foundUsers = await prisma.user.findMany({
          where: { id: { in: memberIds } },
          select: { id: true },
        });

        if (foundUsers.length !== memberIds.length) {
          return res.status(400).json({ success: false, message: 'Một hoặc nhiều thành viên không tồn tại.' });
        }
      }

      await prisma.$transaction(async (tx) => {
        await tx.teamRecruitment.update({
          where: { id },
          data: {
            title: title.trim(),
            teamName: teamName?.trim() || null,
            summary: summary.trim(),
            description: description.trim(),
            lookingFor: lookingFor?.trim() || null,
            requirements: requirements?.trim() || null,
            location: location?.trim() || null,
            maxMembers: safeMaxMembers,
            status: finalStatus,
          },
        });

        await tx.teamRecruitmentTag.deleteMany({ where: { teamId: id } });

        if (sanitizedTags.length > 0) {
          const tagRecords = await Promise.all(
            sanitizedTags.map((tagName) =>
              tx.teamTag.upsert({
                where: { name: tagName },
                update: {},
                create: { name: tagName },
              })
            )
          );

          await tx.teamRecruitmentTag.createMany({
            data: tagRecords.map((tag) => ({
              teamId: id,
              tagId: tag.id,
            })),
            skipDuplicates: true,
          });
        }

        await tx.teamRecruitmentMember.deleteMany({
          where: { teamId: id, userId: { not: existingTeam.ownerId } },
        });

        if (incomingMembers.length > 0) {
          await tx.teamRecruitmentMember.createMany({
            data: incomingMembers.map((member) => ({
              teamId: id,
              userId: member.userId,
              role: member.role ?? 'Thành viên',
              status: TeamMemberStatus.ACTIVE,
            })),
            skipDuplicates: true,
          });
        }

        await tx.teamRecruitmentMember.upsert({
          where: {
            teamId_userId: {
              teamId: id,
              userId: existingTeam.ownerId,
            },
          },
          update: { role: 'Lead', status: TeamMemberStatus.ACTIVE },
          create: {
            teamId: id,
            userId: existingTeam.ownerId,
            role: 'Lead',
            status: TeamMemberStatus.ACTIVE,
          },
        });
      });

      const updatedTeam = await prisma.teamRecruitment.findUnique({
        where: { id },
        include: detailInclude,
      });

      if (!updatedTeam) {
        return res.status(404).json({ success: false, message: 'Team recruitment not found after update' });
      }

      res.json({
        success: true,
        team: mapTeamDetail(updatedTeam, userId),
      });
    } catch (error) {
      console.error('Update team recruitment error:', error);
      res.status(500).json({ success: false, message: 'Khong the cap nhat bai dang' });
    }
  },

  async detail(req: Request, res: Response) {
    try {
      const userId = req.user?.id ?? null;
      const { id } = req.params;

      const team = await prisma.teamRecruitment.findUnique({
        where: { id },
        include: detailInclude,
      });

      if (!team) {
        return res.status(404).json({ success: false, message: 'Team recruitment not found' });
      }

      const tagIds = team.tags.map((tag) => tag.tagId);
      let related: TeamListEntity[] = [];

      if (tagIds.length > 0) {
        related = await prisma.teamRecruitment.findMany({
          where: {
            status: TeamRecruitmentStatus.OPEN,
            id: { not: team.id },
            tags: {
              some: {
                tagId: { in: tagIds },
              },
            },
          },
          include: teamListInclude,
          take: 6,
        });
      }

      res.json({
        success: true,
        team: mapTeamDetail(team, userId),
        suggestions: related.map((item) => mapTeamListItem(item, userId)),
      });
    } catch (error) {
      console.error('Get team recruitment detail error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  async join(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const [team, joiningUser] = await Promise.all([
        prisma.teamRecruitment.findUnique({
          where: { id },
          include: detailInclude,
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            displayName: true,
            name: true,
            phoneNumber: true,
          },
        }),
      ]);

      if (!team) {
        return res.status(404).json({ success: false, message: 'Team recruitment not found' });
      }

      if (!joiningUser) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (team.status !== TeamRecruitmentStatus.OPEN) {
        return res.status(400).json({
          success: false,
          message: 'Nhóm đã đóng tuyển thành viên',
        });
      }

      const activeMembers = team.members;
      const alreadyMember = activeMembers.find((member) => member.userId === userId);

      if (alreadyMember) {
        return res.json({
          success: true,
          message: 'Bạn đã tham gia nhóm này',
        });
      }

      if (activeMembers.length >= team.maxMembers) {
        await prisma.teamRecruitment.update({
          where: { id: team.id },
          data: { status: TeamRecruitmentStatus.FULL },
        });

        return res.status(400).json({
          success: false,
          message: 'Nhóm đã đủ thành viên',
        });
      }

      await prisma.$transaction(async (tx) => {
        await tx.teamRecruitmentMember.create({
          data: {
            teamId: team.id,
            userId,
            status: TeamMemberStatus.ACTIVE,
          },
        });


        const activeCount = await tx.teamRecruitmentMember.count({
          where: {
            teamId: team.id,
            status: TeamMemberStatus.ACTIVE,
          },
        });

        if (activeCount >= team.maxMembers) {
          await tx.teamRecruitment.update({
            where: { id: team.id },
            data: { status: TeamRecruitmentStatus.FULL },
          });
        }
      });

      const updatedTeam = await prisma.teamRecruitment.findUnique({
        where: { id: team.id },
        include: detailInclude,
      });

      if (!updatedTeam) {
        throw new Error('Failed to reload team after join');
      }

      res.json({
        success: true,
        message: 'Tham gia nhóm thành công',
        team: mapTeamDetail(updatedTeam, userId),
      });
    } catch (error) {
      console.error('Join team recruitment error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body as { status?: TeamRecruitmentStatus };

      if (!status || !Object.values(TeamRecruitmentStatus).includes(status)) {
        return res.status(400).json({ success: false, message: 'Trang thai khong hop le' });
      }

      const updatedTeam = await prisma.teamRecruitment.update({
        where: { id },
        data: { status },
        include: detailInclude,
      });

      await recordAdminAction({
        actorId: req.user?.id,
        action: 'TEAM_STATUS_UPDATE',
        targetType: 'TEAM_RECRUITMENT',
        targetId: id,
        metadata: { status },
      });

      res.json({
        success: true,
        team: mapTeamDetail(updatedTeam, req.user?.id),
      });
    } catch (error) {
      console.error('Update team status error:', error);
      res.status(500).json({ success: false, message: 'Khong the cap nhat trang thai' });
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.$transaction(async (tx) => {
        await tx.teamRecruitmentTag.deleteMany({ where: { teamId: id } });
        await tx.teamRecruitmentMember.deleteMany({ where: { teamId: id } });
        await tx.teamRecruitment.delete({ where: { id } });
      });

      await recordAdminAction({
        actorId: req.user?.id,
        action: 'TEAM_DELETE',
        targetType: 'TEAM_RECRUITMENT',
        targetId: id,
      });

      res.json({ success: true, message: 'Da xoa bai dang t�m thanh vien' });
    } catch (error) {
      console.error('Delete team recruitment error:', error);
      res.status(500).json({ success: false, message: 'Khong the xoa bai dang' });
    }
  },
};
