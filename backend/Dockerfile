# Use official Python slim image
FROM python:3.11-slim

WORKDIR /app

# Copy and install backend dependencies
COPY requirement.txt .
RUN pip install --no-cache-dir -r requirement.txt

# Copy backend code
COPY . .

# Copy frontend into the container so Flask can serve it
COPY ../frontend ./frontend

EXPOSE 8080

CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "--timeout", "120", "app:app"]
