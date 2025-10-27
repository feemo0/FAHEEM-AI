const config = require('../config')
const { cmd, commands } = require('../command');
const path = require('path'); 
const os = require("os")
const fs = require('fs');
const {runtime} = require('../lib/functions')
const axios = require('axios')

cmd({
    pattern: "menu2",
    alias: ["allmenu","fullmenu"],
    use: '.menu2',
    desc: "Show all bot commands",
    category: "menu",
    react: "📜",
    filename: __filename
}, 
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        let dec = `╭━━〔 🚀 *${config.BOT_NAME}* 〕━━┈⊷
┃◈╭─────────────────·๏
┃◈┃• 👑 𝙊𝙬𝙣𝙚𝙧 : *${config.OWNER_NAME}*
┃◈┃• ⚙️ 𝙋𝙧𝙚𝙛𝙞𝙭 : *[${config.PREFIX}]*
┃◈┃• 🌐 𝙋𝙡𝙖𝙩𝙛𝙤𝙧𝙢 : *Heroku*
┃◈┃• 📦 𝙑𝙚𝙧𝙨𝙞𝙤𝙣 : *4.0.0*
┃◈┃• ⏱️ 𝙍𝙪𝙣𝙩𝙞𝙢𝙚 : *${runtime(process.uptime())}*
┃◈╰─────────────────┈⊷
╰━━━━━━━━━━━━━━━━━━━┈⊷

╭━━〔 📥 𝘿𝙊𝙒𝙉𝙇𝙊𝘼𝘿 𝙈𝙀𝙉𝙐 〕━━┈⊷
┃◈╭─────────────────·๏
┃◈┃• 🟦 facebook
┃◈┃• 📁 mediafire
┃◈┃• 🎵 tiktok
┃◈┃• 🐦 twitter
┃◈┃• 📷 insta
┃◈┃• 📦 apk
┃◈┃• 🖼️ img
┃◈┃• ▶️ tt2
┃◈┃• 📌 pins
┃◈┃• 🔄 apk2
┃◈┃• 🔵 fb2
┃◈┃• 📍 pinterest
┃◈┃• 🎶 spotify
┃◈┃• 🎧 play
┃◈┃• 🎧 play2
┃◈┃• 🔉 audio
┃◈┃• 🎬 video
┃◈┃• 📹 video2
┃◈┃• 🎵 ytmp3
┃◈┃• 📹 ytmp4
┃◈┃• 🎶 song
┃◈┃• 🎬 darama
┃◈┃• ☁️ gdrive
┃◈┃• 🌐 ssweb
┃◈┃• 🎵 tiks
┃◈╰─────────────────┈⊷
╰━━━━━━━━━━━━━━━━━━━┈⊷

╭━━〔 👥 𝙂𝙍𝙊𝙐𝙋 𝙈𝙀𝙉𝙐 〕━━┈⊷
┃◈╭─────────────────·๏
┃◈┃• 🔗 grouplink
┃◈┃• 🚪 kickall
┃◈┃• 🚷 kickall2
┃◈┃• 🚫 kickall3
┃◈┃• ➕ add
┃◈┃• ➖ remove
┃◈┃• 👢 kick
┃◈┃• ⬆️ promote
┃◈┃• ⬇️ demote
┃◈┃• 🚮 dismiss
┃◈┃• 🔄 revoke
┃◈┃• 👋 setgoodbye
┃◈┃• 🎉 setwelcome
┃◈┃• 🗑️ delete
┃◈┃• 🖼️ getpic
┃◈┃• ℹ️ ginfo
┃◈┃• ⏳ disappear on
┃◈┃• ⏳ disappear off
┃◈┃• ⏳ disappear 7D,24H
┃◈┃• 📝 allreq
┃◈┃• ✏️ updategname
┃◈┃• 📝 updategdesc
┃◈┃• 📩 joinrequests
┃◈┃• 📨 senddm
┃◈┃• 🏃 nikal
┃◈┃• 🔇 mute
┃◈┃• 🔊 unmute
┃◈┃• 🔒 lockgc
┃◈┃• 🔓 unlockgc
┃◈┃• 📩 invite
┃◈┃• #️⃣ tag
┃◈┃• 🏷️ hidetag
┃◈┃• @️⃣ tagall
┃◈┃• 👔 tagadmins
┃◈╰─────────────────┈⊷
╰━━━━━━━━━━━━━━━━━━━┈⊷

╭━━〔 🎭 𝙍𝙀𝘼𝘾𝙏𝙄𝙊𝙉𝙎 𝙈𝙀𝙉𝙐𝙐 〕━━┈⊷
┃◈╭─────────────────·๏
┃◈┃• 👊 bully @tag
┃◈┃• 🤗 cuddle @tag
┃◈┃• 😢 cry @tag
┃◈┃• 🤗 hug @tag
┃◈┃• 🐺 awoo @tag
┃◈┃• 💋 kiss @tag
┃◈┃• 👅 lick @tag
┃◈┃• 🖐️ pat @tag
┃◈┃• 😏 smug @tag
┃◈┃• 🔨 bonk @tag
┃◈┃• 🚀 yeet @tag
┃◈┃• 😊 blush @tag
┃◈┃• 😄 smile @tag
┃◈┃• 👋 wave @tag
┃◈┃• ✋ highfive @tag
┃◈┃• 🤝 handhold @tag
┃◈┃• 🍜 nom @tag
┃◈┃• 🦷 bite @tag
┃◈┃• 🤗 glomp @tag
┃◈┃• 👋 slap @tag
┃◈┃• 💀 kill @tag
┃◈┃• 😊 happy @tag
┃◈┃• 😉 wink @tag
┃◈┃• 👉 poke @tag
┃◈┃• 💃 dance @tag
┃◈┃• 😬 cringe @tag
┃◈╰─────────────────┈⊷
╰━━━━━━━━━━━━━━━━━━━┈⊷

╭━━〔 🎨 𝙇𝙊𝙂𝙊 𝙈𝘼𝙆𝙀𝙍 〕━━┈⊷
┃◈╭─────────────────·๏
┃◈┃• 💡 neonlight
┃◈┃• 🎀 blackpink
┃◈┃• 🐉 dragonball
┃◈┃• 🎭 3dcomic
┃◈┃• 🇺🇸 america
┃◈┃• 🍥 naruto
┃◈┃• 😢 sadgirl
┃◈┃• ☁️ clouds
┃◈┃• 🚀 futuristic
┃◈┃• 📜 3dpaper
┃◈┃• ✏️ eraser
┃◈┃• 🌇 sunset
┃◈┃• 🍃 leaf
┃◈┃• 🌌 galaxy
┃◈┃• 💀 sans
┃◈┃• 💥 boom
┃◈┃• 💻 hacker
┃◈┃• 😈 devilwings
┃◈┃• 🇳🇬 nigeria
┃◈┃• 💡 bulb
┃◈┃• 👼 angelwings
┃◈┃• ♈ zodiac
┃◈┃• 💎 luxury
┃◈┃• 🎨 paint
┃◈┃• ❄️ frozen
┃◈┃• 🏰 castle
┃◈┃• 🖋️ tatoo
┃◈┃• 🔫 valorant
┃◈┃• 🐻 bear
┃◈┃• 🔠 typography
┃◈┃• 🎂 birthday
┃◈╰─────────────────┈⊷
╰━━━━━━━━━━━━━━━━━━━┈⊷

╭━━〔 👑 𝙊𝙒𝙉𝙀𝙍 𝙈𝙀𝙉𝙐 〕━━┈⊷
┃◈╭─────────────────·๏
┃◈┃• 👑 owner
┃◈┃• 📜 menu
┃◈┃• 📜 menu2
┃◈┃• 📊 vv
┃◈┃• 📋 listcmd
┃◈┃• 📚 allmenu
┃◈┃• 📦 repo
┃◈┃• 🚫 block
┃◈┃• ✅ unblock
┃◈┃• 🖼️ fullpp
┃◈┃• 🖼️ setpp
┃◈┃• 🔄 restart
┃◈┃• ⏹️ shutdown
┃◈┃• 🔄 updatecmd
┃◈┃• 💚 alive
┃◈┃• 🏓 ping
┃◈┃• 🆔 gjid
┃◈┃• 🆔 jid
┃◈╰─────────────────┈⊷
╰━━━━━━━━━━━━━━━━━━━┈⊷

╭━━〔 🎉 𝙁𝙐𝙉 𝙈𝙀𝙉𝙐 〕━━┈⊷
┃◈╭─────────────────·๏
┃◈┃• 🤪 shapar
┃◈┃• ⭐ rate
┃◈┃• 🤬 insult
┃◈┃• 💻 hack
┃◈┃• 💘 ship
┃◈┃• 🎭 character
┃◈┃• 💌 pickup
┃◈┃• 😆 joke
┃◈┃• ❤️ hrt
┃◈┃• 😊 hpy
┃◈┃• 😔 syd
┃◈┃• 😠 anger
┃◈┃• 😳 shy
┃◈┃• 💋 kiss
┃◈┃• 🧐 mon
┃◈┃• 😕 cunfuzed
┃◈┃• 🖼️ setpp
┃◈┃• ✋ hand
┃◈┃• 🏃 nikal
┃◈┃• 🤲 hold
┃◈┃• 🤗 hug
┃◈┃• 🏃 nikal
┃◈┃• 🎵 hifi
┃◈┃• 👉 poke
┃◈╰─────────────────┈⊷
╰━━━━━━━━━━━━━━━━━━━┈⊷

╭━━〔 🔄 𝘾𝙊𝙉𝙑𝙀𝙍𝙏 𝙈𝙀𝙉𝙐 〕━━┈⊷
┃◈╭─────────────────·๏
┃◈┃• 🏷️ sticker
┃◈┃• 🏷️ sticker2
┃◈┃• 😀 emojimix
┃◈┃• ✨ fancy
┃◈┃• 🖼️ take
┃◈┃• 🎵 tomp3
┃◈┃• 🗣️ tts
┃◈┃• 🌐 trt
┃◈┃• 🔢 base64
┃◈┃• 🔠 unbase64
┃◈┃• 010 binary
┃◈┃• 🔤 dbinary
┃◈┃• 🔗 tinyurl
┃◈┃• 🌐 urldecode
┃◈┃• 🌐 urlencode
┃◈┃• 🌐 url
┃◈┃• 🔁 repeat
┃◈┃• ❓ ask
┃◈┃• 📖 readmore
┃◈╰─────────────────┈⊷
╰━━━━━━━━━━━━━━━━━━━┈⊷

╭━━〔 🤖 𝘼𝙄 𝙈𝙀𝙉𝙐 〕━━┈⊷
┃◈╭─────────────────·๏
┃◈┃• 🧠 ai
┃◈┃• 🤖 gpt3
┃◈┃• 🤖 gpt2
┃◈┃• 🤖 gptmini
┃◈┃• 🤖 gpt
┃◈┃• 🔵 meta
┃◈┃• 📦 blackbox
┃◈┃• 🌈 luma
┃◈┃• 🎧 dj
┃◈┃• 👑 DARKZONE 
┃◈┃• 🤵 IRFAN 
┃◈┃• 🧠 gpt4
┃◈┃• 🔍 bing
┃◈┃• 🎨 imagine
┃◈┃• 🖼️ imagine2
┃◈┃• 🤖 copilot
┃◈╰─────────────────┈⊷
╰━━━━━━━━━━━━━━━━━━━┈⊷

╭━━〔 ⚡ 𝙈𝘼𝙄𝙉 𝙈𝙀𝙉𝙐 〕━━┈⊷
┃◈╭─────────────────·๏
┃◈┃• 🏓 ping
┃◈┃• 🏓 ping2
┃◈┃• 🚀 speed
┃◈┃• 📡 live
┃◈┃• 💚 alive
┃◈┃• ⏱️ runtime
┃◈┃• ⏳ uptime
┃◈┃• 📦 repo
┃◈┃• 👑 owner
┃◈┃• 📜 menu
┃◈┃• 📜 menu2
┃◈┃• 🔄 restart
┃◈╰─────────────────┈⊷
╰━━━━━━━━━━━━━━━━━━━┈⊷

╭━━〔 🎎 𝘼𝙉𝙄𝙈𝙀 𝙈𝙀𝙉𝙐 〕━━┈⊷
┃◈╭─────────────────·๏
┃◈┃• 🤬 fack
┃◈┃• ✅ truth
┃◈┃• 😨 dare
┃◈┃• 🐶 dog
┃◈┃• 🐺 awoo
┃◈┃• 👧 garl
┃◈┃• 👰 waifu
┃◈┃• 🐱 neko
┃◈┃• 🧙 megnumin
┃◈┃• 🐱 neko
┃◈┃• 👗 maid
┃◈┃• 👧 loli
┃◈┃• 🎎 animegirl
┃◈┃• 🎎 animegirl1
┃◈┃• 🎎 animegirl2
┃◈┃• 🎎 animegirl3
┃◈┃• 🎎 animegirl4
┃◈┃• 🎎 animegirl5
┃◈┃• 🎬 anime1
┃◈┃• 🎬 anime2
┃◈┃• 🎬 anime3
┃◈┃• 🎬 anime4
┃◈┃• 🎬 anime5
┃◈┃• 📰 animenews
┃◈┃• 🦊 foxgirl
┃◈┃• 🍥 naruto
┃◈╰─────────────────┈⊷
╰━━━━━━━━━━━━━━━━━━━┈⊷

╭━━〔 ℹ️ 𝙊𝙏𝙃𝙀𝙍 𝙈𝙀𝙉𝙐 〕━━┈⊷
┃◈╭─────────────────·๏
┃◈┃• 🕒 timenow
┃◈┃• 📅 date
┃◈┃• 🔢 count
┃◈┃• 🧮 calculate
┃◈┃• 🔢 countx
┃◈┃• 🎲 flip
┃◈┃• 🪙 coinflip
┃◈┃• 🎨 rcolor
┃◈┃• 🎲 roll
┃◈┃• ℹ️ fact
┃◈┃• 💻 cpp
┃◈┃• 🎲 rw
┃◈┃• 💑 pair
┃◈┃• 💑 pair2
┃◈┃• 💑 pair3
┃◈┃• ✨ fancy
┃◈┃• 🎨 logo <text>
┃◈┃• 📖 define
┃◈┃• 📰 news
┃◈┃• 🎬 movie
┃◈┃• ☀️ weather
┃◈┃• 📦 srepo
┃◈┃• 🤬 insult
┃◈┃• 💾 save
┃◈┃• 🌐 wikipedia
┃◈┃• 🔑 gpass
┃◈┃• 👤 githubstalk
┃◈┃• 🔍 yts
┃◈┃• 📹 ytv
┃◈╰─────────────────┈⊷
╰━━━━━━━━━━━━━━━━━━━┈⊷
> ${config.DESCRIPTION}`;

        await conn.sendMessage(
            from,
            {
                image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/a6d73s.jpg' },
                caption: dec,
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363374742198780@newsletter',
                        newsletterName: config.BOT_NAME,
                        serverMessageId: 143
                    }
                }
            },
            { quoted: mek }
        );
// share local audio 

const audioPath = path.join(__dirname, '../assets/menu.m4a');
await conn.sendMessage(from, {
    audio: fs.readFileSync(audioPath),
    mimetype: 'audio/mp4',
    ptt: true,
}, { quoted: mek });
        
    } catch (e) {
        console.log(e);
        reply(`❌ Error: ${e}`);
    }
});
