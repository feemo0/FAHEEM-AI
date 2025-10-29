const fs = require('fs');
const path = require('path');

// === ANTI-DELETE SETTINGS ===
const antiDelPath = path.join(__dirname, 'antidel.json');
let AntiDelDB = {};

if (fs.existsSync(antiDelPath)) {
  try {
    AntiDelDB = JSON.parse(fs.readFileSync(antiDelPath, 'utf-8'));
  } catch (e) {
    AntiDelDB = {};
  }
}

const initializeAntiDeleteSettings = () => {
  AntiDelDB = {};
  saveAntiDelDB();
};

const setAnti = (jid, value) => {
  AntiDelDB[jid] = value;
  saveAntiDelDB();
};

const getAnti = (jid) => {
  return AntiDelDB[jid] || false;
};

const getAllAntiDeleteSettings = () => {
  return { ...AntiDelDB };
};

const saveAntiDelDB = () => {
  fs.writeFileSync(antiDelPath, JSON.stringify(AntiDelDB, null, 2));
};

// === STORE / MESSAGES ===
const storePath = path.join(__dirname, 'store.json');
let storeDB = {
  contacts: {},
  messages: [],
  groupMeta: {},
  msgCount: {}
};

if (fs.existsSync(storePath)) {
  try {
    const data = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
    storeDB = { ...storeDB, ...data };
  } catch (e) {
    console.log('Error loading store.json:', e);
  }
}

const saveStoreDB = () => {
  fs.writeFileSync(storePath, JSON.stringify(storeDB, null, 2));
};

const saveContact = (jid, name) => {
  storeDB.contacts[jid] = name;
  saveStoreDB();
};

const loadMessage = (msg) => {
  storeDB.messages.push(msg);
  if (storeDB.messages.length > 1000) storeDB.messages.shift();
  saveStoreDB();
};

const getName = (jid) => {
  return storeDB.contacts[jid] || jid.split('@')[0];
};

const getChatSummary = () => {
  return storeDB.messages.length;
};

const saveGroupMetadata = (jid, meta) => {
  storeDB.groupMeta[jid] = meta;
  saveStoreDB();
};

const getGroupMetadata = (jid) => {
  return storeDB.groupMeta[jid];
};

const saveMessageCount = (jid, count) => {
  storeDB.msgCount[jid] = count;
  saveStoreDB();
};

const getInactiveGroupMembers = (groupJid) => {
  const members = (storeDB.groupMeta[groupJid]?.participants || []).map(p => p.id);
  return members.filter(jid => !storeDB.msgCount[jid] || storeDB.msgCount[jid] < 5);
};

const getGroupMembersMessageCount = (groupJid) => {
  return storeDB.msgCount;
};

const saveMessage = (msg) => {
  const entry = {
    key: msg.key,
    message: msg.message,
    pushName: msg.pushName,
    participant: msg.key.participant
  };
  storeDB.messages.push(entry);
  if (storeDB.messages.length > 500) storeDB.messages.shift();
  saveStoreDB();
};

// === EXPORT ALL ===
module.exports = {
  AntiDelDB,
  initializeAntiDeleteSettings,
  setAnti,
  getAnti,
  getAllAntiDeleteSettings,
  saveContact,
  loadMessage,
  getName,
  getChatSummary,
  saveGroupMetadata,
  getGroupMetadata,
  saveMessageCount,
  getInactiveGroupMembers,
  getGroupMembersMessageCount,
  saveMessage
};
