import re
import json

def validate_response(raw_text: str) -> tuple[bool, str | None, dict | None]:
    json_str = _extract_json(raw_text)
    if json_str is None:
        return False, "输出格式不符合JSON结构", None

    try:
        parsed = json.loads(json_str)
    except json.JSONDecodeError as e:
        return False, f"JSON解析失败: {e}", None

    answer = parsed.get("答案", {})
    value = answer.get("参数值", "")

    if not value or value.strip() in ("", "未找到"):
        return True, None, parsed

    if not _has_valid_value(value):
        return False, f"参数值格式异常: {value}", None

    return True, None, parsed

def _has_valid_value(value: str) -> bool:
    return bool(re.search(r'[CPSFQHRB]?\d+', value))

def _extract_json(text: str) -> str | None:
    text = text.strip()

    match = re.search(r'```json\s*([\s\S]*?)\s*```', text)
    if match:
        return match.group(1)

    match = re.search(r'\{[\s\S]*\}', text)
    if match:
        return match.group(0)

    return None

def try_extract_content(raw_text: str) -> str:
    success, _, parsed = validate_response(raw_text)
    if success and parsed:
        answer = parsed.get("答案", {})
        value = answer.get("参数值", "")
        name = answer.get("参数名", "")
        source = answer.get("出处", "")

        parts = []
        if name:
            parts.append(f"**{name}**")
        if value:
            parts.append(value)
        if source:
            parts.append(f"（来源: {source}）")
        return " - ".join(parts) if parts else raw_text

    return raw_text
