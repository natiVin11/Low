async function fetchResidents() {
    const tableBody = document.querySelector('#residents-table tbody');
    tableBody.innerHTML = '<tr><td colspan="7">טוען דיירים...</td></tr>';

    try {
        const response = await fetch('/residents');
        const residents = await response.json();

        tableBody.innerHTML = '';
        residents.forEach(resident => {
            const row = tableBody.insertRow();
            row.insertCell().innerHTML = `
                <select id="status-${resident.id}">
                    <option value="טרם טופל"${resident.status === 'טרם טופל' ? ' selected' : ''}>טרם טופל</option>
                    <option value="חתם"${resident.status === 'חתם' ? ' selected' : ''}>חתם</option>
                    <option value="לא חתם"${resident.status === 'לא חתם' ? ' selected' : ''}>לא חתם</option>
                    <option value="לא ענה לטלפון"${resident.status === 'לא ענה לטלפון' ? ' selected' : ''}>לא ענה לטלפון</option>
                    <option value="סרבן"${resident.status === 'סרבן' ? ' selected' : ''}>סרבן</option>
                </select>
                <button onclick="updateStatus(${resident.id})">עדכן</button>
            `;
            row.insertCell().textContent = resident.status;
            row.insertCell().textContent = resident.phone;
            row.insertCell().textContent = resident.owner_name;
            row.insertCell().textContent = resident.floor;
            row.insertCell().textContent = resident.address;
            row.insertCell().textContent = resident.id;
        });
    } catch (error) {
        console.error('שגיאה בשליפת הדיירים:', error);
        tableBody.innerHTML = '<tr><td colspan="7">שגיאה בטעינת הדיירים.</td></tr>';
    }
}

async function updateStatus(id) {
    const statusSelect = document.getElementById(`status-${id}`);
    const newStatus = statusSelect.value;
    const statusCellIndex = 1; // האינדקס של עמודת הסטטוס בטבלה

    try {
        const response = await fetch(`/residents/${id}/status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus }),
        });

        if (response.ok) {
            const tableRow = statusSelect.closest('tr');
            if (tableRow) {
                tableRow.cells[statusCellIndex].textContent = newStatus;
            }
            console.log(`הסטטוס של דייר ${id} עודכן ל-${newStatus}`);
        } else {
            console.error('שגיאה בעדכון הסטטוס:', response.statusText);
            alert('שגיאה בעדכון הסטטוס.');
        }
    } catch (error) {
        console.error('שגיאה בשליחת בקשת העדכון:', error);
        alert('שגיאה בעדכון הסטטוס.');
    }
}

// טעינת רשימת הדיירים בעת טעינת הדף
window.onload = fetchResidents;