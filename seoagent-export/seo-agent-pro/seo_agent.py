import os
import re
import time
import random
import json
from typing import TypedDict, Optional, Literal
from datetime import datetime

# المكتبات الأساسية
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage

# أدوات البحث
from duckduckgo_search import DDGS

# إعدادات المشروع
from config import Config

# ================================================
# 1. تهيئة النموذج (Groq مجاني)
# ================================================
llm = ChatGroq(
    model=Config.GROQ_MODEL,
    temperature=0.3,
    api_key=os.getenv("GROQ_API_KEY"),  # سيُقرأ من GitHub Secrets
    max_retries=2,
    timeout=60
)

# ================================================
# 2. أداة البحث (مع إعادة المحاولة التلقائية)
# ================================================
def search_web(query: str, max_results: int = Config.SEARCH_MAX_RESULTS) -> str:
    """بحث مجاني عبر DuckDuckGo مع آلية إعادة محاولة ذكية"""
    for attempt in range(3):
        try:
            # تأخير عشوائي لتجنب الحظر
            time.sleep(random.uniform(0.5, 1.5))

            with DDGS(timeout=Config.SEARCH_TIMEOUT) as ddgs:
                results = []
                for r in ddgs.text(query, max_results=max_results):
                    title = r.get('title', '').strip()
                    href = r.get('href', '')
                    body = r.get('body', '') or r.get('description', '')
                    if title and href:
                        results.append(f"• العنوان: {title}\n  الرابط: {href}\n  الملخص: {body[:300]}\n")

                if not results:
                    return "لم يتم العثور على نتائج لهذا البحث."

                # إضافة أسئلة "الناس يسألون"
                try:
                    answers = ddgs.answers(query)
                    if answers:
                        results.append(f"\n📌 أسئلة ذات صلة: {', '.join(answers[:5])}")
                except:
                    pass

                return "\n---\n".join(results)

        except Exception as e:
            if attempt == 2:
                return f"حدث خطأ في البحث بعد 3 محاولات: {str(e)}"
            time.sleep(2 ** attempt)  # تأخير تصاعدي

    return "تعذر إجراء البحث حالياً."

# ================================================
# 3. تعريف حالة الوكيل (AgentState)
# ================================================
class AgentState(TypedDict):
    keyword: str
    language: str
    research: str
    brief: str
    content: str
    optimized_content: str
    evaluation: str
    score: int
    revision_count: int
    final_output: str
    skills: str
    needs_human_review: bool
    human_feedback: Optional[str]

# ================================================
# 4. إدارة الذاكرة (التعلم المستمر)
# ================================================
def load_skills() -> str:
    os.makedirs(os.path.dirname(Config.MEMORY_FILE), exist_ok=True)
    if os.path.exists(Config.MEMORY_FILE):
        with open(Config.MEMORY_FILE, "r", encoding="utf-8") as f:
            return f.read()
    return "لا توجد مهارات سابقة. هذه هي الدورة الأولى."

def save_skills(content: str):
    os.makedirs(os.path.dirname(Config.MEMORY_FILE), exist_ok=True)
    with open(Config.MEMORY_FILE, "w", encoding="utf-8") as f:
        f.write(content)

# ================================================
# 5. العقد (Nodes) – قلب الوكيل
# ================================================

def research_node(state: AgentState) -> dict:
    print(f"🔍 [1/6] جاري البحث عن: {state['keyword']}")
    skills = load_skills()
    search_results = search_web(state['keyword'])

    prompt = f"""
أنت خبير أبحاث SEO محترف.
الكلمة المفتاحية: {state['keyword']}
اللغة المستهدفة: {state['language']}

نتائج البحث المباشر (من DuckDuckGo):
{search_results}

المهارات المستفادة سابقاً:
{skills}

مهمتك:
1. حدد نية البحث بدقة (معلومة، تنقل، شراء).
2. استخرج الكلمات المفتاحية الأساسية والثانوية (LSI).
3. حلل المنافسين: ما الذي يغطونه وما الذي يفتقدونه؟
4. استخرج أسئلة "الناس يسألون أيضاً".
5. اكتب تقريراً بحثياً منظماً باللغة المطلوبة.

التقرير باللغة: {state['language']}
"""
    response = llm.invoke([HumanMessage(content=prompt)])
    return {"research": response.content}

