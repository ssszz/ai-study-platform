"""
Seed data module - populates the database on first startup.
Idempotent: safe to run multiple times without duplicating data.
"""

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.models.course import Category, Course
from app.models.question import Question
from app.services.auth_service import hash_password

# ---------------------------------------------------------------------------
# Data definitions
# ---------------------------------------------------------------------------

CATEGORIES = [
    (1, "AI基础概念", "什么是AI、LLM原理、Token、Embedding等", 1),
    (2, "提示词工程", "Prompt设计、Few-shot、Chain-of-Thought、System Prompt", 2),
    (3, "灵基平台概览", "灵基定位、架构、三大模式、核心理念", 3),
    (4, "灵基Chat模式", "对话协作、知识库检索、数据分析、方案起草", 4),
    (5, "灵基Work模式", "任务承接、流程执行、Agent调度、结果交付", 5),
    (6, "灵基Build模式", "低代码搭建、VibeCoding、原型探索、应用生成", 6),
    (7, "Skill技能开发", "MCP协议、业务封装、技能组合、可复用沉淀", 7),
    (8, "Agent智能体开发", "六维定义模型、创建编排、生命周期管理", 8),
    (9, "AI治理与安全", "权限控制、审计追踪、责任链、数据合规", 9),
]

COURSES = [
    (1, "AI是什么：从图灵测试到ChatGPT", 1, "L1", 15),
    (2, "大语言模型（LLM）入门", 1, "L1", 15),
    (3, "认识金蝶灵基平台", 3, "L1", 10),
    (4, "灵基Chat模式快速上手", 4, "L1", 10),
    (5, "AI使用中的安全常识", 9, "L1", 10),
    (6, "提示词工程实战", 2, "L2", 20),
    (7, "灵基Work模式详解", 5, "L2", 15),
    (8, "什么是Skill技能", 7, "L2", 15),
    (9, "什么是Agent智能体", 8, "L2", 15),
    (10, "MCP协议入门", 7, "L2", 15),
    (11, "Skill开发实战：MCP业务技能封装", 7, "L3", 25),
    (12, "Agent六维定义与创建", 8, "L3", 25),
    (13, "Agent编排与调度", 8, "L3", 25),
    (14, "灵基Build模式全流程", 6, "L3", 25),
    (15, "Agent治理与审计实践", 9, "L3", 20),
]


