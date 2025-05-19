from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, BackgroundTasks
from pydantic import BaseModel
from qdrant_client.http import models as rest
from qdrant_client.http.models import PointIdsList  # Add this import
from typing import Optional, List
from fastapi_jwt_auth import AuthJWT
import uuid
from fastapi.middleware.cors import CORSMiddleware
from app.services.ingestion import IngestionService
from app.services.rag_agent import RAGAgent
from qdrant_client import QdrantClient
import logging
import os
import regex as re

class ChatRequest(BaseModel):
    product_id: str 
    question: str

class Settings(BaseModel):
    authjwt_secret_key: str = "super-secret-key"  # Change in production

class LoginRequest(BaseModel):
    username: str
    password: str

class ProductRequest(BaseModel):
    name: str
    description: Optional[str] = None
    metadata: dict = {}

class ProductCreate(BaseModel):
    name: str
    description: str

class Product(BaseModel):
    id: str
    name: str
    description: str

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
qdrant_client = QdrantClient(url=QDRANT_URL)
rag_agent = RAGAgent()
ingestion_service = IngestionService()


@app.get("/")
def read_root():
    return {"message": "AI Nanba backend is running"}

@app.post("/products", response_model=dict)
async def create_product(product: ProductCreate, Authorize: AuthJWT = Depends()):
    try:
        Authorize.jwt_required()
        
        # Create product point in Qdrant
        product_id = str(uuid.uuid4())
        point = rest.PointStruct(
            id=product_id,
            payload={
                "id": product_id,
                "name": product.name,
                "description": product.description
            },
            vector=[0.0] * 384  # Placeholder vector for product
        )
        
        qdrant_client.upsert(
            collection_name="products",
            points=[point]
        )
        
        return {
            "status": "success",
            "product": {
                "id": product_id,
                "name": product.name,
                "description": product.description
            }
        }
    except Exception as e:
        logging.error(f"Error creating product: {e}")
        raise HTTPException(status_code=500, detail="Error creating product")

@app.get("/products", response_model=dict)
async def get_products(Authorize: AuthJWT = Depends()):
    try:
        Authorize.jwt_required()
        
        response = qdrant_client.scroll(
            collection_name="products",
            limit=100,
            with_payload=True,
            with_vectors=False
        )
        
        products = [point.payload for point in response[0]]
        return {"products": products}
    except Exception as e:
        logging.error(f"Error fetching products: {e}")
        raise HTTPException(status_code=500, detail="Error fetching products")

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
        Authorize.jwt_required()
        print(f"Chat request: {request}")
        
        # Get product details to get the collection name
        response = qdrant_client.scroll(
            collection_name="products",
            limit=100,
            with_payload=True,
            with_vectors=False
        )
        products = [point.payload for point in response[0]]
        product = next((p for p in products if p["id"] == request.product_id), None)
        
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
            
        # Use sanitized product name as collection name
        collection_name = sanitize_collection_name(product["name"])
        
        answer = await rag_agent.answer_question(collection_name, request.question)
        return {"answer": answer}
    except Exception as e:
        logging.error(f"/chat error: {e}")
        raise HTTPException(status_code=500, detail="Error processing chat request.")

def sanitize_collection_name(name: str) -> str:
    # Convert to lowercase and replace spaces/special chars with underscore
    sanitized = re.sub(r'[^a-zA-Z0-9]', '_', name.lower())
    # Remove consecutive underscores
    sanitized = re.sub(r'_+', '_', sanitized)
    # Remove leading/trailing underscores
    return sanitized.strip('_')

@app.post("/ingest")
async def ingest(product_id: str, file: UploadFile = File(...), Authorize: AuthJWT = Depends(), background_tasks: BackgroundTasks = None):
    try:
        Authorize.jwt_required()
        
        # Get product details to get the collection name
        response = qdrant_client.scroll(
            collection_name="products",
            limit=100,
            with_payload=True,
            with_vectors=False
        )
        products = [point.payload for point in response[0]]
        product = next((p for p in products if p["id"] == product_id), None)
        
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
            
        # Use sanitized product name as collection name
        collection_name = sanitize_collection_name(product["name"])
        
        file_bytes = await file.read()
        filename = file.filename
        
        if background_tasks is not None:
            logging.info(f"Starting background ingestion for collection {collection_name}")
            background_tasks.add_task(ingestion_service.ingest, collection_name, filename, file_bytes)
        else:
            logging.info(f"Starting synchronous ingestion for collection {collection_name}")
            result = await ingestion_service.ingest_async(collection_name, filename, file_bytes)
            logging.info(f"Ingestion completed with {result} chunks processed")
            
        return {"status": f"Ingestion started for collection {collection_name}"}
    except Exception as e:
        logging.error(f"/ingest error: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing ingestion: {str(e)}")

@app.delete("/products/{product_id}")
async def delete_product(product_id: str, Authorize: AuthJWT = Depends()):
    try:
        Authorize.jwt_required()
        
        # Get product details to get the collection name
        response = qdrant_client.scroll(
            collection_name="products",
            limit=100,
            with_payload=True,
            with_vectors=False
        )
        products = [point.payload for point in response[0]]
        product = next((p for p in products if p["id"] == product_id), None)
        
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
            
        # Delete from products collection
        qdrant_client.delete(
            collection_name="products",
            points_selector=PointIdsList(points=[product_id])
        )
        
        # Delete the product's collection
        collection_name = product["name"].lower().replace(" ", "_")
        try:
            qdrant_client.delete_collection(collection_name=collection_name)
        except Exception as e:
            logging.error(f"Error deleting collection: {e}")
            # Continue even if collection deletion fails
            
        return {"status": "success", "message": "Product deleted successfully"}
    except Exception as e:
        logging.error(f"Error deleting product: {e}")
        raise HTTPException(status_code=500, detail="Error deleting product")
        