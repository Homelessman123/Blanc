import { Request, Response } from 'express';
import prisma from '../db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { syncUserStreak, sendWelcomeEmail } from '../services/googleAppsScript.service';
import { recordAdminAction } from '../services/auditLog.service';
import {
  issuePasswordResetOtp,
  verifyPasswordResetOtp,
  completePasswordReset as finalizePasswordReset,
} from './passwordReset.service';

// Helper function to safely parse JSON fields
const parseUserPreferences = (user: any) => {
  const parseJSON = (field: any) => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  return {
    ...user,
    interests: parseJSON(user.interests),
    talents: parseJSON(user.talents),
  };
};

const sanitizeUser = (user: any) => {
  const { password: _password, ...rest } = user;
  return parseUserPreferences(rest);
};

const normalizeArrayInput = (value: any) => {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter((item) => item !== null && item !== undefined && `${item}`.trim() !== '');
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // ignore parse error, will fall through
    }
    return value.trim() ? [value] : [];
  }

  return [];
};

export const checkEmail = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      res.status(200).json({ exists: true });
    } else {
      res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const register = async (req: Request, res: Response) => {
  const { email, password, name, location } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        location: location || null,
        password: hashedPassword,
      },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, {
      expiresIn: '7d',
    });

    // Remove password from user object before sending
    const { password: _, ...userWithoutPassword } = user;

    // Parse JSON strings back to arrays for interests and talents
    const parsedUser = parseUserPreferences(userWithoutPassword);

    // Send welcome email via Apps Script (async, don't wait)
    sendWelcomeEmail({
      email: user.email,
      name: user.name || user.email,
    }).catch((err) => console.error('Failed to send welcome email:', err));

    res.status(201).json({ token, user: parsedUser });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // ==================== STREAK LOGIC ====================
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let newStreak = user.streak || 0;
    let shouldUpdate = false;

    if (user.lastLoginDate) {
      const lastLogin = new Date(user.lastLoginDate);
      lastLogin.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor(
        (today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 0) {
        // Same day login - no streak change
        shouldUpdate = false;
      } else if (daysDiff === 1) {
        // Next day login - increment streak
        newStreak = user.streak + 1;
        shouldUpdate = true;
      } else {
        // Missed days - streak should already be reset to 0 by cron job
        // Start fresh with streak = 1
        newStreak = 1;
        shouldUpdate = true;
      }
    } else {
      // First login ever
      newStreak = 1;
      shouldUpdate = true;
    }

    // Update user streak and lastLoginDate
    let updatedUser = user;
    if (shouldUpdate || !user.lastLoginDate) {
      updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          streak: newStreak,
          lastLoginDate: new Date(),
        },
      });

      // Sync to Apps Script (async, don't wait)
      syncUserStreak({
        userId: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name || '',
        displayName: updatedUser.displayName || '',
        streakCount: newStreak,
      }).catch((err) => console.error('Failed to sync streak:', err));
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, {
      expiresIn: '7d',
    });

    // Remove password from user object before sending
    const { password: _, ...userWithoutPassword } = updatedUser;

    // Parse JSON strings back to arrays for interests and talents
    const parsedUser = parseUserPreferences(userWithoutPassword);

    res.status(200).json({ token, user: parsedUser });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  const user = req.user;

  // Parse JSON strings back to arrays for interests and talents
  if (user) {
    const parsedUser = parseUserPreferences(user);
    res.status(200).json({ user: parsedUser });
  } else {
    res.status(401).json({ message: 'User not found' });
  }
};

