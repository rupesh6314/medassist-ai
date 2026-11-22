/**
 * MedAssist AI — Email Notification Service
 * Transport: SMTP over SSL / TLS via Google Gmail
 * Uses Nodemailer with clean responsive HTML email templates
 */

const nodemailer = require('nodemailer');

// 1. Initialize SMTP transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: true, // true for port 465
  auth: {
    user: process.env.SMTP_USER || 'rupesh.madhuvarsu2005@gmail.com',
    pass: process.env.SMTP_PASS || 'jinpsnjiqkvdqelw'
  }
});

const DEFAULT_FROM = process.env.EMAIL_FROM || '"MeddiAssist" <rupesh.madhuvarsu2005@gmail.com>';

/**
 * Verify transporter connection on startup
 */
async function verifyEmailService() {
  try {
    await transporter.verify();
    console.log('[Email Service] Connected to Google Gmail SMTP successfully.');
    return true;
  } catch (err) {
    console.error('[Email Service] SMTP verification failed:', err.message);
    return false;
  }
}

/**
 * Responsive HTML Template wrapper
 */
function wrapHtmlEmail({ title, preheader, contentHtml, actionButton }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
    .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #0f766e, #0d9488); padding: 28px 32px; text-align: left; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 4px 0 0; color: #ccfbf1; font-size: 13px; }
    .content { padding: 32px; line-height: 1.6; font-size: 14px; }
    .alert-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 20px 0; color: #991b1b; }
    .info-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 18px; margin: 20px 0; }
    .btn { display: inline-block; background: #0f766e; color: #ffffff !important; text-decoration: none; padding: 12px 24px; font-weight: 600; font-size: 14px; border-radius: 8px; margin: 16px 0; text-align: center; }
    .footer { background: #f8fafc; padding: 20px 32px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; }
    .footer a { color: #0f766e; text-decoration: none; }
  </style>
</head>
<body>
  <div style="display: none; max-height: 0px; overflow: hidden;">${preheader || title}</div>
  <div class="container">
    <div class="header">
      <h1>MeddiAssist AI</h1>
      <p>Intelligent Healthcare & Clinical Insights</p>
    </div>
    <div class="content">
      ${contentHtml}
      ${actionButton ? `<div style="text-align: center; margin: 25px 0;"><a href="${actionButton.url}" class="btn">${actionButton.text}</a></div>` : ''}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} MeddiAssist AI Healthcare Platform. Confidential Health Notification.</p>
      <p>This message was sent to you based on your clinical account notification preferences.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generic send mail function
 */
async function sendMail({ to, subject, text, html }) {
  try {
    const info = await transporter.sendMail({
      from: DEFAULT_FROM,
      to,
      subject,
      text: text || 'MeddiAssist AI Notification',
      html
    });
    console.log(`[Email Service] Message sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Email Service] Failed to send email to ${to}:`, err.message);
    throw err;
  }
}

/**
 * 1. Send Report Analysis Ready Notification
 */
async function sendReportAnalyzedEmail({ to, patientName, reportType, reportDate, abnormalCount, reportId }) {
  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const reportUrl = `${appUrl}/reports`;

  const contentHtml = `
    <h2 style="color: #0f172a; margin-top: 0;">Clinical Report Processed</h2>
    <p>Hello <strong>${patientName || 'Patient'}</strong>,</p>
    <p>Your medical report (<strong>${reportType || 'Lab Test'}</strong>) dated <strong>${reportDate || 'Recent'}</strong> has been extracted and analyzed by the MeddiAssist AI pipeline.</p>
    
    <div class="info-card">
      <p style="margin: 0; font-weight: 600; color: #166534;">Extraction & Analysis Summary:</p>
      <ul style="margin: 8px 0 0; padding-left: 20px; color: #15803d;">
        <li>Authoritative laboratory values parsed & verified</li>
        <li>Clinical reference intervals resolved</li>
        <li>${abnormalCount > 0 ? `<strong>${abnormalCount} parameter(s) flagged as out-of-range</strong>` : 'All parameters are within normal physiological bounds'}</li>
      </ul>
    </div>

    ${abnormalCount > 0 ? `
    <div class="alert-box">
      <strong>Clinical Attention:</strong> Some parameters fall outside standard biological reference ranges. Please review the detailed risk staging and consult your physician.
    </div>` : ''}

    <p>You can view your extracted numbers, clinical risk evaluations, and personalized dietary guidance directly in your dashboard.</p>
  `;

  return sendMail({
    to,
    subject: `Medical Report Analyzed — ${reportType || 'Clinical Findings'}`,
    text: `Your report has been analyzed with ${abnormalCount} abnormal markers. Log in at ${reportUrl} to view your results.`,
    html: wrapHtmlEmail({
      title: 'Medical Report Analyzed',
      preheader: `Your report analysis is ready. ${abnormalCount} parameters flagged.`,
      contentHtml,
      actionButton: { text: 'View Report & Risk Staging', url: reportUrl }
    })
  });
}

/**
 * 2. Send Critical Medical Alert Notification
 */
async function sendCriticalAlertEmail({ to, patientName, alertMessage, organSystem }) {
  const contentHtml = `
    <div class="alert-box" style="margin-top: 0;">
      <h2 style="color: #991b1b; margin: 0 0 8px;">Urgent Clinical Alert</h2>
      <p style="margin: 0; font-size: 15px;"><strong>${alertMessage}</strong></p>
    </div>
    <p>Dear <strong>${patientName || 'Patient'}</strong>,</p>
    <p>Our automated clinical rule-based engine detected a reading exceeding critical health thresholds in the <strong>${organSystem || 'general clinical'}</strong> panel.</p>
    <p style="color: #475569;">Please contact your healthcare provider, primary physician, or visit an urgent care facility for immediate clinical review.</p>
  `;

  return sendMail({
    to,
    subject: `URGENT Medical Notification — Immediate Physician Consult Recommended`,
    text: `URGENT MEDICAL NOTIFICATION: ${alertMessage}. Please consult your doctor immediately.`,
    html: wrapHtmlEmail({
      title: 'Urgent Medical Alert',
      preheader: 'Urgent: A critical lab threshold was triggered.',
      contentHtml
    })
  });
}

/**
 * 3. Send Appointment Confirmation Email
 */
async function sendAppointmentEmail({ to, patientName, doctorName, appointmentDate, appointmentTime, appointmentType, status }) {
  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const contentHtml = `
    <h2 style="color: #0f172a; margin-top: 0;">Appointment Confirmation</h2>
    <p>Hello <strong>${patientName || 'Patient'}</strong>,</p>
    <p>Your appointment has been successfully scheduled with <strong>${doctorName || 'your doctor'}</strong>.</p>
    
    <div class="info-card">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 6px 0; color: #64748b;">Doctor:</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${doctorName}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Date:</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${appointmentDate}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Time:</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${appointmentTime}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Type:</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${appointmentType ? appointmentType.toUpperCase() : 'CONSULTATION'}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Status:</td><td style="padding: 6px 0; font-weight: 600; color: #0f766e;">${(status || 'CONFIRMED').toUpperCase()}</td></tr>
      </table>
    </div>

    <p>Please make sure to log in 5 minutes prior to your consultation time.</p>
  `;

  return sendMail({
    to,
    subject: `Appointment Confirmed with ${doctorName} on ${appointmentDate}`,
    text: `Your appointment with ${doctorName} on ${appointmentDate} at ${appointmentTime} is confirmed.`,
    html: wrapHtmlEmail({
      title: 'Appointment Confirmed',
      preheader: `Your appointment with ${doctorName} on ${appointmentDate} is confirmed.`,
      contentHtml,
      actionButton: { text: 'View Appointments', url: `${appUrl}/appointments` }
    })
  });
}

module.exports = {
  transporter,
  verifyEmailService,
  sendMail,
  sendReportAnalyzedEmail,
  sendCriticalAlertEmail,
  sendAppointmentEmail
};
