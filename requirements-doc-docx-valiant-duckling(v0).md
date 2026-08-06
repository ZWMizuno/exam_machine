# 实施方案：网页版考试机

## 背景

基于需求文档 `requirements_doc.docx`，构建一个**纯客户端**考试机单页应用。该应用完全在浏览器中运行——无后端、无构建工具、无框架依赖。所有数据通过 IndexedDB 持久化存储。目标用户为中文用户，功能涵盖题库管理、考试/练习作答、错题追踪以及 Word 试卷生成。

**目的：** 需求文档规定了一个完整的独立考试系统。纯网页实现支持即时部署（打开 `index.html` 即可），无需服务器。

**预期成果：** 一个 `index.html` + 若干 JS/CSS 文件，提供全部 5 大模块（T1-T5），支持基于角色的权限控制、Excel 导入/导出和 Word 试卷生成。

---

## 1. 最终文件结构

```
e:\Myprojects\exam_machine\
├── index.html                       # SPA 外壳（CDN 链接 + 挂载点）
├── css\
│   └── style.css                    # 所有自定义样式（Bootstrap 覆盖 + 自定义组件）
├── js\
│   ├── app.js                       # 启动入口：初始化 DB、检查登录状态、挂载路由
│   ├── db.js                        # Dexie.js Schema + 所有 CRUD 辅助函数
│   ├── router.js                    # 基于 Hash 的路由，含登录/角色守卫
│   ├── auth.js                      # 登录、注册、登出、会话恢复
│   ├── state.js                     # 简易发布/订阅事件总线
│   ├── utils.js                     # Toast、Modal、格式化工具、洗牌、常量
│   ├── components\
│   │   ├── navbar.js                # 顶部导航栏（角色感知）
│   │   ├── breadcrumb.js            # 可点击的面包屑导航
│   │   ├── pagination.js            # 可复用的分页组件
│   │   ├── exam-sidebar.js          # 左侧题目导航栏（可折叠、圆形序号）
│   │   ├── exam-timer.js            # 倒计时（考试）/ 正计时（练习）
│   │   └── question-renderer.js     # 按题型渲染题目（全部 5 种题型）
│   ├── pages\
│   │   ├── login.js                 # 登录 / 注册页面
│   │   ├── home.js                  # 欢迎首页
│   │   ├── t1-exam-practice.js      # T1 入口 + 考试/练习向导
│   │   ├── t1-session.js            # 共用的考试/练习作答界面
│   │   ├── t2-banks.js              # T2 题库列表（搜索、分页、批量操作）
│   │   ├── t2-bank-detail.js        # T2.2/T2.3 编辑与查看题库
│   │   ├── t3-history.js            # T3 历史记录列表
│   │   ├── t4-wrongbook.js          # T4 2×4 网格 + T4.x 详情 + T4.x.1 扫盲
│   │   └── t5-paper.js              # T5 试卷生成三步向导
│   └── services\
│       ├── excel.js                 # Excel 导入/导出/模板（SheetJS）
│       ├── exam-engine.js           # 考试会话生成、评分、答案比对
│       └── paper-gen.js             # Word (.docx) 生成 + ZIP 打包
```

**总计约 25 个文件。** 每个文件职责单一。

### 面包屑路由层级

```
#/home                        → 首页
#/t1                          → 首页 > 考试&练习
#/t1/exam                     → 首页 > 考试&练习 > 考试模式
#/t1/practice                 → 首页 > 考试&练习 > 练习模式
#/t1/session                  → 首页 > 考试&练习 > [考试|练习]中
#/t2                          → 首页 > 题库集
#/t2/add                      → 首页 > 题库集 > 新增题库
#/t2/edit/:id                 → 首页 > 题库集 > 《题库名称》
#/t2/view/:id                 → 首页 > 题库集 > 《题库名称》
#/t3                          → 首页 > 历史记录
#/t4                          → 首页 > 错题集
#/t4/:bankId                  → 首页 > 错题集 > 《题库名称》
#/t4/:bankId/review           → 首页 > 错题集 > 《题库名称》 > 错题扫盲
#/t5                          → 首页 > 试卷生成
```

除最后一段外，每段均可点击跳转。登录/注册页面隐藏面包屑。

---

## 2. CDN 依赖库

全部在 `index.html` 的 `<head>` / `<body>` 末尾加载：

