const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    // Configure your email transporter
    this.transporter = nodemailer.createTransport({
      // Gmail example (you can use other services)
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Your gmail address
        pass: process.env.EMAIL_PASS, // Your gmail app password
      },
    });

    // Alternative: Using SMTP (for school email servers)
    // this.transporter = nodemailer.createTransport({
    //   host: 'smtp.rit.edu', // Your school's SMTP server
    //   port: 587,
    //   secure: false,
    //   auth: {
    //     user: process.env.EMAIL_USER,
    //     pass: process.env.EMAIL_PASS
    //   }
    // });
    // });
  }

  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendVerificationEmail(email, username, verificationCode) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "RIT AI Club - Email Verification",
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #4ECDC4, #44A08D); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">RIT AI Club</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Email Verification</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Welcome ${username}! 👋</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Thank you for registering with the RIT AI Club! To complete your registration, 
              please verify your email address by using the verification code below.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0; border: 2px dashed #4ECDC4;">
              <p style="margin: 0; color: #666; font-size: 14px;">Your Verification Code:</p>
              <h1 style="margin: 10px 0 0 0; color: #4ECDC4; font-size: 36px; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${verificationCode}
              </h1>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              • This code will expire in <strong>15 minutes</strong><br>
              • Use the <code>/verify</code> command in Discord with this code<br>
              • If you didn't request this, please ignore this email
            </p>
          </div>
          
          <div style="background: #e8f5f3; padding: 20px; border-radius: 8px; border-left: 4px solid #4ECDC4;">
            <h3 style="color: #333; margin-top: 0;">🚀 What's Next?</h3>
            <ul style="color: #666; line-height: 1.6; margin-bottom: 0;">
              <li>Use <code>/verify code:${verificationCode}</code> in Discord</li>
              <li>Browse projects with <code>/projects</code></li>
              <li>Connect with project leads using <code>/contact</code></li>
              <li>Start contributing to AI projects!</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              © 2025 RIT AI Club | Rochester Institute of Technology<br>
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("Verification email sent:", info.messageId);
      return true;
    } catch (error) {
      console.error("Error sending verification email:", error);
      return false;
    }
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      console.log("Email service is ready");
      return true;
    } catch (error) {
      console.error("Email service error:", error);
      return false;
    }
  }
}

module.exports = new EmailService();
