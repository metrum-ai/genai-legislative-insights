# Created by Metrum AI for Dell
"""Module for ingesting documents into Milvus vector store."""
import json
import logging
import time
from typing import Optional

from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_milvus import Milvus
from utils import read_config_vars

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CONFIG = read_config_vars(
    {
        "MILVUS_URI": "http://milvus:19530",
        "EMBEDDING_MODEL": "BAAI/bge-small-en-v1.5",
    }
)


try:
    EMBEDDINGS = HuggingFaceEmbeddings(model_name=CONFIG["EMBEDDING_MODEL"])
    MILVUS_URI = CONFIG["MILVUS_URI"]
except KeyError as error:
    logger.error(f"Missing required configuration: {str(error)}")
    raise
except Exception as error:
    logger.error(f"Error initializing embeddings: {str(error)}")
    raise


def create_milvus_connection(
    max_retries: int = 5, retry_delay: int = 5
) -> Optional[Milvus]:
    """Create Milvus connection with retry logic."""
    for attempt in range(max_retries):
        try:
            vector_store = Milvus(
                embedding_function=EMBEDDINGS,
                connection_args={"uri": MILVUS_URI},
            )
            return vector_store
        except Exception as error:
            logger.warning(
                f"Attempt {attempt + 1}/{max_retries} failed to connect to Milvus: {str(error)}"
            )
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
            else:
                logger.error("Failed to connect to Milvus after all attempts")
                raise RuntimeError(
                    "Failed to connect to Milvus after all attempts"
                )


vector_store = create_milvus_connection()


def flatten_list(nested_list):
    """Recursively flattens a nested list into a single list."""
    flattened = []
    for item in nested_list:
        if isinstance(item, list):
            flattened.extend(flatten_list(item))
        else:
            flattened.append(item)
    return flattened


def load_and_process_documents():
    """Load documents and split into texts with metadata."""

    with open("./data/HSC.json", "r", encoding="utf-8") as file:
        data = json.load(file)
        data = flatten_list(data)

    texts = []
    for i in data:
        doc_id = i["content"].split()[0].strip()[:-1]
        val = (
            i["content"]
            .replace("\\u00a0", " ")
            .replace("\\n", " ")
            .replace("\\u201d", " ")
        )
        texts.append(
            Document(
                page_content=f"{val}",
                metadata={"id": doc_id, "metadata": i["metadata"]},
            )
        )
    return texts


def ingest_documents():
    """Ingest documents into Milvus vector store."""
    texts = load_and_process_documents()
    logger.info("Starting document ingestion...")
    vector_store_saved = Milvus.from_documents(
        texts,
        EMBEDDINGS,
        collection_name="HSC",
        drop_old=True,
        connection_args={"uri": MILVUS_URI},
    )
    logger.info("Document ingestion completed successfully")
    return vector_store_saved


def search_documents(vector_store_saved, query_id):
    """Search for documents using similarity search."""
    retriever = vector_store_saved.as_retriever(
        search_type="similarity", search_kwargs={"k": 1}
    )
    filter_expr = f'id like "{query_id}%"'
    results = retriever.invoke(input=query_id, expr=filter_expr)
    return results


def main():
    """Main function to demonstrate document ingestion and search."""
    vector_store_saved = ingest_documents()
    query_id = "43013"
    results = search_documents(vector_store_saved, query_id)

    for result in results:
        logger.info(f"* {result.page_content} [{result.metadata}]")


if __name__ == "__main__":
    main()
