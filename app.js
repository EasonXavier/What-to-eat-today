(() => {
  'use strict';

  const STORAGE_KEYS = {
    categories: 'meal-picker.categories.v2',
    history: 'meal-picker.history.v2',
    theme: 'meal-picker.theme.v1',
    legacyItems: 'meal-picker.items.v1',
    legacyHistory: 'meal-picker.history.v1'
  };

  const DEFAULT_CATEGORIES = [
    { id: 'rice', name: '米饭类', items: ['盖饭', '炒饭'] },
    { id: 'noodles', name: '面食类', items: ['牛肉面', '饺子或馄饨'] },
    { id: 'hotpot', name: '锅物类', items: ['火锅', '麻辣烫'] },
    { id: 'fast-food', name: '快餐类', items: ['汉堡', '炸鸡'] }
  ];

  const EXCLUSION_WINDOW_MS = 24 * 60 * 60 * 1000;
  const MAX_HISTORY = 100;

  const elements = {
    resultLabel: document.querySelector('#resultLabel'),
    categoryResult: document.querySelector('#categoryResult'),
    result: document.querySelector('#result'),
    resultMeta: document.querySelector('#resultMeta'),
    pickButton: document.querySelector('#pickButton'),
    availabilityNote: document.querySelector('#availabilityNote'),
    undoButton: document.querySelector('#undoButton'),
    addCategoryForm: document.querySelector('#addCategoryForm'),
    newCategory: document.querySelector('#newCategory'),
    categorySummary: document.querySelector('#categorySummary'),
    categoryList: document.querySelector('#categoryList'),
    categoryTemplate: document.querySelector('#categoryTemplate'),
    subitemTemplate: document.querySelector('#subitemTemplate'),
    emptyState: document.querySelector('#emptyState'),
    resetButton: document.querySelector('#resetButton'),
    clearHistoryButton: document.querySelector('#clearHistoryButton'),
    historyList: document.querySelector('#historyList'),
    historyEmpty: document.querySelector('#historyEmpty'),
    themeToggle: document.querySelector('#themeToggle')
  };

  let categories = loadCategories();
  let history = loadHistory();
  let isPicking = false;
  let availabilityTimer = null;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function readJson(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : clone(fallback);
    } catch {
      return clone(fallback);
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function makeId(prefix = 'item') {
    if (window.crypto?.randomUUID) return `${prefix}-${window.crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function normalizeText(value) {
    return String(value ?? '').trim().replace(/\s+/g, ' ');
  }

  function sameText(a, b) {
    return a.toLocaleLowerCase('zh-CN') === b.toLocaleLowerCase('zh-CN');
  }

  function sanitizeCategories(value) {
    if (!Array.isArray(value)) return [];

    const seenCategories = new Set();
    const sanitized = [];

    value.forEach(category => {
      const name = normalizeText(category?.name);
      const normalizedName = name.toLocaleLowerCase('zh-CN');
      if (!name || seenCategories.has(normalizedName)) return;
      seenCategories.add(normalizedName);

      const seenItems = new Set();
      const items = Array.isArray(category?.items)
        ? category.items.map(normalizeText).filter(item => {
            const normalizedItem = item.toLocaleLowerCase('zh-CN');
            if (!item || seenItems.has(normalizedItem)) return false;
            seenItems.add(normalizedItem);
            return true;
          })
        : [];

      sanitized.push({
        id: normalizeText(category?.id) || makeId('category'),
        name,
        items
      });
    });

    return sanitized;
  }

  function loadCategories() {
    if (localStorage.getItem(STORAGE_KEYS.categories) !== null) {
      return sanitizeCategories(readJson(STORAGE_KEYS.categories, []));
    }

    const legacyItems = readJson(STORAGE_KEYS.legacyItems, []);
    if (Array.isArray(legacyItems) && legacyItems.length) {
      const migrated = legacyItems
        .map(normalizeText)
        .filter(Boolean)
        .map(item => ({ id: makeId('legacy'), name: item, items: [item] }));
      writeJson(STORAGE_KEYS.categories, migrated);
      return migrated;
    }

    return clone(DEFAULT_CATEGORIES);
  }

  function sanitizeHistory(value) {
    if (!Array.isArray(value)) return [];
    return value
      .filter(entry => Number.isFinite(Number(entry?.timestamp)))
      .map(entry => ({
        categoryId: normalizeText(entry?.categoryId),
        categoryName: normalizeText(entry?.categoryName) || '未分类',
        itemName: normalizeText(entry?.itemName) || normalizeText(entry?.name) || '未知选项',
        timestamp: Number(entry.timestamp)
      }))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_HISTORY);
  }

  function loadHistory() {
    if (localStorage.getItem(STORAGE_KEYS.history) !== null) {
      return sanitizeHistory(readJson(STORAGE_KEYS.history, []));
    }

    const legacyHistory = readJson(STORAGE_KEYS.legacyHistory, []);
    if (!Array.isArray(legacyHistory) || !legacyHistory.length) return [];

    const migrated = legacyHistory.map(entry => {
      const name = normalizeText(entry?.name) || '未知选项';
      const matchingCategory = categories.find(category => sameText(category.name, name));
      return {
        categoryId: matchingCategory?.id || '',
        categoryName: matchingCategory?.name || '原有清单',
        itemName: name,
        timestamp: Number(entry?.timestamp) || Date.now()
      };
    });
    writeJson(STORAGE_KEYS.history, migrated);
    return migrated;
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

  function pickRandom(array) {
    return array[secureRandomIndex(array.length)];
  }

  function getDrawableCategories() {
    return categories.filter(category => category.items.length > 0);
  }

  function getRecentHistory(now = Date.now()) {
    return history.filter(entry => now - entry.timestamp < EXCLUSION_WINDOW_MS);
  }

  function getCategoryLocks(now = Date.now()) {
    const recent = getRecentHistory(now);
    return {
      ids: new Set(recent.map(entry => entry.categoryId).filter(Boolean)),
      names: new Set(recent.map(entry => entry.categoryName.toLocaleLowerCase('zh-CN')).filter(Boolean))
    };
  }

  function getAvailableCategories(now = Date.now()) {
    const locks = getCategoryLocks(now);
    return getDrawableCategories().filter(category => {
      const normalizedName = category.name.toLocaleLowerCase('zh-CN');
      return !locks.ids.has(category.id) && !locks.names.has(normalizedName);
    });
  }

  function getNextUnlockTimestamp(now = Date.now()) {
    const drawable = getDrawableCategories();
    const drawableIds = new Set(drawable.map(category => category.id));
    const drawableNames = new Set(drawable.map(category => category.name.toLocaleLowerCase('zh-CN')));
    const timestamps = getRecentHistory(now)
      .filter(entry => drawableIds.has(entry.categoryId) || drawableNames.has(entry.categoryName.toLocaleLowerCase('zh-CN')))
      .map(entry => entry.timestamp + EXCLUSION_WINDOW_MS)
      .filter(timestamp => timestamp > now);
    return timestamps.length ? Math.min(...timestamps) : null;
  }

  function formatTimestamp(timestamp) {
    return new Intl.DateTimeFormat('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  }

  function animateResult(pool, duration) {
    return new Promise(resolve => {
      const startedAt = performance.now();

      const tick = now => {
        elements.result.textContent = pickRandom(pool);
        const elapsed = now - startedAt;
        if (elapsed < duration) {
          window.setTimeout(() => requestAnimationFrame(tick), 55 + elapsed / 13);
          return;
        }
        resolve();
      };

      requestAnimationFrame(tick);
    });
  }

  function delay(duration) {
    return new Promise(resolve => window.setTimeout(resolve, duration));
  }

  function scheduleAvailabilityRefresh(timestamp) {
    if (availabilityTimer !== null) {
      window.clearTimeout(availabilityTimer);
      availabilityTimer = null;
    }
    if (!timestamp) return;

    const delayMs = Math.max(250, Math.min(timestamp - Date.now() + 1000, 0x7fffffff));
    availabilityTimer = window.setTimeout(() => {
      availabilityTimer = null;
      renderAvailability();
    }, delayMs);
  }

  function renderAvailability() {
    const drawable = getDrawableCategories();
    const available = getAvailableCategories();
    const unlockAt = getNextUnlockTimestamp();
    scheduleAvailabilityRefresh(unlockAt);

    elements.pickButton.disabled = isPicking || available.length === 0;

    if (!drawable.length) {
      elements.availabilityNote.textContent = '至少需要一个包含二级选项的一级分类。';
      elements.pickButton.title = '请先添加可抽取的二级选项';
      return;
    }

    if (!available.length) {
      elements.availabilityNote.textContent = unlockAt
        ? `所有一级分类都在24小时锁定期内，最早于 ${formatTimestamp(unlockAt)} 解锁。`
        : '当前没有可抽取的一级分类。';
      elements.pickButton.title = '24小时内不重复规则正在生效';
      return;
    }

    elements.availabilityNote.textContent = `${available.length}/${drawable.length} 个一级分类当前可抽取。`;
    elements.pickButton.title = '';
  }

  function renderCategories() {
    elements.categoryList.replaceChildren();

    categories.forEach(category => {
      const card = elements.categoryTemplate.content.firstElementChild.cloneNode(true);
      const name = card.querySelector('.category-name');
      const count = card.querySelector('.category-count');
      const deleteCategoryButton = card.querySelector('.delete-category-button');
      const addItemForm = card.querySelector('.add-item-form');
      const newSubitem = card.querySelector('.new-subitem');
      const empty = card.querySelector('.category-empty');
      const list = card.querySelector('.subitem-list');

      name.textContent = category.name;
      count.textContent = `${category.items.length} 个二级选项`;
      newSubitem.placeholder = `添加到“${category.name}”`;
      newSubitem.setAttribute('aria-label', `为“${category.name}”添加二级选项`);
      deleteCategoryButton.setAttribute('aria-label', `删除一级分类“${category.name}”及其全部选项`);
      deleteCategoryButton.addEventListener('click', () => removeCategory(category.id));

      addItemForm.addEventListener('submit', event => {
        event.preventDefault();
        addSubitem(category.id, newSubitem);
      });
      newSubitem.addEventListener('input', () => newSubitem.setCustomValidity(''));

      category.items.forEach(item => {
        const row = elements.subitemTemplate.content.firstElementChild.cloneNode(true);
        row.querySelector('.item-name').textContent = item;
        const deleteButton = row.querySelector('.delete-button');
        deleteButton.setAttribute('aria-label', `从“${category.name}”删除“${item}”`);
        deleteButton.addEventListener('click', () => removeSubitem(category.id, item));
        list.append(row);
      });

      empty.hidden = category.items.length > 0;
      elements.categoryList.append(card);
    });

    const itemCount = categories.reduce((sum, category) => sum + category.items.length, 0);
    elements.categorySummary.textContent = `${categories.length} 个一级分类，${itemCount} 个二级选项`;
    elements.emptyState.hidden = categories.length !== 0;
    renderAvailability();
  }

  function renderHistory() {
    elements.historyList.replaceChildren();
    elements.historyEmpty.hidden = history.length > 0;
    elements.clearHistoryButton.hidden = history.length === 0;
    elements.undoButton.hidden = history.length === 0;

    history.slice(0, 20).forEach(entry => {
      const row = document.createElement('li');
      const choice = document.createElement('div');
      const item = document.createElement('strong');
      const category = document.createElement('span');
      const time = document.createElement('span');

      choice.className = 'history-choice';
      item.textContent = entry.itemName;
      category.className = 'history-category';
      category.textContent = entry.categoryName;
      time.className = 'history-time';
      time.textContent = formatTimestamp(entry.timestamp);

      choice.append(item, category);
      row.append(choice, time);
      elements.historyList.append(row);
    });
  }

  function addCategory(rawValue) {
    const name = normalizeText(rawValue);
    if (!name) return;

    if (categories.some(category => sameText(category.name, name))) {
      elements.newCategory.setCustomValidity('这个一级分类已经存在。');
      elements.newCategory.reportValidity();
      return;
    }

    elements.newCategory.setCustomValidity('');
    const category = { id: makeId('category'), name, items: [] };
    categories.push(category);
    writeJson(STORAGE_KEYS.categories, categories);
    renderCategories();
    elements.newCategory.value = '';

    const inputs = elements.categoryList.querySelectorAll('.new-subitem');
    inputs[inputs.length - 1]?.focus();
  }

  function removeCategory(categoryId) {
    const category = categories.find(candidate => candidate.id === categoryId);
    if (!category) return;

    const confirmed = window.confirm(`删除一级分类“${category.name}”及其 ${category.items.length} 个二级选项？`);
    if (!confirmed) return;

    categories = categories.filter(candidate => candidate.id !== categoryId);
    writeJson(STORAGE_KEYS.categories, categories);
    renderCategories();
  }

  function addSubitem(categoryId, input) {
    const category = categories.find(candidate => candidate.id === categoryId);
    const item = normalizeText(input.value);
    if (!category || !item) return;

    if (category.items.some(existing => sameText(existing, item))) {
      input.setCustomValidity('这个二级选项已经存在于当前分类。');
      input.reportValidity();
      return;
    }

    input.setCustomValidity('');
    category.items.push(item);
    writeJson(STORAGE_KEYS.categories, categories);
    renderCategories();
  }

  function removeSubitem(categoryId, item) {
    const category = categories.find(candidate => candidate.id === categoryId);
    if (!category) return;
    category.items = category.items.filter(candidate => candidate !== item);
    writeJson(STORAGE_KEYS.categories, categories);
    renderCategories();
  }

  async function pickMeal() {
    const availableCategories = getAvailableCategories();
    if (isPicking || !availableCategories.length) return;

    const finalCategory = pickRandom(availableCategories);
    const finalItem = pickRandom(finalCategory.items);

    isPicking = true;
    renderAvailability();
    elements.result.classList.remove('is-final');
    elements.result.classList.add('is-picking');
    elements.categoryResult.hidden = true;

    elements.resultLabel.textContent = '第一层：一级分类';
    elements.resultMeta.textContent = '正在排除过去24小时内已经抽中的一级分类…';
    await animateResult(availableCategories.map(category => category.name), 680);
    elements.result.textContent = finalCategory.name;
    elements.result.classList.remove('is-picking');
    elements.result.classList.add('is-stage-final');

    await delay(360);
    elements.result.classList.remove('is-stage-final');
    elements.result.classList.add('is-picking');
    elements.resultLabel.textContent = '第二层：具体选项';
    elements.categoryResult.hidden = false;
    elements.categoryResult.textContent = `一级分类 · ${finalCategory.name}`;
    elements.resultMeta.textContent = `正在从 ${finalCategory.items.length} 个二级选项中抽取…`;
    await animateResult(finalCategory.items, 760);

    elements.result.textContent = finalItem;
    elements.result.classList.remove('is-picking');
    void elements.result.offsetWidth;
    elements.result.classList.add('is-final');
    elements.resultLabel.textContent = '今天的选择';
    elements.resultMeta.textContent = '一级分类已锁定24小时。';

    history.unshift({
      categoryId: finalCategory.id,
      categoryName: finalCategory.name,
      itemName: finalItem,
      timestamp: Date.now()
    });
    history = history.slice(0, MAX_HISTORY);
    writeJson(STORAGE_KEYS.history, history);

    isPicking = false;
    renderHistory();
    renderAvailability();
    elements.pickButton.textContent = '再抽一次';
  }

  function showHistoryEntry(entry, meta = '上一次抽到的结果') {
    elements.resultLabel.textContent = '今天的选择';
    elements.categoryResult.hidden = false;
    elements.categoryResult.textContent = `一级分类 · ${entry.categoryName}`;
    elements.result.textContent = entry.itemName;
    elements.resultMeta.textContent = meta;
    elements.pickButton.textContent = '再抽一次';
  }

  function showInitialState(meta = '先抽一级分类，再抽具体选项。') {
    elements.resultLabel.textContent = '今天的选择';
    elements.categoryResult.hidden = true;
    elements.result.textContent = '点击按钮，让网页帮你决定';
    elements.resultMeta.textContent = meta;
    elements.pickButton.textContent = '帮我决定';
  }

  function undoLastPick() {
    if (!history.length || isPicking) return;
    history.shift();
    writeJson(STORAGE_KEYS.history, history);
    renderHistory();
    renderAvailability();

    if (history.length) {
      showHistoryEntry(history[0], '已撤销上一条记录。');
    } else {
      showInitialState('已撤销上一条记录。');
    }
  }

  function resetCategories() {
    const confirmed = window.confirm('恢复示例会覆盖当前全部一级分类和二级选项，是否继续？');
    if (!confirmed) return;
    categories = clone(DEFAULT_CATEGORIES);
    writeJson(STORAGE_KEYS.categories, categories);
    renderCategories();
  }

  function clearHistory() {
    if (!history.length) return;
    const confirmed = window.confirm('清空全部抽取记录？清空后，24小时分类锁定也会解除。');
    if (!confirmed) return;
    history = [];
    writeJson(STORAGE_KEYS.history, history);
    renderHistory();
    renderAvailability();
    showInitialState('抽取记录和24小时锁定已清空。');
  }

  function initializeTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
  }

  function toggleTheme() {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem(STORAGE_KEYS.theme, nextTheme);
  }

  elements.pickButton.addEventListener('click', pickMeal);
  elements.undoButton.addEventListener('click', undoLastPick);
  elements.addCategoryForm.addEventListener('submit', event => {
    event.preventDefault();
    addCategory(elements.newCategory.value);
  });
  elements.newCategory.addEventListener('input', () => elements.newCategory.setCustomValidity(''));
  elements.resetButton.addEventListener('click', resetCategories);
  elements.clearHistoryButton.addEventListener('click', clearHistory);
  elements.themeToggle.addEventListener('click', toggleTheme);
  window.addEventListener('pageshow', renderAvailability);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) renderAvailability();
  });

  initializeTheme();
  renderCategories();
  renderHistory();

  if (history.length) {
    showHistoryEntry(history[0]);
  } else {
    showInitialState();
  }
})();
