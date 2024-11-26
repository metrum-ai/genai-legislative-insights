# Created by Metrum AI for Dell
import logging
import os
import re
import subprocess
import threading
import time

from fastapi import FastAPI, Response
from prometheus_client import Gauge, generate_latest, start_http_server

app = FastAPI()

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Define Prometheus metrics
power_gauge = Gauge("socket_power", "Power consumption in Watts", ["socket"])


def collect_power_metrics():
    # Change to the specified directory
    os.chdir(os.path.expanduser("~/esmi_ib_library/build"))

    while True:
        try:
            # Run the command and capture the output
            result = subprocess.run(
                ["sudo", "./e_smi_tool", "--showsockpower"],
                capture_output=True,
                text=True,
            )
            output = result.stdout
            # Split the output into lines
            lines = output.splitlines()

            # Check if the output has the expected header/footer
            if len(lines) < 6:
                logger.error(
                    "Unexpected output format. Output does not have enough lines."
                )
                continue

            # Regex to match power values for each socket
            power_regex = re.compile(
                r"^\| Power \(Watts\)\s+\| (.+?)\s+\| (.+?)\s+\|$"
            )
            limit_regex = re.compile(
                r"^\| PowerLimit \(Watts\)\s+\| (.+?)\s+\| (.+?)\s+\|$"
            )

            for line in lines:
                # Check for power values
                power_match = power_regex.match(line)
                if power_match:
                    socket_0_power = float(power_match.group(1).strip())
                    socket_1_power = float(power_match.group(2).strip())
                    power_gauge.labels(socket="0").set(socket_0_power)
                    power_gauge.labels(socket="1").set(socket_1_power)
                    continue

                # Check for power limit values (if needed)
                limit_match = limit_regex.match(line)
                if limit_match:
                    # You can process power limits here if needed
                    continue

        except Exception as error:
            logger.error(f"Error collecting power metrics: {error}")

        time.sleep(5)


@app.get("/metrics")
async def metrics():
    """Expose metrics to Prometheus."""
    return Response(content=generate_latest(), media_type="text/plain")


if __name__ == "__main__":
    # Start the metrics collection in a separate thread
    threading.Thread(target=collect_power_metrics, daemon=True).start()

    # Start the Prometheus metrics server
    start_http_server(10113)

    # Use uvicorn to run the FastAPI app
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=10112)
