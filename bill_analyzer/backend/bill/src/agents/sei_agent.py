# Created by Metrum AI for Dell
"""Social and Environmental Impact Agent module for analyzing bill
    social and environmental impact."""
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

VULNERABLE_POPULATIONS_PROMPT = """Analyze the bill and identify how it
impacts vulnerable populations, including low-income families, minorities,
or other marginalized groups. Does the bill address social equity concerns
or create disparities? Use the given Context.
------------------------------------------------
BILL
{bill}
-----------------------------------------------
CONTEXT
{context}
---------------------------------------
Here is the Analysis in under 200 words:
"""

ENVIRONMENTAL_IMPACT_PROMPT = """Evaluate the bill's environmental impact.
Consider whether these vulnerable groups are disproportionately affected by
environmental policies.Does the bill promote sustainability, reduce pollution,
or protect natural resources? Use relevant environmental reports or data from
national/international sources to support your analysis.
Use the given Context if necessary.
------------------------------------------------
BILL
{bill}
-----------------------------------------------
CONTEXT
{context}
----------------------------------------
Here is the Analysis in under 200 words:
"""

SOCIAL_SERVICES_PROMPT = """Building on your analysis of the bill's impact on
vulnerable populations and the environment, assess how the bill affects social
services and community resources (e.g., healthcare, education, and welfare).
Consider how changes to social services might intersect with the environmental
and social equity impacts identified earlier.Will these services become more
accessible or restricted? Provide relevant data on current service usage and
access disparities to support your analysis.Use the given Context if necessary.
------------------------------------------------
BILL
{bill}
-----------------------------------------------
CONTEXT
{context}
----------------------------------------
Here is the Analysis in under 200 words:
"""

FINAL_RECOMMENDATION_PROMPT = """
As the Social and Environmental Impact Agent, provide a recommendation
(Approve, Amend, or Reject) based on your analysis and input from other
agents.Summarize key findings on the BILL's impact on vulnerable populations,
environmental, sustainability and social services from the ANALYSIS.
--------------------------------
BILL
{bill}
------------------------------------------
ANALYSIS
{p_a}
---------------------------------
Use this structure for the Markdown:
Social and Environmental Impact Agent Report
1. **Recommendation**: (Approve, Amend, or Reject)
2. **Key Findings**:
   - *Vulnerable Populations*:
   - *Environmental Sustainability*:
   - *Social Services*:
3. **Amendments (if any)**: Specify sections and reasons.

Here is the Final Summary in Markdown Format:
"""


class SEIAgent:
    """Social and Environmental Impact Agent for bill analysis."""

    def __init__(self, llm: Optional[ChatOpenAI] = None):
        """Initialize the agent.

        Args:
            llm: Optional language model to use
        """
        self.model = llm if llm else create_llm_model
        self.retriever = create_milvus_connection().as_retriever(
            search_type="similarity", search_kwargs={"k": 1}
        )
        self.agent = self._build_graph()
        self.logger = get_run_logger()

    def _build_graph(self) -> StateGraph:
        """Build the analysis workflow graph."""
        graph = StateGraph(OverallState)
        graph.add_node("s1", self._analyze_vulnerable_populations)
        graph.add_node("s2", self._analyze_environmental_impact)
        graph.add_node("s3", self._analyze_social_services)
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
        self.logger.info("Retrieved data from %s", logs)
        return [res.page_content for res in retrieved_data]

    def _analyze_vulnerable_populations(self, state: OverallState) -> dict:
        """Analyze impact on vulnerable populations."""
        chain = create_analysis_chain(
            self.model, VULNERABLE_POPULATIONS_PROMPT
        )
        context = self._get_context(VULNERABLE_POPULATIONS_PROMPT)
        response = chain.invoke(
            {"bill": state["bill"], "context": context + state["context"]}
        )
        return {"reviews": [response.content]}

    def _analyze_environmental_impact(self, state: OverallState) -> dict:
        """Analyze environmental impact."""
        chain = create_analysis_chain(self.model, ENVIRONMENTAL_IMPACT_PROMPT)
        context = self._get_context(ENVIRONMENTAL_IMPACT_PROMPT)
        response = chain.invoke(
            {"bill": state["bill"], "context": context + state["context"]}
        )
        return {"reviews": [response.content]}

    def _analyze_social_services(self, state: OverallState) -> dict:
        """Analyze impact on social services."""
        chain = create_analysis_chain(self.model, SOCIAL_SERVICES_PROMPT)
        context = self._get_context(SOCIAL_SERVICES_PROMPT)
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