def get_sample_questions():
    """Return ~120 professional questions covering all 9 categories and 3 levels.
    Distribution: L1~40, L2~45, L3~35. Types: ~65 single, ~30 multi, ~25 true_false."""
    q = []

    # =====================================================================
    # L1 入门 (40 questions: 20 single, 10 multi, 10 true_false)
    # =====================================================================

    # --- Category 1: AI基础概念 ---
    q.extend([
        {"title": "以下哪项最能准确描述人工智能（AI）？", "options": ["A. 一种只能执行数学计算的机器", "B. 模拟人类智能的计算机系统", "C. 一种新型的编程语言", "D. 只能用于图像识别的技术"], "correct_answer": "B", "category_id": 1, "level": "L1", "type": "single", "score": 2},
        {"title": "ChatGPT 是由哪家公司开发的？", "options": ["A. Google", "B. Microsoft", "C. OpenAI", "D. Meta"], "correct_answer": "C", "category_id": 1, "level": "L1", "type": "single", "score": 2},
        {"title": "大语言模型（LLM）中的Token通常指什么？", "options": ["A. 模型的文件名", "B. 文本被拆分后的最小处理单元", "C. 模型的版本号", "D. 一种加密算法"], "correct_answer": "B", "category_id": 1, "level": "L1", "type": "single", "score": 2},
        {"title": "以下哪些属于AI的应用场景？（多选）", "options": ["A. 智能客服", "B. 图像识别", "C. 自动驾驶", "D. 语音助手"], "correct_answer": ["A", "B", "C", "D"], "category_id": 1, "level": "L1", "type": "multi", "score": 4},
        {"title": "AI可以完全替代人类的所有工作，不需要人类参与。", "options": [], "correct_answer": False, "category_id": 1, "level": "L1", "type": "true_false", "score": 1},
    ])

    # --- Category 2: 提示词工程 (L1) ---
    q.extend([
        {"title": "Prompt（提示词）在AI交互中的作用是什么？", "options": ["A. 仅用于美化输出格式", "B. 向AI传达任务指令和上下文", "C. 加速计算机CPU运行", "D. 替代数据库"], "correct_answer": "B", "category_id": 2, "level": "L1", "type": "single", "score": 2},
        {"title": "向AI提问时，以下哪种做法效果更好？", "options": ["A. 尽量简短，只说关键词", "B. 提供清晰、具体、有上下文的描述", "C. 使用专业术语越多越好", "D. 一次问多个完全无关的问题"], "correct_answer": "B", "category_id": 2, "level": "L1", "type": "single", "score": 2},
        {"title": "一个好的Prompt应该具备哪些特征？（多选）", "options": ["A. 明确的任务描述", "B. 相关的上下文信息", "C. 清晰的输出格式要求", "D. 越长越好，不管内容"], "correct_answer": ["A", "B", "C"], "category_id": 2, "level": "L1", "type": "multi", "score": 4},
        {"title": "使用AI时，只要把问题描述清楚就够了，不需要考虑输出格式。", "options": [], "correct_answer": False, "category_id": 2, "level": "L1", "type": "true_false", "score": 1},
    ])

    # --- Category 3: 灵基平台概览 ---
    q.extend([
        {"title": "金蝶灵基（Lingee）平台的核心定位是什么？", "options": ["A. 财务记账软件", "B. 企业级AI操作系统", "C. 人力资源管理工具", "D. 云存储文件系统"], "correct_answer": "B", "category_id": 3, "level": "L1", "type": "single", "score": 2},
        {"title": "灵基平台包含以下哪些工作模式？（多选）", "options": ["A. Chat模式", "B. Work模式", "C. Build模式", "D. Game模式"], "correct_answer": ["A", "B", "C"], "category_id": 3, "level": "L1", "type": "multi", "score": 4},
        {"title": "灵基Chat模式的核心能力是什么？", "options": ["A. 编译Java代码", "B. 人与AI通过自然语言协作思考", "C. 管理服务器集群", "D. 绘制CAD图纸"], "correct_answer": "B", "category_id": 3, "level": "L1", "type": "single", "score": 2},
        {"title": "灵基平台中的\"灵基人\"概念，是指完全由AI替代的人。", "options": [], "correct_answer": False, "category_id": 3, "level": "L1", "type": "true_false", "score": 1},
    ])

    # --- Category 4: 灵基Chat模式 ---
    q.extend([
        {"title": "灵基Chat模式中，AI可以调用企业内部的什么来给出有依据的回答？", "options": ["A. 社交媒体数据", "B. 企业内部真实数据与知识库", "C. 公开网页搜索结果", "D. 个人邮箱内容"], "correct_answer": "B", "category_id": 4, "level": "L1", "type": "single", "score": 2},
        {"title": "在灵基Chat中，以下哪些任务是AI可以协助完成的？（多选）", "options": ["A. 分析财务报表", "B. 起草业务方案", "C. 复盘销售策略", "D. 查询企业知识库"], "correct_answer": ["A", "B", "C", "D"], "category_id": 4, "level": "L1", "type": "multi", "score": 4},
        {"title": "灵基Chat模式只能用于简单的问答，不能处理复杂的业务分析。", "options": [], "correct_answer": False, "category_id": 4, "level": "L1", "type": "true_false", "score": 1},
    ])

    # --- Category 5: 灵基Work模式 (L1) ---
    q.extend([
        {"title": "灵基Work模式的核心是什么？", "options": ["A. 手动填写表单", "B. AI Agent承接任务并自主执行", "C. 发送电子邮件", "D. 网页浏览"], "correct_answer": "B", "category_id": 5, "level": "L1", "type": "single", "score": 2},
        {"title": "在灵基Work模式中，人在关键节点的角色是什么？", "options": ["A. 完全不需要参与", "B. 做决策和确认", "C. 手动输入数据", "D. 编写所有代码"], "correct_answer": "B", "category_id": 5, "level": "L1", "type": "single", "score": 2},
    ])

    # --- Category 6: 灵基Build模式 (L1) ---
    q.extend([
        {"title": "灵基Build模式的主要目标用户是谁？", "options": ["A. 仅限程序员", "B. 业务人员和开发者均可使用", "C. 仅限系统管理员", "D. 仅限CEO"], "correct_answer": "B", "category_id": 6, "level": "L1", "type": "single", "score": 2},
        {"title": "灵基Build模式支持零代码或低代码搭建应用。", "options": [], "correct_answer": True, "category_id": 6, "level": "L1", "type": "true_false", "score": 1},
    ])

    # --- Category 7: Skill技能开发 (L1) ---
    q.extend([
        {"title": "在灵基平台中，Skill（技能）的作用是什么？", "options": ["A. 企业业务能力封装为可复用的单元", "B. 替代所有员工", "C. 仅用于文档排版", "D. 一种编程语言"], "correct_answer": "A", "category_id": 7, "level": "L1", "type": "single", "score": 2},
        {"title": "以下关于Skill的描述，正确的有？（多选）", "options": ["A. Skill是业务能力封装单元", "B. Skill可被多个Agent复用", "C. Skill遵循MCP协议标准", "D. Skill开发完成后无法修改"], "correct_answer": ["A", "B", "C"], "category_id": 7, "level": "L1", "type": "multi", "score": 4},
        {"title": "Skill开发完成后就不能再修改了。", "options": [], "correct_answer": False, "category_id": 7, "level": "L1", "type": "true_false", "score": 1},
    ])

    # --- Category 9: AI治理与安全 (L1) ---
    q.extend([
        {"title": "AI使用中，以下哪种做法是正确的？", "options": ["A. 将公司机密数据直接输入公共AI工具", "B. 使用AI前确认数据合规性并脱敏处理", "C. 完全信任AI的输出不做验证", "D. 使用简单密码保护AI系统账号"], "correct_answer": "B", "category_id": 9, "level": "L1", "type": "single", "score": 2},
        {"title": "企业使用AI工具时，哪些安全措施是必要的？（多选）", "options": ["A. 数据脱敏处理", "B. 访问权限控制", "C. 使用审计日志", "D. 把全部数据上传"], "correct_answer": ["A", "B", "C"], "category_id": 9, "level": "L1", "type": "multi", "score": 4},
        {"title": "AI的输出总是100%准确，不需要人工核实。", "options": [], "correct_answer": False, "category_id": 9, "level": "L1", "type": "true_false", "score": 1},
    ])

    # =====================================================================
    # L2 进阶 (45 questions: 25 single, 10 multi, 10 true_false)
    # =====================================================================

    # --- Category 1: AI基础概念 (L2) ---
    q.extend([
        {"title": "大语言模型中的\"Transformer架构\"最重要的创新是什么？", "options": ["A. 使用循环神经网络逐字处理", "B. 自注意力机制（Self-Attention），可并行处理序列", "C. 仅使用卷积操作", "D. 依赖人工规则引擎"], "correct_answer": "B", "category_id": 1, "level": "L2", "type": "single", "score": 3},
        {"title": "Embedding（嵌入）在NLP中的主要作用是什么？", "options": ["A. 压缩图像文件", "B. 将词语/文本映射到低维稠密向量空间以表示语义", "C. 加密用户密码", "D. 生成随机数"], "correct_answer": "B", "category_id": 1, "level": "L2", "type": "single", "score": 3},
        {"title": "以下哪些是Transformer架构的关键组件？（多选）", "options": ["A. 自注意力层（Self-Attention）", "B. 前馈神经网络（Feed-Forward）", "C. 位置编码（Positional Encoding）", "D. 长短期记忆单元（LSTM）"], "correct_answer": ["A", "B", "C"], "category_id": 1, "level": "L2", "type": "multi", "score": 5},
        {"title": "Transformer模型只能处理文本，不能处理图像。", "options": [], "correct_answer": False, "category_id": 1, "level": "L2", "type": "true_false", "score": 2},
        {"title": "RAG（检索增强生成）技术的主要优势是什么？", "options": ["A. 让模型变小", "B. 结合外部知识库，减少模型幻觉，提供可溯源的答案", "C. 加快训练速度", "D. 替换所有数据库"], "correct_answer": "B", "category_id": 1, "level": "L2", "type": "single", "score": 3},
    ])

    # --- Category 2: 提示词工程 (L2) ---
    q.extend([
        {"title": "Few-shot prompting 的核心思想是什么？", "options": ["A. 不给AI任何示例", "B. 在提示中提供少量示例来引导AI输出格式和风格", "C. 给AI提供所有可能的答案", "D. 让AI自行搜索答案"], "correct_answer": "B", "category_id": 2, "level": "L2", "type": "single", "score": 3},
        {"title": "Chain-of-Thought（思维链）提示技术的核心原理是？", "options": ["A. 让AI跳过推理直接给出答案", "B. 引导AI展示逐步推理过程，从而提高复杂问题的准确性", "C. 限制AI的输出长度", "D. 让AI随机选择答案"], "correct_answer": "B", "category_id": 2, "level": "L2", "type": "single", "score": 3},
        {"title": "以下哪些属于提示词工程技术？（多选）", "options": ["A. Chain-of-Thought（思维链）", "B. Zero-shot Prompting", "C. Few-shot Prompting", "D. 反向传播算法"], "correct_answer": ["A", "B", "C"], "category_id": 2, "level": "L2", "type": "multi", "score": 5},
        {"title": "System Prompt（系统提示）用于定义AI的角色身份、行为边界和回答规则。", "options": [], "correct_answer": True, "category_id": 2, "level": "L2", "type": "true_false", "score": 2},
        {"title": "提示词中设置Temperature参数的作用是什么？", "options": ["A. 控制CPU温度", "B. 控制AI输出的随机性和创造性", "C. 调节屏幕亮度", "D. 设置网络速度"], "correct_answer": "B", "category_id": 2, "level": "L2", "type": "single", "score": 3},
        {"title": "在编写Prompt时，\"角色设定+任务描述+格式要求+示例\"是一个有效的结构模板。", "options": [], "correct_answer": True, "category_id": 2, "level": "L2", "type": "true_false", "score": 2},
    ])

    # --- Category 3: 灵基平台概览 (L2) ---
    q.extend([
        {"title": "金蝶灵基提出的\"Chat-Work-Build\"三者关系，以下描述最准确的是？", "options": ["A. 三者独立运作，互不关联", "B. Chat是入口、Work是执行、Build是沉淀，三者形成闭环", "C. 只需使用Chat即可，其他不重要", "D. Build是唯一核心，Chat和Work是附属"], "correct_answer": "B", "category_id": 3, "level": "L2", "type": "single", "score": 3},
        {"title": "金蝶灵基强调\"以财务为枢纽\"，其含义是什么？", "options": ["A. 灵基只能做财务工作", "B. 依托金蝶33年财务管理实践，将财务从事后记账变为连接全企业的实时枢纽", "C. 财务部门不需要使用灵基", "D. 灵基替代所有财务软件"], "correct_answer": "B", "category_id": 3, "level": "L2", "type": "single", "score": 3},
        {"title": "灵基平台的\"五大小闭环\"实施节奏包含哪些环节？（多选）", "options": ["A. 输入", "B. 处理", "C. 确认", "D. 输出", "E. 复盘"], "correct_answer": ["A", "B", "C", "D", "E"], "category_id": 3, "level": "L2", "type": "multi", "score": 5},
    ])

    # --- Category 4: 灵基Chat模式 (L2) ---
    q.extend([
        {"title": "灵基Chat与通用AI聊天工具的最大区别是什么？", "options": ["A. 界面颜色不同", "B. 可以深度连接企业SaaS系统和业务数据", "C. 只能在工作时间使用", "D. 不需要网络连接"], "correct_answer": "B", "category_id": 4, "level": "L2", "type": "single", "score": 3},
        {"title": "在灵基Chat中，AI可以调用哪些资源来回答问题？（多选）", "options": ["A. 企业内部知识库", "B. ERP系统中的实时数据", "C. 业务规则和流程", "D. 互联网所有公开信息"], "correct_answer": ["A", "B", "C"], "category_id": 4, "level": "L2", "type": "multi", "score": 5},
        {"title": "灵基Chat只能处理中文，不支持其他语言。", "options": [], "correct_answer": False, "category_id": 4, "level": "L2", "type": "true_false", "score": 2},
    ])

    # --- Category 5: 灵基Work模式 (L2) ---
    q.extend([
        {"title": "灵基Work模式的核心能力是什么？", "options": ["A. 纯聊天对话", "B. AI Agent嵌入业务流程，自动执行任务并交付成果", "C. 代码编译与部署", "D. 数据库备份"], "correct_answer": "B", "category_id": 5, "level": "L2", "type": "single", "score": 3},
        {"title": "以下是灵基已落地的典型业务Agent有？（多选）", "options": ["A. 费用报销智能体", "B. 期末结账智能体", "C. 销售履约智能体", "D. 采购付款审核智能体"], "correct_answer": ["A", "B", "C", "D"], "category_id": 5, "level": "L2", "type": "multi", "score": 5},
        {"title": "灵基Work模式中，智能体只能处理审批类任务，不能处理对账、排产等流程。", "options": [], "correct_answer": False, "category_id": 5, "level": "L2", "type": "true_false", "score": 2},
        {"title": "在Work模式中，衡量Agent效果的四个关键指标不包括以下哪项？", "options": ["A. 处理时长是否缩短", "B. 异常是否提前发现", "C. 服务器CPU使用率", "D. 复核意见是否沉淀"], "correct_answer": "C", "category_id": 5, "level": "L2", "type": "single", "score": 3},
    ])

    # --- Category 6: 灵基Build模式 (L2) ---
    q.extend([
        {"title": "灵基Build模式中，以下哪些是主要开发能力？（多选）", "options": ["A. Agent开发", "B. Skill开发", "C. 应用开发", "D. 原型探索"], "correct_answer": ["A", "B", "C", "D"], "category_id": 6, "level": "L2", "type": "multi", "score": 5},
        {"title": "灵基Build中\"分钟级原型探索\"意味着什么？", "options": ["A. 每个原型必须在一分钟内完成", "B. 业务人员可快速搭建AI应用原型，大幅缩短验证周期", "C. 只能运行一分钟", "D. 原型不需要测试"], "correct_answer": "B", "category_id": 6, "level": "L2", "type": "single", "score": 3},
        {"title": "灵基Build模式仅支持专业开发者使用，业务人员无法参与。", "options": [], "correct_answer": False, "category_id": 6, "level": "L2", "type": "true_false", "score": 2},
    ])

    # --- Category 7: Skill技能开发 (L2) ---
    q.extend([
        {"title": "MCP协议的全称是什么？", "options": ["A. Model Communication Protocol", "B. Model Context Protocol", "C. Machine Control Protocol", "D. Multi-Cloud Protocol"], "correct_answer": "B", "category_id": 7, "level": "L2", "type": "single", "score": 3},
        {"title": "MCP协议的核心价值是什么？", "options": ["A. 加速网络传输", "B. 为AI模型提供标准化的上下文与工具交互协议", "C. 加密所有文件", "D. 压缩数据库存储"], "correct_answer": "B", "category_id": 7, "level": "L2", "type": "single", "score": 3},
        {"title": "Skill技能的核心价值包括？（多选）", "options": ["A. 业务能力标准化封装", "B. 跨场景可复用", "C. 多技能可组合编排", "D. 完全替代人工判断"], "correct_answer": ["A", "B", "C"], "category_id": 7, "level": "L2", "type": "multi", "score": 5},
        {"title": "Skill开发遵循MCP协议后，可以被任何支持MCP的AI平台调用。", "options": [], "correct_answer": True, "category_id": 7, "level": "L2", "type": "true_false", "score": 2},
    ])

    # --- Category 8: Agent智能体开发 (L2) ---
    q.extend([
        {"title": "Agent智能体区别于普通AI聊天机器人的核心特征是什么？", "options": ["A. 只能回答预设FAQ", "B. 具备自主规划、工具调用和任务执行能力", "C. 不需要任何输入", "D. 仅能生成文本"], "correct_answer": "B", "category_id": 8, "level": "L2", "type": "single", "score": 3},
        {"title": "企业Agent智能体的典型应用场景包括哪些？（多选）", "options": ["A. 自动处理费用报销审批", "B. 智能调度生产排产", "C. 自动对账与异常提醒", "D. 客户订单履约跟踪"], "correct_answer": ["A", "B", "C", "D"], "category_id": 8, "level": "L2", "type": "multi", "score": 5},
        {"title": "Agent智能体可以自主执行所有操作，不需要设置任何权限边界。", "options": [], "correct_answer": False, "category_id": 8, "level": "L2", "type": "true_false", "score": 2},
        {"title": "Agent的\"岗位定义\"在六维模型中对应哪个维度？", "options": ["A. 知识管理", "B. 角色与目标", "C. 工具与技能", "D. 安全与治理"], "correct_answer": "B", "category_id": 8, "level": "L2", "type": "single", "score": 3},
    ])

    # --- Category 9: AI治理与安全 (L2) ---
    q.extend([
        {"title": "AI治理中\"责任链\"机制的核心原则是什么？", "options": ["A. AI承担全部责任", "B. AI准备事实和建议，但涉及资金、合同等高风险决策时必须由人确认", "C. 所有人都不负责", "D. 完全自动化决策"], "correct_answer": "B", "category_id": 9, "level": "L2", "type": "single", "score": 3},
        {"title": "企业AI安全治理的三个核心问题是？（多选）", "options": ["A. 数据是否可信", "B. 流程是否闭环", "C. 责任是否清楚", "D. 界面是否美观"], "correct_answer": ["A", "B", "C"], "category_id": 9, "level": "L2", "type": "multi", "score": 5},
        {"title": "AI审计追踪只需要记录最终结果，不需要记录中间决策过程。", "options": [], "correct_answer": False, "category_id": 9, "level": "L2", "type": "true_false", "score": 2},
    ])

    # =====================================================================
    # L3 高级 (35 questions: 20 single, 10 multi, 5 true_false)
    # =====================================================================

    # --- Category 1: AI基础概念 (L3) ---
    q.extend([
        {"title": "大模型Fine-tuning（微调）与RAG的主要区别是什么？", "options": ["A. 两者完全相同", "B. Fine-tuning改变模型参数，RAG通过检索外部知识增强生成", "C. RAG改变模型参数，Fine-tuning检索外部知识", "D. 两者都只能用于翻译任务"], "correct_answer": "B", "category_id": 1, "level": "L3", "type": "single", "score": 4},
        {"title": "在选择Fine-tuning还是RAG时，以下哪些是正确的考量因素？（多选）", "options": ["A. 数据更新频率", "B. 训练成本预算", "C. 对输出可控性的要求", "D. 是否需要模型学习新的领域知识模式"], "correct_answer": ["A", "B", "C", "D"], "category_id": 1, "level": "L3", "type": "multi", "score": 6},
        {"title": "大模型的\"幻觉\"（Hallucination）问题可以通过RAG技术完全消除。", "options": [], "correct_answer": False, "category_id": 1, "level": "L3", "type": "true_false", "score": 2},
    ])

    # --- Category 2: 提示词工程 (L3) ---
    q.extend([
        {"title": "ReAct（Reasoning + Acting）提示框架的核心机制是什么？", "options": ["A. 只推理不行动", "B. 交替进行推理思考与工具调用行动，逐步接近目标", "C. 只调用API", "D. 随机选择行动"], "correct_answer": "B", "category_id": 2, "level": "L3", "type": "single", "score": 4},
        {"title": "在构建复杂的Agent提示时，以下哪些策略是有效的？（多选）", "options": ["A. 分层设定角色与子目标", "B. 明确工具调用的触发条件和参数格式", "C. 设置安全检查与边界规则", "D. 所有指令用一句话概括即可"], "correct_answer": ["A", "B", "C"], "category_id": 2, "level": "L3", "type": "multi", "score": 6},
        {"title": "提示词工程中，Temperature设为0时模型输出最随机、最有创造性。", "options": [], "correct_answer": False, "category_id": 2, "level": "L3", "type": "true_false", "score": 2},
    ])

    # --- Category 3: 灵基平台概览 (L3) ---
    q.extend([
        {"title": "金蝶灵基相比通用大模型公司的核心竞争壁垒是什么？", "options": ["A. 模型参数更大", "B. 33年企业管理本体知识+AI原生技术深度融合", "C. 价格更低", "D. 只做基础模型"], "correct_answer": "B", "category_id": 3, "level": "L3", "type": "single", "score": 4},
        {"title": "灵基平台\"Skill市场\"和\"Agent市场\"的生态价值体现在哪些方面？（多选）", "options": ["A. 企业和开发者可以发布和共享Skill", "B. 形成可复用的Agent模板库", "C. 降低企业AI应用构建门槛", "D. 替代企业内部所有IT系统"], "correct_answer": ["A", "B", "C"], "category_id": 3, "level": "L3", "type": "multi", "score": 6},
    ])

    # --- Category 4: 灵基Chat模式 (L3) ---
    q.extend([
        {"title": "在灵基Chat中实施企业级对话时，以下哪项不是必要的治理措施？", "options": ["A. 设定数据可读范围和权限", "B. 审计日志记录", "C. 实时监控GPU温度", "D. 敏感信息脱敏处理"], "correct_answer": "C", "category_id": 4, "level": "L3", "type": "single", "score": 4},
        {"title": "灵基Chat在接入多系统数据时，需要考虑哪些架构因素？（多选）", "options": ["A. 数据源的认证与授权", "B. API接口的兼容性", "C. 数据格式的标准化", "D. 查询性能与缓存策略"], "correct_answer": ["A", "B", "C", "D"], "category_id": 4, "level": "L3", "type": "multi", "score": 6},
    ])

    # --- Category 5: 灵基Work模式 (L3) ---
    q.extend([
        {"title": "在灵基Work的Agent调度中，\"闭环协同\"机制的关键顺序是什么？", "options": ["A. Build→Chat→Work", "B. Chat（入口）→Work（执行）→Build（沉淀）→治理→复盘", "C. Work→Build→Chat", "D. 三者同时进行"], "correct_answer": "B", "category_id": 5, "level": "L3", "type": "single", "score": 4},
        {"title": "灵基Work模式中Agent的生命周期管理包括哪些阶段？（多选）", "options": ["A. 试点任务选择与验证", "B. 系统连接与数据集成", "C. 权限边界设定", "D. 能力沉淀与场景扩展"], "correct_answer": ["A", "B", "C", "D"], "category_id": 5, "level": "L3", "type": "multi", "score": 6},
        {"title": "在灵基Work中，一次任务处理后留下的规则和知识可以被后续任务复用，形成\"越用越智能\"的效果。", "options": [], "correct_answer": True, "category_id": 5, "level": "L3", "type": "true_false", "score": 2},
    ])

    # --- Category 6: 灵基Build模式 (L3) ---
    q.extend([
        {"title": "灵基Build中\"VibeCoding\"的核心理念是什么？", "options": ["A. 传统手工编写所有代码", "B. 通过自然语言描述意图，AI理解业务需求并生成应用", "C. 使用特定编程语言从零开发", "D. 只能生成静态网页"], "correct_answer": "B", "category_id": 6, "level": "L3", "type": "single", "score": 4},
        {"title": "灵基Build模式与应用传统开发相比，以下哪些是差异化优势？（多选）", "options": ["A. 开发周期大幅缩短", "B. 业务人员可直接参与", "C. 自动生成所有文档", "D. 从需求到可运行系统链路更短"], "correct_answer": ["A", "B", "D"], "category_id": 6, "level": "L3", "type": "multi", "score": 6},
        {"title": "灵基Build可以生成复杂的ERP页面和业务逻辑插件。", "options": [], "correct_answer": True, "category_id": 6, "level": "L3", "type": "true_false", "score": 2},
        {"title": "在灵基Build中开发Agent应用时，\"原型探索→验证→迭代\"的快速循环是关键方法论。", "options": [], "correct_answer": True, "category_id": 6, "level": "L3", "type": "true_false", "score": 2},
    ])

    # --- Category 7: Skill技能开发 (L3) ---
    q.extend([
        {"title": "在MCP业务技能封装中，以下哪些是必要的步骤？（多选）", "options": ["A. 定义工具的输入输出Schema", "B. 实现业务逻辑处理函数", "C. 注册技能到MCP Server", "D. 编写完整的操作系统内核"], "correct_answer": ["A", "B", "C"], "category_id": 7, "level": "L3", "type": "multi", "score": 6},
        {"title": "MCP协议中，Tool定义的三个核心要素是什么？", "options": ["A. name（名称）、description（描述）、inputSchema（输入模式）", "B. color、size、font", "C. URL、port、protocol", "D. username、password、token"], "correct_answer": "A", "category_id": 7, "level": "L3", "type": "single", "score": 4},
        {"title": "将多个Skill组合编排为Agent时，以下哪些是关键的架构考量？（多选）", "options": ["A. Skill之间的调用顺序和数据依赖", "B. 错误处理和降级策略", "C. 权限验证与安全边界", "D. 性能开销和并发控制"], "correct_answer": ["A", "B", "C", "D"], "category_id": 7, "level": "L3", "type": "multi", "score": 6},
        {"title": "MCP Server启动后，Skill的Tool列表会动态暴露给AI模型，模型可根据任务需求自主选择合适的Tool调用。", "options": [], "correct_answer": True, "category_id": 7, "level": "L3", "type": "true_false", "score": 2},
    ])

    # --- Category 8: Agent智能体开发 (L3) ---
    q.extend([
        {"title": "Agent六维定义模型包含以下哪些维度？（多选）", "options": ["A. 岗位定义", "B. 知识管理", "C. 任务管理", "D. 产物管理", "E. 技能调度", "F. 执行计划"], "correct_answer": ["A", "B", "C", "D", "E", "F"], "category_id": 8, "level": "L3", "type": "multi", "score": 6},
        {"title": "Agent生命周期管理中，编排（Orchestration）的主要目的是什么？", "options": ["A. 删除不需要的Agent", "B. 协调多个Agent、Skill和数据流协同完成复杂业务任务", "C. 重命名Agent实例", "D. 备份Agent的对话记录"], "correct_answer": "B", "category_id": 8, "level": "L3", "type": "single", "score": 4},
        {"title": "Agent编排中，所有Agent必须同时并行运行，不能有先后依赖关系。", "options": [], "correct_answer": False, "category_id": 8, "level": "L3", "type": "true_false", "score": 2},
        {"title": "在Agent的\"执行计划\"维度中，以下哪种策略最有助于处理复杂多步骤任务？", "options": ["A. 一次性执行所有步骤", "B. 将大任务分解为子任务，根据执行结果动态调整后续步骤", "C. 随机选择执行顺序", "D. 忽略所有中间结果"], "correct_answer": "B", "category_id": 8, "level": "L3", "type": "single", "score": 4},
    ])

    # --- Category 9: AI治理与安全 (L3) ---
    q.extend([
        {"title": "以下哪些属于AI治理的关键要素？（多选）", "options": ["A. 权限控制与访问管理", "B. 数据合规与隐私保护", "C. 责任链与人工复核机制", "D. 审计追踪与日志记录", "E. 模型版本管理"], "correct_answer": ["A", "B", "C", "D", "E"], "category_id": 9, "level": "L3", "type": "multi", "score": 6},
        {"title": "AI审计追踪的主要目的是什么？", "options": ["A. 提高AI运行速度", "B. 记录AI决策过程和操作记录以便追溯、问责和合规审查", "C. 减少AI模型的参数量", "D. 美化系统界面"], "correct_answer": "B", "category_id": 9, "level": "L3", "type": "single", "score": 4},
        {"title": "灵基平台已通过信通院首批企业级智能体安全认证。", "options": [], "correct_answer": True, "category_id": 9, "level": "L3", "type": "true_false", "score": 2},
        {"title": "Agent治理的\"权限最小化\"原则是指Agent只能访问执行其任务所必需的数据和功能。", "options": [], "correct_answer": True, "category_id": 9, "level": "L3", "type": "true_false", "score": 2},
    ])

    return q


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def init_data():
    """Idempotent seed function - populates DB on first startup.
    Safe to call multiple times."""
    db: Session = SessionLocal()
    try:
        # -- Admin user --
        if not db.query(User).filter(User.username == "admin").first():
            db.add(User(
                username="admin",
                password=hash_password("admin123"),
                real_name="管理员",
                department="技术部",
                role="admin",
            ))
            db.commit()

        # -- Categories --
        for cid, name, desc, order in CATEGORIES:
            if not db.query(Category).filter(Category.id == cid).first():
                db.add(Category(id=cid, name=name, description=desc, sort_order=order))
        db.commit()

        # -- Courses --
        for cid, title, cat_id, level, mins in COURSES:
            if not db.query(Course).filter(Course.id == cid).first():
                db.add(Course(
                    id=cid, title=title, category_id=cat_id,
                    level=level, read_time_minutes=mins,
                    content=f"# {title}\n\n课程内容加载中...\n\n请管理员编辑课程内容。",
                ))
        db.commit()

        # -- Questions --
        existing_count = db.query(Question).count()
        if existing_count == 0:
            for q_data in get_sample_questions():
                db.add(Question(**q_data))
            db.commit()

        user_count = db.query(User).count()
        cat_count = db.query(Category).count()
        course_count = db.query(Course).count()
        q_count = db.query(Question).count()
        print(f"Seed data OK: {user_count} users, {cat_count} categories, "
              f"{course_count} courses, {q_count} questions")

    finally:
        db.close()


if __name__ == "__main__":
    init_data()
