# Created by Metrum AI for Dell
FROM python:3.12.6-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ .

ENTRYPOINT ["uvicorn", "api:app", "--port", "8003", "--host", "0.0.0.0"]
