// --- State Management ---
let documents = JSON.parse(localStorage.getItem('edm_database')) || [];

// --- DOM Elements ---
const DOM = {
    dropZone: document.getElementById('dropZone'),
    fileInput: document.getElementById('fileInput'),
    docList: document.getElementById('docList'),
    searchInput: document.getElementById('searchInput'),
    categoryFilter: document.getElementById('categoryFilter'),
    sortFilter: document.getElementById('sortFilter'),
    statsBadge: document.getElementById('statsBadge'),
    themeToggle: document.getElementById('themeToggle'),
    exportDb: document.getElementById('exportDb'),
    toastContainer: document.getElementById('toastContainer')
};

// --- Initialization ---
function init() {
    // Восстанавливаем тему
    const savedTheme = localStorage.getItem('edm_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    DOM.themeToggle.textContent = savedTheme === 'light' ? '🌙' : '☀️';

    render();
    setupEventListeners();
}

// --- Utils: Toast System ---
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
}

// --- Утилиты: Форматирование ---
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function determineCategory(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return 'pdf';
    if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return 'doc';
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) return 'image';
    return 'other';
}

// --- Core API ---
function saveDB() {
    localStorage.setItem('edm_database', JSON.stringify(documents));
}

function processFiles(files) {
    if (!files.length) return;

    Array.from(files).forEach(file => {
        const newDoc = {
            id: crypto.randomUUID(), // Нативная генерация уникальных ID
            name: file.name,
            size: file.size,
            type: file.name.split('.').pop().toUpperCase(),
            category: determineCategory(file.name),
            timestamp: Date.now(),
            dateFormatted: new Date().toLocaleString('ru-RU')
        };
        documents.push(newDoc);
    });

    saveDB();
    render();
    showToast(`Успешно загружено: ${files.length} файл(ов)`);
}

window.deleteDoc = (id) => {
    // В реальном проекте тут был бы кастомный модал
    if(confirm('Подтвердите безвозвратное удаление документа')) {
        documents = documents.filter(doc => doc.id !== id);
        saveDB();
        render();
        showToast('Документ удален', 'error');
    }
};

// --- Rendering Engine ---
function render() {
    const searchTerm = DOM.searchInput.value.toLowerCase();
    const category = DOM.categoryFilter.value;
    const sortBy = DOM.sortFilter.value;

    // 1. Фильтрация
    let filteredDocs = documents.filter(doc => {
        const matchesSearch = doc.name.toLowerCase().includes(searchTerm);
        const matchesCategory = category === 'all' || doc.category === category;
        return matchesSearch && matchesCategory;
    });

    // 2. Сортировка
    filteredDocs.sort((a, b) => {
        switch(sortBy) {
            case 'newest': return b.timestamp - a.timestamp;
            case 'oldest': return a.timestamp - b.timestamp;
            case 'sizeAsc': return a.size - b.size;
            case 'sizeDesc': return b.size - a.size;
            default: return 0;
        }
    });

    // 3. Отрисовка
    DOM.docList.innerHTML = '';
    if (filteredDocs.length === 0) {
        DOM.docList.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Записи не найдены</td></tr>`;
    } else {
        filteredDocs.forEach(doc => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${doc.name}</strong></td>
                <td><span class="type-badge">${doc.type}</span></td>
                <td>${formatBytes(doc.size)}</td>
                <td>${doc.dateFormatted}</td>
                <td>
                    <button class="btn-icon" style="color: var(--danger)" onclick="deleteDoc('${doc.id}')" title="Удалить">🗑️</button>
                </td>
            `;
            DOM.docList.appendChild(tr);
        });
    }

    DOM.statsBadge.textContent = `${filteredDocs.length} файлов`;
}

// --- Event Listeners ---
function setupEventListeners() {
    // Загрузка через инпут
    DOM.fileInput.addEventListener('change', (e) => {
        processFiles(e.target.files);
        e.target.value = '';
    });

    // Drag and Drop
    DOM.dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        DOM.dropZone.classList.add('dragover');
    });
    DOM.dropZone.addEventListener('dragleave', () => {
        DOM.dropZone.classList.remove('dragover');
    });
    DOM.dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        DOM.dropZone.classList.remove('dragover');
        processFiles(e.dataTransfer.files);
    });

    // Фильтры и поиск
    DOM.searchInput.addEventListener('input', render);
    DOM.categoryFilter.addEventListener('change', render);
    DOM.sortFilter.addEventListener('change', render);

    // Темная тема
    DOM.themeToggle.addEventListener('click', () => {
        const root = document.documentElement;
        const currentTheme = root.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        root.setAttribute('data-theme', newTheme);
        localStorage.setItem('edm_theme', newTheme);
        DOM.themeToggle.textContent = newTheme === 'light' ? '🌙' : '☀️';
    });

    // Экспорт БД (Генерация JSON файла)
    DOM.exportDb.addEventListener('click', () => {
        if(documents.length === 0) {
            showToast('База данных пуста', 'error');
            return;
        }
        const dataStr = JSON.stringify(documents, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `edm_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        URL.revokeObjectURL(url);
        showToast('Экспорт успешно завершен');
    });
}

// Запуск приложения
init();