| 库 | 版本 | URL | 全局变量 |
|---|------|-----|---------|
| Bootstrap CSS | 5.3.3 | `cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css` | — |
| Bootstrap Icons | 1.11.3 | `cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css` | — |
| Bootstrap JS | 5.3.3 | `cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js` | `bootstrap` |
| Dexie.js | 4.0.4 | `cdn.jsdelivr.net/npm/dexie@4.0.4/dist/dexie.js` | `Dexie` |
| SheetJS | 0.20.2 | `cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js` | `XLSX` |
| docx | 9.0.2 | `unpkg.com/docx@9.0.2/build/index.umd.js` | `docx` |
| JSZip | 3.10.1 | `cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js` | `JSZip` |
| FileSaver | 2.0.5 | `cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js` | `saveAs` |

**设计理由：** 选择 Bootstrap 是为了快速构建响应式 UI（模态框、消息提示、标签页、表单、栅格）。选择 Dexie.js 而非原生 IndexedDB，因为其查询语法更简洁、支持复合索引。不使用 React/Vue/Angular —— 纯原生 JS + ES 模块。

---

## 3. IndexedDB Schema（Dexie.js）

```javascript
const db = new Dexie("ExamMachineDB");

db.version(1).stores({
  users:          "++id, &username",
  banks:          "++id, name",
  questions:      "++id, bankId, [bankId+type], type",
  examModes:      "++id, bankId",
  examSessions:   "++id, userId",       // 用于刷新恢复
  history:        "++id, userId, bankId, createdAt",
  wrongQuestions: "++id, [userId+bankId], userId, bankId, questionId"
});
```

### 各表详情

**users** — `{ id, username, passwordHash, role: 'admin'|'user', createdAt }`

**banks** — `{ id, name, createdAt, updatedAt }`

**questions** — `{ id, bankId, type: 'single'|'multi'|'tf'|'fill'|'essay', number, content, options: {A, B, ...}, answer: string|string[], fillBlankCount }`
- 复合索引 `[bankId+type]` 用于快速分类查询

**examModes** — `{ id, bankId, name, durationMinutes, passScore, configs: [{type, count, points, shuffleOptions}], totalScore }`

**examSessions** — `{ id, userId, type: 'exam'|'practice', bankId, bankName, modeId, questions[], userAnswers: {}, startTime, durationSeconds, elapsedSeconds, instantFeedback, submitted }`
- 用于活跃会话的刷新恢复

**history** — `{ id, userId, bankId, bankName, type, modeName, score, totalScore, correctCount, totalCount, wrongQuestionIds[], date }`

**wrongQuestions** — `{ id, userId, questionId, bankId, type, number, content, options, answer, wrongCount, correctStreak: 0-3, lastWrongDate }`
- **冗余存储：** 对题目数据做快照，即使原题被编辑或删除，错题记录依然完整
- 复合索引 `[userId+bankId]` 用于按用户+题库查询

---

## 4. 路由表

| Hash | 页面 | 需登录 | 角色 | 说明 |
|------|------|--------|------|------|
| `#/login` | login.js | 否 | — | 登录 / 注册表单 |
| `#/home` | home.js | 是 | 全部 | 欢迎首页 |
| `#/t1` | t1-exam-practice.js | 是 | 全部 | T1 入口（考试/练习按钮） |
| `#/t1/exam` | t1-exam-practice.js | 是 | 全部 | 考试向导（选题库→选模式→开始） |
| `#/t1/practice` | t1-exam-practice.js | 是 | 全部 | 练习向导（选题库→配置→开始） |
| `#/t1/session` | t1-session.js | 是 | 全部 | 活跃的考试/练习界面 |
| `#/t2` | t2-banks.js | 是 | 全部 | 题库列表 |
| `#/t2/add` | t2-banks.js | 是 | 管理员 | 导入题库 |
| `#/t2/edit/:id` | t2-bank-detail.js | 是 | 管理员 | 编辑题库 |
| `#/t2/view/:id` | t2-bank-detail.js | 是 | 全部 | 查看题库（只读） |
| `#/t3` | t3-history.js | 是 | 全部 | 历史记录 |
| `#/t4` | t4-wrongbook.js | 是 | 全部 | 错题本网格 |
| `#/t4/:bankId` | t4-wrongbook.js | 是 | 全部 | 错题详情 |
| `#/t4/:bankId/review` | t4-wrongbook.js | 是 | 全部 | 错题扫盲模式 |
| `#/t5` | t5-paper.js | 是 | 全部 | 试卷生成向导 |

**路由守卫：** 未登录 → 跳转至 `#/login`。非管理员访问管理路由 → 提示"权限不足" + 跳转至 `#/home`。

---

## 5. 组件职责说明

### 核心基础设施

