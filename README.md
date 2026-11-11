# Upriem — 官网

线上预览：<https://www.upriem.com/>

Hugo 静态站点，含首页、产品总览、6 个系列、103 个产品详情页、能力/工厂/联系页、产品画册与规格书 PDF、站内搜索。

## 目录

- `content/` — 页面与产品数据（`content/products/**/index.md`）
- `data/` — 系列、能力等结构化数据
- `layouts/` — 模板与局部组件
- `static/css/upriem.css` — 全站样式
- `static/js/site.js` — 导航、搜索、滚动动效
- `static/images/` — 图片资源（系列卡片与首页主视觉）

## 本地预览

```bash
hugo server -D
```

注意：本地预览会使用 localhost 作为 baseURL，发布前需重新执行正式构建，避免产物里出现 localhost 路径。

## 发布

当前由 `gh-pages` 分支发布（GitHub Pages → legacy 构建）：

```bash
hugo --minify --gc
# 将 public/ 同步到 gh-pages 分支并推送
```

站点地址：`https://www.upriem.com/`
