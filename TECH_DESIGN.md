# TECH_DESIGN.md - 轨道交通智能问答助手 技术设计文档

## 一、技术栈选型

### 1.1 总体技术选型

| 层级 | 技术选择 | 版本要求 | 选型理由 |
|------|---------|---------|---------|
| 前端框架 | React + TypeScript | React 18+ | 生态成熟，类型安全，面试认可度高 |
| 构建工具 | Vite | 5.x | 开发体验快，HMR即时生效 |
| CSS框架 | TailwindCSS | 3.x | 原子化CSS，开发效率高，风格统一 |
| 状态管理 | Zustand | 4.x | 轻量无模板，比Redux更适合中小项目 |
| HTTP客户端 | Axios | 1.x | 拦截器、错误处理完善 |
| 后端框架 | FastAPI | 0.111+ | 异步支持好，自动OpenAPI文档，Python生态 |
| 数据校验 | Pydantic | 2.x | FastAPI原生集成，类型安全 |
| 向量数据库 | ChromaDB | 0.5.x | 嵌入式运行，无需单独服务，适合演示 |
| LLM运行时 | Ollama | latest | 本地运行开源模型，一条命令启动 |
| 对话模型 | Qwen2.5:7b 或 Qwen3:8b | - | 中文能力强，7B级别在单机上可运行 |
| 嵌入模型 | bge-m3 或 nomic-embed-text | - | 中英文Embedding，Ollama可直接拉取 |
| 文档解析 | python-docx + pdfplumber | - | 分别处理Word和PDF，稳定可靠 |
| Python环境 | Python | 3.11+ | FastAPI最佳支持版本 |
| 包管理 | Poetry 或 pip + venv | - | 依赖隔离，版本锁定 |

### 1.2 技术栈与实习经历对照

| 实习生实际方案 | 本项目方案 | 差异说明 |
|--------------|-----------|---------|
| Docker + Dify工作流编排 | FastAPI自建后端 | Dify适合团队协作，本项目用代码展示能力 |
| Qwen-7B (内网部署) | Ollama + Qwen2.5:7b | Ollama简化部署，功能等价 |
| Dify内置Embedding | Ollama bge-m3 | 独立选型，展示全链路理解 |
| Dify知识库管理 | ChromaDB + 自建管理 | 展示向量数据库的底层理解 |
| - | React前端 | 展示全栈能力，Dify复用其UI |
| 双层Prompt（Dify内） | Python Prompt模板引擎 | 代码可控性更高，展示策略设计 |

---

## 二、系统架构

### 2.1 架构图

```
┌──────────────────────────────────────────────────────┐
│                    前端 (React)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │ 问答页面  │ │ 知识库页  │ │ 评测面板  │             │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘             │
│       └─────────────┼────────────┘                   │
│                     │ HTTP/REST                      │
└─────────────────────┼────────────────────────────────┘
                      │
┌─────────────────────┼────────────────────────────────┐
│              后端 (FastAPI)                           │
│                     │                                 │
│  ┌──────────────────┼──────────────────────────────┐ │
│  │              API 路由层                          │ │
│  │  /api/chat  /api/knowledge  /api/eval           │ │
│  └──────┬──────────┬──────────┬───────────────────┘ │
│         │          │          │                      │
│  ┌──────┴──┐ ┌─────┴────┐ ┌──┴──────────┐          │
│  │ 问答服务 │ │ 知识库服务│ │ 评测服务     │          │
│  │ Chat    │ │Knowledge │ │ Evaluation  │          │
│  └──┬───┬──┘ └────┬─────┘ └─────────────┘          │
│     │   │         │                                  │
│  ┌──┴─┐ │   ┌─────┴────────┐                        │
│  │Prompt│ │   │文档处理流水线 │                       │
│  │引擎  │ │   │Parse→Clean→  │                       │
│  │      │ │   │Chunk→Embed  │                       │
│  └──┬───┘ │   └──────┬──────┘                       │
│     │     │          │                               │
│  ┌──┴─────┴──────────┴──────┐                       │
│  │      向量数据库 ChromaDB   │                       │
│  └──────────────────────────┘                       │
│                     │                                │
│  ┌──────────────────┴──────┐                        │
│  │    LLM运行时 (Ollama)    │                        │
│  │    对话模型 + 嵌入模型   │                        │
│  └─────────────────────────┘                        │
└─────────────────────────────────────────────────────┘
```

