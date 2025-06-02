// Получаем адрес бэкенда из .env по route из текущего приложения flask
let BACKEND_URL;

function autoLogin() {
  try {
    return fetch('/config').then(res => res.json()).then(config => {
        BACKEND_URL = config.BACKEND_URL;
    })
    .then(() => {
        return fetch(`${BACKEND_URL}/`, {
            credentials: 'include'
        })
    })
    .then(response => {
        if (response.ok) {
          console.log('Автоматический вход выполнен');
        } else {
          console.error('Ошибка авто-логина');
        }
    })
  } catch (err) {
    console.error('Ошибка сети:', err);
  }
}
autoLogin().then(r => {})

const sidebar = document.getElementById('sidebar');
const sidebarContent = document.getElementById('sidebar-content');

document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('toggle-btn');

    toggleBtn.addEventListener('click', function () {
        toggleSidebar();
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
        credentials: 'include',
        body: JSON.stringify({ prompt: questionText })
    })
    .then(res => res.json())
    .then(data => {
        const taskId = data.task_id;
        const shortId = data.short_task_id;
        addTaskToUI(taskId, shortId, questionText);
        subscribeToTask(taskId);
    });
}

function addTaskToUI(taskId, shortId, questionText) {
    // Hide empty state
    const emptyState = document.getElementById('emptyState');
    if (emptyState) emptyState.style.display = 'none';

    const taskDiv = document.createElement('div');
    taskDiv.className = 'backend-response';
    taskDiv.id = `${taskId}`;
    taskDiv.innerHTML = `
<div class="task-header">
    <span class="task-title">Вопрос: ${questionText}</span>
</div>
<div class="status status-waiting">
    <span class="status-text">Статус: ожидание</span>
    <img src="/static/loading_dog.gif" class="loading-gif" alt="Загрузка...">
</div>
<div class="result" id="result-${taskId}"></div>
<div class="toggle-container">
<button class="toggle-btn" id="btn-${taskId}" onclick="toggleResult('${taskId}')">
    <span class="icon">−</span>
    </button>
</div>`;
    addSidebarItem(taskId, shortId, questionText)
    const container = document.getElementById('tasks');
    container.insertBefore(taskDiv, container.firstChild);

    // Deactivate all other tasks
    document.querySelectorAll('.backend-response').forEach(task => {
        task.classList.remove('active');
    });
    taskDiv.classList.add('active');

    const divider = document.getElementById('taskDivider');
    if (container.children.length === 1) {
        divider.classList.add('show');
    }

    requestAnimationFrame(() => {
        taskDiv.classList.add('animate');
    });
}

