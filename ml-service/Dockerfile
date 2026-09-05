FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for LightGBM
RUN apt-get update && apt-get install -y libgomp1 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# We assume train.py has already generated model.pkl, but in a real scenario we'd do it here or via volume
# For now, it will load if it exists

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
