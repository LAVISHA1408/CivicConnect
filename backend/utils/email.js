const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send email
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || 'CivicConnect'} <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || options.message
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

// Send welcome email
const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to CivicConnect!';
  const message = `
    Hi ${user.name},
    
    Welcome to CivicConnect! Your account has been successfully created.
    
    You can now:
    - Report civic issues in your community
    - Track the progress of your reports
    - Vote on issues that matter to you
    - Communicate with city administrators
    
    If you have any questions, feel free to contact our support team.
    
    Best regards,
    The CivicConnect Team
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Welcome to CivicConnect!</h2>
      <p>Hi ${user.name},</p>
      <p>Welcome to CivicConnect! Your account has been successfully created.</p>
      
      <h3 style="color: #3498db;">You can now:</h3>
      <ul>
        <li>Report civic issues in your community</li>
        <li>Track the progress of your reports</li>
        <li>Vote on issues that matter to you</li>
        <li>Communicate with city administrators</li>
      </ul>
      
      <p>If you have any questions, feel free to contact our support team.</p>
      
      <p>Best regards,<br>The CivicConnect Team</p>
    </div>
  `;

  return sendEmail({
    email: user.email,
    subject,
    message,
    html
  });
};

// Send password reset email
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const subject = 'Password Reset Request - CivicConnect';
  const message = `
    Hi ${user.name},
    
    You requested a password reset for your CivicConnect account.
    
    Click the link below to reset your password:
    ${resetUrl}
    
    This link will expire in 1 hour.
    
    If you didn't request this password reset, please ignore this email.
    
    Best regards,
    The CivicConnect Team
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Password Reset Request</h2>
      <p>Hi ${user.name},</p>
      <p>You requested a password reset for your CivicConnect account.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
      </div>
      
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this password reset, please ignore this email.</p>
      
      <p>Best regards,<br>The CivicConnect Team</p>
    </div>
  `;

  return sendEmail({
    email: user.email,
    subject,
    message,
    html
  });
};

// Send report status update email
const sendReportStatusUpdateEmail = async (user, report) => {
  const subject = `Report Update: ${report.reportId} - ${report.title}`;
  const message = `
    Hi ${user.name},
    
    Your report "${report.title}" (${report.reportId}) status has been updated to: ${report.status}
    
    Report Details:
    - Category: ${report.category}
    - Description: ${report.description}
    - Current Status: ${report.status}
    - Priority: ${report.priority}
    
    You can view the full details and track progress in your CivicConnect dashboard.
    
    Best regards,
    The CivicConnect Team
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Report Status Update</h2>
      <p>Hi ${user.name},</p>
      <p>Your report "<strong>${report.title}</strong>" (${report.reportId}) status has been updated to: <strong>${report.status}</strong></p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #3498db; margin-top: 0;">Report Details:</h3>
        <ul style="list-style: none; padding: 0;">
          <li><strong>Category:</strong> ${report.category}</li>
          <li><strong>Description:</strong> ${report.description}</li>
          <li><strong>Current Status:</strong> ${report.status}</li>
          <li><strong>Priority:</strong> ${report.priority}</li>
        </ul>
      </div>
      
      <p>You can view the full details and track progress in your CivicConnect dashboard.</p>
      
      <p>Best regards,<br>The CivicConnect Team</p>
    </div>
  `;

  return sendEmail({
    email: user.email,
    subject,
    message,
    html
  });
};

// Send contact form confirmation email
const sendContactConfirmationEmail = async (contact) => {
  const subject = 'Thank you for contacting CivicConnect';
  const message = `
    Hi ${contact.name},
    
    Thank you for contacting CivicConnect. We have received your message and will get back to you as soon as possible.
    
    Your Message Details:
    - Subject: ${contact.subject}
    - Category: ${contact.category}
    - Message: ${contact.message}
    
    We typically respond within 24 hours.
    
    Best regards,
    The CivicConnect Team
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Thank you for contacting us!</h2>
      <p>Hi ${contact.name},</p>
      <p>Thank you for contacting CivicConnect. We have received your message and will get back to you as soon as possible.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #3498db; margin-top: 0;">Your Message Details:</h3>
        <ul style="list-style: none; padding: 0;">
          <li><strong>Subject:</strong> ${contact.subject}</li>
          <li><strong>Category:</strong> ${contact.category}</li>
          <li><strong>Message:</strong> ${contact.message}</li>
        </ul>
      </div>
      
      <p>We typically respond within 24 hours.</p>
      
      <p>Best regards,<br>The CivicConnect Team</p>
    </div>
  `;

  return sendEmail({
    email: contact.email,
    subject,
    message,
    html
  });
};

// Send admin notification email
const sendAdminNotificationEmail = async (admin, notification) => {
  const subject = `Admin Notification: ${notification.title}`;
  const message = `
    Hi ${admin.name},
    
    ${notification.message}
    
    Please log in to your admin dashboard to view more details.
    
    Best regards,
    CivicConnect System
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Admin Notification</h2>
      <p>Hi ${admin.name},</p>
      <p>${notification.message}</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL}/admin" style="background-color: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Admin Dashboard</a>
      </div>
      
      <p>Best regards,<br>CivicConnect System</p>
    </div>
  `;

  return sendEmail({
    email: admin.email,
    subject,
    message,
    html
  });
};

// Send OTP email
const sendOTPEmail = async (email, otp, type = 'registration') => {
  const subject = type === 'registration' 
    ? 'Verify Your Email - CivicConnect Registration'
    : 'Your OTP Code - CivicConnect';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">CivicConnect</h1>
        <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Civic Issue Reporting Platform</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2c3e50; margin-top: 0;">Email Verification</h2>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Thank you for registering with CivicConnect! To complete your registration, please use the following OTP code:
        </p>
        
        <div style="background: white; border: 2px solid #3498db; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #3498db; font-size: 36px; margin: 0; letter-spacing: 5px; font-family: 'Courier New', monospace;">${otp}</h1>
        </div>
        
        <p style="color: #555; font-size: 14px;">
          <strong>Important:</strong>
        </p>
        <ul style="color: #555; font-size: 14px; line-height: 1.6;">
          <li>This OTP is valid for 10 minutes only</li>
          <li>Do not share this code with anyone</li>
          <li>If you didn't request this, please ignore this email</li>
        </ul>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
          <p style="color: #888; font-size: 12px; margin: 0;">
            This is an automated message from CivicConnect. Please do not reply to this email.
          </p>
        </div>
      </div>
    </div>
  `;

  return await sendEmail({
    email,
    subject,
    html
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendReportStatusUpdateEmail,
  sendContactConfirmationEmail,
  sendAdminNotificationEmail,
  sendOTPEmail
};
