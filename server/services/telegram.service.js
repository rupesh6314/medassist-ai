const crypto = require('crypto');
const { query } = require('../config/db');

const TELEGRAM_API_BASE = 'https://api.telegram.org';

/**
 * Helper to record in-app notification without circular dependency
 */
async function addInAppNotification({ userId, title, message, type = 'info', link = null }) {
  try {
    if (!userId || !title || !message) return null;
    const res = await query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id as "userId", title, message, type, link, is_read as "isRead", created_at as "createdAt"`,
      [userId, title, message, type, link]
    );
    return res.rows[0] || null;
  } catch (err) {
    console.error('[Notification] Error creating notification:', err.message);
    return null;
  }
}

/**
 * Helper to check if a URL is valid for Telegram inline keyboard buttons.
 * Telegram Bot API rejects localhost and 127.0.0.1 as invalid button URLs.
 */
function isValidTelegramButtonUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (/localhost|127\.0\.0\.1/i.test(url)) return false;
  return /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(url);
}

/**
 * Helper to get Telegram Bot Token from environment
 */
function getBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN ? process.env.TELEGRAM_BOT_TOKEN.trim() : null;
}

let cachedBotUsername = null;

/**
 * Helper to get Telegram Bot Username from environment or live Telegram API
 */
function getBotUsername() {
  if (cachedBotUsername) return cachedBotUsername;
  const name = process.env.TELEGRAM_BOT_USERNAME || 'MedAssistAIBot';
  return name.replace(/^@/, '').trim();
}

/**
 * Fetch and cache live bot username from Telegram API
 */
async function fetchBotInfo() {
  if (cachedBotUsername) return cachedBotUsername;
  const token = getBotToken();
  if (!token) return getBotUsername();
  try {
    const res = await callTelegramApi('getMe');
    if (res.ok && res.result?.username) {
      cachedBotUsername = res.result.username;
      return cachedBotUsername;
    }
  } catch {
    /* fallback to env */
  }
  return getBotUsername();
}

/**
 * Helper to get Portal App Base URL
 */
function getAppBaseUrl() {
  const url = process.env.APP_URL || process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5173');
  return url.replace(/\/+$/, '');
}

/**
 * Low-level Telegram Bot API caller
 */
async function callTelegramApi(endpoint, body = {}) {
  const token = getBotToken();
  if (!token) {
    return {
      ok: false,
      error: 'TELEGRAM_BOT_TOKEN is not configured in environment variables.',
      notConfigured: true
    };
  }

  const url = `${TELEGRAM_API_BASE}/bot${token}/${endpoint}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      console.warn(`[Telegram API Warning] ${endpoint} failed:`, data.description || res.statusText);
      return {
        ok: false,
        errorCode: data.error_code || res.status,
        description: data.description || 'Unknown Telegram API error'
      };
    }

    return { ok: true, result: data.result };
  } catch (err) {
    console.error(`[Telegram API Error] Exception during ${endpoint}:`, err.message);
    return {
      ok: false,
      errorCode: 500,
      description: err.message
    };
  }
}

/**
 * Send raw Telegram text message with optional inline keyboard and parse mode
 */
async function sendRawTelegramMessage({ chatId, text, inlineKeyboard = null, parseMode = 'HTML' }) {
  if (!chatId) return { ok: false, description: 'Chat ID is required' };

  const payload = {
    chat_id: chatId,
    text,
    parse_mode: parseMode,
    disable_web_page_preview: true
  };

  if (inlineKeyboard && Array.isArray(inlineKeyboard) && inlineKeyboard.length > 0) {
    payload.reply_markup = {
      inline_keyboard: inlineKeyboard
    };
  }

  return callTelegramApi('sendMessage', payload);
}

/**
 * Generate a single-use expiring token for linking patient account
 */
