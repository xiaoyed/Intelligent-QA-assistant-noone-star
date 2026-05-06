import time
from app.services.retrieval_service import retrieve_chunks
from app.services.prompt_service import build_prompt
from app.services.validator import validate_response, try_extract_content
from app.db.kimi_client import generate_response, check_kimi_available
from app.models.chat import AnswerResponse, SourceInfo

async def answer_question(question: str) -> AnswerResponse:
    start_time = time.time()

    chunks = await retrieve_chunks(question)

    context = _build_context(chunks)

    prompt = build_prompt(context, question, use_cot=True)

    llm_available = await check_kimi_available()

    reasoning_steps = []
    if llm_available:
        raw_response = await generate_response(prompt)
        passed, _, parsed = validate_response(raw_response)

        if passed and parsed:
            answer = _format_answer(parsed)
            reasoning_steps = _extract_reasoning(parsed)
        else:
            answer = _fallback_answer(raw_response, chunks)
    else:
        answer = f"[Demo模式] 已从知识库检索到 {len(chunks)} 个相关规范片段：\n\n{context[:1000]}"

    elapsed_ms = (time.time() - start_time) * 1000

    sources = [
        SourceInfo(
            doc_name=c["doc_name"],
            chapter=c["chapter"],
            content_snippet=c["content"][:200],
            chunk_index=c["chunk_index"],
        )
        for c in chunks
    ]

    return AnswerResponse(
        question=question,
        answer=answer,
        sources=sources,
        reasoning_steps=reasoning_steps if reasoning_steps else None,
        response_time_ms=round(elapsed_ms, 1),
    )

def _build_context(chunks: list[dict]) -> str:
    parts = []
    for i, c in enumerate(chunks, 1):
        parts.append(
            f"[片段{i}] {c['doc_name']} | {c['chapter']}\n{c['content']}"
        )
    return "\n\n---\n\n".join(parts)

def _format_answer(parsed: dict) -> str:
    answer = parsed.get("答案", {})
    name = answer.get("参数名", "")
    value = answer.get("参数值", "")
    source = answer.get("出处", "")
    condition = answer.get("适用条件", "")

    if value == "未找到":
        return "根据已有的规范片段，未能提取到该参数的具体数值。建议检查是否已上传相关规范文档。"

    lines = []
    if name:
        lines.append(f"**{name}**")
    if value:
        lines.append(f"**{value}**")
    if condition:
        lines.append(f"\n\n适用条件：{condition}")
    if source:
        lines.append(f"\n\n> 📋 出处：{source}")
    return "\n".join(lines) if lines else str(answer)

def _extract_reasoning(parsed: dict) -> list[str]:
    steps = parsed.get("推理步骤", {})
    if not steps:
        return []

    ordered = ["步骤1_识别问题类型", "步骤2_定位相关章节", "步骤3_抽取参数"]

    result = []
    for key in ordered:
        if key in steps:
            label = key.replace("步骤1_", "① ").replace("步骤2_", "② ").replace("步骤3_", "③ ")
            result.append(f"**{label}**\n{steps[key]}")

    for key, val in steps.items():
        if key not in ordered:
            result.append(f"**{key}**\n{val}")

    return result

def _fallback_answer(raw_response: str, chunks: list[dict]) -> str:
    extracted = try_extract_content(raw_response)
    if extracted and len(extracted) > 10 and extracted != raw_response:
        return extracted

    if chunks:
        return (
            "根据以下规范原文供参考：\n\n"
            + "\n\n".join(f"> {c['content'][:300]}" for c in chunks[:3])
        )
    return "未能在知识库中找到相关信息，请确认已上传相关规范文档。"