- **`app.js`**：DOMContentLoaded → 初始化数据库 → 检查已存登录状态 → 挂载路由 → 渲染页面外壳
- **`db.js`**：Dexie 初始化 + 所有表的 CRUD 函数。所有写操作包裹在事务中。
- **`router.js`**：基于 Hash 的路由。从路由模式中解析 `:params` 参数。切换页面时先调用旧页面的 `destroy()`，再渲染新页面。守卫登录/角色权限。更新面包屑。
- **`auth.js`**：`register()`、`login()`、`logout()`、`getCurrentUser()`、`isAdmin()`。密码通过 `crypto.subtle.digest('SHA-256', ...)` 哈希。首次运行自动创建默认管理员（`admin` / `admin123`）。会话持久化至 `localStorage`。
- **`state.js`**：发布/订阅模式：`subscribe(event, fn)`、`emit(event, data)`、`getState()`、`setState(partial)`。事件包括：`auth:changed`、`route:changed`、`toast:show`、`bank:updated`。
- **`utils.js`**：Toast 封装（Bootstrap Toast）、Modal 封装（Bootstrap Modal）、`formatTime()`、`shuffle()`、`escapeHtml()`、`generateId()`、判断题映射常量、题型标签。

### 可复用组件

- **`navbar.js`**：渲染 Bootstrap 导航栏。Logo 点击回首页，T1-T5 链接带高亮激活态。右侧显示：用户名 + 退出按钮。登录页隐藏。
- **`breadcrumb.js`**：从 `state.breadcrumb` 渲染 Bootstrap 面包屑。最后一段不可点击。登录页隐藏。
- **`pagination.js`**：`render(container, {total, pageSize, current, onChange})`。显示首页/上一页/页码/下一页/末页 + 跳转输入框。处理边界情况（0 页、1 页）。
- **`exam-sidebar.js`**：左侧边栏，按题型分类可折叠。题目序号圆圈：浅蓝填充 = 已作答，空心 = 未作答，绿色 = 正确（即时纠错），红色 = 错误（即时纠错）。点击可跳转。底部显示图例。
- **`exam-timer.js`**：基于绝对时间（无漂移）。考试模式：倒计时 + 到期自动提交。练习模式：正计时。格式：`MM:SS`。处理 visibilitychange 以应对标签页后台运行。
- **`question-renderer.js`**：按题型渲染题目 —— 单选按钮（单选题/判断题）、复选框（多选题）、N 个文本输入（填空题）、文本域（问答题）。支持 readOnly、showAnswer、instantFeedback 模式。扫盲模式的三盏灯显示。提供 `getAnswer()` 提取答案。

### 页面

- **`login.js`**：登录和注册表单之间切换标签页。验证输入。成功 → 跳转首页。
- **`home.js`**：欢迎信息 + 统计卡片（题库数、题目数、考试次数、错题数）+ 快捷操作按钮。
- **`t1-exam-practice.js`**：T1 入口 + 考试向导 + 练习向导。管理步骤状态。考试模式：选题库下拉框 → 选择模式下拉框或"新增模式"表单（名称默认"Model A/B/C..."、考试时长、及格分数、题型配置含最大数量校验、自动计算总分、选项乱序开关）→ "开始考试"。练习模式：选题库下拉框 → 题型配置含题号范围输入（默认 1–题库总数）、选项乱序开关 → "开始练习"。均委托 `exam-engine.js` 生成会话。
- **`t1-session.js`**：核心作答界面。挂载侧边栏 + 计时器 + 题目区 + 导航按钮。处理：上一题/下一题导航、答案保存至会话存储（500ms 防抖）、即时纠错开关（练习模式）、提交流程（确认弹窗 → 评分 → 历史/错题记录 → 结果弹窗）、刷新恢复（从 `examSessions` 恢复）。"结束考试/练习" 按钮含确认。`destroy()` 停止计时器并保存状态。
- **`t2-banks.js`**：题库列表，含搜索、分页（每页 10 条）。管理员：新增/批量导出/批量删除按钮 + 每行编辑/查看/删除/导出图标。普通用户：仅导出 + 查看。导入弹窗：模板下载链接 + 拖拽上传区 + 文件列表及命名字段 + "确认导入"按钮。调用 `excel.js` 进行解析。
- **`t2-bank-detail.js`**：编辑模式（管理员）和查看模式（所有用户）。题型标签页、搜索、分页列表（每页 20 条）。编辑：行内编辑。"确认修改"按钮 → 差异摘要弹窗 → 保存。查看：只读。均含导出按钮。
- **`t3-history.js`**：可按题库、按类型筛选的分页表格：日期、类型标识、题库名称、得分、正确数、用时。
- **`t4-wrongbook.js`**：子路由：网格 → 详情 → 扫盲。
  - **网格**：2×4 响应式布局，CSS 绘制书本卡片（题库名称居中）。超过 8 个题库时分页。点击 → 进入详情。
  - **详情**：错题列表，含正确答案、错误次数徽章、删除按钮、"错题扫盲"按钮（→ 题型选择弹窗 → 进入扫盲）。
  - **扫盲**：5 题一组引擎。打乱的题目池。每题 3 盏绿灯（correctStreak 0-3）。答对 → 计数 +1 + 亮灯；答错 → 计数归零。连续答对 3 次 → 从数据库中自动删除 + 从题目池中取下一题补位。退出 → 返回详情。
