const { query } = require('../config/db');
const telegramService = require('./telegram.service');
const emailService = require('./emailService');

/**
 * Create a persistent notification in PostgreSQL and optionally dispatch email
 */
const createNotification = async ({ userId, title, message, type = 'info', link = null }) => {
  try {
    if (!userId || !title || !message) return null;
    const res = await query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id as "userId", title, message, type, link, is_read as "isRead", created_at as "createdAt"`,
      [userId, title, message, type, link]
    );

    // Fetch user email to dispatch notification email if available
    try {
      const uRes = await query(`SELECT email, name FROM users WHERE id = $1`, [userId]);
      if (uRes.rows.length > 0 && uRes.rows[0].email) {
        const u = uRes.rows[0];
        emailService.sendMail({
          to: u.email,
          userId,
          subject: title,
          text: message,
          html: `<p>Hello <strong>${u.name || 'Patient'}</strong>,</p><p>${message}</p>`
        }).catch(e => console.error('[Notification Email] Error sending email:', e.message));
      }
    } catch (e) {
      // Non-blocking email dispatch
    }

    return res.rows[0] || null;
  } catch (err) {
    console.error('[Notification] Error creating notification:', err.message);
    return null;
  }
};

module.exports = {
  createNotification,
  dispatchTelegramNotification: telegramService.dispatchTelegramNotification,
  sendTelegramTestNotification: telegramService.sendTestNotification,
  getTelegramStatus: telegramService.getTelegramStatus,
  emailService
};
