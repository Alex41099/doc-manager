// Инициализация данных из LocalStorage
let documents = JSON.parse(localStorage.getItem('myDocuments')) || [];

const fileInput = document.getElementById('fileInput');
const docList = document.getElementById('docList');
const searchInput = document.getElementById('searchInput');
const stats = document.getElementById('stats');

// Функция для сохранения данных
function save() {
    localStorage.setItem('myDocuments', JSON.stringify(documents));
    render();
}

// Рендеринг списка
function render(filter = '') {
    docList.innerHTML = '';
    const filteredDocs = documents.filter(doc =>
        doc.name.toLowerCase().includes(filter.toLowerCase())
    );

    filteredDocs.forEach((doc, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${doc.name}</td>
            <td>${doc.type.toUpperCase()}</td>
            <td>${(doc.size / 1024).toFixed(2)} KB</td>
            <td>${doc.date}</td>
            <td><button class="btn-delete" onclick="deleteDoc(${index})">Удалить</button></td>
        `;
        docList.appendChild(tr);
    });

    stats.textContent = `Всего документов: ${filteredDocs.length}`;
}

// Обработка загрузки файла
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const newDoc = {
        name: file.name,
        size: file.size,
        type: file.name.split('.').pop(),
        date: new Date().toLocaleDateString(),
        id: Date.now()
    };

    documents.push(newDoc);
    save();
    fileInput.value = ''; // Сброс инпута
});

// Удаление
window.deleteDoc = (index) => {
    if(confirm('Удалить этот документ?')) {
        documents.splice(index, 1);
        save();
    }
};

// Поиск
searchInput.addEventListener('input', (e) => {
    render(e.target.value);
});

// Первый запуск
render();