//Give Me Credit If Using This File Give Me Credit On Your Channel
// Credits ADEEL - ADEEL-MD

const { jidDecode } = require('@whiskeysockets/baileys');
const config = require('../config');

const getContextInfo = (sender) => {
    return {
        mentionedJid: [sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363374742198780@newsletter',
            newsletterName: '𝙁𝘼𝙃𝙀𝙀𝙈-𝘼𝙄',
            serverMessageId: 143,
        },
    };
};

const ppUrls = [
    'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
    'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
    'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
];

const GroupEvents = async (conn, update) => {
    try {
        const { id, participants, action } = update;
        if (!id.endsWith('@g.us')) return; // Check if group

        const metadata = await conn.groupMetadata(id).catch(() => ({}));
        if (!metadata?.id) return;

        const groupName = metadata.subject || 'Unknown Group';
        const desc = metadata.desc || "No Description";
        const groupMembersCount = metadata.participants?.length || 0;

        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(id, 'image');
        } catch {
            ppUrl = ppUrls[Math.floor(Math.random() * ppUrls.length)];
        }

        for (const num of participants) {
            const userName = num.split("@")[0];
            const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' });

            // Get actor (who did the action)
            let actor = update.author || participants[0];
            const actorName = actor.split("@")[0];

            if (action === "add" && config.WELCOME === "true") {
                const WelcomeText = `Hey @${userName}\n` +
                    `Welcome to *${groupName}*.\n` +
                    `You are member number ${groupMembersCount}.\n` +
                    `Time joined: *${timestamp}*\n` +
                    `Please read the group description:\n${desc}\n` +
                    `*Powered by ${config.BOT_NAME}*.`;

                await conn.sendMessage(id, {
                    image: { url: ppUrl },
                    caption: WelcomeText,
                    mentions: [num],
                    contextInfo: getContextInfo(num),
                });

            } else if (action === "remove" && config.WELCOME === "true") {
                const GoodbyeText = `Goodbye @${userName}.\n` +
                    `Left the group.\n` +
                    `Time left: *${timestamp}*\n` +
                    `Group now has ${groupMembersCount} members.`;

                await conn.sendMessage(id, {
                    image: { url: ppUrl },
                    caption: GoodbyeText,
                    mentions: [num],
                    contextInfo: getContextInfo(actor),
                });

            } else if (action === "demote" && config.ADMIN_EVENTS === "true") {
                await conn.sendMessage(id, {
                    text: `*Admin Event*\n\n` +
                          `@${actorName} has demoted @${userName} from admin.\n` +
                          `Time: ${timestamp}\n` +
                          `*Group:* ${groupName}`,
                    mentions: [actor, num],
                    contextInfo: getContextInfo(actor),
                });

            } else if (action === "promote" && config.ADMIN_EVENTS === "true") {
                await conn.sendMessage(id, {
                    text: `*Admin Event*\n\n` +
                          `@${actorName} has promoted @${userName} to admin.\n` +
                          `Time: ${timestamp}\n` +
                          `*Group:* ${groupName}`,
                    mentions: [actor, num],
                    contextInfo: getContextInfo(actor),
                });
            }
        }
    } catch (err) {
        console.error('Group event error:', err.message || err);
    }
};

module.exports = GroupEvents;
