/*
 * CODINGX INDONET - AI Personal Assistant v2.0
 * Features: Pairing/QR + Config + Welcome + GroupInfo
 * Author: CodingX Indonet
 */

require('./config'); // Load Config
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore, 
    PHONENUMBER_MCC,
    delay,
    jidDecode
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const readline = require('readline');
const qrcode = require('qrcode-terminal');
const config = require('./config'); // Panggil config

// Interface Input
const question = (text) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => { rl.question(text, (answer) => { rl.close(); resolve(answer); }); });
};

async function startCodingX() {
    const { state, saveCreds } = await useMultiFileAuthState(config.sessionName);
    const { version } = await fetchLatestBaileysVersion();
    
    console.log(`\n💼 ${config.botName} Started... v${version.join('.')}`);

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
        },
        browser: ['CodingX Indonet', 'Chrome', '1.0.0'],
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
    });

    // --- PAIRING / QR LOGIC ---
    if (!sock.authState.creds.registered) {
        console.log(`\n=== LOGIN: ${config.botName} ===`);
        console.log("1. QR Code");
        console.log("2. Pairing Code");
        const selection = await question("Pilih metode (1/2): ");

        if (selection === '2') {
            let phoneNumber = await question("Masukkan Nomor HP (628xxx): ");
            phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
            if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumber.startsWith(v))) {
                console.log("⚠️ Harus diawali kode negara (628...)");
            }
            setTimeout(async () => {
                let code = await sock.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\n💰 KODE PAIRING: \x1b[32m${code}\x1b[0m\n`);
            }, 3000);
        } else {
            console.log("Scan QR Code di bawah...");
        }
    }

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) qrcode.generate(qr, { small: true });

        if (connection === 'close') {
            let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            if (reason === DisconnectReason.badSession) { console.log(`Bad Session.`); process.exit(); }
            else if (reason === DisconnectReason.connectionClosed) { startCodingX(); }
            else if (reason === DisconnectReason.connectionLost) { startCodingX(); }
            else if (reason === DisconnectReason.restartRequired) { startCodingX(); }
            else if (reason === DisconnectReason.timedOut) { startCodingX(); }
            else { startCodingX(); }
        } else if (connection === 'open') {
            console.log(`✅ ${config.botName} Siap Melayani Tuan Besar!`);
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // ============================================================
    // 🔥 FITUR WELCOME & GOODBYE (Member Join/Leave)
    // ============================================================
    sock.ev.on('group-participants.update', async (anu) => {
        try {
            // anu.id = ID Grup
            // anu.participants = Array ID user yang join/keluar
            // anu.action = 'add' (join) atau 'remove' (keluar)
            
            const metadata = await sock.groupMetadata(anu.id);
            const participants = anu.participants;

            for (let num of participants) {
                // Get Profile Picture User (kalau error pakai default)
                let ppuser;
                try { 
                    ppuser = await sock.profilePictureUrl(num, 'image');
                } catch { 
                    ppuser = 'https://telegra.ph/file/0a0209da029671d24c038.jpg'; // Gambar default
                }

                if (anu.action == 'add') {
                    const welcomeText = `Halo @${num.split('@')[0]} 👋\n\nSelamat datang di grup *${metadata.subject}*!\n\nJangan lupa baca deskripsi grup ya. Semoga betah! 💼`;
                    
                    await sock.sendMessage(anu.id, { 
                        image: { url: ppuser }, 
                        caption: welcomeText, 
                        mentions: [num] 
                    });
                } 
                else if (anu.action == 'remove') {
                    const goodbyeText = `Sayonara @${num.split('@')[0]} 👋\n\nTerima kasih sudah mampir di *${metadata.subject}*.`;
                    
                    await sock.sendMessage(anu.id, { 
                        text: goodbyeText, 
                        mentions: [num] 
                    });
                }
            }
        } catch (err) {
            console.log("Error di fitur Welcome:", err);
        }
    });

    // ============================================================
    // 📩 MESSAGE HANDLER
    // ============================================================
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        try {
            if (type !== 'notify') return;
            const m = messages[0];
            if (!m.message) return;

            const messageType = Object.keys(m.message)[0];
            const body = (messageType === 'conversation') ? m.message.conversation :
                         (messageType === 'imageMessage') ? m.message.imageMessage.caption :
                         (messageType === 'extendedTextMessage') ? m.message.extendedTextMessage.text : '';

            const from = m.key.remoteJid;
            const isGroup = from.endsWith('@g.us');
            const prefix = '.';
            const isCmd = body.startsWith(prefix);
            const command = isCmd ? body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : '';
            const args = body.trim().split(/ +/).slice(1);
            const text = args.join(" ");

            if (config.autoRead) await sock.readMessages([m.key]);

            if (isCmd) {
                switch (command) {
                    case 'menu':
                    case 'help':
                        const menuText = `
💼 *CODINGX DASHBOARD* 💼

👋 Halo Tuan! Berikut fitur yang tersedia:

*Group Menu:*
• ${prefix}tagall (Tag semua member)
• ${prefix}hidetag (Tag tersembunyi)
• ${prefix}infogroup (Cek detail grup)

*Bot Info:*
• ${prefix}ping (Cek kecepatan)
• ${prefix}owner (Kontak Tuan Besar)

_Powered by CodingX Indonet_
                        `;
                        // Kirim gambar + text menu (Bisa diganti url gambar bot Tuan)
                        await sock.sendMessage(from, { 
                            image: { url: "https://telegra.ph/file/0a0209da029671d24c038.jpg" }, 
                            caption: menuText 
                        }, { quoted: m });
                        break;

                    case 'owner':
                         // Mengirim kontak owner (vcard)
                         const vcard = 'BEGIN:VCARD\n' +
                                       'VERSION:3.0\n' + 
                                       `FN:${config.ownerName}\n` + // Nama Owner
                                       `TEL;type=CELL;type=VOICE;waid=${config.ownerNumber}:${config.ownerNumber}\n` + 
                                       'END:VCARD';
                         await sock.sendMessage(from, { 
                            contacts: { displayName: config.ownerName, contacts: [{ vcard }] }
                         }, { quoted: m });
                         break;

                    case 'infogrup':
                    case 'groupinfo':
                        if (!isGroup) return sock.sendMessage(from, { text: config.mess.groupOnly }, { quoted: m });
                        
                        const groupMetadata = await sock.groupMetadata(from);
                        const groupOwner = groupMetadata.owner || m.sender;
                        const participants = groupMetadata.participants;
                        const admins = participants.filter(v => v.admin !== null).map(v => v.id);
                        
                        let infoText = `📊 *INFO GRUP CODINGX* 📊\n\n`;
                        infoText += `🏷️ *Nama:* ${groupMetadata.subject}\n`;
                        infoText += `🆔 *ID:* ${groupMetadata.id}\n`;
                        infoText += `👑 *Owner:* @${groupOwner.split('@')[0]}\n`;
                        infoText += `👥 *Member:* ${participants.length} Orang\n`;
                        infoText += `👮 *Admin:* ${admins.length} Orang\n`;
                        infoText += `📝 *Deskripsi:*\n${groupMetadata.desc?.toString() || 'Tidak ada deskripsi'}\n`;

                        await sock.sendMessage(from, { 
                            image: { url: await sock.profilePictureUrl(from, 'image').catch(_ => 'https://telegra.ph/file/0a0209da029671d24c038.jpg') },
                            caption: infoText,
                            mentions: [groupOwner]
                        }, { quoted: m });
                        break;

                    case 'ping':
                        await sock.sendMessage(from, { text: `Pong! ⚡` }, { quoted: m });
                        break;

                    case 'hidetag':
                        if (!isGroup) return sock.sendMessage(from, { text: config.mess.groupOnly }, { quoted: m });
                        // Cek apakah pengirim adalah admin (Opsional, saat ini dibuka untuk semua)
                        const mems = await sock.groupMetadata(from);
                        await sock.sendMessage(from, { text: text ? text : 'Hidetag!', mentions: mems.participants.map(a => a.id) });
                        break;

                    case 'tagall':
                        if (!isGroup) return sock.sendMessage(from, { text: config.mess.groupOnly }, { quoted: m });
                        const data = await sock.groupMetadata(from);
                        let teks = `💼 *TAG ALL MEMBER* 💼\n\n${text ? 'Pesan: ' + text : ''}\n\n`;
                        for (let mem of data.participants) {
                            teks += `➡️ @${mem.id.split('@')[0]}\n`;
                        }
                        await sock.sendMessage(from, { text: teks, mentions: data.participants.map(a => a.id) }, { quoted: m });
                        break;
                }
            } else {
                // Auto Reply Sederhana (Bisa dikembangkan ke AI)
                if (body.toLowerCase() === 'halo') {
                    await sock.sendMessage(from, { text: `Halo juga Tuan! Ketik .menu untuk melihat fitur.` }, { quoted: m });
                }
            }

        } catch (error) {
            console.log(error);
        }
    });
}

startCodingX();
