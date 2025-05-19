from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance
from typing import List
import os

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")

class VectorStore:
    def __init__(self):
        self.client = QdrantClient(url=QDRANT_URL)

    def create_collection(self, collection_name: str, vector_size: int = 768):
        if collection_name not in [c.name for c in self.client.get_collections().collections]:
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE)
            )

    def upsert_vectors(self, collection_name: str, vectors: List[List[float]], payloads: List[dict]):
        points = [PointStruct(id=i, vector=vec, payload=payloads[i]) for i, vec in enumerate(vectors)]
        self.client.upsert(collection_name=collection_name, points=points)

    def query(self, collection_name: str, query_vector: List[float], top_k: int = 5):
        results = self.client.search(collection_name=collection_name, query_vector=query_vector, limit=top_k)
        return results