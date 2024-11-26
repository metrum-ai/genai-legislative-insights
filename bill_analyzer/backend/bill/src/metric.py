# Created by Metrum AI for Dell
"""Module for fetching and analyzing Prometheus metrics."""

import logging

import requests
from utils import read_config_vars

configs = read_config_vars(
    {
        "PROMETHEUS_URL": "http://prometheus:9090",
    }
)

logger = logging.getLogger(__name__)


def get_average_metric(query, start_time, end_time, step=60):
    """
    Fetches and calculates the average of a Prometheus metric over a specified time range.

    Parameters:
        query (str): The PromQL query to retrieve the metric.
        start_time (datetime): The start of the time range.
        end_time (datetime): The end of the time range.
        step (int): Step interval in seconds between data points (default is 60 seconds).

    Returns:
        float: The average value of the metric over the time range, or None if no data is available.
    """
    start_timestamp = start_time.timestamp()
    end_timestamp = end_time.timestamp()

    response = requests.get(
        f"{configs['PROMETHEUS_URL']}/api/v1/query_range",
        params={
            "query": query,
            "start": start_timestamp,
            "end": end_timestamp,
            "step": step,
        },
        timeout=10,
    )

    data = response.json()
    if data["status"] == "success":
        total = 0
        count = 0
        for result in data["data"]["result"]:
            values = result["values"]
            for _, value in values:
                total += float(value)
                count += 1
        average = total / count if count > 0 else None
        return average
    logger.error("Error querying Prometheus: %s", data)
    return None


def get_average_metrics(start_time, end_time):
    """Fetches average metrics for throughput, utilization, and power."""
    metrics = {
        "throughput": 'sum(vllm:avg_generation_throughput_toks_per_s{instance=~"vllm_serving_0:8000|vllm_serving_1:8000"})',
        "util": '100*(1-avg by(instance)(rate(node_cpu_seconds_total{mode="idle"}[20s])))',
        "power": "sum(socket_power)",
    }
    res = {}
    for key, value in metrics.items():
        res[key] = get_average_metric(value, start_time, end_time)
    return res