function addSidebarItem(taskId, shortId, text) {
    const item = document.createElement('div');
    item.className = 'sidebar-item';
    item.dataset.fullText = text;
    item.dataset.itemNumber = taskId;

    const numberSpan = document.createElement('span');
    numberSpan.className = 'item-number';
    numberSpan.textContent = shortId;

    const textSpan = document.createElement('span');
    textSpan.className = 'sidebar-text';
    textSpan.textContent = text.length > 20 ? text.substring(0, 20) + '...' : text;

    item.appendChild(numberSpan);
    item.appendChild(textSpan);

    item.addEventListener('click', function() {
        document.querySelectorAll('.sidebar-item, .backend-response').forEach(el => {
            el.classList.remove('active');
        });

        this.classList.add('active');
        const taskEl = document.getElementById(`${taskId}`);
        if (taskEl) {
            taskEl.classList.add('active');
        }
    });
    document.querySelectorAll('.sidebar-item, .backend-response').forEach(el => {
        el.classList.remove('active');
    });
    item.classList.add('active');

    sidebarContent.insertBefore(item, sidebarContent.firstChild);
    item.scrollIntoView({behavior: "smooth", block: "nearest"});
    updateSidebarItemsVisibility();

    return item; // Возвращаем созданный элемент
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
    const el = document.getElementById(`${taskId}`);
    if (el) {
        const statusEl = el.querySelector('.status');
        const statusText = statusEl.querySelector('.status-text');
        const resultEl = document.getElementById(`result-${taskId}`);
        const loadingGif = statusEl.querySelector('.loading-gif');

        statusText.textContent = `Статус: ${status}`;
        statusEl.className = 'status';

        if (status === 'ожидание') {
            statusEl.classList.add('status-waiting');
            if (!loadingGif) {
                const gif = document.createElement('img');
                gif.src = '/static/loading_dog.gif';
                gif.className = 'loading-gif';
                gif.alt = 'Загрузка...';
                statusEl.appendChild(gif);
            }
        } else if (status === 'выполнено') {
            statusEl.classList.add('status-done');
            if (loadingGif) loadingGif.remove();
        } else if (status === 'ошибка') {
            statusEl.classList.add('status-error');
            if (loadingGif) loadingGif.remove();
        }

        if (result) {
            try {
                resultEl.innerHTML = `
<div class="result-text">${result.trim()}</div>
<div class="result-actions">
    <button class="like-btn" onclick="handleFeedback('${taskId}', 'like', this)">👍</button>
    <button class="dislike-btn" onclick="handleFeedback('${taskId}', 'dislike', this)">👎</button>
    <button class="copy-btn" onclick="copyToClipboard('${taskId}', this)">📋</button>
</div>`;
            } catch (e) {
                resultEl.textContent = result;
            }
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
    const sidebarItem = document.querySelector(`.sidebar-item[data-item-number="${taskId}"]`);
    eventSource.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            if (data.status === 'completed') {
                updateStatus(taskId, 'выполнено', data.result);
                sidebarItem.classList.add('completed');
                eventSource.close();
            } else if (data.status === 'failed') {
                updateStatus(taskId, 'ошибка', data.error);
                sidebarItem.classList.add('error');
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
    const themeIcon = document.getElementById('theme-icon');

    if (currentTheme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        themeIcon.textContent = '🔆';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        themeIcon.textContent = '☾';
    }
}

function toggleSidebar() {
    const currentStateCollapsed = sidebar.classList.contains('collapsed');

    if (currentStateCollapsed) {
        sidebar.classList.remove('collapsed');
        localStorage.setItem('currentState', 'not-collapsed');
    } else {
        sidebar.classList.add('collapsed');
        localStorage.setItem('currentState', 'collapsed');
    }
    updateSidebarItemsVisibility();
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
        themeIcon.textContent = '☾';
    } else {
        document.documentElement.removeAttribute('data-theme');
        themeIcon.textContent = '🔆';
    }

    const savedSidebarState = localStorage.getItem('currentState') || 'not-collapsed';

    if (savedSidebarState === 'collapsed') {
        sidebar.classList.add('collapsed');
        localStorage.setItem('currentState', 'collapsed');
    } else {
        sidebar.classList.remove('collapsed');
        localStorage.setItem('currentState', 'not-collapsed');
    }
    updateSidebarItemsVisibility();



    fetch('/config').then(res => res.json()).then(config => {
        BACKEND_URL = config.BACKEND_URL;
        return BACKEND_URL;
    })
    .then(() => {
        return fetch(`${BACKEND_URL}/api/v1/tasks`, { credentials: 'include' });
    })
    .then(response => {
        if (!response.ok) throw new Error('Network error');
        if (response.status === 204) return []; // No content
        return response.json();
    })
    .then(tasks => {
        if (!tasks || tasks.length === 0) {
            document.getElementById('emptyState').style.display = 'block';
            return;
        }

        // Переменная для хранения последней добавленной задачи
        let lastAddedItem = null;

        // Обрабатываем задачи в обратном порядке (чтобы последняя была первой в списке)
        tasks.forEach(task => {
            try {
                const prompt = task.prompt;
                addTaskToUI(task.task_id, task.short_task_id, prompt);

                // Сохраняем ссылку на последний добавленный элемент
                lastAddedItem = document.querySelector(`.sidebar-item[data-item-number="${task.task_id}"]`);

                // Update status and sidebar
                const status = task.status === 'completed' ? 'выполнено' :
                             task.status === 'failed' ? 'ошибка' : 'ожидание';
                updateStatus(task.task_id, status, task.result || task.error);

                const sidebarItem = document.querySelector(`.sidebar-item[data-item-number="${task.task_id}"]`);
                if (status === 'выполнено') sidebarItem.classList.add('completed');
                if (status === 'ошибка') sidebarItem.classList.add('error');

                if (status === 'ожидание') subscribeToTask(task.task_id);
            } catch (e) {
                console.error('Error loading task:', e);
            }
        });

        // Активируем последнюю задачу
        if (lastAddedItem) {
            lastAddedItem.classList.add('active');
            const taskId = lastAddedItem.dataset.itemNumber;
            const taskEl = document.getElementById(`${taskId}`);
            if (taskEl) {
                taskEl.classList.add('active');
            }
        }
    })
    .catch(error => {
        console.error('Error loading tasks:', error);
        document.getElementById('emptyState').style.display = 'block';
    });
});
