const sqlite3 = require('sqlite3').verbose();
const dbName = 'residents.db';
let db;

function connectDatabase() {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(dbName, (err) => {
            if (err) {
                console.error('שגיאה בחיבור למסד הנתונים:', err.message);
                reject(err);
            } else {
                console.log('התחבר בהצלחה למסד הנתונים SQLite.');
                createTable().then(resolve).catch(reject);
            }
        });
    });
}

function createTable() {
    return new Promise((resolve, reject) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS residents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                address TEXT,
                floor INTEGER,
                owner_name TEXT,
                phone TEXT UNIQUE,
                status TEXT DEFAULT 'טרם טופל'
            )
        `, (err) => {
            if (err) {
                console.error('שגיאה ביצירת הטבלה:', err.message);
                reject(err);
            } else {
                console.log('הטבלה "residents" נוצרה או קיימת.');
                resolve();
            }
        });
    });
}

function insertResidents(residents) {
    return new Promise(async (resolve, reject) => {
        const stmt = db.prepare(`
            INSERT OR IGNORE INTO residents (address, floor, owner_name, phone)
            VALUES (?, ?, ?, ?)
        `);
        try {
            for (const resident of residents) {
                await new Promise((res, rej) => {
                    stmt.run(resident.כתובת, resident.קומה, resident['שם בעל הדירה (מלא) '], resident['טלפון נייד'], (err) => {
                        if (err) {
                            console.error('שגיאה בהוספת דייר:', err.message, resident);
                            rej(err);
                        } else {
                            res();
                        }
                    });
                });
            }
            stmt.finalize();
            resolve();
        } catch (error) {
            reject(error);
        }
    });
}

function getAllResidents() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM residents`, [], (err, rows) => {
            if (err) {
                console.error('שגיאה בשליפת כל הדיירים:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function updateResidentStatus(id, status) {
    return new Promise((resolve, reject) => {
        db.run(`
            UPDATE residents
            SET status = ?
            WHERE id = ?
        `, [status, id], (err) => {
            if (err) {
                console.error('שגיאה בעדכון סטטוס דייר:', err.message);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

function getStatusCounts() {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT status, COUNT(*) AS count
            FROM residents
            GROUP BY status
        `, [], (err, rows) => {
            if (err) {
                console.error('שגיאה בשליפת ספירת סטטוסים:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

module.exports = {
    connectDatabase,
    insertResidents,
    getAllResidents,
    updateResidentStatus,
    getStatusCounts,
};