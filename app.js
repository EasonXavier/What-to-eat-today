(() => {
  'use strict';

  const STORAGE_KEYS = {
    categories: 'meal-picker.categories.v2',
    history: 'meal-picker.history.v2',
    theme: 'meal-picker.theme.v1',
    legacyItems: 'meal-picker.items.v1',
    legacyHistory: 'meal-picker.history.v1'
  };

  const EXCLUSION_WINDOW_MS = 24 * 60 * 60 * 1000;
  const MAX_HISTORY = 100;
  const MAX_IMPORT_BYTES = 1024 * 1024;
  const MAX_CATEGORIES = 100;
  const MAX_ITEMS_PER_CATEGORY = 200;

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
    exportButton: document.querySelector('#exportButton'),
    importFile: document.querySelector('#importFile'),
    importStatus: document.querySelector('#importStatus'),
    clearHistoryButton: document.querySelector('#clearHistoryButton'),
    historyList: document.querySelector('#historyList'),
    historyEmpty: document.querySelector('#historyEmpty'),
    themeToggle: document.querySelector('#themeToggle')
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  const DEFAULT_CATEGORIES = clone(window.MEAL_PICKER_DEFAULTS || []);

  let categories = loadCategories();
  let history = loadHistory();
  let isPicking = false;
  let availabilityTimer = null;

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
    return normalizeText(a).toLocaleLowerCase('zh-CN') === normalizeText(b).toLocaleLowerCase('zh-CN');
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
        categoryName: matchingCategory?.name || '旧列表',
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
      do window.crypto.getRandomValues(values); while (values[0] >= limit);
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
      elements.availabilityNote.textContent = '先在菜单里加一个大类和至少一个选项。';
      elements.pickButton.title = '菜单里还没有可抽取的内容';
      return;
    }

    if (!available.length) {
      elements.availabilityNote.textContent = unlockAt
        ? `今天已经把所有大类都轮过一遍了，${formatTimestamp(unlockAt)} 后可以继续选。`
        : '现在没有可以抽取的大类。';
      elements.pickButton.title = '24 小时内不重复规则正在生效';
      return;
    }

    elements.availabilityNote.textContent = `还有 ${available.length} 个大类可以选。`;
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
      count.textContent = `${category.items.length} 个选项`;
      newSubitem.placeholder = `加到“${category.name}”`;
      newSubitem.setAttribute('aria-label', `给“${category.name}”添加一个选项`);
      deleteCategoryButton.setAttribute('aria-label', `移除“${category.name}”和里面的全部选项`);
      deleteCategoryButton.addEventListener('click', () => removeCategory(category.id));

      addItemForm.addEventListener('submit', event => {
        event.preventDefault();
        addSubitem(category.id, newSubitem);
      });
      newSubitem.addEventListener('input', () => newSubitem.setCustomValidity(''));

      category.items.forEach(item => {
        const row = elements.subitemTemplate.content.firstElementChild.cloneNode(true);
        row.querySelector('.item-name').textContent = item;
        const deleteButton = row.querySelector('.remove-button');
        deleteButton.setAttribute('aria-label', `从“${category.name}”里删除“${item}”`);
        deleteButton.addEventListener('click', () => removeSubitem(category.id, item));
        list.append(row);
      });

      empty.hidden = category.items.length > 0;
      list.hidden = category.items.length === 0;
      elements.categoryList.append(card);
    });

    const itemCount = categories.reduce((sum, category) => sum + category.items.length, 0);
    elements.categorySummary.textContent = `${categories.length} 个大类，${itemCount} 个具体选项`;
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
      elements.newCategory.setCustomValidity('这个大类已经有了。');
      elements.newCategory.reportValidity();
      return;
    }

    elements.newCategory.setCustomValidity('');
    categories.push({ id: makeId('category'), name, items: [] });
    writeJson(STORAGE_KEYS.categories, categories);
    renderCategories();
    elements.newCategory.value = '';

    const inputs = elements.categoryList.querySelectorAll('.new-subitem');
    inputs[inputs.length - 1]?.focus();
  }

  function removeCategory(categoryId) {
    const category = categories.find(candidate => candidate.id === categoryId);
    if (!category) return;

    const confirmed = window.confirm(`要移除“${category.name}”和里面的 ${category.items.length} 个选项吗？`);
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
      input.setCustomValidity('这个选项已经在列表里了。');
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

  function parseTxtList(text) {
    const lines = String(text ?? '').replace(/^\uFEFF/, '').split(/\r?\n/);
    const parsed = [];
    const categoryNames = new Set();
    let current = null;

    lines.forEach((rawLine, index) => {
      const lineNumber = index + 1;
      const line = rawLine.trim();
      if (!line || line.startsWith('#') || line.startsWith('//')) return;

      const headerMatch = line.match(/^\[(.+)]$/) || line.match(/^【(.+)】$/);
      if (headerMatch) {
        const name = normalizeText(headerMatch[1]);
        if (!name) throw new Error(`第 ${lineNumber} 行的大类名称是空的。`);
        if (name.length > 30) throw new Error(`第 ${lineNumber} 行的大类名称超过 30 个字符。`);

        const normalizedName = name.toLocaleLowerCase('zh-CN');
        if (categoryNames.has(normalizedName)) throw new Error(`第 ${lineNumber} 行的大类“${name}”重复了。`);
        if (parsed.length >= MAX_CATEGORIES) throw new Error(`大类不能超过 ${MAX_CATEGORIES} 个。`);

        current = { id: makeId('imported'), name, items: [] };
        parsed.push(current);
        categoryNames.add(normalizedName);
        return;
      }

      if (!current) throw new Error(`第 ${lineNumber} 行是具体选项，但前面还没有 [大类]。`);

      const item = normalizeText(line);
      if (item.length > 40) throw new Error(`第 ${lineNumber} 行的选项超过 40 个字符。`);
      if (current.items.length >= MAX_ITEMS_PER_CATEGORY) {
        throw new Error(`“${current.name}”里的选项不能超过 ${MAX_ITEMS_PER_CATEGORY} 个。`);
      }
      if (!current.items.some(existing => sameText(existing, item))) current.items.push(item);
    });

    if (!parsed.length) throw new Error('文件里没有找到任何 [大类]。');
    const emptyCategory = parsed.find(category => category.items.length === 0);
    if (emptyCategory) throw new Error(`“${emptyCategory.name}”下面还没有具体选项。`);
    return parsed;
  }

  function setTransferStatus(message, type = '') {
    elements.importStatus.textContent = message;
    elements.importStatus.dataset.type = type;
  }

  function buildExportText() {
    const data = categories.flatMap(category => [
      `[${category.name}]`,
      ...category.items,
      ''
    ]).join('\n').trimEnd();

    return `# 今天吃什么｜菜单文件\n` +
      `#\n` +
      `# 使用说明\n` +
      `# 1. 请使用 UTF-8 编码保存为 .txt 文件。\n` +
      `# 2. 大类写成 [大类名称]，全角括号【大类名称】也可以。\n` +
      `# 3. 大类下方每一行写一个具体选项，直到出现下一个大类。\n` +
      `# 4. 空行会被忽略；以 # 或 // 开头的行会被当作注释。\n` +
      `# 5. 大类名称不能重复，每个大类至少需要一个具体选项。\n` +
      `# 6. 同一大类内的重复选项会自动去重。\n` +
      `# 7. 大类名称最多 30 个字符，具体选项最多 40 个字符。\n` +
      `# 8. 导入成功后，会完全替换网页里的原菜单，并清空抽取记录和 24 小时锁定。\n` +
      `#\n` +
      `# 内容粒度建议\n` +
      `# - 大类用于决定今天吃哪一类，例如：烤鱼、日料、粉面饺子。\n` +
      `# - 具体选项应该是可以直接搜索或点外卖的菜式。\n` +
      `# - 可以写“酸辣鱼”“麻辣烤鱼”这样的口味加菜式。\n` +
      `# - 不建议把具体调料和具体食材同时写死，例如“青花椒凌波鱼”。\n` +
      `# - 尽量让同一层级的选项粒度接近，避免“火锅”和“某品牌某套餐”并列。\n` +
      `#\n` +
      `# 交给其他 AI 客制化时，可以直接使用下面这段要求：\n` +
      `# “请根据我的饮食偏好修改下方菜单。保留 [大类] 加逐行具体选项的 TXT 格式；\n` +
      `#  大类应适合做第一层随机，具体选项应是外卖平台常见、可以直接下单的菜式；\n` +
      `#  允许口味加菜式的粒度，但不要同时指定过细的调料、具体品种、部位或门店；\n` +
      `#  删除我不吃的内容，补充我常吃的内容，并确保各选项粒度一致。\n` +
      `#  请只输出可直接导入的 TXT 内容，不要使用 Markdown 代码块。”\n` +
      `#\n` +
      `# 以下是当前菜单。可以直接编辑后重新导入。\n\n` +
      `${data}\n`;
  }

  function exportTxtFile() {
    if (!categories.length) {
      setTransferStatus('菜单还是空的，暂时没有内容可以导出。', 'error');
      return;
    }

    const text = `\uFEFF${buildExportText()}`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const date = new Intl.DateTimeFormat('sv-SE').format(new Date());

    anchor.href = url;
    anchor.download = `今天吃什么-菜单-${date}.txt`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setTransferStatus('菜单已导出。文件里已经附上格式说明和 AI 客制化提示。', 'success');
  }

  async function importTxtFile(file) {
    if (!file) return;
    setTransferStatus('正在读取文件…');

    try {
      if (file.size > MAX_IMPORT_BYTES) throw new Error('TXT 文件不能超过 1 MB。');
      const text = await file.text();
      const imported = parseTxtList(text);
      const totalItems = imported.reduce((sum, category) => sum + category.items.length, 0);

      const confirmed = window.confirm(
        `准备导入 ${imported.length} 个大类和 ${totalItems} 个具体选项。\n\n` +
        '现在的菜单、抽取记录和 24 小时锁定都会被清空。继续吗？'
      );
      if (!confirmed) {
        setTransferStatus('已取消导入。');
        return;
      }

      categories = imported;
      history = [];
      writeJson(STORAGE_KEYS.categories, categories);
      writeJson(STORAGE_KEYS.history, history);

      renderCategories();
      renderHistory();
      showInitialState('新菜单已经导入，原来的菜单和记录都清空了。');
      setTransferStatus(`导入完成：${imported.length} 个大类，${totalItems} 个具体选项。`, 'success');
    } catch (error) {
      setTransferStatus(`没有导入：${error instanceof Error ? error.message : '文件格式不对。'}`, 'error');
    } finally {
      elements.importFile.value = '';
    }
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

    elements.resultLabel.textContent = '先选类型';
    elements.resultMeta.textContent = '正在跳过过去 24 小时里已经选过的大类…';
    await animateResult(availableCategories.map(category => category.name), 680);
    elements.result.textContent = finalCategory.name;
    elements.result.classList.remove('is-picking');
    elements.result.classList.add('is-stage-final');

    await delay(360);
    elements.result.classList.remove('is-stage-final');
    elements.result.classList.add('is-picking');
    elements.resultLabel.textContent = '再选具体吃什么';
    elements.categoryResult.hidden = false;
    elements.categoryResult.textContent = finalCategory.name;
    elements.resultMeta.textContent = `正在从 ${finalCategory.items.length} 个选项里挑一个…`;
    await animateResult(finalCategory.items, 760);

    elements.result.textContent = finalItem;
    elements.result.classList.remove('is-picking');
    void elements.result.offsetWidth;
    elements.result.classList.add('is-final');
    elements.resultLabel.textContent = '这顿吃';
    elements.resultMeta.textContent = `“${finalCategory.name}”接下来 24 小时不会再被抽到。`;

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
    elements.pickButton.textContent = '换一个';
  }

  function showHistoryEntry(entry, meta = '上次选到的结果。') {
    elements.resultLabel.textContent = '这顿吃';
    elements.categoryResult.hidden = false;
    elements.categoryResult.textContent = entry.categoryName;
    elements.result.textContent = entry.itemName;
    elements.resultMeta.textContent = meta;
    elements.pickButton.textContent = '换一个';
  }

  function showInitialState(meta = '先选一个类型，再选具体吃什么。') {
    elements.resultLabel.textContent = '这顿吃';
    elements.categoryResult.hidden = true;
    elements.result.textContent = '点一下，马上决定';
    elements.resultMeta.textContent = meta;
    elements.pickButton.textContent = '帮我选一个';
  }

  function undoLastPick() {
    if (!history.length || isPicking) return;
    history.shift();
    writeJson(STORAGE_KEYS.history, history);
    renderHistory();
    renderAvailability();

    if (history.length) showHistoryEntry(history[0], '刚才那次已经撤回。');
    else showInitialState('刚才那次已经撤回。');
  }

  function resetCategories() {
    const confirmed = window.confirm('恢复默认菜单会覆盖你现在的全部大类和具体选项。继续吗？');
    if (!confirmed) return;
    categories = clone(DEFAULT_CATEGORIES);
    writeJson(STORAGE_KEYS.categories, categories);
    renderCategories();
    setTransferStatus('已经恢复默认菜单。', 'success');
  }

  function clearHistory() {
    if (!history.length) return;
    const confirmed = window.confirm('要清空最近选过的记录吗？清空后，所有 24 小时锁定也会解除。');
    if (!confirmed) return;
    history = [];
    writeJson(STORAGE_KEYS.history, history);
    renderHistory();
    renderAvailability();
    showInitialState('记录和 24 小时锁定都清空了。');
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
  elements.exportButton.addEventListener('click', exportTxtFile);
  elements.importFile.addEventListener('change', () => importTxtFile(elements.importFile.files?.[0]));
  elements.clearHistoryButton.addEventListener('click', clearHistory);
  elements.themeToggle.addEventListener('click', toggleTheme);
  window.addEventListener('pageshow', renderAvailability);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) renderAvailability();
  });

  initializeTheme();
  renderCategories();
  renderHistory();

  if (history.length) showHistoryEntry(history[0]);
  else showInitialState();
})();
