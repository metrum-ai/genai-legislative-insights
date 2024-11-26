# Created by Metrum AI for Dell
"""Generator Agent module for synthesizing analysis reports."""
from typing import TypedDict

from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph
from utils import create_llm_model, read_config_vars

SYNTHESIS_PROMPT = """Synthesize the findings from three agents—Legal and Compliance Agent,
Social and Environmental Impact Agent, and
Economic and Budgetary Impact Agent—into a final bill analysis report.
-------------------------
ANALYSIS FROM AGENTS
{analysis}
-------------------------
BILL
{bill}
-------------------------

Structured Output:
Introduction: Summarize the bill's purpose, key objectives, scope, and public relevance.
Legal and Compliance: Highlight legal issues, enforceability, and any conflicts. State the agent's recommendation (Approve, Amend, or Reject) and key amendments.
Social and Environmental: Summarize the bill's societal and environmental impacts, benefits, challenges, and recommendations.State the agent's recommendation (Approve, Amend, or Reject).
Economic and Budgetary: Summarize budgetary feasibility, economic growth, job impact, and agent's recommendation. State the agent's recommendation (Approve, Amend, or Reject).
Synthesis: Cross-reference and reconcile findings, noting any conflicts and alignment across agents.
Final Recommendation: Provide a unified recommendation based on the findings and suggest necessary amendments.
Conclusion: Reflect on the bill's overall potential, considering legal, social, environmental, and economic aspects.

Here is the Final Report in Markdown Format:
"""


class OverallState(TypedDict):
    """State type for the generator workflow."""

    bill: str
    analysis: str
    output: str


class GENAgent:
    """Generator agent for synthesizing analysis reports."""

    def __init__(self, llm=None):
        """Initialize the generator agent.
        Args:
            llm: Optional language model to use
        """
        self.model = llm if llm else create_llm_model()
        graph = StateGraph(OverallState)
        graph.add_node("synthesis", self._synthesize)
        graph.add_edge(START, "synthesis")
        graph.add_edge("synthesis", END)
        self.agent = graph.compile()

    def _synthesize(self, state: OverallState) -> dict:
        """Synthesize the analysis reports.

        Args:
            state: Current workflow state

        Returns:
            Dict containing synthesized output
        """
        prompt = ChatPromptTemplate.from_messages(
            [("human", SYNTHESIS_PROMPT)]
        )
        chain = prompt | self.model
        response = chain.invoke(
            {"bill": state["bill"], "analysis": state["analysis"]}
        )
        return {"output": response.content}

    def run(self, bill: str, analysis: str) -> str:
        """Run the generator workflow.

        Args:
            bill: Bill text
            analysis: Combined analysis from other agents

        Returns:
            Synthesized analysis report
        """
        analysis_result = self.agent.invoke(
            {"bill": bill, "analysis": analysis}
        )
        return analysis_result["output"]