- **`t5-paper.js`**：三步向导。步骤 1：选择题库。步骤 2：题型配置（数量/分值/乱序）、考试时长。步骤 3：试卷名称输入、A3/A4 格式单选、配置摘要展示、"下载"按钮。调用 `paper-gen.js` 生成。

### 服务层

- **`excel.js`**：`generateTemplate()` — 创建含 5 个工作表的空白工作簿。`parseWorkbook(file)` — SheetJS 读取，通过模糊名称匹配检测工作表类型，规范化答案（选择题转大写、判断题映射 true/false、填空/问答去除空格）、自动编号、跳过空工作表/行。`exportBank(bank)` — 按标准模板格式重建工作簿。
- **`exam-engine.js`**：`generateExamSession(bankId, modeId)` — 按题型配置随机选题，如启用则乱序选项，从 1 重新编号。`generatePracticeSession(bankId, configs)` — 按题型 + 题号范围选题，保留原有序号。`scoreSession(session)` — 比对用户答案与正确答案。`checkAnswer(userAnswer, correctAnswer, type)` — 按题型分别比对。答案记录至 history + wrongQuestions。
- **`paper-gen.js`**：`generatePaper(bankId, configs, name, format)` — 选题，构建两个 `docx.Document` 对象（试卷 + 答案），通过 JSZip 打包为 ZIP，通过 FileSaver 下载。试卷：双列表格布局，含密封区（姓名/证件号字段，分隔线）。按格式设置页面尺寸。

---

## 6. 关键算法

### Excel 导入解析

```
1. 使用 XLSX.read(file, {type:'array'}) 读取工作簿
2. 遍历每个工作表：
   a. 根据工作表名称模糊检测题型：/单[项选择]/→single, /多[项选择]/→multi, /判断|真假/→tf, /填空/→fill, /简答|问答|essay/→essay
   b. 无数据行（仅表头或空白）→ 跳过
   c. 解析表头行 → 映射列名到字段
   d. 遍历每个数据行：
      - 提取序号；若为空 → 自动分配顺序编号
      - 提取题目内容
      - 单选题：收集选项 A-D，将答案规范化为大写
      - 多选题：收集选项 A-H（仅非空），将答案规范化为大写字符串
      - 判断题：规范答案：对/正确/是/y/yes/t/true/真→"true"，错/错误/否/n/no/f/false/假→"false"
      - 填空题：收集空1-空8答案，去除每个答案的全部空格
      - 问答题：去除答案的全部空格
3. 返回按题型分组的解析后题目
```

### 考试模式名称默认值

```
已有模式名称：["Model A", "Model B", "Model C"]
下一个可用名：找到最小的 N，使 "Model " + letterFrom(N) 不存在
（A=1, B=2, ..., Z=26, AA=27, AB=28, ...）
默认值："Model " + letterFrom(最小未使用的序号)
```

### 考试会话选题

```
对于每个题型配置 {type, count, points, shuffleOptions}：
  1. 查询 WHERE bankId=X AND type=type 的题目
  2. 校验 count ≤ 可用题目数
  3. Fisher-Yates 洗牌数组，取前 count 道
  4. 如果 shuffleOptions：打乱每道题的选项顺序 + 重新映射正确答案
  5. 按顺序分配会话编号（1, 2, 3, ...）

总题数 = 所有题型 count 之和
```

### 选项乱序

```
function shuffleOptions(options, correctAnswer):
  indexed = [{text, originalLabel: 'A','B',...}]
  Fisher-Yates 洗牌 indexed
  重新标号：shuffled[0].displayLabel = 'A', shuffled[1].displayLabel = 'B', ...
  映射：原始正确字母 → 新的显示标签（例如原始 'B' → 新 'C'）
  将映射存入题目对象，供评分使用
  返回 {shuffledOptions, newCorrectLabel}
```

### 评分 + 错题追踪

