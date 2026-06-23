FROM python:3.11-slim
WORKDIR /app
COPY requirements-prod.txt .
RUN pip install --no-cache-dir --default-timeout=300 --retries=5 -r requirements-prod.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