### 2.2 核心数据流：一次问答的完整路径

```
用户输入 "桥梁墩身混凝土强度等级？"
    │
    ▼
[1] API层: POST /api/chat { question: "..." }
    │
    ▼
[2] 问答服务 ChatService.answer()
    │
    ├── [2a] Query改写: 扩展为 "桥梁墩身 混凝土 强度等级 C30 C40 C50 规范要求"
    │
    ├── [2b] 向量检索: ChromaDB.similarity_search(query, k=8)
    │        └── 返回8个语义块，包含 score、metadata（章节号、文档名）
    │
    ├── [2c] 构建双层Prompt
    │        ├── Layer1 CoT: "按 ①识别类型→②定位章节→③抽取参数 三步推理"
    │        └── Layer2 Few-shot: 注入材料强度类示例模板
    │
    ├── [2d] LLM生成: Ollama.generate(prompt)
    │        └── 返回结构化JSON: {参数名, 参数值, 出处, 前提条件}
    │
    ├── [2e] 正则校验
    │        ├── 检查JSON结构完整性
    │        ├── 检查value是否为合法数值+单位
    │        └── 检查是否有模糊词（约、大概、可能）
    │
    ├── [2f] 降级处理（校验失败时）
    │        └── 返回原文片段 + 提示"请参考以下规范原文"
    │
    └── [2g] 返回给前端: { answer, sources, reasoning_steps }
```

### 2.3 文档处理流水线

```
上传文档(Word/PDF/TXT)
    │
    ▼
[1] 格式识别 → 选择解析器
    ├── .docx → python-docx
    ├── .pdf  → pdfplumber
    └── .txt  → 直接读取
    │
    ▼
[2] 文本提取与清洗
    ├── 去除页眉/页脚（基于位置启发式判断）
    ├── 统一换行符/编码(UTF-8)
    ├── 合并被截断的段落
    └── 表格检测 → 转为自然语言描述
    │
    ▼
[3] 语义分块（核心策略）
    ├── 优先按章节标题(正则: ^第[一二三四五六七八九十\d]+[章节])分界
    ├── 每个语义块 = 章节标题 + 正文内容
    ├── 目标块大小: 300-400 tokens
    ├── 超长章节: 按段落逻辑断点二次切分
    └── 块间保留 50 token 重叠(overlap)
    │
    ▼
[4] Embedding向量化
    ├── 调用 Ollama bge-m3 模型
    └── 每块生成 1024维向量
    │
    ▼
[5] 存入 ChromaDB
    ├── Collection: "engineering_standards"
    └── Metadata: { doc_id, doc_name, chapter, chunk_index }
```

---

## 三、项目目录结构