async function generateLinkToken(userId) {
  if (!userId) throw new Error('User ID is required');

  // Verify patient exists
  const userRes = await query('SELECT id, name, role FROM users WHERE id = $1', [userId]);
  if (userRes.rows.length === 0) {
    throw new Error('User account not found');
  }

  // Invalidate any existing unused tokens for this user
  await query(
    `UPDATE telegram_link_tokens SET is_used = true WHERE user_id = $1 AND is_used = false`,
    [userId]
  );

  // Generate 48-char secure random hex string
  const token = 'tg_' + crypto.randomBytes(20).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await query(
    `INSERT INTO telegram_link_tokens (user_id, token, expires_at, is_used)
     VALUES ($1, $2, $3, false)`,
    [userId, token, expiresAt]
  );

  const botUsername = (await fetchBotInfo()) || getBotUsername();
  const deepLink = `https://t.me/${botUsername}?start=${token}`;
  const webLink = `https://web.telegram.org/a/#?tgaddr=${encodeURIComponent(`tg://resolve?domain=${botUsername}&start=${token}`)}`;

  return {
    token,
    botUsername,
    deepLink,
    webLink,
    expiresAt: expiresAt.toISOString(),
    expiresInMinutes: 15
  };
}

/**
 * Validate token and link patient Telegram Chat ID
 */
async function linkAccountWithToken({ chatId, token, telegramUser = {} }) {
  if (!chatId || !token) {
    return { success: false, reason: 'INVALID_PARAMETERS' };
  }

  const cleanToken = token.trim();

  // Find token
  const tokenRes = await query(
    `SELECT t.id, t.user_id, t.expires_at, t.is_used, u.name, u.email, u.patient_id
     FROM telegram_link_tokens t
     JOIN users u ON t.user_id = u.id
     WHERE t.token = $1`,
    [cleanToken]
  );

  if (tokenRes.rows.length === 0) {
    return { success: false, reason: 'TOKEN_NOT_FOUND' };
  }

  const tokenRecord = tokenRes.rows[0];

  if (tokenRecord.is_used) {
    return { success: false, reason: 'TOKEN_ALREADY_USED' };
  }

  if (new Date(tokenRecord.expires_at).getTime() < Date.now()) {
    return { success: false, reason: 'TOKEN_EXPIRED' };
  }

  const userId = tokenRecord.user_id;
  const patientName = tokenRecord.name || 'Patient';

  // Check if this Telegram Chat ID was previously linked to a DIFFERENT patient
  const existingChatLink = await query(
    `SELECT user_id FROM patient_telegram_settings WHERE telegram_chat_id = $1 AND user_id != $2`,
    [chatId, userId]
  );

  if (existingChatLink.rows.length > 0) {
    // Unlink old association to ensure one-to-one mapping
    await query(
      `UPDATE patient_telegram_settings SET is_connected = false, telegram_chat_id = NULL, updated_at = NOW() WHERE telegram_chat_id = $1`,
      [chatId]
    );
  }

  // Upsert connection settings for this user
  await query(
    `INSERT INTO patient_telegram_settings (
       user_id, telegram_chat_id, telegram_username, telegram_first_name,
       is_connected, connected_at, updated_at
     )
     VALUES ($1, $2, $3, $4, true, NOW(), NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       telegram_chat_id = EXCLUDED.telegram_chat_id,
       telegram_username = EXCLUDED.telegram_username,
       telegram_first_name = EXCLUDED.telegram_first_name,
       is_connected = true,
       connected_at = NOW(),
       updated_at = NOW()`,
    [
      userId,
      chatId,
      telegramUser.username || null,
      telegramUser.first_name || null
    ]
  );

  // Mark token as used
  await query(
    `UPDATE telegram_link_tokens SET is_used = true WHERE id = $1`,
    [tokenRecord.id]
  );

  // Invalidate any other tokens for this user
  await query(
    `UPDATE telegram_link_tokens SET is_used = true WHERE user_id = $1 AND id != $2`,
    [userId, tokenRecord.id]
  );

  // Create in-app notification
  await addInAppNotification({
    userId,
    title: 'Telegram Account Linked',
    message: 'Your Telegram account has been successfully connected to MedAssist AI for real-time notifications.',
    type: 'info',
    link: '/settings'
  });

  // Send welcoming confirmation over Telegram
  const appUrl = getAppBaseUrl();
  const welcomeText = 
`🏥 <b>MedAssist AI • Telegram Connected</b>

Hello <b>${escapeHtml(patientName)}</b>,
Your Telegram account has been successfully linked to your <b>MedAssist AI</b> patient profile.

You will receive real-time notifications for:
• 🩺 <b>Doctor Appointments</b>
• 📋 <b>Medical Report Updates</b>
• 💬 <b>Messages from your Doctor</b>

You can customize your notification preferences or disconnect anytime in MedAssist AI Settings.`;

  const portalUrl = `${appUrl}/dashboard`;
  const inlineKeyboard = isValidTelegramButtonUrl(portalUrl)
    ? [[{ text: '🌐 Open MedAssist AI Portal', url: portalUrl }]]
    : null;

  await sendRawTelegramMessage({
    chatId,
    text: welcomeText,
    inlineKeyboard
  });

  return {
    success: true,
    userId,
    patientName
  };
}

