//==================== IMPORTS ====================
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    jidNormalizedUser,
    getContentType,
    generateForwardMessageContent,
    generateWAMessageFromContent,
    makeInMemoryStore,
    jidDecode,
    fetchLatestBaileysVersion,
    Browsers
} = require('@whiskeysockets/baileys');

const fs = require('fs');
const path = require('path');
const os = require('os');
const P = require('pino');
const util = require('util');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const FileType = require('file-type');
const ff = require('fluent-ffmpeg');
const express = require('express');

const { getBuffer, getGroupAdmins, sms, downloadContentFromMessage, AntiDelete } = require('./lib/functions');
const { saveMessage } = require('./data');
const config = require('./config');
const GroupEvents = require('./lib/groupevents');
const prefix = config.PREFIX;

const ownerNumber = ['61480853796']; // Bot Owner
const tempDir = path.join(os.tmpdir(), 'cache-temp');

//==================== TEMP DIR ====================
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
const clearTempDir = () => {
    fs.readdir(tempDir, (err, files) => {
        if (err) throw err;
        for (const file of files) fs.unlink(path.join(tempDir, file), err => {});
    });
};
setInterval(clearTempDir, 5 * 60 * 1000); // every 5 min

//==================== EXPRESS SERVER ====================
const app = express();
const port = process.env.PORT || 9090;
app.get("/", (req, res) => res.send("FAHEEM-AI WhatsApp Bot is Running!"));
app.listen(port, () => console.log(`🌐 Server running on port ${port}`));

//==================== MAIN FUNCTION ====================
async function connectToWA() {
    console.log("Connecting to WhatsApp ⏳️...");

    // Multi-file session
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'sessions'));
    const { version } = await fetchLatestBaileysVersion();

    const conn = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.macOS("Firefox"),
        syncFullHistory: true,
        auth: state,
        version
    });

    //==================== STORE ====================
    const store = makeInMemoryStore({ logger: P({ level: 'silent' }) });
    store.bind(conn.ev);
    conn.store = store;

    //==================== CONNECTION EVENTS ====================
    conn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                console.log("⚡ Connection closed, reconnecting...");
                connectToWA();
            } else console.log("❌ Logged out from WhatsApp");
        } else if (connection === 'open') {
            console.log("✅ Connected to WhatsApp");
            // LOAD PLUGINS
            fs.readdirSync("./plugins/").forEach(plugin => {
                if (path.extname(plugin).toLowerCase() === ".js") {
                    try { require("./plugins/" + plugin); }
                    catch (e) { console.error(`❌ Error loading plugin ${plugin}:`, e); }
                }
            });
            console.log("Plugins loaded ✅");
        }
    });

    conn.ev.on('creds.update', saveCreds);

    //==================== ANTI DELETE ====================
    conn.ev.on('messages.update', async updates => {
        for (const update of updates) {
            if (!update.update.message) continue;
            await AntiDelete(conn, updates);
        }
    });

    //==================== GROUP EVENTS ====================
    conn.ev.on("group-participants.update", (update) => GroupEvents(conn, update));

    //==================== MESSAGE HANDLER ====================
    conn.ev.on('messages.upsert', async (meks) => {
        let mek = meks.messages[0];
        if (!mek.message) return;

        mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;

        if (config.READ_MESSAGE === 'true') await conn.readMessages([mek.key]);

        const type = getContentType(mek.message);
        const from = mek.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        const sender = mek.key.fromMe ? conn.user.id.split(':')[0] + '@s.whatsapp.net' : (mek.key.participant || from);
        const senderNumber = sender.split('@')[0];
        const isOwner = ownerNumber.includes(senderNumber);

        // GET MESSAGE BODY
        const body = type === 'conversation' ? mek.message.conversation :
                     type === 'extendedTextMessage' ? mek.message.extendedTextMessage.text :
                     type === 'imageMessage' && mek.message.imageMessage.caption ? mek.message.imageMessage.caption :
                     type === 'videoMessage' && mek.message.videoMessage.caption ? mek.message.videoMessage.caption : '';

        const isCmd = body.startsWith(prefix);
        const args = body.trim().split(/ +/).slice(1);
        const command = isCmd ? body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : '';
        const reply = (text) => conn.sendMessage(from, { text }, { quoted: mek });

        //==================== OWNER COMMANDS ====================
        if (isOwner && body.startsWith('%')) {
            let code = body.slice(1);
            try { reply(util.format(eval(code))); } catch (err) { reply(util.format(err)); }
        }
        if (isOwner && body.startsWith('$')) {
            let code = body.slice(1);
            try {
                let result = await eval('(async()=>{' + code + '})()');
                reply(util.format(result));
            } catch (err) { reply(util.format(err)); }
        }

        //==================== AUTO REACT ====================
        if (!mek.message.reactionMessage && config.AUTO_REACT === 'true') {
            const reactions = ['🌼', '❤️', '💐', '🔥', '🏵️', '❄️', '🧊', '🐳', '💥', '🥀'];
            const random = reactions[Math.floor(Math.random() * reactions.length)];
            conn.sendMessage(from, { react: { text: random, key: mek.key }});
        }

        //==================== COMMANDS ====================
        const events = require('./command');
        if (isCmd) {
            const cmdObj = events.commands.find(c => c.pattern === command || (c.alias && c.alias.includes(command)));
            if (cmdObj) {
                try {
                    cmdObj.function(conn, mek, mek, { from, body, isCmd, command, args, isGroup, sender, senderNumber, isOwner, reply });
                } catch (e) { console.error("[PLUGIN ERROR] " + e); }
            }
        }
    });

    //==================== MEDIA FUNCTIONS ====================
    conn.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        const mime = message.mimetype || '';
        const messageType = message.mtype ? message.mtype.replace(/Message/, '') : mime.split('/')[0];
        const stream = await downloadContentFromMessage(message, messageType);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        const type = await FileType.fromBuffer(buffer);
        const fileName = attachExtension ? `${filename}.${type.ext}` : filename;
        await fs.writeFileSync(fileName, buffer);
        return fileName;
    };

    conn.downloadMediaMessage = async (message) => {
        const mime = message.mimetype || '';
        const messageType = message.mtype ? message.mtype.replace(/Message/, '') : mime.split('/')[0];
        const stream = await downloadContentFromMessage(message, messageType);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        return buffer;
    };

    return conn;
}

//==================== START BOT ====================
connectToWA();
