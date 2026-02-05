const moment = require('moment-timezone');

const getRuntime = (seconds) => {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600 * 24));
    var h = Math.floor(seconds % (3600 * 24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
};

async function showMenu(sock, sender, pushname) {
  const time = moment().tz('Asia/Jakarta').format('HH:mm:ss');
  const date = moment().tz('Asia/Jakarta').format('DD/MM/YYYY');
  const uptime = getRuntime(process.uptime());
  
  const botImage = 'https://files.catbox.moe/vpi2ef.jpg'; 
  
  const menuText = `
┌  𝐃𝐀𝐑𝐊𝐅𝐑𝐎𝐒𝐓𝐖𝐎𝐋𝐅 𝐔𝐋𝐓𝐈𝐌𝐀𝐓𝐄
│  👤 User    : ${pushname || 'User'}
│  ⏳ Uptime  : ${uptime}
│  ⌚ Time    : ${time} WIB
│  📅 Date    : ${date}
└  🟢 Status  : Active

┌  [ ⚔️ 𝐀𝐓𝐓𝐀𝐂𝐊 𝐌𝐄𝐍𝐔 ]
│  ◦ .crashpair 628xxx  🔥 (NEW)
│    (Crash via Pairing Code)
│  ◦ .crash 628xxx
│    (Crash via Bug Message)
│  ◦ .spam 628xxx [jumlah] [pesan]
│  ◦ .crashinvis 628xxx
└

┌  [ 🎥 𝐌𝐄𝐃𝐈𝐀 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 ]
│  ◦ .play [judul/link]
│    (Download Audio - Fix)
│  ◦ .video [judul/link]
│    (Download Video - Fix)
│  ◦ .qc [teks]
│    (Sticker Quote)
└

┌  [ 👥 𝐆𝐑𝐎𝐔𝐏 𝐀𝐃𝐌𝐈𝐍 ]
│  ◦ .kick .add .promote .demote
│  ◦ .linkgroup .infogroup
│  ◦ .hidetag .tagall
└

┌  [ ℹ️ 𝐈𝐍𝐅𝐎 ]
│  ◦ .owner .menu .ping
└
`;

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
