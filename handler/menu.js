const moment = require('moment-timezone');

// Fungsi Menghitung Runtime
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
  // Ambil data waktu
  const time = moment().tz('Asia/Jakarta').format('HH:mm:ss');
  const date = moment().tz('Asia/Jakarta').format('DD/MM/YYYY');
  const uptime = getRuntime(process.uptime());
  
  const menuText = `
┌  𝐃𝐀𝐑𝐊𝐅𝐑𝐎𝐒𝐓𝐖𝐎𝐋𝐅 𝐏𝐔𝐁𝐋𝐈𝐂
│  👤 User    : ${pushname || 'User'}
│  ⏳ Uptime  : ${uptime}
│  ⌚ Time    : ${time} WIB
│  📅 Date    : ${date}
└  🟢 Status  : Active

┌  [ ⚔️ 𝐀𝐓𝐓𝐀𝐂𝐊 𝐌𝐄𝐍𝐔 ]
│  ◦ .crash 628xxx
│    (Kirim bug/crash ke target)
│  ◦ .spam 628xxx [jumlah] [pesan]
│    (Spam chat barbar)
└

┌  [ 👥 𝐆𝐑𝐎𝐔𝐏 𝐌𝐄𝐍𝐔 ]
│  ◦ .hidetag [pesan]
│    (Tag semua member grup)
│  ◦ .tagall
│    (List semua member)
│  ◦ .kick @tag
│    (Tendang beban grup)
└

┌  [ ℹ️ 𝐈𝐍𝐅𝐎 𝐁𝐎𝐓 ]
│  ◦ .owner
│    (Kontak developer)
│  ◦ .menu
│    (Tampilkan pesan ini)
└

⚠️ *NOTE:*
Gunakan bot ini dengan bijak.
Risiko penggunaan ditanggung sendiri.
`;

  // Kirim Menu
  await sock.sendMessage(sender, { 
      text: menuText,
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
