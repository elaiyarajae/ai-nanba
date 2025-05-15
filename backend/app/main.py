from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.services.rag_agent import RAGAgent
from app.services.ingestion import IngestionService
import asyncio
from fastapi_jwt_auth import AuthJWT
import logging

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    customer_id: str
    question: str

class Settings(BaseModel):
    authjwt_secret_key: str = "super-secret-key"  # Change in production

class LoginRequest(BaseModel):
    username: str
    password: str

def get_settings():
    return Settings()

rag_agent = RAGAgent()
ingestion_service = IngestionService()

@app.get("/")
def read_root():
    return {"message": "AI Nanba backend is running"}

@app.post("/login")
def login(request: LoginRequest, Authorize: AuthJWT = Depends()):
    # Bypass authentication for development
    username = request.username
    password = request.password
    # Accept any credentials for now
    if username != "admin" or password != "password":
        raise HTTPException(status_code=401, detail="Bad username or password")
    access_token = Authorize.create_access_token(identity=username)
    return {"access_token": access_token}

@app.post("/chat")
async def chat(request: ChatRequest, Authorize: AuthJWT = Depends()):
    try:
        Authorize.jwt_required()  # Bypassed for development
        print(f"Chat request: {request}")
        answer = await rag_agent.answer_question(request.customer_id, request.question)
        return {"answer": answer}
    except Exception as e:
        logging.error(f"/chat error: {e}")
        raise HTTPException(status_code=500, detail="Error processing chat request.")

@app.post("/ingest")
async def ingest(customer_id: str, file: UploadFile = File(...), Authorize: AuthJWT = Depends(), background_tasks: BackgroundTasks = None):
    try:
        Authorize.jwt_required()  # Bypassed for development
        file_bytes = await file.read()  # Read file into memory
        filename = file.filename
        if background_tasks is not None:
            background_tasks.add_task(ingestion_service.ingest, customer_id, filename, file_bytes)
        else:
            ingestion_service.ingest(customer_id, filename, file_bytes)
        return {"status": f"Ingestion started for customer {customer_id}."}
    except Exception as e:
        logging.error(f"/ingest error: {e}")
        raise HTTPException(status_code=500, detail="Error processing ingestion.") 