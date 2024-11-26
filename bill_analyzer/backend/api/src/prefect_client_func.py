# Created by Metrum AI for Dell
"""
This module provides functions to interact with the Prefect server for managing
and monitoring flow runs related to legislative bill analysis.
"""

import os
from tempfile import NamedTemporaryFile

from auth.utils import read_config_vars

PREFECT_API_URL = os.getenv(
    "PREFECT_API_URL", "http://prefect-server:4200/api"
)
import requests


async def start_analysis_runs(client, bill, replicas):
    """Start analysis runs for a given bill with specified replicas."""
    contents = await bill.read()
    with NamedTemporaryFile(delete=False) as temp_file:
        temp_file.write(contents)
        temp_file_path = temp_file.name

    deployment_id = (
        await client.read_deployment_by_name("start/agent_run")
    ).id
    params = {"parameters": {"bill": temp_file_path, "replicas": replicas}}
    response = requests.post(
        f"{PREFECT_API_URL}/deployments/{deployment_id}/create_flow_run",
        json=params,
        timeout=10,
    )
    flow_run_id = response.json()["id"]

    while True:
        state = (
            requests.get(
                f"{PREFECT_API_URL}/flow_runs/{flow_run_id}",
                timeout=10,
            )
            .json()
            .get("state_type")
        )
        if state == "RUNNING":
            break

    return {"flow_run_id": flow_run_id, "state": state}


def fetch_replica_ids(flow_run_id):
    """Fetch replica IDs for a given flow run."""
    url = f"{PREFECT_API_URL}/flow_runs/{flow_run_id}/graph-v2"
    response = requests.get(url, timeout=10)
    data = response.json()
    root_node_ids = data.get("root_node_ids", [])
    flow_runs = {
        node_id: node_content
        for node_id, node_content in data.get("nodes", {})
        if node_id in root_node_ids and node_content.get("kind") == "flow-run"
    }
    return {f"replica_{i+1}": run_id for i, run_id in enumerate(flow_runs)}


def fetch_task_status(flow_run_id):
    """Fetch the status of tasks for a given flow run."""
    url = f"{PREFECT_API_URL}/flow_runs/{flow_run_id}/graph-v2"
    response = requests.get(url, timeout=10)
    data = response.json()
    task_runs = {
        node[1]["label"]: node[1]["state_type"]
        for node in data.get("nodes", {})
        if node[1].get("kind") == "task-run"
    }
    return task_runs


def fetch_artifact_data(key):
    """Fetch the latest artifact data for a given key."""
    url = f"{PREFECT_API_URL}/artifacts/{key}/latest"
    response = requests.get(url, timeout=10)
    data = response.json()
    return {
        key: {
            "data": data.get("data"),
            "description": data.get("description"),
        }
    }
