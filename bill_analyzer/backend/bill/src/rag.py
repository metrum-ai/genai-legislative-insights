# Created by Metrum AI for Dell
"""RAG module for bill analysis and retrieval."""
import logging
from typing import List, Optional, Tuple

from langchain_community.document_loaders import PyPDFLoader
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_milvus import Milvus
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
from utils import create_llm_model, create_milvus_connection, read_config_vars


class Query(BaseModel):
    """Model for RAG query results."""

    id: List[str] = Field(..., description="List of bill section IDs")


RAG_PROMPT = """You are given a legislative bill, and your task is
to extract all section IDs from it. The section IDs in the bill are
codes ofpreviously passed bills that are all numerical decimal values.
It does not contain any alphabets. Your response should be a list of
all the ids in an attribute called 'id' present in the bill in the
order they appear.Ensure the list is clean and free of duplicates
or unnecessary text.
--------------------
BILL
{bill}
---------------------
"""

REDUCTION_PROMPT = """
Extract and structure the key points from the legislative bill. Focus on:

Title and Reference Number
Purpose of the Bill (brief summary)
Key Provisions (Extract all the available sections)
Affected Parties (who is impacted)
Penalties/Enforcement (if applicable)
Effective Date (when it starts)
Keep the output clear and organized in bullet points.
Ensure all the Sections is extracted.
--------------------------------
BILL
{bill}
"""

# Add logger configuration
logger = logging.getLogger(__name__)


def get_struct_bill(raw_bill: str, llm: Optional[ChatOpenAI] = None) -> str:
    """Structure bill content into organized format.

    Args:
        raw_bill: Raw bill text
        llm: Optional language model to use

    Returns:
        Structured bill content
    """
    model = llm if llm else create_llm_model()
    prompt = ChatPromptTemplate.from_messages([("human", REDUCTION_PROMPT)])
    chain = prompt | model
    response = chain.invoke({"bill": raw_bill})
    return response.content


def get_list(
    raw_bill: str, llm: Optional[ChatOpenAI] = None
) -> Tuple[str, List[str]]:
    """Extract section IDs and retrieve relevant context.

    Args:
        raw_bill: Bill text
        llm: Optional language model

    Returns:
        Tuple of structured bill and context list
    """
    model = llm if llm else create_llm_model()
    structured_bill = get_struct_bill(raw_bill, llm)
    parser = PydanticOutputParser(pydantic_object=Query)
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """Answer the user query. return the output only inside a
              JSON Format\n{format_instructions}\n.""",
            ),
            ("human", RAG_PROMPT),
        ]
    ).partial(format_instructions=parser.get_format_instructions())
    chain = prompt | model
    response = chain.invoke({"bill": structured_bill})
    try:
        response = parser.invoke(response.content)
        context = []
        vector_store = create_milvus_connection()
        ids = list(set(response.id))
    except (ValueError, TypeError) as error:
        logger.error(f"Error parsing response: {error}")
        ids = response.content.split(",")

    for id_val in ids:
        filter_expr = f'id like "{id_val}%"'
        results = vector_store.similarity_search(id_val, k=3, expr=filter_expr)
        context.extend(result.page_content for result in results)

    return structured_bill, context


def get_bill(file_path: Optional[str] = None) -> str:
    """Load and parse bill from PDF file.

    Args:
        file_path: Path to PDF file

    Returns:
        Bill text content
    """
    loader = PyPDFLoader(file_path)
    pages = list(loader.lazy_load())
    bill_text_content = "".join(page.page_content for page in pages)
    logger.info(f"Parsed the file successfully: {file_path}")
    return bill_text_content
