const fs = require('fs');
const path = './database/users.json';

// Cek apakah user ada di database
const checkAccess = (userId) => {
    try {
        const data = JSON.parse(fs.readFileSync(path));
        return data.includes(userId);
    } catch (e) {
        return false;
    }
};

// Tambah user ke database
const addAccess = (userId) => {
    try {
        const data = JSON.parse(fs.readFileSync(path));
        if (!data.includes(userId)) {
            data.push(userId);
            fs.writeFileSync(path, JSON.stringify(data, null, 2));
            return true;
        }
    } catch (e) {
        // Jika file error/kosong, buat baru
        fs.writeFileSync(path, JSON.stringify([userId], null, 2));
        return true;
    }
    return false;
};

// Hapus user dari database
const removeAccess = (userId) => {
    try {
        const data = JSON.parse(fs.readFileSync(path));
        const newData = data.filter(id => id !== userId);
        fs.writeFileSync(path, JSON.stringify(newData, null, 2));
        return true;
    } catch (e) {
        return false;
    }
};

module.exports = { checkAccess, addAccess, removeAccess };

