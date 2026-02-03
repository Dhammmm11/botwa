// config.js
module.exports = {
  // Bot Configuration
  botName: "DARKFROSTWOLF BOT",
  botVersion: "1.0.0",
  botPrefix: ".",
  
  // Connection Method (CHOOSE ONE)
  connectionMethod: "pairing", // "pairing" or "qr"
  
  // Owner Information
  ownerNumber: "628xxxxxxxxxx", // Ganti dengan nomor lu
  ownerName: "darkFrostwolf",
  
  // Session Configuration
  sessionName: "session",
  maxRetries: 5,
  
  // Features
  enableCrash: true,
  enableGroupFeatures: true,
  
  // Crash Settings
  crashAmount: 1000,
  crashRepeat: 10,
  
  // Messages
  messages: {
    welcome: "🤖 DARKFROSTWOLF BOT AKTIF!",
    crashSuccess: "✅ CRASH BERHASIL DIKIRIM!",
    crashFailed: "❌ GAGAL MENGIRIM CRASH"
  }
};