def strategy_node(state: AgentState) -> dict:
    print("📝 [2/6] إعداد الموجز الإستراتيجي...")
    skills = load_skills()
    prompt = f"""
أنت خبير استراتيجية محتوى SEO.
الكلمة: {state['keyword']}
اللغة: {state['language']}

تقرير البحث:
{state['research']}

المهارات السابقة:
{skills}

أعد موجزاً احترافياً كاملاً يشمل:
- عنوان SEO مقترح (جذاب ويحتوي على الكلمة الرئيسية).
- وصف ميتا (Meta Description) مقنع.
- النية الأساسية للمستخدم.
- مخطط تفصيلي للمقال (H1, H2, H3).
- الزاوية الفريدة (لماذا هذا المقال مختلف؟).
- متطلبات E-E-A-T (الخبرة، السلطة، الثقة).
- إرشادات الكتابة (الطول، النبرة، الجمهور المستهدف).

اكتب الموجز باللغة: {state['language']}
"""
    response = llm.invoke([HumanMessage(content=prompt)])
    return {"brief": response.content}

def content_node(state: AgentState) -> dict:
    print("✍️ [3/6] كتابة المسودة الأولى...")
    skills = load_skills()
    feedback = state.get("human_feedback") or "لا توجد ملاحظات بشرية حتى الآن."

    prompt = f"""
أنت كاتب محتوى SEO خبير.
اكتب مقالة كاملة وعالية الجودة بناءً على هذا الموجز:

{state['brief']}

الملاحظات البشرية (إن وجدت):
{feedback}

المهارات المستفادة سابقاً:
{skills}

القواعد الذهبية:
- أسلوب "الإجابة أولاً" (Answer-First): أجب عن السؤال الرئيسي في المقدمة.
- فقرات قصيرة وسهلة القراءة (2-3 جمل كحد أقصى).
- استخدم عناوين فرعية (H2, H3) لتقسيم المحتوى.
- عزز E-E-A-T بإضافة خبرات عملية وأمثلة.
- تجنب الحشو، ركز على القيمة المضافة.

اكتب المقالة كاملة باللغة: {state['language']}
"""
    response = llm.invoke([HumanMessage(content=prompt)])
    return {"content": response.content, "human_feedback": None}

def optimizer_node(state: AgentState) -> dict:
    print("⚙️ [4/6] تحسين المقالة لـ SEO و AI Overviews...")
    skills = load_skills()
    prompt = f"""
أنت خبير تحسين محركات البحث (SEO Optimizer).
حسّن هذه المقالة لتتصدر نتائج جوجل وظهور الذكاء الاصطناعي (AI Overviews):

المقالة الأصلية:
{state['content']}

المهارات السابقة:
{skills}

ركز على:
- تحسين العنوان ووصف الميتا (اجعلهما غنيين بالكلمات المفتاحية).
- إضافة إجابة مباشرة وواضحة في أول 100 كلمة.
- إعادة هيكلة العناوين (H1, H2, H3) لتكون منطقية.
- اقتراح روابط داخلية وخارجية (فكر فيها).
- اقتراح بنية Schema (مثلاً: FAQ أو HowTo).
- تحسين كثافة الكلمات المفتاحية (دون حشو).

أعد كتابة المقالة بشكل محسّن بالكامل باللغة: {state['language']}
"""
    response = llm.invoke([HumanMessage(content=prompt)])
    return {"optimized_content": response.content}

