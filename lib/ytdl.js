// lib/ytdl.js - FIXED HEADERS
const axios = require('axios');
const crypto = require('crypto');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

const BASE_URL = 'https://youtubedl.siputzx.my.id';
const jar = new CookieJar();
// Gunakan User-Agent Chrome agar tidak kena Error 400
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
        // 1. Request Challenge
        const { data: init } = await client.post(`${BASE_URL}/akumaudownload`, { url, type });
        const nonce = solvePow(init.challenge, init.difficulty);
        
        // 2. Verify
        await client.post(`${BASE_URL}/cekpunyaku`, { url, type, nonce });

        // 3. Polling Status
        while (true) {
            const { data } = await client.get(`${BASE_URL}/download`, { params: { url, type } });
            
            if (data.status === 'completed') return BASE_URL + data.fileUrl;
            if (data.status === 'failed') throw new Error(data.error || 'Gagal dari server');
            
            await new Promise(r => setTimeout(r, 2000));
        }
    } catch (error) {
        // Log detail error dari server jika ada
        const msg = error.response?.data?.message || error.message;
        throw new Error(`Server Error: ${msg}`);
    }
}

module.exports = { downloadVideo };