export const savePreferences = async (req: Request, res: Response) => {
  const { userId, interests, talents, futureMajor } = req.body;

  if (!userId || !interests || !talents) {
    return res.status(400).json({
      message: 'userId, interests va talents la bat buoc'
    });
  }

  if (!Array.isArray(interests) || !Array.isArray(talents)) {
    return res.status(400).json({
      message: 'interests va talents phai la mang'
    });
  }

  try {
    const sanitizedInterests = normalizeArrayInput(interests);
    const sanitizedTalents = normalizeArrayInput(talents);

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        interests: sanitizedInterests,
        talents: sanitizedTalents,
        futureMajor: futureMajor || null,
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    const parsedUser = parseUserPreferences(userWithoutPassword);

    res.status(200).json({
      success: true,
      message: 'Luu thong tin thanh cong!',
      user: parsedUser
    });
  } catch (error) {
    console.error('Save preferences error:', error);
    res.status(500).json({ message: 'Co loi xay ra khi luu thong tin' });
  }
};
export const updateProfile = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const {
    name,
    displayName,
    profileColor,
    profileGif,
    interests,
    talents,
    futureMajor,
    phoneNumber,
    location,
  } = req.body;

  try {
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (profileColor !== undefined) updateData.profileColor = profileColor;
    if (profileGif !== undefined) updateData.profileGif = profileGif;
    if (interests !== undefined) updateData.interests = normalizeArrayInput(interests);
    if (talents !== undefined) updateData.talents = normalizeArrayInput(talents);
    if (futureMajor !== undefined) updateData.futureMajor = futureMajor;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber || null;
    if (location !== undefined) updateData.location = location || null;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    const { password: _, ...userWithoutPassword } = user;

    // Parse JSON strings back to arrays for interests and talents
    const parsedUser = parseUserPreferences(userWithoutPassword);

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thành công!',
      user: parsedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi cập nhật thông tin' });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const search = (req.query.search as string | undefined)?.trim();
    const role = (req.query.role as string | undefined)?.toUpperCase();
    const page = Math.max(Number(req.query.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 20, 1), 100);

    const where: any = {};

    if (role && ['USER', 'ADMIN'].includes(role)) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          displayName: true,
          profileColor: true,
          profileGif: true,
          phoneNumber: true,
          location: true,
          interests: true,
          talents: true,
          futureMajor: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const parsedUsers = users.map((user) => parseUserPreferences(user));

    res.status(200).json({
      success: true,
      users: parsedUsers,
      meta: { total, page, pageSize },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi lấy danh sách người dùng' });
  }
};


export const updateUserRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role || !['USER', 'ADMIN'].includes(role)) {
    return res.status(400).json({ message: 'Role khong hop le' });
  }

  if (req.user?.id === id && role !== 'ADMIN') {
    return res.status(400).json({ message: 'Khong the tu ha quyen han' });
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { role },
    });

    await recordAdminAction({
      actorId: req.user?.id,
      action: 'UPDATE_USER_ROLE',
      targetType: 'USER',
      targetId: id,
      metadata: { role },
    });

    res.status(200).json({
      success: true,
      user: sanitizeUser(updated),
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Khong the cap nhat quyen nguoi dung' });
  }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  const email = (req.body.email as string | undefined)?.trim();

  if (!email) {
    return res.status(400).json({ message: 'Email la bat buoc' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to avoid email enumeration
    if (!user) {
      return res.status(200).json({ success: true, message: 'Neu email hop le, OTP se duoc gui.' });
    }

    await issuePasswordResetOtp(user.id, user.email);

    res.status(200).json({
      success: true,
      message: 'OTP da duoc gui, co hieu luc 2 phut.',
      expiresInSeconds: 120,
    });
  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({ message: 'Khong the gui OTP. Vui long thu lai.' });
  }
};

export const verifyPasswordReset = async (req: Request, res: Response) => {
  const email = (req.body.email as string | undefined)?.trim();
  const otp = (req.body.otp as string | undefined)?.trim();

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email va OTP la bat buoc' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'OTP khong hop le hoac da het han.' });
    }

    const result = await verifyPasswordResetOtp(user.id, otp);

    if (!result.valid || !result.resetToken) {
      return res.status(400).json({ message: 'OTP khong hop le hoac da het han.' });
    }

    res.status(200).json({
      success: true,
      resetToken: result.resetToken,
      resetExpiresAt: result.resetExpiresAt,
    });
  } catch (error) {
    console.error('Verify password reset error:', error);
    res.status(500).json({ message: 'Khong the xac thuc OTP. Vui long thu lai.' });
  }
};

export const completePasswordResetHandler = async (req: Request, res: Response) => {
  const email = (req.body.email as string | undefined)?.trim();
  const otp = (req.body.otp as string | undefined)?.trim();
  const resetToken = (req.body.token as string | undefined)?.trim() || (req.body.resetToken as string | undefined)?.trim();
  const newPassword = req.body.newPassword as string | undefined;

  if (!email || !newPassword) {
    return res.status(400).json({ message: 'Email va mat khau moi la bat buoc' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Mat khau moi phai co it nhat 6 ky tu' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Khong the doi mat khau' });
    }

    const result = await finalizePasswordReset({
      userId: user.id,
      otp,
      resetToken,
      newPassword,
    });

    if (!result.valid) {
      return res.status(400).json({ message: 'OTP hoac ma xac thuc khong hop le/het han' });
    }

    res.status(200).json({ success: true, message: 'Doi mat khau thanh cong' });
  } catch (error) {
    console.error('Complete password reset error:', error);
    res.status(500).json({ message: 'Khong the doi mat khau. Thu lai sau.' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (req.user?.id === id) {
    return res.status(400).json({ message: 'Khong the tu xoa tai khoan dang dang nhap' });
  }

  try {
    await prisma.user.delete({ where: { id } });
    await recordAdminAction({
      actorId: req.user?.id,
      action: 'DELETE_USER',
      targetType: 'USER',
      targetId: id,
    });
    res.status(200).json({ success: true, message: 'Nguoi dung da duoc xoa' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Khong the xoa nguoi dung' });
  }
};
