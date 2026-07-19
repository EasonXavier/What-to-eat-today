(() => {
  'use strict';

  const STORAGE_KEY = 'meal-picker.categories.v3';
  const exportButton = document.querySelector('#exportButton');
  const status = document.querySelector('#importStatus');

  if (!exportButton || !status) return;

  function setStatus(message, type = '') {
    status.textContent = message;
    status.dataset.type = type;
  }

  function readCategories() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function buildExportText(categories) {
    const menu = categories.flatMap(category => [
      `[${String(category?.name || '').trim()}]`,
      ...(Array.isArray(category?.items)
        ? category.items.map(item => String(typeof item === 'string' ? item : item?.name ?? '').trim()).filter(Boolean)
        : []),
      ''
    ]).join('\n').trimEnd();

    return `\uFEFF# 今天吃什么｜菜单文件\n` +
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
      `# - 尽量让同一层级的选项粒度接近。\n` +
      `#\n` +
      `# 交给其他 AI 客制化时，可以直接使用下面这段要求：\n` +
      `# “请根据我的饮食偏好修改下方菜单。保留 [大类] 加逐行具体选项的 TXT 格式；\n` +
      `#  大类应适合做第一层随机，具体选项应是外卖平台常见、可以直接下单的菜式；\n` +
      `#  允许口味加菜式的粒度，但不要同时指定过细的调料、具体品种、部位或门店；\n` +
      `#  删除我不吃的内容，补充我常吃的内容，并确保各选项粒度一致；\n` +
      `#  请只输出可直接导入的 TXT 内容，不要使用 Markdown 代码块。”\n` +
      `#\n` +
      `# 以下是当前菜单。可以直接编辑后重新导入。\n\n` +
      `${menu}\n`;
  }

  function downloadFallback(text, fileName) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = fileName;
    link.rel = 'noopener';
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();

    // iPadOS Safari 可能延迟读取 Blob，不能在点击后立即释放。
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function exportForAppleDevices() {
    const categories = readCategories();
    if (!categories.length) {
      setStatus('菜单还是空的，暂时没有内容可以导出。', 'error');
      return;
    }

    const text = buildExportText(categories);
    const date = new Intl.DateTimeFormat('sv-SE').format(new Date());
    const fileName = `今天吃什么-菜单-${date}.txt`;
    const originalLabel = exportButton.textContent;

    exportButton.disabled = true;
    exportButton.textContent = '正在准备…';
    setStatus('正在准备菜单文件…');

    try {
      if (typeof File === 'function' && typeof navigator.share === 'function') {
        const file = new File([text], fileName, {
          type: 'text/plain;charset=utf-8',
          lastModified: Date.now()
        });
        const shareData = {
          files: [file],
          title: '今天吃什么菜单',
          text: '可保存到“文件”，也可以发送给其他应用或 AI 工具。'
        };
        const canShareFile = typeof navigator.canShare === 'function' && navigator.canShare(shareData);

        if (canShareFile) {
          try {
            await navigator.share(shareData);
            setStatus('系统分享面板已打开，可选择“存储到文件”。', 'success');
            return;
          } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
              setStatus('已取消导出。');
              return;
            }
          }
        }
      }

      downloadFallback(text, fileName);
      setStatus('菜单已导出。文件里包含格式说明和 AI 客制化提示。', 'success');
    } catch (error) {
      setStatus(`导出失败：${error instanceof Error ? error.message : '浏览器无法创建文件。'}`, 'error');
    } finally {
      exportButton.disabled = false;
      exportButton.textContent = originalLabel;
    }
  }

  exportButton.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    void exportForAppleDevices();
  }, { capture: true });
})();