```
中铁二院-智能问答助手/
├── frontend/                    # React + TypeScript 前端
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/          # 通用组件
│   │   │   ├── Layout.tsx       # 页面布局（Header + 导航）
│   │   │   ├── ChatBubble.tsx   # 对话气泡（问题/答案）
│   │   │   ├── SourceCitation.tsx  # 引用来源展示组件
│   │   │   ├── FileUpload.tsx   # 文件拖拽上传组件
│   │   │   └── LoadingSkeleton.tsx # 骨架屏加载
│   │   ├── pages/               # 页面组件
│   │   │   ├── ChatPage.tsx     # 问答主页
│   │   │   ├── KnowledgePage.tsx # 知识库管理
│   │   │   └── EvalPage.tsx     # 评测面板
│   │   ├── services/            # API 调用层
│   │   │   └── api.ts           # Axios 实例 + 接口封装
│   │   ├── store/               # Zustand 状态管理
│   │   │   ├── chatStore.ts     # 对话状态
│   │   │   └── knowledgeStore.ts # 知识库状态
│   │   ├── types/               # TypeScript 类型定义
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css            # TailwindCSS 入口
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── backend/                     # Python FastAPI 后端
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI 入口，路由注册
│   │   ├── config.py            # 配置管理(环境变量 + 默认值)
│   │   ├── api/                 # API 路由层
│   │   │   ├── __init__.py
│   │   │   ├── chat.py          # POST /api/chat
│   │   │   ├── knowledge.py     # 知识库 CRUD
│   │   │   └── eval.py          # 评测相关接口
│   │   ├── services/            # 业务逻辑层
│   │   │   ├── __init__.py
│   │   │   ├── chat_service.py      # 问答核心逻辑
│   │   │   ├── retrieval_service.py # 向量检索
│   │   │   ├── prompt_service.py    # Prompt构建引擎
│   │   │   ├── knowledge_service.py # 知识库管理
│   │   │   ├── document_parser.py   # 文档解析(Word/PDF/TXT)
│   │   │   ├── chunker.py           # 语义分块策略
│   │   │   └── validator.py         # 正则校验与降级
│   │   ├── models/              # 数据模型(Pydantic)
│   │   │   ├── __init__.py
│   │   │   ├── chat.py          # Question/Answer 请求响应模型
│   │   │   ├── knowledge.py     # Document/Chunk 数据模型
│   │   │   └── eval.py          # 评测数据模型
│   │   ├── prompts/             # Prompt模板目录
│   │   │   ├── __init__.py
│   │   │   ├── cot_templates.py     # Chain-of-Thought模板
│   │   │   ├── fewshot_templates.py # 12类Few-shot模板
│   │   │   └── system_prompts.py    # 系统角色设定
│   │   ├── db/                  # 数据库层
│   │   │   ├── __init__.py
│   │   │   ├── chroma_client.py # ChromaDB 客户端管理
│   │   │   └── ollama_client.py # Ollama API 客户端
│   │   └── demo/                # Demo模式数据
│   │       ├── __init__.py
│   │       ├── sample_docs.py   # 预置示例规范文档内容
│   │       └── sample_qa.py     # 预置问答对(无LLM时降级用)
│   ├── data/                    # 运行时数据目录(gitignore)
│   │   ├── chroma/              # ChromaDB 持久化目录
│   │   └── uploads/             # 上传文档存储
│   ├── requirements.txt         # Python依赖
│   ├── pyproject.toml           # 项目元信息
│   └── Dockerfile               # 容器化(可选)
│
├── docker/                      # Docker编排(可选)
│   └── docker-compose.yml
│
├── .gitignore
├── README.md                    # 项目说明（面试展示用）
├── RESEARCH.md                  # 需求研究报告
├── PRD.md                       # 产品需求文档
├── TECH_DESIGN.md               # 技术设计文档(本文档)
└── AGENTS.md                    # AI代理开发规范
```

---

## 四、核心数据模型设计

### 4.1 Pydantic 模型

```python
# 问答相关
class QuestionRequest(BaseModel):
    question: str
    conversation_id: Optional[str] = None

class SourceInfo(BaseModel):
    doc_name: str
    chapter: str
    content_snippet: str
    chunk_index: int

class AnswerResponse(BaseModel):
    question: str
    answer: str
    sources: List[SourceInfo]
    reasoning_steps: Optional[List[str]] = None  # CoT中间推理（可选展示）
    response_time_ms: float

# 知识库相关
class DocumentInfo(BaseModel):
    id: str
    filename: str
    file_size: int
    file_type: str           # docx / pdf / txt
    status: str              # processing / ready / error
    chunk_count: int
    uploaded_at: datetime
    processed_at: Optional[datetime]

class ChunkInfo(BaseModel):
    id: str
    doc_id: str
    content: str
    chapter: str
    chunk_index: int

# 评测相关
class EvalMetrics(BaseModel):
    total_queries: int
    accuracy: float
    avg_response_time_ms: float
    miss_detection_rate: float
    truncation_rate: float
```

### 4.2 ChromaDB Collection 结构

```
Collection: "engineering_standards"

Metadata Schema per chunk:
{
    "doc_id": "uuid",
    "doc_name": "高速铁路桥梁设计规范.docx",
    "chapter": "第3章 桥梁结构设计",
    "chunk_index": 12,
    "content_hash": "sha256",
    "token_count": 350
}
```

---

## 五、关键技术难点与解决方案

### 5.1 文档清洗：表格转自然语言

**难点**：工程规范中表格密集（材料参数表、尺寸对照表），Embedding模型对表格不如对自然语言敏感。

**方案**：
```python
# 将表格转换为自然语言描述
def table_to_text(table: list[list[str]], caption: str = "") -> str:
    """
    输入: [["梁型", "混凝土等级", "跨径范围(m)"],
           ["简支梁", "C50", "20-40"],
           ["连续梁", "C55", "40-80"]]
    输出: "{caption}包含以下内容：简支梁采用C50混凝土、适用于20至40米跨径；
           连续梁采用C55混凝土、适用于40至80米跨径。"
    """
```