```
function scoreSession(session):
  遍历 session 中的每道题：
    isCorrect = checkAnswer(session.userAnswers[qNum], question.answer, question.type)
    若正确：correctCount++, score += question.points
    否则：wrongQuestionIds.push(question.questionId)

  // 记录历史
  db.history.add({userId, bankId, score, correctCount, wrongQuestionIds, ...})

  // 更新错题（冗余快照）
  遍历每个错误的 questionId：
    existing = db.wrongQuestions.where({userId, questionId}).first()
    若已存在：
      existing.wrongCount++, existing.correctStreak = 0, existing.lastWrongDate = now
      db.wrongQuestions.put(existing)
    否则：
      // 快照题目数据 + 添加，wrongCount=1
      db.wrongQuestions.add({userId, questionId, bankId, content: snapshot, wrongCount: 1, ...})
```

### 错题扫盲引擎（5 题一组）

```
class ReviewEngine:
  constructor(wrongQuestions):
    this.pool = shuffle(全部错题)
    this.slots = pool.splice(0, min(5, pool.length))
    this.cleared = 0

  answerQuestion(slotIndex, userAnswer):
    q = this.slots[slotIndex]
    若 checkAnswer(userAnswer, q.answer, q.type) 正确：
      q.correctStreak++
      若 q.correctStreak >= 3：
        db.wrongQuestions.delete(q.id)  // 从数据库中删除
        this.cleared++
        若 this.pool.length > 0：
          this.slots[slotIndex] = this.pool.shift()  // 补位
        否则：
          this.slots.splice(slotIndex, 1)  // 缩小题组
    否则：
      q.correctStreak = 0
      q.wrongCount++
      db.wrongQuestions.put(q)  // 持久化

  isComplete(): return this.slots.length === 0
```

### Word 试卷生成（密封区）

```
1. 创建 docx.Document，设置页面尺寸（A3: 841.9×1190.55 twips；A4: 595.3×841.9 twips）
2. 第一部分 — 密封区：
   - 单行、双列表格
   - 左单元格（宽度 25%，约 4.5cm）：竖排文字 "姓名：_______"、"证件号：_______"
   - 右单元格左边框作为密封线
   - 右单元格：试卷标题、考试时长、总分
3. 第二部分 — 试题正文：
   - 每个题型区域：题型标题（名称、数量×分值）
   - 每道题（全局重新编号 1..N）：
     - 单选/多选题：题干 + 乱序选项（A. B. C. D.）
     - 判断题：题干 + "(    )"
     - 填空题：题干 + 编号空白 "①____ ②____"
     - 问答题：题干 + 空白作答区
4. 答案文档：相同编号，仅显示正确答案
5. 打包：JSZip → zip.file("试卷.docx", qBlob) + zip.file("答案.docx", aBlob) → saveAs(zipBlob, "名称.zip")
```

---

## 7. 实施阶段

### 阶段 0：页面外壳与基础设施（基础）
**涉及文件：** `index.html`、`css/style.css`、`js/app.js`、`js/db.js`、`js/router.js`、`js/auth.js`、`js/state.js`、`js/utils.js`、`js/components/navbar.js`、`js/components/breadcrumb.js`、`js/pages/login.js`、`js/pages/home.js`

**步骤：**
1. 创建 `index.html`，含 CDN 链接及挂载点（`#navbar`、`#breadcrumb`、`#content`、`#toast-container`、`#modal-container`）
2. 编写 `css/style.css` — CSS 变量、基础布局、导航栏、面包屑、Toast 定位
3. 编写 `js/db.js` — Dexie Schema + users 表的 CRUD
4. 编写 `js/state.js` — 发布/订阅存储
5. 编写 `js/auth.js` — 注册、登录、登出、会话恢复、默认管理员创建
6. 编写 `js/router.js` — Hash 路由，含登录/角色守卫
7. 编写 `js/utils.js` — Toast、Modal、格式化工具、常量
8. 编写 `js/components/navbar.js` 和 `breadcrumb.js`
9. 编写 `js/pages/login.js`（登录/注册合并）和 `home.js`
10. 连接 `js/app.js` — 初始化流程

**验证：** 应用加载无报错，默认管理员存在，注册/登录/登出正常，导航栏渲染正确，面包屑跟踪导航，气泡提示出现。

### 阶段 1：T2 题库管理
**涉及文件：** `js/services/excel.js`、`js/components/pagination.js`、`js/components/question-renderer.js`、`js/pages/t2-banks.js`、`js/pages/t2-bank-detail.js`

