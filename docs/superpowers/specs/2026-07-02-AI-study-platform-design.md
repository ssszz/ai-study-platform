# AI 研习社 — 部门 AI 学习平台设计文档

> 日期：2026-07-02
> 状态：已确认

## 1. 项目概述

### 1.1 目标
为部门同事构建一个 AI 学习与考核平台，帮助初学者系统掌握 AI 基础知识和金蝶灵基平台使用技能。

### 1.2 技术栈
- **前端**：React 18 + TypeScript + shadcn/ui + Tailwind CSS + Recharts（图表）
- **后端**：Python 3.11+ + FastAPI + SQLAlchemy + SQLite
- **认证**：JWT Token + bcrypt 密码加密
- **构建工具**：Vite（前端）、Uvicorn（后端）

### 1.3 部署模式
单机运行，SQLite 单文件数据库，方便拷贝迁移。前后端分离，开发时前端 :5173，后端 :8000，生产环境前端构建后由 FastAPI 静态托管。

---

## 2. 用户与权限

### 2.1 角色定义

| 角色 | 权限 |
|------|------|
| **普通用户 (user)** | 学习课程、参加考试、查看自己的成绩/错题 |
| **管理员 (admin)** | 以上全部 + 题库管理 + 课程管理 + 用户管理 + 创建考试 |

### 2.2 认证流程
1. 用户使用用户名+密码登录
2. 后端校验并签发 JWT Token（7 天有效期）
3. 前端存储 Token，请求时携带 Authorization Header
4. 后端中间件校验 Token + 角色权限

### 2.3 系统初始化
首次启动自动创建 admin 账号：
- 用户名：`admin`
- 密码：`admin123`（首次登录提示修改）

### 2.4 用户数据模型
```
users:
  id          INTEGER PRIMARY KEY
  username    TEXT UNIQUE NOT NULL
  password    TEXT NOT NULL (bcrypt hash)
  real_name   TEXT NOT NULL
  department  TEXT
  role        TEXT NOT NULL DEFAULT 'user'  -- 'user' | 'admin'
  is_active   INTEGER DEFAULT 1
  created_at  DATETIME
  updated_at  DATETIME
```

---

## 3. 知识体系

### 3.1 九大知识领域

| ID | 领域 | 说明 |
|----|------|------|
| 1 | AI 基础概念 | 什么是 AI、LLM 原理、Token、Embedding 等 |
| 2 | 提示词工程 | Prompt 设计、Few-shot、Chain-of-Thought、System Prompt |
| 3 | 灵基平台概览 | 灵基定位、架构、三大模式、核心理念 |
| 4 | 灵基 Chat 模式 | 对话协作、知识库检索、数据分析、方案起草 |
| 5 | 灵基 Work 模式 | 任务承接、流程执行、Agent 调度、结果交付 |
| 6 | 灵基 Build 模式 | 低代码搭建、VibeCoding、原型探索、应用生成 |
| 7 | Skill 技能开发 | MCP 协议、业务封装、技能组合、可复用沉淀 |
| 8 | Agent 智能体开发 | 六维定义模型、创建编排、生命周期管理 |
| 9 | AI 治理与安全 | 权限控制、审计追踪、责任链、数据合规 |

### 3.2 三个难度等级
- **L1 入门**：概念理解，"是什么"
- **L2 进阶**：原理掌握，"怎么用"
- **L3 高级**：实践应用，"怎么搭建"

### 3.3 预设课程清单（15 门）

| 等级 | 序号 | 课程标题 | 所属领域 |
|------|------|------|------|
| L1 | 1 | AI 是什么：从图灵测试到 ChatGPT | AI基础概念 |
| L1 | 2 | 大语言模型（LLM）入门 | AI基础概念 |
| L1 | 3 | 认识金蝶灵基平台 | 灵基平台概览 |
| L1 | 4 | 灵基 Chat 模式快速上手 | 灵基Chat模式 |
| L1 | 5 | AI 使用中的安全常识 | AI治理与安全 |
| L2 | 6 | 提示词工程实战 | 提示词工程 |
| L2 | 7 | 灵基 Work 模式详解 | 灵基Work模式 |
| L2 | 8 | 什么是 Skill 技能 | Skill技能开发 |
| L2 | 9 | 什么是 Agent 智能体 | Agent智能体开发 |
| L2 | 10 | MCP 协议入门 | Skill技能开发 |
| L3 | 11 | Skill 开发实战：MCP 业务技能封装 | Skill技能开发 |
| L3 | 12 | Agent 六维定义与创建 | Agent智能体开发 |
| L3 | 13 | Agent 编排与调度 | Agent智能体开发 |
| L3 | 14 | 灵基 Build 模式全流程 | 灵基Build模式 |
| L3 | 15 | Agent 治理与审计实践 | AI治理与安全 |

