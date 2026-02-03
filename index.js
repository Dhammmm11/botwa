// index.js - FINAL FIX: GROUP COMMANDS, PING LATENCY, & CRASH HANDLING
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, delay } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const fs = require('fs');
const config = require('./config.js');
const readline = require('readline');
const chalk = require('chalk');
const moment = require('moment-timezone');

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
  console.log(chalk.red.bold('║   🚀 DARKFROSTWOLF BOT - ULTIMATE v4   ║'));
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
      console.log(chalk.green('\n✅ BOT SIAP! Semua fitur aktif.'));
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

        const text = msg.message.conversation || 
                     msg.message.extendedTextMessage?.text || 
                     msg.message.imageMessage?.caption || '';
        
        if (!text.startsWith(config.botPrefix)) return;

        // DEFINISI VARIABEL PENTING
        const chatId = msg.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        const sender = isGroup ? (msg.key.participant || chatId) : chatId;
        const senderNumber = sender.split('@')[0].split(':')[0].replace(/\D/g, '');
        
        const command = text.slice(config.botPrefix.length).trim().split(' ')[0].toLowerCase();
        const args = text.slice(config.botPrefix.length + command.length).trim().split(' ');
        const pushname = msg.pushName || 'User';
        const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        // LOG
        console.log(chalk.cyan(`📨 ${command} | ${senderNumber} | ${isGroup ? 'Group' : 'PC'}`));

        // === FUNGSI BANTUAN ===
        const reply = (teks) => sock.sendMessage(chatId, { text: teks }, { quoted: msg });

        // CEK ADMIN (Hanya dipanggil jika command grup)
        let isAdmins = false;
        let isBotAdmins = false;
        let groupMetadata = null;

        if (isGroup) {
            // Kita fetch metadata hanya jika command membutuhkannya
            if (['kick', 'add', 'promote', 'demote', 'linkgroup', 'tagall', 'hidetag', 'infogrup', 'infogroup'].includes(command)) {
                try {
                    groupMetadata = await sock.groupMetadata(chatId);
                    const participants = groupMetadata.participants;
                    const admins = participants.filter(v => v.admin !== null).map(v => v.id);
                    isAdmins = admins.includes(sender);
                    isBotAdmins = admins.includes(botNumber);
                } catch (e) { console.log('Gagal fetch admin') }
            }
        }

        // === COMMANDS ===

        // 1. PING (REAL LATENCY)
        if (command === 'ping') {
            const start = Date.now();
            await sock.sendMessage(chatId, { text: '🏓 Testing...' });
            const lat = Date.now() - start;
            await sock.sendMessage(chatId, { text: `🚀 Speed: ${lat}ms` });
        }

        // 2. CRASH (FIXED)
        else if (command === 'crash') {
            if (!args[0]) return reply(`Format: ${config.botPrefix}crash 628xxx`);
            const target = args[0].replace(/\D/g, '');
            
            await reply(`☠️ MENGIRIM BUG KE ${target}...`);

            // Paksa tanpa try-catch berlebihan di sini, handle di lib
            const repeat = 3;
            for (let i = 0; i < repeat; i++) {
                await xeoninvisible(sock, target);
                console.log(chalk.red(`[💥] Hit ${i+1}/${repeat}`));
                await delay(2000);
            }
            await reply(`✅ SELESAI! Target ${target} down.`);
        }

        // === FITUR GRUP ===

        // 3. TAG ALL (VISIBLE MENTION)
        else if (command === 'tagall') {
            if (!isGroup) return reply('❌ Khusus Grup!');
            if (!isAdmins) return reply('❌ Khusus Admin!');
            
            let teks = `*👥 TAG ALL MEMBER*\n*Group:* ${groupMetadata.subject}\n\n`;
            for (let mem of groupMetadata.participants) {
                teks += `┣ ➥ @${mem.id.split('@')[0]}\n`;
            }
            
            await sock.sendMessage(chatId, { 
                text: teks, 
                mentions: groupMetadata.participants.map(a => a.id) 
            });
        }

        // 4. HIDE TAG (HIDDEN MENTION)
        else if (command === 'hidetag') {
            if (!isGroup) return reply('❌ Khusus Grup!');
            if (!isAdmins) return reply('❌ Khusus Admin!');
            
            const teks = args.join(' ') || 'Halo semua!';
            await sock.sendMessage(chatId, { 
                text: teks, 
                mentions: groupMetadata.participants.map(a => a.id) 
            });
        }

        // 5. INFO GROUP
        else if (command === 'infogroup' || command === 'infogrup') {
            if (!isGroup) return reply('❌ Khusus Grup!');
            
            const textInfo = `
📋 *INFO GROUP*

🏷️ *Nama:* ${groupMetadata.subject}
🆔 *ID:* ${groupMetadata.id}
👑 *Owner:* @${(groupMetadata.owner || '').split('@')[0]}
👥 *Member:* ${groupMetadata.participants.length}
📝 *Deskripsi:* ${groupMetadata.desc?.toString() || '-'}
`;
            await sock.sendMessage(chatId, { 
                text: textInfo, 
                mentions: [groupMetadata.owner].filter(v => v) 
            });
        }

        // 6. LINK GROUP
        else if (command === 'linkgroup') {
            if (!isGroup) return reply('❌ Khusus Grup!');
            if (!isBotAdmins) return reply('❌ Bot harus jadi Admin dulu!');
            
            const code = await sock.groupInviteCode(chatId);
            await reply(`https://chat.whatsapp.com/${code}`);
        }

        // 7. KICK
        else if (command === 'kick') {
            if (!isGroup) return reply('❌ Khusus Grup!');
            if (!isAdmins) return reply('❌ Khusus Admin!');
            if (!isBotAdmins) return reply('❌ Bot harus jadi Admin!');

            let target;
            if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (msg.message.extendedTextMessage?.contextInfo?.participant) {
                target = msg.message.extendedTextMessage.contextInfo.participant;
            } else {
                return reply('Tag orang yang mau dikick!');
            }

            await sock.groupParticipantsUpdate(chatId, [target], 'remove');
            await reply('✅ Berhasil kick!');
        }

        // 8. ADD
        else if (command === 'add') {
            if (!isGroup) return reply('❌ Khusus Grup!');
            if (!isAdmins) return reply('❌ Khusus Admin!');
            if (!isBotAdmins) return reply('❌ Bot harus jadi Admin!');
            if (!args[0]) return reply('Masukkan nomor! Contoh: .add 628xxx');

            const target = args[0].replace(/\D/g, '') + '@s.whatsapp.net';
            await sock.groupParticipantsUpdate(chatId, [target], 'add');
            await reply('✅ Request add dikirim!');
        }

        // 9. PROMOTE
        else if (command === 'promote') {
            if (!isGroup) return reply('❌ Khusus Grup!');
            if (!isAdmins) return reply('❌ Khusus Admin!');
            if (!isBotAdmins) return reply('❌ Bot harus jadi Admin!');
            
            let target;
            if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (msg.message.extendedTextMessage?.contextInfo?.participant) {
                target = msg.message.extendedTextMessage.contextInfo.participant;
            } else { return reply('Tag orangnya!'); }

            await sock.groupParticipantsUpdate(chatId, [target], 'promote');
            await reply('✅ Berhasil promote jadi admin!');
        }

        // 10. DEMOTE
        else if (command === 'demote') {
            if (!isGroup) return reply('❌ Khusus Grup!');
            if (!isAdmins) return reply('❌ Khusus Admin!');
            if (!isBotAdmins) return reply('❌ Bot harus jadi Admin!');
            
            let target;
            if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (msg.message.extendedTextMessage?.contextInfo?.participant) {
                target = msg.message.extendedTextMessage.contextInfo.participant;
            } else { return reply('Tag orangnya!'); }

            await sock.groupParticipantsUpdate(chatId, [target], 'demote');
            await reply('✅ Berhasil demote member!');
        }

        // 11. MENU & OWNER
        else if (command === 'menu') {
            await showMenu(sock, chatId, pushname);
        }
        else if (command === 'owner') {
             await sock.sendMessage(chatId, { text: `Nih nomor owner gw: wa.me/${config.ownerNumber}` });
        }

    } catch (error) {
        console.error('Handler Error:', error);
    }
  });
  
  return sock;
}

// Start bot
connectToWhatsApp();
