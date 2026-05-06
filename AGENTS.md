# AGENTS.md - AI 代理开发规范

## 一、项目基础信息

### 项目名称
轨道交通智能问答助手 (Rail Transit Intelligent Q&A Assistant)

### 项目概述
面向轨道交通工程设计场景的私有化 RAG 智能问答系统。通过语义检索 + 大模型生成，将工程规范文档转化为可交互的知识库，帮助工程师快速精准获取规范参数与设计要求。

### 核心文档索引
- [RESEARCH.md](./RESEARCH.md) - 需求研究报告（痛点、竞品、差异化）
- [PRD.md](./PRD.md) - 产品需求文档（功能、流程、验收标准）
- [TECH_DESIGN.md](./TECH_DESIGN.md) - 技术设计文档（架构、技术栈、数据模型）

### 技术栈
- 前端：React 18 + TypeScript + Vite + TailwindCSS + Zustand + Axios
- 后端：Python 3.11+ + FastAPI + Pydantic
- 向量数据库：ChromaDB（嵌入式运行）
- LLM运行时：Ollama（可选，Demo模式降级）
- 对话模型：Qwen2.5:7b / Qwen3:8b
- 嵌入模型：bge-m3 / nomic-embed-text

---

## 二、代码开发规范

### 2.1 通用规则

1. **禁止添加注释**：代码即文档，用清晰的命名替代注释
2. **禁止创建不必要的文件**：不创建 README、测试文件、文档文件，除非明确要求
3. **优先编辑现有文件**：不新建文件，除非 PRD/TECH_DESIGN 中明确定义的新模块
4. **遵循现有代码风格**：修改代码前先观察周围代码的风格和模式

### 2.2 TypeScript/React 规范

```
命名规范:
  - 文件名: PascalCase (ChatPage.tsx, ChatBubble.tsx)
  - 组件名: PascalCase (ChatPage, ChatBubble)
  - 函数/变量: camelCase (handleSubmit, isLoading)
  - 常量: UPPER_SNAKE_CASE (MAX_CHUNK_SIZE)
  - 类型/接口: PascalCase (AnswerResponse, SourceInfo)
  - Hooks: useXxx (useChatStore, useKnowledgeStore)

目录遵守:
  - 页面组件 → src/pages/
  - 通用组件 → src/components/
  - API调用 → src/services/
  - 状态管理 → src/store/
  - 类型定义 → src/types/
  - 组件内样式使用 TailwindCSS class，不创建 .css 文件
```

### 2.3 Python/FastAPI 规范

```
命名规范:
  - 文件名: snake_case (chat_service.py, document_parser.py)
  - 类名: PascalCase (ChatService, DocumentParser)
  - 函数/变量: snake_case (build_prompt, chunk_size)
  - 常量: UPPER_SNAKE_CASE (DEFAULT_TOP_K, TARGET_CHUNK_SIZE)

目录遵守:
  - 路由处理 → app/api/
  - 业务逻辑 → app/services/
  - 数据模型 → app/models/
  - 数据库操作 → app/db/
  - Prompt模板 → app/prompts/
  - 配置 → app/config.py

导入顺序:
  1. 标准库
  2. 第三方库
  3. 项目内模块
  各组之间空一行
```

---

## 三、开发交付要求

### 3.1 异常处理规范

```python
# FastAPI 后端
- 所有API端点必须显式捕获异常，返回统一格式错误
- 使用 HTTPException，不要返回裸 500
- LLM调用失败 → 返回 503，提示"模型服务暂不可用"
- 文档解析失败 → 返回 422，提示具体哪个文件出问题
- 向量检索失败 → 返回 500，记录日志但不暴露内部详情

# React 前端
- 所有API调用必须 try-catch，显示用户友好的错误提示
- 网络错误 → "网络连接异常，请检查服务状态"
- 超时 → "响应超时，请稍后重试"
- 服务不可用 → 显示降级提示，不白屏
```

### 3.2 安全编码规范

- 所有文件上传需校验类型（仅允许 docx/pdf/txt）和大小（≤ 20MB）
- 前端不展示任何内部路径、配置信息、API Key
- 禁止在代码中硬编码任何密钥或凭证
- Ollama地址等配置从 .env 文件读取，不提交到 git

### 3.3 代码提交规范

- 一个 commit 只做一件事
- 提交信息格式：`<type>: <description>`
- type: feat / fix / refactor / style / docs / chore

---

## 四、AI 交互规则

### 4.1 修改代码要求

1. 修改前必须先用 Read 工具查看文件当前内容
2. 使用 SearchReplace 工具进行最小化修改，不重写整个文件
3. 新增功能时先在对应的 services/ 目录下创建模块，再注册路由
4. 新增前端页面时先在 pages/ 创建，再在 App.tsx 注册路由

### 4.2 问题反馈规则

1. 遇到需求不明确时，基于已有文档做最合理推断，继续执行
2. 发现 PRD 与 TECH_DESIGN 冲突时，以 PRD 为准，同步更新 TECH_DESIGN
3. 实现过程中发现设计不足，自行补充合理方案，在交付时说明

### 4.3 验证规则

1. 每完成一个功能模块，检查前后端接口对接是否一致
2. 新增的 API 端点需检查请求/响应模型是否与前端类型定义匹配
3. 修改 Prompt 模板后需检查变量注入是否正确（用 f-string 或 jinja2）

---

## 五、快速参考

### 启动命令

```bash
# 后端
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 前端
cd frontend
npm install
npm run dev
```

### 关键配置项 (.env)

```
OLLAMA_BASE_URL=http://localhost:11434
CHUNK_SIZE=384
TOP_K=8
DEMO_MODE=false
```

### ChromaDB 集合名称

```
engineering_standards  # 规范文档语义块
```
