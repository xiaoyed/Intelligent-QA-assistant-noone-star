FEWSHOT_TEMPLATES = {
    "material_strength": {
        "name": "材料强度类",
        "examples": [
            {
                "input": "高速铁路桥梁墩身混凝土最低强度等级是多少？",
                "output": '{"参数": "墩身混凝土强度等级", "值": "C40", "出处": "TB 10621-2014 第7.3.2条", "条件": "设计使用年限100年时不低于C45"}',
            },
            {
                "input": "隧道衬砌混凝土抗渗等级要求？",
                "output": '{"参数": "衬砌混凝土抗渗等级", "值": "P8", "出处": "TB 10003-2016 第9.2.4条", "条件": "地下水发育地段不低于P10"}',
            },
        ],
    },
    "geometric_dimension": {
        "name": "几何尺寸类",
        "examples": [
            {
                "input": "无砟轨道轨距允许偏差是多少？",
                "output": '{"参数": "轨距允许偏差", "值": "±1mm", "出处": "TB 10754-2018 第5.2.1条", "条件": "轨距变化率≤1/1500"}',
            },
            {
                "input": "隧道建筑限界最小宽度要求？",
                "output": '{"参数": "隧道建筑限界宽度", "值": "单线4.6m / 双线8.8m", "出处": "TB 10003-2016 第4.2.1条", "条件": "设计速度≤350km/h"}',
            },
        ],
    },
    "load_combination": {
        "name": "荷载组合类",
        "examples": [
            {
                "input": "桥梁主力组合荷载分项系数是多少？",
                "output": '{"参数": "主力组合荷载分项系数", "值": "恒载1.2/活载1.4", "出处": "TB 10002-2017 第4.3.1条", "条件": "极限状态设计法"}',
            },
        ],
    },
    "safety_factor": {
        "name": "安全系数类",
        "examples": [
            {
                "input": "抗弯承载力安全系数最低要求？",
                "output": '{"参数": "抗弯承载力安全系数", "值": "≥1.8", "出处": "TB 10002-2017 第6.2.5条", "条件": "正截面受弯构件"}',
            },
        ],
    },
    "deflection_limit": {
        "name": "挠度限值类",
        "examples": [
            {
                "input": "简支梁跨中最大挠度限值？",
                "output": '{"参数": "简支梁跨中挠度限值", "值": "L/800", "出处": "TB 10002-2017 第6.5.2条", "条件": "列车竖向静活载作用下"}',
            },
        ],
    },
    "crack_width": {
        "name": "裂缝宽度限值类",
        "examples": [
            {
                "input": "预应力混凝土梁裂缝宽度限值？",
                "output": '{"参数": "裂缝宽度限值", "值": "≤0.1mm", "出处": "TB 10002-2017 第6.3.4条", "条件": "一般大气环境"}',
            },
        ],
    },
    "bearing_capacity": {
        "name": "承载力要求类",
        "examples": [
            {
                "input": "桩基础单桩承载力特征值怎么确定？",
                "output": '{"参数": "单桩承载力特征值", "值": "取极限承载力/2", "出处": "TB 10093-2017 第5.3.1条", "条件": "试桩结果统计修正"}',
            },
        ],
    },
    "seismic_design": {
        "name": "抗震设计类",
        "examples": [
            {
                "input": "桥梁抗震设防类别划分标准？",
                "output": '{"参数": "抗震设防类别", "值": "A/B/C/D四类", "出处": "TB 10002-2017 第11.2.1条", "条件": "按线路等级和桥梁结构类型确定"}',
            },
        ],
    },
    "service_life": {
        "name": "使用年限类",
        "examples": [
            {
                "input": "桥梁支座设计使用年限要求？",
                "output": '{"参数": "支座设计使用年限", "值": "≥50年/高速≥100年", "出处": "TB 10091-2017 第10.1.3条", "条件": "可更换部件≥20年"}',
            },
        ],
    },
    "construction_requirement": {
        "name": "构造要求类",
        "examples": [
            {
                "input": "梁的箍筋间距可以放宽吗？",
                "output": '{"参数": "箍筋最大间距", "值": "≤200mm", "出处": "TB 10002-2017 第8.2.6条", "条件": "梁端加密区≤100mm"}',
            },
        ],
    },
    "material_property": {
        "name": "材料属性类",
        "examples": [
            {
                "input": "钢筋弹性模量取值标准？",
                "output": '{"参数": "钢筋弹性模量", "值": "200000MPa", "出处": "TB 10002-2017 第3.2.3条", "条件": "HRB400/HRB500钢筋"}',
            },
        ],
    },
    "clearance_requirement": {
        "name": "净空要求类",
        "examples": [
            {
                "input": "接触网导线距轨面最小高度？",
                "output": '{"参数": "接触网导线高度", "值": "≥5.7m", "出处": "TB 10009-2016 第6.2.3条", "条件": "区间正线"}',
            },
        ],
    },
}

def build_fewshot_prompt(category: str, system_prompt: str, context: str, question: str) -> str:
    template = FEWSHOT_TEMPLATES.get(category, FEWSHOT_TEMPLATES["material_strength"])
    examples_text = ""
    for i, ex in enumerate(template["examples"], 1):
        examples_text += f"\n示例{i}:\n问：{ex['input']}\n答：{ex['output']}\n"

    return f"""{system_prompt}

你是一位轨道交通工程规范专家，请参考以下示例格式回答问题。你的回答必须使用与示例完全一致的JSON格式。

{examples_text}
---
检索到的规范片段：
{context}

---
用户问题：{question}

请严格按照示例JSON格式输出答案，不要添加任何额外说明。"""
