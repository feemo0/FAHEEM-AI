const axios = require('axios');

const getBuffer = async (url, options = {}) => {
  try {
    const res = await axios({
      method: 'get',
      url,
      headers: {
        'DNT': 1,
        'Upgrade-Insecure-Requests': 1
      },
      ...options,
      responseType: 'arraybuffer'
    });
    return res.data;
  } catch (e) {
    console.log('getBuffer Error:', e);
    return null;
  }
};

const getGroupAdmins = (participants) => {
  const admins = [];
  for (let i of participants) {
    if (i.admin === 'admin' || i.admin === 'superadmin') {
      admins.push(i.id);
    }
  }
  return admins;
};

const getRandom = (ext) => {
  return `${Math.floor(Math.random() * 10000)}${ext}`;
};

const h2k = (eco) => {
  const lyrik = ['', 'K', 'M', 'B', 'T', 'P', 'E'];
  const ma = Math.log10(Math.abs(eco)) / 3 | 0;
  if (ma === 0) return eco.toString();
  const ppo = lyrik[ma];
  const scale = Math.pow(10, ma * 3);
  const scaled = eco / scale;
  let formatt = scaled.toFixed(1);
  if (/\.0$/.test(formatt)) {
    formatt = formatt.slice(0, -2);
  }
  return formatt + ppo;
};

const isUrl = (url) => {
  return url.match(
    new RegExp(
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/,
      'gi'
    )
  );
};

const Json = (string) => {
  try {
    return JSON.stringify(string, null, 2);
  } catch {
    return '[CANNOT CONVERT TO JSON]';
  }
};

const runtime = (seconds) => {
  seconds = Number(seconds);
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const dDisplay = d > 0 ? `${d}d ` : '';
  const hDisplay = h > 0 ? `${h}h ` : '';
  const mDisplay = m > 0 ? `${m}m ` : '';
  const sDisplay = s > 0 ? `${s}s` : '';
  return dDisplay + hDisplay + mDisplay + sDisplay;
};

const sleep = async (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const fetchJson = async (url, options = {}) => {
  try {
    const res = await axios({
      method: 'GET',
      url,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
      },
      ...options
    });
    return res.data;
  } catch (err) {
    console.log('fetchJson Error:', err.message);
    return { error: err.message };
  }
};

module.exports = {
  getBuffer,
  getGroupAdmins,
  getRandom,
  h2k,
  isUrl,
  Json,
  runtime,
  sleep,
  fetchJson
};
