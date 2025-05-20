
// Получаем адрес бэкенда из .env по route из текущего приложения flask
let BACKEND_URL;
fetch('/config').then(res => res.json()).then(config => {
    BACKEND_URL = config.BACKEND_URL;
});
console.log(BACKEND_URL);

function startTask() {
    fetch(`${BACKEND_URL}/api/enqueue`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ input: `${document.getElementById('inputParam').value}` })
    })
    .then(res => res.json())
    .then(data => {
        const taskId = data.task_id;
        addTaskToUI(taskId);
        subscribeToTask(taskId);
    });
}

function addTaskToUI(taskId) {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'backend-response';
    taskDiv.id = `task-${taskId}`;
    taskDiv.innerHTML = `
        <div class="task-header">
            <span class="task-title">Вопрос: </span>
        </div>
        <div class="status status-waiting">
            Статус: ожидание
            <img src="/static/loading.gif" class="loading-gif" alt="Загрузка...">
        </div>
        <div class="result" id="result-${taskId}"></div>
        <div class="toggle-container">
            <button class="toggle-btn" id="btn-${taskId}" onclick="toggleResult('${taskId}')">
                <span class="icon">−</span>
            </button>
        </div>`;

    const container = document.getElementById('tasks');
    container.insertBefore(taskDiv, container.firstChild);
 
    const divider = document.getElementById('taskDivider');
    if (container.children.length === 1) {
        divider.classList.add('show');
    }
 
    requestAnimationFrame(() => {
        taskDiv.classList.add('animate');
    });
}


function updateStatus(taskId, status, result = '') {
    const el = document.getElementById(`task-${taskId}`);
    if (el) {
        const statusEl = el.querySelector('.status');
        const resultEl = document.getElementById(`result-${taskId}`);
        const toggleBtnContainer = el.querySelector('.toggle-container');
        const loadingGif = statusEl.querySelector('.loading-gif');
 
        // Обновляем статус
        statusEl.textContent = `Статус: ${status}`;
        statusEl.className = 'status'; // Сбрасываем классы
        
        // Добавляем гиф-картинку обратно, если статус "ожидание"
        if (status === 'ожидание') {
            statusEl.classList.add('status-waiting');
            if (!loadingGif) {
                const gif = document.createElement('img');
                gif.src = '/static/loading.gif';
                gif.className = 'loading-gif';
                gif.alt = 'Загрузка...';
                statusEl.appendChild(gif);
            }
        } else if (status === 'выполнено') {
            statusEl.classList.add('status-done');
        } else if (status === 'ошибка') {
            statusEl.classList.add('status-error');
        }


        const icon = document.querySelector(`#btn-${taskId} .icon`);

        if (result) {
            try {
                const parsedResult = JSON.parse(`${result}`);
                resultEl.textContent = parsedResult;
            } catch (e) {
                resultEl.textContent = result;
            }

            // Показываем результат с анимацией
            resultEl.classList.add('show');
            icon.textContent = '−'; // минус

            // Показываем кнопку, если она была скрыта
            toggleBtnContainer.style.display = 'block';
        } else {
            // Скрываем результат
            resultEl.classList.remove('show');
            resultEl.textContent = '';
            icon.textContent = '+'; // плюс

            // Скрываем кнопку, если нужно
            toggleBtnContainer.style.display = 'none';
        }
    }
}

function toggleResult(taskId) {
    const resultEl = document.getElementById(`result-${taskId}`);
    const icon = document.querySelector(`#btn-${taskId} .icon`);

    if (!resultEl) return;

    if (resultEl.classList.contains('show')) {
        // Анимация скрытия
        resultEl.classList.remove('show');

        // После завершения анимации можно скрыть полностью (по желанию)
        setTimeout(() => {
            // Можно оставить display: block, чтобы не терять позиционирование
        }, 300);

        icon.textContent = '+'; // Плюс
    } else {
        // Анимация появления
        resultEl.classList.add('show');
        icon.textContent = '−'; // Минус
    }
}

function subscribeToTask(taskId) {
    const eventSource = new EventSource(`${BACKEND_URL}/api/subscribe/${taskId}`);
    eventSource.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            if (data.status === 'done') {
                updateStatus(taskId, 'выполнено', data.result);
            } else if (data.status === 'failed') {
                updateStatus(taskId, 'ошибка', data.error);
            }
            eventSource.close();
        } catch (e) {
            console.error("Ошибка парсинга:", e);
        }
    };

    eventSource.onerror = function(err) {
        console.error("Ошибка SSE для задачи", taskId, err);
        eventSource.close();
    };
}

