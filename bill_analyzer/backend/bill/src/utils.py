# Created by Metrum AI for Dell
""""Utility methods for the auth module"""

import logging
import os
import time
from typing import Optional

import requests
from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_milvus import Milvus
from requests.exceptions import RequestException

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def read_config_vars(
    default_configs: dict[str, str],
) -> dict[str, str]:
    """Read and set configurations based on set or default."""
    for var, default in default_configs.items():
        value = os.getenv(var, default)
        default_configs[var] = value
    return default_configs


def create_milvus_connection(
    max_retries: int = 5, retry_delay: int = 5
) -> Optional[Milvus]:
    """Create Milvus connection with retry logic."""

    configs = read_config_vars(
        {
            "MILVUS_URI": "http://milvus:19530",
            "EMBEDDING_MODEL": "BAAI/bge-small-en-v1.5",
        }
    )

    try:
        EMBEDDINGS = HuggingFaceEmbeddings(
            model_name=configs["EMBEDDING_MODEL"]
        )
        MILVUS_URI = configs["MILVUS_URI"]
    except KeyError as error:
        logger.error(f"Missing required configuration: {str(error)}")
        raise
    except (ValueError, OSError) as error:
        logger.error(f"Error initializing embeddings: {str(error)}")
        raise

    for attempt in range(max_retries):
        try:
            vector_store = Milvus(
                embedding_function=EMBEDDINGS,
                connection_args={"uri": MILVUS_URI},
                collection_name="HSC",
            )
            return vector_store
        except (ConnectionError, TimeoutError) as error:
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


def create_analysis_chain(model, prompt_template):
    """Create a chain for analysis with standard system message.

    Args:
        model: The language model to use
        prompt_template: The specific prompt template for this analysis

    Returns:
        The configured chain
    """
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are an Intelligent Assistant who follows instructions properly, "
                "Answer the User query in under 200 words",
            ),
            ("human", prompt_template),
        ]
    )
    return prompt | model


def create_llm_model() -> ChatOpenAI:
    """Create and return a ChatOpenAI model instance with standard configuration.

    Args:
        configs: Optional configuration dictionary. If None, will read from environment.

    Returns:
        Configured ChatOpenAI model instance

    Raises:
        ValueError: If required config values are missing or invalid
        ConnectionError: If unable to connect to LLM service
        AuthenticationError: If API key authentication fails
    """
    try:
        configs = read_config_vars(
            {
                "MODEL_NAME": "meta-llama/Llama-3.2-3B-Instruct",
                "API_KEY": None,
                "VLLM_URL": "http://nginx-proxy:8100/vllm/v1",
            }
        )

        if not configs["MODEL_NAME"]:
            raise ValueError("MODEL_NAME configuration is required")

        return ChatOpenAI(
            model_name=configs["MODEL_NAME"],
            api_key=configs["API_KEY"],
            base_url=configs["VLLM_URL"],
            temperature=0,
        )

    except KeyError as error:
        raise ValueError(f"Missing required configuration: {str(error)}")
    except requests.exceptions.ConnectionError as error:
        raise ConnectionError(
            f"Failed to connect to LLM service: {str(error)}"
        )
