const telegramService = require('../services/telegram.service');
const { processTelegramUpdate } = require('../services/telegramBotRunner');

/**
 * GET /api/notifications/telegram/status
 * Get Telegram connection status and preferences for authenticated user
 */
const getTelegramStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const status = await telegramService.getTelegramStatus(userId);
    return res.status(200).json(status);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/notifications/telegram/token
 * Generate temporary, single-use linking token and bot deep-link
 */
const generateLinkToken = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const tokenData = await telegramService.generateLinkToken(userId);
    return res.status(201).json({
      message: 'Connection link generated successfully. Valid for 15 minutes.',
      ...tokenData
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/notifications/telegram/disconnect
 * Disconnect linked Telegram account
 */
const disconnectTelegram = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await telegramService.disconnectAccount(userId);
    return res.status(200).json({
      message: 'Telegram account successfully disconnected.',
      ...result
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/notifications/telegram/preferences
 * Update notification category toggles
 */
const updatePreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      notifyMedicines,
      notifyAppointments,
      notifyReports,
      notifyMessages,
      notifyDiet
    } = req.body;

    const updated = await telegramService.updateTelegramPreferences(userId, {
      notifyMedicines,
      notifyAppointments,
      notifyReports,
      notifyMessages,
      notifyDiet
    });

    return res.status(200).json({
      message: 'Notification preferences updated successfully.',
      preferences: updated
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/notifications/telegram/test
 * Send test notification to linked Telegram chat
 */
const sendTestNotification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await telegramService.sendTestNotification(userId);

    if (!result.ok) {
      if (result.skipped) {
        return res.status(400).json({
          error: { message: 'Telegram is not connected or active for your account. Please connect first.' }
        });
      }
      return res.status(500).json({
        error: { message: result.error || 'Failed to send test notification via Telegram.' }
      });
    }

    return res.status(200).json({
      message: 'Test notification delivered to your Telegram account successfully!',
      messageId: result.messageId
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/notifications/telegram/webhook
 * Webhook handler for Telegram Bot API
 * Validates secret token if configured
 */
const handleTelegramWebhook = async (req, res) => {
  try {
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (expectedSecret) {
      const incomingSecret = req.headers['x-telegram-bot-api-secret-token'];
      if (incomingSecret !== expectedSecret) {
        console.warn('[Telegram Webhook] Unauthorized webhook attempt: secret token mismatch.');
        return res.status(401).json({ error: 'Unauthorized: Invalid secret token' });
      }
    }

    const update = req.body;
    // Process update asynchronously so Telegram gets instant 200 OK
    processTelegramUpdate(update).catch((err) => {
      console.error('[Telegram Webhook] Error processing update:', err.message);
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[Telegram Webhook] Webhook error:', err.message);
    return res.status(200).json({ ok: true });
  }
};

module.exports = {
  getTelegramStatus,
  generateLinkToken,
  disconnectTelegram,
  updatePreferences,
  sendTestNotification,
  handleTelegramWebhook
};
