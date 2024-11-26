# Created by Metrum AI for Dell
"""Legal and Compliance Agent module for analyzing bill legality and compliance."""
from typing import List, Optional

from langchain_core.prompts import ChatPromptTemplate
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_milvus import Milvus
from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph
from prefect.logging import get_run_logger
from pydantic import BaseModel, Field
from utils import (
    create_analysis_chain,
    create_llm_model,
    create_milvus_connection,
    read_config_vars,
)

from .models import Analysis, LastAnalysis, OverallState

CONSTITUTIONALITY_PROMPT = """Analyze whether the bill adheres to constitutional provisions.
Does the bill comply with national constitutional laws and rights?
Identify any sections that could potentially face constitutional challenges.
Provide relevant legal precedents or case law to support your analysis.
Use the given Context if necessary.
------------------------------------------------
BILL
{bill}
-----------------------------------------------
CONTEXT
{context}
"""

CONFLICTS_PROMPT = """Building on your analysis of the bill's constitutionality,
evaluate whether the bill conflicts with existing national or state laws.
Does the bill duplicate, contradict, or leave gaps in existing legislation?
If relevant, refer to past bills or laws that address similar areas.
Use the given Context if necessary.
------------------------------------------------
BILL
{bill}
-----------------------------------------------
CONTEXT
{context}
"""

ENFORCEABILITY_PROMPT = """Assess whether the bill's key terms are clearly defined
and consistent with legal standards. Evaluate the enforcement mechanisms: are they reasonable,
enforceable, and aligned with both constitutional principles and existing law?
Use the given Context if necessary.
------------------------------------------------
BILL
{bill}
-----------------------------------------------
CONTEXT
{context}
"""

FINAL_RECOMMENDATION_PROMPT = """
As the Legal and Compliance Agent, provide a recommendation (Approve, Amend, or Reject)
based on your analysis and input from other agents. Summarize key findings and amendments regarding the
BILL's constitutionality, conflicts with existing laws, and enforceability from the ANALYSIS.
--------------------------------
BILL
{bill}
------------------------------------------
ANALYSIS
{p_a}
---------------------------------
Use the following as the Markdown format:
Legal and Compliance Agent Report
1. **Recommendation**: (Approve, Amend, or Reject)
2. **Key Findings**:
   - *Constitutionality*:
   - *Conflicts with Existing Laws*:
   - *Enforceability*:
3. **Amendments (if any)**: Specify sections and reasons.

Here is the Final Summary in Markdown Format:
"""


class LACAgent:
    """Legal and Compliance Agent for bill analysis."""

    def __init__(self, llm: Optional[ChatOpenAI] = None):
        """Initialize the agent.

        Args:
            llm: Optional language model to use
        """
        self.model = llm if llm else create_llm_model()
        self.retriever = create_milvus_connection().as_retriever(
            search_type="similarity", search_kwargs={"k": 1}
        )
        self.agent = self._build_graph()
        self.logger = get_run_logger()

    def _build_graph(self) -> StateGraph:
        """Build the analysis workflow graph."""
        graph = StateGraph(OverallState)
        graph.add_node("s1", self._analyze_constitutionality)
        graph.add_node("s2", self._analyze_conflicts)
        graph.add_node("s3", self._analyze_enforceability)
        graph.add_node("s4", self._make_recommendation)
        graph.add_edge(START, "s1")
        graph.add_edge("s1", "s2")
        graph.add_edge("s2", "s3")
        graph.add_edge("s3", "s4")
        graph.add_edge("s4", END)
        return graph.compile()

    def _get_context(self, prompt: str) -> List[str]:
        """Get relevant context for analysis.

        Args:
            prompt: Prompt to retrieve context for

        Returns:
            List of relevant context strings
        """
        retrieved_data = self.retriever.invoke(prompt)
        logs = [res.metadata["metadata"] for res in retrieved_data]
        self.logger.info(f"Retrieved data from {logs}")
        return [res.page_content for res in retrieved_data]

    def _analyze_constitutionality(self, state: OverallState) -> dict:
        """Analyze constitutionality of the bill."""
        chain = create_analysis_chain(self.model, CONSTITUTIONALITY_PROMPT)
        context = self._get_context(CONSTITUTIONALITY_PROMPT)
        response = chain.invoke(
            {"bill": state["bill"], "context": context + state["context"]}
        )
        return {"reviews": [response.content]}

    def _analyze_conflicts(self, state: OverallState) -> dict:
        """Analyze conflicts with existing laws."""
        chain = create_analysis_chain(self.model, CONFLICTS_PROMPT)
        context = self._get_context(CONFLICTS_PROMPT)
        response = chain.invoke(
            {"bill": state["bill"], "context": context + state["context"]}
        )
        return {"reviews": [response.content]}

    def _analyze_enforceability(self, state: OverallState) -> dict:
        """Analyze enforceability of the bill."""
        chain = create_analysis_chain(self.model, ENFORCEABILITY_PROMPT)
        context = self._get_context(ENFORCEABILITY_PROMPT)
        response = chain.invoke(
            {"bill": state["bill"], "context": context + state["context"]}
        )
        return {"reviews": [response.content]}

    def _make_recommendation(self, state: OverallState) -> dict:
        """Make final recommendation based on analysis."""
        chain = create_analysis_chain(self.model, FINAL_RECOMMENDATION_PROMPT)
        response = chain.invoke(
            {"p_a": state["reviews"], "bill": state["bill"]}
        )
        return {"review": response.content}

    def run(self, bill: str, context: List[str]) -> str:
        """Run the full analysis workflow.

        Args:
            bill: Bill text to analyze
            context: List of context strings

        Returns:
            Final analysis report
        """
        analysis_result = self.agent.invoke({"bill": bill, "context": context})
        return analysis_result["review"]