**步骤：**
1. 编写 `js/services/excel.js` — 模板生成、工作簿解析、题库导出
2. 编写 `js/components/pagination.js`
3. 编写 `js/components/question-renderer.js`（全部 5 种题型的渲染核心）
4. 编写 `js/pages/t2-banks.js` — 列表视图 + 导入弹窗
5. 编写 `js/pages/t2-bank-detail.js` — 编辑 + 查看模式
6. 在路由中添加 T2 路由
7. 添加 T2 CSS 样式

**验证：** 下载模板 → 填写 → 导入 → 查看列表 → 编辑题目 → 导出 → 删除。搜索和分页正常。角色按钮可见性正确。

### 阶段 2：T1 考试与练习
**涉及文件：** `js/services/exam-engine.js`、`js/components/exam-sidebar.js`、`js/components/exam-timer.js`、`js/pages/t1-exam-practice.js`、`js/pages/t1-session.js`

**步骤：**
1. 编写 `js/services/exam-engine.js` — 会话生成、评分、答案比对
2. 编写 `js/components/exam-sidebar.js` — 含圆圈的题目导航
3. 编写 `js/components/exam-timer.js` — 倒计时 + 正计时，含漂移修正
4. 编写 `js/pages/t1-exam-practice.js` — 入口 + 考试/练习向导
5. 编写 `js/pages/t1-session.js` — 完整作答界面，含提交、结果、刷新恢复
6. 添加 T1 路由
7. 添加 T1 CSS（侧边栏、计时器显示、题目区布局）

**验证：** 完整考试流程（创建模式 → 开始 → 作答 → 提交 → 结果）。完整练习流程（配置 → 开始 → 即时纠错开关 → 提交）。倒计时到期自动提交。刷新恢复。选项乱序。题目重新编号。

### 阶段 3：T3 历史记录
**涉及文件：** `js/pages/t3-history.js`

**步骤：**
1. 在 `t1-session.js` 提交流程中添加历史记录（调用 db 函数）
2. 集成错题记录到提交流程
3. 编写 `js/pages/t3-history.js` — 可筛选的分页列表
4. 添加 T3 路由和 CSS

**验证：** 考试/练习结果显示在历史中。筛选功能正常。分页正常。

### 阶段 4：T4 错题本
**涉及文件：** `js/pages/t4-wrongbook.js`

**步骤：**
1. 编写 `js/pages/t4-wrongbook.js` — 网格视图 + 题库详情 + 扫盲引擎
2. 添加 T4 路由和 CSS（书本卡片、三盏灯指示器）
3. 与阶段 3 的错题记录集成

**验证：** 错题按题库分组显示。书本网格展示。详情页显示题目及错误次数。扫盲模式：连续 3 次正确自动移除、答错重置、5 题一组行为。

### 阶段 5：T5 试卷生成
**涉及文件：** `js/services/paper-gen.js`、`js/pages/t5-paper.js`

**步骤：**
1. 编写 `js/services/paper-gen.js` — docx 生成 + ZIP 打包
2. 编写 `js/pages/t5-paper.js` — 三步向导
3. 添加 T5 路由和 CSS

**验证：** 下载生成有效的 ZIP 文件。Word 文档正确打开，含密封区。A3/A4 尺寸正确。答案匹配。选项乱序已体现。

### 阶段 6：打磨优化
- 响应式适配（移动端侧边栏折叠）
- DB 操作和 Excel 解析的加载动画
- 空状态提示（"暂无题库"、"暂无历史记录" 等）
- 错误处理（数据库配额超限、Excel 文件损坏、超时等边界情况）
- 防止重复提交（异步操作期间禁用按钮）
- 活跃考试期间的 `beforeunload` 警告
- 跨浏览器测试（Chrome、Edge、Firefox）

---

## 8. 验证清单

### 核心功能
- [ ] 应用加载无控制台错误
- [ ] 首次运行存在默认管理员账户
- [ ] 注册新用户、登录、登出均正常
- [ ] 管理员可见全部按钮；普通用户仅见受限按钮
- [ ] 路由守卫跳转正确

### T2 — 题库
- [ ] 下载标准模板（5 个工作表，表头正确）
- [ ] 导入填好的 Excel — 全部 5 种题型解析正确
- [ ] 答案规范化：选择题大写、判断题映射、空格去除
- [ ] 空工作表被忽略；自动编号正常
- [ ] 搜索、分页（每页 10 条）、批量操作正常
- [ ] 编辑题目、保存、确认修改已持久化
- [ ] 导出符合标准模板格式；重新导入正常

