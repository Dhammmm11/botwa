const fs = require('fs');
const path = './database/users.json';

// Pastikan file ada
if (!fs.existsSync(path)) {
    fs.writeFileSync(path, JSON.stringify([]));
}

const checkAccess = (userId) => {
    try {
        const raw = fs.readFileSync(path);
        const data = JSON.parse(raw);
        // Paksa convert ke String agar pencocokan akurat
        return data.map(id => String(id)).includes(String(userId));
    } catch (e) {
        return false;
    }
};

const addAccess = (userId) => {
    try {
        const data = JSON.parse(fs.readFileSync(path));
        const cleanId = String(userId); // Pastikan string
        if (!data.includes(cleanId)) {
            data.push(cleanId);
            fs.writeFileSync(path, JSON.stringify(data, null, 2));
            return true;
        }
    } catch (e) {
        fs.writeFileSync(path, JSON.stringify([String(userId)], null, 2));
        return true;
    }
    return false;
};

const removeAccess = (userId) => {
    try {
        const data = JSON.parse(fs.readFileSync(path));
        const newData = data.filter(id => String(id) !== String(userId));
        fs.writeFileSync(path, JSON.stringify(newData, null, 2));
        return true;
    } catch (e) {
        return false;
    }
};

module.exports = { checkAccess, addAccess, removeAccess };
