/**
 * FAHEEM-MD - WhatsApp MultiDevice Bot
 * Fixed & Optimized Version (Heroku + Pair Code Support)
 * Author: Faheem
 */

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  jidDecode,
  generateWAMessageFromContent,
  downloadContentFromMessage,
  Browsers,
} = require('@whiskeysockets/baileys');

const fs = require('fs');
const P = require('pino');
const path = require('path');
const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

const config = require('./config');
const { sms } = require('./lib');
const { getContentType } = require('@whiskeysockets/baileys');
const events = require('./command');

// ✅ Keepalive for Heroku
app.get('/', (req, res) => res.send('✅ FAHEEM-MD Bot Running...'));
app.listen(port, () => console.log(`Server running on port ${port}`));

// ============ AUTH SYSTEM ============
async function connectToWA() {
  try {
    console.log('🧩 Connecting to WhatsApp...');
    const { state, saveCreds } = await useMultiFileAuthState('./sessions');
    const { version } = await fetchLatestBaileysVersion();

    const conn = makeWASocket({
      logger: P({ level: 'silent' }),
      printQRInTerminal: false,
      browser: Browsers.macOS('Safari'),
      auth: state,
      version,
    });

    // 🔁 Auto reconnect
    conn.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode;
        console.log('Connection closed:', reason);
        if (reason !== DisconnectReason.loggedOut) {
          setTimeout(connectToWA, 5000);
        } else {
          console.log('❌ Logged out. Please relink your session.');
        }
      } else if (connection === 'open') {
        console.log('✅ Connected to WhatsApp!');
      }
    });

    conn.ev.on('creds.update', saveCreds);

    // ============= MESSAGE HANDLER =============
    conn.ev.on('messages.upsert', async (msg) => {
      const m = msg.messages[0];
      if (!m.message) return;
      const type = getContentType(m.message);
      const from = m.key.remoteJid;
      const body =
        type === 'conversation'
          ? m.message.conversation
          : type === 'extendedTextMessage'
          ? m.message.extendedTextMessage.text
          : '';

      const prefix = config.PREFIX || '.';
      const isCmd = body.startsWith(prefix);
      const command = isCmd ? body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : '';
      const args = body.trim().split(/ +/).slice(1);
      const q = args.join(' ');

      // ========== Example Command ==========
      if (isCmd) {
        console.log(`📥 Command: ${command} | From: ${from}`);

        switch (command) {
          case 'menu':
            await conn.sendMessage(from, {
              text: `👋 *Welcome to FAHEEM-MD Bot*\n\n✨ Available Commands:\n> .menu - Show this menu\n> .ping - Check bot status\n\n⚙️ _Bot running fine!_`,
            });
            break;

          case 'ping':
            await conn.sendMessage(from, { text: '🏓 Pong! Bot is active ✅' });
            break;

          default:
            await conn.sendMessage(from, {
              text: `❌ Unknown command: *${command}*\nType *.menu* for help.`,
            });
            break;
        }
      }
    });
  } catch (err) {
    console.error('❌ Fatal error in connectToWA():', err);
    setTimeout(connectToWA, 10000);
  }
}

connectToWA();
