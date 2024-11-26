# Legislative Bill Analysis

## Introduction
This demonstrates the capabilities of AMD CPUs in efficiently batch-processing documents for reviewing legislative draft bills. By leveraging agentic Retrieval-Augmented Generation (RAG), it employs specialized agents to provide a comprehensive evaluation of draft bills across critical dimensions:

1. **Legal and Compliance Agent**: Ensures legal conformity and highlights regulatory requirements.
2. **Social and Environmental Impact Agent**: Evaluates the societal and environmental consequences of proposed legislation.
3. **Economic and Budgetary Impact Agent**: Assesses fiscal viability and economic implications.

The insights from these agents are seamlessly integrated into a consolidated report, facilitating informed decision-making for policymakers. This approach not only enhances document review efficiency but also ensures a multi-faceted understanding of legislative drafts.

<img src="./assets/demo.gif" style="width:100%;max-width:800px;" alt="Demo">

## Architecture and Solution Flow
For Architecture and solution FLow - refer this
[Architecture and Solution Flow](./design/Architecture_Flow.md)


## Pre-requisites

### Software Requirements

Before we start, make sure you have the following software components setup on your Dell PowerEdge servers.

* Ubuntu version 24.04.1 LTS or higher
* Docker version 27.2.1 or higher

### Hardware Requirements

* AMD EPYC 5th Gen Processors

>
> This tool has been validated with following configuration:
>
> * Dell PowerEdge R7725 with  AMD EPYC 9755
> * Ubuntu version 24.04.1 LTS
> * Docker version 27.2.1

## Building CPU vLLM Image

The Legislative Bill Analysis utilizes vLLM serving. vLLM docker image needs to built with support to AMD EPYC CPUs .

