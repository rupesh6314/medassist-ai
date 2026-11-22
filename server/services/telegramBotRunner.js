const { query } = require('../config/db');
const {
  getBotToken,
  getBotUsername,
  linkAccountWithToken,
  sendRawTelegramMessage,
  callTelegramApi,
  escapeHtml
} = require('./telegram.service');

let pollingActive = false;
let pollingTimeoutId = null;
let lastUpdateId = 0;

/**
 * Helper to extract token from various user inputs:
 * - /start <token>
 * - https://t.me/bot?start=<token>
 * - bare token: tg_...
 */
function extractToken(rawText) {
  if (!rawText) return null;
  const str = String(rawText).trim();

  // 1. From URL parameter: ?start=... or &start=...
  const urlMatch = str.match(/[?&]start=([a-zA-Z0-9_-]+)/i);
  if (urlMatch) return urlMatch[1];

  // 2. From /start command: /start <token> or /start=<token>
  const startMatch = str.match(/^\/start(?:=|\s+)([a-zA-Z0-9_-]+)/i);
  if (startMatch) return startMatch[1];

  // 3. Bare token: tg_...
  const bareMatch = str.match(/\b(tg_[a-f0-9]{16,64})\b/i);
  if (bareMatch) return bareMatch[1];

  return null;
}

/**
 * Handle incoming Telegram update (from Webhook or Polling)
 */
async function processTelegramUpdate(update) {
  if (!update || !update.message) return;

  const msg = update.message;
  const chatId = msg.chat?.id;
  const text = (msg.text || '').trim();
  const fromUser = msg.from || {};

  if (!chatId || !text) return;

  console.log(`[Telegram Bot] Received message from ${chatId} (${fromUser.username || fromUser.first_name || 'Anonymous'}): ${text}`);

  // 1. Check for token linking command or URL
  const extractedToken = extractToken(text);

  if (extractedToken || text.startsWith('/start')) {
    if (!extractedToken) {
      const botUser = getBotUsername();
      const reply = 
`👋 <b>Welcome to MedAssist AI Bot!</b>

To connect your patient account:
1. Log in to your <b>MedAssist AI</b> web portal.
2. Go to <b>Settings</b> &gt; <b>Telegram Notifications</b>.
3. Click <b>Connect Telegram</b> to generate your secure connection link.

Once connected, you will receive real-time alerts for doctor appointments, medical report updates, and doctor messages directly here.`;

      await sendRawTelegramMessage({
        chatId,
        text: reply
      });
      return;
    }

    // Attempt account linking with token
    const linkResult = await linkAccountWithToken({
      chatId,
      token: extractedToken,
      telegramUser: fromUser
    });

    if (!linkResult.success) {
      let errorText = '⚠️ <b>Unable to Link Account</b>\n\n';
      if (linkResult.reason === 'TOKEN_NOT_FOUND') {
        errorText += 'The connection token provided was not found. Please generate a fresh link from your MedAssist AI Settings.';
      } else if (linkResult.reason === 'TOKEN_ALREADY_USED') {
        errorText += 'This connection token has already been used. Please generate a new connection link from your MedAssist AI Settings.';
      } else if (linkResult.reason === 'TOKEN_EXPIRED') {
        errorText += 'This connection token has expired (tokens are valid for 15 minutes). Please return to MedAssist AI Settings and generate a new connection link.';
      } else {
        errorText += 'An unexpected error occurred while validating your token. Please try again from MedAssist AI Settings.';
      }

      await sendRawTelegramMessage({
        chatId,
        text: errorText
      });
      return;
    }

    // Success response is handled inside linkAccountWithToken
    return;
  }

  // 2. /status command
  if (text === '/status') {
    const res = await query(
      `SELECT u.name, u.email, u.patient_id, pts.connected_at,
              pts.notify_medicines, pts.notify_appointments, pts.notify_reports, pts.notify_messages, pts.notify_diet
       FROM patient_telegram_settings pts
       JOIN users u ON pts.user_id = u.id
       WHERE pts.telegram_chat_id = $1 AND pts.is_connected = true`,
      [chatId]
    );

    if (res.rows.length === 0) {
      await sendRawTelegramMessage({
        chatId,
        text: `ℹ️ <b>Status: Not Connected</b>\n\nThis Telegram account is currently not linked to any active MedAssist AI profile.\n\nTo connect, sign in to MedAssist AI, navigate to <b>Settings &gt; Telegram Notifications</b> and click <b>Connect Telegram</b>.`
      });
      return;
    }

    const row = res.rows[0];
    const statusMsg = 
`✅ <b>Status: Connected to MedAssist AI</b>

• <b>Patient:</b> ${escapeHtml(row.name)} (${escapeHtml(row.patient_id || 'Registered')})
• <b>Linked Since:</b> ${new Date(row.connected_at).toLocaleString()}

<b>Active Notifications:</b>
• 🩺 Appointments: ${row.notify_appointments ? '✅ Enabled' : '❌ Disabled'}
• 📋 Reports: ${row.notify_reports ? '✅ Enabled' : '❌ Disabled'}
• 💬 Doctor Messages: ${row.notify_messages ? '✅ Enabled' : '❌ Disabled'}

To modify preferences or disconnect, please visit MedAssist AI Settings.`;

    await sendRawTelegramMessage({
      chatId,
      text: statusMsg
    });
    return;
  }

  // 3. /help command
  if (text === '/help') {
    const helpText = 
`🏥 <b>MedAssist AI Notification Assistant</b>

<b>Available Commands:</b>
• <code>/start &lt;token&gt;</code> - Securely link your MedAssist AI account
• <code>/status</code> - Check current connection status and active alerts
• <code>/disconnect</code> - Unlink your account from Telegram notifications
• <code>/help</code> - Show this assistance message

<b>Privacy & Security:</b>
MedAssist AI protects your medical confidentiality. We never send detailed diagnoses or complete medical test results over Telegram.`;

    await sendRawTelegramMessage({
      chatId,
      text: helpText
    });
    return;
  }

  // 4. /disconnect command
  if (text === '/disconnect') {
    const res = await query(
      `SELECT user_id, u.name FROM patient_telegram_settings pts
       JOIN users u ON pts.user_id = u.id
       WHERE pts.telegram_chat_id = $1 AND pts.is_connected = true`,
      [chatId]
    );

    if (res.rows.length === 0) {
      await sendRawTelegramMessage({
        chatId,
        text: 'ℹ️ This Telegram account is not currently linked to any MedAssist AI profile.'
      });
      return;
    }

    const patient = res.rows[0];
    await query(
      `UPDATE patient_telegram_settings 
       SET is_connected = false, telegram_chat_id = NULL, updated_at = NOW() 
       WHERE telegram_chat_id = $1`,
      [chatId]
    );

    await sendRawTelegramMessage({
      chatId,
      text: `🔒 <b>Disconnected</b>\n\nYour Telegram account has been unlinked from patient <b>${escapeHtml(patient.name)}</b>. You will no longer receive automated notifications here.`
    });
    return;
  }

  // Fallback default message
  await sendRawTelegramMessage({
    chatId,
    text: `🤖 <b>MedAssist AI Bot</b>\n\nI am an automated notification bot for MedAssist AI. Use <code>/status</code> to check your connection or <code>/help</code> for details.`
  });
}