---

## 4. 功能模块

### 4.1 首页仪表盘
- 欢迎语 + 个人统计卡片（已学课程数、考试次数、平均得分）
- 继续学习：最近在学的课程 + 进度条
- 近期考试：最近考试记录 + 得分
- 热门课程：学习人数最多的课程

### 4.2 学习中心
- 课程列表页：按领域和等级筛选，显示学习状态（未开始/进行中/已完成）
- 课程详情页：Markdown 渲染正文，支持代码块、表格、图片
- 课后练习：每门课附带 5 道选择题，巩固知识（不计入考试成绩）
- 学习进度追踪：自动记录课程完成状态

### 4.3 题库管理（管理员）
- 题目列表：按领域、等级、题型筛选，支持搜索
- 添加题目：单选题/多选题/判断题
  - 单选题：题干 + 4 个选项 + 正确答案 + 领域 + 等级 + 分值
  - 多选题：题干 + 4-6 个选项 + 多个正确答案 + 领域 + 等级 + 分值
  - 判断题：题干 + 对/错答案 + 领域 + 等级 + 分值
- 编辑/删除题目
- 批量导入（预留 JSON 格式）

### 4.4 考试中心
- **创建考试（管理员）**：
  - 手动选题：从题库逐题挑选
  - 智能组卷：设定领域、等级、题目数量、题型分布、总分，系统随机抽题
  - 设置考试名称、时间限制、及格分数线
- **参加考试（用户）**：
  - 考试列表页：显示可用考试、时间限制、题目数
  - 答题页：逐题显示，支持标记"待定"，答题卡快速跳转
  - 倒计时组件，时间到自动交卷
  - 交卷确认：未答题高亮提醒
- **自动评分**：
  - 单选题/判断题：答案完全匹配即得分
  - 多选题：全部选对得满分，部分选对得一半分，有错选不得分
  - 交卷即时出分

### 4.5 成绩分析
- **个人维度**：
  - 考试次数、平均分、最高分
  - 最近考试趋势图（折线图）
  - 各知识领域掌握度（雷达图）
  - 历史考试记录列表
  - 错题本：错题回顾 + 正确答案对照
- **管理员维度**：
  - 部门平均分 / 通过率统计
  - 各等级考试通过情况
  - 各知识领域薄弱环节分析

---

## 5. 数据模型

### 5.1 核心表结构

```
users                  — 用户表
categories             — 知识领域分类表
courses                — 课程表
course_progress        — 用户学习进度表
questions              — 题库表
exams                  — 考试表（考试定义）
exam_questions         — 考试-题目关联表
exam_submissions       — 用户提交记录表
exam_answers           — 用户答题详情表
```

### 5.2 详细字段

```
categories:
  id, name, description, sort_order

courses:
  id, title, category_id, level(L1/L2/L3), content(markdown),
  read_time_minutes, sort_order, created_at, updated_at

course_progress:
  id, user_id, course_id, status(not_started/in_progress/completed),
  completed_at

questions:
  id, category_id, level, type(single/multi/true_false),
  title, options(JSON), correct_answer(JSON), score,
  created_at, updated_at

exams:
  id, title, description, time_limit_minutes, pass_score,
  total_score, status(draft/published/closed),
  created_by, created_at

exam_questions:
  id, exam_id, question_id, sort_order

exam_submissions:
  id, exam_id, user_id, score, total_score, status(in_progress/submitted),
  start_time, submit_time

exam_answers:
  id, submission_id, question_id, user_answer(JSON),
  is_correct, score_earned
```

