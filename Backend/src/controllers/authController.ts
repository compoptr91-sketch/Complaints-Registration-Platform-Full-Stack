import { Request, Response } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { sendOTPEmail } from '../services/mailService';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export const sendOTP = async (req: Request, res: Response) => {
  const { name, email } = req.body;

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ error: 'Email already registered and verified' });
      }
      // Update OTP for unverified user
      await db.update(users).set({ name, otp, otpExpiry }).where(eq(users.id, existingUser.id));
    } else {
      // Create new unverified user
      await db.insert(users).values({
        name,
        email,
        password: '', // Will be set during registration
        otp,
        otpExpiry,
        isVerified: false,
      });
    }

    await sendOTPEmail(email, otp);
    res.json({ message: 'OTP sent to your email' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const register = async (req: Request, res: Response) => {
  const { email, otp, password } = req.body;

  try {
    const user = await db.query.users.findFirst({
      where: and(eq(users.email, email), eq(users.otp, otp)),
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid OTP or email' });
    }

    if (user.otpExpiry && user.otpExpiry < new Date()) {
      return res.status(400).json({ error: 'OTP expired' });
    }

    await db.update(users).set({
      password, // Plain text as requested
      isVerified: true,
      otp: null,
      otpExpiry: null,
    }).where(eq(users.id, user.id));

    res.json({ message: 'Registration successful' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user || !user.isVerified || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    res.cookie('token', token, {
      httpOnly: false, // As per requirements
      secure: false,   // As per requirements
      sameSite: 'lax', // For local testing
    });

    res.json({ name: user.name, email: user.email, role: user.role });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
};

export const me = async (req: Request, res: Response) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.id),
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ name: user.name, email: user.email, role: user.role });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