def evaluator_node(state: AgentState) -> dict:
    print(f"📊 [5/6] تقييم المحتوى (المحاولة {state.get('revision_count', 0)+1})...")
    prompt = f"""
أنت مقيم محتوى صارم وخبير SEO.

قيّم المقالة التالية من 100 درجة، بناءً على المعايير التالية:

المقالة:
{state['optimized_content']}

معايير التقييم:
1. تطابق نية البحث (Search Intent Match): 20 درجة.
2. أسلوب الإجابة أولاً والهيكل (Answer-First & Structure): 20 درجة.
3. جودة المحتوى ومصداقيته (E-E-A-T): 25 درجة.
4. جاهزية SEO وظهور الذكاء الاصطناعي (SEO & AI Ready): 20 درجة.
5. جودة اللغة وسلامتها: 15 درجة.

أخرج تقييمك بالصيغة التالية بالضبط:
---
الدرجة: XX/100

نقاط القوة:
- ...
- ...

نقاط الضعف:
- ...
- ...

القرار النهائي: (موافق عليه / يحتاج مراجعة)
---
"""
    response = llm.invoke([HumanMessage(content=prompt)])
    content = response.content

    # استخراج الدرجة
    score = 0
    match = re.search(r"الدرجة:\s*(\d+)", content)
    if not match:
        match = re.search(r"Score:\s*(\d+)", content)
    if match:
        score = int(match.group(1))

    # تحديد ما إذا كانت تحتاج مراجعة بشرية
    needs_human = score < Config.MIN_SCORE

    return {
        "evaluation": content,
        "score": score,
        "revision_count": state.get("revision_count", 0) + 1,
        "needs_human_review": needs_human
    }

def human_review_node(state: AgentState) -> dict:
    """
    في بيئة GitHub Actions (غير تفاعلية)، هذه العقدة لا توقف التنفيذ.
    بل تضيف تحذيراً في الملف النهائي وتكمل العملية،
    مع الاحتفاظ بعلامة للمراجعة البشرية لاحقاً.
    """
    print("🧑‍💻 [مراجعة بشرية] تم طلب المراجعة، لكن بما أننا في بيئة آلية، سنكمل مع وضع علامة للمراجعة.")

    # إضافة تحذير في بداية المحتوى
    warning = "\n\n⚠️ **تنبيه: هذه المقالة تحتاج إلى مراجعة بشرية قبل النشر النهائي.** ⚠️\n"
    if state["score"] < Config.MIN_SCORE:
        warning += f"الدرجة الحالية: {state['score']}/100 (الحد الأدنى المطلوب: {Config.MIN_SCORE})\n"
        warning += f"ملاحظات المقيم:\n{state['evaluation']}\n"

    optimized_content = warning + "\n---\n" + state["optimized_content"]

    return {
        "optimized_content": optimized_content,
        "needs_human_review": False,  # نمنع الحلقة من التكرار
        "human_feedback": "تمت المراجعة الآلية، يُنصح بمراجعة بشرية."
    }