1. Build the vLLM image.

    Follow the [vLLM | amd-installation with CPU](https://docs.vllm.ai/en/stable/getting_started/cpu-installation.html) page to build the image.

> [!NOTE]
> Tag the image with `vllm-cpu-env` as image name. If using any other docker image, update the [docker-compose.yaml](./bill_analyzer/docker-compose.yaml#L22) and [docker-compose.yaml](./bill_analyzer/docker-compose.yaml#L43) accordingly

> [!TIP]
> You can skip the below step if model is already available. and if not available update the `HF_TOKEN` in the  [./bill_analyzer/.env](./bill_analyzer/.env#L2) so that it gets downloaded when starting the application. This may slow down the application starting time.


2. Download the [Llama 3.2 3B Instruct LLM model](https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct) from HuggingFace.
    Provide your [HuggingFace token](https://huggingface.co/docs/hub/en/security-tokens) when prompted.

2. Update the `MODELS_MOUNT_PATH` variable in the [./bill_analyzer/.env](./bill_analyzer/.env#L3) file to reflect the location of the downloaded model.

    For instance, by default, models are downloaded to the local user's .cache directory. You can adjust the path to something like `/home/user/.cache/huggingface` as needed.

> [!NOTE]
> To know more about the configurations supports refer the [Setting up Environment Variables](#setting-up-environment-variables) section.


## Run Legislative Bill Analysis

> [!NOTE]
> Make sure all [Setup and Configurations](#setup-and-configurations) steps are completed.


1. Change directory to [bill_analyzer](./bill_analyzer/) folder.

    ```sh
    cd bill_analyzer
    ```

2. Build all the service under the Legislative Bill Analysis.

    ```sh
    sudo docker compose build
    ```

2. Once the build is completed, start the all services by running the below command

    ```sh
    sudo docker compose up -d
    ```

3. Make sure that all the services are running by checking the status.

    ```sh
    sudo docker compose ps -a
    ```

> [!NOTE]
> Refer back to the [Environment variables configurations](#setting-up-environment-variables) if you are facing issues running the solution.

## Legislative Bill Analysis Dashboard

Navigate to [localhost:8100](http://localhost:8100/) to open the Legislative Bill Analysis Dashboard on browser.

The below section provides more insights into the Legislative Bill Analysis Dashboard.

### Multi-Agent Framework

- **Legal and Compliance Agent**: Evaluates legal conformity and identifies regulatory requirements.
- **Social and Environmental Impact Agent**: Assesses the broader social and environmental consequences.
- **Economic and Budgetary Impact Agent**: Analyzes economic feasibility and fiscal implications.
- **Report Generation**: Combines all analyses into a summarized report.

### Input Management

- Upload legislative bills using the "Choose File" option (supports single upload).
- Adjust the number of documents to process concurrently using the slider.
- Click "Submit Job" to start the multi-agent analysis pipeline.

### System Overview

The system is built on robust infrastructure, ensuring efficient processing and analysis of legislative bills. It leverages advanced machine learning models to deliver high performance and reliability.

### Real-Time Metrics Panel

  - **Throughput/User**: Tokens processed per second per user.
  - **Overall Throughput**: Aggregate tokens processed across all users.
  - **CPU Utilization**: Displays system CPU usage.
  - **Memory Utilization**: Shows the percentage of memory used.
  - **Power Consumption**: Provides insights into energy usage.

### Real Time Report

- **Recommendation**: Approve, Amend, or Reject based on the analysis of legal, social, environmental, and economic aspects.
- **Key Findings**: The bill meets legal requirements, has positive social and environmental impacts, and is economically feasible.
- **Amendments**: Specify sections and reasons for any necessary changes to enhance clarity, budgetary provisions, or legal enforceability.

### Final Report Summary

 Provides a detailed overview of the legislative bill covering legal, social, environmental, and economic aspects.

- **Introduction**: Summarizes the bill's purpose, key objectives, scope, and public relevance.
- **Legal and Compliance**: Highlights legal issues, enforceability, and any conflicts. States the agent's recommendation and key amendments.
- **Social and Environmental**: Summarizes the bill's societal and environmental impacts, benefits and recommendations. States the agent's recommendation.
- **Economic and Budgetary**: Summarizes budgetary feasibility, economic growth, job impact, and agent's recommendation. States the agent's recommendation.
- **Synthesis**: Cross-references and reconciles findings, noting any conflicts and alignment across agents.
- **Final Recommendation**: Provides a unified recommendation based on the findings and suggests necessary amendments.
- **Conclusion**: Reflects on the bill's overall potential, considering legal, social, environmental, and economic aspects.

### Throughput Calculation

- The LLM throughput is calculated by dividing the total number of tokens generated in a 5-second window by 5, providing real-time monitoring of system output.


## Setting up Environment Variables

To know more about the configurations available under the [.env](./bill_analyzer/.env) configuration file, refer the below table.

| Variable Name          | Value                                   | Description                         |
|------------------------|-----------------------------------------|-------------------------------------|
| `MODEL_NAME`      | `meta-llama/Llama-3.2-3B-Instruct` | Model name for vLLM                 |
| `HF_TOKEN`             | Refer [HuggingFace User Access Tokens](https://huggingface.co/docs/hub/en/security-tokens). | Token for Hugging Face API access  |
| `MODELS_MOUNT_PATH`    | Refer [step 2](#building-cpu-vllm-image) of Building vLLM CPU Image.  | HuggingFace models download path.                           | Path for mounting models            |
| `MILVUS_URI` | `http://milvus:19530` | URI for connecting to the Milvus vector database |
| `PROMETHEUS_URL` |  `http://prometheus:9090` | URL for accessing Prometheus metrics. |
| `EMBEDDING_MODEL` |  `BAAI/bge-small-en-v1.5` | Name of the embedding model used for text processing. |
| `VLLM_URL`  |  `http://nginx-proxy:8100/vllm/v1`  | URL for accessing the vLLM service. |
|  `API_KEY`   | `your-api-key-here` |  API key For vLLM |
| `MINIO_ACCESS_KEY` | `minioadmin` | Access key for MinIO, a high-performance object storage system. |
| `MINIO_SECRET_KEY` | `minioadmin`  | Secret key for MinIO, used in conjunction with the access key for authentication. |

## Troubleshooting

Please be aware that after deployment, the service may take several minutes to fully start. During this initialization period, you might encounter:

* **Partially Functional Webpage**: The webpage may not fully load or display all components correctly.
* **Temporary Errors**: Error messages or notices might appear.

These issues are expected and should resolve automatically as the service completes its startup process.

If problems persist beyond the expected startup time,

1. Check the service logs for any errors or misconfigurations.
2. Stop all the services by following [Terminating Legislative Bill Analysis](#terminating-legislative-bill-analysis) section and follow the setup steps again.

## Terminating Legislative Bill Analysis

Follow the below steps to completely terminate the Legislative Bill Analysis solution services.

1. Change directory to [bill_analyzer](./bill_analyzer/) folder.
2. Use docker compose to stop all the services

    ```sh
    sudo docker compose down -v
    ```

3. Make sure that all containers are stopped.

    ```sh
    sudo docker compose ps -a
    ```

    The above command should return an empty list.
