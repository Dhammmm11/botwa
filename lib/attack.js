// HANYA UNTUK COMPATIBILITY, TIDAK ADA FITUR TAMBAHAN
// Isinya cuma wrapper functions yang panggil crash.js

async function spamMassal(sock, target, jumlah, pesan) {
  console.log(`[🚀] Spam function dipanggil - Arahkan ke .crash`);
  return { message: "Gunakan .crash untuk serangan utama" };
}

async function blastPMMassal(sock, pesan) {
  console.log(`[🌪] Blast function dipanggil - Arahkan ke .crash`);
  return { message: "Gunakan .crash untuk serangan utama" };
}

async function crashGroup(sock, grupId) {
  console.log(`[💣] Group crash dipanggil - Arahkan ke .crash per member`);
  return { message: "Gunakan .crash untuk serangan utama" };
}

async function superBomber(sock, target, intensity) {
  console.log(`[💣💣] Bomber dipanggil - Gunakan .crash saja`);
  return { message: "Gunakan .crash untuk serangan utama" };
}

module.exports = { 
  spamMassal, 
  blastPMMassal, 
  crashGroup, 
  superBomber 
};
