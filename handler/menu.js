async function showMenu(sock, sender, pushname) {
  const menuText = `
╔═══════════════════════════════
║  *🔥 DARKFROSTWOLF BOT v666 🔥*
╠═══════════════════════════════
║  👋 Hai, ${pushname || 'User'}!
║  ⚡ Version: 666.0.0
║  🚀 Prefix: .
║  💀 Mode: XEON CRASH ULTIMATE
╠═══════════════════════════════
║  *💀💀💀 XEON CRASH COMMAND 💀💀💀*
╠═══════════════════════════════
║  *.crash 628xxxxxxx*
║  ↳ XEON INVISIBLE CRASH
║  ↳ Target WhatsApp akan freeze/crash
║  ↳ Payment request overload
║  ↳ Work 100% tested
╠═══════════════════════════════
║  *👥 GROUP COMMANDS*
╠═══════════════════════════════
║  *.kick @tag* - Kick member
║  *.add 628xxxx* - Add member
║  *.promote @tag* - Promote admin
║  *.demote @tag* - Demote admin
║  *.tagall* - Tag semua member
║  *.linkgroup* - Dapatkan link
║  *.infogrup* - Info grup
╠═══════════════════════════════
║  *📱 GENERAL*
╠═══════════════════════════════
║  *.menu* - Menu ini
║  *.ping* - Cek kecepatan
║  *.owner* - Info owner
╠═══════════════════════════════
║  *⚠️ PERHATIAN EXTREME*
║  Bot untuk testing XEON bug!
║  Resiko tanggung sendiri 100%!
║  WhatsApp target bisa corrupt!
╚═══════════════════════════════
`;

  await sock.sendMessage(sender, { text: menuText });
}

module.exports = { showMenu };
