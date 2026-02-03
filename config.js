// config.js
module.exports = {
  // Bot Configuration
  botName: "DARKFROSTWOLF BOT",
  botVersion: "1.0.0",
  botPrefix: ".",
  
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
  crashAmount: 1000, // 1 IDR
  crashRepeat: 10, // Jumlah pengulangan crash
  
  // Group Settings
  maxGroupMembers: 1000,
  autoJoinGroup: false,
  
  // Database (optional)
  useDatabase: false,
  
  // APIs
  apis: {
    imageGenerator: "https://api.popcat.xyz/screenshot",
    qrCode: "https://api.qrserver.com/v1/create-qr-code"
  },
  
  // Messages
  messages: {
    welcome: "🤖 DARKFROSTWOLF BOT AKTIF!",
    crashSuccess: "✅ CRASH BERHASIL DIKIRIM!",
    crashFailed: "❌ GAGAL MENGIRIM CRASH",
    groupJoined: "📥 BOT TELAH MASUK GRUP",
    groupLeft: "📤 BOT TELAH KELUAR GRUP"
  }
};
