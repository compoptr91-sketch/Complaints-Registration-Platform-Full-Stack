import { Resend } from 'resend';

const resend = new Resend('re_4qmnFUoo_JqA2d58nJhvJ879ee4uzT26Z');

export const sendOTPEmail = async (email: string, otp: string, name: string = 'User') => {
  console.log(`Attempting to send OTP via Resend to ${email}`);

  try {
    const { data, error } = await resend.emails.send({
      from: 'info@compop-dev.shop',
      to: email,
      subject: 'Your OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${name},</h2>
          <p>Your OTP code is:</p>
          <h1 style="font-size: 32px; letter-spacing: 2px; color: #333;">${otp}</h1>
          <p>Please use this code to verify your email address. It will expire in 10 minutes.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend Error Response:', error);
      throw new Error(`Resend Failed: ${error.message}`);
    }

    console.log(`OTP successfully sent via Resend to ${email}`);
  } catch (error: any) {
    console.error('Error in sendOTPEmail:', error);
    // Log the OTP as fallback so user isn't stuck
    console.log(`FALLBACK OTP FOR ${email}: ${otp}`);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};
