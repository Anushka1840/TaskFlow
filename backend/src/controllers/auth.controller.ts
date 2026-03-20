import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../lib/response';
import { AuthRequest } from '../types';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const generateTokens = (userId: string, email: string) => {
  const accessToken = jwt.sign(
    { userId, email },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as any }
  );
  const refreshToken = jwt.sign(
    { userId, email },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any }
  );
  return { accessToken, refreshToken };
};

const storeRefreshToken = async (token: string, userId: string) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await prisma.refreshToken.create({ data: { token, userId, expiresAt } });
};

// POST /auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Validation failed', 400, parsed.error.flatten());
      return;
    }
    const { name, email, password } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      sendError(res, 'An account with this email already exists.', 400);
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    const { accessToken, refreshToken } = generateTokens(user.id, user.email);
    await storeRefreshToken(refreshToken, user.id);
    sendSuccess(res, { user, accessToken, refreshToken }, 'Account created successfully', 201);
  } catch (error) {
    console.error('Register error:', error);
    sendError(res, 'Internal server error');
  }
};

// POST /auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Validation failed', 400, parsed.error.flatten());
      return;
    }
    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      sendError(res, 'Invalid email or password.', 401);
      return;
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      sendError(res, 'Invalid email or password.', 401);
      return;
    }
    const { accessToken, refreshToken } = generateTokens(user.id, user.email);
    await storeRefreshToken(refreshToken, user.id);
    sendSuccess(res, {
      user: { id: user.id, name: user.name, email: user.email },
      accessToken,
      refreshToken,
    }, 'Logged in successfully');
  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 'Internal server error');
  }
};

// POST /auth/refresh
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      sendError(res, 'Refresh token is required.', 400);
      return;
    }
    let payload: { userId: string; email: string };
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
    } catch {
      sendError(res, 'Invalid or expired refresh token.', 401);
      return;
    }
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
      sendError(res, 'Refresh token not found or expired. Please log in again.', 401);
      return;
    }
    // #16 - Log token rotation for security audit
    console.log(`[TOKEN REFRESH] userId=${payload.userId} at=${new Date().toISOString()}`);
    await prisma.refreshToken.delete({ where: { token: refreshToken } });
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(payload.userId, payload.email);
    await storeRefreshToken(newRefreshToken, payload.userId);
    sendSuccess(res, { accessToken, refreshToken: newRefreshToken }, 'Tokens refreshed');
  } catch (error) {
    console.error('Refresh error:', error);
    sendError(res, 'Internal server error');
  }
};

// POST /auth/logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    console.error('Logout error:', error);
    sendError(res, 'Internal server error');
  }
};

// GET /auth/me — #1 new endpoint
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, createdAt: true, _count: { select: { tasks: true } } },
    });
    if (!user) {
      sendError(res, 'User not found.', 404);
      return;
    }
    sendSuccess(res, { ...user, taskCount: user._count.tasks }, 'Profile retrieved');
  } catch (error) {
    console.error('GetMe error:', error);
    sendError(res, 'Internal server error');
  }
};
