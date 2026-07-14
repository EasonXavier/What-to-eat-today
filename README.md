# 今天吃什么

一个不依赖框架和后端的静态随机用餐选择器，可直接部署到 GitHub Pages。

## 功能

- 随机抽取用餐选项
- 尽量避开最近 3 次结果
- 在网页中添加和删除备选项
- 保存最近 10 次抽取记录
- 浅色 / 深色模式
- 数据保存在浏览器 `localStorage`
- 手机和桌面端自适应

## 本地打开

直接双击 `index.html` 即可。部分浏览器在本地文件模式下可能限制存储，建议使用简单的静态服务器：

```bash
python -m http.server 8000
```

然后打开 `http://localhost:8000`。

## 部署到 GitHub Pages

1. 新建一个 GitHub 仓库。
2. 将本目录内的文件上传到仓库根目录。
3. 打开仓库的 **Settings → Pages**。
4. 在 **Build and deployment** 中选择 **Deploy from a branch**。
5. Branch 选择 `main`，目录选择 `/ (root)`，保存。

通常几分钟后，页面会发布在：

`https://你的用户名.github.io/仓库名/`

## 修改默认备选项

编辑 `app.js` 顶部的 `DEFAULT_ITEMS` 数组。已经在浏览器中使用过网页时，旧清单会优先从浏览器存储中读取；可点击网页中的“恢复示例”加载新的默认值。
