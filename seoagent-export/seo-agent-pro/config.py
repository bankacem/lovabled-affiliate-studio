import os

class Config:
    # نموذج Groq (Llama 3.1 70B هو الأقوى للمحتوى الطويل، ومجاني)
    GROQ_MODEL = os.getenv("GROQ_MODEL", "llama3-70b-8192")

    # حدود التقييم والمراجعة
    MAX_REVISIONS = 3          # أقصى عدد محاولات لإعادة الكتابة
    MIN_SCORE = 85             # الدرجة المطلوبة للموافقة النهائية

    # إعدادات البحث
    SEARCH_MAX_RESULTS = 5
    SEARCH_TIMEOUT = 15

    # المجلدات
    MEMORY_FILE = "memory/skills.md"
    OUTPUT_DIR = "outputs"
