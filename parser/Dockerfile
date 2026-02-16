FROM python:3.12-slim




COPY . /m1stery18/github.com/RelocatorEvents/parser/source
COPY requirements.txt .
WORKDIR /m1stery18/github.com/RelocatorEvents/parser/source


RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir -r requirements.txt


RUN python -m playwright install --with-deps


CMD ["python", "-u", "main.py"]