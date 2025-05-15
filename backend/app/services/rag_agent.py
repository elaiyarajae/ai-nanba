from .vector_store import VectorStore
from .embedding import EmbeddingService
from .llm_client import LLMClient

class RAGAgent:
    def __init__(self):
        self.vector_store = VectorStore()
        self.embedding_service = EmbeddingService()
        self.llm_client = LLMClient()

    async def answer_question(self, customer_id: str, question: str, top_k: int = 5) -> str:
        # Embed the question
        question_vec = self.embedding_service.embed_texts([question])[0]
        # Query Qdrant for top-K relevant chunks
        results = self.vector_store.query(collection_name=customer_id, query_vector=question_vec, top_k=top_k)
        # Combine retrieved chunks as context
        context = "\n".join([hit.payload.get("text", "") for hit in results])
        # Create prompt
        prompt = f"Context:\n{context}\n\nQuestion: {question}\nAnswer:"
        # Call LLM
        answer = await self.llm_client.generate(prompt)
        return answer 