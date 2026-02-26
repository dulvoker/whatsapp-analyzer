from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from analytics import compute_analytics
from chat_parser import parse_chat

app = FastAPI(title="WhatsApp Analyzer", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "ok"}


@app.post("/upload")
async def upload_chat(file: UploadFile = File(...)):
    if not file.filename or not file.filename.endswith(".txt"):
        raise HTTPException(status_code=400, detail="Only .txt files are accepted")

    content_bytes = await file.read()

    try:
        content = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        try:
            content = content_bytes.decode("latin-1")
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="Could not decode file encoding")

    messages = parse_chat(content)
    if not messages:
        raise HTTPException(
            status_code=422,
            detail="No messages could be parsed. Make sure you uploaded a valid WhatsApp export .txt file.",
        )

    return compute_analytics(messages)
