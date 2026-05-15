import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use STARTTLS for port 587
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const sendOTPEmail = async (email: string, otp: string) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('Email credentials missing in environment variables');
  }

  const mailOptions = {
    from: `"Complaint Platform" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Your OTP for Complaint Registration Platform',
    text: `Your 6-digit OTP is: ${otp}. It will expire in 10 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent successfully to ${email}`);
  } catch (error: any) {
    console.error('Nodemailer Error Details:', error);
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};
