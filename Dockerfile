# Stage 1: Build Frontend
FROM node:20-slim AS build-frontend
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Serve with Backend
FROM python:3.11-slim
WORKDIR /app

# Install backend dependencies
COPY backend/requirement.txt .
RUN pip install --no-cache-dir -r requirement.txt

# Copy backend code
COPY backend/ ./

# Copy built frontend from Stage 1
COPY --from=build-frontend /frontend/dist ./frontend/dist

EXPOSE 8080

CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "--timeout", "120", "app:app"]
