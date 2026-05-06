from fastapi import APIRouter, HTTPException
from app.models.chat import QuestionRequest, AnswerResponse
from app.services.chat_service import answer_question

router = APIRouter()

@router.post("/ask", response_model=AnswerResponse)
async def ask_question(req: QuestionRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="问题不能为空")

    try:
        result = await answer_question(req.question)
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=503, detail=f"模型服务暂不可用: {str(e)}")