### T1 — 考试与练习
- [ ] 考试向导：选择题库、创建模式、最大数量校验
- [ ] 总分由数量 × 分值自动计算
- [ ] 练习向导：题号范围校验
- [ ] 考试会话：倒计时器、到期自动提交
- [ ] 练习会话：正计时器、即时纠错开关
- [ ] 侧边栏：圆圈正确填充（蓝=已答、绿=正确、红=错误）
- [ ] 选项乱序：选项重排，评分依然正确
- [ ] 提交：未答题警告，评分正确
- [ ] 结果弹窗：显示错题及正确答案
- [ ] 会话期间刷新：状态恢复
- [ ] 结果记录至历史 + 错题

### T3 — 历史记录
- [ ] 考试和练习结果均显示在历史中
- [ ] 筛选功能（按题库、按类型）正常
- [ ] 分页正常

### T4 — 错题本
- [ ] 错题按题库分组显示
- [ ] 书本网格显示正确（2×4，分页）
- [ ] 详情页：正确答案、错误次数、删除按钮
- [ ] 扫盲模式：5 题一组，乱序呈现
- [ ] 连续答对 3 次 → 自动移除
- [ ] 答错 → 灯重置
- [ ] 题目移除后题组补位

### T5 — 试卷生成
- [ ] 三步向导流程正确
- [ ] 下载生成有效的 ZIP，含 2 个 .docx 文件
- [ ] 试卷含密封区（姓名/证件号字段）
- [ ] A3/A4 页面尺寸正确
- [ ] 答案正确
- [ ] 选项乱序已体现

### 打磨
- [ ] 在 375px、768px、1440px 宽度下响应式正常
- [ ] 所有路由无 404 或 JS 错误
- [ ] 所有气泡提示正常显示和消失
- [ ] 弹窗可通过 ESC、点击背景遮罩、按钮关闭
- [ ] 500+ 题导入不会卡死
- [ ] 已防止重复提交
- [ ] 浏览器前进/后退与 Hash 路由配合正常

---

## 9. UX 与需求审查补充

### 9.1 Excel 导入：完整规范化流程

`excel.js` 服务必须按以下精确流程处理每种工作表类型：

**工作表类型检测（模糊匹配）：**
- `/单[项选择]/` → `single`
- `/多[项选择]/` → `multi`
- `/判断|真假/` → `tf`
- `/填空/` → `fill`
- `/简答|问答|essay/i` → `essay`

**各题型解析与规范化：**

| 题型 | 待解析列 | 答案规范化 |
|------|---------|-----------|
| single | 序号, 题目内容, A, B, C, D, 正确选项（7 列） | `answer.trim().toUpperCase()` → 单个字母 |
| multi | 序号, 题目内容, A-H, 正确选项（11 列） | 按逗号/分号/空格拆分，逐个 `.toUpperCase()`，排序，拼接 → 例如 "ABC" |
| tf | 序号, 题目内容, 正确答案（3 列） | `对/正确/是/y/yes/t/true/真` → `"true"`；`错/错误/否/n/no/f/false/假` → `"false"`（不区分大小写） |
| fill | 序号, 题目内容, 空1–空8（10 列） | 对每个非空答案去除 `/\s+/g` → 字符串数组 |
| essay | 序号, 题目内容, 正确答案（3 列） | 去除 `/\s+/g` → 字符串 |

**需处理的边界情况：**
- 多选题仅填写 A-D（E-H 为空）→ 仅存储非空选项
- 填空题仅填写 8 空中的 3 空 → 存储长度为 3 的数组
- 工作表内空白行 → 跳过
- 仅有表头无数据行的工作表 → 完全跳过
- 序号缺失/为空 → 自动分配顺序编号（1, 2, 3, ...）
- 题目内容重复 → 通过气泡提示警告，仍导入

### 9.2 T2.2 编辑确认差异弹窗

在编辑题库页面点击"确认修改"时：
1. 编辑过程中将全部变更追踪至本地 `changes[]` 数组：`{ questionId, field, oldValue, newValue }`
2. 弹窗展示可滚动表格：题号 | 字段 | 原值 | 新值
3. 新增题目以绿色高亮，删除以红色高亮，修改以黄色高亮
4. 用户点击"确认" → 通过 Dexie 事务批量写入 → Toast 提示"修改已保存" → 跳转至 `#/t2`
5. 用户点击"取消" → 放弃修改，留在编辑页

### 9.3 步骤向导状态机

T1.1、T1.2 和 T5 均使用可复用的步骤向导模式：

```
向导状态：
  currentStep: number（从 0 开始）
  completedSteps: Set<number>  // 可回访的步骤
  stepData: { [step]: any }    // 每步收集的数据
  canAdvance(): boolean        // 当前步骤验证通过
  advance(): void              // 验证 → 保存数据 → 标记完成 → 下一步
  goBack(step): void           // 回访已完成步骤（重置后续步骤）
```

