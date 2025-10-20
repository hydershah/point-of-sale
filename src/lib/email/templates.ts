/**
 * Email Templates for Tenant Onboarding and Notifications
 */

export interface WelcomeEmailData {
  businessName: string
  subdomain: string
  adminEmail: string
  adminPassword: string
  loginUrl: string
}

export function generateWelcomeEmail(data: WelcomeEmailData): {
  subject: string
  html: string
  text: string
} {
  const { businessName, subdomain, adminEmail, adminPassword, loginUrl } = data

  const subject = `Welcome to POS Platform - ${businessName}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .credentials { background: white; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to POS Platform!</h1>
        </div>
        <div class="content">
          <h2>Your Business is Ready, ${businessName}!</h2>
          <p>Your Point of Sale system has been successfully set up and is ready to use.</p>
          
          <div class="credentials">
            <h3>Your Login Credentials:</h3>
            <p><strong>Business URL:</strong> ${loginUrl}</p>
            <p><strong>Subdomain:</strong> ${subdomain}.yourdomain.com</p>
            <p><strong>Admin Email:</strong> ${adminEmail}</p>
            <p><strong>Temporary Password:</strong> ${adminPassword}</p>
          </div>

          <p><strong>Important:</strong> Please change your password after your first login.</p>

          <a href="${loginUrl}" class="button">Access Your POS System</a>

          <h3>Getting Started:</h3>
          <ol>
            <li>Log in to your POS system</li>
            <li>Configure your business settings</li>
            <li>Add your products and categories</li>
            <li>Set up your team members</li>
            <li>Configure your hardware (printer, cash drawer)</li>
            <li>Start selling!</li>
          </ol>

          <h3>Need Help?</h3>
          <p>Check out our documentation or contact support at support@yourdomain.com</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 POS Platform. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Welcome to POS Platform!

Your Business is Ready, ${businessName}!

Your Point of Sale system has been successfully set up and is ready to use.

YOUR LOGIN CREDENTIALS:
Business URL: ${loginUrl}
Subdomain: ${subdomain}.yourdomain.com
Admin Email: ${adminEmail}
Temporary Password: ${adminPassword}

IMPORTANT: Please change your password after your first login.

Getting Started:
1. Log in to your POS system
2. Configure your business settings
3. Add your products and categories
4. Set up your team members
5. Configure your hardware (printer, cash drawer)
6. Start selling!

Need Help?
Check out our documentation or contact support at support@yourdomain.com

© 2024 POS Platform. All rights reserved.
  `

  return { subject, html, text }
}

export interface InvitationEmailData {
  businessName: string
  inviterName: string
  role: string
  inviteToken: string
  inviteUrl: string
}

export function generateInvitationEmail(data: InvitationEmailData): {
  subject: string
  html: string
  text: string
} {
  const { businessName, inviterName, role, inviteUrl } = data

  const subject = `You've been invited to join ${businessName} POS`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Team Invitation</h1>
        </div>
        <div class="content">
          <h2>You've Been Invited!</h2>
          <p>${inviterName} has invited you to join <strong>${businessName}</strong> as a <strong>${role}</strong>.</p>
          
          <a href="${inviteUrl}" class="button">Accept Invitation</a>

          <p>This invitation will expire in 7 days.</p>

          <p>If you have any questions, please contact ${inviterName} or your system administrator.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 POS Platform. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
You've Been Invited!

${inviterName} has invited you to join ${businessName} as a ${role}.

Accept Invitation: ${inviteUrl}

This invitation will expire in 7 days.

If you have any questions, please contact ${inviterName} or your system administrator.

© 2024 POS Platform. All rights reserved.
  `

  return { subject, html, text }
}

