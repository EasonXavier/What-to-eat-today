(() => {
  'use strict';

  const STORAGE_KEY = 'meal-picker.categories.v2';

  const FIRST_DEFAULT_CATEGORIES = [
    { id: 'rice', name: '米饭类', items: ['盖饭', '炒饭'] },
    { id: 'noodles', name: '面食类', items: ['牛肉面', '饺子或馄饨'] },
    { id: 'hotpot', name: '锅物类', items: ['火锅', '麻辣烫'] },
    { id: 'fast-food', name: '快餐类', items: ['汉堡', '炸鸡'] }
  ];

  const PREVIOUS_DEFAULT_CATEGORIES = [
    { id: 'hunan', name: '湘菜与下饭菜', items: ['小炒黄牛肉', '辣椒炒肉', '剁椒鱼头', '农家一碗香', '酸辣鸡杂', '干锅花菜'] },
    { id: 'sichuan', name: '川菜与麻辣', items: ['水煮牛肉', '辣子鸡', '毛血旺', '麻婆豆腐', '酸菜鱼', '冒菜'] },
    { id: 'grilled-fish', name: '烤鱼', items: ['重麻辣鮰鱼', '青花椒鮰鱼', '藤椒凌波鱼', '酸菜淮王鱼', '蒜香鮰鱼', '豆豉烤鱼', '鲜椒烤鱼'] },
    { id: 'sashimi', name: '日料与刺身', items: ['三文鱼刺身', '金枪鱼刺身', '北极贝刺身', '综合刺身拼盘', '寿司拼盘', '日式鳗鱼饭'] },
    { id: 'yakiniku', name: '日式烤肉', items: ['和牛烤肉', '牛舌', '烤内脏', '石锅拌饭', '冷面', '泡菜烤肉套餐'] },
    { id: 'hotpot', name: '火锅与锅物', items: ['重庆火锅', '潮汕牛肉火锅', '椰子鸡', '猪肚鸡', '麻辣香锅', '麻辣烫'] },
    { id: 'rice', name: '米饭与盖饭', items: ['黄焖鸡米饭', '卤肉饭', '咖喱饭', '烧腊双拼饭', '牛肉盖饭', '炒饭'] },
    { id: 'noodles', name: '粉面与饺子', items: ['牛肉面', '重庆小面', '螺蛳粉', '米粉', '馄饨', '饺子'] },
    { id: 'bbq', name: '烧烤与烤肉', items: ['中式烧烤', '烤羊肉串', '烤生蚝', '韩式烤肉', '烤鸡', '烤串拼盘'] },
    { id: 'seafood', name: '海鲜', items: ['生腌海鲜', '白灼虾', '清蒸鱼', '蒜蓉扇贝', '海鲜煲', '海鲜粥'] },
    { id: 'fast-food', name: '西式快餐', items: ['麦当劳', '汉堡王', '炸鸡', '披萨', '热狗', '三明治'] },
    { id: 'western', name: '西餐', items: ['牛排', '意大利面', '焗饭', '西式烤鸡', '凯撒沙拉', '奶油蘑菇汤'] },
    { id: 'lean-protein', name: '清淡与高蛋白', items: ['三文鱼沙拉', '金枪鱼沙拉', '鸡胸肉套餐', '清汤牛肉', '蒸蛋套餐', '轻食碗'] },
    { id: 'convenience', name: '便利与速食', items: ['便利店便当', '预制菜', '速冻饺子', '泡面加蛋', '自热米饭', '简单外卖套餐'] }
  ];

  const DEFAULT_CATEGORIES = [
    { id: 'hunan', name: '湘菜与下饭菜', items: ['小炒黄牛肉', '辣椒炒肉', '剁椒鱼头', '农家一碗香', '酸辣鸡杂', '干锅花菜'] },
    { id: 'sichuan', name: '川菜与麻辣', items: ['水煮牛肉', '辣子鸡', '毛血旺', '麻婆豆腐', '酸菜鱼', '冒菜'] },
    { id: 'grilled-fish', name: '烤鱼', items: ['重麻辣鮰鱼', '青花椒鮰鱼', '藤椒凌波鱼', '酸菜淮王鱼', '蒜香鮰鱼', '豆豉烤鱼', '鲜椒烤鱼'] },
    { id: 'sashimi', name: '日料与刺身', items: ['三文鱼刺身', '金枪鱼刺身', '北极贝刺身', '综合刺身拼盘', '寿司拼盘', '日式鳗鱼饭'] },
    { id: 'yakiniku', name: '日式烤肉', items: ['和牛烤肉', '牛舌', '烤内脏', '石锅拌饭', '冷面', '泡菜烤肉套餐'] },
    { id: 'hotpot', name: '火锅与锅物', items: ['重庆火锅', '潮汕牛肉火锅', '椰子鸡', '猪肚鸡', '麻辣香锅', '麻辣烫'] },
    { id: 'rice', name: '米饭与盖饭', items: ['黄焖鸡米饭', '卤肉饭', '咖喱饭', '烧腊双拼饭', '牛肉盖饭', '炒饭'] },
    { id: 'noodles', name: '粉面与饺子', items: ['牛肉面', '重庆小面', '螺蛳粉', '米粉', '馄饨', '饺子'] },
    { id: 'bbq', name: '烧烤与烤肉', items: ['中式烧烤', '烤羊肉串', '烤生蚝', '韩式烤肉', '烤鸡', '烤串拼盘'] },
    { id: 'seafood', name: '海鲜', items: ['生腌海鲜', '白灼虾', '清蒸鱼', '蒜蓉扇贝', '海鲜煲', '海鲜粥'] },
    { id: 'fast-food', name: '西式快餐', items: ['麦当劳', '汉堡王', '肯德基', '炸鸡', '热狗', '鸡肉卷'] },
    { id: 'italian-pasta', name: '意大利面与焗饭', items: ['经典肉酱意面', '奶油培根意面', '黑椒牛柳意面', '海鲜意面', '番茄鸡肉意面', '意式千层面', '芝士焗饭'] },
    { id: 'pizza', name: '披萨', items: ['玛格丽特披萨', '意式香肠披萨', '海鲜披萨', '四种芝士披萨', '烤鸡披萨', '夏威夷披萨', '黑椒牛肉披萨'] },
    { id: 'steak-grill', name: '牛排与西式扒饭', items: ['黑椒牛排饭', '西冷牛排套餐', '菲力牛排套餐', '鸡扒饭', '猪扒饭', '双拼扒饭'] },
    { id: 'continental', name: '欧陆简餐', items: ['炸鱼薯条', '德式香肠拼盘', '烤猪肋排', '西式烤鸡', '奶油蘑菇汤配面包', '西式烤肉拼盘'] }
  ];

  function normalize(value) {
    if (!Array.isArray(value)) return [];
    return value.map(category => ({
      name: String(category?.name ?? '').trim(),
      items: Array.isArray(category?.items) ? category.items.map(item => String(item).trim()) : []
    }));
  }

  function signature(value) {
    return JSON.stringify(normalize(value));
  }

  function migrateKnownDefaults() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
        return;
      }

      const saved = JSON.parse(raw);
      const savedSignature = signature(saved);
      const isKnownDefault = [FIRST_DEFAULT_CATEGORIES, PREVIOUS_DEFAULT_CATEGORIES]
        .some(defaultSet => signature(defaultSet) === savedSignature);

      if (isKnownDefault) localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
    } catch {
      // localStorage 或旧数据不可用时，交由主程序按原逻辑处理。
    }
  }

  function interceptResetButton() {
    const button = document.querySelector('#resetButton');
    if (!button) return;

    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();

      const confirmed = window.confirm('恢复默认列表会覆盖当前全部一级分类和二级选项，是否继续？');
      if (!confirmed) return;

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
        window.location.reload();
      } catch {
        window.alert('浏览器无法保存默认列表，请检查站点存储权限。');
      }
    }, { capture: true });
  }

  migrateKnownDefaults();
  interceptResetButton();
})();
