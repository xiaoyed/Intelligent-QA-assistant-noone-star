import re
from app.config import settings

CHAPTER_PATTERN = re.compile(
    r'^(?:第[一二三四五六七八九十\d]+[章节条]|'
    r'(?:[1-9]\d*(?:\.\d+)*)\s+|'
    r'(?:[一二三四五六七八九十]+[、．.])|'
    r'附录[一二三四五六七八九十]|'
    r'[1-9]\d*\s*[\.、．](?:\s|$))'
)

def chunk_text(text: str, doc_id: str, doc_name: str) -> list[dict]:
    sections = _split_by_chapter(text)
    chunks = []

    for section_title, section_content in sections:
        if not section_content.strip():
            continue

        sub_chunks = _chunk_section(section_content, section_title)
        for sc in sub_chunks:
            chunks.append({
                "content": sc,
                "metadata": {
                    "doc_id": doc_id,
                    "doc_name": doc_name,
                    "chapter": section_title or "正文",
                    "chunk_index": len(chunks),
                },
            })

    return chunks

def _split_by_chapter(text: str) -> list[tuple[str, str]]:
    lines = text.split('\n')
    sections = []
    current_title = "正文"
    current_content: list[str] = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        if CHAPTER_PATTERN.match(stripped) and len(stripped) < 60:
            if current_content:
                sections.append((current_title, '\n'.join(current_content)))
            current_title = stripped
            current_content = []
        else:
            current_content.append(stripped)

    if current_content:
        sections.append((current_title, '\n'.join(current_content)))

    return sections

def _chunk_section(content: str, chapter: str) -> list[str]:
    target_chars = settings.chunk_size * 2
    overlap_chars = settings.chunk_overlap * 2

    if len(content) <= target_chars:
        return [content]

    chunks = []
    paragraphs = [p.strip() for p in content.split('\n') if p.strip()]
    current = ""
    current_len = 0

    for para in paragraphs:
        para_len = len(para)

        if current_len + para_len > target_chars and current:
            chunks.append(current)
            if current_len > overlap_chars:
                current = current[-overlap_chars:] + '\n' + para
                current_len = overlap_chars + para_len
            else:
                current = para
                current_len = para_len
        else:
            current = (current + '\n' + para) if current else para
            current_len = current_len + para_len

    if current:
        chunks.append(current)

    return chunks