function removeTask(taskId) {
    const taskEl = document.getElementById(`task-${taskId}`);
    if (taskEl) {
        taskEl.remove();
    }

    // Если задач больше нет — скрываем разделитель
    const tasksContainer = document.getElementById('tasks');
    const divider = document.getElementById('taskDivider');
    if (tasksContainer.children.length === 0) {
        divider.style.display = 'none';
    }
}

// Функция для получения данных категории
function fetchCategory(category) {
    fetch(`$BACKEND_URL/api/category?name=${category}`)
        .then(response => response.json())
        .then(data => {
            alert(`Категория: ${data.name}\nКоличество статей: ${data.count}`);
        })
        .catch(error => {
            alert('Произошла ошибка при загрузке категории');
        });
}

// Функция для взаимодействия с бэкендом
function fetchData() {
    const param = document.getElementById('inputParam').value;
    const responseDiv = document.getElementById('backendResponse');

    responseDiv.textContent = "Отправка запроса...";

    fetch(`$BACKEND_URL/api/data?param=${encodeURIComponent(param)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка сети');
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                responseDiv.textContent = `Ошибка: ${data.error}`;
            } else {
                responseDiv.textContent = `Ответ от Gigachat: ${data.response}`;
            }
        })
        .catch(error => {
            console.error('Ошибка:', error);
            responseDiv.textContent = `Произошла ошибка: ${error.message}`;
        });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    dropZone.classList.add('highlight');
}

function unhighlight() {
    dropZone.classList.remove('highlight');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    files = dt.files;
    handleFiles(files);
}

function handleFiles(files) {
    fileList.innerHTML = '';
    [...files].forEach(file => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${file.name} (${formatFileSize(file.size)})</span>
            <span class="status">Ожидает загрузки</span>
        `;
        fileList.appendChild(li);
    });

    // Автоматически начинаем загрузку после выбора файлов
    uploadFiles();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function uploadFiles() {
    if (files.length === 0) return;

    const formData = new FormData();
    [...files].forEach(file => {
        formData.append('files', file);
    });

    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = function(e) {
        if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            progressBar.style.width = percentComplete + '%';
        }
    };

    xhr.onload = function() {
        if (xhr.status === 200) {
           const response = JSON.parse(xhr.response);
            updateFileStatus(response);
            progressBar.style.width = '0%';
        } else {
            alert('Ошибка загрузки файлов');
        }
    };

    xhr.open('POST', `$BACKEND_URL/api/upload`, true);
    xhr.send(formData);
}

function updateFileStatus(response) {
    const items = fileList.querySelectorAll('li');
    items.forEach((item, index) => {
        const status = item.querySelector('.status');
        if (response.success && response.success.includes(files[index].name)) {
            status.textContent = 'Успешно загружен';
            status.style.color = 'green';
        } else {
            status.textContent = 'Ошибка загрузки';
            status.style.color = 'red';
        }
    });
}

// Обработчик placeholder для textarea
const inputParam = document.getElementById('inputParam');
inputParam.addEventListener('focus', function() {
    if (this.value === '' && this.placeholder === 'Что вас интересует?') {
        this.placeholder = '';
    }
});s

inputParam.addEventListener('blur', function() {
    if (this.value === '') {
        this.placeholder = 'Что вас интересует?';
    }
});

// Функция переключения темы
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const themeIcon = document.getElementById('theme-icon');
    
    if (currentTheme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        themeIcon.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeIcon.textContent = '🌙';
        localStorage.setItem('theme', 'dark');
    }
}

// Проверка сохраненной темы при загрузке
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const themeIcon = document.getElementById('theme-icon');
    
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeIcon.textContent = '??';
    } else {
        document.documentElement.removeAttribute('data-theme');
        themeIcon.textContent = '??';
    }
});


// Drag and drop функционал
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const progressBar = document.getElementById('progress');
let files = [];

// Обработчики событий для drag and drop
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

fileInput.addEventListener('change', function() {
    files = this.files;
    handleFiles(files);
});

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
});

dropZone.addEventListener('drop', handleDrop, false);

