// Получаем адрес бэкенда из .env по route из текущего приложения flask
let BACKEND_URL;
fetch('/config').then(res => res.json()).then(config => {
    BACKEND_URL = config.BACKEND_URL;
});

const sidebar = document.getElementById('sidebar');
const sidebarContent = document.getElementById('sidebar-content');

document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('toggle-btn');

    toggleBtn.addEventListener('click', function () {
        sidebar.classList.toggle('collapsed');
        updateSidebarItemsVisibility();
    });
});
const textarea = document.getElementById("inputParam");
textarea.addEventListener(
    'keydown', function(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            setTimeout(() => {
                textarea.value = textarea.value.replace(/\n$/, ""); // Удаляем добавленный перенос
            }, 0);
            startTask();
        }
    }
);

function startTask() {
    const inputText = document.getElementById('inputParam');
    const questionText = inputText.value;
    document.getElementById('inputParam').value = '';
    autoResize(inputText);
    fetch(`${BACKEND_URL}/api/v1/enqueue`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ prompt: `${document.getElementById('inputParam').value}`})
    })
    .then(res => res.json())
    .then(data => {
        const taskId = data.task_id;
        addTaskToUI(taskId, questionText);
        subscribeToTask(taskId);
    });
}

function addTaskToUI(taskId, questionText) {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'backend-response';
    taskDiv.id = `task-${taskId}`;
    taskDiv.innerHTML = `
        <div class="task-header">
            <span class="task-title">Вопрос: ${questionText}</span>
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
    addSidebarItem(taskId, questionText)
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

function addSidebarItem(taskId, text) {
    const item = document.createElement('div');
    item.className = 'sidebar-item';
    item.dataset.fullText = text;
    item.dataset.itemNumber = taskId;

    const numberSpan = document.createElement('span');
    numberSpan.className = 'item-number';
    numberSpan.textContent = taskId;

    const textSpan = document.createElement('span');
    textSpan.className = 'sidebar-text';
    textSpan.textContent = text.length > 20 ? text.substring(0, 20) + '...' : text;

    item.appendChild(numberSpan);
    item.appendChild(textSpan);

    item.addEventListener('click', function() {
        alert('Вы выбрали: ' + text);
    });

    sidebarContent.appendChild(item);
    updateSidebarItemsVisibility();
}

function updateSidebarItemsVisibility() {
    const isCollapsed = sidebar.classList.contains('collapsed');
    const items = document.querySelectorAll('.sidebar-item');

    items.forEach(item => {
        const number = item.querySelector('.item-number');
        const text = item.querySelector('.sidebar-text');

        if (isCollapsed) {
            number.style.display = 'block';
            text.style.display = 'none';
        } else {
            number.style.display = 'none';
            text.style.display = 'block';
        }
    });
}

function updateStatus(taskId, status, result = '') {
    const el = document.getElementById(`task-${taskId}`);
    if (el) {
        const statusEl = el.querySelector('.status');
        const resultEl = document.getElementById(`result-${taskId}`);
        const toggleBtnContainer = el.querySelector('.toggle-container');
        const loadingGif = statusEl.querySelector('.loading-gif');

        statusEl.textContent = `Статус: ${status}`;
        statusEl.className = 'status';

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
                resultEl.innerHTML = `
            <div class="result-text">${parsedResult}</div>
            <div class="result-actions">
                <button class="like-btn" onclick="handleFeedback('${taskId}', 'like', this)">👍</button>
                <button class="dislike-btn" onclick="handleFeedback('${taskId}', 'dislike', this)">👎</button>
                <button class="copy-btn" onclick="copyToClipboard('${taskId}', this)">📋</button>
            </div>`;
            } catch (e) {
                resultEl.textContent = result;
            }

            resultEl.classList.add('show');
            icon.textContent = '▲';

            toggleBtnContainer.style.display = 'block';
        } else {
            resultEl.classList.remove('show');
            resultEl.textContent = '';
            icon.textContent = '▼';

            toggleBtnContainer.style.display = 'none';
        }
    }
}

function toggleResult(taskId) {
    const resultEl = document.getElementById(`result-${taskId}`);
    const icon = document.querySelector(`#btn-${taskId} .icon`);

    if (!resultEl) return;

    if (resultEl.classList.contains('show')) {
        resultEl.classList.remove('show');

        setTimeout(() => {}, 300);

        icon.textContent = '▼';
    } else {
        resultEl.classList.add('show');
        icon.textContent = '▲';
    }
}

function subscribeToTask(taskId) {
    const eventSource = new EventSource(`${BACKEND_URL}/api/v1/subscribe/${taskId}`);
    eventSource.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            if (data.status === 'completed') {
                updateStatus(taskId, 'выполнено', data.result);
                eventSource.close();
            } else if (data.status === 'failed') {
                updateStatus(taskId, 'ошибка', data.error);
                eventSource.close();
            }
        } catch (e) {
            console.error("Ошибка парсинга:", e);
        }
    };

    eventSource.onerror = function(err) {
        console.error("Ошибка SSE для задачи", taskId, err);
        eventSource.close();
    };
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');

    if (currentTheme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    }
}

function handleFeedback(taskId, type, button) {
    const parent = button.parentElement;
    [...parent.children].forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    // При желании можно отправить feedback на бэкенд:
   /*
    fetch(`${BACKEND_URL}/api/v1/feedback/${taskId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId, feedback: type })
    });
    */
}

function copyToClipboard(taskId, button) {
    const resultEl = document.querySelector(`#result-${taskId} .result-text`);
    navigator.clipboard.writeText(resultEl.textContent)
        .then(() => {
            button.textContent = '✅';
            setTimeout(() => {
                button.textContent = '📋';
            }, 1500);
        })
        .catch(err => {
            console.error('Ошибка копирования:', err);
        });
}

function autoResize(textarea) {
    textarea.style.height = 'auto';
    const maxHeight = 300;
    const scrollHeight = textarea.scrollHeight;

    if (scrollHeight > maxHeight) {
        textarea.style.height = maxHeight + 'px';
        textarea.style.overflowY = 'auto';
    } else {
        textarea.style.height = scrollHeight + 'px';
        textarea.style.overflowY = 'hidden';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const themeIcon = document.getElementById('theme-icon');

    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeIcon.textContent = '🌙';
    } else {
        document.documentElement.removeAttribute('data-theme');
        themeIcon.textContent = '🌙';
    }
});