渲染为横向步骤指示器：带编号的圆圈由连线连接。已完成 = 实心，当前 = 描边高亮，未完成 = 灰色。已完成步骤可点击回访。

### 9.4 正确答案比对算法

`exam-engine.js` 中按题型的答案比对：

```javascript
function checkAnswer(userAnswer, correctAnswer, type) {
  switch (type) {
    case 'single':
      return userAnswer?.trim().toUpperCase() === correctAnswer;  // 均为单个字母
    case 'multi':
      // 分别排序后以字符串比对
      const ua = [...(userAnswer || '')].filter(c => /[A-H]/i.test(c)).map(c=>c.toUpperCase()).sort().join('');
      return ua === correctAnswer;  // correctAnswer 已排序大写
    case 'tf':
      return userAnswer === correctAnswer;  // 均为 "true"/"false" 字符串
    case 'fill':
      // 逐空比对（去空格，不区分大小写）
      if (!Array.isArray(userAnswer)) return false;
      return correctAnswer.every((ans, i) =>
        (userAnswer[i] || '').trim().replace(/\s+/g, '').toLowerCase() === ans.toLowerCase()
      );
    case 'essay':
      return (userAnswer || '').trim().replace(/\s+/g, '').toLowerCase() === correctAnswer.toLowerCase();
  }
}
```

### 9.5 Word 文档密封区 — TextDirection 方案

生成的 Word 试卷密封区，使用 `docx.TextDirection.TOP_TO_BOTTOM_LEFT_TO_RIGHT` 应用于左单元格：

```javascript
new docx.Table({
  rows: [new docx.TableRow({
    children: [
      // 左侧密封单元格
      new docx.TableCell({
        children: [
          new docx.Paragraph({ text: "姓名：____________", spacing: { after: 300 } }),
          new docx.Paragraph({ text: "证件号：____________" }),
        ],
        width: { size: 2500, type: docx.WidthType.DXA },  // 约 4.4cm
        textDirection: docx.TextDirection.TOP_TO_BOTTOM_LEFT_TO_RIGHT,
        borders: { right: { style: docx.BorderStyle.DASHED, size: 6 } },
        verticalAlign: docx.VerticalAlign.CENTER,
      }),
      // 右侧内容单元格
      new docx.TableCell({
        children: [/* 试题内容 */],
        width: { size: 7500, type: docx.WidthType.DXA },
      }),
    ],
  })],
})
```

若加载的 docx.js 版本不支持 `TextDirection`，则回退为换行分隔字符（如 `"姓\n\n名\n\n：\n\n_\n\n_"`），或通过 JSZip 级别的 XML 补丁在表格单元格注入 `vert="vert"` 属性。

### 9.6 气泡提示类型

| 类型 | 使用场景 | 颜色 |
|------|---------|------|
| `success` | 导入完成、修改已保存、模式已添加、试卷已下载 | 绿色 |
| `error` | 导入失败、验证错误、删除失败、登录失败 | 红色 |
| `warning` | 存在未答题目、确认删除操作、大文件导入 | 黄色 |
| `info` | "步骤已完成"、"已复制"、导航提示 | 蓝色 |

位置：右上角，堆叠排列。3.5 秒后自动消失（可配置）。每个提示含关闭按钮。

### 9.7 基于角色的 UI 渲染架构

在 `navbar.js` 和 `t2-banks.js` 中，使用以下模式：
```javascript
if (state.getState().currentUser?.role === 'admin') {
  // 显示管理员按钮：新增、批量删除、编辑、删除
}
// 所有用户均显示：查看、导出
```

管理员专属路由（`#/t2/add`、`#/t2/edit/:id`）在页面渲染前由路由器拦截。非管理员访问这些路由 → Toast 提示 "权限不足" + 跳转至 `#/t2`。

### 9.8 练习模式：即时纠错状态影响错题记录

根据练习模式中即时纠错开关的状态：

- **开关开启（即时纠错）**：每道题作答后，若答错 → 立即 upsert 至 `wrongQuestions` 表，wrongCount +1
- **开关关闭**：不逐题记录。仅在最终提交时 → 将所有错题批量记录至 `wrongQuestions`
- **考试模式**：始终仅在最终提交时记录（无即时纠错功能）

### 9.9 默认管理员初始化

应用首次启动（`users` 表为空）时，`db.js` 初始化创建：
```javascript
{ username: "admin", passwordHash: sha256("admin123"), role: "admin", createdAt: new Date() }
```
管理员可通过注册页面创建普通用户。
