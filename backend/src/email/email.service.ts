import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class EmailService {
  async sendOtpEmail(to: string, code: string, name: string) {
    console.log("BREVO KEY:", process.env.BREVO_API_KEY);
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'Inventory Pro', email: 'tolalong7@gmail.com' },
          to: [{ email: to, name }],
          subject: 'Your Password Reset Code — Inventory Pro',
          htmlContent: `
            <!DOCTYPE html>
            <html>
            <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:40px 0;">
                <tr><td align="center">
                  <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.08);overflow:hidden;">

                    <!-- Header -->
                    <tr>
                      <td style="background:linear-gradient(135deg,#1E90FF,#0055CC);padding:32px;text-align:center;">
                        <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:12px 20px;">
                          <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:1px;">📦 Inventory Pro</span>
                        </div>
                        <p style="color:rgba(255,255,255,0.85);margin:12px 0 0;font-size:15px;">Password Reset Request</p>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding:36px 40px;">
                        <p style="color:#1a1a2e;font-size:16px;margin:0 0 8px;">Hello, <strong>${name}</strong></p>
                        <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 28px;">
                          We received a request to reset your password. Use the verification code below.
                          This code is valid for <strong>60 seconds</strong>.
                        </p>

                        <!-- Code box -->
                        <div style="background:#f0f7ff;border:2px dashed #1E90FF;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
                          <p style="margin:0 0 8px;color:#555;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Your verification code</p>
                          <p style="margin:0;font-size:42px;font-weight:700;letter-spacing:12px;color:#0055CC;font-family:monospace;">${code}</p>
                        </div>

                        <p style="color:#888;font-size:13px;line-height:1.6;margin:0;">
                          If you did not request a password reset, you can safely ignore this email.
                          Your account remains secure.
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #eee;text-align:center;">
                        <p style="margin:0;color:#aaa;font-size:12px;">© ${new Date().getFullYear()} Inventory Pro · Do not reply to this email</p>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
          `,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(JSON.stringify(error));
      }
    } catch (err: any) {
      console.error('[EmailService] Brevo error:', err.message);
      throw new InternalServerErrorException(`Failed to send email: ${err.message}`);
    }
  }
}