/**
 * Disconnect patient's Telegram account
 */
async function disconnectAccount(userId) {
  if (!userId) throw new Error('User ID is required');

  const settingsRes = await query(
    `SELECT telegram_chat_id, is_connected FROM patient_telegram_settings WHERE user_id = $1`,
    [userId]
  );

  if (settingsRes.rows.length === 0 || !settingsRes.rows[0].is_connected) {
    return { success: true, message: 'Account was not connected' };
  }

  const chatId = settingsRes.rows[0].telegram_chat_id;

  // Update DB
  await query(
    `UPDATE patient_telegram_settings 
     SET is_connected = false, telegram_chat_id = NULL, updated_at = NOW() 
     WHERE user_id = $1`,
    [userId]
  );

  // Notify on Telegram if chatId was present
  if (chatId) {
    try {
      await sendRawTelegramMessage({
        chatId,
        text: `🔒 <b>MedAssist AI Notification</b>\n\nYour Telegram account has been disconnected from MedAssist AI. You will no longer receive automated notifications here.\n\nYou can reconnect anytime through your patient settings.`
      });
    } catch {
      /* ignore telegram send error on disconnect */
    }
  }

  // Create in-app notification
  await addInAppNotification({
    userId,
    title: 'Telegram Account Disconnected',
    message: 'Your Telegram notifications have been disconnected.',
    type: 'info',
    link: '/settings'
  });

  return { success: true };
}

/**
 * Get Telegram connection status and category preferences for user
 */
async function getTelegramStatus(userId) {
  if (!userId) throw new Error('User ID is required');

  const res = await query(
    `SELECT telegram_chat_id, telegram_username, telegram_first_name, is_connected, connected_at,
            notify_medicines as "notifyMedicines", notify_appointments as "notifyAppointments",
            notify_reports as "notifyReports", notify_messages as "notifyMessages",
            notify_diet as "notifyDiet", timezone
     FROM patient_telegram_settings
     WHERE user_id = $1`,
    [userId]
  );

  const botConfigured = Boolean(getBotToken());
  const botUsername = (await fetchBotInfo()) || getBotUsername();

  if (res.rows.length === 0 || !res.rows[0].is_connected) {
    return {
      connected: false,
      botConfigured,
      botUsername,
      preferences: {
        notifyMedicines: true,
        notifyAppointments: true,
        notifyReports: true,
        notifyMessages: true,
        notifyDiet: true
      }
    };
  }

  const row = res.rows[0];
  const rawChatId = row.telegram_chat_id ? String(row.telegram_chat_id) : '';
  const maskedChatId = rawChatId.length > 4 ? `***${rawChatId.slice(-4)}` : rawChatId;

  return {
    connected: true,
    botConfigured,
    botUsername,
    chatId: maskedChatId,
    username: row.telegram_username ? `@${row.telegram_username}` : null,
    firstName: row.telegram_first_name || null,
    connectedAt: row.connected_at,
    timezone: row.timezone || 'Asia/Kolkata',
    preferences: {
      notifyMedicines: Boolean(row.notifyMedicines),
      notifyAppointments: Boolean(row.notifyAppointments),
      notifyReports: Boolean(row.notifyReports),
      notifyMessages: Boolean(row.notifyMessages),
      notifyDiet: Boolean(row.notifyDiet)
    }
  };
}

