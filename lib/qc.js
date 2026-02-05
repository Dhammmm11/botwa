// lib/qc.js - FIXED API & BUFFER
const axios = require('axios');

async function makeQuote(sock, m, text, pushname, sender) {
  try {
    // 1. Ambil Foto Profil User
    let photoUrl;
    try {
      photoUrl = await sock.profilePictureUrl(sender, "image");
    } catch {
      // Default PP jika user tidak punya foto
      photoUrl = "https://i.pinimg.com/564x/8a/e9/e9/8ae9e92fa4e69967aa61bf2bda967b7b.jpg";
    }

    // 2. Buat Payload JSON (Format Standard Quotly)
    const payload = {
      type: "quote",
      format: "png",
      backgroundColor: "#FFFFFF",
      width: 512,
      height: 768,
      scale: 2,
      messages: [
        {
          entities: [],
          avatar: true,
          from: {
            id: 1,
            name: pushname || "User",
            photo: { url: photoUrl }
          },
          text: text,
          replyMessage: {}
        }
      ]
    };

    // 3. Request ke API (Gunakan API Lyo.su yang lebih stabil untuk Buffer)
    const response = await axios.post("https://bot.lyo.su/quote/generate", payload, {
      headers: { 
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      responseType: "arraybuffer" // WAJIB: Agar respon dibaca sebagai data file (bukan teks)
    });

    // 4. Return Buffer Murni
    return Buffer.from(response.data);

  } catch (error) {
    console.error("QC Error:", error.message);
    throw new Error("Gagal membuat sticker (API Error).");
  }
}

module.exports = { makeQuote };
