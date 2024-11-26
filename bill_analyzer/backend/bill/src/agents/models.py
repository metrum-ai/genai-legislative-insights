import operator
from typing import Annotated, List, TypedDict

from pydantic import BaseModel, Field


class Analysis(BaseModel):
    """Analysis model for bill evaluation."""

    summary: str = Field(..., description="Overview of the bill's impact")
    detailed_finds: List[str] = Field(
        ..., description="List of detailed findings for the bill"
    )
    recommendation: str = Field(
        ..., description="Recommendations: Approve, Amend, or Reject"
    )


class LastAnalysis(BaseModel):
    """Final analysis model for bill evaluation."""

    summary: str = Field(..., description="Overview of the bill's impact")
    recommendation: str = Field(
        ..., description="Final recommendation: Approve, Amend, or Reject"
    )


class OverallState(TypedDict):
    """State type for the analysis workflow."""

    bill: str
    reviews: Annotated[List, operator.add]
    review: str
    context: str
