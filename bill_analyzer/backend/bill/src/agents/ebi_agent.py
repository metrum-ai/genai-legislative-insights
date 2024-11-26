# Created by Metrum AI for Dell
"""Economic and Budgetary Impact Agent for analyzing bill financial impacts."""
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

BUDGET_IMPACT_PROMPT = """Analyze the bill's impact on the national or state budget.
Estimate the cost of implementing the bill and identify whether it is fiscally responsible
given the current budget. Highlight whether the bill introduces new revenue streams,
increases expenditures, or reallocates existing funds. Use historical budget reports,
fiscal data, or expert projections to support your analysis. Use the given Context if necessary.
------------------------------------------------
BILL
{bill}
-----------------------------------------------
CONTEXT
{context}
"""

ECONOMIC_GROWTH_PROMPT = """Evaluate the potential effects of the bill on economic growth and
employment. Will the bill create jobs, boost industries, or drive economic activity in certain
sectors? Conversely, could it lead to job losses or negatively affect economic stability in any
sector? Use economic models, case studies from similar legislation, or data projections to inform
your analysis. Use the given Context if necessary.
------------------------------------------------
BILL
{bill}
-----------------------------------------------
CONTEXT
{context}
----------------------------------------
"""

FISCAL_SUSTAINABILITY_PROMPT = """Assess the bill's long-term fiscal sustainability.
Will the bill generate sufficient revenue or economic activity to offset its costs over time?
Does it create any long-term liabilities or risks to fiscal stability? Consider potential shifts
in the economy, inflation, or changes in public policy that could affect the bill's financial
outlook. Use the given Context if necessary.
------------------------------------------------
BILL
{bill}
-----------------------------------------------
CONTEXT
{context}
----------------------------------------
"""

FINAL_RECOMMENDATION_PROMPT = """
As the Economic and Budgetary Impact Agent, provide a recommendation (Approve, Amend, or Reject)
based on your analysis and input from other agents. Summarise key findings and amendments regarding
the BILL's budgetary impact, effect on economic growth and employment, and long-term fiscal
sustainability from the ANALYSIS.
--------------------------------
BILL
{bill}
------------------------------------------
ANALYSIS
{p_a}
---------------------------------
Use this structure for the Markdown format:
Economic and Budgetary Impact Agent Report
1. **Recommendation**: (Approve, Amend, or Reject)
2. **Key Findings**:
   - *Budgetary Impact*:
   - *Economic Growth and Employment*:
   - *Fiscal Sustainability*:
3. **Amendments (if any)**: Specify sections and reasons.

Here is the Final Summary in Markdown Format:
"""


class EBIAgent:
    """Economic and Budgetary Impact Agent for bill analysis."""

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
        graph.add_node("s1", self._analyze_budget_impact)
        graph.add_node("s2", self._analyze_economic_growth)
        graph.add_node("s3", self._analyze_fiscal_sustainability)
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

    def _analyze_budget_impact(self, state: OverallState) -> dict:
        """Analyze budget impact of the bill."""
        chain = create_analysis_chain(self.model, BUDGET_IMPACT_PROMPT)
        context = self._get_context(BUDGET_IMPACT_PROMPT)
        response = chain.invoke(
            {"bill": state["bill"], "context": context + state["context"]}
        )
        return {"reviews": [response.content]}

    def _analyze_economic_growth(self, state: OverallState) -> dict:
        """Analyze economic growth impact of the bill."""
        chain = create_analysis_chain(self.model, ECONOMIC_GROWTH_PROMPT)
        context = self._get_context(ECONOMIC_GROWTH_PROMPT)
        response = chain.invoke(
            {"bill": state["bill"], "context": context + state["context"]}
        )
        return {"reviews": [response.content]}

    def _analyze_fiscal_sustainability(self, state: OverallState) -> dict:
        """Analyze fiscal sustainability of the bill."""
        chain = create_analysis_chain(self.model, FISCAL_SUSTAINABILITY_PROMPT)
        context = self._get_context(FISCAL_SUSTAINABILITY_PROMPT)
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