def learning_node(state: AgentState) -> dict:
    print("🧠 [6/6] تحديث الذاكرة والتعلم من الدورة...")
    current_skills = load_skills()

    prompt = f"""
أنت وكيل التعلم والذاكرة.
حلل هذه الدورة بالكامل واستخلص الدروس المستفادة لتحديث وثيقة المهارات.

الكلمة المفتاحية: {state['keyword']}
الدرجة النهائية: {state['score']}/100
تقييم المقالة:
{state['evaluation']}

المهارات الحالية:
{current_skills}

أعد كتابة وثيقة المهارات كاملةً (مضمنة الدروس الجديدة).
ركز على:
- ما الذي نجح في هذه الدورة?
- ما الأخطاء التي حدثت وكيف نتجنبها؟
- نصائح محددة للدورات القادمة.
"""
    response = llm.invoke([HumanMessage(content=prompt)])
    new_skills = response.content
    save_skills(new_skills)

    # حفظ المقالة النهائية في ملف
    os.makedirs(Config.OUTPUT_DIR, exist_ok=True)
    safe_keyword = re.sub(r'[^\w\s-]', '', state['keyword']).strip().replace(' ', '_')
    filename = f"{safe_keyword}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
    filepath = os.path.join(Config.OUTPUT_DIR, filename)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(f"# {state['keyword']}\n\n")
        f.write(f"**التاريخ:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"**اللغة:** {state['language']}\n")
        f.write(f"**الدرجة النهائية:** {state['score']}/100\n\n")
        f.write("---\n\n")
        f.write(state["optimized_content"])
        f.write(f"\n\n---\n*تم إنشاؤه بواسطة SEOAgent Pro (Groq + LangGraph)*")

    print(f"✅ تم حفظ المقالة في: {filepath}")

    return {
        "skills": new_skills,
        "final_output": state["optimized_content"]
    }

# ================================================
# 6. دوال القرار (Routing)
# ================================================

def after_evaluator(state: AgentState) -> Literal["human_review", "learn", "revise"]:
    if state["score"] >= Config.MIN_SCORE:
        return "learn"  # نجاح
    if state["revision_count"] >= Config.MAX_REVISIONS:
        return "human_review"  # وصل للحد الأقصى من المحاولات
    return "revise"  # حاول مرة أخرى

def after_human(state: AgentState) -> Literal["content", "learn"]:
    # في البيئة الآلية، نذهب دائماً إلى learn بعد المراجعة
    return "learn"

# ================================================
# 7. بناء الرسم البياني (LangGraph)
# ================================================

def build_graph():
    workflow = StateGraph(AgentState)

    # إضافة العقد
    workflow.add_node("research", research_node)
    workflow.add_node("strategy", strategy_node)
    workflow.add_node("content", content_node)
    workflow.add_node("optimizer", optimizer_node)
    workflow.add_node("evaluator", evaluator_node)
    workflow.add_node("human_review", human_review_node)
    workflow.add_node("learning", learning_node)

    # التدفق الأساسي
    workflow.set_entry_point("research")
    workflow.add_edge("research", "strategy")
    workflow.add_edge("strategy", "content")
    workflow.add_edge("content", "optimizer")
    workflow.add_edge("optimizer", "evaluator")

    # التدفق الشرطي بعد التقييم
    workflow.add_conditional_edges(
        "evaluator",
        after_evaluator,
        {
            "revise": "content",       # عد للمحتوى لإعادة الكتابة
            "human_review": "human_review",  # تدخل بشري آلي
            "learn": "learning"        # انتهى بنجاح
        }
    )

    # بعد المراجعة البشرية (في البيئة الآلية، نذهب مباشرة للتعلم)
    workflow.add_conditional_edges(
        "human_review",
        after_human,
        {
            "content": "content",
            "learn": "learning"
        }
    )

    workflow.add_edge("learning", END)

    return workflow.compile()

# ================================================
# 8. دالة التشغيل الرئيسية
# ================================================

def run_agent(keyword: str, language: str = "Arabic"):
    print("="*60)
    print(f"🚀 تشغيل SEOAgent Pro (Groq + LangGraph)")
    print(f"📌 الكلمة: {keyword}")
    print(f"🌐 اللغة: {language}")
    print("="*60)

    app = build_graph()

    initial_state = {
        "keyword": keyword,
        "language": language,
        "research": "",
        "brief": "",
        "content": "",
        "optimized_content": "",
        "evaluation": "",
        "score": 0,
        "revision_count": 0,
        "final_output": "",
        "skills": load_skills(),
        "needs_human_review": False,
        "human_feedback": None
    }

    result = app.invoke(initial_state)

    print("\n" + "="*60)
    print("✅ تم الانتهاء بنجاح!")
    print(f"🏆 الدرجة النهائية: {result['score']}/100")
    print(f"📂 تم حفظ المقالة في مجلد: {Config.OUTPUT_DIR}")
    print("="*60)

    return result

# ================================================
# 9. نقطة الدخول (لتشغيل GitHub Actions أو تشغيل محلي)
# ================================================

if __name__ == "__main__":
    # قراءة المتغيرات من GitHub Actions
    keyword = os.getenv("INPUT_KEYWORD")
    language = os.getenv("INPUT_LANGUAGE", "Arabic")

    if not keyword:
        # للتشغيل المحلي الاختباري
        keyword = input("أدخل الكلمة المفتاحية: ").strip()
        language = input("أدخل اللغة (افتراضي Arabic): ").strip() or "Arabic"

    run_agent(keyword, language)
