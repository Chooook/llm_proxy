let overlay = null;
let tooltips = [];

document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('toggle-intro');
  if (!button) return;

  button.addEventListener('click', () => {
    if (overlay) {
      removeTips();
    } else {
      showTips();
    }
  });
});

function showTips() {
  // Создаём затемнение
  overlay = document.createElement('div');
  overlay.className = 'custom-overlay';
  document.body.appendChild(overlay);

  // Для каждого элемента с data-tooltip создаём подсказку
  document.querySelectorAll('[data-tooltip]').forEach(el => {
    const rect = el.getBoundingClientRect();
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    tooltip.textContent = el.getAttribute('data-tooltip');

    // позиционируем рядом с элементом (справа)
    tooltip.style.top = `${window.scrollY + rect.top}px`;
    tooltip.style.left = `${window.scrollX + rect.right + 10}px`;

    document.body.appendChild(tooltip);
    tooltips.push(tooltip);

    // Подсветка элемента
    el.classList.add('highlight-element');
  });
}

function removeTips() {
  if (overlay) {
    overlay.remove();
    overlay = null;
  }

  tooltips.forEach(tip => tip.remove());
  tooltips = [];

  document.querySelectorAll('[data-tooltip]').forEach(el => {
    el.classList.remove('highlight-element');
  });
}
