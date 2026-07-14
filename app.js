(() => {
  'use strict';

  const STORAGE_KEYS = {
    items: 'meal-picker.items.v1',
    history: 'meal-picker.history.v1',
    theme: 'meal-picker.theme.v1'
  };

  // 临时示例。后续可以直接替换这里的内容，也可以在网页上增删。
  const DEFAULT_ITEMS = [
    '米饭套餐',
    '面食',
    '饺子或馄饨',
    '火锅',
    '烧烤',
    '汉堡或炸鸡',
    '日料',
    '家常菜'
  ];

  const MAX_HISTORY = 10;
  const RECENT_EXCLUSION_COUNT = 3;

  const elements = {
    result: document.querySelector('#result'),
    resultMeta: document.querySelector('#resultMeta'),
    itemCount: document.querySelector('#itemCount'),
    pickButton: document.querySelector('#pickButton'),
    undoButton: document.querySelector('#undoButton'),
    addForm: document.querySelector('#addForm'),
    newItem: document.querySelector('#newItem'),
    itemList: document.querySelector('#itemList'),
    itemTemplate: document.querySelector('#itemTemplate'),
    emptyState: document.querySelector('#emptyState'),
    resetButton: document.querySelector('#resetButton'),
    clearHistoryButton: document.querySelector('#clearHistoryButton'),
    historyList: document.querySelector('#historyList'),
    historyEmpty: document.querySelector('#historyEmpty'),
    themeToggle: document.querySelector('#themeToggle')
  };

  let items = readJson(STORAGE_KEYS.items, DEFAULT_ITEMS);
  let history = readJson(STORAGE_KEYS.history, []);
  let isPicking = false;

  if (!Array.isArray(items)) items = [...DEFAULT_ITEMS];
  if (!Array.isArray(history)) history = [];

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : structuredClone(fallback);
    } catch {
      return structuredClone(fallback);
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function normalizeItem(value) {
    return value.trim().replace(/\s+/g, ' ');
  }

  function secureRandomIndex(length) {
    if (length <= 1) return 0;

    if (window.crypto?.getRandomValues) {
      const maxUint32 = 0x100000000;
      const limit = maxUint32 - (maxUint32 % length);
      const values = new Uint32Array(1);
      do {
        window.crypto.getRandomValues(values);
      } while (values[0] >= limit);
      return values[0] % length;
    }

    return Math.floor(Math.random() * length);
  }

  function getCandidateItems() {
    if (items.length <= 2) return [...items];

    const recentNames = new Set(
      history.slice(0, Math.min(RECENT_EXCLUSION_COUNT, items.length - 1)).map(entry => entry.name)
    );
    const filtered = items.filter(item => !recentNames.has(item));
    return filtered.length ? filtered : [...items];
  }

  function formatTimestamp(timestamp) {
    return new Intl.DateTimeFormat('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  }

  function showItemCountMeta() {
    elements.resultMeta.replaceChildren(
      document.createTextNode('当前有 '),
      Object.assign(document.createElement('span'), { id: 'itemCount', textContent: String(items.length) }),
      document.createTextNode(' 个备选项')
    );
    elements.itemCount = document.querySelector('#itemCount');
  }

  function renderItems() {
    elements.itemList.replaceChildren();

    items.forEach(item => {
      const row = elements.itemTemplate.content.firstElementChild.cloneNode(true);
      row.querySelector('.item-name').textContent = item;
      const deleteButton = row.querySelector('.delete-button');
      deleteButton.setAttribute('aria-label', `删除“${item}”`);
      deleteButton.addEventListener('click', () => removeItem(item));
      elements.itemList.append(row);
    });

    elements.itemCount.textContent = String(items.length);
    elements.emptyState.hidden = items.length !== 0;
    elements.pickButton.disabled = items.length < 2 || isPicking;
    elements.pickButton.title = items.length < 2 ? '至少需要两个备选项' : '';
  }

  function renderHistory() {
    elements.historyList.replaceChildren();
    elements.historyEmpty.hidden = history.length > 0;
    elements.clearHistoryButton.hidden = history.length === 0;
    elements.undoButton.hidden = history.length === 0;

    history.forEach(entry => {
      const row = document.createElement('li');
      const name = document.createElement('strong');
      const time = document.createElement('span');
      name.textContent = entry.name;
      time.className = 'history-time';
      time.textContent = formatTimestamp(entry.timestamp);
      row.append(name, time);
      elements.historyList.append(row);
    });
  }

  function addItem(rawValue) {
    const value = normalizeItem(rawValue);
    if (!value) return;

    const exists = items.some(item => item.toLocaleLowerCase('zh-CN') === value.toLocaleLowerCase('zh-CN'));
    if (exists) {
      elements.newItem.setCustomValidity('这个备选项已经存在。');
      elements.newItem.reportValidity();
      return;
    }

    elements.newItem.setCustomValidity('');
    items.push(value);
    writeJson(STORAGE_KEYS.items, items);
    renderItems();
    elements.newItem.value = '';
    elements.newItem.focus();
  }

  function removeItem(item) {
    items = items.filter(candidate => candidate !== item);
    writeJson(STORAGE_KEYS.items, items);
    renderItems();
  }

  function pickMeal() {
    if (isPicking || items.length < 2) return;

    isPicking = true;
    elements.pickButton.disabled = true;
    elements.result.classList.remove('is-final');
    elements.result.classList.add('is-picking');

    const candidates = getCandidateItems();
    const finalChoice = candidates[secureRandomIndex(candidates.length)];
    const animationPool = items.length ? items : candidates;
    const startedAt = performance.now();
    const animationDuration = 780;

    const tick = now => {
      const elapsed = now - startedAt;
      elements.result.textContent = animationPool[secureRandomIndex(animationPool.length)];

      if (elapsed < animationDuration) {
        window.setTimeout(() => requestAnimationFrame(tick), 58 + elapsed / 11);
        return;
      }

      elements.result.textContent = finalChoice;
      elements.result.classList.remove('is-picking');
      void elements.result.offsetWidth;
      elements.result.classList.add('is-final');
      elements.resultMeta.textContent = '决定了，今天就吃这个。';

      history.unshift({ name: finalChoice, timestamp: Date.now() });
      history = history.slice(0, MAX_HISTORY);
      writeJson(STORAGE_KEYS.history, history);

      isPicking = false;
      renderItems();
      renderHistory();
      elements.pickButton.textContent = '再抽一次';
    };

    requestAnimationFrame(tick);
  }

  function undoLastPick() {
    if (!history.length || isPicking) return;
    history.shift();
    writeJson(STORAGE_KEYS.history, history);
    renderHistory();

    if (history.length) {
      elements.result.textContent = history[0].name;
      elements.resultMeta.textContent = '已撤销上一条记录。';
      elements.pickButton.textContent = '再抽一次';
    } else {
      elements.result.textContent = '点击按钮，让网页帮你决定';
      showItemCountMeta();
      elements.pickButton.textContent = '帮我决定';
    }
  }

  function resetItems() {
    const confirmed = window.confirm('恢复示例清单会覆盖当前备选项，是否继续？');
    if (!confirmed) return;
    items = [...DEFAULT_ITEMS];
    writeJson(STORAGE_KEYS.items, items);
    renderItems();
  }

  function clearHistory() {
    if (!history.length) return;
    const confirmed = window.confirm('清空全部抽取记录？');
    if (!confirmed) return;
    history = [];
    writeJson(STORAGE_KEYS.history, history);
    renderHistory();
    elements.result.textContent = '点击按钮，让网页帮你决定';
    showItemCountMeta();
    elements.pickButton.textContent = '帮我决定';
  }

  function initializeTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
  }

  function toggleTheme() {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem(STORAGE_KEYS.theme, nextTheme);
  }

  elements.pickButton.addEventListener('click', pickMeal);
  elements.undoButton.addEventListener('click', undoLastPick);
  elements.addForm.addEventListener('submit', event => {
    event.preventDefault();
    addItem(elements.newItem.value);
  });
  elements.newItem.addEventListener('input', () => elements.newItem.setCustomValidity(''));
  elements.resetButton.addEventListener('click', resetItems);
  elements.clearHistoryButton.addEventListener('click', clearHistory);
  elements.themeToggle.addEventListener('click', toggleTheme);

  initializeTheme();
  renderItems();
  renderHistory();

  if (history.length) {
    elements.result.textContent = history[0].name;
    elements.resultMeta.textContent = '上一次抽到的结果';
    elements.pickButton.textContent = '再抽一次';
  }
})();
