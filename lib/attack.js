// lib/attack.js - ACTIVATED
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function spamMassal(sock, target, jumlah, pesan) {
  const targetJid = target.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
  
  for (let i = 0; i < jumlah; i++) {
    await sock.sendMessage(targetJid, { text: pesan });
    await delay(500); // Delay biar ga langsung ke-banned
  }
  return { status: true };
}

// Fitur Blast (Broadcast ke semua chat)
async function blastPMMassal(sock, pesan) {
  const chats = await sock.groupFetchAllParticipating(); // Contoh ambil data grup/chat
  // Logic blast sederhana (hati-hati banned)
  return { status: true, msg: "Fitur blast berisiko tinggi, hati-hati." };
}

module.exports = { spamMassal, blastPMMassal };

// lib/ytdl.js - FIXED BUFFER DOWNLOAD
const axios = require('axios');
const crypto = require('crypto');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

const BASE_URL = 'https://youtubedl.siputzx.my.id';
const jar = new CookieJar();
const client = wrapper(axios.create({ 
    jar, 
    withCredentials: true,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': BASE_URL,
        'Origin': BASE_URL
    }
}));

function solvePow(challenge, difficulty) {
    let nonce = 0;
    const prefix = '0'.repeat(difficulty);
    while (true) {
        const hash = crypto.createHash('sha256').update(challenge + nonce.toString()).digest('hex');
        if (hash.startsWith(prefix)) return nonce.toString();
        nonce++;
    }
}

async function downloadVideo(url, type = 'audio') {
    try {
        // 1. Auth & Challenge
        const { data: init } = await client.post(`${BASE_URL}/akumaudownload`, { url, type });
        const nonce = solvePow(init.challenge, init.difficulty);
        await client.post(`${BASE_URL}/cekpunyaku`, { url, type, nonce });

        // 2. Polling Status
        let fileUrl = '';
        while (true) {
            const { data } = await client.get(`${BASE_URL}/download`, { params: { url, type } });
            if (data.status === 'completed') {
                fileUrl = BASE_URL + data.fileUrl;
                break;
            }
            if (data.status === 'failed') throw new Error(data.error);
            await new Promise(r => setTimeout(r, 2000));
        }

        // 3. DOWNLOAD FILE KE BUFFER (SOLUSI AGAR TIDAK CORRUPT)
        // Kita gunakan client yang sama agar cookies terbawa
        const bufferRes = await client.get(fileUrl, { 
            responseType: 'arraybuffer' 
        });

        return bufferRes.data; // Return Buffer

    } catch (error) {
        const msg = error.response?.data?.message || error.message;
        throw new Error(`YTDL Error: ${msg}`);
    }
}

module.exports = { downloadVideo };
