// lib/qc.js
const axios = require('axios');

async function makeQuote(sock, m, text, pushname, sender) {
  try {
    // 1. Ambil Foto Profil User
    let photoUrl;
    try {
      photoUrl = await sock.profilePictureUrl(sender, "image");
    } catch {
      // Default jika tidak ada PP
      photoUrl = "https://i.pinimg.com/564x/8a/e9/e9/8ae9e92fa4e69967aa61bf2bda967b7b.jpg";
    }

    // 2. Buat Payload JSON
    const payload = {
      messages: [
        {
          from: {
            id: 1,
            first_name: pushname || "User",
            photo: { url: photoUrl }
          },
          text: text,
          replyMessage: {} // Kosongkan jika tidak perlu reply quote
        }
      ],
      backgroundColor: "#FFFFFF", // Default Putih (Bisa diganti)
      width: 512,
      height: 512,
      scale: 2,
      type: "quote",
      format: "png",
      emojiStyle: "apple"
    };

    // 3. Request ke API
    const response = await axios.post("https://brat.siputzx.my.id/quoted", payload, {
      headers: { "Content-Type": "application/json" },
      responseType: "arraybuffer" // Penting agar jadi buffer gambar
    });

    return Buffer.from(response.data);

  } catch (error) {
    console.error("QC Error:", error);
    throw new Error("Gagal membuat sticker QC.");
  }
}

module.exports = { makeQuote };