---

## 6. API 设计

### 6.1 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 登录，返回 JWT Token |
| GET | `/api/auth/me` | 获取当前用户信息 |
| PUT | `/api/auth/change-password` | 修改密码 |

### 6.2 用户管理（管理员）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/users` | 用户列表 |
| POST | `/api/users` | 创建用户 |
| PUT | `/api/users/{id}` | 编辑用户 |
| DELETE | `/api/users/{id}` | 删除用户 |

### 6.3 课程
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/courses` | 课程列表（支持筛选） |
| GET | `/api/courses/{id}` | 课程详情 |
| POST | `/api/courses` | 创建课程（管理员） |
| PUT | `/api/courses/{id}` | 编辑课程（管理员） |
| DELETE | `/api/courses/{id}` | 删除课程（管理员） |
| POST | `/api/courses/{id}/complete` | 标记完成 |

### 6.4 题库
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/questions` | 题目列表（支持筛选） |
| POST | `/api/questions` | 添加题目（管理员） |
| PUT | `/api/questions/{id}` | 编辑题目（管理员） |
| DELETE | `/api/questions/{id}` | 删除题目（管理员） |

### 6.5 考试
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/exams` | 考试列表 |
| POST | `/api/exams` | 创建考试（管理员） |
| GET | `/api/exams/{id}` | 考试详情（含题目，答时不返答案） |
| POST | `/api/exams/{id}/submit` | 提交考试 |
| GET | `/api/exams/{id}/result` | 查看考试成绩与答卷 |

### 6.6 统计
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/stats/dashboard` | 首页统计 |
| GET | `/api/stats/personal` | 个人成绩分析 |
| GET | `/api/stats/department` | 部门分析（管理员） |

---

## 7. 前端路由

```
/                          首页仪表盘
/login                     登录页
/courses                   课程列表
/courses/:id               课程详情
/exams                     考试列表
/exams/:id                 考试答题页
/exams/:id/result          考试成绩页
/admin/questions           题库管理（管理员）
/admin/courses             课程管理（管理员）
/admin/users               用户管理（管理员）
/admin/exams               考试管理（管理员）
/stats                     个人成绩分析
/stats/department          部门成绩分析（管理员）
```

---

## 8. 预设数据

### 8.1 初始化数据
系统首次启动时自动创建：
1. Admin 账号
2. 9 个知识领域分类
3. 15 门预设课程（含 Markdown 正文内容）
4. 每门课 5 道课后练习题
5. 题库中约 100+ 道题目（覆盖各领域和等级）

### 8.2 预设题库分布
| 等级 | 单选题 | 多选题 | 判断题 | 合计 |
|------|--------|--------|--------|------|
| L1 | 20 | 10 | 10 | 40 |
| L2 | 25 | 10 | 10 | 45 |
| L3 | 20 | 10 | 5 | 35 |
| **合计** | **65** | **30** | **25** | **~120** |

---

## 9. 项目结构

```
ai-study-platform/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI 入口
│   │   ├── config.py            # 配置
│   │   ├── database.py          # 数据库连接
│   │   ├── models/              # SQLAlchemy 模型
│   │   │   ├── user.py
│   │   │   ├── course.py
│   │   │   ├── question.py
│   │   │   └── exam.py
│   │   ├── schemas/             # Pydantic 模式
│   │   ├── routers/             # API 路由
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── courses.py
│   │   │   ├── questions.py
│   │   │   ├── exams.py
│   │   │   └── stats.py
│   │   ├── services/            # 业务逻辑
│   │   │   ├── auth_service.py
│   │   │   ├── exam_service.py
│   │   │   └── grading_service.py
│   │   └── seed.py              # 初始数据填充
│   ├── requirements.txt
│   └── ai_study.db              # SQLite 数据库文件（自动生成）
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api/                 # API 请求封装
│   │   ├── components/          # 通用组件
│   │   ├── pages/               # 页面组件
│   │   ├── hooks/               # 自定义 Hooks
│   │   ├── lib/                 # 工具函数
│   │   └── types/               # TypeScript 类型
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
└── README.md
```
