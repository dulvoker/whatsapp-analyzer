from fastapi import FastAPI

app = FastAPI(title="WhatsApp Analyzer", version="1.0.0")


@app.get("/")
def root():
    return {"status": "ok"}