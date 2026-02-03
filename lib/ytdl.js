// lib/ytdl.js
const axios = require('axios');
const crypto = require('crypto');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

const BASE_URL = 'https://youtubedl.siputzx.my.id';
const jar = new CookieJar();
const client = wrapper(axios.create({ jar, withCredentials: true }));

// Fungsi untuk memecahkan puzzle keamanan (Proof of Work)
function solvePow(challenge, difficulty) {
    let nonce = 0;
    const prefix = '0'.repeat(difficulty);
    // console.log(`[POW] Solving complexity ${difficulty}... `);
    const start = Date.now();
    while (true) {
        const hash = crypto.createHash('sha256').update(challenge + nonce.toString()).digest('hex');
        if (hash.startsWith(prefix)) {
            // console.log(`Done (${Date.now() - start}ms)`);
            return nonce.toString();
        }
        nonce++;
    }
}

// Fungsi Utama Download
async function downloadVideo(url, type = 'audio', apikey = null) {
    try {
        if (apikey) {
            console.log(`[AUTH] Using Premium Key`);
        } else {
            console.log(`[AUTH] Requesting PoW Challenge...`);
            const { data: { challenge, difficulty } } = await client.post(`${BASE_URL}/akumaudownload`, { url, type });
            const nonce = solvePow(challenge, difficulty);
            
            console.log(`[AUTH] Verifying Session...`);
            await client.post(`${BASE_URL}/cekpunyaku`, { url, type, nonce });
        }

        console.log(`[TASK] Initializing Download...`);
        while (true) {
            const { data } = await client.get(`${BASE_URL}/download`, { params: { url, type, apikey } });
            
            if (data.status === 'completed') {
                console.log(`[TASK] Status: ${data.status.toUpperCase()}`);
                return BASE_URL + data.fileUrl; // Mengembalikan URL file
            }

            if (data.status === 'failed') {
                throw new Error(data.error);
            }

            // Tunggu 3 detik sebelum cek lagi statusnya
            await new Promise(r => setTimeout(r, 3000));
        }
    } catch (error) {
        console.error(`[ERR]`, error.response?.data || error.message);
        throw error;
    }
}

module.exports = { downloadVideo };
