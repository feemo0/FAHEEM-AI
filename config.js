const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}

module.exports = {
    SESSION_ID: process.env.SESSION_ID || "",
    AUTO_STATUS_SEEN: process.env.AUTO_STATUS_SEEN || "true",
    AUTO_STATUS_REPLY: process.env.AUTO_STATUS_REPLY || "false",
    AUTO_STATUS_REACT: process.env.AUTO_STATUS_REACT || "true",
    AUTO_STATUS_MSG: process.env.AUTO_STATUS_MSG || "*SEEN YOUR STATUS BY FAHEEM*",
    ANTI_DELETE: process.env.ANTI_DELETE || "false",
    ANTI_DEL_PATH: process.env.ANTI_DEL_PATH || "inbox",
    WELCOME: process.env.WELCOME || "false",
    ADMIN_EVENTS: process.env.ADMIN_EVENTS || "false",
    ANTI_LINK: process.env.ANTI_LINK || "true",
    MENTION_REPLY: process.env.MENTION_REPLY || "false",
    MENU_IMAGE_URL: process.env.MENU_IMAGE_URL || "https://files.catbox.moe/hg5hj6.jpg",
    PREFIX: process.env.PREFIX || ".",
    BOT_NAME: process.env.BOT_NAME || "FAHEEM-AI",
    STICKER_NAME: process.env.STICKER_NAME || "FAHEEM-AI",
    CUSTOM_REACT: process.env.CUSTOM_REACT || "false",
    CUSTOM_REACT_EMOJIS: process.env.CUSTOM_REACT_EMOJIS || "Heart,Red Heart,Orange Heart,Yellow Heart,Green Heart,Blue Heart,Purple Heart,Black Heart,White Heart,Brown Heart",
    DELETE_LINKS: process.env.DELETE_LINKS || "false",
    OWNER_NUMBER: process.env.OWNER_NUMBER || "61480853796",
    OWNER_NAME: process.env.OWNER_NAME || "FAHEEM",
    DESCRIPTION: process.env.DESCRIPTION || "*©ᴘᴏᴡᴇʀᴇᴅ ʙʏ ғᴀʜᴇᴇᴍ*",
    ALIVE_IMG: process.env.ALIVE_IMG || "https://files.catbox.moe/a6d73s.jpg",
    LIVE_MSG: process.env.LIVE_MSG || "> I'm alive",
    READ_MESSAGE: process.env.READ_MESSAGE || "false",
    AUTO_REACT: process.env.AUTO_REACT || "false",
    ANTI_BAD: process.env.ANTI_BAD || "false",
    MODE: process.env.MODE || "public",
    ANTI_LINK_KICK: process.env.ANTI_LINK_KICK || "false",
    AUTO_STICKER: process.env.AUTO_STICKER || "false",
    AUTO_REPLY: process.env.AUTO_REPLY || "false",
    ALWAYS_ONLINE: process.env.ALWAYS_ONLINE || "false",
    PUBLIC_MODE: process.env.PUBLIC_MODE || "true",
    AUTO_TYPING: process.env.AUTO_TYPING || "false",
    READ_CMD: process.env.READ_CMD || "false",
    DEV: process.env.DEV || "61480853796",
    ANTI_VV: process.env.ANTI_VV || "true",
    AUTO_RECORDING: process.env.AUTO_RECORDING || "false"
};
