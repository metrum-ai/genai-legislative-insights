# Created by Metrum AI for Dell
FROM python:3.12.7
ENV PYTHONUNBUFFERED=1 \
    PYTHONPYCACHEPREFIX=/tmp/pycache
WORKDIR /app
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ .

ENTRYPOINT ["python3", "serve.py"]
