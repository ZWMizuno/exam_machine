# 考试机 (Exam Machine)

> 一个完全运行在浏览器中的考试与练习系统，支持 Excel/Word 题库导入、错题本、自动评分、即时纠错等特性。无需后端，数据全部存在本地 IndexedDB。

![License](https://img.shields.io/badge/license-MIT-green.svg)
![No Build](https://img.shields.io/badge/build-none-blue.svg)
![Storage](https://img.shields.io/badge/storage-IndexedDB-orange.svg)

---

## ✨ 功能特性

### 🎯 考试与练习
- **考试模式**：计时考试、自动评分、及格判定、历史记录
- **练习模式**：自由练习、可选即时纠错、即时记录错题
- **题型支持**：单选题、多选题、判断题、填空题、简答题
- **题目导航**：题号圆点可视化（已答 / 未答 / 当前 / 正确 / 错误），支持键盘 ← → 切换

### 📚 题库管理
- **多格式导入**：Excel (.xlsx)、Word (.docx)
- **题库集管理**：创建、编辑、删除、查看题库
- **题型配置**：每题分值、选项乱序、考试时长、及格分
- **权限控制**：仅管理员可创建/编辑题库

### 📝 学习辅助
- **错题本**：自动收集错题，按题库分类，错题扫盲模式
- **历史记录**：所有考试/练习的完整记录与回顾
- **试卷生成**：从题库生成可打印试卷
- **书架 (T6)**：浏览/管理学习资料

### 👤 用户系统
- **本地账户**：注册、登录（数据存在 IndexedDB）
- **默认管理员**：`admin` / `admin123`（首次启动自动创建）
- **金币奖励**：答对题目获得金币
- **进度隔离**：考试 session 和练习 session 互不干扰

### 🎨 视觉风格
- **手绘风格登录页**：SVG 涂鸦 + 翻卡动画（登录 ↔ 注册）
- **响应式布局**：适配不同屏幕尺寸

---

## 🚀 快速开始

### 方式一：直接打开（推荐用于个人使用）

```bash
# 直接用浏览器打开 index.html
# 或起一个简单的本地服务器（推荐，避开部分浏览器对 file:// 的限制）
python -m http.server 8080
# 然后访问 http://localhost:8080
```

### 方式二：部署到 GitHub Pages

1. 把代码 push 到 GitHub 仓库
2. Settings → Pages → 选择 `master` 分支
3. 几分钟后访问 `https://<your-username>.github.io/<repo-name>/`

> ⚠️ 必须用 HTTP(S) 协议访问，浏览器在 file:// 下会限制 IndexedDB 和部分 API。

---

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | 原生 HTML / CSS / JavaScript（无构建步骤）|
| UI 库 | [Bootstrap 5.3](https://getbootstrap.com/) + [Bootstrap Icons 1.11](https://icons.getbootstrap.com/) |
| 本地存储 | [Dexie 4](https://dexie.org/)（IndexedDB 封装）|
| 文件解析 | [SheetJS (xlsx)](https://sheetjs.com/) + [docx.js 9](https://docx.js.org/) |
| 压缩 | [JSZip 3.10](https://stuk.github.io/jszip/) |
| 下载 | [FileSaver.js 2](https://github.com/eligrey/FileSaver.js/) |
| 自定义组件 | `customized/` 目录下的独立 HTML/CSS/Vue 实验组件 |

**零依赖构建** — 改完代码刷新页面就能看到效果。

---

## 📂 项目结构

```
exam_machine/
├── index.html              # 入口 HTML
├── manifest.json           # PWA 清单
├── css/
│   └── style.css           # 全局样式（含 doodle 手绘风格、登录页、题库、考试布局等）
├── js/
│   ├── app.js              # 启动入口
│   ├── router.js           # Hash-based SPA 路由
│   ├── state.js            # 全局状态管理
│   ├── auth.js             # 注册/登录/会话恢复
│   ├── db.js               # Dexie 数据库 schema & CRUD
│   ├── utils.js            # toast / modal / 时间格式化等工具
│   ├── components/
│   │   ├── navbar.js              # 顶部导航栏
│   │   ├── breadcrumb.js          # 面包屑
│   │   ├── pagination.js          # 分页器
│   │   ├── question-renderer.js   # 题目渲染（核心组件）
│   │   ├── exam-sidebar.js        # 考试侧边栏（题号圆点导航）
│   │   └── exam-timer.js          # 考试/练习计时器
│   ├── services/
│   │   ├── exam-engine.js   # 会话生成、评分、答案核对
│   │   ├── excel.js         # Excel 导入/导出
│   │   └── paper-gen.js     # 试卷生成
│   └── pages/
│       ├── home.js                # 首页
│       ├── login.js               # 登录/注册（doodle 翻卡）
│       ├── t1-exam-practice.js    # 考试/练习向导
│       ├── t1-session.js          # 考试/练习答题页
│       ├── t2-banks.js            # 题库集管理
│       ├── t2-bank-detail.js      # 题库详情/查看
│       ├── t3-history.js          # 历史记录
│       ├── t4-wrongbook.js        # 错题本
│       ├── t5-paper.js            # 试卷生成
│       └── t6-store.js            # 书架
├── fonts/                  # 思源黑体、Penci Hand 等字体
├── images/                 # 图标、logo
└── customized/             # 独立可复用的自定义组件（实验性）
```

---

## 📥 题库导入格式

### Excel (.xlsx)

支持的标准列：

| 列名 | 说明 |
|------|------|
| 题型 | `single` / `multi` / `tf` / `fill` / `essay` |
| 题号 | 题库内编号 |
| 题目 | 题干 |
| 选项A / B / C / D... | 选项文本 |
| 答案 | 单选填 `A`，多选填 `ABC`，判断填 `true`/`false`，填空填答案文本 |
| 解析 | （可选）题目解析 |

### Word (.docx)

通过自定义解析器从 .docx 中提取题目与选项。

---

## 💾 数据存储

所有数据存在浏览器的 **IndexedDB** 中（通过 Dexie 封装）：

- `users` — 用户账户
- `banks` — 题库
- `questions` — 题目
- `examSessions` — 进行中 / 已提交的会话
- `history` — 历史记录
- `wrongQuestions` — 错题
- `examModes` — 考试模式配置

**清除数据**：浏览器 DevTools → Application → IndexedDB → 删除对应数据库。

**数据迁移**：当前没有内建导出/导入整个数据库的工具，建议重要数据手动从 Excel 重新导入。

---

## 🔐 默认账户

首次启动时自动创建：

| 用户名 | 密码 | 角色 |
|--------|------|------|
| `admin` | `admin123` | 管理员（可创建/编辑题库）|

> 强烈建议登录后立即修改密码（当前版本需要直接改 IndexedDB，可作为后续 feature）。

---

## 🤝 贡献

欢迎提 Issue 和 PR。一些可能的方向：

- ☐ 内建数据库导出/导入（备份恢复）
- ☐ 移动端适配优化
- ☐ 题目图片上传 / OCR 导入
- ☐ 多用户云同步（需要后端）
- ☐ 错题导出为 Anki 卡片

---

## 📝 许可

本项目使用 [MIT License](LICENSE)。

Copyright © 2026 ZWMizuno