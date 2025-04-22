async function uploadJson() {
    const fileInput = document.getElementById('jsonFile');
    const uploadMessage = document.getElementById('upload-message');
    const file = fileInput.files[0];

    if (!file) {
        uploadMessage.textContent = 'בבקשה בחר קובץ JSON.';
        return;
    }

    const formData = new FormData();
    formData.append('jsonFile', file);

    try {
        const response = await fetch('/upload-json', {
            method: 'POST',
            body: formData,
        });

        const text = await response.text();
        uploadMessage.textContent = text;
        fetchStatusCounts(); // רענון סטטיסטיקות לאחר העלאה
    } catch (error) {
        console.error('שגיאה בהעלאת הקובץ:', error);
        uploadMessage.textContent = 'שגיאה בהעלאת הקובץ.';
    }
}

async function fetchStatusCounts() {
    const statusCountsDiv = document.getElementById('status-counts');
    try {
        const response = await fetch('/status-counts');
        const counts = await response.json();

        let html = '<ul>';
        counts.forEach(item => {
            html += `<li>${item.status}: ${item.count}</li>`;
        });
        html += '</ul>';
        statusCountsDiv.innerHTML = html;
    } catch (error) {
        console.error('שגיאה בשליפת סטטיסטיקות:', error);
        statusCountsDiv.textContent = 'שגיאה בטעינת סטטיסטיקות.';
    }
}

async function deleteAllData() {
    if (confirm('האם אתה בטוח שברצונך למחוק את כל הנתונים? פעולה זו היא בלתי הפיכה!')) {
        try {
            const response = await fetch('/delete-all', {
                method: 'DELETE',
            });

            if (response.ok) {
                alert('כל הנתונים נמחקו בהצלחה.');
                fetchStatusCounts(); // רענון סטטיסטיקות
            } else {
                const text = await response.text();
                console.error('שגיאה במחיקת הנתונים:', text);
                alert('שגיאה במחיקת הנתונים.');
            }
        } catch (error) {
            console.error('שגיאה בשליחת בקשת המחיקה:', error);
            alert('שגיאה בשליחת בקשת המחיקה.');
        }
    }
}

async function downloadResidentsPdf() {
    const status = document.getElementById('status-select').value;
    const pdfMessage = document.getElementById('pdf-message');
    pdfMessage.textContent = 'מייצר PDF...';

    try {
        const response = await fetch(`/residents/pdf?status=${status}`);
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `residents_${status === 'all' ? 'all' : status}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            pdfMessage.textContent = 'הורדת PDF הסתיימה.';
        } else {
            const text = await response.text();
            console.error('שגיאה בהורדת ה-PDF:', text);
            pdfMessage.textContent = 'שגיאה בהורדת ה-PDF.';
        }
    } catch (error) {
        console.error('שגיאה בשליחת בקשת ה-PDF:', error);
        pdfMessage.textContent = 'שגיאה בהורדת ה-PDF.';
    }
}

// טעינת סטטיסטיקות בעת טעינת הדף
window.onload = fetchStatusCounts;