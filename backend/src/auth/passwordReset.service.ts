import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../db';
import { sendPasswordResetOtp } from '../services/passwordResetOtp.service';

const OTP_EXP_SECONDS = 120;
const RESET_TOKEN_EXP_MINUTES = 10;
const SALT_ROUNDS = 10;

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const generateResetToken = () => crypto.randomBytes(24).toString('hex');

export const issuePasswordResetOtp = async (userId: string, email: string) => {
  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);
  const otpExpiresAt = new Date(Date.now() + OTP_EXP_SECONDS * 1000);

  await prisma.passwordResetToken.upsert({
    where: { userId },
    create: {
      userId,
      otpHash,
      otpExpiresAt,
      resetTokenHash: null,
      resetExpiresAt: null,
    },
    update: {
      otpHash,
      otpExpiresAt,
      resetTokenHash: null,
      resetExpiresAt: null,
    },
  });

  await sendPasswordResetOtp({ email, otp, expiresInSeconds: OTP_EXP_SECONDS });
  return { otpExpiresAt };
};

export const verifyPasswordResetOtp = async (userId: string, otp: string) => {
  const record = await prisma.passwordResetToken.findUnique({ where: { userId } });
  const now = new Date();

  if (!record || !record.otpHash || !record.otpExpiresAt || record.otpExpiresAt < now) {
    return { valid: false };
  }

  const match = await bcrypt.compare(otp, record.otpHash);
  if (!match) {
    return { valid: false };
  }

  const resetToken = generateResetToken();
  const resetTokenHash = await bcrypt.hash(resetToken, SALT_ROUNDS);
  const resetExpiresAt = new Date(Date.now() + RESET_TOKEN_EXP_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.update({
    where: { userId },
    data: {
      otpHash: null,
      otpExpiresAt: null,
      resetTokenHash,
      resetExpiresAt,
    },
  });

  return { valid: true, resetToken, resetExpiresAt };
};

export const completePasswordReset = async (params: {
  userId: string;
  otp?: string;
  resetToken?: string;
  newPassword: string;
}) => {
  const record = await prisma.passwordResetToken.findUnique({ where: { userId: params.userId } });
  if (!record) {
    return { valid: false, reason: 'no_reset_request' };
  }

  const now = new Date();
  let allowed = false;

  if (params.resetToken && record.resetTokenHash && record.resetExpiresAt && record.resetExpiresAt > now) {
    const tokenMatch = await bcrypt.compare(params.resetToken, record.resetTokenHash);
    allowed = allowed || tokenMatch;
  }

  if (!allowed && params.otp && record.otpHash && record.otpExpiresAt && record.otpExpiresAt > now) {
    const otpMatch = await bcrypt.compare(params.otp, record.otpHash);
    allowed = allowed || otpMatch;
  }

  if (!allowed) {
    return { valid: false, reason: 'invalid_or_expired' };
  }

  const passwordHash = await bcrypt.hash(params.newPassword, SALT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: params.userId },
      data: { password: passwordHash },
    }),
    prisma.passwordResetToken.delete({ where: { userId: params.userId } }),
  ]);

  return { valid: true };
};
