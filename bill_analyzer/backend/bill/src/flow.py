# Created by Metrum AI for Dell
"""Module for orchestrating bill analysis workflow using Prefect."""
from typing import Any, Dict, Tuple

from agents.ebi_agent import EBIAgent
from agents.lac_agent import LACAgent
from agents.sei_agent import SEIAgent
from generator import GENAgent
from langchain_openai import ChatOpenAI
from prefect import flow, task
from prefect.artifacts import create_markdown_artifact
from rag import get_bill, get_list
from utils import create_llm_model, read_config_vars


@task(name="Preprocessing")
def rag(bill: str, llm: Any = None) -> Tuple[str, str]:
    """Perform RAG preprocessing on bill text.

    Args:
        bill: Input bill text
        llm: Optional language model

    Returns:
        Tuple of processed bill text and context
    """
    return get_list(bill, llm)


@task(name="Legal and Compliance Agent")
def lac(bill: str, context: str, llm: Any = None) -> str:
    """Run Legal and Compliance analysis.

    Args:
        bill: Bill text
        context: Context from RAG
        llm: Optional language model

    Returns:
        Analysis report string
    """
    agent = LACAgent(llm)
    return agent.run(bill, context)


@task(name="Social and Environmental Impact Agent")
def sei(bill: str, context: str, llm: Any = None) -> str:
    """Run Social and Environmental Impact analysis.

    Args:
        bill: Bill text
        context: Context from RAG
        llm: Optional language model

    Returns:
        Analysis report string
    """
    agent = SEIAgent(llm)
    return agent.run(bill, context)


@task(name="Economic and Budgetary Impact Agent")
def eai(bill: str, context: str, llm: Any = None) -> str:
    """Run Economic and Budgetary Impact analysis.

    Args:
        bill: Bill text
        context: Context from RAG
        llm: Optional language model

    Returns:
        Analysis report string
    """
    agent = EBIAgent(llm)
    return agent.run(bill, context)


@task(name="Report Generation")
def report(bill: str, analysis: Dict[str, str], llm: Any = None) -> str:
    """Generate final analysis report.

    Args:
        bill: Bill text
        analysis: Dictionary of agent analysis reports
        llm: Optional language model

    Returns:
        Final report string
    """
    agent = GENAgent(llm)
    return agent.run(bill, analysis)


@flow
def agent_flow(bill_path: str, replica: int) -> str:
    """Main workflow for bill analysis.

    Args:
        bill_path: Path to bill file
        replica: Replica number for parallel runs

    Returns:
        Final analysis report
    """
    llm = create_llm_model()

    bill = get_bill(bill_path)
    rag_out = rag.submit(bill, llm)
    bill_str, context = rag_out.result()

    create_markdown_artifact(
        key=f"bill-{replica}",
        markdown="\n" + bill_str,
        description="Structured Bill",
    )

    lac_out = lac.submit(bill, context, llm, wait_for=[rag_out])
    create_markdown_artifact(
        key=f"legal-{replica}",
        markdown="\n\n" + lac_out.result(),
        description="Legal and Compliance Agent Report",
    )

    sei_out = sei.submit(bill_str, context, llm, wait_for=[lac_out])
    create_markdown_artifact(
        key=f"social-{replica}",
        markdown="\n\n" + sei_out.result(),
        description="Social and Environmental Impact Agent Report",
    )

    eai_out = eai.submit(bill_str, context, llm, wait_for=[rag_out])
    create_markdown_artifact(
        key=f"economic-{replica}",
        markdown="\n\n" + eai_out.result(),
        description="Economic and Budgetary Impact Agent Report",
    )

    analysis = {
        "Legal and Compliance Agent": lac_out.result(),
        "Social and Environmental Impact Agent": sei_out.result(),
        "Economic and Budgetary Impact Agent": eai_out.result(),
    }

    report_out = report.submit(bill_str, analysis, llm, wait_for=[eai_out])
    create_markdown_artifact(
        key=f"report-{replica}",
        markdown=report_out.result(),
        description="Report",
    )

    return report_out.result()
