from .vector_store import VectorStore
from .embedding import EmbeddingService
from langchain_community.document_loaders import TextLoader, PyPDFLoader, UnstructuredFileLoader, UnstructuredHTMLLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
import os
import tempfile
import logging
import asyncio
from fastapi import BackgroundTasks

logger = logging.getLogger(__name__)

class IngestionService:
    def __init__(self):
        self.vector_store = VectorStore()
        self.embedding_service = EmbeddingService()
        self.chunk_size = 500
        self.chunk_overlap = 50

    def ingest(self, customer_id: str, filename: str, file_bytes: bytes):
        try:
            suffix = os.path.splitext(filename)[-1].lower()
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                tmp.write(file_bytes)
                tmp_path = tmp.name

            # Load and extract text
            if suffix == ".pdf":
                loader = PyPDFLoader(tmp_path)
            elif suffix == ".docx":
                loader = UnstructuredFileLoader(tmp_path)
            elif suffix == ".html":
                loader = UnstructuredHTMLLoader(tmp_path)
            else:
                loader = TextLoader(tmp_path)
            docs = loader.load()
            text = "\n".join([doc.page_content for doc in docs])

            # Chunk text
            splitter = RecursiveCharacterTextSplitter(chunk_size=self.chunk_size, chunk_overlap=self.chunk_overlap)
            chunks = splitter.split_text(text)

            # Embed chunks
            vectors = self.embedding_service.embed_texts(chunks)
            payloads = [{"text": chunk} for chunk in chunks]

            # Ensure collection exists
            self.vector_store.create_collection(customer_id, vector_size=len(vectors[0]))
            # Upsert vectors
            self.vector_store.upsert_vectors(customer_id, vectors, payloads)

            # Clean up temp file
            os.remove(tmp_path)
            return len(chunks)
        except Exception as e:
            logger.error(f"Ingestion error: {e}")
            raise

    async def ingest_async(self, customer_id: str, filename: str, file_bytes: bytes):
        # Wrapper for async ingestion (calls the sync ingest method)
        return await asyncio.to_thread(self.ingest, customer_id, filename, file_bytes) 