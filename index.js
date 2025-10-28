const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  getContentType,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  fetchLatestBaileysVersion,
  Browsers
} = require('@whiskeysockets/baileys');

const fs = require('fs');
const path = require('path');
const os = require('os');
const P = require('pino');
const config = require('./config');
const { AntiDelete } = require('./lib');
const GroupEvents = require('./lib/groupevents');
const { getGroupAdmins, sms, saveMessage } = require('./data');

//================ Temp Dir =================//
const tempDir = path.join(os.tmpdir(), 'cache-temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

const clearTempDir = () => {
  fs.readdir(tempDir, (err, files) => {
    if (err) return console.error(err);
    for (const file of files) {
      fs.unlink(path.join(tempDir, file), () => {});
    }
  });
};
setInterval(clearTempDir, 5 * 60 * 1000);

//================ Session =================//
const sessionDir = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir);

async function connectToWA() {
  console.log("⏳ Connecting to WhatsApp...");

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.macOS("Firefox"),
    auth: state,
    version
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        console.log("🔁 Reconnecting in 5 seconds...");
        setTimeout(connectToWA, 5000);
      } else {
        console.log("❌ Logged out. Generate a new session.");
      }
    } else if (connection === 'open') {
      console.log("✅ Bot connected!");
      // Load plugins
      fs.readdirSync("./plugins/").forEach(file => {
        if (file.endsWith(".js")) require("./plugins/" + file);
      });
    }
  });

  sock.ev.on('creds.update', saveCreds);

  //================ AntiDelete =================//
  sock.ev.on('messages.update', async updates => {
    for (const update of updates) {
      try {
        await AntiDelete(sock, update);
      } catch (e) {
        console.error("AntiDelete error:", e);
      }
    }
  });

  //================ Messages Upsert =================//
  sock.ev.on('messages.upsert', async mek => {
    mek = mek.messages[0];
    if (!mek.message) return;

    if (config.READ_MESSAGE === 'true') {
      await sock.readMessages([mek.key]).catch(()=>{});
    }

    await saveMessage(mek).catch(()=>{});
  });

  //================ Group Participants =================//
  sock.ev.on("group-participants.update", (update) => GroupEvents(sock, update));

  return sock;
}

//================ Start Bot =================//
connectToWA().catch(err => console.error("Connection error:", err));  }
}

connectToWA();
