FROM node:20-slim

# Install ffmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY worker/package*.json ./worker/
COPY package*.json ./

# Install dependencies
WORKDIR /app/worker
RUN npm ci --production

# Copy application code
WORKDIR /app
COPY worker ./worker

# Ensure models directory exists and has the ONNX model
RUN mkdir -p ./worker/models

# Run worker
WORKDIR /app/worker
CMD ["npm", "start"]

