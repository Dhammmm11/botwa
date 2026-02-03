const moment = require('moment-timezone');

async function showMenu(sock, sender, pushname) {
  // Ambil waktu server
  const time = moment().tz('Asia/Jakarta').format('HH:mm:ss');
  const date = moment().tz('Asia/Jakarta').format('DD/MM/YYYY');
  
  const menuText = `
┌  𝐃𝐀𝐑𝐊𝐅𝐑𝐎𝐒𝐓𝐖𝐎𝐋𝐅 𝐂𝐎𝐍𝐓𝐑𝐎𝐋
│  User    : ${pushname || 'Unknown'}
│  Time    : ${time} WIB
│  Date    : ${date}
└  Status  : 🟢 Online (Secure)

┌  [ 🔐 𝐎𝐖𝐍𝐄𝐑 & 𝐃𝐀𝐓𝐀𝐁𝐀𝐒𝐄 ]
│  ◦ .acces 628xxx
│    (Izinkan user menggunakan bot)
│  ◦ .acces @tag
│    (Izinkan user via reply/tag)
│  ◦ .delacces 628xxx
│    (Hapus akses user)
│  ◦ .owner
│    (Kontak pemilik bot)
└

┌  [ ⚔️ 𝐀𝐓𝐓𝐀𝐂𝐊 𝐒𝐔𝐈𝐓𝐄 ]
│  ◦ .crash 628xxx [jumlah]
│    (Kirim serangan invisible)
│  ◦ .spam 628xxx [jumlah] [pesan]
│    (Spam pesan massal)
│  ◦ .blast [pesan]
│    (Kirim pesan ke semua kontak chat)
└

┌  [ 👥 𝐆𝐑𝐎𝐔𝐏 𝐌𝐀𝐍𝐀𝐆𝐄𝐑 ]
│  ◦ .kick @tag
│    (Keluarkan member)
│  ◦ .hidetag [pesan]
│    (Tag semua member secara hidden)
│  ◦ .tagall
│    (Tag semua member visible)
│  ◦ .group open/close
│    (Buka/tutup grup)
└

┌  [ ⚙️ 𝐒𝐘𝐒𝐓𝐄𝐌 ]
│  ◦ .menu
│  ◦ .ping
└

⚠️ *SYSTEM NOTE:*
Gunakan fitur attack dengan bijak. 
Bot dilindungi sistem whitelist database.
`;

  // Kirim dengan sedikit variasi agar terlihat seperti reply
  await sock.sendMessage(sender, { 
      text: menuText,
      contextInfo: {
          isForwarded: true,
          forwardingScore: 999,
          forwardedNewsletterMessageInfo: {
              newsletterJid: '120363144038483540@newsletter',
              newsletterName: 'DarkFrostwolf System',
              serverMessageId: -1
          }
      } 
  });
}

module.exports = { showMenu };
