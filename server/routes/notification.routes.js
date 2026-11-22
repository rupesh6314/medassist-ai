const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} = require('../controllers/notification.controller');
const {
  getTelegramStatus,
  generateLinkToken,
  disconnectTelegram,
  updatePreferences,
  sendTestNotification,
  handleTelegramWebhook
} = require('../controllers/telegram.controller');

// Public Webhook from Telegram (validates X-Telegram-Bot-Api-Secret-Token)
router.post('/telegram/webhook', handleTelegramWebhook);

// Protected Routes (require authenticated user session)
router.use(authenticateToken);

// Email test endpoint
router.post('/email/test', async (req, res, next) => {
  try {
    const { emailService } = require('../services/emailService');
    const userRes = await require('../config/db').query('SELECT email, name FROM users WHERE id = $1', [req.user.id]);
    const targetEmail = req.body.email || userRes.rows[0]?.email || 'rupesh.madhuvarsu2005@gmail.com';
    const result = await require('../services/emailService').sendMail({
      to: targetEmail,
      subject: 'MeddiAssist AI — Email Notification Test',
      text: 'Your email infrastructure is successfully delivering notifications.',
      html: `
        <h2 style="color: #0f766e;">Email Service Verified!</h2>
        <p>Hello <strong>${userRes.rows[0]?.name || 'User'}</strong>,</p>
        <p>This email confirms that your MeddiAssist AI SMTP transport (Google Gmail) is active and running cleanly.</p>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; margin: 15px 0; color: #166534;">
          ✓ Transport: Google Gmail SMTP (Port 465 SSL)<br>
          ✓ Sender: MeddiAssist &lt;rupesh.madhuvarsu2005@gmail.com&gt;<br>
          ✓ Status: Operational
        </div>
      `
    });
    return res.status(200).json({ message: `Test email sent to ${targetEmail}`, ...result });
  } catch (err) {
    next(err);
  }
});

// In-app notifications
router.get('/', getNotifications);
router.put('/:id/read', markNotificationRead);
router.put('/read-all', markAllNotificationsRead);

// Telegram integration endpoints
router.get('/telegram/status', getTelegramStatus);
router.post('/telegram/token', generateLinkToken);
router.post('/telegram/disconnect', disconnectTelegram);
router.put('/telegram/preferences', updatePreferences);
router.post('/telegram/test', sendTestNotification);

module.exports = router;
