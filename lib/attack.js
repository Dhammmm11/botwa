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
