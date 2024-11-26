# Created by Metrum AI for Dell
"""Module for serving the bill analysis workflow with parallel processing."""
from datetime import datetime, timedelta

from flow import agent_flow
from metric import get_average_metrics
from prefect import flow, task
from prefect.futures import wait
from prefect.logging import get_run_logger
from prefect_dask.task_runners import DaskTaskRunner


@task(name="Agent Analysis")
def agent_call(bill: str, replica: int) -> str:
    """Run agent analysis workflow for a single replica.

    Args:
        bill: Path to bill file
        replica: Replica number for parallel run

    Returns:
        Analysis report string
    """
    result = agent_flow(bill, replica)
    return result


@flow(task_runner=DaskTaskRunner)
def start(bill: str, replicas: int) -> None:
    """Start parallel bill analysis workflow.

    Args:
        bill: Path to bill file
        replicas: Number of parallel replicas to run
    """
    start_time = datetime.now() + timedelta(0, 30)
    results = []
    for replica in range(replicas):
        results.append(agent_call.submit(bill, replica + 1))
    wait(results)
    end_time = datetime.now() - timedelta(0, 10)
    res = get_average_metrics(start_time, end_time)
    logger = get_run_logger()
    out = f"Flow completed. Throughput: {res['throughput']}, CPU Utilization: {res['util']}, CPU Power in Watts: {res['power']}"
    logger.info(out)


if __name__ == "__main__":
    start.serve(name="agent_run")
