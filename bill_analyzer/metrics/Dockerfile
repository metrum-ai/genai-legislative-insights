# Created by Metrum AI for Dell
FROM python:3.12.6-slim

USER root
WORKDIR /app
RUN apt-get update && apt-get install -y sudo

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/cpu_power.py .

ENTRYPOINT ["python3", "cpu_power.py"]