/**
 * Update notification preferences
 */
async function updateTelegramPreferences(userId, prefs = {}) {
  if (!userId) throw new Error('User ID is required');

  const {
    notifyMedicines,
    notifyAppointments,
    notifyReports,
    notifyMessages,
    notifyDiet
  } = prefs;

  const res = await query(
    `INSERT INTO patient_telegram_settings (
       user_id, notify_medicines, notify_appointments, notify_reports, notify_messages, notify_diet, updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       notify_medicines = COALESCE($2, patient_telegram_settings.notify_medicines),
       notify_appointments = COALESCE($3, patient_telegram_settings.notify_appointments),
       notify_reports = COALESCE($4, patient_telegram_settings.notify_reports),
       notify_messages = COALESCE($5, patient_telegram_settings.notify_messages),
       notify_diet = COALESCE($6, patient_telegram_settings.notify_diet),
       updated_at = NOW()
     RETURNING notify_medicines as "notifyMedicines", notify_appointments as "notifyAppointments",
               notify_reports as "notifyReports", notify_messages as "notifyMessages",
               notify_diet as "notifyDiet"`,
    [
      userId,
      notifyMedicines !== undefined ? Boolean(notifyMedicines) : true,
      notifyAppointments !== undefined ? Boolean(notifyAppointments) : true,
      notifyReports !== undefined ? Boolean(notifyReports) : true,
      notifyMessages !== undefined ? Boolean(notifyMessages) : true,
      notifyDiet !== undefined ? Boolean(notifyDiet) : true
    ]
  );

  return res.rows[0];
}

/**
 * Dispatch Telegram notification to a patient respecting category preferences,
 * deduplication, and medical privacy rules.
 */
