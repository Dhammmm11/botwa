const moment = require('moment-timezone');

// Fungsi Menghitung Runtime (Uptime)
const getRuntime = (seconds) => {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600 * 24));
    var h = Math.floor(seconds % (3600 * 24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);
    var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
};

async function showMenu(sock, sender, pushname) {
  // Ambil data waktu & uptime
  const time = moment().tz('Asia/Jakarta').format('HH:mm:ss');
  const date = moment().tz('Asia/Jakarta').format('DD/MM/YYYY');
  const uptime = getRuntime(process.uptime());
  
  // Gambar Menu BARU (Sesuai Permintaan)
  const botImage = 'https://files.catbox.moe/vpi2ef.jpg'; 
  
  const menuText = `
┌  𝐃𝐀𝐑𝐊𝐅𝐑𝐎𝐒𝐓𝐖𝐎𝐋𝐅 𝐔𝐋𝐓𝐈𝐌𝐀𝐓𝐄
│  👤 User    : ${pushname || 'User'}
│  ⏳ Uptime  : ${uptime}
│  ⌚ Time    : ${time} WIB
│  📅 Date    : ${date}
└  🟢 Status  : Active

┌  [ ⚔️ 𝐀𝐓𝐓𝐀𝐂𝐊 𝐌𝐄𝐍𝐔 ]
│  ◦ .crash 628xxx
│    (Kirim Bug/Crash ke target)
│  ◦ .spam 628xxx [jumlah] [pesan]
│    (Spam chat barbar)
└

┌  [ 🎥 𝐌𝐄𝐃𝐈𝐀 & 𝐌𝐀𝐊𝐄𝐑 ]
│  ◦ .play [judul/link]
│    (Download Audio YouTube)
│  ◦ .video [judul/link]
│    (Download Video YouTube)
│  ◦ .qc [teks]
│    (Buat Sticker Quote)
└

┌  [ 👥 𝐆𝐑𝐎𝐔𝐏 𝐀𝐃𝐌𝐈𝐍 ]
│  ◦ .kick @tag
│    (Tendang member)
│  ◦ .add 628xxx
│    (Tambah member)
│  ◦ .promote @tag
│    (Jadikan admin)
│  ◦ .demote @tag
│    (Hapus admin)
│  ◦ .linkgroup
│    (Ambil link grup)
│  ◦ .infogroup
│    (Cek info grup)
└

┌  [ 🔊 𝐓𝐀𝐆 𝐌𝐄𝐍𝐔 ]
│  ◦ .hidetag [pesan]
│    (Tag semua member - hidden)
│  ◦ .tagall
│    (Tag semua member - list)
└

┌  [ ℹ️ 𝐈𝐍𝐅𝐎 𝐁𝐎𝐓 ]
│  ◦ .owner
│    (Kontak Pemilik)
│  ◦ .ping
│    (Cek Kecepatan)
│  ◦ .menu
│    (Refresh Menu)
└

⚠️ *NOTE:*
Gunakan dengan bijak.
Bot tidak bertanggung jawab atas risiko banned.
`;

  // Kirim Gambar dengan Caption
  await sock.sendMessage(sender, { 
      image: { url: botImage },
      caption: menuText,
      contextInfo: {
          isForwarded: true,
          forwardingScore: 999,
          forwardedNewsletterMessageInfo: {
              newsletterJid: '120363144038483540@newsletter',
              newsletterName: `Runtime: ${uptime}`,
              serverMessageId: -1
          }
      } 
  });
}

module.exports = { showMenu };