### 5.2 语义分块：防止参数定义被切断

**难点**：固定长度分块可能把一个完整的参数定义切到两个块中，检索时碎片化。

**方案**：
```python
class SemanticChunker:
    CHAPTER_PATTERN = re.compile(r'^(第[一二三四五六七八九十\d]+[章节])')
    TARGET_SIZE = 384   # 目标token数
    OVERLAP = 50        # 重叠token数

    def chunk(self, text: str) -> list[Chunk]:
        # 1. 先按章节标题分割
        # 2. 每个章节内，如果长度适中则作为一个块
        # 3. 超长章节按段落+逻辑断点再切
        # 4. 确保每个块包含：章节标题 + 上下文意图
```

### 5.3 双层Prompt设计

**难点**：长文档语义断裂，跨章节参数依赖丢失。

**方案**：
```
Layer1 CoT Prompt:
"""
你是一个轨道交通工程规范专家。请按以下步骤推理：
步骤①【识别类型】判断用户问题属于：计算类/定义类/条件约束类
步骤②【定位章节】分析该问题可能涉及的规范章节
步骤③【抽取参数】从检索到的规范片段中提取具体数值

注意：如果某项参数依赖其他章节的定义，请明确指出
      如果片段中找不到答案，请回答"未找到"，不要编造
"""

Layer2 Few-shot (12类模板之一：材料强度类):
"""
示例1:
问: 高速铁路桥梁墩身混凝土最低强度等级？
答: {"参数": "墩身混凝土强度等级", "值": "C40", "出处": "TB 10002-2017 第5.2.3条", "条件": "设计使用年限100年"}
示例2:
问: 隧道衬砌混凝土抗渗等级要求？
答: {"参数": "衬砌混凝土抗渗等级", "值": "P8", "出处": "TB 10003-2016 第7.4.2条", "条件": "地下水发育地段"}
"""
```

### 5.4 正则校验器

```python
class ResponseValidator:
    FUZZY_PATTERNS = [
        r'约[等于为]?\d+',      # "约等于3"
        r'大[约概]',            # "大概"
        r'可能[为是]',           # "可能是"
        r'左右',                # "3左右"
        r'一般[来说讲]',         # "一般来说"
    ]

    UNIT_PATTERN = re.compile(
        r'\d+\.?\d*\s*(MPa|kN|mm|cm|m|kN·m|N/mm²|级|度|%)'
    )

    def validate(self, response: dict) -> tuple[bool, str]:
        # 1. 检查JSON结构完整性
        # 2. 检查参数值是否为合法数值+单位
        # 3. 检查是否有模糊表述
        # 4. 返回 (通过/失败, 失败原因)
```

### 5.5 Demo模式：无LLM环境下的降级方案

**难点**：面试演示时，面试官的电脑可能没有GPU、没有Ollama。

**方案**：
- 前端检测后端健康状态（是否有LLM可用）
- 如检测到无LLM，自动切换到Demo模式
- Demo模式下预置20条高频问题+标准答案
- 响应用预设答案，但保留完整的检索+Prompt构建流程展示
- 页面顶部显示当前模式（Live / Demo）

---

## 六、接口设计

### 6.1 核心API

```
POST /api/chat/ask
  Request:  { "question": "桥梁墩身混凝土强度等级？" }
  Response: { "answer": "...", "sources": [...], "reasoning_steps": [...], "response_time_ms": 2340 }

POST /api/knowledge/upload
  Request:  multipart/form-data { file }
  Response: { "doc_id": "uuid", "status": "processing" }

GET  /api/knowledge/documents
  Response: { "documents": [DocumentInfo, ...] }

DELETE /api/knowledge/documents/{doc_id}
  Response: { "success": true }

POST /api/knowledge/reprocess/{doc_id}
  Response: { "doc_id": "uuid", "status": "processing" }

GET  /api/eval/metrics
  Response: EvalMetrics

GET  /api/health
  Response: { "status": "ok", "llm_available": true/false, "mode": "live"/"demo" }
```

---

## 七、验收确认

- [x] 技术栈选型适配项目需求，无不合理的技术选择
- [x] 项目结构清晰，职责划分明确（前端/后端/服务层/数据层）
- [x] 核心数据模型与技术难点有明确的解决方案
- [x] 所有内容已沉淀到 TECH_DESIGN.md
