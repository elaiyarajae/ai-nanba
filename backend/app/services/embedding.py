from langchain_huggingface import HuggingFaceEmbeddings
from typing import List

class EmbeddingService:
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.embedder = HuggingFaceEmbeddings(model_name=model_name)

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        return self.embedder.embed_documents(texts) 