const Database = require('better-sqlite3');
const path = require('path');


const db = new Database(path.join(__dirname, 'cotizador.sqlite'));


const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        try {
            const stmt = db.prepare(sql);
            const rows = stmt.all(params);
            resolve(rows);
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { query };