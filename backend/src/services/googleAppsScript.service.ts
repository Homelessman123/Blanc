import prisma from '../db';

/**
 * Local replacement for the previous Google Apps Script bridge.
 * All streak + calendar data is persisted directly in the database.
 */

// ==================== USER STREAK ====================

export const syncUserStreak = async (userData: {
  userId: string;
  email: string;
  name: string;
  displayName?: string;
  streakCount: number;
}) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userData.userId },
          { email: userData.email },
        ],
      },
    });

    if (!user) {
      throw new Error('User not found for streak sync');
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        streak: userData.streakCount,
        lastLoginDate: new Date(),
        name: userData.name || user.name,
        displayName: userData.displayName || user.displayName,
      },
    });

    await prisma.streakLog.create({
      data: {
        userId: updated.id,
        email: updated.email,
        date: new Date(),
        streakCount: userData.streakCount,
        action: 'LOGIN',
      },
    });

    console.log('Synced user streak to DB:', userData.email);
    return { success: true, streak: updated.streak };
  } catch (error: any) {
    console.error('Error syncing user streak to DB:', error.message);
    return null;
  }
};

// ==================== CALENDAR EVENTS ====================

export const notifyContestRegistration = async (data: {
  userId: string;
  userEmail: string;
  userName: string;
  contestId: string;
  contestTitle: string;
  contestDescription?: string;
  startDate: Date;
  endDate: Date;
  registrationDeadline?: Date;
}) => {
  try {
    await prisma.calendarEvent.create({
      data: {
        userId: data.userId,
        contestId: data.contestId,
        title: data.contestTitle,
        description: data.contestDescription || '',
        startDate: data.startDate,
        endDate: data.endDate,
        type: 'CONTEST',
      },
    });

    console.log('Stored calendar event for registration:', data.contestTitle);
    return { success: true };
  } catch (error: any) {
    console.error('Error storing calendar event:', error.message);
    return null;
  }
};

export const addContest = async (contest: {
  contestId: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  registrationDeadline?: Date;
  organizer: string;
  category?: string;
}) => {
  // Hook preserved for compatibility; no external sync needed.
  console.log('Contest hook (no external sync):', contest.title);
  return { success: true };
};

// ==================== EMAIL (STUBS) ====================

export const sendWelcomeEmail = async (data: { email: string; name: string }) => {
  console.log(`(stub) Welcome email to ${data.email} (${data.name})`);
  return { success: true };
};

export const notifyNewContest = async (contest: { title: string; description?: string }) => {
  console.log('(stub) New contest notification:', contest.title);
  return { success: true };
};

// ==================== QUERY HELPERS ====================

export const getUserRegistrations = async (userId: string) => {
  try {
    const registrations = await prisma.contestParticipation.findMany({
      where: { userId },
      include: {
        contest: true,
      },
      orderBy: { joinedAt: 'desc' },
    });

    console.log('Retrieved user registrations from DB');
    return registrations;
  } catch (error: any) {
    console.error('Error getting user registrations:', error.message);
    return [];
  }
};

export const getUserCalendarEvents = async (userId: string, startDate?: Date, endDate?: Date) => {
  try {
    const events = await prisma.calendarEvent.findMany({
      where: {
        userId,
        ...(startDate || endDate
          ? {
              startDate: startDate ? { gte: startDate } : undefined,
              endDate: endDate ? { lte: endDate } : undefined,
            }
          : {}),
      },
      orderBy: { startDate: 'asc' },
    });

    console.log('Retrieved user calendar events from DB');
    return events;
  } catch (error: any) {
    console.error('Error getting user calendar events:', error.message);
    return [];
  }
};

export const getUserStreak = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { streak: true },
    });
    console.log('Retrieved user streak from DB');
    return user?.streak ?? null;
  } catch (error: any) {
    console.error('Error getting user streak:', error.message);
    return null;
  }
};

// ==================== HEALTH CHECK ====================

export const checkAppsScriptHealth = async (): Promise<boolean> => {
  // Always healthy now that we are local-only.
  return true;
};
