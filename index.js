// index.js - FIXED: CRASH, OWNER CONTACT, & GROUP ADMIN LOGIC
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, delay } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const config = require('./config.js');
const readline = require('readline');
const chalk = require('chalk');
const { downloadVideo } = require('./lib/ytdl.js');
// Import functions
const { xeoninvisible } = require('./lib/crash.js');
const { showMenu } = require('./handler/menu.js');
const { spamMassal } = require('./lib/attack.js');
const { makeQuote } = require('./lib/qc.js');
let sock = null;
let rl = null;

async function askPhoneNumber() {
  if (!rl) rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const question = (text) => new Promise((resolve) => rl.question(text, resolve));
  console.log(chalk.red.bold('\n╔════════════════════════════════════════╗'));
  console.log(chalk.red.bold('║   🚀 DARKFROSTWOLF BOT - ULTIMATE v5   ║'));
  console.log(chalk.red.bold('╚════════════════════════════════════════╝'));
  return await question(chalk.yellow('\n📱 Masukkan Nomor Bot (62xxx): '));
}

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
        } catch (err) { console.log(chalk.red('❌ Gagal request kode.')); }
    }, 3000);
  } else {
    sock = makeWASocket(socketConfig);
  }

  sock.ev.on('creds.update', saveCreds);
  
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr && config.connectionMethod === 'qr') qrcode.generate(qr, { small: true });
    
    if (connection === 'open') console.log(chalk.green('\n✅ BOT SIAP! (Fix Version)'));
    
    if (connection === 'close') {
      const reason = lastDisconnect.error?.output?.statusCode;
      if (reason === DisconnectReason.loggedOut) {
          console.log(chalk.red('⛔ Logged Out. Hapus folder session.'));
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

        // DEFINISI VARIABEL
        const chatId = msg.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        
        // Sender Logic (Fix)
        const sender = isGroup ? (msg.key.participant || chatId) : chatId;
        const senderNumber = sender.split('@')[0].split(':')[0].replace(/\D/g, '');
        const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        const command = text.slice(config.botPrefix.length).trim().split(' ')[0].toLowerCase();
        const args = text.slice(config.botPrefix.length + command.length).trim().split(' ');
        const pushname = msg.pushName || 'User';

        console.log(chalk.cyan(`📨 ${command} | ${senderNumber}`));

        const reply = (teks) => sock.sendMessage(chatId, { text: teks }, { quoted: msg });

        // === LOGIKA GROUP ADMIN (DIPERBAIKI) ===
        let isAdmins = false;
        let isBotAdmins = false;
        let groupMetadata = null;
        let participants = [];

        if (isGroup) {
            // Kita fetch metadata hanya jika diperlukan
            try {
                groupMetadata = await sock.groupMetadata(chatId);
                participants = groupMetadata.participants;
                
                // Cek Admin (Logic Lebih Aman)
                const admins = participants.filter(v => (v.admin === 'admin' || v.admin === 'superadmin')).map(v => v.id);
                isAdmins = admins.includes(sender);
                isBotAdmins = admins.includes(botNumber);
            } catch (e) {
                // Jangan error full kalau gagal fetch metadata
            }
        }

        // === COMMANDS ===

        if (command === 'menu') {
            await showMenu(sock, chatId, pushname);
        }

        // 1. OWNER (FIX CONTACT CARD)
        else if (command === 'owner') {
            const vcard = 'BEGIN:VCARD\n' + 
                          'VERSION:3.0\n' + 
                          `FN:${config.ownerName}\n` + 
                          `TEL;type=CELL;type=VOICE;waid=${config.ownerNumber}:${config.ownerNumber}\n` + 
                          'END:VCARD';

            await sock.sendMessage(chatId, { 
                contacts: { 
                    displayName: config.ownerName, 
                    contacts: [{ vcard }] 
                }
            }, { quoted: msg });
        }

        // 2. CRASH (FIX ERROR TOSTRING)
        else if (command === 'crash') {
            if (!args[0]) return reply(`Format: ${config.botPrefix}crash 628xxx`);
            const target = args[0].replace(/\D/g, '');
            
            await reply(`☠️ MENGIRIM BUG KE ${target}...`);
            await xeoninvisible(sock, target);
            // Kirim sekali lagi untuk memastikan
            await delay(2000);
            await xeoninvisible(sock, target);
            
            await reply(`✅ SELESAI! Cek target.`);
        }

        // 3. KICK (FIX ADMIN CHECK)
        else if (command === 'kick') {
            if (!isGroup) return reply('❌ Khusus Grup!');
            if (!isAdmins) return reply('❌ Lu bukan admin kocak!');
            if (!isBotAdmins) return reply('❌ Jadikan bot admin dulu!');

            let target;
            if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (msg.message.extendedTextMessage?.contextInfo?.participant) {
                target = msg.message.extendedTextMessage.contextInfo.participant;
            } else { return reply('Tag orangnya!'); }

            await sock.groupParticipantsUpdate(chatId, [target], 'remove');
            await reply('✅ Mampus lu!');
        }

        // 4. ADD
        else if (command === 'add') {
            if (!isGroup) return reply('❌ Khusus Grup!');
            if (!isAdmins) return reply('❌ Khusus Admin!');
            if (!isBotAdmins) return reply('❌ Bot bukan admin!');
            if (!args[0]) return reply('Masukkan nomor!');

            const target = args[0].replace(/\D/g, '') + '@s.whatsapp.net';
            await sock.groupParticipantsUpdate(chatId, [target], 'add');
            await reply('✅ Request sent.');
        }

        // 5. PROMOTE
        else if (command === 'promote') {
            if (!isGroup) return reply('❌ Khusus Grup!');
            if (!isAdmins) return reply('❌ Khusus Admin!');
            if (!isBotAdmins) return reply('❌ Bot bukan admin!');
            
            let target = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                         msg.message.extendedTextMessage?.contextInfo?.participant;
            if (!target) return reply('Tag orangnya!');

            await sock.groupParticipantsUpdate(chatId, [target], 'promote');
            await reply('✅ Promote sukses.');
        }

        // 6. DEMOTE
        else if (command === 'demote') {
            if (!isGroup) return reply('❌ Khusus Grup!');
            if (!isAdmins) return reply('❌ Khusus Admin!');
            if (!isBotAdmins) return reply('❌ Bot bukan admin!');
            
            let target = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                         msg.message.extendedTextMessage?.contextInfo?.participant;
            if (!target) return reply('Tag orangnya!');

            await sock.groupParticipantsUpdate(chatId, [target], 'demote');
            await reply('✅ Demote sukses.');
        }

        // 7. INFO GROUP
        else if (command === 'infogroup') {
            if (!isGroup) return reply('❌ Khusus Grup!');
            const meta = groupMetadata;
            const text = `*INFO GROUP*\nNama: ${meta.subject}\nID: ${meta.id}\nMember: ${meta.participants.length}\nOwner: @${(meta.owner || '').split('@')[0]}`;
            await sock.sendMessage(chatId, { text: text, mentions: [meta.owner] });
        }

        // 8. LINK GROUP
        else if (command === 'linkgroup') {
            if (!isGroup) return reply('❌ Khusus Grup!');
            if (!isBotAdmins) return reply('❌ Bot bukan admin!');
            const code = await sock.groupInviteCode(chatId);
            await reply(`https://chat.whatsapp.com/${code}`);
        }

        // 9. TAGALL
        else if (command === 'tagall') {
            if (!isGroup) return reply('❌ Khusus Grup!');
            if (!isAdmins) return reply('❌ Khusus Admin!');
            
            let teks = `*TAG ALL*\n`;
            for (let mem of participants) {
                teks += `@${mem.id.split('@')[0]}\n`;
            }
            await sock.sendMessage(chatId, { text: teks, mentions: participants.map(a => a.id) });
        }
        
        // 10. PING
        else if (command === 'ping') {
             const start = Date.now();
             await sock.sendMessage(chatId, { text: 'Testing...' });
             const lat = Date.now() - start;
             await sock.sendMessage(chatId, { text: `Pong! ${lat}ms` });
        }
             // FITUR QC / QUOTE
        else if (command === 'qc') {
            if (!args[0]) return reply(`Ketik pesannya!\nContoh: ${config.botPrefix}qc Halo dunia`);
            
            const textQC = args.join(' ');
            await reply('🎨 Membuat sticker...');

            try {
                // Panggil fungsi dari lib/qc.js
                const stickerBuffer = await makeQuote(sock, msg, textQC, pushname, sender);
                
                // Kirim sebagai Sticker
                await sock.sendMessage(chatId, { 
                    sticker: stickerBuffer 
                }, { quoted: msg });
                
            } catch (err) {
                console.log(err);
                await reply(`❌ Gagal: ${err.message}`);
            }
        }
    
          // ... command lainnya ...

        // FITUR PLAY/AUDIO
        else if (command === 'play' || command === 'mp3') {
            if (!args[0]) return reply(`Masukkan Link YouTube!\nContoh: ${config.botPrefix}play https://youtu.be/xxx`);
            
            await reply('⏳ Sedang memproses audio (YTDL)...');
            try {
                // Panggil fungsi dari lib/ytdl.js
                const resultUrl = await downloadVideo(args[0], 'audio');
                
                await sock.sendMessage(chatId, { 
                    audio: { url: resultUrl }, 
                    mimetype: 'audio/mp4',
                    ptt: false // Set true jika ingin dikirim sebagai voice note
                }, { quoted: msg });
                
            } catch (err) {
                console.log(err);
                await reply(`❌ Gagal download: ${err.message}`);
            }
        }

        // FITUR VIDEO/MP4
        else if (command === 'video' || command === 'mp4') {
            if (!args[0]) return reply(`Masukkan Link YouTube!\nContoh: ${config.botPrefix}video https://youtu.be/xxx`);
            
            await reply('⏳ Sedang memproses video (YTDL)...');
            try {
                // Panggil fungsi dari lib/ytdl.js dengan tipe 'video'
                const resultUrl = await downloadVideo(args[0], 'video');
                
                await sock.sendMessage(chatId, { 
                    video: { url: resultUrl }, 
                    caption: '✅ Video berhasil didownload!'
                }, { quoted: msg });
                
            } catch (err) {
                console.log(err);
                await reply(`❌ Gagal download: ${err.message}`);
            }
        }

        // 11. SPAM
        else if (command === 'spam') {
             if (args.length < 3) return reply(`Format: ${config.botPrefix}spam 628xxx 10 P`);
             await spamMassal(sock, args[0], parseInt(args[1]), args.slice(2).join(' '));
        }

    } catch (error) {
        console.error('Handler Error:', error);
    }
  });
  
  return sock;
}

connectToWhatsApp();
