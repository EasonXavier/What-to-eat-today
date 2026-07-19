(() => {
  'use strict';

  const STORAGE_KEY = 'meal-picker.categories.v3';
  const HISTORY_KEY = 'meal-picker.history.v3';

  const DEFAULT_CATEGORIES = [
    { id: 'category-01', name: '日本料理', items: [
      { name: '寿司', tags: [] },
      { name: '刺身', tags: [] },
      { name: '日式拉面', tags: [] },
      { name: '乌冬面', tags: [] },
      { name: '荞麦面', tags: [] },
      { name: '天妇罗', tags: ['非正餐'] },
      { name: '烧鸟', tags: ['非正餐'] },
      { name: '铁板烧', tags: ['仅堂食'] },
      { name: '日式咖喱', tags: [] },
      { name: '牛肉丼', tags: [] }
    ] },
    { id: 'category-02', name: '韩国料理', items: [
      { name: '韩式烤肉', tags: [] },
      { name: '韩式拌饭', tags: [] },
      { name: '韩式汤锅', tags: [] },
      { name: '韩式炸鸡', tags: [] },
      { name: '韩式年糕', tags: [] },
      { name: '韩式冷面', tags: [] },
      { name: '部队锅', tags: [] },
      { name: '参鸡汤', tags: [] }
    ] },
    { id: 'category-03', name: '泰国料理', items: [
      { name: '泰式咖喱', tags: [] },
      { name: '冬阴功', tags: [] },
      { name: '泰式炒粉', tags: [] },
      { name: '打抛饭', tags: [] },
      { name: '泰式火锅', tags: ['仅堂食'] },
      { name: '泰式海鲜', tags: [] }
    ] },
    { id: 'category-04', name: '越南料理', items: [
      { name: '越式河粉', tags: [] },
      { name: '越式春卷', tags: ['非正餐'] },
      { name: '越式檬粉', tags: [] },
      { name: '越式烤肉饭', tags: [] },
      { name: '越式鸡饭', tags: [] },
      { name: '越式火锅', tags: ['仅堂食'] }
    ] },
    { id: 'category-05', name: '新马料理', items: [
      { name: '海南鸡饭', tags: [] },
      { name: '肉骨茶', tags: [] },
      { name: '叻沙', tags: [] },
      { name: '椰浆饭', tags: [] },
      { name: '沙嗲', tags: ['非正餐'] },
      { name: '炒粿条', tags: [] },
      { name: '咖喱鱼头', tags: [] }
    ] },
    { id: 'category-06', name: '印度尼西亚料理', items: [
      { name: '印尼炒饭', tags: [] },
      { name: '印尼炒面', tags: [] },
      { name: '巴东饭', tags: [] },
      { name: '仁当牛肉', tags: [] },
      { name: '印尼黄姜饭', tags: [] },
      { name: '印尼烤鸡', tags: [] },
      { name: '印尼烤肉', tags: [] }
    ] },
    { id: 'category-07', name: '川菜', items: [
      { name: '川味火锅', tags: ['仅堂食'] },
      { name: '串串香', tags: [] },
      { name: '冒菜', tags: [] },
      { name: '麻辣烫', tags: [] },
      { name: '麻辣香锅', tags: [] },
      { name: '川味干锅', tags: [] },
      { name: '水煮鱼', tags: [] },
      { name: '酸菜鱼', tags: [] },
      { name: '川味烤鱼', tags: [] },
      { name: '毛血旺', tags: [] },
      { name: '钵钵鸡', tags: ['非正餐'] },
      { name: '辣子鸡', tags: [] },
      { name: '回锅肉', tags: [] },
      { name: '麻婆豆腐', tags: [] },
      { name: '鱼香肉丝', tags: [] },
      { name: '宫保鸡丁', tags: [] },
      { name: '干煸四季豆', tags: [] },
      { name: '盐煎肉', tags: [] },
      { name: '泡椒鸡杂', tags: [] },
      { name: '干煸牛肉丝', tags: [] },
      { name: '担担面', tags: [] },
      { name: '红油抄手', tags: [] }
    ] },
    { id: 'category-08', name: '湘菜', items: [
      { name: '剁椒鱼头', tags: [] },
      { name: '小炒黄牛肉', tags: [] },
      { name: '辣椒炒肉', tags: [] },
      { name: '毛氏红烧肉', tags: [] },
      { name: '腊味合蒸', tags: [] },
      { name: '东安鸡', tags: [] },
      { name: '永州血鸭', tags: [] },
      { name: '口味虾', tags: [] },
      { name: '香干炒肉', tags: [] },
      { name: '外婆菜炒蛋', tags: [] },
      { name: '酸豆角炒肉末', tags: [] },
      { name: '擂辣椒皮蛋', tags: ['非正餐'] },
      { name: '常德米粉', tags: [] },
      { name: '长沙臭豆腐', tags: ['非正餐'] },
      { name: '口味牛蛙', tags: [] },
      { name: '口味花甲', tags: [] },
      { name: '湘西土匪鸭', tags: [] },
      { name: '湘西腊肉', tags: [] },
      { name: '衡东脆肚', tags: [] },
      { name: '醋蒸鸡', tags: [] },
      { name: '火焙鱼', tags: [] },
      { name: '腊八豆炒肉', tags: [] },
      { name: '湘味干锅肥肠', tags: [] }
    ] },
    { id: 'category-09', name: '粤菜', items: [
      { name: '白切鸡', tags: [] },
      { name: '盐焗鸡', tags: [] },
      { name: '豉油鸡', tags: [] },
      { name: '脆皮乳鸽', tags: [] },
      { name: '菠萝咕噜肉', tags: [] },
      { name: '啫啫煲', tags: [] },
      { name: '豉汁蒸排骨', tags: [] },
      { name: '梅菜扣肉', tags: [] },
      { name: '清蒸石斑鱼', tags: [] },
      { name: '白灼虾', tags: [] },
      { name: '椒盐濑尿虾', tags: [] },
      { name: '蒜蓉粉丝蒸扇贝', tags: [] },
      { name: '上汤焗龙虾', tags: [] },
      { name: '猪肚鸡', tags: [] },
      { name: '老火靓汤', tags: [] },
      { name: '煲仔饭', tags: [] },
      { name: '干炒牛河', tags: [] },
      { name: '云吞面', tags: [] },
      { name: '艇仔粥', tags: [] },
      { name: '肠粉', tags: [] },
      { name: '虾饺', tags: ['非正餐'] },
      { name: '干蒸烧卖', tags: ['非正餐'] },
      { name: '叉烧包', tags: ['非正餐'] },
      { name: '豉汁蒸凤爪', tags: ['非正餐'] },
      { name: '萝卜糕', tags: ['非正餐'] },
      { name: '双皮奶', tags: ['非正餐'] }
    ] },
    { id: 'category-10', name: '鲁菜', items: [
      { name: '九转大肠', tags: [] },
      { name: '糖醋鲤鱼', tags: [] },
      { name: '葱烧海参', tags: [] },
      { name: '油爆双脆', tags: [] },
      { name: '爆炒腰花', tags: [] },
      { name: '四喜丸子', tags: [] },
      { name: '锅塌豆腐', tags: [] },
      { name: '糟溜鱼片', tags: [] },
      { name: '奶汤蒲菜', tags: [] },
      { name: '德州扒鸡', tags: [] },
      { name: '济南把子肉', tags: [] },
      { name: '鲅鱼水饺', tags: [] },
      { name: '海肠捞饭', tags: [] },
      { name: '油焖大虾', tags: [] },
      { name: '单县羊肉汤', tags: [] },
      { name: '潍坊肉火烧', tags: [] },
      { name: '山东煎饼', tags: ['非正餐'] },
      { name: '淄博烧烤', tags: ['仅堂食'] }
    ] },
    { id: 'category-11', name: '东北菜', items: [
      { name: '锅包肉', tags: [] },
      { name: '溜肉段', tags: [] },
      { name: '地三鲜', tags: [] },
      { name: '尖椒干豆腐', tags: [] },
      { name: '东北大拉皮', tags: [] },
      { name: '小鸡炖蘑菇', tags: [] },
      { name: '猪肉炖粉条', tags: [] },
      { name: '排骨炖豆角', tags: [] },
      { name: '酸菜白肉锅', tags: [] },
      { name: '杀猪菜', tags: [] },
      { name: '铁锅炖大鹅', tags: [] },
      { name: '铁锅炖鱼', tags: [] },
      { name: '东北乱炖', tags: [] },
      { name: '东北酱骨头', tags: [] },
      { name: '东北熏酱', tags: [] },
      { name: '东北烧烤', tags: ['仅堂食'] },
      { name: '东北饭包', tags: [] },
      { name: '烤冷面', tags: ['非正餐'] }
    ] },
    { id: 'category-12', name: '西北菜', items: [
      { name: '肉夹馍', tags: [] },
      { name: '羊肉泡馍', tags: [] },
      { name: '岐山臊子面', tags: [] },
      { name: '油泼面', tags: [] },
      { name: 'Biangbiang面', tags: [] },
      { name: '陕西凉皮', tags: ['非正餐'] },
      { name: '兰州牛肉面', tags: [] },
      { name: '甘肃酿皮', tags: ['非正餐'] },
      { name: '宁夏手抓羊肉', tags: [] },
      { name: '烩羊杂', tags: [] },
      { name: '青海炕锅羊肉', tags: [] },
      { name: '青海土火锅', tags: ['仅堂食'] },
      { name: '西宁羊肠面', tags: [] }
    ] },
    { id: 'category-13', name: '云贵菜', items: [
      { name: '过桥米线', tags: [] },
      { name: '云南小锅米线', tags: [] },
      { name: '汽锅鸡', tags: [] },
      { name: '云南菌子火锅', tags: ['仅堂食'] },
      { name: '傣味手抓饭', tags: [] },
      { name: '云南包烧', tags: [] },
      { name: '宜良烤鸭', tags: [] },
      { name: '贵州酸汤鱼', tags: [] },
      { name: '贵州辣子鸡', tags: [] }
    ] },
    { id: 'category-14', name: '湖北菜', items: [
      { name: '清蒸武昌鱼', tags: [] },
      { name: '排骨藕汤', tags: [] },
      { name: '珍珠圆子', tags: [] },
      { name: '黄陂三鲜', tags: [] },
      { name: '潜江油焖大虾', tags: [] },
      { name: '潜江蒜蓉大虾', tags: [] },
      { name: '公安牛肉', tags: [] },
      { name: '恩施腊肉', tags: [] },
      { name: '襄阳牛肉面', tags: [] },
      { name: '武汉热干面', tags: [] },
      { name: '三鲜豆皮', tags: [] },
      { name: '糊汤粉', tags: [] },
      { name: '面窝', tags: ['非正餐'] },
      { name: '武汉鸭脖', tags: ['非正餐'] }
    ] },
    { id: 'category-15', name: '潮汕菜', items: [
      { name: '潮汕牛肉火锅', tags: ['仅堂食'] },
      { name: '潮州卤水', tags: [] },
      { name: '潮汕生腌', tags: [] },
      { name: '潮汕砂锅粥', tags: [] },
      { name: '牛肉粿条', tags: [] },
      { name: '潮汕牛肉丸', tags: ['非正餐'] },
      { name: '潮汕鱼饭', tags: [] }
    ] },
    { id: 'category-16', name: '台湾菜', items: [
      { name: '台式卤肉饭', tags: [] },
      { name: '台式牛肉面', tags: [] },
      { name: '台南担仔面', tags: [] },
      { name: '三杯鸡', tags: [] },
      { name: '麻油鸡', tags: [] },
      { name: '盐酥鸡', tags: ['非正餐'] },
      { name: '台式鸡排', tags: ['非正餐'] },
      { name: '台式卤味', tags: [] },
      { name: '大肠包小肠', tags: ['非正餐'] }
    ] },
    { id: 'category-17', name: '香港菜', items: [
      { name: '港式烧鹅', tags: [] },
      { name: '蜜汁叉烧', tags: [] },
      { name: '脆皮烧肉', tags: [] },
      { name: '港式烧味饭', tags: [] },
      { name: '焗猪扒饭', tags: [] },
      { name: '港式滑蛋饭', tags: [] },
      { name: '港式炒公仔面', tags: [] },
      { name: '港式车仔面', tags: [] },
      { name: '港式打边炉', tags: ['仅堂食'] },
      { name: '避风塘炒蟹', tags: [] },
      { name: '避风塘炒虾', tags: [] },
      { name: '菠萝油', tags: ['非正餐'] },
      { name: '咖喱鱼蛋', tags: ['非正餐'] },
      { name: '碗仔翅', tags: ['非正餐'] },
      { name: '鸡蛋仔', tags: ['非正餐'] }
    ] },
    { id: 'category-18', name: '新疆菜', items: [
      { name: '新疆大盘鸡', tags: [] },
      { name: '新疆辣子鸡', tags: [] },
      { name: '新疆椒麻鸡', tags: [] },
      { name: '羊肉抓饭', tags: [] },
      { name: '新疆拌面', tags: [] },
      { name: '过油肉拌面', tags: [] },
      { name: '新疆炒米粉', tags: [] },
      { name: '烤羊肉串', tags: [] },
      { name: '新疆馕', tags: ['非正餐'] },
      { name: '新疆羊杂碎', tags: [] }
    ] },
    { id: 'category-19', name: '地中海料理', items: [
      { name: '穆萨卡', tags: [] },
      { name: '土耳其烤肉饭', tags: [] },
      { name: '土耳其肉丸', tags: [] },
      { name: '沙威玛', tags: [] }
    ] },
    { id: 'category-20', name: '北欧料理', items: [
      { name: '瑞典肉丸', tags: [] },
      { name: '丹麦开放式三明治', tags: [] },
      { name: '北欧三文鱼汤', tags: [] },
      { name: '北欧烟熏三文鱼', tags: [] },
      { name: '丹麦热狗', tags: ['非正餐'] },
      { name: '北欧炖肉', tags: [] }
    ] },
    { id: 'category-21', name: '东欧料理', items: [
      { name: '乌克兰红菜汤', tags: [] },
      { name: '俄式酸奶油炖牛肉', tags: [] },
      { name: '俄式饺子', tags: [] },
      { name: '波兰香肠', tags: [] },
      { name: '匈牙利牛肉汤', tags: [] },
      { name: '匈牙利红椒鸡', tags: [] },
      { name: '捷克奶油炖牛肉', tags: [] }
    ] },
    { id: 'category-22', name: '意大利料理', items: [
      { name: '意式披萨', tags: [] },
      { name: '意式肉酱面', tags: [] },
      { name: '奶油培根意面', tags: [] },
      { name: '青酱意面', tags: [] },
      { name: '海鲜意面', tags: [] },
      { name: '辣味番茄意面', tags: [] },
      { name: '意式千层面', tags: [] },
      { name: '意式烩饭', tags: [] },
      { name: '意式饺子', tags: [] },
      { name: '意式土豆团子', tags: [] },
      { name: '意式焗茄子', tags: [] },
      { name: '意式炸饭团', tags: [] },
      { name: '米兰炸猪排', tags: [] },
      { name: '佛罗伦萨牛排', tags: [] },
      { name: '意式炖牛膝', tags: [] },
      { name: '意式肉丸', tags: [] },
      { name: '意式海鲜汤', tags: [] },
      { name: '意式帕尼尼', tags: [] }
    ] },
    { id: 'category-23', name: '西班牙料理', items: [
      { name: '西班牙海鲜饭', tags: [] },
      { name: '西班牙墨鱼饭', tags: [] },
      { name: '西班牙烩饭', tags: [] },
      { name: '西班牙土豆饼', tags: [] },
      { name: '伊比利亚火腿', tags: ['非正餐'] },
      { name: '西班牙香肠', tags: ['非正餐'] },
      { name: '蒜香橄榄油虾', tags: ['非正餐'] },
      { name: '西班牙蒜香蘑菇', tags: ['非正餐'] }
    ] },
    { id: 'category-24', name: '法国料理', items: [
      { name: '法式牛排', tags: [] },
      { name: '惠灵顿牛排', tags: [] },
      { name: '勃艮第红酒炖牛肉', tags: [] },
      { name: '法式香煎鸭胸', tags: [] },
      { name: '法式烤鸡', tags: [] },
      { name: '法式羊排', tags: [] },
      { name: '法式焗蜗牛', tags: ['非正餐'] },
      { name: '法式鹅肝', tags: ['非正餐'] },
      { name: '法式海鲜汤', tags: [] },
      { name: '法式煎鳕鱼', tags: [] },
      { name: '法式焗扇贝', tags: [] },
      { name: '法式洋葱汤', tags: [] },
      { name: '普罗旺斯炖菜', tags: [] }
    ] },
    { id: 'category-25', name: '英国料理', items: [
      { name: '香肠土豆泥', tags: [] },
      { name: '英式鸡肉派', tags: [] }
    ] },
    { id: 'category-26', name: '德国料理', items: [
      { name: '德式猪肘', tags: [] },
      { name: '德式香肠拼盘', tags: ['仅堂食'] },
      { name: '德式咖喱香肠', tags: [] },
      { name: '德式炸猪排', tags: [] },
      { name: '德式烤猪肉', tags: [] },
      { name: '德式烤鸡', tags: [] },
      { name: '德式酸烤牛肉', tags: [] },
      { name: '德式牛肉卷', tags: [] },
      { name: '德式肉丸', tags: [] },
      { name: '德式炖牛肉', tags: [] }
    ] },
    { id: 'category-27', name: '美国料理', items: [
      { name: '美式汉堡', tags: [] },
      { name: '美式热狗', tags: ['非正餐'] },
      { name: '美式炸鸡', tags: [] },
      { name: '美式烤肋排', tags: [] },
      { name: '德州烟熏牛胸肉', tags: [] },
      { name: '美式手撕猪肉', tags: [] },
      { name: '美式牛排', tags: [] },
      { name: '费城芝士牛肉三明治', tags: [] },
      { name: '龙虾卷', tags: [] },
      { name: '美式通心粉奶酪', tags: [] },
      { name: '美式蛤蜊浓汤', tags: [] },
      { name: '纽约披萨', tags: [] },
      { name: '芝加哥深盘披萨', tags: [] }
    ] },
    { id: 'category-28', name: '墨西哥料理', items: [
      { name: '墨西哥塔可', tags: [] },
      { name: '墨西哥卷饼', tags: [] },
      { name: '墨西哥卷饼碗', tags: [] },
      { name: '墨西哥芝士饼', tags: [] },
      { name: '墨西哥玉米片', tags: ['非正餐'] },
      { name: '墨西哥比利亚炖肉', tags: [] },
      { name: '墨西哥辣椒酿肉', tags: [] },
      { name: '墨西哥玉米浓汤', tags: [] }
    ] },
    { id: 'category-29', name: '巴西料理', items: [
      { name: '巴西烤肉', tags: ['仅堂食'] },
      { name: '巴西臀尖牛排', tags: [] },
      { name: '巴西烤鸡', tags: [] },
      { name: '巴西烤香肠', tags: [] },
      { name: '巴西黑豆炖肉', tags: [] },
      { name: '巴西椰奶炖虾', tags: [] },
      { name: '巴西鸡肉焖饭', tags: [] },
      { name: '巴西牛肉干焖饭', tags: [] },
      { name: '巴西木薯牛肉煲', tags: [] }
    ] },
    { id: 'category-30', name: '阿根廷料理', items: [
      { name: '阿根廷烤肋排', tags: [] },
      { name: '阿根廷烤香肠', tags: [] },
      { name: '阿根廷炖牛肉', tags: [] }
    ] }
  ];

  function hasUsableDish(value) {
    return Array.isArray(value) && value.some(category =>
      Array.isArray(category?.items) && category.items.some(item =>
        String(typeof item === 'string' ? item : item?.name ?? '').trim()
      )
    );
  }

  function restoreDefaults() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null || !hasUsableDish(JSON.parse(raw))) restoreDefaults();
  } catch {
    try {
      restoreDefaults();
    } catch {
      // 主程序仍会尝试读取 window.MEAL_PICKER_DEFAULTS。
    }
  }

  try {
    if (localStorage.getItem(HISTORY_KEY) === null) localStorage.setItem(HISTORY_KEY, '[]');
  } catch {
    // 主程序无法持久化时仍可在当前页面使用内置菜单。
  }

  window.MEAL_PICKER_DEFAULTS = DEFAULT_CATEGORIES;
})();
