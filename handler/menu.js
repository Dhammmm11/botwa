// handler/menu.js
async function showMenu(sock, sender, pushname) {
  const menuText = `
╔═══════════════════════
║  *🔥 DARKFROSTWOLF BOT 🔥*
╠═══════════════════════
║  👋 Hai, ${pushname || 'User'}!
║  ⚡ Version: 1.0.0
║  🚀 Prefix: .
╠═══════════════════════
║  *💀 CRASH COMMAND*
╠═══════════════════════
║  *.crash 628xxxxxxx*
║  ↳ Crash WhatsApp target
╠═══════════════════════
║  *👥 GROUP COMMANDS*
╠═══════════════════════
║  *.kick @tag* - Kick member
║  *.add 628xxxx* - Add member
║  *.promote @tag* - Promote admin
║  *.demote @tag* - Demote admin
║  *.tagall* - Tag semua member
║  *.linkgroup* - Dapatkan link
║  *.infogrup* - Info grup
╠═══════════════════════
║  *📱 GENERAL*
╠═══════════════════════
║  *.menu* - Menu ini
║  *.ping* - Cek kecepatan
║  *.owner* - Info owner
╠═══════════════════════
║  *⚠️ PERHATIAN*
║  Bot untuk edukasi!
║  Resiko tanggung sendiri!
╚═══════════════════════
`;

  await sock.sendMessage(sender, { text: menuText });
}

module.exports = { showMenu };