/**
 * Start long-polling mode (ideal for local development or environments without public webhook)
 */
function startTelegramPolling() {
  const token = getBotToken();
  if (!token) {
    console.log('[Telegram Bot] Bot token not provided. Polling worker disabled.');
    return;
  }

  const usePolling = process.env.TELEGRAM_USE_POLLING === 'true' || !process.env.TELEGRAM_WEBHOOK_URL;
  if (!usePolling) {
    console.log('[Telegram Bot] Webhook mode configured. Polling worker skipped.');
    return;
  }

  if (pollingActive) return;
  pollingActive = true;

  console.log('[Telegram Bot] Starting update polling runner for incoming bot commands...');

  const poll = async () => {
    if (!pollingActive) return;

    try {
      const res = await callTelegramApi('getUpdates', {
        offset: lastUpdateId + 1,
        timeout: 20,
        allowed_updates: ['message']
      });

      if (res.ok && Array.isArray(res.result)) {
        for (const update of res.result) {
          if (update.update_id > lastUpdateId) {
            lastUpdateId = update.update_id;
          }
          await processTelegramUpdate(update).catch((err) => {
            console.error('[Telegram Bot] Error processing update:', err.message);
          });
        }
      }
    } catch (err) {
      console.warn('[Telegram Bot] Polling tick warning:', err.message);
    } finally {
      if (pollingActive) {
        pollingTimeoutId = setTimeout(poll, 2500);
      }
    }
  };

  poll();
}

/**
 * Stop polling gracefully on server shutdown
 */
function stopTelegramPolling() {
  pollingActive = false;
  if (pollingTimeoutId) {
    clearTimeout(pollingTimeoutId);
    pollingTimeoutId = null;
  }
}

module.exports = {
  processTelegramUpdate,
  startTelegramPolling,
  stopTelegramPolling
};
