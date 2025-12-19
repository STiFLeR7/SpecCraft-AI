from sentence_transformers import SentenceTransformer
import logging

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.model_name = model_name
        self._model = None

    @property
    def model(self):
        if self._model is None:
            logger.info(f"Loading embedding model: {self.model_name}")
            self._model = SentenceTransformer(self.model_name)
        return self._model

    def embed_text(self, text: str):
        """
        Embeds a single string (chunk).
        """
        return self.model.encode(text).tolist()

    def embed_batch(self, texts: list[str]):
        return self.model.encode(texts).tolist()

embedding_service = EmbeddingService()
