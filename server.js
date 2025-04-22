const express = require('express');
const multer = require('multer');
const database = require('./database');
const pdfMake = require('pdfmake/build/pdfmake');
const pdfFonts = require('pdfmake/build/vfs_fonts');
pdfMake.vfs = pdfFonts.pdfMake.vfs; // תקן את הגישה ל-vfs

const app = express();
const port = 3344;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // תיקייה עבור קבצי HTML, CSS, JS בצד לקוח

// אתחול מסד הנתונים
database.connectDatabase().catch(err => console.error('כשל בהפעלת מסד הנתונים:', err));

// הגדרת multer לטיפול בהעלאת קבצים
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// נקודת קצה להעלאת קובץ JSON ועיבודו
app.post('/upload-json', upload.single('jsonFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('לא נשלח קובץ.');
    }

    try {
        const residents = JSON.parse(req.file.buffer.toString());
        await database.insertResidents(residents);
        res.send('הנתונים מה-JSON נקלטו בהצלחה למסד הנתונים.');
    } catch (error) {
        console.error('שגיאה בעיבוד קובץ ה-JSON:', error);
        res.status(500).send('שגיאה בעיבוד קובץ ה-JSON.');
    }
});

// נקודת קצה לקבלת כל הדיירים
app.get('/residents', async (req, res) => {
    try {
        const residents = await database.getAllResidents();
        res.json(residents);
    } catch (error) {
        console.error('שגיאה בשליפת הדיירים:', error);
        res.status(500).send('שגיאה בשליפת הדיירים.');
    }
});

// נקודת קצה לעדכון סטטוס של דייר
app.post('/residents/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['חתם', 'לא חתם', 'לא ענה לטלפון', 'סרבן'].includes(status)) {
        return res.status(400).send('סטטוס לא חוקי.');
    }

    try {
        await database.updateResidentStatus(id, status);
        res.send('הסטטוס עודכן בהצלחה.');
    } catch (error) {
        console.error('שגיאה בעדכון הסטטוס:', error);
        res.status(500).send('שגיאה בעדכון הסטטוס.');
    }
});

// נקודת קצה לקבלת ספירת סטטוסים
app.get('/status-counts', async (req, res) => {
    try {
        const counts = await database.getStatusCounts();
        res.json(counts);
    } catch (error) {
        console.error('שגיאה בשליפת ספירת סטטוסים:', error);
        res.status(500).send('שגיאה בשליפת הסטטוסים.');
    }
});

// נקודת קצה למחיקת כל הנתונים
app.delete('/delete-all', async (req, res) => {
    try {
        await new Promise((resolve, reject) => {
            database.db.run(`DELETE FROM residents`, (err) => {
                if (err) {
                    console.error('שגיאה במחיקת כל הנתונים:', err.message);
                    reject(err);
                } else {
                    console.log('כל הנתונים נמחקו בהצלחה.');
                    resolve();
                }
            });
        });
        res.send('כל הנתונים נמחקו בהצלחה.');
    } catch (error) {
        console.error('שגיאה במחיקת כל הנתונים:', error);
        res.status(500).send('שגיאה במחיקת כל הנתונים.');
    }
});

// נקודת קצה ליצירת והורדת PDF של דיירים לפי סטטוס
app.get('/residents/pdf', async (req, res) => {
    const statusFilter = req.query.status;
    let residents;

    try {
        if (statusFilter === 'all') {
            residents = await database.getAllResidents();
        } else {
            residents = await new Promise((resolve, reject) => {
                database.db.all(`SELECT * FROM residents WHERE status = ?`, [statusFilter], (err, rows) => {
                    if (err) {
                        console.error(`שגיאה בשליפת דיירים עם סטטוס ${statusFilter}:`, err.message);
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
        }

        if (!residents || residents.length === 0) {
            return res.status(404).send('לא נמצאו דיירים עם סטטוס זה.');
        }

        const documentDefinition = {
            content: [
                { text: `רשימת דיירים לפי סטטוס: ${statusFilter === 'all' ? 'הכל' : statusFilter}`, style: 'header' },
                {
                    style: 'tableExample',
                    table: {
                        body: [
                            [ 'ID', 'כתובת', 'קומה', 'שם', 'טלפון', 'סטטוס' ],
                            ...residents.map(r => [r.id, r.address, r.floor, r.owner_name, r.phone, r.status])
                        ]
                    }
                }
            ],
            styles: {
                header: {
                    fontSize: 18,
                    bold: true,
                    margin: [0, 0, 0, 10]
                },
                tableExample: {
                    margin: [0, 5, 0, 15]
                },
                tableHeader: {
                    bold: true,
                    fontSize: 12,
                    color: 'black'
                }
            },
            defaultStyle: {
                fontSize: 10
            }
        };

        const pdfDoc = pdfMake.createPdfKitDocument(documentDefinition);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="residents_${statusFilter === 'all' ? 'all' : status}.pdf"`);
        pdfDoc.pipe(res);
        pdfDoc.end();

    } catch (error) {
        console.error('שגיאה ביצירת ה-PDF:', error);
        res.status(500).send('שגיאה ביצירת ה-PDF.');
    }
});

app.listen(port, () => {
    console.log(`השרת רץ בפורט ${port}`);
});
