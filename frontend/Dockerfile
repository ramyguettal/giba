# Development image for the Next.js frontend.
# docker-compose mounts ./frontend over /app and keeps node_modules in an
# anonymous volume, so dependencies installed here persist across runs.
FROM node:22-alpine

WORKDIR /app

# Install dependencies first to leverage Docker layer caching.
COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
