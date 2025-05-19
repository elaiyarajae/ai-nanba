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

    def ingest(self, collection_name: str, filename: str, file_bytes: bytes):
        try:
            # Create collection first to ensure it exists
            vector_size = 384  # Match the embedding model's dimension
            try:
                self.vector_store.create_collection(collection_name, vector_size)
                logger.info(f"Collection {collection_name} created or already exists")
            except Exception as e:
                logger.error(f"Failed to create collection {collection_name}: {e}")
                raise
        
            # Verify collection exists before proceeding
            collections = self.vector_store.client.get_collections().collections
            if not any(c.name == collection_name for c in collections):
                error_msg = f"Collection {collection_name} was not created successfully"
                logger.error(error_msg)
                raise Exception(error_msg)
        
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
            logger.info("Text extraction completed")
        
            # Chunk text
            splitter = RecursiveCharacterTextSplitter(chunk_size=self.chunk_size, chunk_overlap=self.chunk_overlap)
            chunks = splitter.split_text(text)
            logger.info(f"Text chunking completed. Total chunks: {len(chunks)}")
        
            if not chunks:
                logger.warning(f"No text chunks extracted from {filename}")
                return 0
        
            # Embed chunks
            vectors = self.embedding_service.embed_texts(chunks)
            if not vectors:
                logger.error("Failed to generate embeddings")
                return 0
        
            payloads = [{"text": chunk, "metadata": {"filename": filename}} for chunk in chunks]
            logger.info("Embeddings generated successfully")
        
            # Store vectors
            total_vectors = len(vectors)
            try:
                # Batch upsert vectors
                batch_size = 100
                for i in range(0, total_vectors, batch_size):
                    batch_vectors = vectors[i:i + batch_size]
                    batch_payloads = payloads[i:i + batch_size]
                    self.vector_store.upsert_vectors(collection_name, batch_vectors, batch_payloads)
                
                logger.info(f"Successfully ingested {total_vectors} vectors into collection {collection_name}")
            except Exception as e:
                logger.error(f"Vector storage error for collection {collection_name}: {e}")
                raise
        
            # Clean up temp file
            os.remove(tmp_path)
            return len(chunks)
        except Exception as e:
            logger.error(f"Ingestion error for collection {collection_name}: {e}")
            raise

    async def ingest_async(self, collection_name: str, filename: str, file_bytes: bytes):
        try:
            return await asyncio.to_thread(self.ingest, collection_name, filename, file_bytes)
        except Exception as e:
            logger.error(f"Async ingestion error for collection {collection_name}: {e}")
            raise