from app.prompts.cot_templates import COT_TEMPLATE, SYSTEM_PROMPT
from app.prompts.fewshot_templates import build_fewshot_prompt

CATEGORY_KEYWORDS = {
    "material_strength": ["强度", "等级", "标号", "混凝土", "钢筋", "钢材", "水泥", "抗压", "抗拉", "抗渗", "抗冻"],
    "geometric_dimension": ["尺寸", "距离", "间距", "宽度", "高度", "厚度", "直径", "长度", "偏差", "限界", "净空"],
    "load_combination": ["荷载", "组合", "分项系数", "恒载", "活载", "风载", "地震", "冲击"],
    "safety_factor": ["安全系数", "安全度", "可靠度", "分项系数", "承载力"],
    "deflection_limit": ["挠度", "变形", "位移", "沉降", "倾斜", "振动"],
    "crack_width": ["裂缝", "裂纹", "开裂", "宽度限值"],
    "bearing_capacity": ["承载力", "桩基", "地基", "基础", "持力层"],
    "seismic_design": ["抗震", "地震", "设防", "烈度", "反应谱"],
    "service_life": ["年限", "寿命", "使用年限", "设计年限", "耐久性"],
    "construction_requirement": ["构造", "配筋", "箍筋", "纵筋", "锚固", "搭接", "弯钩", "保护层"],
    "material_property": ["弹性模量", "泊松比", "密度", "容重", "膨胀", "收缩", "徐变"],
    "clearance_requirement": ["净空", "净高", "限界", "架空", "接触网", "建筑限界"],
}

def classify_question(question: str) -> str:
    scores = {}
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in question)
        if score > 0:
            scores[category] = score

    if not scores:
        return "material_strength"
    return max(scores, key=scores.get)

def build_prompt(context: str, question: str, use_cot: bool = True) -> str:
    if use_cot:
        return COT_TEMPLATE.format(
            system_prompt=SYSTEM_PROMPT,
            context=context,
            question=question,
        )

    category = classify_question(question)
    return build_fewshot_prompt(
        category=category,
        system_prompt=SYSTEM_PROMPT,
        context=context,
        question=question,
    )