async function dispatchTelegramNotification({
  userId,
  category, // 'medicine' | 'appointment' | 'report' | 'message' | 'diet' | 'test'
  title,
  text,
  link = null,
  buttonText = 'Open MedAssist AI',
  referenceId = null,
  deduplicateHours = 12
}) {
  if (!userId || !category || !text) {
    return { ok: false, error: 'userId, category, and text are required' };
  }

  // 1. Fetch connection status and preference
  const settingsRes = await query(
    `SELECT telegram_chat_id, is_connected,
            notify_medicines, notify_appointments, notify_reports, notify_messages, notify_diet
     FROM patient_telegram_settings
     WHERE user_id = $1`,
    [userId]
  );

  if (settingsRes.rows.length === 0 || !settingsRes.rows[0].is_connected || !settingsRes.rows[0].telegram_chat_id) {
    return { ok: false, skipped: true, reason: 'TELEGRAM_NOT_CONNECTED' };
  }

  const s = settingsRes.rows[0];
  const chatId = s.telegram_chat_id;

  // 2. Category preference check (except 'test' which is always sent)
  if (category === 'medicine' && !s.notify_medicines) {
    return { ok: false, skipped: true, reason: 'CATEGORY_DISABLED_MEDICINES' };
  }
  if (category === 'appointment' && !s.notify_appointments) {
    return { ok: false, skipped: true, reason: 'CATEGORY_DISABLED_APPOINTMENTS' };
  }
  if (category === 'report' && !s.notify_reports) {
    return { ok: false, skipped: true, reason: 'CATEGORY_DISABLED_REPORTS' };
  }
  if (category === 'message' && !s.notify_messages) {
    return { ok: false, skipped: true, reason: 'CATEGORY_DISABLED_MESSAGES' };
  }
  if (category === 'diet' && !s.notify_diet) {
    return { ok: false, skipped: true, reason: 'CATEGORY_DISABLED_DIET' };
  }

  // 3. Deduplication check if referenceId is provided
  if (referenceId) {
    const hours = deduplicateHours || 12;
    const dedupRes = await query(
      `SELECT id FROM telegram_notification_logs
       WHERE user_id = $1 AND category = $2 AND reference_id = $3 AND status = 'sent'
         AND sent_at > NOW() - ($4 || ' hours')::interval
       LIMIT 1`,
      [userId, category, String(referenceId), hours]
    );

    if (dedupRes.rows.length > 0) {
      return { ok: true, skipped: true, reason: 'DUPLICATE_PREVENTED', referenceId };
    }
  }

  // 4. Construct message HTML
  const appUrl = getAppBaseUrl();
  const categoryIcons = {
    medicine: '💊',
    appointment: '🩺',
    report: '📋',
    message: '💬',
    diet: '🥗',
    test: '🔔'
  };

  const icon = categoryIcons[category] || '🏥';
  const cleanTitle = title ? escapeHtml(title) : 'Notification';

  let messageHtml = `${icon} <b>MedAssist AI • ${cleanTitle}</b>\n\n${text}`;

  // Build inline keyboard button only if URL is a valid public HTTP(S) URL
  let inlineKeyboard = null;
  if (link) {
    const fullUrl = link.startsWith('http') ? link : `${appUrl}${link.startsWith('/') ? '' : '/'}${link}`;
    if (isValidTelegramButtonUrl(fullUrl)) {
      inlineKeyboard = [
        [{ text: `👉 ${buttonText}`, url: fullUrl }]
      ];
    }
  }

  // 5. Send via Telegram Bot API
  const sendResult = await sendRawTelegramMessage({
    chatId,
    text: messageHtml,
    inlineKeyboard
  });

  const now = new Date();

  // 6. Handle blocked or deactivated bot
  if (!sendResult.ok) {
    const isBlocked = sendResult.errorCode === 403 || /blocked/i.test(sendResult.description || '');
    if (isBlocked) {
      console.warn(`[Telegram Service] Bot blocked by user ${userId}. Marking connection as inactive.`);
      await query(
        `UPDATE patient_telegram_settings SET is_connected = false, updated_at = NOW() WHERE user_id = $1`,
        [userId]
      );
    }

    // Log failure
    await query(
      `INSERT INTO telegram_notification_logs
       (user_id, chat_id, category, reference_id, title, message, status, error_message, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userId,
        chatId,
        category,
        referenceId ? String(referenceId) : null,
        title,
        text,
        isBlocked ? 'blocked' : 'failed',
        sendResult.description || 'API Error',
        now
      ]
    );

    return {
      ok: false,
      error: sendResult.description,
      errorCode: sendResult.errorCode
    };
  }

  // 7. Log success
  const telegramMessageId = sendResult.result?.message_id || null;
  await query(
    `INSERT INTO telegram_notification_logs
     (user_id, chat_id, category, reference_id, title, message, status, telegram_message_id, sent_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'sent', $7, $8)`,
    [
      userId,
      chatId,
      category,
      referenceId ? String(referenceId) : null,
      title,
      text,
      telegramMessageId,
      now
    ]
  );

  return {
    ok: true,
    messageId: telegramMessageId
  };
}

/**
 * Send test notification to patient
 */
async function sendTestNotification(userId) {
  if (!userId) throw new Error('User ID is required');

  const userRes = await query('SELECT name FROM users WHERE id = $1', [userId]);
  const userName = userRes.rows[0]?.name || 'Patient';

  const testText = 
`Hello <b>${escapeHtml(userName)}</b>!

This is a test notification confirming that your Telegram account is securely connected to <b>MedAssist AI</b>.

You will receive real-time updates for:
• Upcoming doctor appointments
• Processed medical reports
• New consultation messages from your doctor`;

  return dispatchTelegramNotification({
    userId,
    category: 'test',
    title: 'Test Notification',
    text: testText,
    link: '/settings',
    buttonText: 'Notification Settings',
    referenceId: `test-${Date.now()}`,
    deduplicateHours: 0
  });
}

/**
 * Escape HTML special characters for Telegram HTML mode
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = {
  getBotToken,
  getBotUsername,
  generateLinkToken,
  linkAccountWithToken,
  disconnectAccount,
  getTelegramStatus,
  updateTelegramPreferences,
  dispatchTelegramNotification,
  sendTestNotification,
  sendRawTelegramMessage,
  callTelegramApi,
  escapeHtml
};
