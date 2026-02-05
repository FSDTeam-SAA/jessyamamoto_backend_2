const createOtpTemplate = (
  code: string,
  email?: string,
  companyName: string = 'Your Company',
): string => `
  <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 20px auto; background-color: #f9fafb; padding: 24px;">
    <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
      
      <!-- Header -->
      <header style="background: linear-gradient(90deg, #4f46e5, #6366f1); padding: 28px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 22px; font-weight: 600;">Verify your Email</h2>
        <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.9;">Secure your ${companyName} account</p>
      </header>
      
      <!-- Body -->
      <main style="padding: 32px 24px; text-align: center; color: #374151;">
        <p style="font-size: 16px; margin: 0 0 16px;">Hi ${email || 'there'},</p>
        <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          We received a request to verify your account. Please use the following one-time code:
        </p>
        
        <!-- OTP Box -->
        <div style="display: inline-block; background-color: #eef2ff; padding: 18px 36px; border-radius: 12px; font-size: 32px; font-weight: 700; color: #4f46e5; letter-spacing: 6px; margin: 20px 0;">
          ${code}
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">
          This code will expire in <strong>5 minutes</strong>. If you didn’t request this, please ignore this email.
        </p>
      </main>
      
      <!-- Footer -->
      <footer style="background-color: #f3f4f6; text-align: center; padding: 16px; font-size: 12px; color: #9ca3af;">
        &copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.
      </footer>
    </div>
  </div>
`;

export default createOtpTemplate;
