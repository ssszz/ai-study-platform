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
    """Return a list of dicts with question data (at least 20 questions
    covering multiple categories and levels)."""
    questions = []

    # ---- L1 questions ----

    # Category 1: AI基础概念
    questions.extend([
        {
            "title": "以下哪项最能准确描述人工智能（AI）？",
            "options": ["A. 一种只能执行数学计算的机器", "B. 模拟人类智能的计算机系统", "C. 一种新型的编程语言", "D. 只能用于图像识别的技术"],
            "correct_answer": "B",
            "category_id": 1, "level": "L1", "type": "single", "score": 2,
        },
        {
            "title": "ChatGPT 是由哪家公司开发的？",
            "options": ["A. Google", "B. Microsoft", "C. OpenAI", "D. Meta"],
            "correct_answer": "C",
            "category_id": 1, "level": "L1", "type": "single", "score": 2,
        },
        {
            "title": "以下哪些属于AI的应用场景？（多选）",
            "options": ["A. 智能客服", "B. 图像识别", "C. 自动驾驶", "D. 语音助手"],
            "correct_answer": ["A", "B", "C", "D"],
            "category_id": 1, "level": "L1", "type": "multi", "score": 4,
        },
        {
            "title": "AI可以完全替代人类的所有工作，不需要人类参与。",
            "options": [],
            "correct_answer": False,
            "category_id": 1, "level": "L1", "type": "true_false", "score": 1,
        },
    ])

    # Category 3: 灵基平台概览
    questions.extend([
        {
            "title": "金蝶灵基平台的核心定位是什么？",
            "options": ["A. 财务软件", "B. 企业级AI应用开发平台", "C. 人力资源管理系统", "D. 云存储服务"],
            "correct_answer": "B",
            "category_id": 3, "level": "L1", "type": "single", "score": 2,
        },
        {
            "title": "灵基平台包含以下哪些模式？（多选）",
            "options": ["A. Chat模式", "B. Work模式", "C. Build模式", "D. Game模式"],
            "correct_answer": ["A", "B", "C"],
            "category_id": 3, "level": "L1", "type": "multi", "score": 4,
        },
    ])

    # Category 4: 灵基Chat模式
    questions.extend([
        {
            "title": "灵基Chat模式中，用户主要通过什么方式与AI交互？",
            "options": ["A. 编写代码", "B. 自然语言对话", "C. 拖拽组件", "D. 上传文件"],
            "correct_answer": "B",
            "category_id": 4, "level": "L1", "type": "single", "score": 2,
        },
    ])

    # Category 9: AI治理与安全
    questions.extend([
        {
            "title": "AI使用中，以下哪种做法是正确的？",
            "options": ["A. 将公司机密数据直接输入公共AI工具", "B. 使用AI前确认数据合规性", "C. 完全信任AI的输出不做验证", "D. 使用默认密码保护AI系统"],
            "correct_answer": "B",
            "category_id": 9, "level": "L1", "type": "single", "score": 2,
        },
    ])

    # ---- L2 questions ----

    # Category 2: 提示词工程
    questions.extend([
        {
            "title": "Few-shot prompting 的核心思想是什么？",
            "options": ["A. 不给AI任何示例", "B. 在提示中提供少量示例来引导AI输出", "C. 给AI提供所有可能的答案", "D. 让AI自行搜索答案"],
            "correct_answer": "B",
            "category_id": 2, "level": "L2", "type": "single", "score": 3,
        },
        {
            "title": "以下哪些属于提示词工程技术？（多选）",
            "options": ["A. Chain-of-Thought", "B. Zero-shot", "C. Few-shot", "D. Reinforcement Learning"],
            "correct_answer": ["A", "B", "C"],
            "category_id": 2, "level": "L2", "type": "multi", "score": 5,
        },
        {
            "title": "System Prompt用于定义AI的角色和行为边界。",
            "options": [],
            "correct_answer": True,
            "category_id": 2, "level": "L2", "type": "true_false", "score": 2,
        },
    ])

    # Category 5: 灵基Work模式
    questions.extend([
        {
            "title": "灵基Work模式的核心能力是什么？",
            "options": ["A. 聊天对话", "B. 任务承接、流程执行与Agent调度", "C. 代码编译", "D. 数据库管理"],
            "correct_answer": "B",
            "category_id": 5, "level": "L2", "type": "single", "score": 3,
        },
    ])

    # Category 7: Skill技能开发
    questions.extend([
        {
            "title": "MCP协议的全称是什么？",
            "options": ["A. Model Communication Protocol", "B. Model Context Protocol", "C. Machine Control Protocol", "D. Multi-Cloud Protocol"],
            "correct_answer": "B",
            "category_id": 7, "level": "L2", "type": "single", "score": 3,
        },
        {
            "title": "Skill技能的核心价值是什么？（多选）",
            "options": ["A. 业务能力封装", "B. 可复用沉淀", "C. 技能组合编排", "D. 替代所有开发工作"],
            "correct_answer": ["A", "B", "C"],
            "category_id": 7, "level": "L2", "type": "multi", "score": 5,
        },
    ])

    # Category 8: Agent智能体开发
    questions.extend([
        {
            "title": "Agent智能体区别于普通AI对话的核心特征是什么？",
            "options": ["A. 只能回答预设问题", "B. 具备自主决策和任务执行能力", "C. 不需要任何输入", "D. 仅用于文本生成"],
            "correct_answer": "B",
            "category_id": 8, "level": "L2", "type": "single", "score": 3,
        },
    ])

    # ---- L3 questions ----

    # Category 6: 灵基Build模式
    questions.extend([
        {
            "title": "灵基Build模式中，VibeCoding主要指什么？",
            "options": ["A. 传统手工编码", "B. 通过自然语言描述意图来生成应用", "C. 使用汇编语言编程", "D. 仅用于UI设计"],
            "correct_answer": "B",
            "category_id": 6, "level": "L3", "type": "single", "score": 4,
        },
    ])

    # Category 7: Skill技能开发 (L3)
    questions.extend([
        {
            "title": "在MCP业务技能封装中，以下哪些是必要的步骤？（多选）",
            "options": ["A. 定义工具的输入输出schema", "B. 实现业务逻辑处理函数", "C. 注册技能到MCP Server", "D. 编写完整的操作系统"],
            "correct_answer": ["A", "B", "C"],
            "category_id": 7, "level": "L3", "type": "multi", "score": 6,
        },
    ])

    # Category 8: Agent智能体开发 (L3)
    questions.extend([
        {
            "title": "Agent六维定义模型包含以下哪些维度？（多选）",
            "options": ["A. 角色与目标", "B. 知识与记忆", "C. 工具与技能", "D. 规划与推理", "E. 交互与协作", "F. 安全与治理"],
            "correct_answer": ["A", "B", "C", "D", "E", "F"],
            "category_id": 8, "level": "L3", "type": "multi", "score": 6,
        },
        {
            "title": "Agent生命周期管理中，编排（Orchestration）的主要目的是什么？",
            "options": ["A. 删除Agent", "B. 协调多个Agent协同完成复杂任务", "C. 重命名Agent", "D. 备份Agent数据"],
            "correct_answer": "B",
            "category_id": 8, "level": "L3", "type": "single", "score": 4,
        },
        {
            "title": "Agent编排中，所有Agent必须同时运行，不能有先后依赖关系。",
            "options": [],
            "correct_answer": False,
            "category_id": 8, "level": "L3", "type": "true_false", "score": 2,
        },
    ])

    # Category 9: AI治理与安全 (L3)
    questions.extend([
        {
            "title": "AI审计追踪的主要目的是什么？",
            "options": ["A. 提高AI运行速度", "B. 记录AI决策过程以便追溯和问责", "C. 减少AI模型大小", "D. 美化AI界面"],
            "correct_answer": "B",
            "category_id": 9, "level": "L3", "type": "single", "score": 4,
        },
        {
            "title": "以下哪些属于AI治理的关键要素？（多选）",
            "options": ["A. 权限控制", "B. 数据合规", "C. 责任链", "D. 审计追踪"],
            "correct_answer": ["A", "B", "C", "D"],
            "category_id": 9, "level": "L3", "type": "multi", "score": 6,
        },
    ])

    return questions


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
