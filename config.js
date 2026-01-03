/*
 * CODINGX INDONET - Configuration Center
 * File ini untuk mengatur nama, session, dan settings dasar.
 */

const fs = require('fs');

module.exports = {
    // Nama Session (Folder penyimpanan login)
    sessionName: 'session_codingx', 
    
    // Informasi Bot & Owner
    botName: 'CodingX AI',
    ownerName: 'Tuan Besar',
    ownerNumber: '628xxxxxxxxxx', // Ganti dengan nomor Tuan (format 628...)

    // Konfigurasi Fitur
    autoRead: true, // Otomatis baca pesan (true/false)
    mode: 'public', // 'public' (semua bisa pakai) atau 'self' (hanya owner)

    // Pesan-pesan Sistem
    mess: {
        wait: '⏳ Sedang diproses, mohon tunggu Tuan...',
        success: '✅ Berhasil dilaksanakan!',
        error: '❌ Maaf, terjadi kesalahan sistem.',
        groupOnly: '⚠️ Fitur ini khusus untuk di dalam Grup!',
        adminOnly: '⚠️ Hanya Admin Grup yang boleh memerintah ini!',
        privateOnly: '⚠️ Gunakan fitur ini di Private Chat saja.'
    }
};

// Auto reload config jika file diedit
let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(`\n🚨 Config telah diupdate!`)
    delete require.cache[file]
    require(file)
})
