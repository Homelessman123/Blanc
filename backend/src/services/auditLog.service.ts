import prisma from '../db';

interface AuditPayload {
  actorId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, any>;
}

/**
 * Persist a lightweight admin audit log entry.
 * Failures are swallowed to avoid blocking the main flow.
 */
export const recordAdminAction = async ({
  actorId,
  action,
  targetType,
  targetId,
  metadata,
}: AuditPayload) => {
  if (!actorId) return;

  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId,
        action,
        targetType,
        targetId: targetId ?? null,
        metadata: metadata ?? undefined,
      },
    });
  } catch (error) {
    // Do not block the request if logging fails
    console.error('Admin audit log failed', error);
  }
};
